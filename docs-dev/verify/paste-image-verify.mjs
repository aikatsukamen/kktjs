// paste-image-verify.mjs — 画像貼り付け時にテキストの同時貼り付け（ブラウザ既定動作）が
// 抑制されることを検証する。
//
// 観点:
//   (1) クリップボードに画像ファイルがある paste → preventDefault が呼ばれ、checkActMedia に渡る
//   (2) テキストのみの paste → preventDefault は呼ばれない（テキスト貼り付けは従来どおり）
//   (3) 未ログイン(at=null) → 何もしない（preventDefault も呼ばない）
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5207;
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
    class FakeWS { constructor(){ this.readyState=0; setTimeout(()=>{this.readyState=1; this.onopen&&this.onopen({});},0);} send(){} close(){this.readyState=3;} addEventListener(){} removeEventListener(){} }
    FakeWS.OPEN=1; window.WebSocket = FakeWS;
    window.fetch = () => Promise.resolve(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    localStorage.setItem('at', JSON.stringify({ access_token: 'T', token_type: 'Bearer' }));
    localStorage.setItem('work_user', JSON.stringify({ id:'1', username:'t', acct:'t', display_name:'T', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', created_at:'2020-01-01T00:00:00Z' }));
    localStorage.setItem('conf_std', JSON.stringify({ ver: 999 }));
  });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(700);

  // checkActMedia をフックして「画像処理に入ったか」を観測
  await page.evaluate(() => {
    const app = window.app;
    if (!app.$data.katsu) app.$data.katsu = {};
    app.$data.katsu.media_previews = [];
    app.$data.katsu.media_attachments = [];
    window.__checkActMediaCalled = 0;
    const orig = app.checkActMedia.bind(app);
    app.checkActMedia = function (files) { window.__checkActMediaCalled++; window.__lastFiles = files && files.length; /* don't actually upload */ };
  });

  // ヘルパ: 合成 paste イベントを作って importpaste に渡し、preventDefault が呼ばれたか観測
  const firePaste = async (cfg) => page.evaluate((cfg) => {
    const app = window.app;
    app.$data.at = cfg.loggedIn ? 'TESTTOKEN' : null;
    app.$data.showForm = true;
    app.$data.showFormVote = false;
    app.$data.katsu.media_previews = [];
    app.$data.katsu.media_attachments = [];
    window.__checkActMediaCalled = 0;

    // 合成イベント: clipboardData.files / getData を模す
    let prevented = false;
    const files = [];
    if (cfg.hasImage) {
      // 1x1 PNG を File として持たせる
      const bytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII='), c=>c.charCodeAt(0));
      files.push(new File([bytes], 'pasted.png', { type: 'image/png' }));
    }
    const evt = {
      clipboardData: {
        files,
        getData: (type) => cfg.text || '',
        items: [],
      },
      preventDefault: () => { prevented = true; },
    };
    window.importpaste(evt);
    return { prevented, checkActMediaCalled: window.__checkActMediaCalled };
  }, cfg);

  // (1) 画像あり paste
  const r1 = await firePaste({ loggedIn: true, hasImage: true, text: 'https://example.com/img.png' });
  console.log('--- (1) paste WITH image file ---');
  console.log('  preventDefault called :', r1.prevented, '(expect true) ← stops text paste');
  console.log('  checkActMedia called  :', r1.checkActMediaCalled, '(expect 1)');
  if (!r1.prevented) fail.push('(1) preventDefault NOT called on image paste (text would be pasted too - THE BUG)');
  if (r1.checkActMediaCalled < 1) fail.push('(1) checkActMedia not called on image paste');

  // (2) テキストのみ paste
  const r2 = await firePaste({ loggedIn: true, hasImage: false, text: 'hello world' });
  console.log('\n--- (2) paste TEXT only (no image) ---');
  console.log('  preventDefault called :', r2.prevented, '(expect false) ← text paste must work normally');
  console.log('  checkActMedia called  :', r2.checkActMediaCalled, '(expect 0)');
  if (r2.prevented) fail.push('(2) preventDefault wrongly called on text-only paste (would block normal text paste)');
  if (r2.checkActMediaCalled !== 0) fail.push('(2) checkActMedia wrongly called on text-only paste');

  // (3) 未ログイン + 画像 paste
  const r3 = await firePaste({ loggedIn: false, hasImage: true, text: '' });
  console.log('\n--- (3) paste with image but NOT logged in ---');
  console.log('  preventDefault called :', r3.prevented, '(expect false)');
  console.log('  checkActMedia called  :', r3.checkActMediaCalled, '(expect 0)');
  if (r3.prevented) fail.push('(3) preventDefault called while logged out');
  if (r3.checkActMediaCalled !== 0) fail.push('(3) checkActMedia called while logged out');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f => console.log('  - ' + f)); process.exit(1); }
else { console.log('RESULT: PASS (image paste suppresses text; text-only paste unaffected)'); }
