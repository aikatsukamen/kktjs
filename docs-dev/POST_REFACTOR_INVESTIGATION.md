# 隠れた問題の調査結果（forceUpdate 整理後）

v1.11.0 デプロイ後の追加調査で発見した問題・潜在リスクの記録。
発見順に重要度を判定して整理。

## ★★★ Critical（修正完了）

### updateWrapperBM('detail') が status 本体にフラグをセットしていなかった

**症状**: 「Open All Wrappers」（optAllOpen='both'/'media'/'katsu'）設定をオンにして詳細画面を
開いても、本文・メディアが自動展開されない。

**原因**: `detail.ts:17` で `app.updateWrapperBM([status], 'detail')` と**配列で包んで**渡していたが、
`display-wrappers.ts:45-49` の実装は `data['media_opened'] = media` で**配列自体のプロパティ**に
セットしていた。配列の `[0]`（status 本体）には届かない。

**修正**: `detail.ts:17` を `app.updateWrapperBM(status as any, 'detail')` に変更（配列で囲まない）。
`detail_chain` モードは `data['ancestors']/['descendants']` を forEach するので影響なし。

**検証**: `detail-wrapperbm-fix-verify.mjs` で確認:
- 修正前: `status.media_opened: false`, `arrayArg.media_opened: true`（バグ確定）
- 修正後: `status.media_opened: true`, `status.content_opened: true`（正常）

**影響範囲**: 「Open All Wrappers」設定ユーザー全員。長年この設定が詳細画面で効いていなかった。

## ★★ Notable（要検討、未修正）

### equalArr が短い配列を「等しい」と誤判定する

**症状**: `equalArr([{id:'1'}], [{id:'1'},{id:'2'}])` が **`true`** を返す。

**原因**: `src/core/formatters.ts:109-115` の実装が `a.forEach` のみで、`b` の長さチェックがない。

```javascript
export function equalArr(a, b) {
  let eq = true;
  a.forEach((item, i) => {
    eq = eq && b[i] != null && item.id === b[i].id;
  });
  return eq;
}
```

`a.length < b.length` のとき、`a` を全部走査し終わっても `eq=true` のまま返る。

**実害評価**: refetch では `a = サーバから来た最新`, `b = 現在の homes`。
- 通常は `a.length >= b.length`（新着があれば長くなる）→ 問題ない
- `a.length < b.length` は「投稿が削除されてサーバ側で減った」ケース → equalArr が
  誤って true を返し、配列を置き換えず、削除された投稿が DOM に残り続ける可能性
- `notifs` の refetch（refetch-actions.ts:167-172）で特に影響が出やすい

**判断**: 元コードからの仕様の可能性もあり、即修正は要相談。修正案:
```javascript
export function equalArr(a, b) {
  if (a.length !== b.length) return false;
  return a.every((item, i) => b[i] != null && item.id === b[i].id);
}
```

### `:key="__kk_i"`（インデックス）が検索結果で使用されている

**箇所**: `index.html:2901` の `<template v-for="(issue, __kk_i) in searchs.accounts_ex" :key="__kk_i">`

**懸念**: アカウント検索結果。`issue.id` が利用可能なのに、インデックスベースの key を使用。
理論上、検索結果が部分更新されると DOM の差分計算が正しくない可能性。

**実害評価**: 検索は1回行うとリストが丸ごと置き換わる UI なので、実害は薄い。
`stream_channels`（Discord）の同じパターンも同様。

**判断**: 推奨修正だが緊急性は低い。`:key="issue.id"` に変更すれば安全。

## ★ Minor（記録のみ）

### Discord heartbeat の setInterval が clearInterval されない

**箇所**: `discord.ts:254` の `setInterval(function() { ... }, _0x5d9051)`

**影響**: WebSocket が再接続されると古い `wsDiscord` 参照の send が無効になるが、interval
自体は生き残る。長時間 Discord 機能を使い続けるとわずかに interval が積み重なる。

**実害評価**: Discord 機能を使うユーザー自体が限定的で、深刻な影響にはならない。

### XHR の ontimeout ハンドラ未設定

**箇所**: `posting-actions.ts` 等の XHR を使う関数群（投票、報告、katsu、プロフィール変更）。
`request.timeout = REQ_TIMEOUT` を設定するが `ontimeout` ハンドラはない。

**実害評価**: XHR 仕様上、timeout 時は `onreadystatechange` で `readyState=DONE, status=0` の
コールバックに入るため、`else if (DONE)` 分岐で `req=false` に戻り、リークしない。
ただし `popError` が空メッセージで通知される可能性。

### v-if 式に `0 != issue.media_attachments`（配列との比較）

**箇所**: `index.html` の複数箇所。`Array != 0` で毎回 toPrimitive → 文字列変換。

**実害評価**: 計算量はごく小さく、現実のフレームレートに影響しない。
`issue.media_attachments.length > 0` の方が意図明確だが、元コードの忠実な再現を優先するなら変更不要。

### WebSocket 再接続に指数バックオフがない

**箇所**: `streaming.ts` の `S._.debounce(_0x3b7770, 200)` で 200ms 固定。

**実害評価**: WS 接続自体が数秒かかるので、実質的なリクエスト頻度は 200ms より低い。
過去長年問題報告がないため影響は無視できる。

## 同種バグ網羅監査の結果

### Pattern A: 配列代入後の生参照変更

`grep` ベースで網羅: app.X = items の後、items を直接変更している箇所、
または items をリスキー関数（updateImgLoading/openImage/openImageAll/updateWrapperBM/updateFilterBM/updateWrapper）
に渡している箇所。

**結果**: 該当なし（全パス proxy 経由に修正済み）。

### Pattern B: テンプレートの bare グローバル参照

`location`/`document`/`navigator` を `window.` 接頭辞なしで参照している箇所。

**結果**: 該当なし（前回 `window.document` 化済み）。

### Pattern C: req_xxx フラグの set/unset 対応

req_favourite/req_reblog/req_pin/req_delete/req_vote/req_report/req_profile/req_follow/req_list/req_katsu
の `=true` と `=false` 出現回数。

**結果**: すべてペアが揃っている。`onSettled` か `XHR DONE branch`（timeout も含む）で
確実に false に戻る。

## 整備した検証スクリプト

| スクリプト | 用途 |
|---|---|
| `detail-wrapperbm-bug-verify.mjs` | 配列で渡すバグの再現確認（修正前を文書化） |
| `detail-wrapperbm-fix-verify.mjs` | 修正後の動作確認 |
| `updatewrapperbm-redundancy-verify.mjs` | updateWrapperBM 内の forceUpdate が冗長な証拠 |
| `equalarr-length-verify.mjs` | equalArr の長さ違いケースのバグ確認 |

## 次の作業候補（提案）

1. **equalArr の修正**: 長さチェックを追加するか、`Array.every` ベースに書き換え
2. **検索結果の `:key` 改善**: `searchs.accounts_ex` を `:key="issue.id"` へ
3. **updateWrapperBM 内の forceUpdate を削除**: 既に冗長と判明、ただし呼び出し元への影響を
   個別 E2E 検証してから

ただしいずれも実害が小さく、デプロイ済みのコードを変更するリスクと天秤にかけると、
**まとめて次の機会**にやるのが堅実。
