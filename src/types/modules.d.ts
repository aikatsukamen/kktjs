// 外部グローバルライブラリの ambient モジュール宣言。
// build（esbuild の globals プラグイン / Vite の仮想モジュール）が import 'lodash' /
// 'emojione' を window._ / window.emojione へ解決する。
// 'vue' は実 node_modules/vue の型を使う（SFC の型付けのため。実行時はグローバル window.Vue
// を参照する点は変わらない＝ external 解決）。よって vue の any シムは置かない。
// このファイルは top-level の import/export を持たない（＝ ambient script として
// 扱われ、declare module がグローバルに効く）。

declare module 'lodash' {
  const _: any;
  export default _;
}

declare module 'emojione' {
  const emojione: any;
  export default emojione;
}
