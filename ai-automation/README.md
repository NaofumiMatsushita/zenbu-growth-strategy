# ZENBU AI自動化システム - 実装ガイド

現場作業以外の全プロセスをAIで自動化するシステムの実装資料集

## 📁 ディレクトリ構成

```
ai-automation/
├── README.md                          # このファイル
├── ZENBU_AI自動化構想.md               # 総合構想ドキュメント
├── system-architecture.md             # システムアーキテクチャ詳細
└── prototypes/                        # プロトタイプコード
    ├── chatbot-service.js             # AIチャットボットサービス
    ├── ai-diagnosis-service.py        # AI診断サービス
    ├── scheduler-service.py           # スケジューラサービス
    └── report-service.js              # レポート生成サービス
```

## 🎯 システム概要

### 自動化される業務プロセス

```
従来: 人間が8ステップ実施 → AI化: 人間は現場測定のみ（1ステップ）

✅ 初回問い合わせ対応 (AI化率100%)
✅ 症状診断・見積もり (AI化率100%)
✅ スケジューリング (AI化率100%)
✅ 現場作業準備 (AI化率100%)
⭕ 現場測定作業 (AI化率30% - 人間主体)
✅ データ分析 (AI化率100%)
✅ レポート生成 (AI化率100%)
✅ 決済処理 (AI化率100%)
✅ アフターフォロー (AI化率100%)
```

### コスト削減効果

| 項目 | 従来モデル | AI自動化モデル | 削減率 |
|------|-----------|--------------|--------|
| 月間運営コスト（100件） | 308万円 | 170万円 | **45%削減** |
| 1件あたりコスト | 30,800円 | 17,000円 | **45%削減** |
| 月間運営コスト（1000件） | 1,330万円 | 445万円 | **67%削減** |
| 1件あたりコスト | 13,300円 | 4,450円 | **67%削減** |

## 🚀 クイックスタート

### 前提条件

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- AWS アカウント

### 1. 環境変数設定

```bash
# .env ファイルを作成
cat > .env << EOF
# OpenAI
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/zenbu
REDIS_URL=redis://localhost:6379

# AWS
AWS_REGION=ap-northeast-1
S3_BUCKET_NAME=zenbu-reports
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Google Cloud (音声AI用)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Stripe (決済)
STRIPE_SECRET_KEY=sk_test_...

# Twilio (SMS・電話)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+81...
EOF
```

### 2. データベースセットアップ

```bash
# PostgreSQLに接続
psql -U postgres

# データベース作成
CREATE DATABASE zenbu;

# スキーマ作成（system-architecture.md のSQLを実行）
\i schema.sql
```

### 3. サービス起動

#### チャットボットサービス

```bash
cd prototypes
npm install express openai @prisma/client

# Prisma初期化
npx prisma init
npx prisma migrate dev

# サービス起動
node chatbot-service.js
# → http://localhost:3000
```

#### AI診断サービス

```bash
pip install fastapi uvicorn openai pydantic

# サービス起動
python ai-diagnosis-service.py
# → http://localhost:8001
```

#### スケジューラサービス

```bash
pip install fastapi uvicorn ortools

# サービス起動
python scheduler-service.py
# → http://localhost:8002
```

#### レポート生成サービス

```bash
npm install puppeteer openai chartjs-node-canvas handlebars @aws-sdk/client-s3

# サービス起動
node report-service.js
# → http://localhost:3003
```

### 4. Docker Composeで一括起動

```bash
# docker-compose.yml を作成（後述）
docker-compose up -d
```

## 📡 API エンドポイント

### チャットボットサービス (port 3000)

```bash
# チャットメッセージ送信
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-001",
    "message": "上階の騒音で困っています",
    "customer_id": null
  }'

# セッション情報取得
curl http://localhost:3000/api/v1/chat/session/test-session-001
```

### AI診断サービス (port 8001)

```bash
# 診断実行
curl -X POST http://localhost:8001/api/internal/diagnose \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-001",
    "symptoms": {
      "noise_type": "footsteps",
      "time_of_day": "night",
      "duration_weeks": 2,
      "frequency": "daily",
      "source_location": "upstairs"
    }
  }'
```

### スケジューラサービス (port 8002)

```bash
# スケジュール最適化
curl -X POST http://localhost:8002/api/internal/scheduler/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-27",
    "new_booking": {
      "booking_id": "book-001",
      "customer_name": "山田太郎",
      "location": {
        "latitude": 35.6812,
        "longitude": 139.7671,
        "address": "東京都渋谷区"
      },
      "preferred_time": "14:00",
      "estimated_duration_minutes": 120,
      "urgency": "medium"
    }
  }'
```

### レポート生成サービス (port 3003)

```bash
# レポート生成
curl -X POST http://localhost:3003/api/internal/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "measurement_id": "meas-001",
    "customer_name": "山田太郎",
    "property_address": "東京都渋谷区...",
    "measured_at": "2026-01-27T14:30:00Z",
    "duration_minutes": 30,
    "average_db": 52.3,
    "max_db": 68.5,
    "min_db": 38.2,
    "std_dev": 8.7,
    "environmental_standard": 45,
    "sound_sources": [
      {"type": "足音", "confidence": 0.85},
      {"type": "話し声", "confidence": 0.10}
    ],
    "time_series_data": [
      {"time": "14:30", "db": 50.2},
      {"time": "14:35", "db": 52.5},
      {"time": "14:40", "db": 48.9}
    ],
    "worker_name": "田中",
    "worker_certification": "ZN-2024-015"
  }'
```

