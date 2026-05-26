# Vue 2 → Vue 3 移行ガイド

Vue 2 は 2023年末で EOL（サポート終了）。本ドキュメントは、このコードベースを
Vue 3 へ移行する際に**実際に修正が必要な箇所**を、コード調査に基づいて列挙したもの。

> 推奨運用: まず `legacy/app-core.js` の TypeScript 移行を進め、中核ロジックが
> 整理されてから Vue 3 移行に着手する。TS移行と Vue3移行を同時に行うと、不具合の
> 原因切り分けが難しくなる。

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

**現状（`src/legacy/app-core.js`）**
```js
Vue.component('media',   { template: '#modal-media' });
Vue.component('emojipicker', { template: '#modal-input' });
Vue.component('confirm', { template: '#modal-confirm' });
Vue.component('info',    { template: '#modal-info' });
Vue.directive('play', function (el) { el.play(); });
// ... directive 計9個 ...
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

### 4. リアクティビティの変更と `$forceUpdate`（最大の注意点・124箇所）

Vue 2 は `Object.defineProperty` ベースで、配列インデックスへの直接代入
（`arr[i] = x`）やオブジェクトへのプロパティ追加が検知されなかった。本コードは
それを補うため `$forceUpdate()` を **124回** 呼んでいる。

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

## Vite 導入（Vue 3 移行とセットで行う）

ビルドの高速化目的だけで今 Vite を入れても効果はない（現状の esbuild ワンショット
ビルドは実測 ~90ms で十分高速、Vite の `vite build` は Rollup を回すため同等〜やや遅い）。
Vite の真価は **Vue 3 + SFC(.vue) の開発サーバ + HMR** にあるため、Vue 3 移行と
同時に導入するのが正しい。

### すでに済ませてある準備（移行を楽にするための先行作業）

- **Vue 依存の隔離**: コンポーネント/ディレクティブ登録は `src/app/vue-setup.ts` に集約済み。
  Vue 3 の `app.component`/`app.directive`・フック名変更はこの 1 ファイルの修正で済む。
- **ビルド設定のツール非依存化**: エントリ/出力/external を `build.config.mjs` に集約済み。
  `vite.config.ts` から同じ `GLOBAL_EXTERNALS` を import すれば二重管理を避けられる。
- **Vite 設定の雛形**: `docs-dev/vite.config.example.ts` を用意済み（未使用の参考ファイル）。
  移行時にリポジトリ直下へ `vite.config.ts` としてコピーして調整する。
- **package.json の予約メモ**: `//vue3-migration` キーに移行時の依存・scripts 変更方針を記載。

### 移行手順（概略）

1. 本ドキュメント上部の破壊的変更（グローバル API・ディレクティブ・slot・$forceUpdate）に対応。
2. `npm i -D vite @vitejs/plugin-vue`（SFC 化するなら `vue` 本体も依存に追加）。
3. `docs-dev/vite.config.example.ts` を `vite.config.ts` としてコピーし調整。
4. `package.json` の scripts を Vite へ差し替え（`dev`/`build`/`preview`/`typecheck`）。
5. CDN グローバル（`public/index.html` の `<script src=vue.min.js>` 等）を、SFC 化の
   進捗に応じて external のまま使うか、npm 依存へ取り込むかを決める。
6. 不要になった `build.mjs` / `build.config.mjs`（esbuild 用）を削除。
7. **実機（iOS Safari 含む）で全機能を確認**。

