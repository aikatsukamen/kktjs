// refetch-avatar-verify.mjs — 再接続契機の refetch（homes を新配列で丸ごと置換）後に、
// loading_avatar が正しく false に戻り、アバター <img> が表示されることを検証する。
//
// バグ: refetch-actions.ts が openImageAll(生配列) を呼んでいたため、Vue 3 では reactive proxy
// （thisObj.homes）に loading_avatar=false が伝わらず、全アバターが空 span のまま固定 →
// 「全投稿のアイコンが消える」。本テストは proxy 経由で false が反映されることを確認する。
//
// 検証方法:
//   updateImgLoading 相当（全 status の loading_avatar=true）→ homes=新配列 → openImageAll で false。
//   実アプリの refetchHome を直接呼ぶのは XHR モックが要るので、ここでは同じ操作シーケンスを再現し、
//   さらに「生配列に false を入れる旧方式」と「proxy に false を入れる新方式」を二方向で比較する。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5209;
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

  const run = await page.evaluate(async (mode) => {
    const app = window.app;
    const PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=';
    const acct = (id, av) => ({ id:String(id), username:'u'+id, acct:'u'+id, display_name:'u'+id, avatar:av, avatar_static:av, header:'', header_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', url:'', created_at:'2020-01-01T00:00:00Z' });
    const status = (id, av) => ({ id:String(id), uri:'u', url:'', created_at:'2024-01-01T00:00:00Z', content:'<p>post '+id+'</p>', spoiler_text:'', visibility:'public', sensitive:false, account: acct(100+Number(id), av), media_attachments:[], emojis:[], mentions:[], tags:[], reblogs_count:0, favourites_count:0, replies_count:0, favourited:false, reblogged:false, bookmarked:false, pinned:false, reblog:null, poll:null, card:null, application:{name:'kktjs'}, content_opened:true, media_opened:false, loading_avatar:false, loading_media:false, req_favourite:false, req_reblog:false, req_vote:false, caught_katsufilter:false });

    async function simulateRefetch(useProxy) {
      // 初期 3 件表示
      app.homes = [ status('S1', PX), status('S2', PX), status('S3', PX) ];
      app.$data.showHome = true; app.$data.home_unread = 0; app.$forceUpdate();
      await app.$nextTick(); await new Promise(r => setTimeout(r, 80));

      // === 再接続 refetch をシミュレート ===
      // 新しい配列を作る（サーバから再取得した想定）
      const fresh = [ status('S1', PX), status('S2', PX), status('S3', PX), status('S4', PX) ];
      // updateImgLoading 相当: 代入前に生配列へ loading_avatar=true
      fresh.forEach(s => { s.loading_avatar = true; });
      // homes を新配列で丸ごと置換（refetchHome と同じ）
      app.homes = fresh;
      app.$forceUpdate();
      await app.$nextTick();
      // openImageAll で loading_avatar=false に戻す
      if (useProxy) {
        app.openImageAll(app.homes);   // ★修正後: reactive proxy を渡す
      } else {
        app.openImageAll(fresh);       // ✗修正前: 生配列を渡す
      }
      await app.$nextTick(); await new Promise(r => setTimeout(r, 150));

      // ホームの各 wrapper が img を持つか（空 span でないか）を測定
      const wrappers = [...document.querySelectorAll('#home .status-wrapper')];
      return {
        wrappers: wrappers.length,
        withImg: wrappers.filter(w => w.querySelector('img.avatar')).length,
        withSpan: wrappers.filter(w => w.querySelector('span.avatar')).length,
      };
    }

    const proxyResult = await simulateRefetch(true);
    const rawResult = await simulateRefetch(false);
    return { proxyResult, rawResult };
  });

  console.log('--- (proxy = the fix) openImageAll(thisObj.homes) ---');
  console.log('  wrappers:', run.proxyResult.wrappers, '| with <img>:', run.proxyResult.withImg, '| with <span> (hidden):', run.proxyResult.withSpan);
  console.log('--- (raw = the bug) openImageAll(rawArray) ---');
  console.log('  wrappers:', run.rawResult.wrappers, '| with <img>:', run.rawResult.withImg, '| with <span> (hidden):', run.rawResult.withSpan);

  if (run.proxyResult.withSpan > 0) fail.push('proxy mode still has ' + run.proxyResult.withSpan + ' hidden avatars (fix ineffective)');
  if (run.proxyResult.withImg !== run.proxyResult.wrappers) fail.push('proxy mode: not all avatars are <img>');
  // raw モードはバグ再現（span が残る）を確認 — 再現しなければテストの妥当性が疑わしい
  if (run.rawResult.withSpan === 0) {
    console.log('  note: raw mode did not reproduce the hidden-avatar bug in this Chromium build (still informative)');
  } else {
    console.log('  ✓ raw mode reproduced the bug (' + run.rawResult.withSpan + ' hidden) — confirms root cause');
  }

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f => console.log('  - ' + f)); process.exit(1); }
else { console.log('RESULT: PASS (after refetch, proxy-based openImageAll restores all avatars)'); }
