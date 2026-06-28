# kktjs

キラキラッター向けカスタム Web クライアント。元々は別の開発者が公開していた
難読化済み `main.js` を解読し、TypeScript プロジェクトとして再構築したもの。

`main`（または `master`）への push をトリガーに GitHub Actions がビルドし、GitHub Pages へ公開する。

---

## リポジトリ構成

```
.
├── index.html            ★Vite エントリ（プロジェクトルート。<script src="/src/main.ts"> を読む）
├── src/                  TypeScript / SFC ソース（ビルド対象）
│   ├── main.ts             エントリポイント
│   ├── components/         SFC（.vue。Vite + plugin-vue でコンパイル）
│   ├── types/              型定義（Mastodon API / アプリ状態 / グローバル宣言 / .vue シム）
│   ├── core/               定数・ユーティリティ・移行メソッド登録
│   ├── api/                API エンドポイント定義
│   ├── features/           iOS高さ補正 / 復帰再接続
│   ├── app/                移行済みアプリメソッド（全件 TS 化） + vue-setup
│   └── legacy/app-core.ts   Vue ハーネス + 共有関数 + window ブリッジ（全て TypeScript）
├── public/               静的アセット（そのまま docs/ へコピーされる）
│   ├── css/  fonts/  img/  sounds/
│   ├── js/                 ベンダ JS（lodash / emojione / picker 等。Vue は import でバンドル）
│   ├── sw.js  manifest.json  favicon.ico
├── docs/                 ★ビルド成果物（GitHub Pages 公開元・git 管理しない）
├── vite.config.ts        Vite 設定（唯一のビルド設定。SFC・external・vue エイリアス・base）
├── package.json / tsconfig.json
├── .devcontainer/devcontainer.json   VSCode/Codespaces 開発環境（Node 24 LTS・ポート5180）
└── .github/workflows/deploy.yml   CI/CD（main push → ビルド → Pages 公開）
```

`docs/` はビルドで毎回生成されるため `.gitignore` 済み。手動編集しないこと。
編集対象は `index.html`、`src/`（TS / SFC）、`public/`（静的アセット）。

## セットアップ

```bash
npm install
```

ビルドは **Vite**（`@vitejs/plugin-vue` で SFC `.vue` をコンパイル）。型チェックは
`vue-tsc`。**Vue は npm 依存からバンドルする**（`vite.config.ts` で `vue/dist/vue.esm-bundler.js`
＝コンパイラ同梱ビルドへエイリアス。`index.html` 内の DOM テンプレートと x-template モーダルを
実行時コンパイルするため）。lodash / emojione は引き続き `index.html` で個別 `<script>`
読み込みされる CDN グローバルで、バンドルには含めない（external 扱い。`vite.config.ts` の
仮想モジュールで `import` を `window._` / `window.emojione` へ解決する）。

> ローカルに Node を入れず **VSCode + Docker（Dev Container）/ GitHub Codespaces** で
> 開発することもできる。手順は [`docs-dev/DEVCONTAINER.md`](docs-dev/DEVCONTAINER.md)
> （`.devcontainer/devcontainer.json` 同梱。Node 24 LTS / ポート 5180 自動フォワード /
> Vue 拡張つき）。

## ビルド

```bash
npm run dev          # HMR 付き Vite dev サーバ（http://localhost:5180/）
npm run build        # 本番ビルド（Vite → docs/。Vue + SFC をバンドル）
npm run preview      # docs/ を Vite preview で配信
npm run typecheck    # vue-tsc 型チェック（.ts + .vue、出力なし）
```

ビルド設定はすべて `vite.config.ts` に集約。Vite は **プロジェクトルートの `index.html`**
をエントリに、`<script type="module" src="/src/main.ts">` から依存（Vue・SFC・`src/*.ts`）を
バンドルし、`docs/assets/index-[hash].js` / `.css` を出力する。`public/` の静的アセット
（css/fonts/img/sounds/sw.js/ベンダ JS）はそのまま `docs/` へコピー。生成アセットは相対パス
（`./assets/...`）なので **配信場所に依存しない**（`base: './'`。GitHub Pages のサブパスでも
独自ドメインのルートでも動く）。

> ビルド関連ファイルは `vite.config.ts` の **1つだけ**。以前あった esbuild ビルド（`build.mjs`）・
> 共有設定（`build.config.mjs`）・独自 dev サーバ（`dev.mjs`）は、Vite 標準エントリ方式への移行で
> すべて廃止した。`index.html` は `public/` からプロジェクトルートへ移動済み。

