# ZENBU騒音チェッカー ランディングページ

騒音測定・判定アプリのサービス紹介LP

## 📋 概要

ZENBU騒音チェッカーのサービスを紹介するランディングページです。スマホアプリのダウンロード促進と、サービスの価値訴求を目的としています。

## 🎨 デザインコンセプト

- **色**: ブルーを基調とした信頼感のあるデザイン
- **レイアウト**: モダンでクリーンなレイアウト
- **アニメーション**: スクロールに応じた滑らかなアニメーション
- **レスポンシブ**: モバイル・タブレット・PCすべてに対応

## 📂 ファイル構成

```
noise-checker-lp/
├── index.html      # メインHTMLファイル
├── style.css       # スタイルシート
├── script.js       # JavaScript（アニメーション等）
└── README.md       # このファイル
```

## 🖥 セクション構成

### 1. ヘッダー
- ロゴ
- グローバルナビゲーション
- お問い合わせボタン

### 2. ヒーローセクション
- キャッチコピー
- CTAボタン（無料ダウンロード、デモ）
- 統計情報（ダウンロード数、評価、満足度）
- アプリモックアップ

### 3. 問題提起セクション
- ユーザーの抱える4つの悩み
- 共感を得るデザイン

### 4. ソリューションセクション
- 3つの解決策
- 測定デモ画面

### 5. 機能セクション
- 9つの主要機能
- アイコン付きカード形式

### 6. 使い方セクション
- 3ステップの使用方法
- ビジュアルな説明

### 7. 料金プランセクション
- 3つのプラン（無料・プレミアム・ビジネス）
- 比較表

### 8. お客様の声
- 3つのレビュー
- 星評価付き

### 9. FAQ
- よくある5つの質問
- アコーディオン形式

### 10. CTAセクション
- ストアボタン（App Store、Google Play）
- 最後の行動喚起

### 11. フッター
- 会社情報
- サービスリンク
- 法的情報

## 🚀 使用方法

### ローカルでの確認

1. リポジトリをクローン

```bash
git clone https://github.com/NaofumiMatsushita/zenbu-growth-strategy.git
cd zenbu-growth-strategy/noise-checker-lp
```

2. HTMLファイルをブラウザで開く

```bash
open index.html
```

または、ローカルサーバーを起動:

```bash
# Python 3の場合
python3 -m http.server 8000

# Node.jsの場合
npx http-server
```

ブラウザで `http://localhost:8000` にアクセス

### デプロイ

#### GitHub Pagesでのデプロイ

1. GitHubリポジトリの Settings > Pages
2. Source を `main` ブランチの `/noise-checker-lp` に設定
3. 自動的に公開URLが生成される

#### Netlifyでのデプロイ

1. [Netlify](https://www.netlify.com/)にログイン
2. 「New site from Git」を選択
3. リポジトリを選択
4. Build settings:
   - Base directory: `noise-checker-lp`
   - Build command: (空欄)
   - Publish directory: `noise-checker-lp`
5. Deployをクリック

#### Vercelでのデプロイ

1. [Vercel](https://vercel.com/)にログイン
2. 「Import Project」を選択
3. リポジトリを選択
4. Root Directory: `noise-checker-lp`
5. Deployをクリック

## 🎨 カスタマイズ

### 色の変更

`style.css` の `:root` セクションで色を変更:

```css
:root {
    --primary-color: #0066cc;  /* メインカラー */
    --secondary-color: #00a8e8; /* サブカラー */
    --text-color: #333;         /* テキストカラー */
}
```

### フォントの変更

HTMLの `<head>` でGoogle Fontsを変更:

```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
```

### コンテンツの変更

`index.html` の各セクションを編集:

- ヒーローのキャッチコピー: `.hero-title`
- 機能説明: `.feature-card`
- 料金プラン: `.pricing-card`
- お客様の声: `.testimonial-card`

## 📱 レスポンシブ対応

- **PC**: 1200px以上
- **タブレット**: 768px - 1199px
- **スマホ**: 767px以下

メディアクエリは `style.css` の最下部に記載

## ✨ アニメーション

### 実装されているアニメーション

1. **スクロールフェードイン**: 要素が画面内に入ると表示
2. **カウントアップ**: 統計数値がアニメーション
3. **メーターアニメーション**: dB値が動的に変化
4. **ホバーエフェクト**: カード要素のホバー時の動き

### アニメーションの無効化

アクセシビリティ考慮で、アニメーションを無効にする場合:

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation: none !important;
        transition: none !important;
    }
}
```

## 🔧 追加機能の実装

### お問い合わせフォーム

`index.html` の CTAセクションの下に追加:

```html
<section id="contact" class="contact">
    <div class="container">
        <h2 class="section-title">お問い合わせ</h2>
        <form id="contact-form">
            <input type="text" name="name" placeholder="お名前" required>
            <input type="email" name="email" placeholder="メールアドレス" required>
            <textarea name="message" placeholder="お問い合わせ内容" required></textarea>
            <button type="submit" class="btn btn-primary">送信</button>
        </form>
    </div>
