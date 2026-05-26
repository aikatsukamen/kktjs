# kktjs

キラキラッター向けカスタム Web クライアント。元々は別の開発者が公開していた
難読化済み `main.js` を解読し、TypeScript プロジェクトとして再構築したもの。

`main`（または `master`）への push をトリガーに GitHub Actions がビルドし、GitHub Pages へ公開する。

---

## リポジトリ構成

```
.
├── src/                  TypeScript ソース（ビルド対象）
│   ├── main.ts             エントリポイント
│   ├── types/              型定義（Mastodon API / アプリ状態 / グローバル宣言）
│   ├── core/               定数・ユーティリティ・移行メソッド登録
│   ├── api/                API エンドポイント定義
│   ├── features/           iOS高さ補正 / 復帰再接続 / メディア保存
│   ├── app/                legacy から移行済みのアプリメソッド
│   └── legacy/app-core.js  解読済み中核ロジック（段階移行中）
├── public/               静的ファイル（そのまま docs/ へコピーされる）
│   ├── index.html
│   ├── css/  fonts/  img/  sounds/
│   ├── js/                 ベンダ JS（vue / lodash / emojione / picker 等）
│   ├── sw.js  manifest.json  favicon.ico
├── docs/                 ★ビルド成果物（GitHub Pages 公開元・git 管理しない）
├── build.mjs             esbuild ビルドスクリプト
├── package.json / tsconfig.json
└── .github/workflows/deploy.yml   CI/CD（main push → ビルド → Pages 公開）
```

`docs/` はビルドで毎回生成されるため `.gitignore` 済み。手動編集しないこと。
編集対象は `src/`（TS）と `public/`（静的ファイル）。

## セットアップ

```bash
npm install
```

依存は `esbuild` と `typescript` のみ。Vue 2 / lodash / emojione は
`public/index.html` で個別 `<script>` 読み込みされるグローバルであり、
バンドルには含めない（external 扱い）。

## ビルド

```bash
npm run build       # 本番ビルド（minify + 外部 sourcemap + docs を一旦クリーン）
npm run build:dev   # 開発ビルド（非 minify + インライン sourcemap、public は差分同期）
npm run watch       # src/ と public/ を監視して自動リビルド
npm run dev         # watch + 簡易プレビューサーバ（http://localhost:5180/）
npm run preview     # 本番相当でビルドして配信
npm run typecheck   # tsc 型チェック（出力なし）
```

`public/` → `docs/` のコピーは差分同期（変更/新規ファイルのみ）。本番の `npm run build`
は正確性のため `--clean`（docs を全削除してから同期）を付けている。ビルド設定の中核
（エントリ/出力/external）は `build.config.mjs` に集約し、将来の Vite 移行で再利用できる。

いずれも `public/` を `docs/` へ同期し、`src/main.ts` を `docs/js/main.js` へバンドルする。
`npm run dev` ならビルド + 監視 + 配信をまとめて行い、ブラウザで即確認できる（要 `npm install`）:

```bash
npm run dev   # → http://localhost:5180/ で動作確認（src/・public/ の変更を自動反映）
```

## CI/CD（GitHub Actions → GitHub Pages）

`.github/workflows/deploy.yml` が次を実行する。

1. `main`（または `master`）への push、もしくは手動実行で起動。
2. `npm ci` → `npm run typecheck` → `npm run build`。
3. 生成された `docs/` を Pages の artifact としてアップロードし、`deploy-pages` で公開。

### リポジトリ側の事前設定

- GitHub の **Settings → Pages → Build and deployment → Source** を
  **「GitHub Actions」** に設定する（フォルダ公開ではなく Actions デプロイ）。
- 上記により `docs/` を git にコミットする必要はない。

> 既存の「`docs/` フォルダを Pages のソースにする」運用を続けたい場合は、
> deploy.yml を「`docs/` をビルドして master にコミットして戻す」方式へ変更し、
> `.gitignore` から `docs/` を外すこと。

## アーキテクチャと外部グローバル

`public/index.html` の読み込み順（重要）:

1. `vue.min.js` / `lodash.min.js` / `emojione.js` 等（グローバルを定義）
2. `main.js`（本プロジェクトのビルド成果物。上記グローバルを参照）
3. インラインの Service Worker 登録スクリプト（`index.html` 内に残置）

