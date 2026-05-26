// build.mjs — kktjs ビルドスクリプト（esbuild）
//
// 処理:
//   1. public/ の静的ファイルを docs/ へ同期（差分コピー: 変更/新規のみ）。
//   2. src/main.ts を IIFE バンドルして docs/js/main.js を生成。
//      Vue / lodash(_) / emojione は public/index.html 読み込みのグローバルを参照（external）。
//
// オプション:
//   --minify  本番ビルド（minify + 外部 sourcemap）
//   --watch   src/ と public/ を監視して自動リビルド
//   --serve   docs/ を簡易 HTTP サーバで配信（--watch と併用推奨）
//   --clean   docs/ を一旦全削除してからフル同期（既定は差分同期）
//
// 設定の中核（エントリ/出力/external）は build.config.mjs に集約（Vite 移行時に再利用）。

import { build, context } from 'esbuild';
import { argv } from 'node:process';
import { cp, rm, mkdir, stat, readdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { createReadStream, existsSync } from 'node:fs';
import {
  ENTRY, PUBLIC_DIR, OUT_DIR, OUT_JS, GLOBAL_EXTERNALS, TARGET, BANNER,
} from './build.config.mjs';

const watch = argv.includes('--watch');
const minify = argv.includes('--minify');
const serve = argv.includes('--serve');
const clean = argv.includes('--clean');
const PORT = 5180;

// --- public/ → docs/ 差分同期 -------------------------------------------------
// 変更（mtime 差・サイズ差）または新規のファイルだけコピーする。
// 4MB 超の画像・フォントを毎回コピーし直さないため、リビルドが速くなる。
async function syncPublic({ full = false } = {}) {
  if (full || !existsSync(OUT_DIR)) {
    await rm(OUT_DIR, { recursive: true, force: true });
    await mkdir(OUT_DIR, { recursive: true });
  }
  let copied = 0;
  async function walk(rel) {
    const srcDir = join(PUBLIC_DIR, rel);
    const entries = await readdir(srcDir, { withFileTypes: true });
    for (const e of entries) {
      const r = join(rel, e.name);
      const s = join(PUBLIC_DIR, r);
      const d = join(OUT_DIR, r);
      if (e.isDirectory()) {
        await mkdir(d, { recursive: true });
        await walk(r);
      } else {
        let needCopy = true;
        if (existsSync(d)) {
          const [ss, ds] = await Promise.all([stat(s), stat(d)]);
          needCopy = ss.size !== ds.size || ss.mtimeMs > ds.mtimeMs;
        }
        if (needCopy) {
          await cp(s, d);
          copied++;
        }
      }
    }
  }
  await walk('');
  console.log(`synced ${PUBLIC_DIR}/ -> ${OUT_DIR}/ (${copied} file(s) changed)`);
}

// --- esbuild 設定（共有設定から組み立て）-------------------------------------
const globalsPlugin = {
  name: 'globals',
  setup(b) {
    const filter = new RegExp(`^(${Object.keys(GLOBAL_EXTERNALS).join('|')})$`);
    b.onResolve({ filter }, (args) => ({ path: args.path, namespace: 'globals' }));
    b.onLoad({ filter: /.*/, namespace: 'globals' }, (args) => ({
      contents: `module.exports = window.${GLOBAL_EXTERNALS[args.path]};`,
      loader: 'js',
    }));
  },
};

const esbuildOptions = {
  entryPoints: [ENTRY],
  bundle: true,
  outfile: OUT_JS,
  format: 'iife',
  target: [TARGET],
  platform: 'browser',
  charset: 'utf8',
  legalComments: 'none',
  minify,
  sourcemap: minify ? 'external' : true,
  plugins: [globalsPlugin],
  banner: { js: BANNER },
  logLevel: 'info',
};

// --- 簡易プレビューサーバ -----------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg',
};
// 資産パスは配信場所非依存（core/base-path.ts が実行時に解決）になったため、
// プレビューはルート配信でよい。サブパス配信を再現したい場合は任意のパスでも
// 同様に動く（main.js の位置からベースを導出するため）。
function startServer() {
  createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const filePath = join(OUT_DIR, urlPath);
    if (!filePath.startsWith(OUT_DIR) || !existsSync(filePath)) {
      res.writeHead(404); res.end('Not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    createReadStream(filePath).pipe(res);
  }).listen(PORT, () => {
    console.log(`preview: http://localhost:${PORT}/`);
  });
}

// --- 実行 ---------------------------------------------------------------------
await syncPublic({ full: clean });

if (watch) {
  const ctx = await context(esbuildOptions);
  await ctx.watch();
  console.log('watching src/ for changes...');

  // public/ も監視（fs.watch で再帰監視。変更時に差分同期）。
  const { watch: fsWatch } = await import('node:fs');
  let pubTimer = null;
  try {
    fsWatch(PUBLIC_DIR, { recursive: true }, () => {
      clearTimeout(pubTimer);
      pubTimer = setTimeout(() => syncPublic().catch(console.error), 100);
    });
    console.log('watching public/ for changes...');
  } catch {
    console.warn('public/ の再帰監視はこの環境では未対応（手動で再実行してください）');
  }

  if (serve) startServer();
} else {
  await build(esbuildOptions);
  console.log(`build complete -> ${OUT_DIR}/`);
  if (serve) startServer();
}
