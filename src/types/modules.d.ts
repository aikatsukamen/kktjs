// 外部グローバルライブラリの ambient モジュール宣言。
// build.mjs の globals プラグインが import 'vue' / 'lodash' / 'emojione' を
// それぞれ window.Vue / window._ / window.emojione へ解決する。
// このファイルは top-level の import/export を持たない（＝ ambient script として
// 扱われ、declare module がグローバルに効く）。型は any 互換（段階移行のため）。

declare module 'vue' {
  const Vue: any;
  export default Vue;
}

declare module 'lodash' {
  const _: any;
  export default _;
}

declare module 'emojione' {
  const emojione: any;
  export default emojione;
}
