// image-error-detail-verify.mjs — toBlob で null が返るケースや drawImage で
// e.message のない例外が投げられたケースで、エラーメッセージが「unknown」ではなく
// より具体的な情報を持つことを確認する。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5241;
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

    // Case A: toBlob が null を返すケース → 専用の文言が出るはず
    {
      // 小さい画像を用意
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = 800; srcCanvas.height = 600;
      const ctx = srcCanvas.getContext('2d');
      ctx.fillStyle = '#f00'; ctx.fillRect(0, 0, 800, 600);
      const dataUrl = srcCanvas.toDataURL('image/jpeg', 0.9);
      const bin = atob(dataUrl.split(',')[1]);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const file = new File([new Blob([u8], {type:'image/jpeg'})], 'a.jpeg', { type: 'image/jpeg' });

      // canvas.toBlob を null 返却にモック
      const origToBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (cb) { setTimeout(() => cb(null), 10); };

      app.$data.optMaxImageLen = 400;  // 縮小有効
      app.katsu.media_previews = [];
      app.katsu.media_attachments = [];
      app.action_lock = '';
      
      // 元ファイル送信に切り替わるが、XHR は実際に出るので止める
      const OriginalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function () { const x = new OriginalXHR(); x.send = function(){}; return x; };
      window.XMLHttpRequest.DONE = 4;
      
      app.checkActMedia([file]);
      await new Promise(r => setTimeout(r, 800));
      out.caseA_text = app.result_text;
      out.caseA_attemptedFallback = app.action_lock === 'media';  // フォールバック送信で lock 取得済みか
      
      HTMLCanvasElement.prototype.toBlob = origToBlob;
      window.XMLHttpRequest = OriginalXHR;
      app.action_lock = '';
    }

    // Case B: drawImage が string を投げるケース → e.message ではなく e 自体が文字列で出る
    {
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = 800; srcCanvas.height = 600;
      const ctx2 = srcCanvas.getContext('2d');
      ctx2.fillStyle = '#0f0'; ctx2.fillRect(0, 0, 800, 600);
      const dataUrl = srcCanvas.toDataURL('image/jpeg', 0.9);
      const bin = atob(dataUrl.split(',')[1]);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const file = new File([new Blob([u8], {type:'image/jpeg'})], 'b.jpeg', { type: 'image/jpeg' });

      // ctx.drawImage が message のない例外を投げるようにモック
      const proto = CanvasRenderingContext2D.prototype;
      const origDraw = proto.drawImage;
      proto.drawImage = function () { throw 'WEBKIT_OPAQUE_FAILURE'; };  // string throw

      app.$data.optMaxImageLen = 400;
      app.katsu.media_previews = [];
      app.katsu.media_attachments = [];
      app.action_lock = '';
      const OriginalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function () { const x = new OriginalXHR(); x.send = function(){}; return x; };
      window.XMLHttpRequest.DONE = 4;
      
      app.checkActMedia([file]);
      await new Promise(r => setTimeout(r, 800));
      out.caseB_text = app.result_text;
      
      proto.drawImage = origDraw;
      window.XMLHttpRequest = OriginalXHR;
    }
    
    return out;
  });

  console.log('=== Error message detail verification ===\n');
  console.log('Case A: toBlob returns null');
  console.log('  result_text:', result.caseA_text);
  console.log('  (expect: includes "toBlob returned null", NOT "unknown")');
  console.log();
  console.log('Case B: drawImage throws a string (no .message)');
  console.log('  result_text:', result.caseB_text);
  console.log('  (expect: includes "WEBKIT_OPAQUE_FAILURE", NOT "unknown")');
  
  if (!/toBlob returned null/.test(result.caseA_text)) fail.push('Case A: missing specific message');
  if (/（unknown）/.test(result.caseB_text)) fail.push('Case B: still shows "unknown" — improvement did not apply');
  if (!/WEBKIT_OPAQUE_FAILURE/.test(result.caseB_text)) fail.push('Case B: error detail not shown');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (error messages now carry diagnostic info)'); }
