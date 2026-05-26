// 通知の取得（legacy から移行）。
// fetchNotifAll は全通知＋未読/ブックマーク管理を行う特別版。
// fetchNotifMention/Fav/Follow/Reblog は notif_type と exclude_types だけが異なる
// ため、1 つのパラメータ化関数 fetchNotifFiltered に集約した。

import { NOTIF } from '../api/endpoints';
import { LIMIT_NOTIF } from '../core/constants';
import { apiGet, parseMaxId } from '../api/client';
import type { KktjsApp } from '../types/kktjs-app';
import type { MastodonNotification } from '../types/mastodon';

function baseUrl(app: KktjsApp): string {
  return NOTIF
    .replace('[I]', app.repository)
    .replace('[PID]', app.notif_id)
    .replace('[LM]', String(LIMIT_NOTIF));
}

/** 全通知を取得（notifs マスタと notifs_filter の両方を更新）。元 fetchNotifAll */
export function fetchNotifAll(app: KktjsApp): void {
  if (app.notif_type !== '') {
    app.notif_type = '';
    (app as any).resetNotifColumn();
  }
  app.fetch_lock.notif = true;

  apiGet<MastodonNotification[]>(baseUrl(app), app.at, {
    onSuccess: (list, getHeader) => {
      if (app.notif_type === '' && app.fetch_lock.notif) {
        app.updateWrapperBM(list as any, 'notif');
        if (app.notifs.length === 0) {
          app.notifs = list.slice();
          app.fetch_comp.notif = list.length < LIMIT_NOTIF;
        }
        if (app.notifs_filter.length === 0) {
          app.notifs_filter = list;
        } else {
          Array.prototype.push.apply(app.notifs_filter, list);
        }
        app.notif_id = parseMaxId(getHeader('link'));
        if (app.showNotif) {
          app.notif_id_bookmark = app.hasNotif ? app.notifs[0].id : app.notif_id_bookmark;
          (app as any).countNotifUnread();
        }
        app.fetch_lock.notif = false;
        app.fetch_comp.notif_filter = list.length < LIMIT_NOTIF;
        app.$forceUpdate();
      }
    },
    onError: (body, status) => {
      app.fetch_lock.notif = false;
      app.popError(body, status, 'Notif');
      app.$forceUpdate();
    },
  });
}

// 種別ごとの exclude_types クエリ。元コードの各メソッドと同一。
const EXCLUDE_BY_TYPE: Record<string, string> = {
  mention: '&exclude_types[]=follow&exclude_types[]=favourite&exclude_types[]=reblog',
  fav: '&exclude_types[]=follow&exclude_types[]=reblog&exclude_types[]=mention',
  follow: '&exclude_types[]=favourite&exclude_types[]=reblog&exclude_types[]=mention',
  reblog: '&exclude_types[]=follow&exclude_types[]=favourite&exclude_types[]=mention',
};

/** 種別フィルタ付き通知取得（mention/fav/follow/reblog 共通）。 */
function fetchNotifFiltered(app: KktjsApp, type: keyof typeof EXCLUDE_BY_TYPE): void {
  if (app.notif_type !== type) {
    app.notif_type = type;
    (app as any).resetNotifColumn();
  }
  app.fetch_lock.notif = true;

  apiGet<MastodonNotification[]>(baseUrl(app) + EXCLUDE_BY_TYPE[type], app.at, {
    onSuccess: (list, getHeader) => {
      if (app.notif_type === type && app.fetch_lock.notif) {
        app.updateWrapperBM(list as any, 'notif');
        if (app.notifs_filter.length === 0) {
          app.notifs_filter = list;
        } else {
          Array.prototype.push.apply(app.notifs_filter, list);
        }
        app.notif_id = parseMaxId(getHeader('link'));
        app.fetch_lock.notif = false;
        app.fetch_comp.notif_filter = list.length < LIMIT_NOTIF;
        app.$forceUpdate();
      }
    },
    onError: (body, status) => {
      app.fetch_lock.notif = false;
      app.popError(body, status, 'Notif');
      app.$forceUpdate();
    },
  });
}

export const fetchNotifMention = (app: KktjsApp) => fetchNotifFiltered(app, 'mention');
export const fetchNotifFav = (app: KktjsApp) => fetchNotifFiltered(app, 'fav');
export const fetchNotifFollow = (app: KktjsApp) => fetchNotifFiltered(app, 'follow');
export const fetchNotifReblog = (app: KktjsApp) => fetchNotifFiltered(app, 'reblog');
