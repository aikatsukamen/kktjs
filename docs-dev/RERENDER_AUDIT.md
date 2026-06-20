# reactivity / 再描画パフォーマンス 監査レポート

デプロイ前の予防的調査として、これまでのバグ（全アバター消失、設定ボタン無反応、更新バナー
無反応 等）と同種の問題が他に潜んでいないか、および無駄な再描画が無いかを体系的に監査した。

結論を先に: **致命的な同種バグの残存は検出されず、再描画も実用上は健全**。ただし `$forceUpdate`
への広範な依存という構造的な改善余地があり、その定量データと方針を記録する。

## 過去バグの分類（根本原因）

これまでのバグはすべて Vue 2→3 移行に起因し、2系統に分類できる:

| 系統 | 症状 | 根本原因 | 修正済み箇所 |
|---|---|---|---|
| A. reactivity 不達 | アバター消失、最新1件のアイコンが空 | Vue 3 の reactive proxy では、配列に入れた**生オブジェクトの直接変更**が DOM に反映されない | streaming.ts の unshift 4 箇所、refetch-actions.ts の openImageAll 3 箇所 |
| B. テンプレートスコープ | 設定ボタン/更新バナー無反応 | Vue 3 はテンプレート式を `_ctx`（コンポーネント）スコープで解決。bare な `location`/`document` が undefined に | toggleSideLink、bare `location.reload`→`reloadForce`、bare `document`→`window.document` |

## 監査結果

### 系統 A（reactivity 不達）— 残存なし

実ブラウザでの reactivity 監査（`reactivity-audit-verify.mjs`）で確認:
- **proxy 経由の変更**（`app.homes[i].xxx = ...`）→ `$forceUpdate` 無しでも DOM に反映される ✓
- **生参照の変更**（配列代入後に raw オブジェクトを変更）→ 反映されない（これがバグの根本パターン）

静的監査で「配列代入後に生参照を変更/受け渡しする」箇所を全て洗い出した:
- `openImage` / `openImageAll` の全呼び出し（streaming 4 + refetch 3）→ **すべて proxy 経由に修正済み**
- `updateImgLoading`（3 箇所）→ 配列代入の**前**に生配列へ `loading_avatar=true` をセット。
  代入で reactive 化されるため正しい（これは問題なし）
- notif の refetch → `updateImgLoading`/`openImageAll` を呼ばない（通知アバターは loading_avatar を
  使わない）ため、同バグの経路自体が無い

→ **アバター/ローディング系の生参照変更バグは全経路で塞がれている。**

### 系統 B（テンプレートスコープ）— 残存なし

`index.html` の全テンプレート式（`v-on:*` と `:*` バインディング）を grep 監査:
- bare な `location` / `document` / `navigator` / `console` 等の参照 → **ゼロ**
  （前回修正で `window.document` 化済み。`window.` 接頭辞はグローバル解決されるので安全）
- native 属性（`onError="this.src=IMG_DUMMY"` 等、大文字 on*）から参照されるグローバル
  （`IMG_DUMMY`, `importpaste`, `importdrop`, `importclick`, `changeAppActive` ほか計7個）
  → すべて `window.*` に公開済みであることを確認

→ **テンプレートスコープ起因の「押しても無反応」系バグの残存は検出されず。**

## 再描画パフォーマンス

### 計測 1: DOM 差分は効率的（`rerender-perf-verify.mjs`）

100 件のタイムラインで各操作時に実際に書き換わった DOM ノード数を MutationObserver で計測:

| 操作 | DOM 変更 | 評価 |
|---|---|---|
| 新規 1 件 unshift | +3 ノードのみ | ✓ 既存 100 件は触らない |
| `$forceUpdate` のみ（データ変更なし） | **0** | ✓ Vue の差分が効いている |
| お気に入りトグル | +1 / −1 | ✓ 1 件だけ |
| 未読カウンタ変更 | +1 / −1 | ✓ リスト再構築されない |

`:key="issue.id"` が正しく機能し、**実 DOM 操作は最小限**。これは健全。

### 計測 2: $forceUpdate の CPU コスト（`burst-perf-verify.mjs`）

20 連続 unshift（ストリーミングのバースト）での1更新あたり時間:

| タイムライン長 | $forceUpdate あり（現状） | reactivity のみ |
|---|---|---|
| 50 | 16.6 ms | — |
| 200 | 45.6 ms | **22.4 ms（約半分）** |
| 500 | 115 ms（フレーム落ち） | — |

- `$forceUpdate` は reactivity のみの**約 2 倍のコスト**（仮想 DOM 全体を再計算するため）
- ただし**タイムラインは `LIMIT = 40` 件で上限管理**されている（streaming.ts の
  `homes.splice(LIMIT-1)`）。実運用の最悪ケースは ~40 件 = 1 更新あたり ~16ms 程度で、
  実用上は許容範囲

→ 大規模タイムラインでの問題は LIMIT により予防済み。致命的な無駄再描画は無い。

## 改善余地（リスクと判断）

### $forceUpdate（コード全体で 86 箇所）

元の難読化コード（Vue 2 時代）の「とにかく描画を強制する」スタイルの名残。reactivity が
正しく機能している今、理論上は大半が不要。ただし:

- **闇雲な削除は危険**: 系統 A のように reactivity が伝わらない箇所を `$forceUpdate` が
  補っているケースがあり、削除すると「再接続後に表示が戻らない」類の退行を生む
- 実 DOM 差分は効率的（計測 1）で、タイムライン長も抑制済み（LIMIT=40）のため、
  **現状の体感パフォーマンスへの影響は限定的**

**判断**: デプロイ前の今、広範な `$forceUpdate` 削除は退行リスクが効果を上回る。個別の
ホットパス（ストリーミング受信）について、reactivity だけで正しく描画されることを
ケースごとに実証してから1つずつ外す、という**段階的アプローチを別タスク**とすべき。
本監査では「安全に外せること」の確認手段（`reactivity-audit-verify.mjs`）を整備した。

### updateXxx 内 + 呼び出し側の二重 forceUpdate

`display-wrappers.ts` の `updateVote` 等は内部で `$forceUpdate` を呼ぶ。呼び出し側でも
呼ぶと二重再描画になるが、これらは低頻度操作（投票・ブックマーク等）で実害は小さい。

## 検証スクリプト（docs-dev/verify/）

- `reactivity-audit-verify.mjs` — reactivity が proxy 経由で反映され、生参照では反映されない
  ことを実証（系統 A の安全確認に使う）
- `rerender-perf-verify.mjs` — 各操作の実 DOM 変更数を計測（差分効率の確認）
- `burst-perf-verify.mjs` — 連続 unshift の CPU コストを計測（$forceUpdate のコスト定量化）

## まとめ

- **同種バグ（系統 A / B）の残存は検出されなかった** — 既知の経路はすべて修正済みで、
  静的・動的の両監査で確認した
- **再描画は実用上健全** — DOM 差分は最小限、タイムライン長も上限管理済み
- **構造的改善余地**（86 箇所の `$forceUpdate`）はあるが、退行リスクを考慮し段階的対応を推奨。
  安全に進めるための計測・監査スクリプトを整備した
