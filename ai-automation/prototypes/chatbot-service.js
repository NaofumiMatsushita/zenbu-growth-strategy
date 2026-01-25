/**
 * ZENBU AI Chatbot Service
 * GPT-4を使用した自動応答チャットボット
 *
 * 機能:
 * - 顧客の症状ヒアリング
 * - AI診断への橋渡し
 * - 見積もり提示
 * - 予約への誘導
 */

const express = require('express');
const { OpenAI } = require('openai');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());

/**
 * システムプロンプト
 * GPT-4に騒音トラブル対応のエキスパートとして振る舞わせる
 */
const SYSTEM_PROMPT = `あなたはZENBU株式会社の騒音トラブル解決AIアシスタントです。

【役割】
- 顧客の騒音トラブルについて親身にヒアリング
- 適切な質問で詳細情報を引き出す
- 専門的かつ分かりやすい説明を提供
- 最終的に現地調査の予約へ誘導

【ヒアリング項目】
1. 騒音の種類（足音/楽器/話し声/設備音など）
2. 発生時間帯（昼間/夜間/深夜）
3. 継続期間（いつから始まったか）
4. 頻度（毎日/週末のみ/不定期）
5. 騒音源（上階/隣室/外部）
6. 管理会社への相談状況
7. 生活への影響度

【対応方針】
- 共感的で親身な対応
- 専門用語は避け、分かりやすく説明
- 環境基準（昼55dB/夜45dB）を参考情報として提示
- 法的アドバイスはせず、測定の重要性を説明
- 3-5往復の会話で必要情報を収集
- 最後に無料現地調査を提案

【禁止事項】
- 法的アドバイス（弁護士の業務範囲）
- 相手住民への直接対峙を勧める
- 過度な期待を持たせる
- 個人情報を不必要に聞き出す`;

/**
 * 会話履歴を含めたGPT-4リクエスト構築
 */
async function buildChatMessages(sessionId, userMessage) {
  // セッションの会話履歴を取得
  const history = await prisma.chatHistory.findMany({
    where: { session_id: sessionId },
    orderBy: { timestamp: 'asc' },
    take: 20 // 直近20件まで
  });

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  // 履歴を追加
  history.forEach(msg => {
    messages.push({
      role: msg.message_type === 'user' ? 'user' : 'assistant',
      content: msg.message_text
    });
  });

  // 新しいユーザーメッセージを追加
  messages.push({
    role: 'user',
    content: userMessage
  });

  return messages;
}

/**
 * 症状キーワード抽出
 * GPT-4の回答から構造化データを抽出
 */
function extractSymptoms(conversation) {
  const symptoms = {
    noise_type: null,
    time_of_day: null,
    duration_weeks: null,
    frequency: null,
    source_location: null,
    impact_level: null
  };

  const fullText = conversation.join(' ').toLowerCase();

  // 騒音タイプ検出
  if (fullText.match(/足音|歩く音|ドスドス/)) symptoms.noise_type = 'footsteps';
  else if (fullText.match(/ピアノ|ギター|楽器|音楽/)) symptoms.noise_type = 'music';
  else if (fullText.match(/話し声|叫び声|声/)) symptoms.noise_type = 'voice';
  else if (fullText.match(/洗濯機|掃除機|家電/)) symptoms.noise_type = 'appliance';
  else if (fullText.match(/工事|ドリル|ハンマー/)) symptoms.noise_type = 'construction';

  // 時間帯検出
  if (fullText.match(/夜|深夜|23時|11時|12時|1時|2時/)) symptoms.time_of_day = 'night';
  else if (fullText.match(/朝|早朝|6時|7時|8時/)) symptoms.time_of_day = 'morning';
  else if (fullText.match(/昼|日中|午後/)) symptoms.time_of_day = 'day';

  // 継続期間検出
  const durationMatch = fullText.match(/(\d+)(週間|ヶ月|年)/);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2];
    if (unit === '週間') symptoms.duration_weeks = value;
    else if (unit === 'ヶ月') symptoms.duration_weeks = value * 4;
    else if (unit === '年') symptoms.duration_weeks = value * 52;
  }

  // 発生源検出
  if (fullText.match(/上|上階|上の階/)) symptoms.source_location = 'upstairs';
  else if (fullText.match(/隣|となり|横/)) symptoms.source_location = 'next_door';
  else if (fullText.match(/下|下階/)) symptoms.source_location = 'downstairs';

  return symptoms;
}

/**
 * 会話の進捗度を判定
 * 十分な情報が集まったかチェック
 */
