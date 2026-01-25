/**
 * ZENBU Report Generation Service
 * AI + Puppeteerによる自動レポート生成
 *
 * 機能:
 * - GPT-4による文章生成
 * - グラフ作成（Chart.js）
 * - PDF生成（Puppeteer）
 * - 複数フォーマット対応
 * - S3アップロード
 */

const express = require('express');
const puppeteer = require('puppeteer');
const { OpenAI } = require('openai');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1'
});

/**
 * レポートデータモデル
 */
class ReportData {
  constructor(data) {
    this.measurement_id = data.measurement_id;
    this.customer_name = data.customer_name;
    this.property_address = data.property_address;
    this.measured_at = data.measured_at;
    this.duration_minutes = data.duration_minutes;
    this.results = {
      average_db: data.average_db,
      max_db: data.max_db,
      min_db: data.min_db,
      std_dev: data.std_dev
    };
    this.environmental_standard = data.environmental_standard || 45; // 夜間基準
    this.sound_sources = data.sound_sources || [];
    this.time_series_data = data.time_series_data || [];
    this.worker_name = data.worker_name;
    this.worker_certification = data.worker_certification;
  }

  exceedsStandard() {
    return this.results.average_db > this.environmental_standard;
  }

  getExcessAmount() {
    return Math.max(0, this.results.average_db - this.environmental_standard);
  }

  getNoiseLevel() {
    const db = this.results.average_db;
    if (db < 40) return { level: '静か', color: '#4caf50', icon: '🟢' };
    if (db < 60) return { level: 'やや騒音', color: '#fdd835', icon: '🟡' };
    if (db < 80) return { level: '騒がしい', color: '#ff9800', icon: '🟠' };
    return { level: '非常に騒がしい', color: '#f44336', icon: '🔴' };
  }
}

/**
 * グラフ生成クラス
 */
