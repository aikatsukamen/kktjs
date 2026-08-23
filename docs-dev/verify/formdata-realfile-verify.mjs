// formdata-realfile-verify.mjs — actMedia の FormData 構築を検証する。
//
// 核心: FormData.append(name, file) のように第3引数を付けない場合、仕様上その File は
// そのまま格納される（同一オブジェクト）。第3引数を付けると新しい File が生成される。
// iOS Safari ではこの「新しい File」で Content-Type が失われ、Mastodon が 422 を返していた。
//
// 検証内容:
//   A. 動画(File, video/quicktime) → 第3引数なしで append され、File が同一・type保持
//   B. 画像(File, image/jpeg) 縮小なし → 同上
//   C. canvas由来のBlob(名前なし) → ファイル名 upload.jpeg が補われ type も保持
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5251;
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
  });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(700);

  const result = await page.evaluate(async () => {
    const app = window.app;
    const out = {};

    function installXHRSpy() {
      const OriginalXHR = window.XMLHttpRequest;
      const state = { captured: null, restore: () => { window.XMLHttpRequest = OriginalXHR; } };
      window.XMLHttpRequest = function () {
        const xhr = new OriginalXHR();
        xhr.setRequestHeader = function () {};
        xhr.open = function () {};
        xhr.send = function (body) {
          state.captured = body;
          setTimeout(() => {
            Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
            Object.defineProperty(xhr, 'status', { value: 200, configurable: true });
            Object.defineProperty(xhr, 'responseText', { value: '{"id":"x","url":"y","preview_url":"z","type":"image"}', configurable: true });
            xhr.onreadystatechange && xhr.onreadystatechange();
          }, 20);
        };
        return xhr;
      };
      window.XMLHttpRequest.DONE = 4;
      return state;
    }

    // --- A: 動画 File（canvas を通らない経路） ---
    {
      const movBytes = new Uint8Array(2048);
      const movFile = new File([movBytes], 'IMG_3542.mov', { type: 'video/quicktime' });
      const spy = installXHRSpy();
      app.katsu.media_previews = []; app.katsu.media_attachments = []; app.action_lock = '';
      app.actMedia('data:video/quicktime;base64,AAAA', movFile, false);
      await new Promise(r => setTimeout(r, 150));
      const entry = spy.captured ? spy.captured.get('file') : null;
      out.A_name = entry ? entry.name : '(none)';
      out.A_type = entry ? entry.type : '(none)';
      out.A_identity = entry === movFile;   // 第3引数なしなら同一オブジェクト
      spy.restore();
    }

    // --- B: 画像 File（縮小なしで直送される想定） ---
    {
      const c = document.createElement('canvas');
      c.width = 40; c.height = 40; c.getContext('2d').fillRect(0,0,40,40);
      const du = c.toDataURL('image/jpeg', 0.9);
      const bin = atob(du.split(',')[1]);
      const u8 = new Uint8Array(bin.length);
      for (let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
      const imgFile = new File([u8], 'FullSizeRender.jpeg', { type: 'image/jpeg' });
      const spy = installXHRSpy();
      app.katsu.media_previews = []; app.katsu.media_attachments = []; app.action_lock = '';
      app.actMedia('data:image/jpeg;base64,AAAA', imgFile, false);
      await new Promise(r => setTimeout(r, 150));
      const entry = spy.captured ? spy.captured.get('file') : null;
      out.B_name = entry ? entry.name : '(none)';
      out.B_type = entry ? entry.type : '(none)';
      out.B_identity = entry === imgFile;
      spy.restore();
    }

    // --- C: canvas 由来 Blob（名前なし、type 空） ---
    {
      const blobNoType = new Blob([new Uint8Array([0xff,0xd8,0xff,0xe0,0,0,0,0])]);
      const spy = installXHRSpy();
      app.katsu.media_previews = []; app.katsu.media_attachments = []; app.action_lock = '';
      app.actMedia('data:image/jpeg;base64,AAAA', blobNoType, true);
      await new Promise(r => setTimeout(r, 150));
      const entry = spy.captured ? spy.captured.get('file') : null;
      out.C_name = entry ? entry.name : '(none)';
      out.C_type = entry ? entry.type : '(none)';
      spy.restore();
    }

    return out;
  });

  console.log('=== FormData construction: real File vs Blob ===\n');
  console.log('A. 動画 File (video/quicktime)');
  console.log('   filename        :', result.A_name, '(expect IMG_3542.mov)');
  console.log('   Content-Type    :', result.A_type, '(expect video/quicktime)');
  console.log('   File 同一性     :', result.A_identity, '(expect true = 第3引数なしで素通し)');
  console.log();
  console.log('B. 画像 File (image/jpeg, 縮小なし直送)');
  console.log('   filename        :', result.B_name, '(expect FullSizeRender.jpeg)');
  console.log('   Content-Type    :', result.B_type, '(expect image/jpeg)');
  console.log('   File 同一性     :', result.B_identity, '(expect true)');
  console.log();
  console.log('C. canvas 由来 Blob (名前なし/type空)');
  console.log('   filename        :', result.C_name, '(expect upload.jpeg)');
  console.log('   Content-Type    :', result.C_type, '(expect image/jpeg)');

  if (result.A_type !== 'video/quicktime') fail.push('A: video Content-Type not preserved');
  if (result.A_name !== 'IMG_3542.mov') fail.push('A: video filename not preserved');
  if (!result.A_identity) fail.push('A: video File was re-wrapped (third arg still passed) — this causes iOS 422');
  if (result.B_type !== 'image/jpeg') fail.push('B: image Content-Type not preserved');
  if (!result.B_identity) fail.push('B: image File was re-wrapped (third arg still passed)');
  if (result.C_name !== 'upload.jpeg') fail.push('C: blob filename not supplied');
  if (result.C_type !== 'image/jpeg') fail.push('C: blob type not backfilled');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (real File sent untouched like direct upload; Blob gets filename)'); }