### dev サーバ（真の HMR）

`npm run dev` は Vite 標準の dev サーバ。`index.html` がエントリなので、`src/` や SFC（`.vue`）を
編集すると **HMR で即座にブラウザへ反映**される（手動リロード不要）。

```bash
npm run dev   # → http://localhost:5180/（HMR。Dev Container/Codespaces 用に 0.0.0.0 で待ち受け）
```

#### Vue はコンパイラ同梱ビルドを使う

このアプリは `index.html` 内の巨大な DOM テンプレートと x-template モーダル（`template: '#modal-*'`）を
**実行時コンパイル**している。npm `vue` の既定（runtime-only）にはコンパイラが無くこれらを描画できない
ため、`vite.config.ts` で `vue` を `vue/dist/vue.esm-bundler.js`（コンパイラ同梱）へエイリアスし、
`__VUE_OPTIONS_API__` 等のフィーチャーフラグを `define` で設定している。

> **`index.html` の inline テンプレート（約3,790行）を `.vue` へ全面移行**する場合の引き継ぎは
> [`docs-dev/SFC_MIGRATION.md`](docs-dev/SFC_MIGRATION.md)。全面 SFC 化が完了すれば runtime-only
> ビルドへ戻してバンドルを小さくできる。SFC 自体は `src/components/VersionBadge.vue` が動作実証済み。

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

`index.html`（プロジェクトルート）の読み込み順:

1. `lodash.min.js` / `emojione.js` / `addtohomescreen.min.js` / `inobounce.min.js`
   （CDN グローバル `_` / `emojione` 等を定義。`public/js/` から配信）
2. `<script type="module" src="/src/main.ts">`（Vite エントリ。Vue・SFC・`src/*` を
   バンドルした成果物 `assets/index-[hash].js` を読み込む）
3. `picker.js`（emoji picker）/ インラインの Service Worker 登録スクリプト

**Vue は npm 依存からバンドル**される（CDN ではない）。lodash / emojione はバンドルに含めず、
ビルド時に `import` を実行時の window グローバル（`window._` / `window.emojione`）へ解決する
（`vite.config.ts` の `globalsExternal` 仮想モジュール）。`app`（Vue インスタンス）や
`wsHome` 等は `index.html` のテンプレート・inline ハンドラから参照されるため window へ公開している。

## Vue のバージョンについて

**Vue 3 へ移行済み**（npm 依存 `vue@3` をバンドル。`vite.config.ts` で
`vue/dist/vue.esm-bundler.js` ＝コンパイラ同梱ビルドへエイリアス）。Vue 2 は 2023年末で
EOL のため移行した。対応した破壊的変更は次のとおり（詳細・背景は
[`docs-dev/VUE3_MIGRATION.md`](docs-dev/VUE3_MIGRATION.md)）:

- **グローバル API 廃止**: `new Vue({el})` → `Vue.createApp(...).mount('#app')`。
  `Vue.component`/`Vue.directive` → アプリインスタンスの `app.component`/`app.directive`
  （`src/app/vue-setup.ts` に集約。`registerVueComponentsAndDirectives(app)` を
  `createApp` 後・`mount` 前に呼ぶ。呼び出しは `src/legacy/app-core.ts` の末尾）。
- **`data` は関数必須**: ルートの `data: {...}` を `data() { return {...}; }` へ。
- **ディレクティブのフック名**: `inserted` → `mounted`（`focus`/`restore-*`/`restore-vote0..3`
  と関数省略記法の `play` を含む全9個）。
- **名前付きスロット**: `slot="header"` → `<template #header>`（`index.html` の
  media/emojipicker/confirm/info モーダル4箇所）。
- **`v-for` + `v-if` の優先順位逆転**: Vue 3 では `v-if` が先に評価され、`v-if` が
  `v-for` のループ変数（`index`/`issue` 等）を参照すると壊れる。同一要素に両方付いて
  いた27箇所を `<template v-for :key>` でラップし、`v-if` を内側要素へ移した。
- **`_data` → `$data`**: 内部プロパティ `app._data` への直接アクセスは公開プロキシ
  （`app.$data`、Vue 2/3 両対応）へ置換（src と index.html 計82箇所）。
