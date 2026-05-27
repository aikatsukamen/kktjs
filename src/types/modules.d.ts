// 外部グローバルライブラリの ambient モジュール宣言。
// build（Vite の仮想モジュール）が import 'lodash' / 'emojione' を window._ / window.emojione
// へ解決する（CDN グローバル）。'vue' は npm 依存からバンドルされる（実 node_modules/vue の型を使う。
// vite.config.ts で vue/dist/vue.esm-bundler.js（コンパイラ同梱）へエイリアス）。よって vue の
// any シムは置かない。このファイルは top-level の import/export を持たない（ambient script）。

declare module 'lodash' {
  const _: any;
  export default _;
}

declare module 'emojione' {
  const emojione: any;
  export default emojione;
}
