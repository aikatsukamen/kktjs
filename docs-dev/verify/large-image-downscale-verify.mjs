// large-image-downscale-verify.mjs — 8MB を超える画像でも、縮小設定が有効なら
// "Images must be less than 8 MB" で弾かれず、縮小後にアップロードされることを検証。
//
// 報告された症状: optMaxImageLen で縮小を有効にしても、optConvMedia='off' のままだと
// 旧 8MB チェックに引っかかって "Images must be less than 8 MB" になる。
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DOCS = process.argv[2] || '/home/claude/kktjs/docs';
const PORT = 5205;
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
    class FakeWS { constructor(){ this.readyState=0; setTimeout(()=>{this.readyState=1; this.onopen&&this.onopen({});},0);} send(){} close(){this.readyState=3;} addEventListener(){} removeEventListener(){} }
    FakeWS.OPEN=1; window.WebSocket = FakeWS;
    window.fetch = () => Promise.resolve(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    localStorage.setItem('at', JSON.stringify({ access_token: 'T', token_type: 'Bearer' }));
    localStorage.setItem('work_user', JSON.stringify({ id:'1', username:'t', acct:'t', display_name:'T', avatar:'', avatar_static:'', emojis:[], note:'', bot:false, locked:false, domain:'', created_at:'2020-01-01T00:00:00Z' }));
    localStorage.setItem('conf_std', JSON.stringify({ ver: 999 }));
  });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(700);

  await page.evaluate(() => {
    const app = window.app;
    if (!app.$data.katsu) app.$data.katsu = {};
    app.$data.katsu.media_previews = [];
    app.$data.katsu.media_attachments = [];
    app.actMedia = async function (url, blob, converted) {
      let dims = null;
      try {
        const u = URL.createObjectURL(blob);
        const img = await new Promise((res, rej) => { const i = new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=u; });
        dims = { w: img.naturalWidth, h: img.naturalHeight };
        URL.revokeObjectURL(u);
      } catch(e){}
      window.__lastCall = { type: blob?.type||'', size: blob?.size||0, converted, dims };
    };
  });

  // 9MB 超の「大きな画像 File」を作る。実際に巨大な canvas を JPEG 化するとサイズが出る。
  // ここでは 5000x4000 のノイズ画像で 8MB を超えさせる。
  const makeBig = async (cfg) => page.evaluate(async (cfg) => {
    const app = window.app;
    app.$data.optMaxImageLen = cfg.maxLen;
    app.$data.optConvMedia = cfg.conv;     // 'off' のまま縮小したいケースを再現
    app.$data.action_lock = '';
    app.$data.result_text = '';
    app.$data.katsu.media_previews = [];
    app.$data.katsu.media_attachments = [];
    window.__lastCall = null;

    // 大きな JPEG を生成（ノイズを描いて圧縮を効きにくくし、サイズを稼ぐ）
    const c = document.createElement('canvas'); c.width=5000; c.height=4000;
    const cx = c.getContext('2d');
    const imgd = cx.createImageData(5000, 4000);
    for (let i=0;i<imgd.data.length;i+=4){ imgd.data[i]=Math.random()*255; imgd.data[i+1]=Math.random()*255; imgd.data[i+2]=Math.random()*255; imgd.data[i+3]=255; }
    cx.putImageData(imgd, 0, 0);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.95));
    const file = new File([blob], 'huge.jpg', { type: 'image/jpeg' });

    app.checkActMedia([file]);
    // 縮小処理完了まで待つ
    for (let i=0;i<40;i++){ if (window.__lastCall || /less than 8 MB|失敗|読み込めません/.test(app.$data.result_text)) break; await new Promise(r=>setTimeout(r,200)); }
    return { inputSize: file.size, resultText: app.$data.result_text, lastCall: window.__lastCall };
  }, cfg);

  // (A) optMaxImageLen=2048 で縮小有効、optConvMedia='off' → 8MBチェックをすり抜けて縮小されるべき
  const A = await makeBig({ maxLen: 2048, conv: 'off' });
  console.log('--- (A) >8MB image, optMaxImageLen=2048, optConvMedia=off ---');
  console.log('  input size      :', (A.inputSize/1024/1024).toFixed(2), 'MB (expect > 8)');
  console.log('  result_text     :', JSON.stringify(A.resultText));
  console.log('  actMedia called :', !!A.lastCall, A.lastCall ? JSON.stringify(A.lastCall) : '');
  if (A.inputSize <= 8*1024*1024) {
    console.log('  ! note: generated image was not >8MB (' + (A.inputSize/1024/1024).toFixed(2) + 'MB) — test less meaningful');
  }
  if (/less than 8 MB/.test(A.resultText)) fail.push('(A) rejected with 8MB error despite downscale enabled (THE BUG)');
  if (!A.lastCall) fail.push('(A) actMedia not called (image did not go through)');
  else {
    if (A.lastCall.dims && Math.max(A.lastCall.dims.w, A.lastCall.dims.h) > 2048) fail.push('(A) not downscaled to 2048');
    if (A.lastCall.converted !== true) fail.push('(A) converted flag not set');
  }

  // (B) 縮小オフ(optMaxImageLen=0, optConvMedia=off)で >8MB → 従来どおり 8MB エラーで弾かれるべき
  const B = await makeBig({ maxLen: 0, conv: 'off' });
  console.log('\n--- (B) >8MB image, NO downscale (maxLen=0, conv=off) ---');
  console.log('  input size      :', (B.inputSize/1024/1024).toFixed(2), 'MB');
  console.log('  result_text     :', JSON.stringify(B.resultText));
  console.log('  actMedia called :', !!B.lastCall);
  if (B.inputSize > 8*1024*1024) {
    if (!/less than 8 MB/.test(B.resultText)) fail.push('(B) >8MB without downscale should be rejected but was not');
    if (B.lastCall) fail.push('(B) actMedia called despite >8MB no-downscale (should be blocked)');
  } else {
    console.log('  (B) generated image <=8MB, cannot test rejection path meaningfully');
  }

  await page.close();
} finally {
  if (browser) await browser.close();
  server.close();
}
console.log('\n========================================');
if (fail.length) { console.log('RESULT: FAIL'); fail.forEach(f => console.log('  - ' + f)); process.exit(1); }
else { console.log('RESULT: PASS (downscale bypasses 8MB; no-downscale still enforces it)'); }