- **マウント挙動**: Vue 3 の `mount('#app')` はコンテナ**内側**に描画し `#app` 自身の
  属性はコンパイルしない。テーマの `:class="[optTheme...]"` は `#app` 直下の単一ルート
  ラッパ div へ移し、`#app` には native な `on*` ハンドラ（drag/drop/paste/focus/blur）
  だけを残した（`index.html`）。

`$forceUpdate`（src 全体で約87箇所）は Proxy リアクティビティでは多くが不要になるが、
**回帰を避けるため残置**してある（無害。安定後に段階削除してよい）。`Vue.set`/`Vue.delete`、
`$on`/`$off`/`$once`、フィルタ構文は元々未使用。

メソッドの TS 移行も完了済み（全257件）。型チェック・本番ビルド・実ブラウザ
（Chromium）での起動／ログイン後メソッド呼び出し／全カラム・モーダルの実描画検証まで
通っている（Vue 警告・実行時エラーともゼロ）。検証手順は
[`docs-dev/BROWSER_TESTING.md`](docs-dev/BROWSER_TESTING.md) 参照。

## 配信場所の移植性（サブパス非依存）

このアプリは **配信場所に依存しない**。GitHub Pages のサブパス
（`https://aikatsukamen.github.io/kktjs/`）でも、独自ドメインのルート
（`https://example.com/`）でも、任意のサブパスでも、設定変更なしで動く。

- 資産パス（画像など）は `/kktjs/...` のような固定の絶対パスを直書きせず、実行時に
  ベースパスを検出して解決する（`src/core/base-path.ts`）。検出順は
  「`<base href>` → 本モジュールの `import.meta.url`（Vite 生成 `assets/index-[hash].js` の
  位置）→ `script[src*="/assets/"]`（後方互換で `js/main.js` も）→ `location.pathname`」。
  ルート配信でもサブパス配信でも正しく `base` を導出することを実ブラウザで確認済み。
- `index.html` は相対パス（`css/style.css` 等）で資産を読み、Vite は `base: './'` で生成
  アセットを相対パス（`./assets/...`）出力する。SW 登録も `scope: './'`。
- `public/sw.js` のキャッシュ対象は `self.registration.scope`（= 配信ディレクトリ）
  基準で組み立てるため、置き場所に追従する。
- legacy 側の `IMG_DUMMY` も `base-path.ts` の `getBasePath()`（上記検出）からベースを得る。

### 唯一のデプロイ依存項目: OAuth リダイレクト URL

`src/core/constants.ts` の `REDIRECT_URL`（および legacy の `redirect_url`）だけは、
**Mastodon アプリ登録時に申請した値と完全一致する必要がある**ため自動化できない。
配信先 URL を変える場合は、Mastodon 側のアプリ設定の Redirect URI と、この値の
両方を新しい URL に合わせること（`src/core/base-path.ts` の `getAppOrigin()` で
実行時に導出することも可能だが、登録値と一致していなければ認証は通らない）。

## Service Worker のキャッシュ更新（重要）

`public/sw.js` は固定ファイルリストをプリキャッシュする。Vite が生成するアプリ本体
（`assets/index-[hash].js` / `.css`）はビルドごとに名前が変わるためプリキャッシュリストには
載せず、`fetch` ハンドラのランタイムキャッシュ（同一オリジンの `assets/*`）で取り込む。
CSS/フォント/画像など固定名アセットのキャッシュを更新させるには **`const key`（現在
`v1.12.3_version_display_cleanup_1`）をリリースごとに変更**すること。これは元実装の運用を踏襲している。
（更新検知ロジック自体は誤通知しないよう修正済み。）

---

## TS 移行のパターン（完了済み・参照用）

メソッドの TS 移行は**全 257 件が完了済み**。`legacy/app-core.ts` の各メソッドは
型付きモジュールへ委譲する薄いスタブになっている。新たにメソッドを足す場合や、
仕組みを理解したい場合のために手順を残す。**`fetchHome` が実装例**。

1. 実装したいメソッドを `src/`（多くは `app/`）に型付きで書く。Vue インスタンス
   依存部分は引数 `app` で受け取る（`api/endpoints.ts` の `fillEndpoint` で URL を
   型安全に組む）。
