// error-display-verify.mjs — エラー全文表示の検証。
//   A. 長いエラー（[Media]...）のとき、バナーが info-full（折り返し）になる
//   B. 短い通常通知のときは従来どおり hidden（一行省略）のまま
//   C. エラーが last_error_text / last_error_time に記録される
//   D. トーストを閉じても控えは残る（設定画面から読み返せる）
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5253;
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
    class FakeWS { constructor(){ this.readyState=0; setTimeout(()=>{this.readyState=1;},0);} send(){} close(){} addEventListener(){} removeEventListener(){} }
    FakeWS.OPEN=1; window.WebSocket = FakeWS;
    window.fetch = () => Promise.resolve(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    localStorage.setItem('at', JSON.stringify({ access_token: 'T', token_type: 'Bearer' }));
    localStorage.setItem('work_user', JSON.stringify({ id:'1', username:'t', acct:'t', display_name:'T', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', created_at:'2020-01-01T00:00:00Z' }));
    localStorage.setItem('conf_std', JSON.stringify({ ver: 999 }));
  });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  const result = await page.evaluate(async () => {
    const app = window.app;
    const out = {};
    const LONG = '[Media] アップロード失敗 (size=428KB, type=image/jpeg, rs=1, st=0, ev=error)。詳細はスクショで報告してください。';

    // --- A: 長いエラーを表示 ---
    app.result_text = LONG;
    await new Promise(r => setTimeout(r, 250));
    let span = document.querySelector('.info-wrapper span');
    out.A_class = span ? span.className : '(no span)';
    out.A_isLongInfo = app.isLongInfo;
    if (span) {
      const cs = getComputedStyle(span);
      out.A_whiteSpace = cs.whiteSpace;
      // 実際に折り返って複数行になっているか（高さが1行より大きいか）
      out.A_lines = Math.round(span.getBoundingClientRect().height / parseFloat(cs.lineHeight || '16'));
    }

    // --- B: 短い通知 ---
    app.result_text = 'OK';
    await new Promise(r => setTimeout(r, 250));
    span = document.querySelector('.info-wrapper span');
    out.B_class = span ? span.className : '(no span)';
    out.B_isLongInfo = app.isLongInfo;

    // --- C: popError 経由で控えが残るか ---
    app.result_text = '';
    app.last_error_text = '';
    app.popError('{"error":"バリデーションに失敗しました: File content type invalid"}', 422, 'Media');
    await new Promise(r => setTimeout(r, 200));
    out.C_lastText = app.last_error_text;
    out.C_lastTime = app.last_error_time;
    out.C_shownText = app.result_text;

    // --- D: トーストを閉じても控えが残るか ---
    app.runToast(false);
    await new Promise(r => setTimeout(r, 200));
    out.D_resultAfterClose = app.result_text;
    out.D_lastAfterClose = app.last_error_text;

    return out;
  });

  console.log('=== error display verification ===\n');
  console.log('A. 長いエラー（診断情報つき）');
  console.log('   isLongInfo    :', result.A_isLongInfo, '(expect true)');
  console.log('   span class    :', result.A_class, '(expect info-full)');
  console.log('   white-space   :', result.A_whiteSpace, '(expect normal = 折り返す)');
  console.log('   表示行数      :', result.A_lines, '(expect >= 2)');
  console.log();
  console.log('B. 短い通知');
  console.log('   isLongInfo    :', result.B_isLongInfo, '(expect false)');
  console.log('   span class    :', result.B_class, '(expect hidden)');
  console.log();
  console.log('C. popError の控え記録');
  console.log('   表示された文  :', result.C_shownText);
  console.log('   last_error_text:', result.C_lastText);
  console.log('   last_error_time:', result.C_lastTime);
  console.log();
  console.log('D. トーストを閉じた後');
  console.log('   result_text   :', JSON.stringify(result.D_resultAfterClose), '(expect "")');
  console.log('   last_error_text:', result.D_lastAfterClose ? '(残っている)' : '(消えた)', '(expect 残っている)');

  if (result.A_isLongInfo !== true) fail.push('A: isLongInfo should be true for long error');
  if (!/info-full/.test(result.A_class)) fail.push('A: banner did not use info-full');
  if (result.A_whiteSpace === 'nowrap') fail.push('A: still nowrap (truncated)');
  if (!(result.A_lines >= 2)) fail.push('A: message did not wrap to multiple lines');
  if (result.B_isLongInfo !== false) fail.push('B: short message wrongly treated as long');
  if (!/hidden/.test(result.B_class)) fail.push('B: short message should keep hidden class');
  if (!result.C_lastText) fail.push('C: popError did not record last_error_text');
  if (!result.C_lastTime) fail.push('C: popError did not record last_error_time');
  if (result.D_resultAfterClose !== '') fail.push('D: toast did not clear');
  if (!result.D_lastAfterClose) fail.push('D: last_error_text lost after closing toast');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (long errors shown in full; short notices unchanged; errors recorded)'); }