class ChartGenerator {
  constructor() {
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: 800,
      height: 400,
      backgroundColour: 'white'
    });
  }

  async generateTimeSeriesChart(timeSeriesData) {
    /**
     * 時系列グラフを生成
     */
    const configuration = {
      type: 'line',
      data: {
        labels: timeSeriesData.map(d => d.time),
        datasets: [{
          label: '騒音レベル (dB)',
          data: timeSeriesData.map(d => d.db),
          borderColor: '#4fc3f7',
          backgroundColor: 'rgba(79, 195, 247, 0.2)',
          fill: true,
          tension: 0.4
        }, {
          label: '環境基準',
          data: Array(timeSeriesData.length).fill(45),
          borderColor: '#ef5350',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '騒音レベル時系列推移',
            font: { size: 16 }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'dB'
            }
          },
          x: {
            title: {
              display: true,
              text: '時刻'
            }
          }
        }
      }
    };

    const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }

  async generateSoundSourceChart(soundSources) {
    /**
     * 音源推定円グラフを生成
     */
    const configuration = {
      type: 'doughnut',
      data: {
        labels: soundSources.map(s => s.type),
        datasets: [{
          data: soundSources.map(s => s.confidence * 100),
          backgroundColor: [
            '#4fc3f7',
            '#fdd835',
            '#ff9800',
            '#4caf50',
            '#9c27b0'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '音源推定（AI解析）',
            font: { size: 16 }
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    };

    const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }
}

/**
 * GPT-4でレポート文章を生成
 */
async function generateReportText(reportData) {
  const prompt = `以下の騒音測定データから、プロフェッショナルな測定報告書の本文を生成してください。

【測定データ】
- 測定日時: ${reportData.measured_at}
- 場所: ${reportData.property_address}
- 測定時間: ${reportData.duration_minutes}分
- 平均騒音レベル: ${reportData.results.average_db.toFixed(1)} dB
- 最大騒音レベル: ${reportData.results.max_db.toFixed(1)} dB
- 最小騒音レベル: ${reportData.results.min_db.toFixed(1)} dB
- 環境基準: ${reportData.environmental_standard} dB（夜間）
- 基準超過: ${reportData.exceedsStandard() ? 'あり（' + reportData.getExcessAmount().toFixed(1) + 'dB超過）' : 'なし'}
- 主な音源: ${reportData.sound_sources.map(s => s.type + ' ' + (s.confidence * 100).toFixed(0) + '%').join(', ')}

【求める内容】
1. エグゼクティブサマリー（200文字程度）
   - 測定結果の要約
   - 環境基準との比較
   - 主な発見事項

2. 詳細分析（300文字程度）
   - 騒音レベルの評価
   - 音源の特定
   - 時系列での変動パターン

3. 法的評価（200文字程度）
   - 環境基準との比較
   - 受忍限度に関する見解
   - 判例との比較

4. 推奨対策（箇条書き3-5項目）

【トーン】
- 客観的で専門的
- 事実に基づく
- 法的主張は避け、データのみ提示
- 分かりやすく説明`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'あなたは環境騒音測定の専門家です。客観的で正確なレポートを作成します。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // 創造性を抑えて正確性重視
      max_tokens: 2000
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error('GPT-4 error:', error);
    // フォールバック
    return generateFallbackText(reportData);
  }
}

/**
 * GPT-4失敗時のフォールバックテキスト
 */
function generateFallbackText(reportData) {
  const noiseLevel = reportData.getNoiseLevel();
  const exceeds = reportData.exceedsStandard();

  return `
# エグゼクティブサマリー

本測定は、${reportData.property_address}における騒音について実施されました。
測定の結果、平均騒音レベルは${reportData.results.average_db.toFixed(1)}dBであり、
環境基準（${reportData.environmental_standard}dB）を${exceeds ? reportData.getExcessAmount().toFixed(1) + 'dB超過' : '下回って'}います。
騒音レベルは「${noiseLevel.level}」と評価されます。

# 詳細分析

測定時間${reportData.duration_minutes}分間の騒音レベルは、
最大${reportData.results.max_db.toFixed(1)}dB、最小${reportData.results.min_db.toFixed(1)}dBであり、
標準偏差${reportData.results.std_dev.toFixed(1)}dBの変動がありました。

主な音源は${reportData.sound_sources.length > 0 ? reportData.sound_sources[0].type : '特定できず'}と推定されます。

# 法的評価

環境基準との比較において、本測定値は${exceeds ? '基準を超過しており' : '基準内に収まっており'}、
${exceeds ? '受忍限度を超える可能性があります' : '受忍限度内と考えられます'}。

# 推奨対策

1. 管理会社への測定結果の提出
2. ${exceeds ? '上階住民への申し入れ検討' : '継続的なモニタリング'}
3. ${exceeds ? '弁護士への相談検討' : '予防的措置の実施'}
  `.trim();
}

/**
 * HTMLテンプレートからPDF生成
 */
async function generatePDF(reportData, reportText, charts) {
  const templatePath = path.join(__dirname, 'templates', 'report-template.html');
  let template;

  try {
    template = await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    // テンプレートがない場合はデフォルトを使用
    template = getDefaultTemplate();
  }

  const compiledTemplate = handlebars.compile(template);

  const noiseLevel = reportData.getNoiseLevel();

  const html = compiledTemplate({
    report_number: `ZN-${reportData.measurement_id}`,
    generated_date: new Date().toLocaleDateString('ja-JP'),
    customer_name: reportData.customer_name,
    property_address: reportData.property_address,
    measured_at: new Date(reportData.measured_at).toLocaleString('ja-JP'),
    duration: reportData.duration_minutes,
    worker_name: reportData.worker_name,
    worker_certification: reportData.worker_certification,
    average_db: reportData.results.average_db.toFixed(1),
    max_db: reportData.results.max_db.toFixed(1),
    min_db: reportData.results.min_db.toFixed(1),
    std_dev: reportData.results.std_dev.toFixed(1),
    environmental_standard: reportData.environmental_standard,
    exceeds_standard: reportData.exceedsStandard(),
    excess_amount: reportData.getExcessAmount().toFixed(1),
    noise_level: noiseLevel.level,
    noise_level_color: noiseLevel.color,
    noise_level_icon: noiseLevel.icon,
    report_text: reportText,
    time_series_chart: charts.timeSeries,
    sound_source_chart: charts.soundSource
  });

  // Puppeteerでpdf生成
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    printBackground: true
  });

  await browser.close();

  return pdfBuffer;
}

