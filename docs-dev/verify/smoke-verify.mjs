// smoke-verify.mjs — 軽量スモークテスト。
// HEIC 機能追加で checkActMedia の構造を変えたため、アプリ起動と主要メソッド呼び出しに
// 回帰がないかを確認する（既存テストをすべて作り直す代わりに最小限のチェック）。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5199;
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
  const msgs = [];
  page.on('pageerror', e => msgs.push('pageerror: ' + e.message));
  page.on('console', m => { const t = m.type(); if (t === 'error' || t === 'warning') msgs.push(t + ': ' + m.text()); });
  await page.addInitScript(() => {
    class FakeWS { constructor(){ this.readyState=0; setTimeout(()=>{this.readyState=1; this.onopen&&this.onopen({});},0);} send(){} close(){this.readyState=3;} addEventListener(){} removeEventListener(){} }
    FakeWS.CONNECTING=0; FakeWS.OPEN=1; FakeWS.CLOSING=2; FakeWS.CLOSED=3; window.WebSocket = FakeWS;
    window.fetch = () => Promise.resolve(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    localStorage.setItem('at', JSON.stringify({ access_token: 'T', token_type: 'Bearer' }));
    localStorage.setItem('work_user', JSON.stringify({ id:'1', username:'tester', acct:'tester', display_name:'Tester', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', created_at:'2020-01-01T00:00:00Z' }));
  });

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  const r = await page.evaluate(async () => {
    const app = window.app;
    return {
      hasApp: !!app,
      methodCount: window.__kktjsMethods ? Object.keys(window.__kktjsMethods).length : 0,
      vueVersion: (app && app.$ && app.$.appContext && app.$.appContext.app.version) || 'unknown',
      hasCheckActMedia: typeof app?.checkActMedia === 'function',
      hasActMedia: typeof app?.actMedia === 'function',
      hasOptMaxImageLen: typeof app?.$data?.optMaxImageLen,
      appHtmlLen: (document.getElementById('app') || {}).innerHTML?.length || 0,
    };
  });

  console.log('--- smoke test (HEIC integration regression check) ---');
  console.log('  Vue version          :', r.vueVersion);
  console.log('  window.app           :', r.hasApp);
  console.log('  __kktjsMethods count :', r.methodCount, '(expect 247)');
  console.log('  checkActMedia method :', r.hasCheckActMedia);
  console.log('  actMedia method      :', r.hasActMedia);
  console.log('  optMaxImageLen type  :', r.hasOptMaxImageLen, '(expect "number")');
  console.log('  #app innerHTML length:', r.appHtmlLen, '(expect > 1000 for auth screen)');

  if (!r.hasApp) fail.push('app not booted');
  if (r.methodCount !== 247) fail.push('method count ' + r.methodCount + ' (expect 247)');
  if (!r.hasCheckActMedia) fail.push('checkActMedia missing');
  if (!r.hasActMedia) fail.push('actMedia missing');
  if (r.hasOptMaxImageLen !== 'number') fail.push('optMaxImageLen not a number');
  if (r.appHtmlLen < 1000) fail.push('auth screen did not render');

  const re = msgs.filter(m => !/Failed to load resource|net::ERR|401|404/.test(m));
  if (re.length) {
    console.log('  console (non-resource):');
    re.slice(0, 5).forEach(m => console.log('    ' + m.slice(0, 160)));
    fail.push(re.length + ' console message(s) on boot');
  }

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}

console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f => console.log('  - ' + f)); process.exit(1); }
else { console.log('RESULT: PASS'); }
