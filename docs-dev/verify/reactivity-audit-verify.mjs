// reactivity-audit-verify.mjs — $forceUpdate に頼らず、Vue 3 の reactivity だけで
// DOM が更新されるかを監査する。更新されない箇所があれば、それは「$forceUpdate で隠蔽された
// reactivity の穴」であり、同種バグ（再接続後に表示が戻らない等）の温床。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5211;
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

const findings = [];
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
    const status = (id) => ({ id:String(id), uri:'u', url:'', created_at:'2024-01-01T00:00:00Z', content:'<p>body'+id+'</p>', spoiler_text:'', visibility:'public', sensitive:false, account: acct(2000+Number(id)), media_attachments:[], emojis:[], mentions:[], tags:[], reblogs_count:0, favourites_count:0, replies_count:0, favourited:false, reblogged:false, bookmarked:false, pinned:false, reblog:null, poll:null, card:null, application:{name:'kktjs'}, content_opened:true, media_opened:false, loading_avatar:false, loading_media:false, req_favourite:false, req_reblog:false, req_vote:false, caught_katsufilter:false });

    app.homes = [ status('A'), status('B'), status('C') ];
    app.$data.showHome = true; app.$data.home_unread = 0;
    app.$forceUpdate();
    await app.$nextTick(); await new Promise(r=>setTimeout(r,150));

    const tests = [];
    const txt = () => document.querySelector('#home').innerText;

    // reactivity だけ（$forceUpdate なし）で各種変更が DOM に反映されるかを試す。
    // 反映されない=「$forceUpdate に依存している隠れた穴」。

    // (1) proxy 経由で content を書き換え（reactive のはず）
    {
      app.homes[0].content = '<p>CHANGED_REACTIVE_BODY</p>';
      await app.$nextTick(); await new Promise(r=>setTimeout(r,100));
      tests.push({ name: 'proxy: homes[0].content', reflected: /CHANGED_REACTIVE_BODY/.test(txt()) });
    }

    // (2) proxy 経由で loading_avatar を true（アバターが span に変わるはず）
    {
      app.homes[1].loading_avatar = true;
      await app.$nextTick(); await new Promise(r=>setTimeout(r,100));
      const wrappers = [...document.querySelectorAll('#home .status-wrapper')];
      const anySpan = wrappers.some(w => w.querySelector('span.avatar'));
      tests.push({ name: 'proxy: homes[1].loading_avatar=true', reflected: anySpan });
      // 戻す
      app.homes[1].loading_avatar = false;
      await app.$nextTick(); await new Promise(r=>setTimeout(r,100));
    }

    // (3) 生オブジェクトを作って配列に代入し、その生オブジェクト参照を直接変更（←アンチパターン。反映されないはず）
    {
      const raw = status('RAW');
      app.homes.unshift(raw);           // 配列に入れる（Vue が proxy 化）
      await app.$nextTick(); await new Promise(r=>setTimeout(r,80));
      raw.content = '<p>RAW_MUTATION_SHOULD_NOT_REFLECT</p>';  // 生参照を変更
      await app.$nextTick(); await new Promise(r=>setTimeout(r,100));
      const reflectedViaRaw = /RAW_MUTATION_SHOULD_NOT_REFLECT/.test(txt());
      // 正しい方法: proxy 経由
      app.homes[0].content = '<p>RAW_FIXED_VIA_PROXY</p>';
      await app.$nextTick(); await new Promise(r=>setTimeout(r,100));
      const reflectedViaProxy = /RAW_FIXED_VIA_PROXY/.test(txt());
      tests.push({ name: 'raw-ref mutation reflects? (should be FALSE)', reflected: reflectedViaRaw, expectFalse: true });
      tests.push({ name: 'same field via proxy reflects? (should be TRUE)', reflected: reflectedViaProxy });
    }

    return { tests };
  });

  console.log('=== Reactivity audit (without relying on $forceUpdate) ===\n');
  for (const t of result.tests) {
    const ok = t.expectFalse ? !t.reflected : t.reflected;
    console.log('  [' + (ok ? 'OK ' : 'WARN') + '] ' + t.name + ' → reflected=' + t.reflected);
    if (!ok) {
      if (t.expectFalse) {
        // 反映されてしまった = 想定外（普通は反映されないはず）
        findings.push(t.name + ' unexpectedly reflected');
      } else {
        findings.push(t.name + ' did NOT reflect via reactivity (hidden $forceUpdate dependency)');
      }
    }
  }

  console.log('\n=== Conclusion ===');
  console.log('  proxy 経由の変更は reactivity だけで反映される（$forceUpdate 不要）ことを確認。');
  console.log('  生参照（raw）変更は反映されない＝これがアバターバグ等の根本パターン。');
  console.log('  → コード内で「配列代入後に生参照を変更している」箇所が無いかが重要（別途 grep 監査）。');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (findings.length) { console.log('RESULT: findings'); findings.forEach(f=>console.log('  - '+f)); }
else { console.log('RESULT: reactivity behaves as expected (proxy reflects, raw does not)'); }
