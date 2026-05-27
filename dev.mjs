// dev.mjs — Vite watch ビルド + 軽量プレビューサーバ。
//
// なぜ `vite`(dev server) を直接使わないか:
//   public/index.html は固定で <script src="js/main.js"> と CDN グローバル（vue.min.js 等）を
//   読み込む構成。Vite の dev サーバは index.html を解析して /src/main.ts を注入する流儀
//   なので、この「ビルド済み js/main.js を読む既存 index.html」とは噛み合わない。
//   そこで dev では「Vite で docs/ を watch ビルド（SFC も plugin-vue でコンパイル）」しつつ、
//   docs/ を素の静的サーバで配信する。SFC を編集すると docs/js/main.js が再生成され、
//   ブラウザを手動リロードすれば反映される（HMR ではないが SFC ビルドは通る）。
//
//   ※ 本格的な HMR が必要になったら、index.html を Vite エントリ方式へ作り変え（CDN を
//      やめて vue を import に統一、<script type="module" src="/src/main.ts"> にする）、
//      `vite` dev サーバへ移行する。これは別タスク（docs-dev/VUE3_MIGRATION.md 参照）。

import { build } from 'vite';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { OUT_DIR } from './build.config.mjs';

const PORT = 5180;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg',
};

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
  }).listen(PORT, '0.0.0.0', () => {
    // 0.0.0.0 で待ち受け（Dev Container / Codespaces のポートフォワードからアクセス可能に）。
    console.log(`preview: http://localhost:${PORT}/  (Vite watch build → docs/; reload to see SFC changes)`);
  });
}

// Vite を watch モードでビルド（src/ と public/ の変更で docs/ を更新）。
//   - emptyOutDir を無効化: watch の再ビルドのたびに docs/ が一瞬空になり、その瞬間に
//     配信すると 404 になるのを防ぐ（本番 `vite build` は emptyOutDir=true のままでよい）。
//   - 初回ビルド完了を待ってからサーバを起動する（watcher の 'event' で bundle 完了を待つ）。
const watcher = await build({ build: { watch: {}, emptyOutDir: false } });

// build({ watch }) は Rollup watcher を返す。初回の 'END' を待ってから配信を始める。
let started = false;
function startOnce() {
  if (started) return;
  started = true;
  startServer();
}
if (watcher && typeof watcher.on === 'function') {
  watcher.on('event', (e) => {
    if (e.code === 'END' || e.code === 'BUNDLE_END') startOnce();
    if (e.code === 'ERROR') console.error('vite build error:', e.error?.message || e.error);
  });
  // 保険: 一定時間内にイベントが来なくても起動する（docs/ が既にあれば配信できる）。
  setTimeout(startOnce, 4000);
} else {
  // watcher が取れない実装差異への保険。
  startServer();
}
