// burst-perf-verify.mjs — ストリーミングで投稿が連続到着するシナリオの CPU コストを実測。
// 大量タイムライン + 連続 unshift + forceUpdate のスループットを測り、ボトルネックを定量化。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5212;
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
    const acct = (id) => ({ id:String(id), username:'u'+id, acct:'u'+id, display_name:'u'+id, avatar:PX, avatar_static:PX, header:'', header_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', url:'', created_at:'2020-01-01T00:00:00Z' });
    const status = (id) => ({ id:String(id), uri:'u', url:'', created_at:'2024-01-01T00:00:00Z', content:'<p>post '+id+'</p>', spoiler_text:'', visibility:'public', sensitive:false, account: acct(3000+Number(id)), media_attachments:[], emojis:[], mentions:[], tags:[], reblogs_count:0, favourites_count:0, replies_count:0, favourited:false, reblogged:false, bookmarked:false, pinned:false, reblog:null, poll:null, card:null, application:{name:'kktjs'}, content_opened:true, media_opened:false, loading_avatar:false, loading_media:false, req_favourite:false, req_reblog:false, req_vote:false, caught_katsufilter:false });

    const out = {};

    // ベースライン: 様々なタイムライン長で「1件 unshift + forceUpdate」の所要時間
    for (const N of [50, 200, 500]) {
      const arr = []; for (let i=0;i<N;i++) arr.push(status('B'+i));
      app.homes = arr; app.$data.showHome = true; app.$data.home_unread = 0;
      app.$forceUpdate(); await app.$nextTick(); await new Promise(r=>setTimeout(r,150));

      // 連続 20 件 unshift を計測（バースト）
      const t0 = performance.now();
      for (let k=0;k<20;k++){
        app.homes.unshift(status('BURST'+N+'_'+k));
        app.$forceUpdate();
        await app.$nextTick();
      }
      const t1 = performance.now();
      out['burst_'+N] = { listLen: N, totalMs: +(t1-t0).toFixed(1), perUpdateMs: +((t1-t0)/20).toFixed(2), domAvatars: document.querySelectorAll('#home img.avatar').length };
    }

    // 比較: forceUpdate を「呼ばない」場合（reactivity 任せ）の同じ20連続 unshift
    {
      const N = 200;
      const arr = []; for (let i=0;i<N;i++) arr.push(status('C'+i));
      app.homes = arr; app.$forceUpdate(); await app.$nextTick(); await new Promise(r=>setTimeout(r,150));
      const t0 = performance.now();
      for (let k=0;k<20;k++){
        app.homes.unshift(status('NOFORCE'+k));   // forceUpdate を呼ばない
        await app.$nextTick();
      }
      const t1 = performance.now();
      out['noforce_200'] = { listLen: N, totalMs: +(t1-t0).toFixed(1), perUpdateMs: +((t1-t0)/20).toFixed(2) };
    }

    return out;
  });

  console.log('=== Burst performance (20 consecutive unshifts) ===\n');
  console.log('  With $forceUpdate (current code):');
  for (const N of [50,200,500]) {
    const r = result['burst_'+N];
    console.log('    list=' + String(r.listLen).padStart(3) + ': ' + r.perUpdateMs + 'ms/update (total ' + r.totalMs + 'ms)');
  }
  console.log('\n  Without $forceUpdate (reactivity only):');
  const nf = result['noforce_200'];
  console.log('    list=200: ' + nf.perUpdateMs + 'ms/update (total ' + nf.totalMs + 'ms)');

  console.log('\n=== Analysis ===');
  const w200 = result['burst_200'].perUpdateMs;
  const nf200 = nf.perUpdateMs;
  console.log('  list=200: with forceUpdate=' + w200 + 'ms vs without=' + nf200 + 'ms per update');
  const ratio = (w200 / Math.max(nf200, 0.01)).toFixed(1);
  console.log('  → $forceUpdate is ~' + ratio + 'x the cost of reactivity-only for this op');
  const w500 = result['burst_500'].perUpdateMs;
  if (w500 > 16) {
    console.log('  ⚠ at list=500, ' + w500 + 'ms/update exceeds one 60fps frame (16ms) — bursts could drop frames on large timelines');
  } else {
    console.log('  ✓ even at list=500, ' + w500 + 'ms/update stays within ~1 frame budget');
  }

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
