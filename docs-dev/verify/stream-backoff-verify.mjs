// stream-backoff-verify.mjs — WebSocket が即座に失敗し続けるとき、再接続（とタイムライン再取得）が
// 待ち時間なしに連打されないことを検証する。
//   A. 即失敗が続く状態で 4.5 秒間に張られた Home ソケット数が少数（バックオフが効いている）
//   B. 10秒以上安定していた接続の切断は、失敗回数をリセットして即時再接続する
//   C. kktjsForceReconnectAll（アプリ復帰）でバックオフがリセットされ即時に張り直す
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5257;
const EXE = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
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
    // mode='open' なら正常接続、'fail' なら生成直後に error → close（ネットワーク断・接続拒否相当）
    window.__wsMode = 'open';
    window.__wsLog = [];
    class FakeWS {
      constructor(url) {
        this.url = url; this.readyState = 0;
        window.__wsLog.push({ url, t: Date.now() });
        if (window.__wsMode === 'fail') {
          setTimeout(() => {
            this.readyState = 3;
            this.onerror && this.onerror({});
            this.onclose && this.onclose({});
          }, 5);
        } else {
          setTimeout(() => { this.readyState = 1; this.onopen && this.onopen({}); }, 0);
        }
      }
      send() {}
      close() { this.readyState = 3; }
      addEventListener() {} removeEventListener() {}
    }
    FakeWS.OPEN = 1;
    window.WebSocket = FakeWS;
    // タイムライン再取得（XHR）は外へ出さない
    const OX = window.XMLHttpRequest;
    window.XMLHttpRequest = function () { const x = new OX(); x.send = function () {}; return x; };
    window.XMLHttpRequest.DONE = 4;
    window.fetch = () => Promise.resolve(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    localStorage.setItem('at', JSON.stringify({ access_token: 'T', token_type: 'Bearer' }));
    localStorage.setItem('work_user', JSON.stringify({ id:'1', username:'t', acct:'t', display_name:'T', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', created_at:'2020-01-01T00:00:00Z' }));
    localStorage.setItem('conf_std', JSON.stringify({ ver: 999 }));
  });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  const result = await page.evaluate(async () => {
    const app = window.app;
    const S = window.__kktjsStream;
    const B = window.__kktjsStreamBackoffs;   // 修正前ビルドには存在しない
    const isHome = (e) => /stream=user/.test(e.url);
    const out = {};
    app.app_active = true;

    // --- A: 即失敗が続く ---
    window.__wsMode = 'fail';
    if (B) { B.home.attempt = 0; B.home.openedAt = 0; if (B.home.timer) { clearTimeout(B.home.timer); B.home.timer = null; } }
    const t0 = Date.now();
    // 現在の Home ソケットを切断させてループを起動
    if (S.wsHome && S.wsHome.onclose) { S.wsHome.readyState = 3; S.wsHome.onclose({}); }
    else { S.wsHome = null; app.openWsHome(); }
    await new Promise(r => setTimeout(r, 4500));
    out.A_count = window.__wsLog.filter(e => isHome(e) && e.t >= t0).length;
    out.A_hasBackoff = !!B;

    if (!B) return out;   // 修正前ビルドではここまで

    // --- B: 安定していた接続の切断は即時再接続 ---
    if (B.home.timer) { clearTimeout(B.home.timer); B.home.timer = null; }
    window.__wsMode = 'open';
    S.wsHome = null;
    app.openWsHome();
    await new Promise(r => setTimeout(r, 100));
    B.home.attempt = 6;                     // 長く失敗していた想定
    B.home.openedAt = Date.now() - 11000;   // ただし直近は 11 秒つながっていた
    const t1 = Date.now();
    S.wsHome.readyState = 3; S.wsHome.onclose({});
    await new Promise(r => setTimeout(r, 600));
    out.B_reconnected = window.__wsLog.filter(e => isHome(e) && e.t >= t1).length;

    // --- C: アプリ復帰でバックオフをリセット ---
    window.__wsMode = 'fail';
    if (B.home.timer) { clearTimeout(B.home.timer); B.home.timer = null; }
    B.home.attempt = 6;
    B.home.timer = setTimeout(() => {}, 60000);  // 長い待機中という状態を作る
    S.wsHome = null;
    window.__wsMode = 'open';
    const t2 = Date.now();
    window.kktjsForceReconnectAll();
    await new Promise(r => setTimeout(r, 300));
    out.C_attemptAfter = B.home.attempt;
    out.C_timerCleared = B.home.timer === null || B.home.timer === undefined;
    out.C_reconnected = window.__wsLog.filter(e => isHome(e) && e.t >= t2).length;
    return out;
  });

  console.log('=== stream reconnect backoff ===\n');
  console.log('A. 即失敗が続く状態で 4.5 秒間の Home 再接続回数:', result.A_count, '(修正前は 200ms 毎で 20 回前後 / 修正後は 4 回以下)');
  if (!result.A_hasBackoff) {
    console.log('   (バックオフ機構なし = 修正前ビルド)');
  } else {
    console.log('B. 10秒安定後の切断 → 再接続回数(600ms内):', result.B_reconnected, '(expect >= 1 = 即時)');
    console.log('C. 復帰時: attempt =', result.C_attemptAfter, '/ timer 解除 =', result.C_timerCleared, '/ 再接続 =', result.C_reconnected, '(expect 0 / true / >=1)');
  }

  if (!(result.A_count <= 4)) fail.push('A: reconnect loop not throttled (' + result.A_count + ' sockets in 4.5s)');
  if (result.A_hasBackoff) {
    if (!(result.B_reconnected >= 1)) fail.push('B: stable connection drop did not reconnect immediately');
    if (result.C_attemptAfter !== 0) fail.push('C: backoff attempt not reset on resume');
    if (!result.C_timerCleared) fail.push('C: pending backoff timer not cleared on resume');
    if (!(result.C_reconnected >= 1)) fail.push('C: resume did not reconnect immediately');
  } else {
    fail.push('backoff mechanism not present');
  }

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (instant-failure reconnects are backed off; resume and stable drops reconnect at once)'); }
