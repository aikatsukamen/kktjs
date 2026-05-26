// カラムのリセット（legacy から移行）。各タイムライン/一覧の id・配列・未読・完了フラグを初期化する。
// 既に移行済みの fetch* から app.resetXxxColumn() として呼ばれる。

import type { KktjsApp } from '../types/kktjs-app';

export function resetHomeColumn(app: KktjsApp): void {
  app.home_id = '';
  app.homes = [];
  app.home_unread = 0;
  app.fetch_comp.home = false;
}

export function resetLocalColumn(app: KktjsApp): void {
  app.local_id = '';
  app.locals = [];
  app.local_unread = 0;
  app.fetch_comp.local = false;
}

export function resetNotifColumn(app: KktjsApp): void {
  app.notif_id = '';
  app.notifs_filter = [];
  // 元実装は文字列 '0' を代入している（数値ではない）ため踏襲。
  (app as any).notif_unread = '0';
  app.fetch_comp.notif_filter = false;
}

export function resetMultiColumn(app: KktjsApp): void {
  app.multi_id = '';
  app.multis = [];
  app.multi_unread = 0;
  app.fetch_comp.multi = false;
}

export function resetAcctColumn(app: KktjsApp): void {
  app.acct_id = '';
  app.accts = [];
  app.accts_users = [];
  app.fetch_comp.acct = false;
}

export function resetStreamList(app: KktjsApp): void {
  (app as any).stream_list_id = '';
  app.stream_list_users = [];
  (app as any).stream_list_users_relation = [];
  app.fetch_comp.lists = false;
}
