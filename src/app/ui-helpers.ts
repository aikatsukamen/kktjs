// 小さな UI/エディタ補助（legacy から移行）。いずれも自己完結的で副作用が局所的。

import type { KktjsApp } from '../types/kktjs-app';
import type { MediaAttachment } from '../types/mastodon';

// サロゲートペア（絵文字等）を1文字として数えるため、ペア数を引く。
function countText(value: string): number {
  return value.length - (value.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || []).length;
}

/** スポイラー入力の文字数（サロゲートペア補正）。元 spoilerLength */
export function spoilerLength(): number {
  const el = document.getElementById('katsu_spoiler') as HTMLInputElement | null;
  if (el == null) return 0;
  return countText(el.value);
}

/** 本文入力の文字数（先頭 # は +1 補正、サロゲートペア補正）。元 contentLength */
export function contentLength(): number {
  const el = document.getElementById('katsu_content') as HTMLInputElement | null;
  if (el == null) return 0;
  const hashBonus = el.value.match(/^#/) ? 1 : 0;
  return countText(el.value) + hashBonus;
}

/** エラー通知の整形と表示。元 popError */
export function popError(app: KktjsApp, body: string, status: number, label: string): void {
  app.error_cnt = app.error_cnt + 1;
  let msg = status !== 0 ? '[' + label + '] ' + status + ': ' : '[' + label + '] ';
  if (body !== '') {
    try {
      const arr = JSON.parse(body);
      msg += arr.error != null ? arr.error : 'Network Error';
    } catch {
      msg += 'Network Error';
    }
  } else {
    msg += 'Unknown Network Error';
  }
  if (app.error_cnt > 1) {
    msg = '(' + app.error_cnt + ') ' + msg;
  }
  if (label === 'Token') {
    app.result_text_tmp = msg as any;
  } else {
    app.result_text = msg;
  }
  // 直近エラーの控えを残す（トーストが消えた後も設定画面から全文を確認できるようにする）。
  try {
    const d = new Date();
    const p2 = (n: number) => (n < 10 ? '0' + n : String(n));
    (app as any).last_error_text = msg;
    (app as any).last_error_time =
      p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
  } catch { /* 控えの記録に失敗しても本来の通知表示は妨げない */ }
}

/** 隠し audio 要素をクリックして音を鳴らす。元 playSound */
export function playSound(_app: KktjsApp, id: string): void {
  const el = document.getElementById(id) as HTMLElement | null;
  if (el) (el as any).click();
}

/** 画像モーダルを開く際に対象のローディングフラグを下ろす。元 openImage */
export function openImage(_app: KktjsApp, media: MediaAttachment): void {
  media.loading_avatar = false;
  media.loading_media = false;
}

/** 複数メディアのローディングフラグを下ろす。元 openImageAll */
export function openImageAll(_app: KktjsApp, list: MediaAttachment[]): void {
  list.forEach((m) => {
    m.loading_avatar = false;
    m.loading_media = false;
  });
}

/**
 * エラーメッセージを通知として表示しつつ、直近エラーの控えにも残す。
 *
 * popError を通らない箇所（[Media] 系など result_text へ直接代入していたもの）から
 * 使う。トーストは短時間で消え、かつ長文は読み切れないことがあるため、
 * 設定画面 > 開発ステータス から後で全文を確認できるようにするのが目的。
 */
export function setErrorText(app: KktjsApp, msg: string): void {
  app.result_text = msg;
  try {
    const d = new Date();
    const p2 = (n: number) => (n < 10 ? '0' + n : String(n));
    (app as any).last_error_text = msg;
    (app as any).last_error_time =
      p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
  } catch { /* 控えの記録に失敗しても本来の通知表示は妨げない */ }
}
