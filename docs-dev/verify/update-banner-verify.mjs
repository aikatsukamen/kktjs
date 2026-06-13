// update-banner-verify.mjs — 更新通知バナーのボタン（v-on:click="location.reload()"）が
// Vue 3 のテンプレートスコープで機能するかを検証する。
//
// 仮説: Vue 3 はテンプレート式を _ctx (コンポーネント) スコープで解決するため、
// bare な `location` は _ctx.location = undefined になり、location.reload() が
// TypeError になる → クリックしても何も起きない（前回の toggleSideLink と同種の移行バグ）。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5204;
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
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|401|404|net::ERR/.test(m.text())) errors.push('console.error: ' + m.text()); });

  // location.reload を乗っ取って「呼ばれたか」を記録（実リロードは抑止）
  await page.addInitScript(() => {
    class FakeWS { constructor(){ this.readyState=0; setTimeout(()=>{this.readyState=1; this.onopen&&this.onopen({});},0);} send(){} close(){this.readyState=3;} addEventListener(){} removeEventListener(){} }
    FakeWS.OPEN=1; window.WebSocket = FakeWS;
    window.fetch = () => Promise.resolve(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    localStorage.setItem('at', JSON.stringify({ access_token: 'T', token_type: 'Bearer' }));
    localStorage.setItem('work_user', JSON.stringify({ id:'1', username:'t', acct:'t', display_name:'T', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', created_at:'2020-01-01T00:00:00Z' }));
    localStorage.setItem('conf_std', JSON.stringify({ ver: 999 }));
  });

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  // バナーを表示状態にする
  await page.evaluate(() => {
    const app = window.app;
    app.$data.result_text = 'kktjs new version released.';
    app.$data.app_wait_update = true;
    app.$forceUpdate();
  });
  await page.waitForTimeout(300);

  errors.length = 0;
  // バナーの本体（reloadForce を呼ぶ div）を実際にクリックし、ナビゲーション(リロード)が起きるか監視。
  let navigated = false;
  page.on('framenavigated', f => { if (f === page.mainFrame()) navigated = true; });

  let clickFound = false;
  try {
    clickFound = await page.evaluate(() => {
      const candidates = [...document.querySelectorAll('.info-wrapper .flex.full')];
      let target = null;
      for (const el of candidates) {
        if (/new version released|refresh/.test(el.innerText) || el.querySelector('.fa-refresh')) { target = el; break; }
      }
      if (!target) return false;
      target.click();
      return true;
    });
  } catch (e) {
    // クリックでナビゲーションが起きると evaluate が中断されることがある = リロード成功の証
    navigated = true;
    clickFound = true;
  }
  // ナビゲーション完了を少し待つ
  await page.waitForTimeout(800).catch(() => {});

  console.log('--- update banner click (reloadForce / location.reload) ---');
  console.log('  banner element found :', clickFound);
  console.log('  page navigated(reload):', navigated, '(expect true)');
  console.log('  JS errors on click   :', errors.length ? errors.slice(0,3).join(' | ') : '(none)');

  if (!clickFound) fail.push('banner reload element not found');
  if (errors.some(e => /location|reload|undefined|not a function/i.test(e))) {
    fail.push('JS error referencing location/reload: ' + errors.find(e => /location|reload|undefined/i.test(e)));
  }
  if (!navigated) {
    fail.push('reload did NOT happen on banner click (the reported bug)');
  }

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f => console.log('  - ' + f)); process.exit(1); }
else { console.log('RESULT: PASS (banner triggers reload)'); }
