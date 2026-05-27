// カラムのスクロール操作（up/back/next）とメディア/本文の開閉（legacy から移行）。
// LIMIT は legacy 定義のグローバル定数。

import type { KktjsApp } from '../types/kktjs-app';
import { LIMIT } from '../core/constants';
type A = any;

// 各カラム共通: 先頭へスクロールし、未読リセット＋表示件数を LIMIT に詰める。
function upColumn(app: KktjsApp, domId: string, key: { unread: string; list: string; id: string; has: string; comp: string }): void {
  const dom = document.getElementById(domId);
  if (dom == null) return;
  const a = app as A;
  dom.scrollTop = 0;
  a[key.unread] = 0;
  a[key.list].splice(LIMIT);
  a[key.id] = a[key.has] ? a[key.list][a[key.list].length - 1]['id'] : '';
  a.fetch_comp[key.comp] = false;
}

function backColumn(app: KktjsApp, domId: string, lockKey: string): void {
  const dom = document.getElementById(domId);
  if (dom == null) return;
  dom.scrollTop = 0;
  (app as A).fetch_lock[lockKey] = false;
}

function nextColumn(_app: KktjsApp, domId: string): void {
  const dom = document.getElementById(domId);
  if (dom == null) return;
  dom.scrollTop = dom.scrollHeight;
}

export function upHome(app: KktjsApp): void {
  upColumn(app, 'home', { unread: 'home_unread', list: 'homes', id: 'home_id', has: 'hasHome', comp: 'home' });
}
export function backHome(app: KktjsApp): void { backColumn(app, 'home', 'home'); }
export function nextHome(app: KktjsApp): void { nextColumn(app, 'home'); }

export function upLocal(app: KktjsApp): void {
  upColumn(app, 'local', { unread: 'local_unread', list: 'locals', id: 'local_id', has: 'hasLocal', comp: 'local' });
}
export function backLocal(app: KktjsApp): void { backColumn(app, 'local', 'local'); }
export function nextLocal(app: KktjsApp): void { nextColumn(app, 'local'); }

export function upMulti(app: KktjsApp): void {
  upColumn(app, 'multi', { unread: 'multi_unread', list: 'multis', id: 'multi_id', has: 'hasMulti', comp: 'multi' });
}
export function backMulti(app: KktjsApp): void { backColumn(app, 'multi', 'multi'); }
export function nextMulti(app: KktjsApp): void { nextColumn(app, 'multi'); }

/** 通知カラムを先頭へ。元 upNotif（未読リセット等はしない）。 */
export function upNotif(_app: KktjsApp): void {
  const dom = document.getElementById('notif');
  if (dom != null) dom.scrollTop = 0;
}

/** メディアの開閉フラグを単一ステータスに設定。元 updateMediaWrapper */
export function updateMediaWrapper(app: KktjsApp, status: any, opened: unknown): void {
  status['media_opened'] = opened;
  app.$forceUpdate();
}
/** 本文の開閉フラグを単一ステータスに設定。元 updateContentWrapper */
export function updateContentWrapper(app: KktjsApp, status: any, opened: unknown): void {
  status['content_opened'] = opened;
  app.$forceUpdate();
}
