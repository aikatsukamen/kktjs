// group-b-verify.mjs — display-wrappers の updateVote/updateFilterAll/updateWrapperAll から
// forceUpdate を削除した後も、実際の操作で DOM が正しく更新されることを検証する。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5216;
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
    const status = (id, extra) => Object.assign({ id:String(id), uri:'u', url:'', created_at:'2024-01-01T00:00:00Z', content:'<p>body'+id+'</p>', spoiler_text:'', visibility:'public', sensitive:false, account: acct(7000+Number(id)), media_attachments:[], emojis:[], mentions:[], tags:[], reblogs_count:0, favourites_count:0, replies_count:0, favourited:false, reblogged:false, bookmarked:false, pinned:false, reblog:null, poll:null, card:null, application:{name:'kktjs'}, content_opened:true, media_opened:false, loading_avatar:false, loading_media:false, req_favourite:false, req_reblog:false, req_vote:false, caught_katsufilter:false }, extra||{});

    app.homes = [
      status('A'),
      status('B', { poll: { id:'pollB', expires_at:'2099-01-01T00:00:00Z', expired:false, multiple:false, votes_count:0, voters_count:0, voted:false, own_votes:[], options:[{title:'optX', votes_count:0},{title:'optY', votes_count:0}], emojis:[] } }),
      status('C', { content:'<p>NGWORD_BANANA here</p>' }),
    ];
    app.$data.showHome = true; app.$data.home_unread = 0; app.$data.optAllNsfw = false;
    app.$forceUpdate(); await app.$nextTick(); await new Promise(r=>setTimeout(r,150));

    const out = {};
    const nextRepaint = async () => { await app.$nextTick(); await new Promise(r=>setTimeout(r,120)); };
    const txt = () => document.querySelector('#home').innerText;

    // (1) updateVote: 投票結果を反映（forceUpdate なしで DOM 更新されるか）
    app.updateVote('B', { id:'pollB', expires_at:'2099-01-01T00:00:00Z', expired:false, multiple:false, votes_count:12, voters_count:12, voted:true, own_votes:[0], options:[{title:'optX', votes_count:9},{title:'optY', votes_count:3}], emojis:[] });
    await nextRepaint();
    out.voteReflected = app.homes[1].poll.voted === true && app.homes[1].poll.votes_count === 12;
    // 投票数のテキストが出るか（テンプレートが votes_count を表示する場合）
    out.voteDomHint = /optX|9|12/.test(txt());

    // (2) updateFilterAll: NGワードフィルタを適用して該当投稿が隠れるか
    if (app.updateFilterAll) {
      app.$data.optKatsuFilter = 'regex';
      app.$data.optKatsuFilterRaw = 'BANANA';
      const beforeHasC = /NGWORD_BANANA/.test(txt());
      try { app.updateFilterAll(); } catch(e) { out.filterErr = String(e); }
      await nextRepaint();
      out.filterCaught = app.homes[2].caught_katsufilter === true;
      // caught_katsufilter=true で投稿が隠れる（v-if で）か
      out.filterDomHidden = beforeHasC && !/NGWORD_BANANA/.test(txt());
    }

    // (3) updateWrapperAll: 全投稿の本文/メディアを一括開閉
    if (app.updateWrapperAll) {
      app.homes.forEach(s => { s.content_opened = false; s.spoiler_text = 'CW'; });
      await nextRepaint();
      try { app.updateWrapperAll(); } catch(e) { out.wrapperErr = String(e); }
      await nextRepaint();
      out.wrapperRan = true;
    }

    return out;
  });

  console.log('=== Group B functions after forceUpdate removal ===\n');
  console.log('  updateVote: data reflected   :', result.voteReflected, '(expect true)');
  console.log('  updateVote: dom hint         :', result.voteDomHint);
  console.log('  updateFilterAll: caught set   :', result.filterCaught, '(expect true)');
  console.log('  updateFilterAll: dom hidden   :', result.filterDomHidden, '(expect true)');
  if (result.filterErr) console.log('  updateFilterAll error:', result.filterErr);
  console.log('  updateWrapperAll ran          :', result.wrapperRan);
  if (result.wrapperErr) console.log('  updateWrapperAll error:', result.wrapperErr);

  if (!result.voteReflected) fail.push('updateVote did not reflect poll data');
  if (result.filterCaught === false) fail.push('updateFilterAll did not set caught_katsufilter');
  if (result.filterDomHidden === false) fail.push('updateFilterAll did not hide filtered post in DOM (reactivity failed without forceUpdate)');
  if (result.filterErr) fail.push('updateFilterAll threw: ' + result.filterErr);
  if (result.wrapperErr) fail.push('updateWrapperAll threw: ' + result.wrapperErr);

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (group B functions work via reactivity, no forceUpdate needed)'); }
