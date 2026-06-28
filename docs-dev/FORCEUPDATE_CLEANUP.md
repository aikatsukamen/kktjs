# $forceUpdate クリーンアップ作業記録

Vue 2 時代の難読化コードに残っていた `$forceUpdate` の濫用を、安全に削減した記録。

## 成果

| 項目 | 値 |
|---|---|
| 元の `$forceUpdate` 呼び出し | 86 個 |
| 削除済み | **25 個（29%減）** |
| 残存 | 61 個（理由つきで残す判断） |
| 機能回帰 | **なし**（全12スイート PASS） |
| ホットパス（streaming）の forceUpdate | **0**（4→0 全削除） |

## 削除判断の基準

調査の過程で、`$forceUpdate` を安全に削除できるかの明確な基準を確立した。

### 削除可（reactivity で代替可能）

ユーザー操作直後の**同期的な reactive proxy への変更**:
- `app.X.forEach(...)` で reactive リストの要素を変更
- `app.homes.unshift(...)` 等の配列メソッド
- `status['x'] = value`（`status` がテンプレートから渡る proxy のとき）
- `account[opts.reqFlag] = true`、`arg0.req_xxx = true`
- `app.$data.X = value`（ネストプロパティも含む）

### 残す（reactivity では危険）

| パターン | 個数 | 理由 |
|---|---|---|
| 非同期コールバック内（onSuccess/onSettled/onError/XHR）| ~50 | API 応答待ちの間にタイムラインが refetch されると、キャプチャした proxy 参照が stale になる |
| 代入前の生配列を操作（`updateImgLoading` 等）| 数個 | reactivity の追跡対象外。直後の代入で reactive 化される設計 |
| 防御的な明示的強制描画（`refreshCount`, `kktjsForceReconnectAll`）| 数個 | 呼び出し元の「念のため」の意図を保持 |
| 引数 `data` 経由で呼び出し元次第（`updateWrapperBM` 等）| 数個 | 呼び出し元が生オブジェクトを渡すケースがあり、削除しても効果が薄い |

### 重要な洞察

**関数の `$forceUpdate` が同期か非同期かは、その関数がどこから呼ばれるかに依存する**。
例えば `propagateStatusField`（fav/reblog 伝播）は一見同期に見えるが、`actFav`/`actReblog`
の `onDone` から呼ばれるため非同期コンテキスト → 残す判断とした。

## 削除した 25 個の一覧

### display-wrappers.ts（5 個）
- `updateMediaWrapper` / `updateContentWrapper`: SHOW MORE/LESS、メディア眼隠し開閉
- `updateWrapper`: 単一 status の caught_katsufilter（カツフィルタ表示切替）
- `updateWrapperAll`: 全カラム一括開閉
- `updateFilterAll`: NGワード/正規表現フィルタ
- `updateVote`: 投票結果の全カラム伝播

### streaming.ts（4 個、ホットパス）
- home / notif / local / multi の `unshift` 直後

### status-actions.ts（3 個）
- `actToggle` の `req_xxx = true`（fav/reblog/bookmark 等のスピナー表示）
- `actPin` / `actUnPin` の `req_pin = true`
- `actDelete` の `req_delete = true`

### posting-actions.ts（5 個）
- `actVote` の `req_vote = true`
- `actReport` の `req_report = true` + `showConfirm = false`
- `runProfile` の `acct.req_profile = true`
- `runStreamProfile` の `stream_list.req_profile = true`
- `runKatsu` の `req_katsu = true`
- `runSearchHashtag` の `fetch_lock.search_hashtag = true`

### account-actions.ts（2 個）
- `runRelationAction` の `account[reqFlag] = true`
- `runFollowAuth` の `req_follow = true`

### list-actions.ts（1 個）
- `runListAction` の `req_list = true`

### run-actions.ts（2 個）
- `runListCreate` / `runListDelete` の `fetch_lock.lists = true`

## 性能改善

`burst-perf-verify.mjs` で測定:
- ストリーミングで投稿が連続到着する状況（unshift × 20）
- **500件タイムライン: 115ms/更新 → 81ms/更新（約30%改善）**
- streaming の forceUpdate が0になったことで、実コードでは reactivity-only（11ms/更新相当）に
  近づき、フレーム落ちの懸念がほぼ解消された

## 整備した検証ハーネス（docs-dev/verify/）

| スクリプト | 用途 |
|---|---|
| `refactor-safety-verify.mjs` | $forceUpdate を no-op 化して reactivity だけで更新されるかを判定 |
| `wrapper-toggle-verify.mjs` | 本文・メディア開閉の実クリック E2E |
| `group-a-spinner-verify.mjs` | req フラグのスピナー表示 reactivity 検証 |
| `group-b-verify.mjs` | updateVote/Filter/WrapperAll の動作検証 |
| `group-c-nested-verify.mjs` | ネストした proxy 変更（poll.choices）の検証 |
| `streaming-unshift-verify.mjs` | streaming 新着投稿 + アバター表示の検証 |
| `refetch-avatar-verify.mjs` | 再接続後アバター消失バグの予防 |

## 今後の方針

残 61 個のうち、安全に削除できる候補は**ほぼ尽きている**。さらに削減するには:

1. **非同期コールバック内 `$forceUpdate` の削除**: refetch の挙動を改めて精査し、proxy 参照が
   常に有効であることを実証できれば削除可能。ただし refetch のタイミングが交錯するエッジ
   ケースを完全網羅するのは困難で、削除した場合の退行リスクが残存リスクを上回るか慎重判断が
   必要
2. **`updateWrapperBM` の引数経由 `forceUpdate`**: 呼び出し元のコードを整理して、proxy を
   渡す呼び出しと生を渡す呼び出しを分離する大きなリファクタリング

これらは別タスクとして、本作業の検証ハーネスを土台に進めるのが堅実。
