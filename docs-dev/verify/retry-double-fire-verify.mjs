// retry-double-fire-verify.mjs — 接続断のとき upload.onerror と xhr.onerror が
// 両方発火しても、再送が二重に走らず、成功後に action_lock が確実に解放されることを検証。
//
// 実機症状: リトライで成功した直後、投稿も追加の画像添付もできなくなる
//           （= action_lock が 'media' のまま残る）
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5256;
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
  await page.waitForTimeout(800);

  const result = await page.evaluate(async () => {
    const app = window.app;
    const out = {};

    // 1回目: upload.onerror と xhr.onerror を両方発火（実機の接続断と同じ）
    // 2回目以降: 成功
    function installXHR(failCount) {
      const OriginalXHR = window.XMLHttpRequest;
      const state = { sendCount: 0, restore: () => { window.XMLHttpRequest = OriginalXHR; } };
      window.XMLHttpRequest = function () {
        const xhr = new OriginalXHR();
        const up = {};
        xhr.open = function () {};
        xhr.setRequestHeader = function () {};
        Object.defineProperty(xhr, 'upload', {
          get() {
            return {
              set onprogress(fn) { up.progress = fn; },
              set onerror(fn) { up.error = fn; },
              set ontimeout(fn) { up.timeout = fn; },
            };
          }, configurable: true
        });
        xhr.send = function () {
          state.sendCount++;
          const n = state.sendCount;
          setTimeout(() => {
            if (n <= failCount) {
              Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
              Object.defineProperty(xhr, 'status', { value: 0, configurable: true });
              // 実機同様、両方のエラーハンドラが発火する
              up.error && up.error({ type: 'error' });
              xhr.onreadystatechange && xhr.onreadystatechange();
              xhr.onerror && xhr.onerror({ type: 'error' });
            } else {
              Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
              Object.defineProperty(xhr, 'status', { value: 200, configurable: true });
              Object.defineProperty(xhr, 'responseText', { value: '{"id":"m' + n + '","url":"u","preview_url":"p","type":"image"}', configurable: true });
              xhr.onreadystatechange && xhr.onreadystatechange();
            }
          }, 20);
        };
        return xhr;
      };
      window.XMLHttpRequest.DONE = 4;
      return state;
    }

    const st = installXHR(1);
    app.katsu.media_previews = []; app.katsu.media_attachments = []; app.action_lock = ''; app.result_text = '';
    app.actMedia('data:image/jpeg;base64,AAAA', new Blob([new Uint8Array(4096)], { type: 'image/jpeg' }), true);
    await new Promise(r => setTimeout(r, 3000));

    out.sendCount = st.sendCount;
    out.attachments = app.katsu.media_attachments.length;
    out.previews = app.katsu.media_previews.length;
    out.lock = app.action_lock;
    out.resultText = app.result_text;
    st.restore();

    // ロックが解放されていれば、続けて2枚目を添付できるはず
    const st2 = installXHR(0);
    app.actMedia('data:image/jpeg;base64,BBBB', new Blob([new Uint8Array(2048)], { type: 'image/jpeg' }), true);
    await new Promise(r => setTimeout(r, 600));
    out.secondSend = st2.sendCount;
    out.attachmentsAfter = app.katsu.media_attachments.length;
    out.lockAfter = app.action_lock;
    st2.restore();

    return out;
  });

  console.log('=== retry double-fire / lock release ===\n');
  console.log('1枚目（1回失敗 → 再送で成功）');
  console.log('   送信回数      :', result.sendCount, '(expect 2 = 再送は1回だけ)');
  console.log('   添付件数      :', result.attachments, '(expect 1 = 二重添付しない)');
  console.log('   preview 残数  :', result.previews, '(expect 1)');
  console.log('   action_lock   :', JSON.stringify(result.lock), '(expect "")');
  console.log('   result_text   :', JSON.stringify(result.resultText), '(expect "")');
  console.log();
  console.log('2枚目（続けて添付できるか）');
  console.log('   送信回数      :', result.secondSend, '(expect 1)');
  console.log('   累計添付件数  :', result.attachmentsAfter, '(expect 2)');
  console.log('   action_lock   :', JSON.stringify(result.lockAfter), '(expect "")');

  if (result.sendCount !== 2) fail.push('retry fired more than once (double-send)');
  if (result.attachments !== 1) fail.push('attachment count wrong (double attach?)');
  if (result.lock !== '') fail.push('action_lock stuck after successful retry — blocks posting and further uploads');
  if (result.resultText !== '') fail.push('progress text left behind');
  if (result.secondSend !== 1) fail.push('second upload did not start (lock was stuck)');
  if (result.attachmentsAfter !== 2) fail.push('second attachment failed');
  if (result.lockAfter !== '') fail.push('action_lock stuck after second upload');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (single retry, single attach, lock released, next upload works)'); }
