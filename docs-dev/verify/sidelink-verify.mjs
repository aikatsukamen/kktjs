// sidelink-verify.mjs — PC モード(ua=='pc')でロゴ/三本線からサイドメニューが開き、
// そこから設定画面に到達できることを検証。あわせて iPhone 経路(toggleLink)の回帰も確認。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5202;
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
    FakeWS.CONNECTING=0; FakeWS.OPEN=1; FakeWS.CLOSING=2; FakeWS.CLOSED=3; window.WebSocket = FakeWS;
    window.fetch = () => Promise.resolve(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    localStorage.setItem('at', JSON.stringify({ access_token: 'T', token_type: 'Bearer' }));
    localStorage.setItem('work_user', JSON.stringify({ id:'1', username:'tester', acct:'tester', display_name:'Tester', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', created_at:'2020-01-01T00:00:00Z' }));
    localStorage.setItem('conf_std', JSON.stringify({ ver: 999 }));
    localStorage.removeItem('columns');
  });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  // ===== PC モード(ua='pc')のシミュレーション =====
  const pc = await page.evaluate(async () => {
    const app = window.app;
    app.$data.ua = 'pc';
    await app.$nextTick();
    const out = {};
    out.uaApplied = app.$data.ua;
    out.sideLinkBefore = app.$data.showSideLink;

    // ロゴ/三本線が呼ぶ toggleSideLink を実行
    app.toggleSideLink();
    await app.$nextTick(); await new Promise(r => setTimeout(r, 80));
    out.sideLinkAfterOpen = app.$data.showSideLink;
    // サイドメニュー DOM が描画され、その中に Setting ボタンがあるか
    out.sidePanelRendered = !!document.querySelector('.column.mini');
    out.settingBtnText = /Setting/.test(document.body.innerText);

    // もう一度押すと閉じる（トグル）
    app.toggleSideLink();
    await app.$nextTick(); await new Promise(r => setTimeout(r, 80));
    out.sideLinkAfterClose = app.$data.showSideLink;

    // 開いた状態にして、その中の設定ボタン(toggleSetting)から設定画面に到達できるか
    app.toggleSideLink();      // open side menu
    await app.$nextTick();
    app.toggleSetting();       // click "Setting"
    await app.$nextTick(); await new Promise(r => setTimeout(r, 80));
    out.showSettingAfter = app.$data.showSetting;
    out.settingPanelText = /Confirm:|添付画像の縮小|書きかけカツ/.test(document.body.innerText);
    return out;
  });

  console.log('--- PC mode (ua="pc") side link ---');
  console.log('  ua applied            :', pc.uaApplied);
  console.log('  showSideLink before   :', pc.sideLinkBefore, '(expect false)');
  console.log('  showSideLink after open:', pc.sideLinkAfterOpen, '(expect true) ← THE FIX');
  console.log('  side panel rendered   :', pc.sidePanelRendered);
  console.log('  "Setting" btn visible :', pc.settingBtnText);
  console.log('  showSideLink after 2nd click:', pc.sideLinkAfterClose, '(expect false = toggles closed)');
  console.log('  reach Setting -> showSetting:', pc.showSettingAfter, '(expect true)');
  console.log('  settings panel content:', pc.settingPanelText);

  if (pc.sideLinkAfterOpen !== true) fail.push('PC: toggleSideLink did not open the side menu (the reported bug)');
  if (!pc.sidePanelRendered) fail.push('PC: side panel DOM not rendered');
  if (!pc.settingBtnText) fail.push('PC: Setting button not visible in side menu');
  if (pc.sideLinkAfterClose !== false) fail.push('PC: second click did not toggle closed');
  if (pc.showSettingAfter !== true) fail.push('PC: could not reach settings from side menu');
  if (!pc.settingPanelText) fail.push('PC: settings panel content not rendered');

  // ===== iPhone 経路(toggleLink)の回帰確認 =====
  const ios = await page.evaluate(async () => {
    const app = window.app;
    app.$data.ua = 'ios';
    app.$data.showLink = false; app.$data.showSideLink = false; app.$data.showSetting = false;
    await app.$nextTick();
    const before = app.$data.showLink;
    app.toggleLink();   // iPhone のロゴが呼ぶ
    await app.$nextTick(); await new Promise(r => setTimeout(r, 60));
    return { before, after: app.$data.showLink };
  });
  console.log('\n--- iPhone path (toggleLink) regression ---');
  console.log('  showLink before:', ios.before, ' after:', ios.after, '(expect true)');
  if (ios.after !== true) fail.push('iOS: toggleLink regressed');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f => console.log('  - ' + f)); process.exit(1); }
else { console.log('RESULT: PASS (PC side menu opens & reaches settings; iPhone path intact)'); }
