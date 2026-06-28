// group-a-spinner-verify.mjs — 群A代表: req_favourite/req_reblog/req_vote 等のフラグを
// proxy 経由で変更したとき、forceUpdate なしでスピナー表示が出現/消失するかを検証。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5217;
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

  const result = await page.evaluate(async () => {
    const app = window.app;
    const PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=';
    const acct = (id) => ({ id:String(id), username:'u'+id, acct:'u'+id, display_name:'name'+id, avatar:PX, avatar_static:PX, header:'', header_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', url:'', created_at:'2020-01-01T00:00:00Z' });
    const status = (id) => ({ id:String(id), uri:'u', url:'', created_at:'2024-01-01T00:00:00Z', content:'<p>body'+id+'</p>', spoiler_text:'', visibility:'public', sensitive:false, account: acct(8000+Number(id)), media_attachments:[], emojis:[], mentions:[], tags:[], reblogs_count:0, favourites_count:0, replies_count:0, favourited:false, reblogged:false, bookmarked:false, pinned:false, reblog:null, poll:null, card:null, application:{name:'kktjs'}, content_opened:true, media_opened:false, loading_avatar:false, loading_media:false, req_favourite:false, req_reblog:false, req_vote:false, req_katsu:false, caught_katsufilter:false });

    const realForce = app.$forceUpdate.bind(app);
    app.$forceUpdate = function () { /* no-op */ };

    app.homes = [ status('A') ];
    app.$data.showHome = true; app.$data.home_unread = 0;
    realForce(); await app.$nextTick(); await new Promise(r=>setTimeout(r,150));

    const nextRepaint = async () => { await app.$nextTick(); await new Promise(r=>setTimeout(r,100)); };
    const spinners = () => document.querySelectorAll('#home .fa-spinner').length;

    const out = {};
    out.before = spinners();

    // req_favourite を proxy 経由で true（スピナー出現するはず）
    app.homes[0].req_favourite = true;
    await nextRepaint();
    out.afterFavTrue = spinners();

    // false に戻す（スピナー消えるはず）
    app.homes[0].req_favourite = false;
    await nextRepaint();
    out.afterFavFalse = spinners();

    // req_reblog でも確認
    app.homes[0].req_reblog = true;
    await nextRepaint();
    out.afterReblogTrue = spinners();
    app.homes[0].req_reblog = false;
    await nextRepaint();

    app.$forceUpdate = realForce;
    return out;
  });

  console.log('=== Group A: req-flag spinner reactivity (no forceUpdate) ===\n');
  console.log('  spinners before        :', result.before, '(expect 0)');
  console.log('  after req_favourite=true:', result.afterFavTrue, '(expect >= 1)');
  console.log('  after req_favourite=false:', result.afterFavFalse, '(expect 0)');
  console.log('  after req_reblog=true   :', result.afterReblogTrue, '(expect >= 1)');

  if (result.afterFavTrue < 1) fail.push('req_favourite=true did not show spinner (reactivity failed without forceUpdate)');
  if (result.afterFavFalse !== 0) fail.push('req_favourite=false did not hide spinner');
  if (result.afterReblogTrue < 1) fail.push('req_reblog=true did not show spinner');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (req-flag spinners react without forceUpdate → group A removable)'); }
