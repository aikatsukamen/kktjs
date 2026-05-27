# SFC 全面移行 引き継ぎガイド

`public/index.html` に inline で書かれている Vue テンプレート（x-template モーダル群と
巨大な `#app` ツリー）を、段階的に SFC（`.vue`）へ切り出すための引き継ぎ。Vue 3 +
Vite + `@vitejs/plugin-vue` の土台は導入済みで、SFC は **`src/components/VersionBadge.vue`
が動作実証として既に本番ビルドに含まれている**（このパターンを横展開していく）。

> 前提として、Vue 2→3 移行と Vite/SFC ビルド基盤は完了済み。本ガイドは「inline テンプレートを
> `.vue` へ移す」という**独立した大型タスク**のためのもの。`docs-dev/VUE3_MIGRATION.md`
> 「さらに先へ進む場合」も合わせて読むこと。

---

## 現状の規模（着手前に把握すべき数字）

`public/index.html` は **約3,790行**。テンプレートの主な構成要素（実測）:

| 要素 | 数 | 備考 |
|---|---|---|
| `v-if` | 731 | `v-else` 485 と対 |
| `v-for` | 88 | うち `v-for`+`v-if` 同居は `<template v-for>` 化済み |
| `v-on:` | 593 | `@click` 17 と併用 |
| `v-model` | 48 | 設定パネルのトグル/フォーム入力 |
| `v-html` | 107 | 投稿本文・絵文字・名前など（`formatEmoji` 等の出力） |
| `{{ }}` 補間 | 336 | |
| `:class` | 92 / `:src` 94 | |
| テンプレートから呼ぶメソッド | 約191種 | `window.app` のメソッド（全て TS 移行済み） |
| inline native ハンドラ | `onerror` 69 / `onkeyup` 2 | `onerror="this.src=IMG_DUMMY"` が大半 |

この規模なので、**一括ではなく単位ごとに切り出す**こと。1 コンポーネント移すたびに
ビルド・型チェック・実ブラウザ確認（後述の検証ハーネス）を回す。

---

## 全体構造（切り出しの単位）

`#app`（マウントコンテナ）の中は大きく2ブロック:

- **`#base`**（`class="flex column-list"`, L542〜）: 常設カラム群。各カラムは
  `class="scrollable"` の div。
  - `#home`（L759, `v-if="showHome"`） / `#local`（L1031） / `#notif`（L1192） /
    `#multi`（L1411, 2箇所） / `#acct`（L2176）
- **`#over`**（`class="flex column-list-over"`, L2639〜）: オーバーレイ群。
  - 設定パネル（`showSetting`） / 検索（`showSearch`） / ストリーム編集（`showStream`/`showStreamEdit`） /
    投稿フォーム（`showForm`、CW/本文/投票/下書き、L3160 付近） / 詳細（`showDetail`） / リンク類
- **モーダル**（`#app` 直下）: `media` / `emojipicker` / `confirm` / `info`（既に x-template
  コンポーネント。`src/app/vue-setup.ts` で登録。SFC 化の手始めに向く）

### 最優先の切り出し対象: `Status`（投稿カード）

**`class="status-wrapper"` のマークアップが 8 箇所に重複**している
（home / local / notif / multi×2 / discord / acct_pinned / accts）。投稿1件の表示
（アバター・表示名・本文 `v-html`・メディア・投票・reblog・各種アクションボタン・
NGワード/開閉フラグ）はどれもほぼ同じ。これを **1つの `<Status :issue="issue">`
コンポーネント**へ統合するのが、最も重複削減効果が大きく、回帰検証もしやすい
最初の一歩。各カラムの `v-for` 内側を `<Status :issue="issue" ... />` に置き換える。

切り出し順の推奨:
1. `media`/`emojipicker`/`confirm`/`info` モーダルを x-template → `.vue` へ（小さく安全。
   現状の `{ template: '#modal-*' }` 登録を SFC import に置換）。
