// updatewrapperbm-redundancy-verify.mjs — updateWrapperBM の forceUpdate が
// streaming コンテキストで冗長か（呼ばなくても動作するか）を実証する。
//
// streaming の流れ:
//   1. updateWrapperBM(_0x1c8865, "socket") → 生オブジェクトに media_opened/content_opened セット
//      + 中で $forceUpdate (これが冗長疑惑)
//   2. updateFilterBM(_0x1c8865, "socket") → 同様
//   3. homes.unshift(_0x1c8865) → ここで reactivity 発火（v1.11.0 で確認済み）
//   4. openImage(proxy)
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5220;
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
    const status = (id) => ({ id:String(id), uri:'u', url:'', created_at:'2024-01-01T00:00:00Z', content:'<p>WBMBODY'+id+'</p>', spoiler_text:'', visibility:'public', sensitive:false, account: acct(12000+Number(id)), media_attachments:[], emojis:[], mentions:[], tags:[], reblogs_count:0, favourites_count:0, replies_count:0, favourited:false, reblogged:false, bookmarked:false, pinned:false, reblog:null, poll:null, card:null, application:{name:'kktjs'}, content_opened:true, media_opened:false, loading_avatar:false, loading_media:false, req_favourite:false, req_reblog:false, req_vote:false, caught_katsufilter:false });

    const realForce = app.$forceUpdate.bind(app);
    let forceCount = 0;
    app.$forceUpdate = function () { forceCount++; /* no-op */ };

    app.homes = [ status('OLD1') ];
    app.$data.showHome = true; app.$data.home_unread = 0;
    app.$data.optAllOpen = 'both';  // updateWrapperBM が動く設定にする
    realForce(); await app.$nextTick(); await new Promise(r=>setTimeout(r,150));

    forceCount = 0;
    let wrapperBMCalled = 0;
    if (app.updateWrapperBM) {
      const orig = app.updateWrapperBM.bind(app);
      app.updateWrapperBM = function (data, mode) { wrapperBMCalled++; return orig(data, mode); };
    }
    // streaming 受信を完全シミュレート（forceUpdate なし）
    const fresh = status('NEW');
    fresh.loading_avatar = true;
    // 実コードのフロー：
    if (app.updateWrapperBM) app.updateWrapperBM(fresh, 'socket');  // 内部 forceUpdate (no-op)
    if (app.updateFilterBM) app.updateFilterBM(fresh, 'socket');    // 内部 forceUpdate (no-op)
    app.homes.unshift(fresh);                                       // ← ここが reactivity 発火点
    // 注: streaming.ts では既に forceUpdate を削除済み（v1.11.0）
    await app.$nextTick();
    const r = app.homes[0];
    if (r) app.openImage(r);
    await new Promise(r=>setTimeout(r,150));

    const wrappers = document.querySelectorAll('#home .status-wrapper').length;
    const newBodyShown = /WBMBODYNEW/.test(document.querySelector('#home').innerText);
    // fresh の media_opened/content_opened がセットされたか確認
    const freshOnList = app.homes[0];
    const dataApplied = freshOnList && freshOnList.id === fresh.id;

    app.$forceUpdate = realForce;
    return {
      forceCallsAttempted: forceCount,
      wrapperBMCalled,
      wrappers,
      newBodyShown,
      dataApplied,
      mediaOpened: freshOnList ? freshOnList.media_opened : null,
      contentOpened: freshOnList ? freshOnList.content_opened : null,
    };
  });

  console.log('=== updateWrapperBM forceUpdate redundancy in streaming ===\n');
  console.log('  forceUpdate calls attempted (should be 2: updateWrapperBM + updateFilterBM):', result.forceCallsAttempted);
  console.log('  status-wrappers in DOM:', result.wrappers, '(expect 2)');
  console.log('  new body shown:', result.newBodyShown, '(expect true)');
  console.log('  new status reached list:', result.dataApplied);
  console.log('  media_opened on new status:', result.mediaOpened);
  console.log('  content_opened on new status:', result.contentOpened);

  if (result.wrappers !== 2) fail.push('streaming new post did not render');
  if (!result.newBodyShown) fail.push('streaming new body not shown');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (updateWrapperBM forceUpdate is redundant in streaming - safe to remove)'); }