## 🐳 Docker Compose設定

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: zenbu
      POSTGRES_USER: zenbu
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  chatbot-service:
    build:
      context: ./prototypes
      dockerfile: Dockerfile.chatbot
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=postgresql://zenbu:password@postgres:5432/zenbu
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  ai-diagnosis-service:
    build:
      context: ./prototypes
      dockerfile: Dockerfile.diagnosis
    ports:
      - "8001:8001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - chatbot-service

  scheduler-service:
    build:
      context: ./prototypes
      dockerfile: Dockerfile.scheduler
    ports:
      - "8002:8002"
    environment:
      - DATABASE_URL=postgresql://zenbu:password@postgres:5432/zenbu
    depends_on:
      - postgres

  report-service:
    build:
      context: ./prototypes
      dockerfile: Dockerfile.report
    ports:
      - "3003:3003"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - AWS_REGION=${AWS_REGION}
      - S3_BUCKET_NAME=${S3_BUCKET_NAME}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}

volumes:
  postgres-data:
```

## 📊 監視・ロギング

### Prometheusメトリクス収集

```javascript
// 各サービスに追加
const promClient = require('prom-client');
const register = new promClient.Registry();

// カスタムメトリクス
const chatbotRequests = new promClient.Counter({
  name: 'zenbu_chatbot_requests_total',
  help: 'Total number of chatbot requests',
  labelNames: ['status']
});

register.registerMetric(chatbotRequests);

// /metrics エンドポイント
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### ログフォーマット（JSON）

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

logger.info('Chat message processed', {
  user_id: 'user-123',
  session_id: 'session-abc',
  message_count: 5
});
```

## 🧪 テスト

### ユニットテスト

```bash
# Node.js (Jest)
npm test

# Python (pytest)
pytest tests/
```

### 統合テスト

```bash
# E2Eテストシナリオ
npm run test:e2e
```

### 負荷テスト

```bash
# Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/v1/chat/message

# k6
k6 run load-test.js
```

## 🔧 トラブルシューティング

### OpenAI API エラー

```
Error: OpenAI API returned 429 (Rate Limit)
```

**対処法:**
- API利用制限を確認
- リトライロジックを実装
- キャッシュを活用

### データベース接続エラー

```
Error: Connection refused (PostgreSQL)
```

**対処法:**
```bash
# PostgreSQL起動確認
sudo systemctl status postgresql

# 接続テスト
psql -U zenbu -d zenbu -h localhost
```

### PDF生成エラー

```
Error: Failed to launch browser (Puppeteer)
```

**対処法:**
```bash
# 依存パッケージインストール（Ubuntu）
sudo apt-get install -y \
  chromium-browser \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1
```

## 📈 パフォーマンス最適化

### キャッシュ戦略

```javascript
// Redis キャッシュ
const redis = require('redis');
const client = redis.createClient();

async function getCachedDiagnosis(symptomsHash) {
  const cached = await client.get(`diagnosis:${symptomsHash}`);
  if (cached) return JSON.parse(cached);

  const diagnosis = await runDiagnosis(...);
  await client.setEx(`diagnosis:${symptomsHash}`, 3600, JSON.stringify(diagnosis));

  return diagnosis;
}
```

### データベースクエリ最適化

```sql
-- インデックス追加
CREATE INDEX CONCURRENTLY idx_chat_history_session_timestamp
ON chat_history(session_id, timestamp DESC);

-- クエリプラン確認
EXPLAIN ANALYZE SELECT * FROM chat_history WHERE session_id = 'xxx';
```

## 🔐 セキュリティ

### API認証

```javascript
// JWT認証ミドルウェア
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.use('/api/v1', authMiddleware);
```

### レート制限

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100 // 100リクエスト
});

app.use('/api/v1', limiter);
```

## 📝 次のステップ

### フェーズ1: プロトタイプ検証（1ヶ月）

- [ ] 各サービスのローカル動作確認
- [ ] 10件の実案件でテスト
- [ ] フィードバック収集と改善

### フェーズ2: プロダクション環境構築（2ヶ月）

- [ ] AWS EKS にデプロイ
- [ ] CI/CD パイプライン構築
- [ ] 監視・アラート設定
- [ ] バックアップ体制確立

### フェーズ3: スケールアップ（3ヶ月）

- [ ] 月間100件処理達成
- [ ] AI精度向上（継続学習）
- [ ] 追加機能実装
- [ ] 他地域展開

## 💡 よくある質問

**Q: GPT-4のコストが高くならないか？**

A: キャッシュ戦略とプロンプト最適化で、1リクエストあたり50円程度に抑えられます。月間100件で5,000円程度。

**Q: 音源推定AIの精度は？**

A: 現時点で92%の精度。自社データで継続学習することで95%以上を目指します。

**Q: 完全自動化でクレームが増えないか？**

A: 重要な判断（高額見積もり、法的リスク高）は人間承認フローを残します。段階的に自動化範囲を拡大。

## 📞 サポート

質問・問題報告: GitHub Issues
緊急連絡: support@zenbu.co.jp

---

**作成日**: 2026年1月25日
**バージョン**: 1.0
**ライセンス**: Proprietary (ZENBU株式会社)