2. `src/core/register-methods.ts` の `methods` に登録する。
3. legacy 側に、レジストリへ委譲する薄いスタブを置く:
   ```js
   'fetchHome': function () {
     if (window.__kktjsMethods && window.__kktjsMethods.fetchHome) {
       return window.__kktjsMethods.fetchHome(this);
     }
   },
   ```
   → `created()` など Vue 初期化中の呼び出しにも対応できる（レジストリは
   legacy 読み込み前に登録されるため）。debounce 対象は `_.debounce(委譲, TIME)` の
   ラッパを legacy 側に保持し、内側の関数だけ委譲する（timing を保つため）。
4. モジュール境界を跨ぐ共有状態（ソケット変数・メディア処理用の可変グローバル等）が
   必要なら、legacy が `new Vue` より前に window ブリッジへ公開し、TS 側から参照する
   （後述「legacy ↔ TS のブリッジ」）。
5. `npm run typecheck` / `npm run build` と実機確認。

### 移行状況

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
- `core/content-format.ts`: formatContent / formatSpoiler / formatContentConfirm /
  formatSpoilerConfirm / formatEmoji / formatEmojiDraft（絵文字画像化＋インスタンス内
  リンクのアプリ内ナビゲーション書き換え）
- `app/display-wrappers.ts`: updateWrapperBM / updateWrapperAll / updateWrapper /
  updateFilterBM / updateFilterAll / updateImgLoading / updateVote（開閉フラグ・NGワード
  フィルタ・投票反映の全カラム整形）
- `app/notif-helpers.ts`: notifJudge / countNotifUnread / addSpoiler / restoreSpoiler /
  disableSpoiler / addContent
- `app/editor-helpers.ts`: contentExchange / contentToDraft / draftToContent
- `app/list-stream.ts`: fetchStreamList / fetchListListed / fetchListListedBackup /
  fetchListSearch / fetchListFollow / fetchListFollower / fetchListAcctRelation
- `app/config.ts`: deleteConf / deleteToken
- `app/ui-toggles.ts`: toggle* 全18（表示パネル/フォームのトグル）
- `app/column-scroll.ts`: up/back/next Home/Local/Multi + upNotif +
  updateMediaWrapper / updateContentWrapper
- `app/external-links.ts`: openThisPage / openAuth / openProfile / openMastodon /
  openAbout / openPolicy / openWiki / openDirectry / openEmoji / closeEmoji
- `app/system.ts`: setResizer / setHistory / setNotifSound / resetColumn /
  addStreamHashtag / removeStreamHashtag / serviceWorkerUpdateCheck / reloadForce /
  reopenForce / confirm / countFollowRequest
- `app/run-actions.ts`: run* 全24（runInit/runCustom/runHome/.../runAddList/runExtime
  などのオーケストレーション）
- `app/scroll-handlers.ts`: handleWheel / handleScrollHome/Local/Multi/Notif/Acct
  （debounce ラッパは legacy 残置、本体のみ委譲）
- `app/refetch-actions.ts`: refetchHome/Local/Multi/NotifAll / refreshCount /
  checkStreamListText / checkListProfile（同上 debounce 委譲）
- `app/posting-actions.ts`: checkStreamHashtag / actVote / setVote / actReport /
  actProfile / actListProfile / checkActMedia / actMedia / removeMedia / saveKatsu /
  actKatsuShortCut / actKatsu / refreshKatsu / katsuToDraft / draftToKatsu / checkKatsu /
  jumpKatsu（メディアの可変状態は window.__kktjsMedia ブリッジ経由）
- `app/auth-config.ts`: fetchToken / fetchUser / loadConf / saveConf / resetConf
- `app/streaming.ts`: openWsHome / reopenWsHome / openWsLocal / reopenWsLocal /
  openWsMulti / reopenWsMulti（ソケット変数は window.__kktjsStream ブリッジ経由。
  本番検証済みの重複防止・再接続ロジックを忠実に維持）
- `app/discord.ts`: handleScrollDiscord / fetchTokenDiscord / refetchTokenDiscord /
  actKatsuDiscord / fetchUserDiscord / fetchSocketDiscord / fetchDiscord /
  openWsDiscord / reopenWsDiscord

**移行済み: 257/257 メソッド（全件）。`src/` は全て TypeScript（`.js` ソースなし）。**
最後まで残っていた Vue 起動ハーネスも `legacy/app-core.ts`（`@ts-nocheck` なしで型付け
済み・約1,700行）へ変換し、ソースの 100% TS 化を完了した。`app-core.ts` の中身は
Vue インスタンス定義（`data` / `created` / `watch` / `computed`）、共有 `kktjs*` 関数、
タッチ/スワイプ/ドラッグ&ペースト等のグローバル関数、モジュールグローバル、window
ブリッジ群。メソッド本体は `app/*.ts` 等にあり、`app-core.ts` 側は委譲スタブ。
- `app/vue-setup.ts`: コンポーネント/ディレクティブ登録
- `features/*`: ビューポート高さ / 復帰再接続