function assessReadiness(symptoms) {
  const requiredFields = ['noise_type', 'time_of_day', 'source_location'];
  const filledFields = requiredFields.filter(field => symptoms[field] !== null);

  return {
    ready: filledFields.length >= 2, // 2つ以上の情報があれば見積可能
    completeness: filledFields.length / requiredFields.length,
    missing_fields: requiredFields.filter(field => symptoms[field] === null)
  };
}

/**
 * チャットメッセージエンドポイント
 */
app.post('/api/v1/chat/message', async (req, res) => {
  try {
    const { session_id, message, customer_id } = req.body;

    if (!session_id || !message) {
      return res.status(400).json({
        error: 'session_id and message are required'
      });
    }

    // ユーザーメッセージを保存
    await prisma.chatHistory.create({
      data: {
        customer_id: customer_id || null,
        session_id: session_id,
        message_type: 'user',
        message_text: message,
        ai_model: 'gpt-4'
      }
    });

    // GPT-4でチャットメッセージを構築
    const messages = await buildChatMessages(session_id, message);

    // GPT-4 API呼び出し
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.6, // 繰り返しを避ける
      frequency_penalty: 0.3
    });

    const aiReply = completion.choices[0].message.content;

    // AI応答を保存
    await prisma.chatHistory.create({
      data: {
        customer_id: customer_id || null,
        session_id: session_id,
        message_type: 'assistant',
        message_text: aiReply,
        ai_model: 'gpt-4',
        metadata: {
          usage: completion.usage,
          model: completion.model
        }
      }
    });

    // 症状情報を抽出
    const allMessages = await prisma.chatHistory.findMany({
      where: { session_id: session_id },
      orderBy: { timestamp: 'asc' }
    });
    const conversationTexts = allMessages.map(m => m.message_text);
    const symptoms = extractSymptoms(conversationTexts);

    // 会話の進捗度を判定
    const readiness = assessReadiness(symptoms);

    // 見積可能な場合、提案アクションを追加
    let suggestedActions = [];
    if (readiness.ready) {
      suggestedActions.push('get_estimate', 'schedule_inspection');

      // AI診断を実行（非同期）
      executeDiagnosis(session_id, customer_id, symptoms).catch(err => {
        console.error('Diagnosis error:', err);
      });
    }

    res.json({
      reply: aiReply,
      session_id: session_id,
      symptoms: symptoms,
      readiness: readiness,
      suggested_actions: suggestedActions,
      metadata: {
        model: 'gpt-4',
        message_count: allMessages.length + 2
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * AI診断実行（別サービスへのリクエスト）
 */
async function executeDiagnosis(sessionId, customerId, symptoms) {
  try {
    // 内部AI診断サービスを呼び出し
    const diagnosisResponse = await fetch('http://ai-diagnosis-service/api/internal/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        customer_id: customerId,
        symptoms: symptoms
      })
    });

    const diagnosis = await diagnosisResponse.json();

    // 診断結果をDBに保存
    await prisma.aiDiagnoses.create({
      data: {
        customer_id: customerId,
        noise_type: diagnosis.noise_type,
        time_of_day: symptoms.time_of_day,
        urgency_level: diagnosis.urgency,
        estimated_price_min: diagnosis.price_estimate.min,
        estimated_price_max: diagnosis.price_estimate.max,
        diagnosis_confidence: diagnosis.confidence,
        symptoms_json: symptoms
      }
    });

    return diagnosis;
  } catch (error) {
    console.error('Diagnosis execution error:', error);
    throw error;
  }
}

/**
 * セッション情報取得
 */
app.get('/api/v1/chat/session/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    const history = await prisma.chatHistory.findMany({
      where: { session_id: session_id },
      orderBy: { timestamp: 'asc' }
    });

    const conversationTexts = history.map(m => m.message_text);
    const symptoms = extractSymptoms(conversationTexts);
    const readiness = assessReadiness(symptoms);

    res.json({
      session_id: session_id,
      message_count: history.length,
      messages: history,
      symptoms: symptoms,
      readiness: readiness
    });

  } catch (error) {
    console.error('Session retrieval error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * ヘルスチェック
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'chatbot-service' });
});

/**
 * レディネスチェック
 */
app.get('/ready', async (req, res) => {
  try {
    // DBとOpenAI APIの接続確認
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ready',
      database: 'connected',
      openai: 'configured'
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🤖 Chatbot service listening on port ${PORT}`);
  console.log(`   - POST /api/v1/chat/message`);
  console.log(`   - GET  /api/v1/chat/session/:session_id`);
  console.log(`   - GET  /health`);
  console.log(`   - GET  /ready`);
});

module.exports = app;
