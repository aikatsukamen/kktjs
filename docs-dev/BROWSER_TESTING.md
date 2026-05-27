# ブラウザでの動作確認（開発者向けメモ）

このプロジェクトは Vue 2 を CDN グローバルとして読み込むため、**型チェックとビルドだけでは
実行時の不具合（特に機械変換したモジュールの実行経路）を捕捉できない**。実際の起動・操作は
ブラウザで確認する必要がある。ここでは Anthropic のコンテナ環境で実施した検証手順を残す。

## 1. ブラウザ実行ファイル

コンテナには Chromium / Chrome for Testing が同梱されている（apt 不要・DL 不要）。

- Playwright Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`（Chromium 141 系）
- Chrome for Testing: `~/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome`

バージョン確認:

```bash
/opt/pw-browsers/chromium-1194/chrome-linux/chrome --version
```

ネットワーク制限でブラウザの新規ダウンロードは失敗することがあるので、**同梱の実行ファイルを
`executablePath` で明示**して使う（playwright-core が期待する revision と多少ズレていても
明示指定すれば起動できる）。

## 2. 制御ライブラリ

`playwright-core`（ブラウザ同梱なしの軽量版）を使う。プロジェクト本体の依存には足さず、
作業用ディレクトリに入れる:

```bash
mkdir -p /tmp/pwtest && cd /tmp/pwtest
npm init -y
npm install playwright-core jsdom
```

起動時は sandbox 無効化フラグが必要:

```js
import { chromium } from 'playwright-core';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  headless: true,
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
```

## 3. サーバはテストプロセス内で起動する（重要）

このコンテナでは、バックグラウンドに回した常駐サーバ（`node build.mjs --serve &` など）が
ツールのシェル境界をまたいで生き残り、ポートを掴んだままになって次のビルドと衝突する。
**動作確認用の HTTP サーバは Playwright スクリプトと同じプロセス内で `createServer` して
起動し、テスト終了時に `server.close()` で必ず閉じる**こと（常駐させない）。

```js
import { createServer } from 'node:http';
const server = createServer(/* docs/ を配信 */);
await new Promise(r => server.listen(5181, r));
// ... テスト ...
server.close();
```

## 4. 検証の段取り

1. `npm run build`（prod ビルドを `docs/` に生成）
2. テストプロセス内サーバで `docs/` を配信
3. Chromium で `http://localhost:PORT/` を開く
4. 未ログイン: `window.app` 生成 / `__kktjsMethods` 全件 / ブリッジ4種 / 認証画面の
   実レンダリング（「App Authorize」等の文言とボタン）を確認
5. ログイン済み: `addInitScript` で localStorage にトークンを注入して再ロードし、
   `created` から走る `openWs*` / `refetch*` / `run*` などを実際に叩いて例外が出ないか確認
   （WebSocket / fetch はスタブして本番 API には飛ばさない）
6. `page.screenshot()` で実レンダリングの証跡を残す

実スクリプトは作業時に `/tmp/pwtest/` に置いた:
- `boot-test.mjs` … jsdom 版の起動確認（軽量・ブラウザ不要）
- `interaction-test.mjs` … jsdom 版のメソッド呼び出し確認
- `browser-e2e.mjs` … 実 Chromium 版の E2E（起動 + ログイン後操作 + スクショ）
- `screen-verify.mjs` … 実 Chromium 版の各画面表示確認（ダミーデータ注入 → ホーム/
  ローカル/通知/設定/検索/投稿フォーム/詳細/ストリーム/リンク/メディアモーダルを
  描画してスクショ）

## 5. jsdom との使い分け

- **jsdom**: ブラウザ不要で速い。JS の実行時エラー・メソッド呼び出し・`__kktjsMethods`
  登録の確認に十分。canvas / WebSocket / matchMedia 等はスタブが要る。
- **実 Chromium**: Vue の実リアクティビティ・実 DOM レンダリング・実 WebSocket・
  スクリーンショットが必要なときに使う。jsdom より本番に近い。**inline `onerror` 等の
  素の HTML 属性ハンドラは、その要素が実際にレンダリングされて初めて評価される**ため、
  メソッド呼び出しの確認だけでは漏れる（後述の IMG_DUMMY バグはこれで見つかった）。

過去に「起動はするがメソッドを呼ぶと落ちる」既存バグ（ブリッジの import 時キャプチャ、
実在しないグローバル参照など）を、上記のログイン後メソッド呼び出しで検出した実績がある。
さらに各画面のレンダリングまで行って、inline `onerror="this.src=IMG_DUMMY"` が参照する
`IMG_DUMMY` が window から消えていた既存バグも検出した（通知・投稿フォーム画面で顕在化）。
README「起動時検証（jsdom）と、それが検出した既存バグ」も参照。

## 6. ログイン済み状態をテストで再現するときの注意

`created` フックはログイン済み（localStorage `at` あり）だと `loadConf()` を呼んで
カラム設定（`showHome`/`columns` 等）を localStorage から復元する。テストで `at` と
`work_user` だけ入れて設定本体（`conf_std` 等）を入れないと、カラムが組まれず
`showHome=false` のまま空 TL になる。タイムライン描画を確認したいときは、テスト側で
`app.showHome = true` 等を直接立て、`app.homes` にダミー status を入れてから
`app.$forceUpdate()` するとよい。status オブジェクトは `account` / `reblog` / `poll` /
`media_attachments` / `emojis` のほか、kktjs が付与する内部フラグ（`content_opened` /
`media_opened` / `loading_avatar` / `req_*` / `caught_katsufilter` 等）も埋めておくと
テンプレートが例外なく描画できる。