</section>
```

`script.js` でフォーム送信処理を実装済み

### Google Analytics

`index.html` の `</head>` の前に追加:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Facebook Pixel

```html
<!-- Facebook Pixel Code -->
<script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'YOUR_PIXEL_ID');
    fbq('track', 'PageView');
</script>
```

## 🌐 SEO対策

### 実装済み

- ✅ メタタグ（description、keywords）
- ✅ セマンティックHTML
- ✅ レスポンシブデザイン
- ✅ 読み込み速度の最適化

### 追加推奨

1. **構造化データの追加**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ZENBU騒音チェッカー",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY"
  }
}
</script>
```

2. **OGP（Open Graph Protocol）**

```html
<meta property="og:title" content="ZENBU騒音チェッカー">
<meta property="og:description" content="騒音を科学的に測定・判定">
<meta property="og:image" content="https://example.com/og-image.jpg">
<meta property="og:url" content="https://example.com">
```

3. **Twitter Card**

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="ZENBU騒音チェッカー">
<meta name="twitter:description" content="騒音を科学的に測定・判定">
<meta name="twitter:image" content="https://example.com/twitter-image.jpg">
```

## 📊 コンバージョン計測

### 推奨設置箇所

1. **ダウンロードボタンクリック**
2. **お問い合わせフォーム送信**
3. **プレミアムプラン選択**
4. **ページスクロール深度**

`script.js` で実装例:

```javascript
document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', () => {
        gtag('event', 'click', {
            'event_category': 'CTA',
            'event_label': btn.textContent
        });
    });
});
```

## 🐛 トラブルシューティング

### スタイルが適用されない

- ブラウザのキャッシュをクリア
- `style.css` のパスを確認

### アニメーションが動かない

- JavaScriptのエラーを確認（F12 > Console）
- ブラウザのJavaScript設定を確認

### レスポンシブが効かない

- `<meta name="viewport">` タグを確認
- ブラウザのウィンドウサイズを変更して確認

## 📈 パフォーマンス

### 最適化済み

- ✅ 軽量なHTML/CSS/JS
- ✅ Google Fonts最適化読み込み
- ✅ 画像遅延読み込み対応（data-src）

### さらなる改善

1. **画像の最適化**: WebP形式を使用
2. **CDN利用**: CloudflareやFastlyを利用
3. **圧縮**: Gzip/Brotli圧縮を有効化

## 📝 今後の改善予定

- [ ] 実際のアプリスクリーンショット追加
- [ ] 動画デモの埋め込み
- [ ] A/Bテストの実施
- [ ] チャットボットの追加
- [ ] 多言語対応（英語）

## 👥 開発者

**ZENBU株式会社**
- Website: https://all-zenbu.co.jp
- Email: info@all-zenbu.co.jp
- TEL: 052-332-6770

## 📄 ライセンス

Copyright © 2026 ZENBU株式会社

---

**バージョン**: 1.0.0
**最終更新**: 2026年1月23日
