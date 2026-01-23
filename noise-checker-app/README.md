# ZENBU騒音チェッカー

音声データから騒音レベルを測定・判定するスマホアプリ（React Native）

## 📱 アプリ概要

ZENBU騒音チェッカーは、スマートフォンのマイクを使ってリアルタイムで騒音レベルを測定し、科学的な根拠に基づいて「騒音かどうか」を判定するアプリです。

### 主な機能

- **リアルタイム騒音測定** - マイクを使った即座の測定
- **騒音レベル判定** - 4段階の判定（静か/やや騒音/騒音/著しい騒音）
- **詳細データ分析** - 最大・平均・最小dB値の表示
- **時系列グラフ** - 騒音の推移を視覚化
- **環境基準との比較** - 環境基準法との自動比較
- **AI音源推定** - 騒音の種類を自動判定（簡易版）
- **測定履歴管理** - 過去の測定データを保存・閲覧
- **レポート生成** - テキスト形式のレポート作成・共有
- **録音機能** - 騒音発生時の音声を保存

## 🛠 技術スタック

- **フレームワーク**: React Native 0.73.2
- **言語**: JavaScript
- **ナビゲーション**: React Navigation
- **音声処理**: react-native-audio-recorder-player
- **データ保存**: AsyncStorage
- **グラフ**: react-native-chart-kit
- **アイコン**: react-native-vector-icons

## 📋 前提条件

- Node.js 18以上
- npm or yarn
- React Native開発環境
  - iOS: Xcode 14以上
  - Android: Android Studio

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
cd noise-checker-app
npm install
```

### 2. iOSの追加セットアップ

```bash
cd ios
pod install
cd ..
```

### 3. 権限設定

#### iOS (`ios/Info.plist`)

```xml
<key>NSMicrophoneUsageDescription</key>
<string>騒音レベルを測定するためにマイクへのアクセスが必要です</string>
```

#### Android (`android/app/src/main/AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### 4. アプリの起動

#### iOSシミュレーター

```bash
npm run ios
```

#### Androidエミュレーター

```bash
npm run android
```

## 📂 プロジェクト構造

```
noise-checker-app/
├── App.js                      # メインアプリケーション
├── package.json                # 依存関係
├── src/
│   ├── screens/                # 画面コンポーネント
│   │   ├── HomeScreen.js       # ホーム（測定画面）
│   │   ├── MeasurementResultScreen.js  # 測定結果画面
│   │   ├── HistoryScreen.js    # 履歴画面
│   │   ├── SettingsScreen.js   # 設定画面
│   │   └── ReportScreen.js     # レポート画面
│   │
│   └── utils/                  # ユーティリティ
│       ├── NoiseAnalyzer.js    # 騒音分析ロジック
│       └── Storage.js          # データ保存・取得
│
├── ios/                        # iOSネイティブコード
└── android/                    # Androidネイティブコード
```

## 🎨 画面構成

### 1. ホーム画面（測定画面）

- リアルタイムdB値表示
- 測定開始/停止ボタン
- 騒音レベルの色分け表示
- 測定中の統計情報

### 2. 測定結果画面

- 判定結果の表示
- 詳細データ（最大・平均・最小・中央値）
- 時系列グラフ
- 環境基準との比較
- AI音源推定
- 推奨アクション

### 3. 履歴画面

- 過去の測定データ一覧
- フィルタ機能（すべて/騒音あり/静か）
- 統計サマリー
- データ削除機能

### 4. 設定画面

- ユーザー情報登録
- 地域種別設定
- 録音設定
- 通知設定
- データ管理

### 5. レポート画面

- テキスト形式レポート生成
- 共有機能
- コピー機能

## 📊 騒音レベル判定基準

| レベル | dB範囲 | アイコン | 説明 |
|--------|--------|---------|------|
| **静か** | 0-40dB | 🟢 | 問題なし（図書館程度） |
| **やや騒音** | 40-60dB | 🟡 | 注意レベル（普通の会話） |
| **騒音** | 60-80dB | 🟠 | 要対策（交通騒音） |
| **著しい騒音** | 80dB以上 | 🔴 | 即対応必要（工事現場） |

## 🌍 環境基準

### 住居地域
- 昼間（6-22時）: 55dB以下
- 夜間（22-6時）: 45dB以下

### 商業地域
- 昼間（6-22時）: 60dB以下
- 夜間（22-6時）: 50dB以下

## 🔧 カスタマイズ

### 判定基準の変更

`src/utils/NoiseAnalyzer.js` の `NOISE_LEVELS` を編集:

```javascript
export const NOISE_LEVELS = {
  QUIET: {
    minDb: 0,
    maxDb: 40,
    // ...
  },
  // ...
};
```

### UI色の変更

各画面の `StyleSheet.create()` 内で色を変更:

```javascript
primaryButton: {
  backgroundColor: '#0066cc', // ここを変更
},
```

## 🐛 トラブルシューティング

### マイク権限が取得できない

- iOS: 設定 > プライバシー > マイク から許可
- Android: アプリ設定 > 権限 > マイク から許可

### 録音ファイルが保存されない

- ストレージ権限を確認
- 空き容量を確認

### dB値が正確でない

- スマホの機種によってマイク性能が異なります
- キャリブレーション機能は今後追加予定

## 📝 今後の開発予定

- [ ] AI音源分類の本格実装（機械学習モデル）
- [ ] PDF出力機能
- [ ] クラウドバックアップ
- [ ] 24時間モニタリング機能
- [ ] プッシュ通知
- [ ] Web版との連携
- [ ] 複数デバイス対応
- [ ] 英語対応

## 🧪 テスト

```bash
npm test
```

## 📦 ビルド

### iOS

```bash
cd ios
xcodebuild -workspace NoiseChecker.xcworkspace \
  -scheme NoiseChecker \
  -configuration Release \
  -archivePath build/NoiseChecker.xcarchive \
  archive
```

### Android

```bash
cd android
./gradlew assembleRelease
```

## 📄 ライセンス

Copyright © 2026 ZENBU株式会社

## 👥 開発者

**ZENBU株式会社**
- Website: https://all-zenbu.co.jp
- Email: info@all-zenbu.co.jp
- TEL: 052-332-6770

## 🙏 謝辞

このアプリは、賃貸住宅の騒音トラブル解決を目的として開発されました。

---

**バージョン**: 1.0.0
**最終更新**: 2026年1月23日
