// detail-wrapperbm-fix-verify.mjs — updateWrapperBM(status, 'detail') が
// 直接渡し（配列で囲まない）で正しく動作することを検証。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5222;
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
    app.$data.optAllOpen = 'both';
    
    const status = {
      id: 'D1', uri:'u', url:'', created_at:'2024-01-01T00:00:00Z',
      content:'<p>detail body</p>', spoiler_text:'CW', visibility:'public', sensitive:true,
      content_opened: false, media_opened: false,
      account: { id:'a1', username:'u', acct:'u', display_name:'u', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', url:'', created_at:'2020-01-01T00:00:00Z' },
      media_attachments: [], emojis:[], mentions:[], tags:[],
      reblogs_count:0, favourites_count:0, replies_count:0,
      favourited:false, reblogged:false, bookmarked:false, pinned:false,
      reblog:null, poll:null, card:null, application:{name:'kktjs'},
      loading_avatar:false, loading_media:false,
      req_favourite:false, req_reblog:false, req_vote:false, caught_katsufilter:false
    };

    // 修正後の呼び出し方: 直接 status を渡す（配列で囲まない）
    if (app.updateWrapperBM) app.updateWrapperBM(status, 'detail');
    
    return {
      statusMediaOpened: status.media_opened,
      statusContentOpened: status.content_opened,
    };
  });

  console.log('=== updateWrapperBM(status, "detail") fix verification ===\n');
  console.log('  status.media_opened   (expect true):', result.statusMediaOpened);
  console.log('  status.content_opened (expect true):', result.statusContentOpened);

  if (result.statusMediaOpened !== true) fail.push('media_opened not set on status');
  if (result.statusContentOpened !== true) fail.push('content_opened not set on status');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (detail mode now correctly sets flags on status itself)'); }
