# Vue 2 → Vue 3 移行ガイド

> **ステータス: 移行完了（Vue 3.5.34）。** 以下は移行時に実際へ適用した変更の記録
> 兼リファレンス。各項目は「対応済み」。今後コンポーネントやディレクティブを追加する際の
> 注意点としても参照できる。実装の所在・検証結果は README「Vue のバージョンについて」も参照。
>
> 適用済みの変更（要約）:
> - `new Vue({el,data:{}})` → `Vue.createApp({data(){return{}}}).mount('#app')`
>   （`src/legacy/app-core.ts`）。`window.app` は `mount()` の戻り値（公開インスタンス）。
> - `Vue.component`/`Vue.directive` → `app.component`/`app.directive`、`inserted`→`mounted`
>   （`src/app/vue-setup.ts`、`registerVueComponentsAndDirectives(app)` を `createApp` 後・
>   `mount` 前に呼ぶ。`src/core/register-methods.ts` からの呼び出しは撤去）。
> - `slot="header"` → `<template #header>`（`public/index.html` の4モーダル）。
> - `v-for`+`v-if` 同居27箇所を `<template v-for :key>` でラップ（`public/index.html`）。
> - `app._data` → `app.$data`（src + index.html 計82箇所、Vue 2/3 両対応の公開プロキシ）。
> - Vue 3 の mount 仕様に合わせ、`#app` のテーマ `:class` を内側ラッパ div へ移設。
> - vendor を `vue.global.prod.js`（v3.5.34）へ差し替え、`public/sw.js` のキャッシュキー bump。
> - `$forceUpdate`（約87箇所）は安全側で残置（無害。安定後に段階削除可）。
>
> 型チェック・本番ビルド・実ブラウザ検証（起動／ログイン後メソッド呼び出し／全カラム・
> モーダルの実描画。Vue 警告・実行時エラーともゼロ）まで通過済み。

Vue 2 は 2023年末で EOL（サポート終了）。本ドキュメントは、このコードベースを
Vue 3 へ移行する際に**実際に修正が必要だった箇所**を、コード調査に基づいて列挙したもの
（すべて対応済み）。

---

## 移行方式の選択

1. **フル移行**（本ガイドの対象）: 破壊的変更を直接修正する。最終的に最もクリーン。
2. **互換ビルド `@vue/compat`**: Vue 3 を Vue 2 互換モードで動かし、警告を見ながら
   段階的に直す。中間的なリスク。`vue.min.js` を `@vue/compat` 版へ差し替え、
   `configureCompat` で挙動を制御する。大規模・一括移行が難しい場合に有効。

どちらでも、下記の破壊的変更への対応は最終的に必要。

---

## 要修正箇所（このコードベースで実在するもの）

### 1. グローバル API → アプリケーションインスタンス API

Vue 3 ではグローバル登録が廃止され、`createApp` が返すインスタンスに対して行う。

**現状（コンポーネント/ディレクティブ登録は `src/app/vue-setup.ts`、`new Vue` は
`src/legacy/app-core.ts`）**
```js
// src/app/vue-setup.ts の registerVueComponentsAndDirectives() 内
Vue.component('media',   { template: '#modal-media' });
Vue.component('emojipicker', { template: '#modal-input' });
Vue.component('confirm', { template: '#modal-confirm' });
Vue.component('info',    { template: '#modal-info' });
Vue.directive('play', function (el) { el.play(); });
// ... directive 計9個 ...
// src/legacy/app-core.ts 側
var app = new Vue({ el: '#app', data: {...}, ... });
```

**Vue 3**
```js
const app = Vue.createApp({ data() { return {...}; }, ... });
app.component('media',  { template: '#modal-media' });
app.component('emojipicker', { template: '#modal-input' });
app.component('confirm', { template: '#modal-confirm' });
app.component('info',   { template: '#modal-info' });
app.directive('play', { mounted(el) { el.play(); } });  // ↓ 2 を参照
// ... directive 登録 ...
const vm = app.mount('#app');   // el オプションは廃止、mount で指定
window.app = vm;                // 既存コードが window.app を参照するため
```

注意:
- `el: '#app'` は廃止。`app.mount('#app')` を使う。
- `data: {...}`（オブジェクト）は `data() { return {...}; }`（関数）にする
  （Vue 2 でもルートは可だったが、Vue 3 では関数必須）。
- `window.app` には `mount()` の戻り値（公開インスタンス）を入れること。
  `createApp` の戻り値とは別物。

### 2. カスタムディレクティブのフック名変更（9個すべて）

Vue 3 でディレクティブのライフサイクルフック名が Vue コンポーネントに揃えられた。
`inserted` → `mounted`、`bind` → `beforeMount` など。

