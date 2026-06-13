# 画像縮小機能の環境差・既知の制限

設定画面の「Media: 添付画像の縮小」（`optMaxImageLen`）で有効化する画像縮小機能について、
ブラウザ・OS による挙動差と、対応済み事項・未対応事項をまとめる。

## 実装の堅牢化（対応済み）

ブラウザ既定値の差や仕様未定義の挙動による不安定さを抑えるため、`checkActMedia` の
canvas 変換パスに以下を入れている（`src/app/posting-actions.ts`）:

| # | 対応 | 理由 |
|---|---|---|
| 1 | `toDataURL('image/jpeg', 0.85)` — **品質を明示** | 既定値が Chrome=0.92 / Safari=0.8 / Firefox=0.92 と差があり、ファイルサイズと圧縮品質が予測不能だった |
| 2 | `drawImage` 前に **白背景を fillRect** | PNG/WebP の透過部分が JPEG 化されたとき、ブラウザによって黒/未定義の色になる仕様未定義の挙動を回避 |
| 3 | `naturalWidth`/`naturalHeight` のゼロ・非有限値 **入力検証** | Image load 失敗の残骸で resizeScale が NaN/Infinity になり canvas 寸法が壊れるのを防ぐ |
| 4 | `try/catch` で canvas/toDataURL の例外 + **`action_lock` の明示的解除** | 一度の失敗でアプリ全体が「次のアップロード」を受け付けない状態になるのを防ぐ |
| 5 | `image.onerror` ハンドラ追加 | 破損画像・読込失敗時に**縮小せず元ファイルでアップロード**にフォールバック |
| 6 | キャンバス寸法を `Math.max(1, Math.round(...))` で正規化 | スケール後にゼロや小数で canvas を壊さない |

これらは自動テスト `/tmp/pwtest/image-downscale-robust.mjs`（7シナリオ）で検証済み。

## ブラウザ別の既知の制限

### iOS Safari

- **Canvas の最大サイズ制限**: 古い iOS（〜13）は 5 MP（約 2289×2289）、現行は 16 MP 程度。
  これを超える入力画像は `<img>` 読込時 or `drawImage` 時にエラー（透明な白画像になる場合あり）。
  対応: `image.onerror` で検知 → 縮小せず元ファイルで送信にフォールバック（上記 #5）。
