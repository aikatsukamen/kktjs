# Dev Container での開発（VSCode / Docker / Codespaces）

VSCode + Docker（または GitHub Codespaces）で、ローカルに Node を入れずに kktjs を
開発するための設定（**Node 24 LTS**）。定義は [`.devcontainer/devcontainer.json`](../.devcontainer/devcontainer.json)。

## 前提

- **VSCode** + 拡張「**Dev Containers**」（`ms-vscode-remote.remote-containers`）
- **Docker Desktop**（または Docker Engine）が起動していること
- もしくは **GitHub Codespaces**（ブラウザ/VSCode から。Docker 不要）

## 使い方

1. このリポジトリを VSCode で開く。
2. コマンドパレット（`F1`）→ **「Dev Containers: Reopen in Container」** を実行。
   - 初回はイメージ取得とコンテナ作成で数分かかる。
   - 作成後、`postCreateCommand`（`npm ci`、失敗時は `npm install`）が自動実行され依存が入る。
3. コンテナ内のターミナルで開発コマンドを実行（下記）。

Codespaces の場合は GitHub 上で「Code → Codespaces → Create codespace」。同じ
`devcontainer.json` が使われる。

## 開発コマンド（コンテナ内ターミナル）

```bash
npm run dev        # HMR 付き Vite dev サーバ（http://localhost:5180/）
npm run build      # 本番ビルド（docs/ を生成）
npm run typecheck  # vue-tsc 型チェック（.ts + .vue）
npm run preview    # docs/ を vite preview で配信
```

`npm run dev` を起動するとポート **5180** が自動フォワードされ、VSCode が通知する。
ブラウザで `http://localhost:5180/` を開くと動作確認できる。SFC（`.vue`）や `src/` を
編集すると **HMR で即座に反映**される（手動リロード不要）。

## 構成の要点

- **ベースイメージ**: `mcr.microsoft.com/devcontainers/typescript-node:24-bookworm`
  （Node 24 LTS「Krypton」。CI の `.github/workflows/deploy.yml` と一致させてある）。追加 Dockerfile は不要。
- **ポート**: 5180（dev サーバ）を `forwardPorts` で自動公開。Vite dev サーバは `vite.config.ts` の `server.host: 0.0.0.0` で
  待ち受けるため、コンテナ外（ホスト/Codespaces）からアクセスできる。
- **推奨拡張**（自動インストール）: Vue 公式 `Vue.volar`（SFC 言語サポート）、`ESLint`、
  `EditorConfig`、`Prettier`。
- **改行コード**: LF 統一（`.gitattributes` と `files.eol`）。
- **ユーザ**: 非 root の `node` ユーザ。

## カスタマイズしたいとき

- **OS パッケージや追加ツールが必要**: `devcontainer.json` の `image` を
  `build: { dockerfile: "Dockerfile" }` に変え、`.devcontainer/Dockerfile` を追加する。
- **ブラウザ E2E をコンテナ内で行いたい**: Playwright のブラウザは重いので既定では入れない。
  必要なら `features` に `ghcr.io/devcontainers/features/...` を足すか、postCreate で
  `npx playwright install chromium` を実行する（検証手順は [`BROWSER_TESTING.md`](BROWSER_TESTING.md)）。
- **Node バージョンを変える**: `image` のタグ（`24-bookworm`）と CI の `node-version`、
  `package.json` の `engines.node` を揃えて変更する。

## トラブルシュート

- **`npm ci` が lock 不整合で失敗**: `postCreateCommand` は `npm ci || npm install` の
  フォールバック付き。手動なら `npm install` で `package-lock.json` を更新し直す。
- **ポート 5180 が開かない**: VSCode の「ポート」パネルで 5180 が転送されているか確認。
  Vite dev サーバ起動直後はまだ準備中のことがあるので数秒待つ。
- **`.vue` の型/補完が効かない**: 拡張 `Vue.volar` が有効か、`typescript.tsdk` が
  `node_modules/typescript/lib` を指しているか確認（`devcontainer.json` で設定済み）。
