// progress-clear-verify.mjs — 「画像を縮小しています…」等の進行メッセージが
// アップロード完了後に自動で消えることを検証する。
//
// 観点:
//   (1) 縮小処理中は result_text に進行メッセージが入る
//   (2) アップロード成功(XHR 200)後、result_text が自動で空になる（タップ不要）
//   (3) 無関係な通知が出ている最中の完了では、その通知を消さない（進行メッセージのときだけ消す）
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5206;
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
    // /api/v1/media への XHR を成功でモック（少し遅延を入れて「処理中→完了」を観測可能に）
    const OrigXHR = window.XMLHttpRequest;
    function MockXHR() {
      const x = new OrigXHR();
      const realOpen = x.open.bind(x);
      const realSend = x.send.bind(x);
      let mock = false;
      x.open = function (m, url, ...rest) { mock = /\/api\/v1\/media/.test(url); if (!mock) return realOpen(m, url, ...rest); };
      Object.defineProperty(x, 'setRequestHeader', { value: function(){ } });
      x.send = function () {
        if (!mock) return realSend.apply(x, arguments);
        setTimeout(() => {
          try {
            Object.defineProperty(x, 'readyState', { configurable: true, get: () => 4 });
            Object.defineProperty(x, 'status', { configurable: true, get: () => 200 });
            Object.defineProperty(x, 'responseText', { configurable: true, get: () => '{"id":"m1","type":"image","url":"http://x/y.jpg","preview_url":"http://x/y.jpg"}' });
          } catch(e){}
          if (typeof x.onreadystatechange === 'function') x.onreadystatechange();
        }, 250);
      };
      return x;
    }
    MockXHR.DONE = 4;
    window.XMLHttpRequest = MockXHR;
    localStorage.setItem('at', JSON.stringify({ access_token: 'T', token_type: 'Bearer' }));
    localStorage.setItem('work_user', JSON.stringify({ id:'1', username:'t', acct:'t', display_name:'T', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', created_at:'2020-01-01T00:00:00Z' }));
    localStorage.setItem('conf_std', JSON.stringify({ ver: 999 }));
  });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(700);

  await page.evaluate(() => {
    const app = window.app;
    if (!app.$data.katsu) app.$data.katsu = {};
    app.$data.katsu.media_previews = [];
    app.$data.katsu.media_attachments = [];
    app.$data.repository = 'example.com';
    app.$data.at = 'TESTTOKEN';
  });

  // (1)(2) 縮小処理中に進行メッセージ → アップロード完了後に自動クリア
  const r = await page.evaluate(async () => {
    const app = window.app;
    app.$data.optMaxImageLen = 512;
    app.$data.optConvMedia = 'off';
    app.$data.action_lock = '';
    app.$data.result_text = '';
    app.$data.katsu.media_previews = [];
    app.$data.katsu.media_attachments = [];

    const c = document.createElement('canvas'); c.width=2000; c.height=1500;
    const cx = c.getContext('2d'); cx.fillStyle='green'; cx.fillRect(0,0,2000,1500);
    const blob = await new Promise(res => c.toBlob(res, 'image/png'));
    const file = new File([blob], 'big.png', { type: 'image/png' });

    app.checkActMedia([file]);
    // 処理中の result_text をいくつかのタイミングで観測
    const samples = [];
    for (let i=0;i<20;i++){
      samples.push(app.$data.result_text);
      // attachments が入った=アップロード完了 を検知したらもう少し待って最終値も取る
      await new Promise(r=>setTimeout(r,80));
    }
    return {
      sawProgress: samples.some(s => /縮小しています|読み込んでいます/.test(s)),
      finalText: app.$data.result_text,
      uploaded: app.$data.katsu.media_attachments.length,
    };
  });
  console.log('--- (1)(2) progress shown during, cleared after upload ---');
  console.log('  saw progress message during processing:', r.sawProgress, '(expect true)');
  console.log('  attachments uploaded                  :', r.uploaded, '(expect 1)');
  console.log('  final result_text after upload        :', JSON.stringify(r.finalText), '(expect "")');
  if (!r.sawProgress) fail.push('(1) progress message was never shown');
  if (r.uploaded < 1) fail.push('(2) upload did not complete');
  if (r.finalText !== '') fail.push('(2) progress message did NOT auto-clear after upload (the complaint): "' + r.finalText + '"');

  // (3) 無関係な通知が出ている状態で完了 → その通知は消さない
  const r3 = await page.evaluate(async () => {
    const app = window.app;
    app.$data.optMaxImageLen = 0;       // 縮小なし(passthrough)で素早く完了させる
    app.$data.optConvMedia = 'off';
    app.$data.action_lock = '';
    app.$data.katsu.media_previews = [];
    app.$data.katsu.media_attachments = [];

    const c = document.createElement('canvas'); c.width=300; c.height=200;
    const cx = c.getContext('2d'); cx.fillStyle='blue'; cx.fillRect(0,0,300,200);
    const blob = await new Promise(res => c.toBlob(res, 'image/png'));
    const file = new File([blob], 'small.png', { type: 'image/png' });

    app.checkActMedia([file]);
    // アップロードの XHR が飛んだ直後に、無関係な通知で result_text を上書き
    await new Promise(r=>setTimeout(r,60));
    app.$data.result_text = '★お知らせ: 無関係な通知';
    // 完了を待つ
    for (let i=0;i<15;i++){ if (app.$data.katsu.media_attachments.length>0) break; await new Promise(r=>setTimeout(r,80)); }
    await new Promise(r=>setTimeout(r,150));
    return { finalText: app.$data.result_text, uploaded: app.$data.katsu.media_attachments.length };
  });
  console.log('\n--- (3) unrelated notification must survive upload completion ---');
  console.log('  uploaded     :', r3.uploaded);
  console.log('  final text   :', JSON.stringify(r3.finalText), '(expect the unrelated notice, NOT cleared)');
  if (!/無関係な通知/.test(r3.finalText)) fail.push('(3) unrelated notification was wrongly cleared');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f => console.log('  - ' + f)); process.exit(1); }
else { console.log('RESULT: PASS (progress auto-clears after upload; unrelated notices preserved)'); }
