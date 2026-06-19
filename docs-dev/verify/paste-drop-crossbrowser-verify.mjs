// paste-drop-crossbrowser-verify.mjs — paste/drop ハンドラのクロスブラウザ堅牢性を検証。
// 実 WebKit/Firefox バイナリはこの環境に無いため、Chromium 上で各ブラウザ特有の
// イベント形状（clipboardData 不在、files 空、cancelable=false 等）をシミュレートする。
//
// 観点:
//   (A) clipboardData が undefined（古い/一部 Android）→ 落ちずにテキスト貼り付けに委ねる
//   (B) clipboardData.files が undefined → 同上
//   (C) files が空で items だけある（画像が items 経由のブラウザ）→ 落ちない（今回は items 非対応だが安全に離脱）
//   (D) dataTransfer 不在の drop → 落ちない
//   (E) 正常な画像 paste → preventDefault + checkActMedia
//   (F) テキストのみ paste → preventDefault せず素通り
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5208;
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
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  await page.addInitScript(() => {
    class FakeWS { constructor(){ this.readyState=0; setTimeout(()=>{this.readyState=1; this.onopen&&this.onopen({});},0);} send(){} close(){this.readyState=3;} addEventListener(){} removeEventListener(){} }
    FakeWS.OPEN=1; window.WebSocket = FakeWS;
    window.fetch = () => Promise.resolve(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    localStorage.setItem('at', JSON.stringify({ access_token: 'T', token_type: 'Bearer' }));
    localStorage.setItem('work_user', JSON.stringify({ id:'1', username:'t', acct:'t', display_name:'T', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', created_at:'2020-01-01T00:00:00Z' }));
    localStorage.setItem('conf_std', JSON.stringify({ ver: 999 }));
  });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(700);

  await page.evaluate(() => {
    const app = window.app;
    if (!app.$data.katsu) app.$data.katsu = {};
    app.checkActMedia = function (files) { window.__cam = (window.__cam||0)+1; window.__camLen = files && files.length; };
  });

  // 汎用: paste イベント形状を指定して importpaste を呼び、結果を返す
  const paste = (shape) => page.evaluate((shape) => {
    const app = window.app;
    app.$data.at = 'T'; app.$data.showForm = true; app.$data.showFormVote = false;
    app.$data.katsu.media_previews = []; app.$data.katsu.media_attachments = [];
    window.__cam = 0; window.__camLen = undefined;
    let prevented = false, threw = null;
    let cd;
    if (shape.noClipboard) cd = undefined;
    else if (shape.noFiles) cd = { getData: () => shape.text||'' , items: [] };
    else {
      const files = [];
      if (shape.hasImage) { const b = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII='), c=>c.charCodeAt(0)); files.push(new File([b],'p.png',{type:'image/png'})); }
      cd = { files, getData: () => shape.text||'', items: shape.itemsOnly ? [{kind:'string',type:'text/plain'}] : [] };
    }
    const evt = { clipboardData: cd, preventDefault: () => { prevented = true; } };
    try { window.importpaste(evt); } catch (e) { threw = e.message; }
    return { prevented, threw, cam: window.__cam, camLen: window.__camLen };
  }, shape);

  const drop = (shape) => page.evaluate((shape) => {
    const app = window.app;
    app.$data.at = 'T'; app.$data.showForm = true; app.$data.showFormVote = false;
    app.$data.katsu.media_previews = []; app.$data.katsu.media_attachments = [];
    window.__cam = 0;
    let threw = null;
    let dt;
    if (shape.noDataTransfer) dt = undefined;
    else { const files=[]; if (shape.hasImage){const b=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII='),c=>c.charCodeAt(0));files.push(new File([b],'p.png',{type:'image/png'}));} dt={files}; }
    const evt = { dataTransfer: dt, preventDefault: () => {} };
    try { window.importdrop(evt); } catch (e) { threw = e.message; }
    return { threw, cam: window.__cam };
  }, shape);

  // (A) clipboardData undefined
  const A = await paste({ noClipboard: true });
  console.log('(A) clipboardData undefined   :', JSON.stringify(A), A.threw ? '✗' : '✓');
  if (A.threw) fail.push('(A) threw on missing clipboardData: ' + A.threw);
  if (A.prevented) fail.push('(A) preventDefault wrongly called (no clipboard)');

  // (B) clipboardData.files undefined
  const B = await paste({ noFiles: true, text: 'hi' });
  console.log('(B) files undefined           :', JSON.stringify(B), B.threw ? '✗' : '✓');
  if (B.threw) fail.push('(B) threw on missing files: ' + B.threw);
  if (B.prevented) fail.push('(B) preventDefault wrongly called (no files)');

  // (C) files empty + items only (image via items, not supported but must not crash/paste-block)
  const C = await paste({ hasImage: false, itemsOnly: true, text: 'x' });
  console.log('(C) files empty, items only   :', JSON.stringify(C), C.threw ? '✗' : '✓');
  if (C.threw) fail.push('(C) threw with items-only: ' + C.threw);
  if (C.prevented) fail.push('(C) preventDefault wrongly called (no files, items only)');

  // (D) drop with no dataTransfer
  const D = await drop({ noDataTransfer: true });
  console.log('(D) drop no dataTransfer      :', JSON.stringify(D), D.threw ? '✗' : '✓');
  if (D.threw) fail.push('(D) drop threw on missing dataTransfer: ' + D.threw);

  // (E) normal image paste
  const E = await paste({ hasImage: true, text: 'https://x/y.png' });
  console.log('(E) image paste               :', JSON.stringify(E), (E.prevented && E.cam===1) ? '✓' : '✗');
  if (!E.prevented) fail.push('(E) image paste did not preventDefault');
  if (E.cam !== 1) fail.push('(E) image paste did not call checkActMedia');

  // (F) text-only paste
  const F = await paste({ hasImage: false, text: 'hello' });
  console.log('(F) text-only paste           :', JSON.stringify(F), (!F.prevented && F.cam===0) ? '✓' : '✗');
  if (F.prevented) fail.push('(F) text-only paste wrongly prevented default');
  if (F.cam !== 0) fail.push('(F) text-only paste wrongly called checkActMedia');

  // (G) normal image drop
  const G = await drop({ hasImage: true });
  console.log('(G) image drop                :', JSON.stringify(G), (G.cam===1) ? '✓' : '✗');
  if (G.threw) fail.push('(G) image drop threw: ' + G.threw);
  if (G.cam !== 1) fail.push('(G) image drop did not call checkActMedia');

  if (pageErrors.length) { console.log('\npage errors:', pageErrors.slice(0,3)); fail.push(pageErrors.length + ' page error(s)'); }

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f => console.log('  - ' + f)); process.exit(1); }
else { console.log('RESULT: PASS (all paste/drop edge cases handled without crashing)'); }
