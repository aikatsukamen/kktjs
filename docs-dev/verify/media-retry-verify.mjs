// media-retry-verify.mjs — 「一度失敗した画像がそれ以降ずっと失敗する」問題の検証。
//
// 検証内容:
//   A. 同じファイルを連続 2 回選択しても、2 回目も onload が発火して送信まで到達する
//      （共有 Image の src が同値だと再読み込みされない問題の回帰テスト）
//   B. 1 回目が 422 で失敗したあと、同じファイルを選び直すと再送信される
//   C. action_lock が 'media' のまま残っていても、ファイル選択で回復する
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5252;
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

    function makeFile(name) {
      const c = document.createElement('canvas');
      c.width = 600; c.height = 400;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#3366aa'; ctx.fillRect(0, 0, 600, 400);
      const du = c.toDataURL('image/jpeg', 0.9);
      const bin = atob(du.split(',')[1]);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return new File([u8], name, { type: 'image/jpeg' });
    }

    // XHR を「指定 status を返す」形でモックし、send 回数を数える
    function installXHR(status, responseText) {
      const OriginalXHR = window.XMLHttpRequest;
      const state = { sendCount: 0, restore: () => { window.XMLHttpRequest = OriginalXHR; } };
      window.XMLHttpRequest = function () {
        const xhr = new OriginalXHR();
        xhr.open = function () {};
        xhr.setRequestHeader = function () {};
        xhr.send = function () {
          state.sendCount++;
          setTimeout(() => {
            Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
            Object.defineProperty(xhr, 'status', { value: status, configurable: true });
            Object.defineProperty(xhr, 'responseText', { value: responseText, configurable: true });
            xhr.onreadystatechange && xhr.onreadystatechange();
          }, 20);
        };
        return xhr;
      };
      window.XMLHttpRequest.DONE = 4;
      return state;
    }

    app.$data.optMaxImageLen = 400;  // 縮小あり → canvas 経路を通す

    // --- A: 同じ内容のファイルを連続 2 回選択 ---
    {
      const st = installXHR(200, '{"id":"a","url":"u","preview_url":"p","type":"image"}');
      app.katsu.media_previews = []; app.katsu.media_attachments = []; app.action_lock = '';
      app.checkActMedia([makeFile('same.jpeg')]);
      await new Promise(r => setTimeout(r, 700));
      const firstSends = st.sendCount;
      // 2 回目（内容もファイル名も同一 → data URL が同値になる）
      app.checkActMedia([makeFile('same.jpeg')]);
      await new Promise(r => setTimeout(r, 700));
      out.A_firstSends = firstSends;
      out.A_totalSends = st.sendCount;
      st.restore();
    }

    // --- B: 422 で失敗したあと、同じファイルで再試行 ---
    {
      const st = installXHR(422, '{"error":"バリデーションに失敗しました: File ..."}');
      app.katsu.media_previews = []; app.katsu.media_attachments = []; app.action_lock = '';
      app.checkActMedia([makeFile('retry.jpeg')]);
      await new Promise(r => setTimeout(r, 700));
      out.B_afterFailLock = app.action_lock;
      const sendsAfterFail = st.sendCount;
      // 同じファイルで再試行
      app.checkActMedia([makeFile('retry.jpeg')]);
      await new Promise(r => setTimeout(r, 700));
      out.B_sendsAfterFail = sendsAfterFail;
      out.B_totalSends = st.sendCount;
      st.restore();
    }

    // --- C: action_lock が残留している状態からの回復 ---
    {
      const st = installXHR(200, '{"id":"c","url":"u","preview_url":"p","type":"image"}');
      app.katsu.media_previews = []; app.katsu.media_attachments = []; 
      app.action_lock = 'media';   // 残留ロックを人為的に再現
      app.checkActMedia([makeFile('stale.jpeg')]);
      await new Promise(r => setTimeout(r, 700));
      out.C_sends = st.sendCount;
      out.C_uploaded = app.katsu.media_attachments.length;
      st.restore();
    }

    return out;
  });

  console.log('=== media retry / stale-state verification ===\n');
  console.log('A. 同一ファイルを連続 2 回選択');
  console.log('   1回目の send 回数 :', result.A_firstSends, '(expect 1)');
  console.log('   累計 send 回数    :', result.A_totalSends, '(expect 2 = 2回目も送信された)');
  console.log();
  console.log('B. 422 失敗後に同じファイルで再試行');
  console.log('   失敗後の action_lock:', JSON.stringify(result.B_afterFailLock), '(expect "")');
  console.log('   失敗時点の send 回数:', result.B_sendsAfterFail, '(expect 1)');
  console.log('   累計 send 回数      :', result.B_totalSends, '(expect 2 = 再送された)');
  console.log();
  console.log('C. action_lock 残留状態から回復');
  console.log('   send 回数         :', result.C_sends, '(expect 1)');
  console.log('   添付成功件数      :', result.C_uploaded, '(expect 1)');

  if (result.A_firstSends !== 1) fail.push('A: first upload did not send');
  if (result.A_totalSends !== 2) fail.push('A: same file re-selection did NOT re-send (shared Image src cache bug)');
  if (result.B_afterFailLock !== '') fail.push('B: action_lock left behind after 422');
  if (result.B_totalSends !== 2) fail.push('B: retry after failure did not re-send');
  if (result.C_sends !== 1) fail.push('C: stale action_lock blocked new upload');
  if (result.C_uploaded !== 1) fail.push('C: upload did not complete from stale lock state');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (same-file re-selection, retry after failure, and stale-lock recovery all work)'); }
