// 拡大表示した画像/動画の保存。
// 拡大表示はタップで閉じる作りで長押し保存メニューが出にくいため、保存アイコンを置く。
// 保存方式は環境に応じて段階的に選ぶ:
//  1) iOS Safari 等 files 共有対応環境では Web Share API でネイティブ保存シート
//  2) それ以外は blob を取得して <a download> でダウンロード
//  3) 失敗(CORS等)時は別タブで開いて手動保存に委ねる

import type { MediaAttachment, MediaType } from '../types/mastodon';

function pickUrl(media: Partial<MediaAttachment> | null): string {
  if (!media) return '';
  // フル解像度を優先（remote_url → url）。
  if (media.remote_url) return media.remote_url;
  if (media.url) return media.url;
  if (media.preview_url) return media.preview_url;
  return '';
}

function fileNameFromUrl(url: string, fallbackType?: MediaType): string {
  try {
    const clean = url.split('?')[0].split('#')[0];
    const base = clean.substring(clean.lastIndexOf('/') + 1);
    if (base && base.indexOf('.') !== -1) return base;
  } catch {
    /* noop */
  }
  const ext = fallbackType === 'video' || fallbackType === 'gifv' ? 'mp4' : 'jpg';
  return 'kktjs_media_' + Date.now() + '.' + ext;
}

// blob.type が空のとき、拡張子やメディアtypeから MIME を推定する。
// iOS の共有シートで「ビデオを保存/画像を保存」が正しく出るようにするため。
function guessMimeType(blobType: string, filename: string, mediaType?: MediaType): string {
  if (blobType) return blobType;
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime',
    webm: 'video/webm', ogv: 'video/ogg',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp',
  };
  if (map[ext]) return map[ext];
  if (mediaType === 'video' || mediaType === 'gifv') return 'video/mp4';
  return 'image/jpeg';
}

function openInNewTab(url: string): void {
  try { window.open(url, '_blank', 'noopener'); } catch { /* noop */ }
}

// URL を直接 <a download> でダウンロード試行（同一オリジンや download 許可時に有効）。
// クロスオリジンで download 属性が無視される場合に備え、最終手段の前に試す。
function downloadByAnchor(url: string, filename: string): boolean {
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.target = '_self';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    return false;
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
}

export function saveMedia(media: Partial<MediaAttachment> | null): void {
  const url = pickUrl(media);
  if (!url) return;
  const filename = fileNameFromUrl(url, media?.type);

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data?: ShareData) => Promise<void>;
  };
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  let fellBack = false;
  // CORS 等で画像バイトを読めない場合の最終手段。
  //  モバイル: share({url}) は blob 不要のため CORS 非依存で動く（OS の共有シート→
  //           「画像を保存」や他アプリ送りが可能）。非対応なら別タブで開いて長押し保存。
  //  PC      : 別タブ（同タブ）で画像を開けば右クリックで保存できる。
  const fallback = () => {
    if (fellBack) return;
    fellBack = true;
    if (isMobile && typeof nav.share === 'function') {
      nav.share({ url }).catch(() => {
        if (!downloadByAnchor(url, filename)) openInNewTab(url);
      });
      return;
    }
    if (!downloadByAnchor(url, filename)) openInNewTab(url);
  };

  fetch(url, { mode: 'cors', credentials: 'omit' })
    .then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.blob();
    })
    .then((blob) => {
      const mime = guessMimeType(blob.type, filename, media?.type);

      // 1) モバイルで files 共有可能なら Web Share API（ネイティブ保存シート）。
      //    ※ ここに来るのは CORS が通って blob を読めた場合のみ。
      if (isMobile && nav.canShare && typeof File !== 'undefined') {
        try {
          const file = new File([blob], filename, { type: mime });
          if (nav.canShare({ files: [file] })) {
            nav.share!({ files: [file] }).catch(() => {
              try { downloadBlob(blob, filename); } catch { fallback(); }
            });
            return;
          }
        } catch {
          /* 次の手段へ */
        }
      }

      // 2) 保存ダイアログ（blob を <a download> で保存。PC で確実）
      try {
        downloadBlob(blob, filename);
      } catch {
        fallback();
      }
    })
    .catch(fallback); // 3) 取得失敗（CORS等）→ モバイルは share(url)、PCは別タブ
}