2. `Status`（投稿カード）— 最大の重複。`Poll`（投票）/`MediaAttachments`/`StatusActions`
   などへさらに分解してよい。
3. 各カラム（`HomeColumn` 等）— `Status` を使う薄いラッパに。
4. 設定パネル・投稿フォーム — `v-model` が多いので最後に。

---

## 移行の技術的な要点（このコード固有の罠）

### 1. `window.app` への依存をどう渡すか

現状テンプレートは Vue インスタンス（`window.app`）の data/computed/methods を直接参照
している（`showHome`、`formatEmoji(...)`、`runAcct(...)` など約191メソッド）。SFC へ
切り出すと、これらは props / emits / inject で渡す必要がある。

- **暫定（移行を楽にする）**: 各 SFC から `window.app` を直接呼ぶ（`window.app.runAcct(...)`)。
  挙動は変わらず、まず構造だけ SFC 化できる。`VersionBadge.vue` は props で受けているが、
  アクションを伴うものは当面 `window.app` 呼び出しで繋ぐのが現実的。
- **本来形（段階的に）**: ルートを `createApp` で SFC 化し、状態を `provide/inject` か
  Pinia 等のストアへ移す。`app-core.ts` の巨大 `data` を整理する大仕事になるので後回しでよい。

### 2. `IMG_DUMMY`（inline `onerror`）

`onerror="this.src=IMG_DUMMY"` が 69 箇所。これは**素の HTML 属性**でグローバルスコープ
評価されるため `window.IMG_DUMMY` に依存している（過去にバンドル化で消えて再公開した経緯。
README「起動時検証が検出した既存バグ」参照）。SFC 内でも `onerror` を文字列属性のまま使うなら
`window.IMG_DUMMY` が必要。SFC 化のついでに `@error` ハンドラ + メソッド化すると window 依存を
減らせる（任意）。

### 3. inline ハンドラ用グローバル関数

`autogrow` / `inputVote` / `inputSearch` / `inputList` / `inputListProfile` /
`inputKatsuFilterRaw` / `changeAppActive` / `import*`（drag&drop/paste）が
`window` 公開され、テンプレートの `onkeyup=` 等から呼ばれている（`src/main.ts` /
`app-core.ts` で公開）。SFC 化時は `@keyup` 等の Vue イベントへ移し、メソッド化すると
window 公開を段階的に外せる。

### 4. カスタムディレクティブ（`v-restore-*` / `v-focus` / `v-play`）

`src/app/vue-setup.ts` に Vue 3 形式（`mounted`）で登録済み。SFC でもそのまま使えるが、
これらは `window.app.$data` を読む実装なので、状態の持ち方を変えるなら追従が必要。

### 5. `v-html` の中身（XSS と絵文字）

`formatEmoji` / `formatContent` 系（`src/core/content-format.ts`）が HTML 文字列を組み立てて
`v-html` で描画している。インスタンス内リンクのアプリ内ナビゲーション書き換えや絵文字画像化を
含むため、SFC 化しても**この整形ロジックは流用**する（コンポーネント側で `v-html` に渡す）。

### 6. テーマ class とマウント構造

Vue 3 の `mount('#app')` 対応で、テーマ `:class="[optTheme...]"` は `#app` 直下の単一ルート
ラッパ div に載せてある（`#app` 自身は native ハンドラ用コンテナ）。全面 SFC 化で root を
`App.vue` 化する場合も、この「テーマ class を持つ単一ルート」を踏襲すること。

### 7. CDN グローバル vs npm import

現状 `vue`/`lodash`/`emojione` は CDN グローバルを `vite.config.ts` の仮想モジュールで
external 解決している。全面 SFC 化で完全 HMR が欲しくなったら、`index.html` を Vite エントリ
方式へ作り替え、`vue` を import に統一する（`docs-dev/VUE3_MIGRATION.md`「さらに先へ進む場合」）。
ただし SFC 化と CDN→import 切替は**別々に**進める方が安全（同時にやると切り分け困難）。

