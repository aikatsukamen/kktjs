// rerender-perf-verify.mjs — タイムライン操作時の DOM 再描画コストを実測する。
// MutationObserver で「実際に書き換わった DOM ノード数」を数え、無駄な再描画を定量化する。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5210;
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
    const status = (id) => ({ id:String(id), uri:'u', url:'', created_at:'2024-01-01T00:00:00Z', content:'<p>post '+id+'</p>', spoiler_text:'', visibility:'public', sensitive:false, account: acct(1000+Number(id)), media_attachments:[], emojis:[], mentions:[], tags:[], reblogs_count:0, favourites_count:0, replies_count:0, favourited:false, reblogged:false, bookmarked:false, pinned:false, reblog:null, poll:null, card:null, application:{name:'kktjs'}, content_opened:true, media_opened:false, loading_avatar:false, loading_media:false, req_favourite:false, req_reblog:false, req_vote:false, caught_katsufilter:false });

    // 100件のタイムラインを用意
    const N = 100;
    const arr = [];
    for (let i=0;i<N;i++) arr.push(status('S'+i));
    app.homes = arr;
    app.$data.showHome = true; app.$data.home_unread = 0;
    app.$forceUpdate();
    await app.$nextTick(); await new Promise(r=>setTimeout(r,200));

    const homeEl = document.querySelector('#home');
    function measure(label, fn) {
      return new Promise(async (resolve) => {
        let mutations = 0, addedNodes = 0, removedNodes = 0, attrChanges = 0, charData = 0;
        const obs = new MutationObserver(muts => {
          for (const m of muts) {
            mutations++;
            addedNodes += m.addedNodes.length;
            removedNodes += m.removedNodes.length;
            if (m.type === 'attributes') attrChanges++;
            if (m.type === 'characterData') charData++;
          }
        });
        obs.observe(homeEl, { childList:true, subtree:true, attributes:true, characterData:true });
        const t0 = performance.now();
        await fn();
        await app.$nextTick();
        await new Promise(r=>setTimeout(r,120));
        const t1 = performance.now();
        obs.disconnect();
        resolve({ label, ms: +(t1-t0).toFixed(1), mutations, addedNodes, removedNodes, attrChanges, charData });
      });
    }

    const results = [];

    // (1) 新規1件 unshift（最も頻繁な操作）
    results.push(await measure('unshift 1 new post', async () => {
      app.homes.unshift(status('NEW1'));
      app.$forceUpdate();
    }));

    // (2) $forceUpdate のみ（データ変更なし） — 理想は DOM 変更ゼロ
    results.push(await measure('$forceUpdate only (no data change)', async () => {
      app.$forceUpdate();
    }));

    // (3) 1件のお気に入りトグル（1件だけ変わるべき）
    results.push(await measure('toggle favourite on 1 post', async () => {
      app.homes[5].favourited = !app.homes[5].favourited;
      app.homes[5].favourites_count++;
      app.$forceUpdate();
    }));

    // (4) home_unread の数値変更だけ（カウンタ表示のみ変わるべき）
    results.push(await measure('change home_unread counter', async () => {
      app.$data.home_unread = (app.$data.home_unread||0) + 1;
      app.$forceUpdate();
    }));

    return { N, totalAvatars: document.querySelectorAll('#home img.avatar').length, results };
  });

  console.log('=== Timeline re-render cost (', result.N, 'posts,', result.totalAvatars, 'avatars rendered) ===\n');
  for (const r of result.results) {
    console.log('  ' + r.label);
    console.log('    time: ' + r.ms + 'ms | mutations: ' + r.mutations + ' | +nodes: ' + r.addedNodes + ' | -nodes: ' + r.removedNodes + ' | attr: ' + r.attrChanges + ' | text: ' + r.charData);
  }

  // 分析
  console.log('\n=== Analysis ===');
  const forceOnly = result.results.find(r => /forceUpdate only/.test(r.label));
  const counter = result.results.find(r => /home_unread/.test(r.label));
  const fav = result.results.find(r => /favourite/.test(r.label));
  if (forceOnly) {
    if (forceOnly.addedNodes + forceOnly.removedNodes + forceOnly.attrChanges > 5) {
      console.log('  ⚠ $forceUpdate with NO data change still mutates DOM (' + (forceOnly.addedNodes+forceOnly.removedNodes+forceOnly.attrChanges) + ' changes) — wasteful re-render');
    } else {
      console.log('  ✓ $forceUpdate with no data change causes minimal DOM churn (Vue diff is effective)');
    }
  }
  if (counter && counter.addedNodes > 10) {
    console.log('  ⚠ changing just the unread counter re-added ' + counter.addedNodes + ' nodes — counter should not rebuild the list');
  }
  if (fav && fav.addedNodes > 20) {
    console.log('  ⚠ toggling 1 favourite re-added ' + fav.addedNodes + ' nodes — should only touch 1 post');
  }

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
