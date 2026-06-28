// equalarr-fix-logic-verify.mjs — 修正案の equalArr が全エッジケースで論理的に正しいかを検証。
// 現状の実装と並べて比較し、変化のある/ない/真偽の差を可視化する。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5230;
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

  const result = await page.evaluate(() => {
    // 現状の実装
    const current = (a, b) => {
      let eq = true;
      a.forEach((item, i) => { eq = eq && b[i] != null && item.id === b[i].id; });
      return eq;
    };
    // 修正案
    const proposed = (a, b) => {
      if (a.length !== b.length) return false;
      return a.every((item, i) => b[i] != null && item.id === b[i].id);
    };

    const id = (n) => ({ id: String(n) });
    const cases = [
      // [label, a, b, expected]
      ['both empty',              [], [], true],
      ['a empty, b has 1',        [], [id(1)], false],
      ['a has 1, b empty',        [id(1)], [], false],
      ['same single',             [id(1)], [id(1)], true],
      ['diff single',             [id(1)], [id(2)], false],
      ['same 3 items',            [id(1),id(2),id(3)], [id(1),id(2),id(3)], true],
      ['diff last item',          [id(1),id(2),id(3)], [id(1),id(2),id(4)], false],
      ['diff first item',         [id(1),id(2),id(3)], [id(0),id(2),id(3)], false],
      ['a shorter (prefix)',      [id(1),id(2)], [id(1),id(2),id(3)], false],     // ★ 現状バグ
      ['a longer',                [id(1),id(2),id(3)], [id(1),id(2)], false],
      ['a shorter (no overlap)',  [id(1)], [id(9),id(8),id(7)], false],
      ['a much shorter',          [id(1)], [id(1),id(2),id(3),id(4),id(5)], false], // ★ 現状バグ
    ];

    return cases.map(([label, a, b, expected]) => ({
      label,
      a: a.map(x=>x.id).join(','),
      b: b.map(x=>x.id).join(','),
      expected,
      current: current(a, b),
      proposed: proposed(a, b),
    }));
  });

  console.log('=== equalArr: current vs proposed ===\n');
  const head = ['case', 'a', 'b', 'expect', 'current', 'proposed', 'diff?'];
  console.log('  ' + head.map(h => h.padEnd(12)).join('| '));
  console.log('  ' + ''.padEnd(85, '-'));
  let buggy = 0, fixedCount = 0, regressions = 0;
  for (const r of result) {
    const curOk = r.current === r.expected;
    const propOk = r.proposed === r.expected;
    const changed = r.current !== r.proposed;
    let mark = '';
    if (!curOk && propOk) { mark = '✓ FIXED'; fixedCount++; }
    else if (curOk && !propOk) { mark = '✗ REGRESSION'; regressions++; }
    else if (!curOk && !propOk) { mark = '? still wrong'; buggy++; }
    else mark = '· same';
    console.log('  ' + [r.label, r.a||'[]', r.b||'[]', String(r.expected), String(r.current), String(r.proposed), mark].map(s => String(s).padEnd(12)).join('| '));
  }
  console.log('\n=== Summary ===');
  console.log('  fixed       :', fixedCount, '(現状バグ → 修正案で正しい)');
  console.log('  regressions :', regressions, '(現状正しい → 修正案で誤る)');
  console.log('  still wrong :', buggy, '(両方とも誤る)');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