> 補足: `app-core.ts` の型付けは「挙動を一切変えない」ことを最優先にした最小限のもの。
> `data`（リアクティブ状態）や委譲スタブは `any` 中心で、obfuscation 由来の `!![]`/`![]`
> は等価な `true`/`false` へ機械置換しただけ。ロジックには手を入れていない。
> esbuild は `this: any` 等の型注釈を除去するため、ランタイム挙動はビルド前と同一。

### app-core.ts ↔ 切り出しモジュールのブリッジ

`app-core.ts` と切り出した各モジュールは別の esbuild モジュールとして束ねられるため、
モジュール境界を跨ぐ共有状態は `app-core.ts` が `new Vue` より前に window へ公開し、
各モジュールはこれを参照する:
- `__kktjsMethods`: 切り出した実体メソッド群（main.ts が app-core より先に登録）
- `__kktjsConf`: OAuth/各種URLなどデプロイ依存定数
- `__kktjsAudioContext`: 通知音用 AudioContext
- `__kktjsMedia`: メディア処理の可変グローバル（getter/setter）
- `__kktjsStream`: ソケット変数 ws* / ST_* 定数 / dedup ヘルパ / lodash

`app-core.ts` の Vue methods/computed は `window.__kktjsMethods['name'](this, ...)` へ
委譲する薄いスタブ（debounce 対象は `_.debounce(委譲, TIME)` のラッパを保持）。

### 拡大画像の操作と保存

拡大表示はライトボックス方式。

- **閉じる**: 右上の × ボタン、または画像の外側（暗い領域）をタップ。
- **保存**: 画像を**長押し**（モバイル）／**右クリック**（PC）してブラウザ標準の
  「写真に追加／画像を保存」メニューから保存する。`* { -webkit-touch-callout: none }` を
  `.fullimage` で打ち消して長押しメニューを有効化している。
- アプリ独自の保存ボタンは廃止した。メディアは別ドメイン `files.<instance>` 配信で
  CORS が配信元オリジン限定のため、JS から保存ダイアログを出すことは（同一オリジン配信
  でない限り）できない。標準ジェスチャに一本化するのが確実で分かりやすいため。
- 共通基盤: `api/endpoints.ts`（+ fillEndpoint）/ `api/client.ts`（apiGet / parseMaxId）/
  `core/constants.ts` / `types/*`

### 移行の方針メモ

全メソッドを移行したが、性質によりやり方を分けている:

- **手書き移行**（型安全の利得が高いもの）: utils / formatters / predicates / api 層 /
  timeline / notifications / accounts などのデータ層と、content-format / display-wrappers
  といった表示整形の中核。
- **機械変換移行**（純粋に this ベースで量が多いもの）: run-actions / scroll-handlers /
  refetch-actions / posting-actions / auth-config / streaming / discord。`this['x']→a.x`、
  `!![]→true` 等を機械的に置換し、エンドポイント/ヘルパは既存の型付きモジュールへ寄せた。
- **debounce 対象**: `_.debounce(fn, TIME)` のラッパは legacy に残し、内側 fn のみ TS へ
  委譲（timing を厳密に保つため）。
- **ストリーミング/メディア/Discord**: 本番検証済みの重複防止・再接続ロジックや、複数
  メソッドで共有される可変グローバルを含むため、ロジックは丸ごと TS へ移しつつ、共有
  状態は window ブリッジ経由で legacy のモジュールスコープへ読み書きする形にした
  （挙動を変えないことを最優先）。

機械変換したモジュールは手書きより回帰リスクが高い。型チェック・ビルドに加え、
バンドルに元メソッド名が全て残っていること（元実装由来の 243 個のユニークなメソッド名
シンボルがビルド成果物に存在する確認。メソッド定義は計 257 だが名前ベースでは 243）は
CI で担保できるが、実際の動作確認は実機/ブラウザで行う必要がある（Vue 2 は Node 上で
完全起動できないため）。

### 起動時検証（jsdom）と、それが検出した既存バグ

