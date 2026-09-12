// media-upload-retry-verify.mjs — 接続断（rs=4, st=0, onerror）での自動リトライを検証。
//   A. 1回失敗 → リトライで成功する（送信2回、添付成功、エラー表示なし）
//   B. 全試行失敗 → 3回送信して最終的にエラー。診断情報に try= が入る
//   C. サーバが 422 を返した場合はリトライしない（1回だけ、popError 経由）
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5254;
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

    function makeBlob() {
      return new Blob([new Uint8Array(4096)], { type: 'image/jpeg' });
    }

    // failCount 回だけ接続断を起こし、その後は成功させる XHR モック
    function installXHR(failCount, finalStatus, finalBody) {
      const OriginalXHR = window.XMLHttpRequest;
      const state = { sendCount: 0, urls: [], restore: () => { window.XMLHttpRequest = OriginalXHR; } };
      window.XMLHttpRequest = function () {
        const xhr = new OriginalXHR();
        let openedUrl = '';
        xhr.open = function (m, u) { openedUrl = u; };
        xhr.setRequestHeader = function () {};
        xhr.send = function () {
          state.sendCount++;
          state.urls.push(openedUrl);
          const n = state.sendCount;
          setTimeout(() => {
            if (n <= failCount) {
              // 接続断: readyState=4, status=0, onerror
              Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
              Object.defineProperty(xhr, 'status', { value: 0, configurable: true });
              xhr.onreadystatechange && xhr.onreadystatechange();
              xhr.onerror && xhr.onerror({ type: 'error' });
            } else {
              Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
              Object.defineProperty(xhr, 'status', { value: finalStatus, configurable: true });
              Object.defineProperty(xhr, 'responseText', { value: finalBody, configurable: true });
              xhr.onreadystatechange && xhr.onreadystatechange();
            }
          }, 15);
        };
        return xhr;
      };
      window.XMLHttpRequest.DONE = 4;
      return state;
    }

    // --- A: 1回失敗 → リトライで成功 ---
    {
      const st = installXHR(1, 200, '{"id":"a","url":"u","preview_url":"p","type":"image"}');
      app.katsu.media_previews = []; app.katsu.media_attachments = []; app.action_lock = ''; app.result_text = '';
      app.actMedia('data:image/jpeg;base64,AAAA', makeBlob(), true);
      await new Promise(r => setTimeout(r, 2500));
      out.A_sends = st.sendCount;
      out.A_uploaded = app.katsu.media_attachments.length;
      out.A_result = app.result_text;
      out.A_lock = app.action_lock;
      out.A_secondUrlHasBuster = st.urls.length > 1 ? /_r=/.test(st.urls[1]) : false;
      st.restore();
    }

    // --- B: 全部失敗 ---
    {
      const st = installXHR(99, 200, '{}');
      app.katsu.media_previews = []; app.katsu.media_attachments = []; app.action_lock = ''; app.result_text = '';
      app.actMedia('data:image/jpeg;base64,AAAA', makeBlob(), true);
      await new Promise(r => setTimeout(r, 4000));
      out.B_sends = st.sendCount;
      out.B_result = app.result_text;
      out.B_lock = app.action_lock;
      out.B_previews = app.katsu.media_previews.length;
      st.restore();
    }

    // --- C: 422 はリトライしない ---
    {
      const st = installXHR(0, 422, '{"error":"バリデーションに失敗しました: File ..."}');
      app.katsu.media_previews = []; app.katsu.media_attachments = []; app.action_lock = ''; app.result_text = '';
      app.actMedia('data:image/jpeg;base64,AAAA', makeBlob(), true);
      await new Promise(r => setTimeout(r, 2500));
      out.C_sends = st.sendCount;
      out.C_result = app.result_text;
      out.C_lock = app.action_lock;
      st.restore();
    }

    return out;
  });

  console.log('=== media upload retry verification ===\n');
  console.log('A. 1回失敗 → リトライで成功');
  console.log('   送信回数        :', result.A_sends, '(expect 2)');
  console.log('   添付成功件数    :', result.A_uploaded, '(expect 1)');
  console.log('   最終 result_text:', JSON.stringify(result.A_result), '(expect "")');
  console.log('   action_lock     :', JSON.stringify(result.A_lock), '(expect "")');
  console.log('   2回目URLに _r=  :', result.A_secondUrlHasBuster, '(expect true)');
  console.log();
  console.log('B. 全試行失敗');
  console.log('   送信回数        :', result.B_sends, '(expect 3 = 初回+2リトライ)');
  console.log('   result_text     :', result.B_result);
  console.log('   action_lock     :', JSON.stringify(result.B_lock), '(expect "")');
  console.log('   preview 残数    :', result.B_previews, '(expect 0)');
  console.log();
  console.log('C. 422 はリトライしない');
  console.log('   送信回数        :', result.C_sends, '(expect 1)');
  console.log('   result_text     :', result.C_result);
  console.log('   action_lock     :', JSON.stringify(result.C_lock), '(expect "")');

  if (result.A_sends !== 2) fail.push('A: retry did not happen exactly once');
  if (result.A_uploaded !== 1) fail.push('A: upload did not succeed after retry');
  if (result.A_result !== '') fail.push('A: progress/error text left behind after success');
  if (result.A_lock !== '') fail.push('A: action_lock not released');
  if (!result.A_secondUrlHasBuster) fail.push('A: retry URL missing cache buster');
  if (result.B_sends !== 3) fail.push('B: expected 3 attempts total');
  if (!/try=3/.test(result.B_result)) fail.push('B: final error missing try= count');
  if (!/rs=4/.test(result.B_result)) fail.push('B: final error missing rs=');
  if (result.B_lock !== '') fail.push('B: action_lock not released after exhausting retries');
  if (result.B_previews !== 0) fail.push('B: preview not popped after failure');
  if (result.C_sends !== 1) fail.push('C: 422 should not be retried');
  if (!/422/.test(result.C_result)) fail.push('C: 422 error not surfaced');
  if (result.C_lock !== '') fail.push('C: action_lock not released after 422');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (transient drops are retried; 422 is not; lock always released)'); }
