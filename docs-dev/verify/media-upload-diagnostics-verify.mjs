// media-upload-diagnostics-verify.mjs — actMedia の XHR エラー時に、size / type /
// readyState / status / statusText / event.type を含む診断情報が表示されることを確認する。
// また、iOS Safari 対策として Blob.type が空の場合に image/jpeg を補うことも確認。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5243;
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

    // === Case A: XHR が onerror を発火（サーバ到達失敗） → 詳細な診断情報が出る
    {
      // 小さめの JPEG を作る
      const c = document.createElement('canvas');
      c.width = 300; c.height = 200;
      c.getContext('2d').fillRect(0, 0, 300, 200);
      const dataUrl = c.toDataURL('image/jpeg', 0.9);
      const bin = atob(dataUrl.split(',')[1]);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const blob = new Blob([u8], { type: 'image/jpeg' });

      // XHR を「onerror 発火」でモック
      const OriginalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function () {
        const xhr = new OriginalXHR();
        xhr.send = function () {
          setTimeout(() => {
            xhr.onerror && xhr.onerror({ type: 'error' });
          }, 30);
        };
        return xhr;
      };
      window.XMLHttpRequest.DONE = 4;

      app.katsu.media_previews = [];
      app.katsu.media_attachments = [];
      app.action_lock = '';
      app.result_text = '';

      // actMedia を直接呼ぶ（縮小をスキップして送信テストに集中）
      app.actMedia('data:image/jpeg;base64,...', blob, false);
      await new Promise(r => setTimeout(r, 200));
      
      out.caseA_text = app.result_text;
      out.caseA_lockReleased = app.action_lock === '';
      out.caseA_previewCleared = app.katsu.media_previews.length === 0;

      window.XMLHttpRequest = OriginalXHR;
    }

    // === Case B: Blob.type が空 → FormData 送信時に image/jpeg が補われる
    {
      const c = document.createElement('canvas');
      c.width = 100; c.height = 100;
      c.getContext('2d').fillRect(0, 0, 100, 100);
      const dataUrl = c.toDataURL('image/jpeg', 0.9);
      const bin = atob(dataUrl.split(',')[1]);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const blobNoType = new Blob([u8]);  // type 指定なし → ''
      
      let capturedFormData = null;
      const OriginalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function () {
        const xhr = new OriginalXHR();
        xhr.send = function (body) {
          capturedFormData = body;
          // 成功を模擬
          setTimeout(() => {
            Object.defineProperty(xhr, 'readyState', { value: 4 });
            Object.defineProperty(xhr, 'status', { value: 200 });
            Object.defineProperty(xhr, 'responseText', { value: '{"id":"x","url":"y","preview_url":"z","type":"image"}' });
            xhr.onreadystatechange && xhr.onreadystatechange();
          }, 30);
        };
        return xhr;
      };
      window.XMLHttpRequest.DONE = 4;

      app.katsu.media_previews = [];
      app.katsu.media_attachments = [];
      app.action_lock = '';
      app.actMedia('data:image/jpeg;base64,...', blobNoType, false);
      await new Promise(r => setTimeout(r, 200));

      if (capturedFormData) {
        const fileEntry = capturedFormData.get('file');
        out.caseB_uploadedType = fileEntry ? fileEntry.type : '(no file entry)';
        // File として送られていればファイル名も持つ
        out.caseB_uploadedName = (fileEntry && fileEntry.name) ? fileEntry.name : '(no name)';
      }
      window.XMLHttpRequest = OriginalXHR;
    }

    return out;
  });

  console.log('=== media upload diagnostics ===\n');
  console.log('Case A: XHR onerror fires (typical iOS Safari failure)');
  console.log('  result_text        :', result.caseA_text);
  console.log('  lock released      :', result.caseA_lockReleased);
  console.log('  preview cleared    :', result.caseA_previewCleared);
  console.log();
  console.log('Case B: Blob.type is empty (iOS Safari canvas.toBlob edge case)');
  console.log('  uploaded type      :', result.caseB_uploadedType, '(expect image/jpeg)');
  console.log('  uploaded filename  :', result.caseB_uploadedName, '(expect upload.jpeg or similar)');

  // 診断情報のチェック
  if (!/size=\d+KB/.test(result.caseA_text)) fail.push('Case A: missing "size=NKB" in error text');
  if (!/type=/.test(result.caseA_text)) fail.push('Case A: missing "type=" in error text');
  if (!/rs=/.test(result.caseA_text)) fail.push('Case A: missing "rs=" (readyState) in error text');
  if (!/st=/.test(result.caseA_text)) fail.push('Case A: missing "st=" (status) in error text');
  if (!result.caseA_lockReleased) fail.push('Case A: action_lock not released');
  if (!result.caseA_previewCleared) fail.push('Case A: preview not popped');
  
  if (result.caseB_uploadedType !== 'image/jpeg') fail.push('Case B: Blob type not backfilled to image/jpeg');
  if (result.caseB_uploadedName === '(no name)') fail.push('Case B: filename not passed to FormData.append');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (diagnostics enriched and iOS safety measures applied)'); }
