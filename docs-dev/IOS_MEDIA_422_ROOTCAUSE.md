# iOS 画像アップロード 422 エラーの根本原因分析

## 症状

iPhone で撮影/編集した画像を kktjs から投稿しようとすると、メディア添付の段階で
Mastodon サーバが `422: バリデーションに失敗しました: File...` を返し、添付に失敗する。

決定的な切り分け:
- 問題画像: 1206×349 の横長スクショ（iPhone でスクショ → 写真アプリでトリミング編集）
- kktjs 設定「最大長辺(px)」が **1280 → 422 エラー**、**1048 → 成功**
- クリーン化した画像（メタデータ全除去）を Mastodon に直接アップロード → 成功

## 根本原因

### 1. 問題画像の非標準な JPEG マーカー構造

iPhone の写真アプリでトリミング編集すると、iOS が JPEG に以下のメタデータマーカーを
書き込む。実際の問題画像のマーカー順序:

```
APP0(JFIF) → APP1(EXIF, 246B) → APP13(Photoshop IRB, 56B) → APP2(ICC, 552B) → SOF0 ...
```

特に **APP13 (0xED, Photoshop Image Resource Block)** が含まれる点が特異。
中身を解析すると:
- 識別子: `Photoshop 3.0\0`
- 8BIM リソースブロック: リソースID `0x0404`(IPTC-NAA)、`0x0425`(caption digest)

これは iOS の写真編集が付与する Photoshop 互換の IPTC メタデータ。
さらにマーカー順序も変則的（通常は APP0→APP1→APP2 の昇順だが、APP2(ICC) が
APP13 より後ろに来ている）。

#### ICC プロファイルの矛盾（追加調査で判明）

APP2 に入っている ICC プロファイル（536 bytes）を抽出して解析すると:
- `icc:description`: **Display P3**
- `icc:copyright`: `Copyright Apple Inc., 2022`
- color space: `RGB`（広色域）、device class: `mntr`(monitor)、version 4.0

一方、実ピクセルデータは **完全なグレースケール**（1000 サンプルすべて R=G=B、
ImageMagick の判定も `Type: Grayscale`）。

つまり「広色域 RGB の Display P3 プロファイル」と「グレースケール実データ」という
**色空間の矛盾**を抱えた JPEG になっている。Mastodon 3.5.x 世代の ImageMagick は、
この Display P3（当時としては新しい）×グレースケールの組合せの色空間変換で
失敗しやすい。これが APP13 の変則性と並ぶ、あるいはそれ以上に有力な 422 の直接要因。

（`file -b --mime` は元/クリーン両方 `image/jpeg` を返すため、いわゆる Content-Type
Spoof ではなく、画像処理・色空間変換の段階での失敗であることも確認済み。）

### 2. kirakiratter が Mastodon 3.5.10 である

kirakiratter.com は Mastodon **v3.5.10** で稼働（v4.x へのアップグレードは
「より大きな変更が必要なため後日評価」とアナウンスされている、2024時点）。

Mastodon 3.5.x 時代の画像処理は **kt-paperclip + ImageMagick** ベース
（後のバージョンで libvips に移行）。この経路には、iOS が生成する APP13 マーカーや
変則的なマーカー順序を含む JPEG に対し、content-type spoof 検出や画像処理で
失敗する既知の弱点があった。

Mastodon の関連実装:
- `app/models/concerns/attachmentable.rb`: content type correction を `file` コマンドで実施
- paperclip の content-type spoof 検出: ヘッダー/拡張子の MIME と `file` コマンド判定の
  食い違い、または画像処理エンジンが「壊れている」と判断したファイルを 422 で拒否
- 典型的なエラー文言: "File content type is invalid" /
  "File has contents that are not what they are reported to be"

### 3. なぜ canvas 再エンコードで解決するか

ブラウザの `canvas.toBlob('image/jpeg', q)` は、デコードした**ピクセルデータのみ**から
JPEG を再生成する。結果、APP13/EXIF/ICC などの全メタデータマーカーが除去され、
標準的な `APP0(JFIF) → DQT → SOF0 → ...` 構造のクリーンな JPEG になる。
これを paperclip が問題なく受理する。

検証（このリポジトリの調査で確認）:
- 元画像マーカー: `APP0, APP1(EXIF), APP13(Photoshop), APP2(ICC), SOF0, ...`
- クリーン画像マーカー: `APP0(JFIF), DQT, SOF0, ...`（APP系メタ全除去）
- 先頭マーカー: 元も `ffd8ffe0`（JFIF）だが、その後に問題のメタ群が続いていた

### 4. なぜ「最大長辺 1280 で失敗、1048 で成功」だったか

問題画像の長辺は 1206px。kktjs の resizeScale 計算:
```
longSide(1206) > optMaxImageLen ? 縮小 : 等倍
```
- **最大長辺 1280**: `1206 < 1280` なので「縮小不要」→ **元ファイル（APP13付き）をそのまま送信** → 422
- **最大長辺 1048**: `1206 > 1048` なので縮小発生 → **canvas を経由してメタデータ除去** → 成功

「canvas を通るか通らないか」が成否の分岐点だった。

## 対策（実装済み: v1.12.5）

`src/app/posting-actions.ts` の `checkActMedia` に、iOS 判定時は縮小不要でも
canvas 正規化を通すロジックを追加済み:

```ts
const isIOS = /iP(hone|ad|od)/.test(navigator.platform) || ...;
const needsCanvasNormalize = isIOS && (m.fileType == 'img' || m.fileType == 'img_ex');
if (m.fileType != "img_ex" && m.resizeScale == 1 && !needsCanvasNormalize) {
    // 非iOS かつ縮小不要 → 元ファイルをそのまま送る（無駄な再エンコード回避）
    a.actMedia(m.fileReader.result, m.mediaFile, false);
    return;
}
// iOS または縮小あり → canvas 経由で再エンコード（メタデータ除去）
```

等倍再エンコード時は JPEG 品質を 0.92 に上げて劣化を最小化（`jpegQuality = resizeScale==1 ? 0.92 : 0.85`）。

この修正により、iOS のトリミング済み画像（APP13 等の問題メタデータ付き）でも、
kktjs 側で canvas 再エンコードによりクリーンな JPEG に正規化してから送るため、
Mastodon 3.5.x の paperclip バリデーションを通過できる。

## 補足: 恒久的な別解

- kirakiratter が Mastodon 4.x（libvips ベース）にアップグレードすれば、
  サーバ側でこの種のメタデータをより頑健に処理できる可能性が高い（ただしサーバ管理者マター）
- kktjs 側の対策（canvas 正規化）はサーババージョンに依存せず有効なので、
  クライアント側で完結する対策として妥当。

## この分析で使った検証手段

- JPEG マーカー構造のパース（APP セグメントの列挙、SOF からの寸法読み取り）
- `file -b --mime` による MIME 判定（元/クリーン両方 image/jpeg で、MIME 偽装ではないと確認）
- ImageMagick `identify -verbose`（元画像も正常に読めるため、現行 IM では再現しないと確認）
- Mastodon の GLOBAL_CONVERT_OPTIONS 相当（`-quality 90 +profile '!icc,*' ...`）の再現
- 各 APP マーカーを個別除去したバリアントの生成と検証
- APP13 ペイロードの解析（Photoshop 3.0 / 8BIM / IPTC-NAA を確認）
- kirakiratter の Mastodon バージョン（3.5.10）の確認
