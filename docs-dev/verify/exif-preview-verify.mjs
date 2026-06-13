// exif-preview-verify.mjs — EXIF Orientation を持つ画像で、
// 「投稿前プレビューに表示される画像」と「ブラウザがネイティブ表示する画像」の向きを比較し、
// ユーザーがプレビューで向きの異常に気づけるかを判定する。
//
// テスト画像: exif_oriented.jpg（ピクセルは 800x400 横長 / EXIF Orientation=6 で表示時は 400x800 縦長）
//   上半分=赤, 下半分=青（canvas でピクセルを読めば向きが判定できる）
//
// 観点:
//   (Q1) ブラウザは <img> 表示時に EXIF を尊重するか（縦長 400x800 に見えるか）
//   (Q2) 縮小パス（canvas.drawImage）は EXIF を尊重するか/落とすか
//   (Q3) 投稿フォームのプレビューに渡る media_previews[].url は「変換後の画像」か
//   → 結論: プレビューが canvas 出力なら、ネイティブ表示とズレた向きが「プレビューに反映」される
//           = ユーザーは投稿前に気づける（ただし「プレビュー自体が正しい向きで出るか」は別問題）
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const JPG = process.argv[3] || '/tmp/exif_oriented.jpg';
const PORT = 5200;
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.mp3':'audio/mpeg','.ico':'image/x-icon','.map':'application/json','.wasm':'application/wasm' };
const jpgBytes = readFileSync(JPG);
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
    FakeWS.CONNECTING=0; FakeWS.OPEN=1; FakeWS.CLOSING=2; FakeWS.CLOSED=3; window.WebSocket = FakeWS;
    window.fetch = () => Promise.resolve(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    localStorage.setItem('at', JSON.stringify({ access_token: 'T', token_type: 'Bearer' }));
    localStorage.setItem('work_user', JSON.stringify({ id:'1', username:'tester', acct:'tester', display_name:'Tester', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', created_at:'2020-01-01T00:00:00Z' }));
  });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(700);

  const b64 = jpgBytes.toString('base64');

  // === (Q1) ブラウザの <img> 表示は EXIF を尊重するか ===
  const q1 = await page.evaluate(async (b64) => {
    const dataUrl = 'data:image/jpeg;base64,' + b64;
    // 通常の Image 読み込み（width/height は EXIF 反映前のピクセル寸法）
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=dataUrl; });
    // CSS レイアウトされた実寸（image-orientation: from-image が既定で効くか）
    const probe = document.createElement('img');
    probe.src = dataUrl;
    probe.style.position='fixed'; probe.style.left='-9999px';
    document.body.appendChild(probe);
    await new Promise(r => setTimeout(r, 100));
    const rect = probe.getBoundingClientRect();
    document.body.removeChild(probe);
    return {
      naturalW: img.naturalWidth, naturalH: img.naturalHeight,
      renderedW: Math.round(rect.width), renderedH: Math.round(rect.height),
    };
  }, b64);
  console.log('--- (Q1) Browser <img> rendering & EXIF ---');
  console.log('  naturalWidth/Height :', q1.naturalW + 'x' + q1.naturalH);
  console.log('  rendered (layout)   :', q1.renderedW + 'x' + q1.renderedH);
  const browserRespectsExif = q1.renderedH > q1.renderedW; // 縦長に見えれば EXIF 尊重
  console.log('  → browser shows it as', browserRespectsExif ? 'PORTRAIT (EXIF respected)' : 'LANDSCAPE (EXIF ignored)');

  // === (Q2)(Q3) checkActMedia を通し、プレビューに渡る画像の向きを調べる ===
  // actMedia をフックして media_previews[].url（=プレビュー表示される画像）を捕捉
  const result = await page.evaluate(async (b64) => {
    const app = window.app;
    if (!app.$data.katsu) app.$data.katsu = {};
    app.$data.katsu.media_previews = [];
    app.$data.katsu.media_attachments = [];
    app.$data.action_lock = '';
    app.$data.optMaxImageLen = 256;   // 縮小を強制（canvas パスを通す）→ 800x400 を縮小
    window.__previewUrl = null;
    app.actMedia = function (url, blob, converted) {
      // 実際に media_previews に push される url を観測（プレビュー img の src になる）
      window.__previewUrl = url;
      window.__converted = converted;
    };

    const bin = atob(b64); const bytes = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    const file = new File([bytes], 'portrait.jpg', { type: 'image/jpeg' });
    app.checkActMedia([file]);
    await new Promise(r => setTimeout(r, 1000));

    // プレビュー url の画像を解析: 寸法と「上端の色」を見る
    const url = window.__previewUrl;
    if (!url) return { error: 'actMedia not called' };
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
    // canvas にそのまま描いてピクセルを読む（プレビュー img と同じ見え方になる）
    const c = document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight;
    const cx = c.getContext('2d'); cx.drawImage(img, 0, 0);
    const W = img.naturalWidth, H = img.naturalHeight;
    const sample = (x, y) => { const d = cx.getImageData(x, y, 1, 1).data; return { r: d[0], g: d[1], b: d[2] }; };
    return {
      previewW: W, previewH: H,
      converted: window.__converted,
      topEdge: sample(Math.floor(W/2), 3),
      bottomEdge: sample(Math.floor(W/2), H-3),
      leftEdge: sample(3, Math.floor(H/2)),
      rightEdge: sample(W-3, Math.floor(H/2)),
    };
  }, b64);

  console.log('\n--- (Q2)(Q3) Preview image (what the post form shows) ---');
  if (result.error) { fail.push(result.error); }
  else {
    console.log('  preview dims        :', result.previewW + 'x' + result.previewH);
    console.log('  converted flag      :', result.converted);
    console.log('  edges  top/bottom   :', JSON.stringify(result.topEdge), '/', JSON.stringify(result.bottomEdge));
    console.log('  edges  left/right   :', JSON.stringify(result.leftEdge), '/', JSON.stringify(result.rightEdge));
    const previewIsPortrait = result.previewH > result.previewW;
    const isRed = (c) => c.r > 130 && c.b < 130;
    const isBlue = (c) => c.b > 130 && c.r < 130;
    // 正立(EXIF反映)なら 上=赤 下=青 の縦並び。EXIF無視なら 左右に分かれる。
    const verticalSplit = (isRed(result.topEdge) && isBlue(result.bottomEdge)) || (isBlue(result.topEdge) && isRed(result.bottomEdge));
    const horizontalSplit = (isRed(result.leftEdge) && isBlue(result.rightEdge)) || (isBlue(result.leftEdge) && isRed(result.rightEdge));
    console.log('  → preview orientation:', previewIsPortrait ? 'PORTRAIT' : 'LANDSCAPE',
                '| color split:', verticalSplit ? 'VERTICAL (top/bottom)' : (horizontalSplit ? 'HORIZONTAL (left/right)' : 'unclear'));

    // 判定: ブラウザ表示 (Q1) とプレビュー (Q2) の向きが食い違うなら、
    // 「プレビューに変換後の(回転した)画像が出る」=ユーザーは気づける
    const mismatch = browserRespectsExif !== previewIsPortrait;
    console.log('\n--- CONCLUSION ---');
    console.log('  browser native view :', browserRespectsExif ? 'portrait' : 'landscape');
    console.log('  post-form preview   :', previewIsPortrait ? 'portrait' : 'landscape');
    if (mismatch) {
      console.log('  ★ プレビューはネイティブ表示と違う向きを表示する');
      console.log('    → 投稿前プレビューを見れば、変換後に向きが変わったことに「気づける」');
    } else {
      console.log('  ★ プレビューはネイティブ表示と同じ向き');
      console.log('    → この環境(Chromium)では canvas が EXIF を反映したため食い違いなし');
    }
    // このテストは「気づけるか」を判定するのが目的。事実を出力できれば PASS。
    // （向きの正否そのものではなく、プレビューが変換後画像を見せている事実が確認できればよい）
    if (result.previewW <= 0) fail.push('preview produced no valid image');
  }

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}

console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f => console.log('  - ' + f)); process.exit(1); }
else { console.log('RESULT: PASS (preview behavior observed)'); }