---

## 1コンポーネント移行の手順（テンプレート）

`VersionBadge.vue` を雛形に、次の流れを繰り返す:

1. 対象マークアップを `src/components/Xxx.vue` の `<template>` へ移す
   （`<script lang="ts">` + `defineComponent`、必要な props/emits を定義）。
2. `src/app/vue-setup.ts` で `app.component('xxx', Xxx)` 登録
   （x-template の `{ template: '#...' }` を置換、または新規追加）。
3. `public/index.html` の元マークアップを `<xxx ... />` 使用に置換
   （または x-template `<script type="text/x-template">` を削除）。
4. アクション/状態は当面 `window.app.*` 経由で繋ぐ（前述「暫定」）。
5. `npm run typecheck`（vue-tsc）→ `npm run build`（vite）。
6. **実ブラウザ検証**（下記）で、その画面が描画され Vue 警告/エラーが出ないこと、
   切り出し前と同じ挙動（投票・メディア・アクション）を確認。

---

## 検証方法（毎回回す）

`docs-dev/BROWSER_TESTING.md` の手順で実ブラウザ確認する。作業時に使った検証スクリプトの型:

- **起動 + ログイン後メソッド呼び出し**: `window.app` 生成 / `__kktjsMethods` 全件 /
  ブリッジ4種 / 認証画面レンダリング / `openWs*`・`refetch*`・`run*` が例外なく動くか。
- **各画面の実描画**: ダミー status/account/notif を注入して home/local/notif/multi/detail/
  search/form/各モーダルを描画し、コンソールの `[Vue warn]` / 実行時エラーが**ゼロ**であること。
  特に切り出した `Status` は、投票（expired/active）・reblog・メディアの分岐をデータで網羅する。
- **`v-for`+`v-if` フィルタ**: `home_unread` を変えて表示件数が正しく絞られるか
  （Vue 3 の優先順位対応が効いているかの回帰確認）。
- **iOS エミュレーション**: iPhone UA で `ua='ios'` 判定・`threshold` ゼロ化・`--vh` 補正・
  ホーム追加バナーが出るか（`docs-dev/BROWSER_TESTING.md`）。

> コンテナ環境の注意: プレビューサーバは**テストプロセス内で `createServer` し、終了時に
> 必ず `close()`** する（常駐させると次のビルドとポート衝突する）。`npm run dev`（`dev.mjs`）は
> watch 中 `emptyOutDir:false` で docs を消さない設計（初回ビルド完了を待って配信）。

---

## やってはいけない / 注意

- **一括全面置換をしない**。1コンポーネントずつ、検証を挟む。
- **整形ロジック（content-format / formatters）を作り直さない**。流用する（XSS/絵文字/
  アプリ内リンク書き換えのテスト済み挙動を壊さない）。
- **`app-core.ts` の data 構造をいきなり作り直さない**。まず `window.app` 経由で繋ぎ、
  状態管理の刷新は SFC 化が一通り済んでから別タスクで。
- **CDN→import 切替と SFC 化を同時にやらない**。
- 変更のたびに `public/sw.js` の `const key` を bump（キャッシュ更新。README 参照）。

---

## 参考ファイル

- 実装済み SFC の雛形: `src/components/VersionBadge.vue`
- コンポーネント/ディレクティブ登録: `src/app/vue-setup.ts`
- ルート定義（data/created/watch/computed・委譲スタブ）: `src/legacy/app-core.ts`
- メソッド本体: `src/app/*.ts`（全257件 TS 化済み）
- 整形ロジック: `src/core/content-format.ts` / `src/core/formatters.ts`
- ビルド: `vite.config.ts` / `build.config.mjs`、dev: `dev.mjs`
- Vue 3 移行の経緯と「さらに先へ」: `docs-dev/VUE3_MIGRATION.md`
- 実ブラウザ検証手順: `docs-dev/BROWSER_TESTING.md`
- 開発環境: `docs-dev/DEVCONTAINER.md`
