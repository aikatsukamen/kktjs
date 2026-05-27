// 通知判定・未読カウントと、投稿エディタのテキスト補助（legacy から移行）。

import type { KktjsApp } from '../types/kktjs-app';

/** 現在の通知フィルタ種別に対し、その通知を表示すべきか判定。元 notifJudge */
export function notifJudge(app: KktjsApp, notif: { type?: string }): boolean {
  const t = (app as any).notif_type;
  const nt = notif['type'];
  return (
    t === '' ||
    (t === 'mention' && nt === 'mention') ||
    (t === 'fav' && nt === 'favourite') ||
    (t === 'reblog' && nt === 'reblog') ||
    (t === 'follow' && nt === 'follow')
  );
}

/** ブックマーク位置より新しい通知を種別ごとに数えて notif_unread_filter に格納。元 countNotifUnread */
export function countNotifUnread(app: KktjsApp): void {
  const counts: Record<string, number | boolean> = {
    mention: 0, fav: 0, reblog: 0, follow: 0, others: 0, complete: true,
  };
  let seen = 0;
  if ((app as any).notif_id_bookmark === '') return;

  const notifs = app.notifs as any[];
  for (let i = 0; i < notifs.length; i++) {
    const n = notifs[i];
    if (n['id'] <= (app as any).notif_id_bookmark) break;
    seen = i + 1;
    if (n['type'] === 'mention') (counts.mention as number)++;
    else if (n['type'] === 'favourite') (counts.fav as number)++;
    else if (n['type'] === 'reblog') (counts.reblog as number)++;
    else if (n['type'] === 'follow') (counts.follow as number)++;
    if (seen === notifs.length) counts.complete = false;
  }
  (app as any).notif_unread_filter = counts;
}

// --- 投稿エディタのテキスト補助（カーソル位置に挿入 / 退避・復元） ---

function caretInsert(el: HTMLTextAreaElement | HTMLInputElement, insert: string): string {
  const before = el.value.substr(0, el.selectionStart || 0);
  const after = el.value.substr(el.selectionStart || 0, el.value.length);
  return before + insert + after;
}

/** スポイラー入力のカーソル位置に文字列を挿入。元 addSpoiler */
export function addSpoiler(app: KktjsApp, text: string): void {
  const el = document.getElementById('katsu_spoiler') as HTMLInputElement | null;
  if (!el) return;
  (app as any).katsu_spoiler_text = caretInsert(el, text);
  el.value = (app as any).katsu_spoiler_text;
}

/** スポイラーを退避値から復元。元 restoreSpoiler */
export function restoreSpoiler(app: KktjsApp): void {
  const el = document.getElementById('katsu_spoiler') as HTMLInputElement | null;
  if (!el) return;
  (app as any).katsu_spoiler_text = (app as any).katsu_spoiler_text_bu;
  el.value = (app as any).katsu_spoiler_text;
}

/** スポイラーを退避してクリア。元 disableSpoiler */
export function disableSpoiler(app: KktjsApp): void {
  const el = document.getElementById('katsu_spoiler') as HTMLInputElement | null;
  if (!el) return;
  (app as any).katsu_spoiler_text_bu = el.value;
  (app as any).katsu_spoiler_text = '';
  el.value = '';
}

/** 本文入力のカーソル位置に文字列を挿入。元 addContent */
export function addContent(app: KktjsApp, text: string): void {
  const el = document.getElementById('katsu_content') as HTMLTextAreaElement | null;
  if (!el) return;
  (app as any).katsu_content_text = caretInsert(el, text);
  el.value = (app as any).katsu_content_text;
}
