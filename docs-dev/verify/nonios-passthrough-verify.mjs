// nonios-passthrough-verify.mjs — 非 iOS（デフォルトの Chromium UA）では、縮小不要な画像は
// canvas を通さず元ファイルをそのまま送る（無駄な再エンコードをしない）ことを確認。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5245;
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.woff':'font/woff','.woff2':'font/woff2','.svg':'image/svg+xml','.ico':'image/x-icon','.map':'application/json' };
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
  browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
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
    const c = document.createElement('canvas');
    c.width = 1000; c.height = 800;
    const ctx = c.getContext('2d'); ctx.fillStyle='#123'; ctx.fillRect(0,0,1000,800);
    const dataUrl = c.toDataURL('image/jpeg', 0.9);
    const bin = atob(dataUrl.split(',')[1]);
    const u8 = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
    const file = new File([new Blob([u8],{type:'image/jpeg'})], 'pc.jpeg', { type:'image/jpeg' });
    app.$data.optMaxImageLen = 1280; // 1000 < 1280 → 縮小不要
    let captured = null;
    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function () { const xhr = new OriginalXHR(); xhr.send = function(body){ captured=body; setTimeout(()=>{ Object.defineProperty(xhr,'readyState',{value:4}); Object.defineProperty(xhr,'status',{value:200}); Object.defineProperty(xhr,'responseText',{value:'{"id":"x","url":"y","preview_url":"z","type":"image"}'}); xhr.onreadystatechange&&xhr.onreadystatechange(); },30); }; return xhr; };
    window.XMLHttpRequest.DONE = 4;
    app.katsu.media_previews=[]; app.katsu.media_attachments=[]; app.action_lock='';
    app.checkActMedia([file]);
    await new Promise(r=>setTimeout(r,900));
    const out = { uploaded: app.katsu.media_attachments.length, originalSize: file.size };
    if (captured) { const f = captured.get('file'); out.sentSize = f?f.size:0; }
    window.XMLHttpRequest = OriginalXHR;
    return out;
  });
  console.log('=== non-iOS passthrough (no downscale) ===\n');
  console.log('  uploaded          :', result.uploaded);
  console.log('  original size     :', result.originalSize);
  console.log('  sent size         :', result.sentSize);
  console.log('  (expect sent == original: passthrough, no re-encode)');
  if (result.uploaded !== 1) fail.push('not uploaded');
  if (result.sentSize !== result.originalSize) fail.push('non-iOS unexpectedly re-encoded (sent != original)');
  await page.close();
} finally { if (browser) await browser.close(); server.close(); }
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (non-iOS passes through original file when no downscale needed)'); }
