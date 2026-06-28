// equalarr-length-verify.mjs — equalArr のロジック検証
// (1) a.length < b.length のときの挙動
// (2) a.length > b.length のときの挙動
// (3) 同じ長さ・同じ内容
// (4) 同じ長さ・異なる内容
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5223;
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
    const eq = app.equalArr.bind(app);
    return {
      // (1) a < b
      shortVsLong: eq([{id:'1'}], [{id:'1'},{id:'2'}]),
      // (2) a > b
      longVsShort: eq([{id:'1'},{id:'2'}], [{id:'1'}]),
      // (3) same content
      sameSame: eq([{id:'1'},{id:'2'}], [{id:'1'},{id:'2'}]),
      // (4) same length diff content
      diffContent: eq([{id:'1'},{id:'2'}], [{id:'1'},{id:'3'}]),
      // (5) empty arrays
      bothEmpty: eq([], []),
      // (6) a empty, b not
      aEmpty: eq([], [{id:'1'}]),
    };
  });

  console.log('=== equalArr behavior across cases ===\n');
  console.log('  [1 vs 1,2] short→long :', result.shortVsLong, '(should be false; current = ' + result.shortVsLong + ')');
  console.log('  [1,2 vs 1] long→short :', result.longVsShort, '(should be false)');
  console.log('  [1,2 vs 1,2] same     :', result.sameSame, '(should be true)');
  console.log('  [1,2 vs 1,3] diff     :', result.diffContent, '(should be false)');
  console.log('  [] vs []   bothEmpty :', result.bothEmpty, '(should be true)');
  console.log('  [] vs [1]  aEmpty    :', result.aEmpty, '(should be false; current = ' + result.aEmpty + ')');

  if (result.shortVsLong === true) {
    console.log('\n  ✗ BUG: short array is "equal" to a longer array starting with same ids');
    console.log('    → refetch 時に新着が来たケースで「等しい」と誤判定し、配列を置き換えず');
    console.log('       新着が表示されない可能性。実害は homes/locals の構造上は薄いが、要確認。');
  }
  if (result.aEmpty === true) {
    console.log('\n  ✗ BUG: empty array considered equal to non-empty');
  }

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