**現状**: `inserted` を使うディレクティブが 8個
（`focus` / `restore-s` / `restore-c` / `restore-kfr` / `restore-vote0..3`）。
さらに `play` は関数省略記法 `Vue.directive('play', fn)`。

**Vue 3**
```js
// 関数省略記法は mounted + updated として扱われる。挙動を固定したいなら明示する:
app.directive('play', { mounted(el) { el.play(); } });

// inserted → mounted
app.directive('focus', { mounted(el) { el.focus(); } });
app.directive('restore-s', { mounted(el) { el.value = app._data.katsu_spoiler_text; app.refreshCount(); } });
// restore-c / restore-kfr / restore-vote0..3 も同様に inserted を mounted へ。
```

### 3. 名前付きスロット構文 `slot="..."` の廃止（`public/index.html` 4箇所）

Vue 2 の `slot="header"` 属性は Vue 3 で廃止。`v-slot:header`（短縮 `#header`）に変更。
該当箇所（index.html）:
- L159 `<div ... slot="header">`（media モーダル）
- L168 `<span slot="header">`（emojipicker）
- L187 `<div slot="header">`（confirm）
- L506 `<span slot="header">`（info）

**変更例**
```html
<!-- 旧 -->
<media v-if="showMedia">
  <div class="modalbutton ..." slot="header"> ... </div>
</media>

<!-- 新（v-slot は <template> に付けるのが基本） -->
<media v-if="showMedia">
  <template #header>
    <div class="modalbutton ..."> ... </div>
  </template>
</media>
```
コンポーネント側 `<slot name="header">` はそのままでよい。

### 4. リアクティビティの変更と `$forceUpdate`（最大の注意点・約87箇所）

Vue 2 は `Object.defineProperty` ベースで、配列インデックスへの直接代入
（`arr[i] = x`）やオブジェクトへのプロパティ追加が検知されなかった。本コードは
それを補うため `$forceUpdate()` を多用している（src 全体で約 87 回。TS 移行により
大半は `app/*.ts` 側に存在し、`app.$forceUpdate()` の形で呼ばれる。legacy 側は
わずか）。

Vue 3 は Proxy ベースで、これらの変更も基本的に検知される。多くの `$forceUpdate`
は不要になるが、**削除すると逆に依存していた再描画が消えて表示不具合が出る場合がある**。

移行方針（安全側）:
- まずは `$forceUpdate` を**残したまま** Vue 3 で動かす（無害だが冗長になるだけ）。
- 実機で全機能（Home/Local/Multi/通知/詳細/アカウント/検索/投稿/投票/メディア/
  ストリーミング更新）を確認し、表示崩れ・未更新がないか検証する。
- 安定後、`$forceUpdate` を段階的に削っていく（任意）。

`Vue.set` / `Vue.delete` は本コードでは未使用（調査済み）なので対応不要。

### 5. その他（このコードでは該当が少ないが確認推奨）

- `$on` / `$off` / `$once`（イベントバス）: 本コードでは未使用。
- フィルタ `{{ x | filter }}`: 本コードでは未使用。
- `v-model` のカスタムコンポーネント引数変更: ルートのフォームは素の input なので影響小。
- トランジションのクラス名変更（`v-enter` → `v-enter-from` 等）: `style.css` に
  `.media-enter` 等のトランジションクラスがあれば確認する。

---

## ビルド/依存の変更

- `public/js/vue.min.js`（Vue 2 グローバルビルド）を Vue 3 のグローバルビルド
  （`vue.global.prod.js`）へ差し替える。`window.Vue` を使う構成は維持できる。
- `build.mjs` の external 設定（`vue` → `window.Vue`）はそのままでよい。
- 互換ビルドを使う場合は `@vue/compat` のグローバルビルドに差し替え、
  `Vue.configureCompat({ MODE: 2 })` 等を `app-core` の先頭で設定する。

## 検証

- `npm run typecheck` と `npm run build` が通ること。
- **実機での全機能確認が必須**（リアクティビティ差異は静的解析で検出不可）。
- iOS Safari での確認も（本クライアントの主対象環境のため）。

---

## Vite + SFC 導入（**導入済み**）

> 注: 本節は Vite 導入「当初」の構成（lib モード + CDN グローバル）を記録したもの。その後
> **Vite 標準のエントリ方式へ全面移行済み**（CDN の Vue を import 化、`index.html` をルートへ、
> 真の HMR、`build.mjs`/`build.config.mjs`/`dev.mjs` 廃止）。現在の構成は後段
> 「Vite 標準エントリ方式へ移行済み（真の HMR）」を参照。以下は経緯として残す。

