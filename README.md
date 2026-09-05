# Morse Path Trainer

モールス信号を「符号列の暗記」ではなく、Morse Tree 上の経路として覚えるためのブラウザ練習アプリです。日本語 / English 切替、PC / スマートフォン対応、Space / タッチ電鍵、直接 `.` / `-` 入力、サイドトーン、学習・打鍵・聞き取り・自由練習、苦手文字の重み付け、ローカル学習履歴を備えています。

## 使い方

GitHub Pages では `dist/` の内容をそのまま公開できます。通常の開発環境では Node.js 22 以降を推奨します。

```bash
npm install
npm run dev
```

Vite による本番ビルドは次です。

```bash
npm run build
```

ネットワークから npm パッケージを取得できない環境でも、TypeScript (`tsc`) が利用可能なら次の自己完結ビルドを使えます。

```bash
npm run build:offline
npm run test:core
```

`vite.config.ts` の `base: './'` により、`https://USER.github.io/REPOSITORY/` のような Project Pages でも相対パスで動作します。ルーターを使っていないため、GitHub Pages の history fallback / 404 対策は不要です。

## 操作

Space または画面上の大きな電鍵を押します。短押しは短点、長押しは長点です。判定閾値は WPM に応じて変わります。`.` と `-` で直接入力、Enter で文字確定、Backspace で一つ戻る、Esc で入力クリアです。自動確定を有効にすると、文字間の無入力時間で自動的に確定します。

聞き取りモードは「再生」を押した後、画面の文字ボタンまたは A–Z / 0–9 キーで回答します。ブラウザの自動再生制限を避けるため、各問題の最初の再生はユーザー操作から開始します。

## データ

設定と学習履歴は `localStorage` のみに保存されます。バックエンド、ログイン、外部データベースはありません。

## React runtime

本番 HTML は React 18.2.0 / ReactDOM 18.2.0 の UMD runtime を unpkg から固定バージョンで読み込みます。アプリ本体、Morse Tree、CSS、学習データはすべてリポジトリ内の静的ファイルです。完全オフライン配布にする場合は React の UMD ファイルを `public/vendor/` に置き、`index.html` の2つの script src をローカル相対パスへ変更してください。

## GitHub Pages

`.github/workflows/deploy-pages.yml` を含めています。リポジトリ Settings → Pages → Source を **GitHub Actions** に設定し、`main` へ push すると `npm ci` → `npm run build` → Pages deploy が実行されます。

## 構成

- `src/features/morse/`: モールス変換、ツリー生成、WPM計算
- `src/components/`: Morse Tree、電鍵、設定、成績表示
- `src/audio/`: Web Audio API サイドトーン
- `src/i18n/`: 日本語 / 英語辞書
- `src/storage/`: localStorage 設定・学習履歴
- `dist/`: そのままホストできる production build

MIT License
