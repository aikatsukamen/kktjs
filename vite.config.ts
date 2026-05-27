// vite.config.ts — kktjs のビルド/開発サーバ設定（Vite）。
//
// 方針（既存運用との互換を最優先）:
//   - 出力先は従来どおり docs/（GitHub Pages 公開元、CI でデプロイ）。
//   - 静的ファイルは public/ をそのまま配信・コピー（Vite 標準の publicDir）。
//     public/index.html が CDN グローバル（vue.min.js / lodash / emojione）と
//     js/main.js?v=0926 を読み込む構成は維持する。
//   - エントリは src/main.ts を IIFE バンドルして docs/js/main.js に出力（esbuild と同形）。
//   - Vue / lodash / emojione は CDN グローバルのまま使う（external = window.* に解決）。
//     plugin-vue が SFC から生成する import { openBlock, ... } from 'vue' も window.Vue へ。
//
// 共有設定（esbuild の build.mjs と同じ定義）は build.config.mjs から流用し二重管理を避ける。

import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createRequire } from 'node:module';
import {
  GLOBAL_EXTERNALS, ENTRY, PUBLIC_DIR, OUT_DIR, TARGET, BANNER,
} from './build.config.mjs';

const EXTERNAL_IDS = Object.keys(GLOBAL_EXTERNALS);

// vue の public named export 名一覧。plugin-vue が SFC から生成する
// `import { openBlock, createElementBlock, ... } from 'vue'` を、CDN グローバル
// window.Vue から名前付きで取り出せるよう、仮想モジュールで静的に再 export する。
// （Rollup は仮想モジュールの named export を静的に解決する必要があるため列挙する）
function vueNamedExports(): string[] {
  try {
    const require = createRequire(import.meta.url);
    const mod = require('vue');
    return Object.keys(mod).filter((k) => k !== 'default' && k !== '__esModule');
  } catch {
    return [];
  }
}

// import 'vue' / 'lodash' / 'emojione' を実行時グローバル window.<Name> へ解決する仮想モジュール。
// default import（既存 src の `import _ from 'lodash'` 等）と、SFC が生成する vue の
// named import の双方に対応する ESM ファサードを返す（esbuild の globalsPlugin 相当）。
function globalsExternal(): Plugin {
  const map = GLOBAL_EXTERNALS as Record<string, string>;
  const PREFIX = '\0kktjs-global:';
  const vueNamed = vueNamedExports();
  return {
    name: 'kktjs-globals-external',
    enforce: 'pre',
    resolveId(id) {
      return EXTERNAL_IDS.includes(id) ? PREFIX + id : null;
    },
    load(id) {
      if (!id.startsWith(PREFIX)) return null;
      const key = id.slice(PREFIX.length);
      const globalName = map[key];
      const g = `window[${JSON.stringify(globalName)}]`;
      let code = `const __g = ${g};\nexport default __g;\n`;
      // vue のみ named export を静的に再公開（SFC のコンパイル出力が参照する）。
      if (key === 'vue' && vueNamed.length) {
        for (const n of vueNamed) {
          // 識別子として妥当な名前のみ（記号入りは除外）。
          if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(n)) {
            code += `export const ${n} = __g[${JSON.stringify(n)}];\n`;
          }
        }
      }
      return { code, moduleSideEffects: false };
    },
  };
}

export default defineConfig({
  plugins: [
    globalsExternal(),
    vue(), // .vue (SFC) を扱う。
  ],
  publicDir: PUBLIC_DIR,
  // 開発サーバ（HMR）。public/index.html が CDN グローバル + /js/main.js を読むので、
  // dev では main.ts を /js/main.js として配信する必要がある（build と同じ出力名）。
  server: { port: 5180 },
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
    target: TARGET,
    sourcemap: true,
    // ライブラリ的に main.ts だけをバンドル（index.html はエントリにしない）。
    lib: {
      entry: ENTRY,
      formats: ['iife'],
      name: 'kktjs',
      fileName: () => 'js/main.js',
    },
    rollupOptions: {
      output: {
        // バナー（esbuild と同じ）。
        banner: BANNER,
        // window グローバルを直接使うので extend/globals は不要（仮想モジュールで解決済み）。
        inlineDynamicImports: true,
      },
    },
  },
});

// --- package.json scripts（Vite 運用）---------------------------------------
//   "dev":       "vite",                    // HMR 付き開発サーバ（http://localhost:5180/）
//   "build":     "vite build",              // docs/ へ本番ビルド
//   "preview":   "vite preview",
//   "typecheck": "vue-tsc --noEmit"         // .ts + .vue の型チェック
//
// esbuild 系（build.mjs / build.config.mjs の一部）は Vite 運用に完全移行したら
// 削除してよいが、現状は build.config.mjs を共有設定として Vite からも参照している。
