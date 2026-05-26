// vite.config.example.ts — Vue 3 移行時に使う Vite 設定の雛形（現状は未使用の参考ファイル）。
//
// 使い方（Vue 3 移行時）:
//   1. 依存を追加:  npm i -D vite @vitejs/plugin-vue
//   2. このファイルをリポジトリ直下へ `vite.config.ts` としてコピー。
//   3. package.json の scripts を Vite へ差し替え（下部コメント参照）。
//   4. esbuild の build.mjs / build.config.mjs は不要になったら削除。
//
// 方針:
//   - 出力先は従来どおり docs/（GitHub Pages 公開元、CI でデプロイ）。
//   - 静的ファイルは public/ をそのまま配信・コピー（Vite 標準の publicDir）。
//   - Vue / lodash / emojione を CDN グローバルのまま使い続けるなら external 指定。
//     （SFC 化と同時に Vue を npm 依存へ取り込む場合は external から外し、import に統一する）
//
// 注意: 下記は型注釈付きの参考実装。拡張子は .example.ts としてあり、tsconfig の
//        include（src/**/*.ts）対象外なので型チェック・ビルドには影響しない。

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
