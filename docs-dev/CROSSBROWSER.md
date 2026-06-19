# クロスブラウザ対応状況（paste / drop / clipboard 周り）

画像の貼り付け（paste）・ドラッグ&ドロップ（drop）・クリップボード処理は、OS とブラウザに
よる挙動差が大きい領域。ここでは対応済みの堅牢化と、自動テストでカバーできない実機確認項目を
まとめる。

## 検証環境の制約（重要）

この開発コンテナには **Chromium のバイナリしか無く**、WebKit（Safari エンジン）と Firefox の
バイナリはネットワーク制限でダウンロードできない。そのため:

- **自動テストは Chromium 上でのみ実行**している
- WebKit / Firefox 特有の挙動は、Chromium 上で**イベント形状をシミュレート**して間接的に検証
  （`clipboardData` 不在、`files` 空、`dataTransfer` 不在 などの異常系を合成イベントで再現）
- 実 Safari / 実 Firefox の確定的な動作確認は**実機で行う必要がある**

## 対応済みの堅牢化

`src/legacy/app-core.ts` の `importpaste` / `importdrop`:

| 項目 | 内容 | 効果 |
|---|---|---|
| `clipboardData` の null ガード | `_0xb7cd91['clipboardData']` が無くても落ちない | 一部 Android / 古いブラウザで paste 時に TypeError → テキスト貼り付けすら壊れるのを防止 |
| `clipboardData.files` の null ガード | `files` が無ければ「画像なし」として通常のテキスト貼り付けに委譲 | 同上 |
| `dataTransfer` / `files` の null ガード（drop） | drop でも同様に安全化 | drop 時のクラッシュ防止 |
| `preventDefault` の存在＋型チェック | `typeof === 'function'` を確認してから呼ぶ | 合成イベント・特殊環境での TypeError 防止 |
| 画像 paste 時のみ `preventDefault` | 画像ファイルがあると確定した後にのみ呼ぶ | テキストのみ paste（純テキスト貼り付け）には影響させない |

自動テスト: `docs-dev/verify/paste-drop-crossbrowser-verify.mjs`（7 ケース、Chromium 上で
各ブラウザのイベント形状をシミュレート）。

## ブラウザ別の既知の差と注意

### PC Chrome / Edge / Firefox

- 画像をコピー → paste で `clipboardData.files` に画像が入る。本実装でアップロード + テキスト
  貼り付け抑制が効く（意図どおり）。
- ドラッグ&ドロップは `dataTransfer.files` 経由で従来どおり。

### iOS Safari

- 写真アプリ / 他アプリからの貼り付けで `clipboardData.files` に入るケースを確認（報告ベース）。
- `File.type` が空のことがある（HEIC など）→ 別途 `maybeConvertHeic` で拡張子フォールバック対応済み。
- **paste の `preventDefault` が効くか**は WebKit のバージョン依存。効かない場合でも「テキストが
  一緒に貼られる」旧挙動に戻るだけで、クラッシュはしない。

### Android Chrome / WebView

- クリップボード API の実装差が大きい。`clipboardData` が `undefined` のケースや、画像が
  `items` 経由でしか取れず `files` が空のケースがある。
- 本実装は `files` が取れなければ「画像なし」として安全に離脱する（クラッシュしない）。
  ただし **`items` 経由でしか画像が来ない端末では、paste 画像アップロードが効かない**可能性が
  残る（その場合はドラッグ&ドロップやファイル選択ボタンで代替可能）。
- `items` 経由の画像取得対応は挙動変更の影響が大きいため、本タスクでは未対応（下記参照）。

## 実機で確認すべき項目（自動テスト外）

リリース前に、可能なら以下を実機で確認:

1. **PC Chrome / Firefox / Edge**:
   - スクリーンショットをコピー → 投稿欄に paste → 画像がアップロードされ、テキストは
     貼られないこと
   - 純粋なテキストの paste は従来どおり貼られること
   - 画像ファイルをドラッグ&ドロップ → アップロードされること
2. **iOS Safari**:
   - 写真/画像を paste → アップロードされ、テキスト（URL 等）が同時に貼られないこと
   - HEIC 画像の paste → JPEG 変換 + アップロード
3. **Android Chrome**:
   - 画像 paste がアップロードにつながるか（端末により `items` 経由だと効かない可能性）
   - 効かない場合でも、テキスト paste やファイル選択は正常に動くこと（クラッシュしないこと）

## 今後の改善候補（別タスク）

- **`clipboardData.items` / `DataTransferItemList` 経由の画像取得**: `files` が空でも
  `items` から `getAsFile()` で画像を拾えるブラウザがある。Android Chrome の一部や
  特定のコピー元で有効。ただし重複取得（files と items 両方に入る環境）や非同期取得の
  考慮が必要なため、慎重な設計と実機テストを伴う別タスクとする。
- **`navigator.clipboard.read()`（非同期 Clipboard API）**: より新しい API。権限プロンプトや
  セキュアコンテキスト要件があり、こちらも別途検討。