完全な実ブラウザは使えない環境でも、jsdom に `index.html` を読ませてベンダ JS →
`main.js` の順に実行し、「実行時エラーなく起動するか」「Vue がマウントされ認証画面が
描画されるか」「`__kktjsMethods` が全件登録されるか」を機械的に確認できる。さらに
localStorage にトークンを入れてログイン済み状態を模し、移行メソッド（トグル / run系 /
スクロール / streaming の `openWs*` / 投稿系）を実際に呼び出して例外が出ないかも検証した。

この検証が、**機械変換による既存バグを 4 系統検出した**（いずれも該当メソッドが呼ばれた
ときだけ顕在化するため、単なる「起動するか」の確認では見つからなかった）:

1. ブリッジの import 時キャプチャ: `streaming.ts` / `discord.ts` / `auth-config.ts` が
   `const S = window.__kktjsStream` をモジュール先頭で評価していたため、ブリッジ設定前
   （register-methods の import 時）に `undefined` を固定していた。→ 各関数の内側で実行時に
   読むよう遅延化。
2. 実在しないグローバル参照: 機械変換モジュールが `declare const HOME` 等で定数を
   参照していたが、それらは `app-core.ts` のモジュールローカル `const` であり実行時
   グローバルにならない（esbuild が `HOME2` 等へリネーム）。→ `api/endpoints.ts` /
   `core/constants.ts` からの実 import に置換（値が完全一致することを確認済み）。
3. 可変スクロール閾値: `threshold_low` / `threshold_high` は `created` で iOS/Safari 時に
   `0` へ再代入される。→ `__kktjsConf` の getter ブリッジ経由にして再代入を反映。
4. 変換漏れ: OAuth リクエストボディのキー名が `'client_id'` であるべき所が一括置換の
   事故で `'C.client_id'` になっていた件と、`thisObj.multi_type` であるべき所が bare
   `multi_type`（未定義）になっていた件。→ 修正。
5. inline `onerror` からのグローバル参照: 全 `<img onerror="this.src=IMG_DUMMY">`（素の
   HTML 属性なのでグローバルスコープで評価される）が `IMG_DUMMY` を参照するが、IIFE
   バンドル化でモジュールローカルになり `window` から消えていた（元の難読化 main.js では
   トップレベル `var` で window に乗っていた）。画像読み込み失敗時のみ顕在化する。
   → `window.IMG_DUMMY = IMG_DUMMY` を再公開（実ブラウザでの画面表示確認中に通知/投稿
   フォーム画面で検出）。`autogrow` 等の他の inline ハンドラは既に window 公開済みで問題なし。

教訓: 「起動はするがメソッドを呼ぶと落ちる」類のバグは、起動確認だけでは漏れる。
機械変換したモジュールは、ログイン後に走る経路（`created` から呼ばれる `openWs*` /
`refetch*` / `run*` など）まで実際に叩いて確認する価値がある。さらに、各画面を実際に
レンダリングするまで見つからないバグ（上記5の inline `onerror`）もあるため、ログイン後の
主要画面（ホーム/ローカル/通知/詳細/検索/投稿フォーム等）を実際に描画して確認するとよい。

なお jsdom だけでなく**実ブラウザ（Chromium）での E2E 検証**も実施済み（起動 → 認証画面の
実レンダリング → ログイン後メソッド呼び出し → スクリーンショット）。ブラウザ実行ファイルの
場所・playwright-core の使い方・「サーバはテストプロセス内で起動し常駐させない」という
コンテナ環境の注意点は [`docs-dev/BROWSER_TESTING.md`](docs-dev/BROWSER_TESTING.md) に記載。


### 注意点

- `legacy/app-core.ts` は `const` だった一部変数を `let` に直してある
  （`ST_DISCORD` / `directUrl`。元コードは難読化で再代入していた）。
- `legacy/app-core.ts` は元 `main.js` の解読版を最後まで TS 化したもの。`@ts-nocheck` を
  外して型付けしたが、難読化由来のコードなので `any` 中心・最小限。`!![]`/`![]` は等価な
  `true`/`false` へ機械置換しただけで、ロジックは変えていない（挙動維持が最優先）。
- `tsconfig.json` は移行しやすいよう `strictNullChecks` / `noImplicitAny` を緩めている。
- バンドルは Node 上では完全起動できない（Vue 2 がブラウザ環境を要求）。
  動作確認は実機/ブラウザで。型チェックとビルド可否は CI で担保。

## ライセンス

MIT（`package.json` 参照）。
