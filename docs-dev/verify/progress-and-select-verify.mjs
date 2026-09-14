// progress-and-select-verify.mjs
//   A. アップロード開始で「縮小しています…」から「アップロードしています…」へ切り替わる
//   B. 送信進捗で「アップロード中… N%」が表示される
//   C. 成功したら進捗表示が消える
//   D. 進捗表示はエラーではないので一行のまま（折り返さない）
//   E. 投稿本文(.status-text)は user-select: text（iOSで選択できる）
//   F. 本文内の SHOW MORE 等は user-select: none のまま
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5255;
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
    window.__origFetch = window.fetch.bind(window);
    window.fetch = () => Promise.resolve(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    localStorage.setItem('at', JSON.stringify({ access_token: 'T', token_type: 'Bearer' }));
    localStorage.setItem('work_user', JSON.stringify({ id:'1', username:'t', acct:'t', display_name:'T', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', created_at:'2020-01-01T00:00:00Z' }));
    localStorage.setItem('conf_std', JSON.stringify({ ver: 999 }));
  });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  const result = await page.evaluate(async () => {
    const app = window.app;
    const out = { phases: [] };

    // result_text の遷移を記録
    const seen = [];
    const iv = setInterval(() => {
      const t = app.result_text;
      if (t && seen[seen.length - 1] !== t) seen.push(t);
    }, 15);

    // 進捗イベントを出しつつ最後に成功する XHR モック
    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      const xhr = new OriginalXHR();
      const uploadHandlers = {};
      xhr.open = function () {};
      xhr.setRequestHeader = function () {};
      Object.defineProperty(xhr, 'upload', {
        get() {
          return {
            set onprogress(fn) { uploadHandlers.progress = fn; },
            set onerror(fn) { uploadHandlers.error = fn; },
            set ontimeout(fn) { uploadHandlers.timeout = fn; },
          };
        }, configurable: true
      });
      xhr.send = function () {
        setTimeout(() => uploadHandlers.progress && uploadHandlers.progress({ lengthComputable: true, loaded: 50, total: 100 }), 40);
        setTimeout(() => uploadHandlers.progress && uploadHandlers.progress({ lengthComputable: true, loaded: 100, total: 100 }), 90);
        setTimeout(() => {
          Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
          Object.defineProperty(xhr, 'status', { value: 200, configurable: true });
          Object.defineProperty(xhr, 'responseText', { value: '{"id":"x","url":"u","preview_url":"p","type":"image"}', configurable: true });
          xhr.onreadystatechange && xhr.onreadystatechange();
        }, 140);
      };
      return xhr;
    };
    window.XMLHttpRequest.DONE = 4;

    app.katsu.media_previews = []; app.katsu.media_attachments = []; app.action_lock = '';
    // 縮小中の状態を作ってから actMedia を呼ぶ（実際の流れを再現）
    app.result_text = '[Media] 画像を縮小しています…';
    await new Promise(r => setTimeout(r, 50));
    app.actMedia('data:image/jpeg;base64,AAAA', new Blob([new Uint8Array(8192)], { type: 'image/jpeg' }), true);
    await new Promise(r => setTimeout(r, 700));
    clearInterval(iv);
    window.XMLHttpRequest = OriginalXHR;

    out.phases = seen;
    out.finalText = app.result_text;
    out.uploaded = app.katsu.media_attachments.length;

    // 進捗表示が折り返し対象になっていないか
    app.result_text = '[Media] アップロード中… 50% (8KB)';
    await new Promise(r => setTimeout(r, 200));
    out.progressIsLong = app.isLongInfo;
    // エラーは折り返す
    app.result_text = '[Media] アップロード失敗 (size=8KB, rs=4, st=0, ev=error)';
    await new Promise(r => setTimeout(r, 200));
    out.errorIsLong = app.isLongInfo;
    app.result_text = '';

    // --- テキスト選択の確認 ---
    const probe = document.createElement('div');
    probe.className = 'status-text';
    probe.innerHTML = '<span>本文テキスト</span><div class="spoller-link"><small>- SHOW MORE -</small></div>';
    document.body.appendChild(probe);
    await new Promise(r => setTimeout(r, 50));
    const span = probe.querySelector('span');
    const link = probe.querySelector('.spoller-link small');
    out.bodySelect = getComputedStyle(span).webkitUserSelect || getComputedStyle(span).userSelect;
    // -webkit-touch-callout は Chromium が未対応のため computed でも cssText でも
    // 取得できない。CSS ファイルのソースを直接読んで宣言の有無を確認する。
    out.bodyCallout = await (async () => {
      try {
        const res = await window.__origFetch('css/style.css');
        const css = await res.text();
        const m = css.match(/:root \.status-text,[\s\S]{0,300}?\}/);
        if (m && /touch-callout:\s*default/.test(m[0])) return 'default';
        return '(not found)';
      } catch (e) {
        return '(fetch failed)';
      }
    })();
    out.linkSelect = getComputedStyle(link).webkitUserSelect || getComputedStyle(link).userSelect;
    probe.remove();

    return out;
  });

  console.log('=== upload progress & text selection ===\n');
  console.log('A-C. result_text の遷移:');
  result.phases.forEach((p, i) => console.log('   ' + (i + 1) + '. ' + p));
  console.log('   最終 :', JSON.stringify(result.finalText), '(expect "")');
  console.log('   添付  :', result.uploaded, '(expect 1)');
  console.log();
  console.log('D. 折り返し判定');
  console.log('   進捗表示 isLongInfo :', result.progressIsLong, '(expect false = 一行)');
  console.log('   エラー   isLongInfo :', result.errorIsLong, '(expect true = 折り返す)');
  console.log();
  console.log('E-F. テキスト選択');
  console.log('   本文 user-select     :', result.bodySelect, '(expect text)');
  console.log('   本文 touch-callout   :', result.bodyCallout, '(expect default)');
  console.log('   SHOW MORE user-select:', result.linkSelect, '(expect none)');

  const joined = result.phases.join(' | ');
  if (!/アップロードしています/.test(joined)) fail.push('A: did not switch to uploading message');
  if (!/アップロード中… \d+%/.test(joined)) fail.push('B: upload percentage never shown');
  if (result.finalText !== '') fail.push('C: progress text not cleared on success');
  if (result.uploaded !== 1) fail.push('C: upload did not succeed');
  if (result.progressIsLong !== false) fail.push('D: progress message should stay one line');
  if (result.errorIsLong !== true) fail.push('D: error should wrap');
  if (result.bodySelect !== 'text') fail.push('E: post body is not selectable');
  if (result.bodyCallout !== 'default') fail.push('E: touch-callout not enabled on body');
  if (result.linkSelect !== 'none') fail.push('F: SHOW MORE link should not be selectable');

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('RESULT: PASS (upload phases visible; body text selectable)'); }
