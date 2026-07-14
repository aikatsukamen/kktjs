// ios-normalize-verify.mjs — iOS 判定時、縮小不要（長辺 <= optMaxImageLen）でも
// canvas 経由で再エンコードされ、EXIF/メタデータが除去されたクリーンな JPEG が送られることを確認。
// これにより、iPhone のトリミング済み画像で起きる Mastodon 422 を回避する。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5244;
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.mp3':'audio/mpeg','.ico':'image/x-icon','.map':'application/json','.wasm':'application/wasm' };
const server = createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u.endsWith('/')) u += 'index.html';
  const fp = join(DOCS, u);
  if (!fp.startsWith(DOCS) || !existsSync(fp)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' });
  createReadStream(fp).pipe(res);
});
await new Promise(r => server.listen(PORT, r));

const fail = [];
let browser;
try {
  browser = await chromium.launch({ executablePath: EXE, headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    class FakeWS { constructor(){ this.readyState=0; setTimeout(()=>{this.readyState=1;},0);} send(){} close(){} addEventListener(){} removeEventListener(){} }
    FakeWS.OPEN=1; window.WebSocket = FakeWS;
    window.fetch = () => Promise.resolve(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    localStorage.setItem('at', JSON.stringify({ access_token: 'T', token_type: 'Bearer' }));
    localStorage.setItem('work_user', JSON.stringify({ id:'1', username:'t', acct:'t', display_name:'T', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', created_at:'2020-01-01T00:00:00Z' }));
    localStorage.setItem('conf_std', JSON.stringify({ ver: 999 }));
    // iOS の判定を通すため userAgent に iPhone を注入
    Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', configurable: true });
  });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(700);

  const result = await page.evaluate(async () => {
    const app = window.app;
    const out = {};

    // 1206x349 相当の横長画像（トリミング済みスクショを模した細長い画像）を作る
    const c = document.createElement('canvas');
    c.width = 1206; c.height = 349;
    const ctx = c.getContext('2d');
    for (let i = 0; i < 100; i++) { ctx.fillStyle = `hsl(${i*3},60%,50%)`; ctx.fillRect(i*13, 0, 13, 349); }
    const dataUrl = c.toDataURL('image/jpeg', 0.95);
    const bin = atob(dataUrl.split(',')[1]);
    const u8 = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
    // 元 File には image/jpeg 型をつけておく（iOS のファイル選択相当）
    const file = new File([new Blob([u8],{type:'image/jpeg'})], 'IMG_crop.jpeg', { type:'image/jpeg' });

    // 最大長辺 1280（1206 < 1280 なので「縮小不要」= resizeScale 1 になるケース）
    app.$data.optMaxImageLen = 1280;

    // 送信 Blob を傍受
    let captured = null;
    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      const xhr = new OriginalXHR();
      xhr.send = function (body) {
        captured = body;
        setTimeout(() => {
          Object.defineProperty(xhr,'readyState',{value:4});
          Object.defineProperty(xhr,'status',{value:200});
          Object.defineProperty(xhr,'responseText',{value:'{"id":"x","url":"y","preview_url":"z","type":"image"}'});
          xhr.onreadystatechange && xhr.onreadystatechange();
        }, 30);
      };
      return xhr;
    };
    window.XMLHttpRequest.DONE = 4;

    app.katsu.media_previews = [];
    app.katsu.media_attachments = [];
    app.action_lock = '';

    app.checkActMedia([file]);
    await new Promise(r => setTimeout(r, 1200));

    out.uploaded = app.katsu.media_attachments.length;
    if (captured) {
      const f = captured.get('file');
      out.sentSize = f ? f.size : 0;
      out.sentType = f ? f.type : 'none';
      // 送信された Blob をデコードして、EXIF が無い（canvas 再エンコード済み）ことを間接確認
      // canvas.toBlob 出力は EXIF を持たないので、先頭マーカーだけ確認する
      if (f) {
        const buf = new Uint8Array(await f.arrayBuffer());
        // JPEG SOI (FFD8) の後、APP0 (FFE0, JFIF) が来れば canvas 由来（EXIF/APP1 ではない）
        out.marker0 = buf[0].toString(16) + buf[1].toString(16);
        out.marker1 = buf[2].toString(16) + buf[3].toString(16);
      }
    }
    // 元 File のサイズと比較（再エンコードされていれば異なるサイズになる）
    out.originalSize = file.size;

    window.XMLHttpRequest = OriginalXHR;
    return out;
  });

  console.log('=== iOS canvas normalization (no-downscale case) ===\n');
  console.log('  uploaded            :', result.uploaded, '(expect 1)');
  console.log('  original file size  :', result.originalSize, 'bytes');
  console.log('  sent blob size      :', result.sentSize, 'bytes');
  console.log('  sent blob type      :', result.sentType);
  console.log('  JPEG marker (SOI)   :', result.marker0, '(expect ffd8)');
  console.log('  next marker         :', result.marker1, '(ffe0=JFIF/canvas, ffe1=EXIF/original)');

  if (result.uploaded !== 1) fail.push('media not uploaded');
  if (result.sentType !== 'image/jpeg') fail.push('sent type is not image/jpeg');
  // canvas 再エンコードされていれば、元ファイルとサイズが異なるはず
  if (result.sentSize === result.originalSize) fail.push('sent blob is identical to original (canvas normalization did NOT run)');
  // canvas.toBlob 出力は APP1(EXIF, ffe1) ではなく APP0(JFIF, ffe0) で始まる
  if (result.marker1 === 'ffe1') fail.push('sent blob still has EXIF (APP1) — not re-encoded via canvas');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (iOS re-encodes via canvas even when no downscale — strips metadata, avoids 422)'); }
