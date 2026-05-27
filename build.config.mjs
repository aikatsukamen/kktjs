// build.config.mjs — ビルドツール非依存の共有設定。
//
// 目的: 「エントリ」「出力先」「グローバル外部依存(Vue/lodash/emojione)」といった、
// esbuild でも Vite/Rollup でも共通して必要になる定義をここに集約する。
// 将来 Vue 3 + Vite へ移行する際、vite.config.ts からこの定義を import すれば
// 設定の二重管理を避けられる（docs-dev/VUE3_MIGRATION.md 参照）。

// エントリと出力
export const ENTRY = 'src/main.ts';
export const PUBLIC_DIR = 'public';
export const OUT_DIR = 'docs';
export const OUT_JS = `${OUT_DIR}/js/main.js`;

// public/index.html で個別 <script> 読み込みされるグローバルライブラリ。
// バンドルに含めず、import 文を window.<Global> に解決する（external 扱い）。
//   キー   = import 指定子（例: import Vue from 'vue'）
//   値     = 実行時のグローバル名（window.Vue など）
// vue は Vue 3 のグローバルビルド（vue.global.prod.js）を window.Vue として読み込む。
export const GLOBAL_EXTERNALS = {
  vue: 'Vue',
  lodash: '_',
  emojione: 'emojione',
};

// ビルドの共通メタ
export const TARGET = 'es2017';
export const BANNER = '/* kktjs — built from TypeScript sources. Do not edit directly. */';

// --- Vite 移行時の参考（現状は未使用）---------------------------------------
// vite.config.ts では概ね次のように対応づけられる:
//   build.lib.entry          <- ENTRY
//   build.outDir             <- OUT_DIR（publicDir は別途 PUBLIC_DIR）
//   build.rollupOptions.external <- Object.keys(GLOBAL_EXTERNALS)
//   build.rollupOptions.output.globals <- GLOBAL_EXTERNALS
//   build.target             <- TARGET
// 詳細な雛形は docs-dev/vite.config.example.ts を参照。