- **HEIC / HEIF**: iPhone の既定撮影形式。**[heic2any](https://github.com/alexcorvi/heic2any)
  を動的 import して JPEG に変換**してから既存パイプラインに乗せる対応を入れた（後述
  「HEIC / HEIF（対応済み）」セクション参照）。
- **`File.slice()` / 大きな File 読み込みのメモリ圧迫**: 4032×3024（12 MP、iPhone 標準）
  を FileReader で data URI 化するとメモリを大量に使う。タブが再読み込みされる可能性。
  対応: 将来 `createImageBitmap()` ベースに移行すれば軽量化できる（要 Safari 15+）。

### Android Chrome / WebView

- 上記 Canvas サイズ制限はデスクトップ Chrome と同等で実害は出にくい。
- 古い WebView（Android 7 以前）は `toDataURL('image/jpeg', quality)` の quality 引数を
  無視する個体がある。対応: 既定値も妥当範囲（0.92 程度）なので致命的ではない。

### Firefox / Safari (macOS)

- 主要な API（`<canvas>`, `toDataURL`, `FileReader`）はすべて標準。
- ただし **EXIF Orientation** の扱いはブラウザ間で差がある（後述）。

### Chromium ベース（Chrome / Edge / Opera など）

- 動作はほぼ均一。本テストハーネスがカバーしている範囲。

## 未対応事項（既存仕様維持）

### EXIF Orientation

iPhone で**縦に撮影した写真**は、ピクセルデータは横向きで保存され、EXIF タグ
「Orientation = 6 (rotate 90° CW)」で表示時に回転させる仕組み。

- ブラウザ別挙動:
  - Chrome 81+, Safari 13.1+, Firefox 77+ は `<img>` 表示時に EXIF を尊重する
  - **`canvas.drawImage(image)` の挙動はブラウザ間で差**があり、EXIF を反映する/しない が混在
  - 検証環境の Chromium（1194 系）では `new Image()` の `naturalWidth/Height` が
    既に EXIF 反映後の寸法を返し、`drawImage` も正立後のピクセルを描く（縦撮影写真は正しく縦長になる）
- 結果: **古い**ブラウザや EXIF を反映しない実装では、縮小すると横向きの画像が送信される可能性が残る

#### 投稿前プレビューで気づけるか（重要）

**気づける。** 投稿フォームのプレビュー（`index.html` の `media-wrapper` 内 `<img :src="media.url">`）
が表示する画像は、**実際にアップロードされる画像と同一ソース**であることをコードで確認済み
（`src/app/posting-actions.ts` の `actMedia(url, blob, converted)`）:

- **縮小・変換あり**: `actMedia(m.MediaBinary, m.MediaBlob, true)` —
  プレビュー url（`MediaBinary`）とアップロード blob（`MediaBlob`）は**同一の canvas 出力**から生成
- **そのまま送信**: `actMedia(m.fileReader.result, m.mediaFile, false)` —
  プレビュー url とアップロードファイルは**同一の元データ**

したがって、もし EXIF 起因で向きが変わるブラウザがあったとしても、その**変化はプレビューにも
そのまま反映される**。プレビューと投稿結果が食い違うことはない（WYSIWYG）。ユーザーは投稿前に
プレビュー（およびタップで開く拡大モーダル）で向きを確認でき、おかしければ Remove して撮り直し
／別画像に差し替えられる。

これは実ブラウザテストでも確認済み（`docs-dev/verify/exif-preview-verify.mjs`）。EXIF Orientation=6
の JPEG を投入し、(Q1) ブラウザネイティブ表示の向き と (Q3) プレビュー url の画像の向き を比較
→ Chromium では両者が一致（どちらも正立）し、プレビューが変換後の実体を見せていることを確認した。

**残る注意点**: 「プレビューで気づける」ことと「自動で正しい向きにする」ことは別問題。
EXIF を反映しない環境では、プレビュー上でも回転した状態で見えるため、ユーザーが手動で
気づいて対処する必要がある。自動正規化までやるなら下記の回避策が必要。

**回避策（将来・自動正規化したい場合）**: `createImageBitmap(blob, { imageOrientation: 'from-image' })`
で正規化してから drawImage する。Safari 15+ で対応、それ以前は polyfill が必要。
影響範囲が広いので別タスクで対応する。

### HEIC / HEIF（**対応済み**）

iPhone の既定撮影形式。**[heic2any](https://github.com/alexcorvi/heic2any) を動的 import で
取り込み、JPEG に変換してから既存パイプラインに乗せる**ようにした（`src/app/posting-actions.ts`
の `maybeConvertHeic`）。

- 検出条件: `File.type` が `image/heic` / `image/heif` のいずれか **または** ファイル名拡張子が
  `.heic` / `.heif`（iOS Safari の Files アプリから添付すると `File.type` が空のことがあるため
  拡張子フォールバックが必須）
- 変換後の処理: `image/jpeg` File（`.heic` → `.jpg` にリネーム）として既存の `checkActMedia` 続行
  パスに流すので、`optMaxImageLen` の縮小も自動的に適用される
- HEIC sequence（ライブフォト等）: 先頭フレームのみ使用
- 変換中: `result_text` に「[Media] HEIC → JPEG に変換しています…」を表示
- 変換失敗時: 元 File を返し、既存の `UnSupport Media` フローでエラー表示
- **バンドルへの影響**: heic2any は ~1.35 MB（gzip 341 KB）と大きいが、**動的 `import()`** で
  HEIC ファイル投入時のみ取得される別チャンク（`assets/heic2any-*.js`）。通常使用時のメイン
  バンドルには含まれない

実 HEIC ファイル（libheif サンプル 718 KB）を用いた E2E テストで動作確認済み
（`/tmp/pwtest/heic-convert-verify.mjs`）:
- 実 HEIC → JPEG 変換成功（実出力: 58 KB）
- `optMaxImageLen=512` 指定時、HEIC → JPEG → 512px 縮小まで一連で動作
- `File.type=""` + 拡張子 `.heic` のケースも検出
- 非 HEIC（PNG）投入時は heic2any チャンクが**読み込まれない**ことを確認

### 同時複数アップロード

`__kktjsMedia` がシングルトンのため、複数ファイルを同時に処理できない。
現状は `action_lock` で逐次化されている（既存仕様）。

## 実機での確認推奨事項

自動テストでカバーできない範囲。リリース前に実機で確認すべき:

1. **iPhone Safari** で:
   - 縦撮影写真の縮小後の向き（EXIF 問題）
   - 12 MP（4032×3024）級の写真でメモリ枯渇しないか
   - HEIC 形式の写真が JPEG に正しく変換され、アップロードできるか
2. **Android Chrome** で:
   - 縦撮影写真の向き
   - 大きい画像（4K 級）で動作するか
3. **PC Firefox** で:
   - 透過 PNG の白背景化が効いているか
   - JPEG 品質が指定通り（0.85）か（出力ファイルサイズで判断）
4. **PC Safari (macOS)** で:
   - 上記 Firefox と同様

## 自動テスト

`/tmp/pwtest/image-downscale-robust.mjs` で以下を検証（Chromium 環境）:

- (A) JPEG 品質明示で出力サイズが安定
- (B) 透過 PNG が JPEG 化されると **白背景**（黒にならない）
- (C) 横長 / 縦長 / 正方形の長辺判定
- (D) プリセット値 4096 / 2048 / 1280 / 1024
- (E) 小さい画像の素通し（無駄な再エンコードなし）
- (F) GIF / 動画は対象外（既存仕様）
- (G) 破損画像でも `action_lock` を残さずフォールバック

実行: `node /tmp/pwtest/image-downscale-robust.mjs /path/to/docs`

## 参考

- 現実装: `src/app/posting-actions.ts` の `checkActMedia`
- 設定 UI: `index.html` の「Media: 添付画像の縮小」セクション
- データ: `optMaxImageLen`（数値、px、0=無効）
- 保存先: localStorage の `conf_std` JSON 内の `maximagelen` キー
