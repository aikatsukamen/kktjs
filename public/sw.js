

// 配信場所に依存しないよう、Service Worker のスコープ（登録時の './' により
// このファイルのあるディレクトリ = アプリのベース）を基準にキャッシュ対象を組み立てる。
// 例: https://example.com/kktjs/ でも https://example.com/ でも自動追従する。
const base = self.registration ? self.registration.scope : (location.origin + location.pathname.replace(/[^/]*$/, ''));

const key = "v1.12.3_version_display_cleanup_1";
const subkey = "?v=0926";
console.log("sw: new cache! " + key);

const cache_keys = [
  key
];
// base は末尾スラッシュ付き。各エントリは base からの相対パスで指定する。
const file = [
  base,
  // base + 'index.html',
  base + 'sw.js',
  base + 'css/style.css' + subkey,
  // 注: アプリ本体（旧 js/main.js）と SFC CSS は、Vite が assets/index-[hash].js / .css として
  // 出力する（ファイル名がビルドごとに変わる）。固定名でプリキャッシュできないため、ここには
  // 載せず、下の fetch ハンドラのランタイムキャッシュに任せる。Vue も同バンドルに含まれる。
  base + 'css/font-awesome.min.css',
  base + 'sounds/boop.mp3',
  base + 'fonts/roboto.ttf',
  base + 'fonts/fontawesome-webfont.woff',
  base + 'fonts/fontawesome-webfont.woff2',
  base + 'img/sheet_64_indexed_128.png',
  base + 'img/missing_header.png',
  base + 'img/missing_icon.png',
  base + 'img/favicon.ico',
  base + 'img/touch/apple-touch-icon.png',
  base + 'img/touch/chrome-touch-icon-192x192.png',
  base + 'img/touch/icon-128x128.png',
  base + 'img/touch/ms-touch-icon-144x144-precomposed.png',
  base + 'img/touch/splashscreen-icon-512x512.png',
  base + 'css/addtohomescreen.css',
  base + 'css/emojipicker.css',
  base + 'css/font-awesome.min.css',
  base + 'js/addtohomescreen.min.js',
  base + 'js/emojione.js',
  base + 'js/inobounce.min.js',
  base + 'js/lodash.min.js',
  base + 'js/addtohomescreen.min.js',
  base + 'js/picker.js',
  base + 'js/manifest.json'
];

self.addEventListener('install', event => {
  // console.log("sw: install");
  self.skipWaiting();
  event.waitUntil(
    caches.open(key).then(cache => {
      return Promise.all(
        file.map(url => {
          return fetch(new Request(url, { cache: 'no-cache', mode: 'no-cors' })).then(response => {
            return cache.put(url, response);
          });
        })
      );
    })
  );
});

self.addEventListener('activate', event => {
  // console.log("sw: activate");
  self.clients.claim();
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => {
          return !cache_keys.includes(key);
        }).map(key => {
          return caches.delete(key);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // if(event.request.url == 'https://kirakiratter.com/api/v1/media'){
  //   // return;
  // };
  event.respondWith(
    caches.open(key).then((cache) => {
      return cache.match(event.request).then((response) => {
        // if(response && response.url.length != 0){
        //   console.log("sw res: "+response.url);
        // }
        return response || fetch(event.request).then((response) => {
          // ランタイムキャッシュ対象:
          //  - 既定の外部 CDN（jsdelivr）とアバター画像
          //  - Vite 生成のハッシュ付きアプリ資産（同一オリジンの assets/index-*.js / .css）。
          //    プリキャッシュできない（毎ビルドで名前が変わる）ため、初回取得時にキャッシュして
          //    次回以降のオフライン起動に備える。
          var isAppAsset = event.request.url.indexOf(self.registration.scope + 'assets/') === 0;
          if (/^https:\/\/cdn.jsdelivr.net\/|https:\/\/files.kirakiratter.com\/accounts\/avatars\//.test(event.request.url) || isAppAsset) {
            // console.log("sw cache add: "+event.request.url);
            cache.put(event.request, response.clone());
            // }else{
            //   console.log("sw fetch: "+event.request.url);
          }
          return response;
        });
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data == "check") {
    console.log("sw: update check (now " + key + ")");
    self.registration.update();
    // }else if(event.data == "force"){
    //   console.log("sw: kktjs update now");
    //   self.skipWaiting();
    // }else{
    //   console.log("sw msg_test: "+event.data);
  }
});