バンドルは IIFE。内部から `Vue` / `_` / `emojione` を素の名前で参照し、実行時に
window グローバルへ解決される。`app`（Vue インスタンス）や `wsHome` 等は
`index.html` のテンプレート・inline ハンドラから参照されるため window へ公開している。

## Vue のバージョンについて

現在 Vue 2（`public/js/vue.min.js`、`window.Vue` グローバル）を使用している。
Vue 2 は 2023年末で EOL のため、いずれ Vue 3 へ移行することが望ましい。
ただし `Vue.component` / `Vue.directive` のグローバル API 廃止、ディレクティブの
`inserted`→`mounted` フック名変更、`slot="..."` 構文廃止、Proxy ベースの
リアクティビティ差異（本コードは `$forceUpdate` を 124 箇所で使用）など、機械的に
は済まない破壊的変更がある。実在する要修正箇所と手順は
[`docs-dev/VUE3_MIGRATION.md`](docs-dev/VUE3_MIGRATION.md) に詳述。

推奨は「先に `legacy/app-core.js` の TS 移行を進め、中核が整理されてから Vue 3
移行に着手する」こと（同時に行うと不具合の原因切り分けが困難になるため）。

## 配信場所の移植性（サブパス非依存）

このアプリは **配信場所に依存しない**。GitHub Pages のサブパス
（`https://aikatsukamen.github.io/kktjs/`）でも、独自ドメインのルート
（`https://example.com/`）でも、任意のサブパスでも、設定変更なしで動く。

- 資産パス（画像・SW キャッシュ対象など）は `/kktjs/...` のような固定の絶対パスを
  直書きせず、実行時にベースパスを検出して解決する（`src/core/base-path.ts`）。
  検出順は「`<base href>` → 読み込まれた `js/main.js` の URL → `location.pathname`」。
- `public/index.html` は元々相対パス（`css/style.css` 等）で、SW 登録も `scope: './'`。
- `public/sw.js` のキャッシュ対象は `self.registration.scope`（= 配信ディレクトリ）
  基準で組み立てるため、置き場所に追従する。
- legacy 側の `IMG_DUMMY` も `main.js` の位置からベースを導出して組み立てる。

### 唯一のデプロイ依存項目: OAuth リダイレクト URL

`src/core/constants.ts` の `REDIRECT_URL`（および legacy の `redirect_url`）だけは、
**Mastodon アプリ登録時に申請した値と完全一致する必要がある**ため自動化できない。
配信先 URL を変える場合は、Mastodon 側のアプリ設定の Redirect URI と、この値の
両方を新しい URL に合わせること（`src/core/base-path.ts` の `getAppOrigin()` で
実行時に導出することも可能だが、登録値と一致していなければ認証は通らない）。

## Service Worker のキャッシュ更新（重要）

`public/sw.js` は固定ファイルリストをキャッシュする。`main.js` はリリースごとに
内容が変わるため、配信後にキャッシュを更新させるには **`const key`（現在
`v1.4.8_30`）をリリースごとに変更**すること。これは元実装の運用を踏襲している。
（更新検知ロジック自体は誤通知しないよう修正済み。）

---

## 段階的な TS 移行の進め方

`legacy/app-core.js` は「動く状態を保つための一時的な置き場」。
メソッドを 1 つずつ型付きモジュールへ移していく。**`fetchHome` が実装例**。

1. 移したいメソッドを `legacy/app-core.js` から探す。
2. `src/`（多くは `app/`）に型付きで実装する。Vue インスタンス依存部分は
   引数 `app` で受け取る（`api/endpoints.ts` の `fillEndpoint` で URL を型安全に）。
3. `src/core/register-methods.ts` の `methods` に登録する。
4. legacy 側の元メソッドを、レジストリへ委譲する薄いスタブに置き換える:
   ```js
   'fetchHome': function () {
     if (window.__kktjsMethods && window.__kktjsMethods.fetchHome) {
       return window.__kktjsMethods.fetchHome(this);
     }
   },
   ```
   → `created()` など Vue 初期化中の呼び出しにも対応できる（レジストリは
   legacy 読み込み前に登録されるため）。
5. `npm run build` と実機確認。これを繰り返し、最終的に legacy を縮小・削除する。

### 移行状況（随時更新）

