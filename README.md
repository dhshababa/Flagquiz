# 🌍 国旗クイズ — World Flags Master

190カ国以上の国旗を当てるクイズゲーム。10言語対応。

## ローカルで動かす

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く。

---

## 無料で公開する方法

### 方法A — Vercel（最も簡単・推奨）

1. https://github.com/new でリポジトリを作る
2. このフォルダを push する:
   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/あなたのID/flag-quiz.git
   git push -u origin main
   ```
3. https://vercel.com にアクセス → "New Project" → GitHubリポジトリを選択
4. Framework: **Vite** を選択（自動検出される）
5. "Deploy" を押すだけ → 数分で `https://flag-quiz-xxxx.vercel.app` が発行される

---

### 方法B — Netlify（ドラッグ&ドロップで即公開）

1. ビルドする:
   ```bash
   npm run build
   ```
2. https://app.netlify.com/drop を開く
3. `dist` フォルダをブラウザにドラッグ&ドロップ
4. 即座にURLが発行される（例: `https://amazing-name-123.netlify.app`）

---

### 方法C — GitHub Pages

1. `vite.config.ts` に `base` を追加:
   ```ts
   export default defineConfig({
     plugins: [react()],
     base: '/flag-quiz/',  // リポジトリ名に合わせる
   })
   ```
2. `package.json` の scripts に追加:
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```
3. gh-pages をインストール:
   ```bash
   npm install -D gh-pages
   ```
4. デプロイ:
   ```bash
   npm run deploy
   ```
5. GitHub リポジトリ → Settings → Pages → Source: `gh-pages` ブランチ

---

## カスタムドメインを使う場合

VercelもNetlifyも無料プランでカスタムドメインを設定できます。
ドメイン取得後、各サービスのダッシュボードから DNS 設定を行ってください。

## ビルド設定（CI/CDサービス共通）

| 設定項目 | 値 |
|---|---|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node Version | 18 以上 |
