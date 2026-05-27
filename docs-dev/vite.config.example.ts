// vite.config.example.ts — 旧・参考用の雛形（**現在は実装済みの ../vite.config.ts が本番**）。
//
// 注意: Vue 3 + Vite + SFC は導入済み。実際に使われているのはリポジトリ直下の
// `vite.config.ts`（CDN グローバル external 維持・lib モードで docs/js/main.js 出力・
// SFC の named import を window.Vue から再 export する仮想モジュールを実装）。本ファイルは
// 当初の設計メモとして残してあるだけで、ビルドには使われない（tsconfig include 対象外）。
// 実装の詳細は ../vite.config.ts と docs-dev/VUE3_MIGRATION.md「Vite + SFC 導入」を参照。
//
// 以下は当初の雛形（lib モードの globals 指定など、実装では仮想モジュール方式に変更した）。

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// 共有設定（esbuild と同じ external 定義を流用できる）
// import { GLOBAL_EXTERNALS, OUT_DIR, PUBLIC_DIR, ENTRY, TARGET } from './build.config.mjs';

const GLOBAL_EXTERNALS = { vue: 'Vue', lodash: '_', emojione: 'emojione' };

export default defineConfig({
  plugins: [vue()],
  // 静的ファイル（index.html, css, fonts, img, sounds, sw.js, ベンダJS）
  publicDir: 'public',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    target: 'es2017',
    sourcemap: true,
    rollupOptions: {
      // エントリ（移行段階に応じて src/main.ts のまま or index.html 起点に変更）
      input: 'src/main.ts',
      // CDN グローバルをバンドルに含めない場合（暫定移行期）
      external: Object.keys(GLOBAL_EXTERNALS),
      output: {
        format: 'iife',
        entryFileNames: 'js/main.js',
        globals: GLOBAL_EXTERNALS,
      },
    },
  },
  // 開発サーバ（HMR）。Vue 3 + SFC にすると真価を発揮する。
  server: { port: 5180 },
});

// --- package.json scripts（移行後の例）---------------------------------------
// "scripts": {
//   "dev": "vite",                // HMR 付き開発サーバ
//   "build": "vue-tsc -b && vite build",
//   "preview": "vite preview",
//   "typecheck": "vue-tsc --noEmit"
// }
//
// SFC 化が進んだら external/globals を外して Vue を依存に取り込み、
// CDN <script> 読み込み（public/index.html）も削除する。
