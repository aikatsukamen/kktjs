# iOS メディアアップロード 422 の根本原因（確定版）

## 結論

**`FormData.append("file", file, filename)` の第3引数（ファイル名）を「本物の File」に
対して指定していたことが原因。** WebKit(iOS Safari) ではこの場合 part の Content-Type が
失われ `application/octet-stream` になる。Mastodon(paperclip) はファイル名の拡張子から
期待される型と宣言 Content-Type の食い違いを Content-Type Spoof として検出し、
`422 バリデーションに失敗しました: File ...` を返していた。

修正: **本物の File は第3引数なしでそのまま append**（Mastodon Web UI の直接アップロードと
同一の multipart body）。canvas 由来の Blob は名前を持たないため従来どおり
`upload.<ext>` を補い、type が空なら image/jpeg を補完する。

## 決め手となった観察

| ケース | 送信内容 | 結果 |
|---|---|---|
| kirakiratter に直接アップロード | File、第3引数なし | 成功 |
| 画像・最大長辺1280（canvas を通らない） | **File + 第3引数** | 422 |
| 画像・最大長辺1048（canvas 経由） | Blob + 第3引数 | 成功 |
| 動画 .mov（canvas を通らない） | **File + 第3引数** | 422 |
| クリーン化画像を直接アップロード | File、第3引数なし | 成功 |

**動画が決定的だった**: 動画は canvas を一切通らないため、画像処理・メタデータの話が
一切絡まない。それでも 422 になり、直接アップロードなら成功する。差は FormData の
組み立てだけであり、第3引数以外に candidate が存在しない。

Blob のときに成功するのは、Blob には名前がなく第3引数の指定が仕様上必須で、
かつこの経路では type が保たれるため。

## 過去の誤った仮説（記録として）

当初は「iPhone の画像に含まれる Display P3 の ICC プロファイル、APP13(Photoshop IRB)、
EXIF などのメタデータを Mastodon 3.5.x が処理できない」と結論していた。
canvas 再エンコードで解決したこと、メタデータを除去した画像が通ったことが根拠だったが、
これは誤り。canvas を通すと副次的に **Blob 経路（第3引数が正しく働く経路）** になるため
成功していただけで、メタデータは無関係だった。

否定された根拠:
- 同一の元画像（Display P3 ICC・APP13 つき）を**直接アップロードすると成功する**
  → サーバは元画像を受理できる＝メタデータは 422 の原因ではない
- `file -b --mime` は元画像・クリーン画像とも `image/jpeg`（MIME 偽装ではない）
- ローカルの ImageMagick で Mastodon 相当の変換を再現しても元画像で成功する

## 補足: v1.12.5 で入れた「iOS では縮小不要でも canvas 正規化」について

本修正により本来は不要。ただし実機で動作実績があるため当面は残している。
残すと iOS では縮小不要な画像も再エンコードされ、わずかに画質が劣化する。
File 素通し修正が実機で確認できたら撤去してよい。

## 検証

- `formdata-realfile-verify.mjs`
  - 動画 File / 画像 File が **同一オブジェクトのまま** FormData に入る（第3引数なしの証拠）
    ことと、filename・Content-Type が保持されることを確認
  - canvas 由来 Blob には `upload.jpeg` と `image/jpeg` が付くことを確認
