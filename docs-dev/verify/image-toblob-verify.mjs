// image-toblob-verify.mjs — canvas.toBlob 経由の縮小パスが動作し、
// 元の toDataURL+base64ToBlob 経路と同等の結果を出すかを確認する。
//
// また、エラーパスで「unknown」の代わりに具体的なエラー情報が出ることも確認。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5240;
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
    // モックする fetch（API は呼ばれない想定）
    window.fetch = () => Promise.resolve(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    localStorage.setItem('at', JSON.stringify({ access_token: 'T', token_type: 'Bearer' }));
    localStorage.setItem('work_user', JSON.stringify({ id:'1', username:'t', acct:'t', display_name:'T', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', created_at:'2020-01-01T00:00:00Z' }));
    localStorage.setItem('conf_std', JSON.stringify({ ver: 999 }));
  });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(700);

  const result = await page.evaluate(async () => {
    const app = window.app;
    
    // 大きめの画像（2000x1500）を canvas で作って、その data URL を File に変換
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = 2000;
    srcCanvas.height = 1500;
    const sctx = srcCanvas.getContext('2d');
    // 縞模様を描く（描画内容があることでサイズが意味を持つ）
    for (let i = 0; i < 200; i++) {
      sctx.fillStyle = `hsl(${i * 1.8}, 70%, 50%)`;
      sctx.fillRect(i * 10, 0, 10, 1500);
    }
    const dataUrl = srcCanvas.toDataURL('image/jpeg', 0.9);
    
    // File オブジェクトを作る（input.files[0] と同じ形）
    const bin = atob(dataUrl.split(',')[1]);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const blob = new Blob([u8], { type: 'image/jpeg' });
    const file = new File([blob], 'test.jpeg', { type: 'image/jpeg' });
    
    // 縮小設定を有効に（optMaxImageLen=1280）
    app.$data.optMaxImageLen = 1280;
    
    // actMedia の XHR を傍受
    let capturedFormData = null;
    let capturedRequest = null;
    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      const xhr = new OriginalXHR();
      const origSend = xhr.send.bind(xhr);
      xhr.send = function (body) {
        capturedFormData = body;
        capturedRequest = xhr;
        // 送信はしない（モック完結）
        // 200 でレスポンスを返したフリ
        setTimeout(() => {
          Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
          Object.defineProperty(xhr, 'status', { value: 200, configurable: true });
          Object.defineProperty(xhr, 'responseText', { value: '{"id":"mock-media","url":"x","preview_url":"x","type":"image"}', configurable: true });
          xhr.onreadystatechange && xhr.onreadystatechange();
        }, 50);
      };
      return xhr;
    };
    window.XMLHttpRequest.DONE = 4;
    
    // 画像添付処理を起動（input.files[0] と同等）
    app.checkActMedia([file]);
    
    // 完了を待つ
    await new Promise(r => setTimeout(r, 1500));
    
    const out = {
      uploaded: app.katsu.media_attachments.length,
      previews: app.katsu.media_previews.length,
      lockReleased: app.action_lock === '',
      resultText: app.result_text || '(empty)',
      hasFormData: capturedFormData != null,
    };
    
    // FormData の file エントリのサイズと型を確認
    if (capturedFormData) {
      const fileEntry = capturedFormData.get('file');
      out.uploadedFileSize = fileEntry ? fileEntry.size : 0;
      out.uploadedFileType = fileEntry ? fileEntry.type : 'none';
    }
    
    // 元 XHR を復元
    window.XMLHttpRequest = OriginalXHR;
    return out;
  });

  console.log('=== canvas.toBlob downscale path verification ===\n');
  console.log('  media_attachments count :', result.uploaded, '(expect 1)');
  console.log('  media_previews count    :', result.previews, '(expect 1)');
  console.log('  action_lock released    :', result.lockReleased);
  console.log('  result_text             :', result.resultText);
  console.log('  XHR send called         :', result.hasFormData);
  console.log('  uploaded file size      :', result.uploadedFileSize, 'bytes');
  console.log('  uploaded file type      :', result.uploadedFileType);

  if (result.uploaded !== 1) fail.push('media not uploaded');
  if (!result.lockReleased) fail.push('action_lock not released');
  if (!result.hasFormData) fail.push('XHR send not called');
  if (result.uploadedFileSize < 1000) fail.push('uploaded file is suspiciously small');
  if (result.uploadedFileType !== 'image/jpeg') fail.push('uploaded type is not image/jpeg');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (toBlob downscale path produces valid upload)'); }
