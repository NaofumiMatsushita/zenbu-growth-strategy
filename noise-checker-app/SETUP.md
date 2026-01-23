# ZENBU騒音チェッカー - セットアップガイド

## 必要な環境

- Node.js 18以上
- npm または yarn
- Expo CLI（`npm install -g expo-cli`）
- Expo Goアプリ（iOS / Android）

## インストール手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm start
```

または

```bash
expo start
```

### 3. アプリの実行

開発サーバーが起動したら、QRコードが表示されます。

#### iOS（実機）
1. App StoreからExpo Goアプリをダウンロード
2. カメラでQRコードをスキャン
3. Expo Goで開く

#### Android（実機）
1. Google PlayからExpo Goアプリをダウンロード
2. Expo GoアプリでQRコードをスキャン

#### iOS Simulator（Mac のみ）
```bash
npm run ios
```

#### Android Emulator
```bash
npm run android
```

## 主な機能

### 1. リアルタイム騒音測定
- マイクを使用して周囲の騒音レベルをリアルタイムで測定
- dB値を視覚的に表示
- 騒音レベルを4段階で判定（静か/普通/騒がしい/非常に騒がしい）

### 2. 測定結果の保存と分析
- 測定データを端末に保存
- 時系列グラフで表示
- 環境基準との比較
- AI音源推定（開発中）

### 3. 履歴管理
- 過去の測定データを一覧表示
- フィルタリング機能
- 統計サマリー

### 4. レポート生成
- 測定結果をテキスト形式で出力
- シェア機能

## トラブルシューティング

### マイク権限エラー
アプリ初回起動時にマイク権限を許可してください。許可しなかった場合は、デバイスの設定からExpo Goアプリの権限を有効にしてください。

### ビルドエラー
```bash
rm -rf node_modules
npm install
```

### Metro Bundlerのキャッシュクリア
```bash
expo start -c
```

## 開発モード

### デバッグメニューの表示
- iOS: Cmd + D
- Android: Cmd + M / Ctrl + M

### ホットリロード
コードを変更すると自動的にアプリがリロードされます。

## アセットの追加

以下のアセットファイルを `assets/` ディレクトリに追加してください：

- `icon.png` (1024x1024px) - アプリアイコン
- `splash.png` (1242x2436px) - スプラッシュスクリーン
- `adaptive-icon.png` (1024x1024px) - Android用アダプティブアイコン
- `favicon.png` (48x48px) - Webファビコン

プレースホルダー画像を生成するか、デザインツールで作成してください。

## 本番ビルド

### EAS Build（推奨）

```bash
# EAS CLI のインストール
npm install -g eas-cli

# EAS にログイン
eas login

# ビルド設定
eas build:configure

# iOS ビルド
eas build --platform ios

# Android ビルド
eas build --platform android
```

### Classic Build

```bash
expo build:ios
expo build:android
```

## プロジェクト構造

```
noise-checker-app/
├── App.js                 # メインアプリコンポーネント
├── app.json              # Expo設定
├── package.json          # 依存関係
├── assets/               # 画像・アイコン
└── src/
    ├── screens/          # 画面コンポーネント
    │   ├── HomeScreen.js
    │   ├── MeasurementResultScreen.js
    │   ├── HistoryScreen.js
    │   ├── SettingsScreen.js
    │   └── ReportScreen.js
    └── utils/            # ユーティリティ
        ├── NoiseAnalyzer.js
        ├── Storage.js
        └── AudioRecorder.js
```

## 技術スタック

- **Expo SDK 50** - React Nativeフレームワーク
- **React Navigation 6** - ナビゲーション
- **Expo AV** - 音声録音
- **AsyncStorage** - データ永続化
- **react-native-chart-kit** - グラフ描画
- **date-fns** - 日付処理

## 次のステップ

1. assetsディレクトリに画像を追加
2. 実機でテスト
3. 音声解析機能の強化
4. バックエンドAPIとの連携
5. プッシュ通知の実装

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。

## ライセンス

Copyright © 2026 ZENBU株式会社
