// version-display-verify.mjs — バージョン表示の整理を検証:
//   1. 左上のヘッダーから 'js v1.4.8a' / app_ver_top の表示が消えている
//   2. ログイン画面の 'kktjs v1.4 [js v1.4.8a]' <h2> が消えている
//   3. 設定画面（開発ステータス）に kktjs v{kktjs_version} が表示される
//   4. window.app.kktjs_version が package.json のバージョン文字列を持つ
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5242;
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

// package.json の version を取得
const pkgVersion = JSON.parse(readFileSync(new URL('../../home/claude/kktjs/package.json', import.meta.url).pathname, 'utf-8')).version;

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

  const result = await page.evaluate((expectedVer) => {
    const app = window.app;
    const out = {};
    
    // 1. window.app.kktjs_version が正しい値
    out.kktjsVersion = app.kktjs_version;
    
    // 2. 旧データフィールドが消えている
    out.hasAppVerTop = 'app_ver_top' in app.$data;
    out.hasAppName = 'app_name' in app.$data;
    out.hasAppVer = 'app_ver' in app.$data;
    
    // 3. 左上ヘッダーに古いバージョン表示がない
    const header = document.querySelector('.app-header');
    const headerText = header ? header.innerText : '';
    out.headerHasOldVersion = /js v1\.4\.8a/.test(headerText);
    out.headerHasKktjsVer = headerText.indexOf(expectedVer) !== -1;
    
    // 4. ログイン画面の <h2> 削除確認（auth 済みなので表示されないが、テンプレート内に残ってないか）
    const fullHtml = document.documentElement.outerHTML;
    out.htmlHasOldH2 = /\{\{app_name\}\} v\{\{app_ver\}\}/.test(fullHtml);
    out.htmlHasVersionBadge = /version-badge/.test(fullHtml);
    
    // 5. 設定画面のテキストに kktjs_version が反映される
    // showSetting を強制 ON にしてレンダリングを待つ
    return out;
  }, pkgVersion);

  console.log('=== Version display verification ===\n');
  console.log('  package.json version  :', pkgVersion);
  console.log('  app.kktjs_version     :', result.kktjsVersion);
  console.log('  app.app_ver_top exists:', result.hasAppVerTop, '(expect false)');
  console.log('  app.app_name exists   :', result.hasAppName, '(expect false)');
  console.log('  app.app_ver exists    :', result.hasAppVer, '(expect false)');
  console.log('  header has "js v1.4.8a" :', result.headerHasOldVersion, '(expect false)');
  console.log('  HTML still has <h2>{{app_name}} v{{app_ver}}>:', result.htmlHasOldH2, '(expect false)');
  console.log('  HTML still has version-badge :', result.htmlHasVersionBadge, '(expect false)');
  
  if (result.kktjsVersion !== pkgVersion) fail.push('kktjs_version mismatch (got ' + result.kktjsVersion + ' expected ' + pkgVersion + ')');
  if (result.hasAppVerTop) fail.push('app_ver_top still in $data');
  if (result.hasAppName) fail.push('app_name still in $data');
  if (result.hasAppVer) fail.push('app_ver still in $data');
  if (result.headerHasOldVersion) fail.push('header still shows old "js v1.4.8a"');
  if (result.htmlHasOldH2) fail.push('login screen <h2> with app_name/app_ver still in template');
  if (result.htmlHasVersionBadge) fail.push('version-badge still in template');

  // 設定画面の表示を確認: showSetting=true にして DOM をチェック
  const settingsResult = await page.evaluate((expectedVer) => {
    const app = window.app;
    app.$data.showSetting = true;
    return new Promise(r => {
      setTimeout(() => {
        const settingsDOM = document.body.innerText;
        r({
          showsKktjsVer: settingsDOM.indexOf('kktjs v' + expectedVer) !== -1,
          showsOldKkt: /kktjs v1\.4\.8a/.test(settingsDOM),
          hasBadgeSection: /開発ステータス/.test(settingsDOM),
        });
      }, 300);
    });
  }, pkgVersion);
  
  console.log('');
  console.log('  Settings panel shows "kktjs v' + pkgVersion + '" :', settingsResult.showsKktjsVer, '(expect true)');
  console.log('  Settings panel shows old "kktjs v1.4.8a"  :', settingsResult.showsOldKkt, '(expect false)');
  console.log('  Settings panel has "開発ステータス"        :', settingsResult.hasBadgeSection);
  
  if (!settingsResult.showsKktjsVer) fail.push('settings panel does not show kktjs v' + pkgVersion);
  if (settingsResult.showsOldKkt) fail.push('settings panel still shows old "kktjs v1.4.8a"');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (version display reorganized correctly)'); }
