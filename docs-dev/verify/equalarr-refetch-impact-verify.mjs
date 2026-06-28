// equalarr-refetch-impact-verify.mjs — equalArr 修正案を実 refetch フローに当てて、
// 配列置き換えが起きるかどうかと、DOM への影響を確認する。
//
// 検証ポイント:
//   1. 現状: 長い配列 → 短い配列の refetch で、画面に古いアイテムが残る
//   2. 修正案: 同じケースで、削除されたアイテムが画面から消える
//   3. 通常ケース（件数同じ、内容同じ）: 修正案でも配列置き換えが起きない（性能影響なし）
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5231;
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
    class FakeWS { constructor(){ this.readyState=0; setTimeout(()=>{this.readyState=1;},0);} send(){} close(){} addEventListener(){} removeEventListener(){} }
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
    const status = (id) => ({ id:String(id), uri:'u', url:'', created_at:'2024-01-01T00:00:00Z', content:'<p>POST'+id+'</p>', spoiler_text:'', visibility:'public', sensitive:false, account: acct(20000+Number(id)), media_attachments:[], emojis:[], mentions:[], tags:[], reblogs_count:0, favourites_count:0, replies_count:0, favourited:false, reblogged:false, bookmarked:false, pinned:false, reblog:null, poll:null, card:null, application:{name:'kktjs'}, content_opened:true, media_opened:false, loading_avatar:false, loading_media:false, req_favourite:false, req_reblog:false, req_vote:false, caught_katsufilter:false });

    // 現状の equalArr 実装を取得（app に組み込まれている）
    const currentEq = app.equalArr.bind(app);
    // 修正案
    const proposedEq = (a, b) => {
      if (a.length !== b.length) return false;
      return a.every((item, i) => b[i] != null && item.id === b[i].id);
    };

    // refetch のロジックを模倣する関数
    function simulateRefetch(newData, existingHomes, eqFn) {
      // refetch-actions.ts:26 と同じ条件
      const shouldReplace = existingHomes != null && !eqFn(newData, existingHomes);
      return { shouldReplace, beforeLen: existingHomes ? existingHomes.length : 0, afterLen: shouldReplace ? newData.length : (existingHomes ? existingHomes.length : 0) };
    }

    // ケース1: 同じ件数・同じ内容（通常運用）
    const case1_existing = [status(1), status(2), status(3)];
    const case1_new = [status(1), status(2), status(3)];
    
    // ケース2: 新着が来た（件数増加）
    const case2_existing = [status(1), status(2)];
    const case2_new = [status(0), status(1), status(2)];  // 先頭に新着
    
    // ケース3: 投稿が削除された（件数減少、先頭が同じ）★ バグの本丸
    const case3_existing = [status(1), status(2), status(3), status(4), status(5)];
    const case3_new = [status(1), status(2), status(3), status(4)];  // status(5) が削除
    
    // ケース4: 同じ件数・違う内容
    const case4_existing = [status(1), status(2), status(3)];
    const case4_new = [status(1), status(2), status(4)];

    // ケース5: 完全に空になった
    const case5_existing = [status(1)];
    const case5_new = [];

    const cases = [
      { name: '1. 同件数・同内容（通常運用）', ex: case1_existing, nw: case1_new },
      { name: '2. 新着あり（件数増加）',       ex: case2_existing, nw: case2_new },
      { name: '3. 削除あり（件数減少）★',       ex: case3_existing, nw: case3_new },
      { name: '4. 同件数・違う内容',             ex: case4_existing, nw: case4_new },
      { name: '5. 完全に空になった',             ex: case5_existing, nw: case5_new },
    ];

    return cases.map(c => ({
      name: c.name,
      beforeLen: c.ex.length,
      newLen: c.nw.length,
      current: simulateRefetch(c.nw, c.ex, currentEq),
      proposed: simulateRefetch(c.nw, c.ex, proposedEq),
    }));
  });

  console.log('=== refetch impact: current vs proposed equalArr ===\n');
  for (const c of result) {
    console.log('  ' + c.name);
    console.log('    既存件数: ' + c.beforeLen + ', 新規件数: ' + c.newLen);
    console.log('    現状  : 置き換え=' + c.current.shouldReplace + ' → 画面= ' + c.current.afterLen + ' 件');
    console.log('    修正案: 置き換え=' + c.proposed.shouldReplace + ' → 画面= ' + c.proposed.afterLen + ' 件');
    if (c.current.shouldReplace !== c.proposed.shouldReplace) {
      console.log('    *** 挙動が変わる *** ' + (c.current.afterLen === c.newLen ? '' : '(修正案で削除/追加が画面に反映)'));
    }
    console.log('');
  }

  console.log('=== Summary ===');
  const diffs = result.filter(c => c.current.shouldReplace !== c.proposed.shouldReplace);
  console.log('  挙動が変わるケース: ' + diffs.length + ' / ' + result.length);
  if (diffs.length === 0) console.log('  → 修正案は通常運用には影響なし');
  else {
    console.log('  変わるのは以下:');
    diffs.forEach(c => console.log('    - ' + c.name));
  }

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
