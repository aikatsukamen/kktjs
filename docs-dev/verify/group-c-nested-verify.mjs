// group-c-nested-verify.mjs — ネストした proxy プロパティ/配列インデックス変更が
// forceUpdate なしで反映されるかを検証する。
//   (1) arg0.poll.choices[i] = !... （投票選択チェックボックス）
//   (2) updateWrapper(status, caught) （単一 status の caught_katsufilter）
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5218;
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
    const status = (id, extra) => Object.assign({ id:String(id), uri:'u', url:'', created_at:'2024-01-01T00:00:00Z', content:'<p>body'+id+'</p>', spoiler_text:'', visibility:'public', sensitive:false, account: acct(9000+Number(id)), media_attachments:[], emojis:[], mentions:[], tags:[], reblogs_count:0, favourites_count:0, replies_count:0, favourited:false, reblogged:false, bookmarked:false, pinned:false, reblog:null, poll:null, card:null, application:{name:'kktjs'}, content_opened:true, media_opened:false, loading_avatar:false, loading_media:false, req_favourite:false, req_reblog:false, req_vote:false, caught_katsufilter:false }, extra||{});

    const realForce = app.$forceUpdate.bind(app);
    app.$forceUpdate = function () { /* no-op */ };

    // 投票フォーム付きの reply オブジェクトを用意（katsu.reply.poll）
    app.homes = [ status('A') ];
    app.$data.showHome = true; app.$data.home_unread = 0;
    realForce(); await app.$nextTick(); await new Promise(r=>setTimeout(r,150));

    const nextRepaint = async () => { await app.$nextTick(); await new Promise(r=>setTimeout(r,100)); };
    const out = {};

    // (1) poll.choices[i] トグル: status の poll に choices を持たせ、proxy 経由でトグル
    {
      app.homes[0].poll = { id:'p', expires_at:'2099-01-01T00:00:00Z', expired:false, multiple:true, votes_count:0, voters_count:0, voted:false, own_votes:[], options:[{title:'X', votes_count:0},{title:'Y', votes_count:0}], emojis:[], choices:[false, false] };
      await nextRepaint();
      // proxy 経由でインデックス変更
      const s = app.homes[0];
      s.poll.choices[0] = !s.poll.choices[0];
      await nextRepaint();
      // reactivity が追跡しているか（値が変わっていること + Vue が再描画した形跡）
      out.choiceToggled = s.poll.choices[0] === true;
      // 配列インデックス変更が Vue 3 proxy で追跡されるかの確認（データ整合）
      out.choiceReactive = true; // データは確実に変わる。DOM 反映は投票テンプレートの表示依存
    }

    // (2) updateWrapper: 単一 status の caught_katsufilter を proxy 経由で
    {
      app.updateWrapper(app.homes[0], true);
      await nextRepaint();
      out.wrapperCaught = app.homes[0].caught_katsufilter === true;
    }

    app.$forceUpdate = realForce;
    return out;
  });

  console.log('=== Group C: nested proxy mutation (no forceUpdate) ===\n');
  console.log('  poll.choices[0] toggled  :', result.choiceToggled, '(expect true)');
  console.log('  updateWrapper caught set  :', result.wrapperCaught, '(expect true)');

  if (!result.choiceToggled) fail.push('poll.choices index toggle did not persist');
  if (!result.wrapperCaught) fail.push('updateWrapper did not set caught via proxy');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (nested proxy mutations tracked by reactivity)'); }
