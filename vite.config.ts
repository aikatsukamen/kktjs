// vite.config.ts — kktjs のビルド/開発サーバ設定（Vite 標準エントリ方式）。
//
// 方針:
//   - index.html（プロジェクトルート）を Vite のエントリにする。<script type="module"
//     src="/src/main.ts"> で main.ts を読み込み、Vite が依存を解決・バンドルする。
//   - Vue は npm 依存からバンドルする（CDN グローバル vue.min.js は廃止）。これにより
//     dev で真の HMR が効き、SFC 編集が即時反映される。
//   - lodash / emojione は引き続き CDN グローバル（window._ / window.emojione）を external
//     として使う（Vue とは独立なライブラリで、import 化のメリットが薄くリスクのみ高いため）。
//     これらは index.html が <script> で先に読み込む。仮想モジュールで import を window.* へ解決。
//   - 出力先は従来どおり docs/（GitHub Pages 公開元、CI でデプロイ）。public/ の静的アセット
//     （css/img/fonts/sounds/sw.js/ベンダ JS 等）はそのまま docs/ へコピーされる。
//
// dev サーバ（npm run dev → vite）は HMR 付き。独自 dev サーバ（旧 dev.mjs）は不要になり廃止。

import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

const OUT_DIR = 'docs';
const PUBLIC_DIR = 'public';

// 引き続き CDN グローバルとして外部化するライブラリ（Vue 以外）。
//   キー = import 指定子 / 値 = 実行時グローバル名（window.<Name>）
const GLOBAL_EXTERNALS: Record<string, string> = {
  lodash: '_',
  emojione: 'emojione',
};
const EXTERNAL_IDS = Object.keys(GLOBAL_EXTERNALS);

// import 'lodash' / 'emojione' を window._ / window.emojione へ解決する仮想モジュール。
// 既存 src は default import（import _ from 'lodash'）なので default を返せば足りる。
function globalsExternal(): Plugin {
  const map = GLOBAL_EXTERNALS;
  const PREFIX = '\0kktjs-global:';
  return {
    name: 'kktjs-globals-external',
    enforce: 'pre',
    resolveId(id) {
      return EXTERNAL_IDS.includes(id) ? PREFIX + id : null;
    },
    load(id) {
      if (!id.startsWith(PREFIX)) return null;
      const key = id.slice(PREFIX.length);
      return {
        code: `const __g = window[${JSON.stringify(map[key])}];\nexport default __g;\n`,
        moduleSideEffects: false,
      };
    },
  };
}

export default defineConfig({
  plugins: [globalsExternal(), vue()],
  publicDir: PUBLIC_DIR,
  // esm-bundler ビルドが参照するフィーチャーフラグ。Options API（data/methods/computed）を
  // 使うため __VUE_OPTIONS_API__ は true。未定義だと実行時警告とバンドル肥大化を招く。
  define: {
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  resolve: {
    alias: {
      // このアプリは index.html 内の DOM テンプレートと x-template モーダル（template:'#modal-*'）を
      // 実行時コンパイルしている。npm 'vue' の default（runtime-only）にはコンパイラが無く #app が
      // 空になるため、コンパイラ同梱の esm-bundler ビルドへエイリアスする（旧 CDN フルビルド相当）。
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
  // 配信場所非依存（サブパス対応）。GitHub Pages のサブパス（/kktjs/）でも独自ドメインの
  // ルートでも動くよう、生成アセットのパスを相対（./assets/...）にする。
  base: './',
  // dev サーバ（HMR）。0.0.0.0 で待ち受け、Dev Container / Codespaces のポートフォワードに対応。
  server: { port: 5180, host: '0.0.0.0' },
  preview: { port: 5180, host: '0.0.0.0' },
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
    target: 'es2017',
    sourcemap: true,
    // heic2any（動的 import される HEIC→JPEG 変換ライブラリ、~1.35MB）の警告を抑制。
    // メインバンドルの肥大は別途 monitor するが、heic2any は HEIC ファイル投入時のみ
    // 取得される別チャンクで通常使用には影響しないため、警告閾値を緩和する。
    chunkSizeWarningLimit: 1500,
    // index.html（プロジェクトルート）を起点にバンドル。Vite 標準の HTML エントリ方式。
    // rollupOptions.input を明示しなくてもルートの index.html が既定エントリになる。
  },
});

// --- package.json scripts ----------------------------------------------------
//   "dev":       "vite"                  // HMR 付き開発サーバ（http://localhost:5180/）
//   "build":     "vite build"            // docs/ へ本番ビルド（SFC も plugin-vue でコンパイル）
//   "preview":   "vite preview"
//   "typecheck": "vue-tsc --noEmit"      // .ts + .vue の型チェック
//
// ビルド関連ファイルはこの vite.config.ts のみ（旧 build.config.mjs / build.mjs / dev.mjs は廃止）。