/**
 * S3にアップロード
 */
async function uploadToS3(buffer, key) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME || 'zenbu-reports',
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
    ACL: 'private'
  });

  await s3Client.send(command);

  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * レポート生成エンドポイント
 */
app.post('/api/internal/reports/generate', async (req, res) => {
  try {
    const startTime = Date.now();

    // リクエストデータをパース
    const reportData = new ReportData(req.body);

    // グラフ生成
    const chartGenerator = new ChartGenerator();
    const charts = {
      timeSeries: await chartGenerator.generateTimeSeriesChart(reportData.time_series_data),
      soundSource: await chartGenerator.generateSoundSourceChart(reportData.sound_sources)
    };

    // GPT-4で文章生成
    const reportText = await generateReportText(reportData);

    // PDF生成
    const pdfBuffer = await generatePDF(reportData, reportText, charts);

    // S3にアップロード
    const s3Key = `reports/${reportData.measurement_id}/${Date.now()}.pdf`;
    const pdfUrl = await uploadToS3(pdfBuffer, s3Key);

    const generationTime = Date.now() - startTime;

    res.json({
      report_id: `report-${Date.now()}`,
      pdf_url: pdfUrl,
      generation_time_ms: generationTime,
      file_size_bytes: pdfBuffer.length
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      error: 'Report generation failed',
      message: error.message
    });
  }
});

/**
 * デフォルトHTMLテンプレート
 */
function getDefaultTemplate() {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Noto Sans JP', sans-serif; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #4fc3f7; padding-bottom: 20px; }
    .section { margin: 30px 0; }
    .section-title { font-size: 18px; font-weight: bold; color: #4fc3f7; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f5f5f5; }
    .chart { text-align: center; margin: 20px 0; }
    .chart img { max-width: 100%; }
  </style>
</head>
<body>
  <div class="header">
    <h1>騒音測定報告書</h1>
    <p>報告書番号: {{report_number}}</p>
    <p>作成日: {{generated_date}}</p>
  </div>

  <div class="section">
    <h2 class="section-title">測定概要</h2>
    <table>
      <tr><th>測定日時</th><td>{{measured_at}}</td></tr>
      <tr><th>測定場所</th><td>{{property_address}}</td></tr>
      <tr><th>測定時間</th><td>{{duration}}分</td></tr>
      <tr><th>測定者</th><td>{{worker_name}}（認定番号: {{worker_certification}}）</td></tr>
    </table>
  </div>

  <div class="section">
    <h2 class="section-title">測定結果</h2>
    <table>
      <tr><th>項目</th><th>測定値</th><th>環境基準</th><th>判定</th></tr>
      <tr>
        <td>平均騒音レベル</td>
        <td>{{average_db}} dB</td>
        <td>{{environmental_standard}} dB</td>
        <td style="color: {{noise_level_color}}">{{noise_level_icon}} {{noise_level}}</td>
      </tr>
      <tr><td>最大騒音レベル</td><td>{{max_db}} dB</td><td>-</td><td>-</td></tr>
      <tr><td>最小騒音レベル</td><td>{{min_db}} dB</td><td>-</td><td>-</td></tr>
      <tr><td>標準偏差</td><td>{{std_dev}} dB</td><td>-</td><td>-</td></tr>
    </table>
  </div>

  <div class="section">
    <h2 class="section-title">時系列グラフ</h2>
    <div class="chart">
      <img src="{{time_series_chart}}" alt="時系列グラフ" />
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">音源推定</h2>
    <div class="chart">
      <img src="{{sound_source_chart}}" alt="音源推定" />
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">分析結果</h2>
    <div style="white-space: pre-wrap;">{{report_text}}</div>
  </div>

  <div class="section">
    <p style="text-align: center; font-size: 12px; color: #666;">
      本報告書はAIにより自動生成され、専門家による監修を経て発行されています。<br/>
      発行: ZENBU株式会社 | 問い合わせ: support@zenbu.co.jp
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * ヘルスチェック
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'report-service' });
});

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`📄 Report service listening on port ${PORT}`);
});

module.exports = app;