Vue 3 移行とセットで Vite を導入済み。Vite の真価は **SFC(.vue) のコンパイルと
開発サーバ + HMR** にあるため、Vue 3 化と同時に入れた。本番ビルドは Vite
（`vite.config.ts`）、型チェックは `vue-tsc`。

### 実装した構成

- **`vite.config.ts`（新規）**: 既存運用との互換を最優先。
  - `src/main.ts` を **IIFE で `docs/js/main.js`** に出力（既存 index.html の
    `<script src="js/main.js">` 構成を維持。lib モード）。
  - `public/` を `docs/` へコピー（`publicDir`）。SFC の `<style scoped>` は
    `docs/style.css` に抽出され、index.html がこれを読む（CSS link を追加済み）。
  - **CDN グローバル external 維持**: `vue`/`lodash`/`emojione` の `import` を、仮想
    モジュールプラグイン（`globalsExternal`）で `window.Vue` 等へ解決する（esbuild の
    `globalsPlugin` と等価）。`vue` だけは SFC が生成する named import
    （`import { openBlock, ... } from 'vue'`）に対応するため、`node_modules/vue` の
    public named export を列挙して `window.Vue` から静的に再 export するファサードを返す。
  - 共有設定（エントリ/出力/external など）は `vite.config.ts` に集約（当初は
    `build.config.mjs` に分離していたが、esbuild ビルド廃止に伴い vite.config.ts へ内包）。
- **SFC 動作実証**: `src/components/VersionBadge.vue` を追加し、`vue-setup.ts` で
  `app.component('version-badge', ...)` 登録。index.html の設定パネルに配置。本番ビルド
  （実 Chromium）でバッジが描画されることを確認済み（`@vitejs/plugin-vue` が機能）。
- **型付け**: `src/types/shims-vue.d.ts`（`.vue` の ambient 宣言）を追加。`modules.d.ts`
  の `vue` any シムは削除し、実 Vue 3 型を使う（`vue-tsc` で SFC を型解決）。`tsconfig` の
  include に `src/**/*.vue` を追加。
- **scripts**: `build`=`vite build` / `dev`=`vite`（HMR 付き）/ `preview`=`vite preview`
  / `typecheck`=`vue-tsc --noEmit`。CI（deploy.yml）は `typecheck`→`build` を呼ぶだけなので
  変更不要。`package-lock.json` は更新済み。

### Vite 標準エントリ方式へ移行済み（真の HMR）

当初は「`index.html` が固定で `js/main.js` と CDN グローバルを読む」前提で lib モード +
独自 dev サーバ（`dev.mjs`）を使っていたが、その後 **Vite 標準のエントリ方式へ全面移行した**:

1. **CDN グローバルをやめ `vue` を import に統一** — `app-core.ts` の `declare const Vue` を
   `import * as Vue from 'vue'` に。`public/js/vue.min.js` を削除。`vite.config.ts` で
   `vue/dist/vue.esm-bundler.js`（コンパイラ同梱）へエイリアスし、`__VUE_OPTIONS_API__` 等の
   フィーチャーフラグを `define`（inline テンプレートの実行時コンパイルに必須）。
   lodash / emojione は CDN external のまま。
2. **`index.html` をプロジェクトルートへ移動**し、`<script type="module" src="/src/main.ts">`
   をエントリに。
3. `vite.config.ts` を lib モード → 標準 HTML エントリ方式へ。`base: './'` で生成アセットを
   相対パス化（サブパス配信維持）。`dev.mjs` は廃止し `npm run dev` = `vite`（HMR）。
4. SW のプリキャッシュから `main.js`/`vue.min.js` を外し、ハッシュ付き `assets/*` は
   ランタイムキャッシュへ。base-path 検出（`core/base-path.ts`）を `import.meta.url` ベースに
   更新（`assets/index-[hash].js` の位置からルート導出。ルート/サブパス両対応を実ブラウザで確認）。
5. ビルド・型チェック・E2E・全画面描画・iOS エミュレーション・サブパス配信すべて確認済み。

### 残る唯一の発展タスク: inline テンプレートの全面 SFC 化

`index.html` の inline テンプレート（DOM テンプレート + x-template モーダル、約3,790行）を
`.vue` へ切り出す作業のみが残る。完了すれば実行時コンパイラが不要になり、`vite.config.ts` の
vue エイリアスを外して runtime-only ビルドへ戻しバンドルを小さくできる。手順・罠・検証方法は
[`SFC_MIGRATION.md`](SFC_MIGRATION.md)。SFC 基盤と HMR は既に整っているため、純粋に切り出し
作業に集中できる。