型付きモジュールへ移行済み（legacy には委譲スタブを残置）:
- `core/utils.ts`: escapeHtml / base64ToBlob / encodeHtmlForm / popNotif / autogrow /
  patchEmoji / inputXxx 系（inline ハンドラ用）
- `core/formatters.ts`: formatDate / formatDateFull / formatDateVote / formatDomain /
  checkDisplayName / checkKatsuChain / checkHeader / checkAvatar / checkMedia /
  checkAvatarDiscord / checkVote / equalArr / isSetVote
- `app/timeline.ts`: fetchHome / fetchLocal / fetchMulti
- `app/notifications.ts`: fetchNotifAll / fetchNotifMention / fetchNotifFav /
  fetchNotifFollow / fetchNotifReblog
- `app/accounts.ts`: fetchAcctAll / fetchAcctMedia / fetchAcctFav / fetchAcctFollow /
  fetchAcctFollower / fetchAcctMute / fetchAcctBlock / fetchAcctFollowRequest /
  fetchAcctRelation / fetchAcctProfile / fetchAcctProfileRelation / fetchAcctPinned
- `app/detail.ts`: fetchDetail / fetchDetailChain / fetchDetailFav / fetchDetailReblog
- `app/search.ts`: searchAll / searchAcct
- `app/status-actions.ts`: actFav / actUnFav / actReblog / actUnReblog / updateFav /
  updateReblog / actPin / actUnPin / updatePin / actDelete / updateDelete
- `app/list-actions.ts`: actList / actUnList / updateList
- `app/account-actions.ts`: actFollow / actUnFollow / actMute / actUnMute / actBlock /
  actUnBlock / updateRelation / actFollowAuth / actUnFollowAuth / updateFollowAuth
- `app/columns.ts`: resetHomeColumn / resetLocalColumn / resetNotifColumn /
  resetMultiColumn / resetAcctColumn / resetStreamList
- `app/ui-helpers.ts`: spoilerLength / contentLength / popError / playSound /
  openImage / openImageAll
- `core/predicates.ts`: has*/is* 述語（hasAuth/isMyAcct/hasHome/.../isFollow/isBlock/
  isRequest/isList/isListFollow など計26）

**移行済み: 約100メソッド（全257中）。legacy は約4,400行（開始時 約5,900行）。**
- `app/vue-setup.ts`: コンポーネント/ディレクティブ登録
- `features/*`: ビューポート高さ / 復帰再接続 / メディア保存
- 共通基盤: `api/endpoints.ts`（+ fillEndpoint）/ `api/client.ts`（apiGet / parseMaxId）/
  `core/constants.ts` / `types/*`

未移行（legacy に残存）。以下は「型安全の恩恵が小さい」か「相互依存が強く実機テスト
なしの移行はリスクが高い」ため、意図的に legacy に残している。データ層の型付けが
進んでから着手するのが安全。

- 描画整形の中核: updateWrapperBM / updateFilterBM / updateWrapper* / updateFilter* /
  formatContent* / formatSpoiler* / formatEmoji*（巨大な埋め込みHTML・全カラム整形）
- ストリーミング: openWs* / reopenWs* / fetchSocketDiscord（onmessage の状態機械と密結合）
- 投稿・メディア・投票: actKatsu* / actMedia / actVote / updateVote / setVote / actReport /
  actProfile / actListProfile
- Discord 連携: fetchDiscord / fetchUserDiscord / fetchTokenDiscord 等
- 認証・設定: fetchToken / fetchUser / loadConf / saveConf / resetConf / deleteToken 等
- リスト関連 fetch: fetchStreamList / fetchListFollow* / fetchListListed* / fetchListSearch 等
- 簡易な UI ミューテータ（型安全の利得が小さい一行系）: toggle* / up* / back* / next* /
  add* / remove* / handleScroll* / run*（オーケストレーション）/ 各種エディタ補助 など

### 注意点

- `legacy/app-core.js` は `const` だった一部変数を `let` に直してある
  （`ST_DISCORD` / `directUrl`。元コードは難読化で再代入していた）。
- `tsconfig.json` は移行しやすいよう `strictNullChecks` / `noImplicitAny` を緩めている。
- バンドルは Node 上では完全起動できない（Vue 2 がブラウザ環境を要求）。
  動作確認は実機/ブラウザで。型チェックとビルド可否は CI で担保。

## ライセンス

MIT（`package.json` 参照）。
