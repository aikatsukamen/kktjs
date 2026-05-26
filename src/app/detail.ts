// 投稿詳細の取得（legacy から移行）。
// fetchDetail は本体を取得し、続けて chain/fav/reblog を並行取得する。

import { DETAIL, DETAIL_CHAIN, DETAIL_FAV, DETAIL_REBLOG } from '../api/endpoints';
import { LIMIT_USER } from '../core/constants';
import { apiGet } from '../api/client';
import type { KktjsApp } from '../types/kktjs-app';
import type { Status, Account } from '../types/mastodon';

/** 投稿本体を取得し、関連（スレッド/Fav/Reblog）の取得を連鎖させる。元 fetchDetail */
export function fetchDetail(app: KktjsApp): void {
  app.fetch_watch.detail = true;
  const url = DETAIL.replace('[I]', app.repository).replace('[SID]', app.detail_targetid);

  apiGet<Status>(url, app.at, {
    onSuccess: (status) => {
      app.updateWrapperBM([status], 'detail');
      app.detail = status;
      app.fetch_watch.detail = false;
      fetchDetailChain(app);
      fetchDetailFav(app);
      fetchDetailReblog(app);
    },
    onError: (body, status) => {
      app.fetch_watch.detail = false;
      app.popError(body, status, 'Detail');
      app.$forceUpdate();
    },
  });
}

/** スレッド（祖先/子孫）を取得。元 fetchDetailChain */
export function fetchDetailChain(app: KktjsApp): void {
  app.fetch_watch.detail_chain = true;
  const url = DETAIL_CHAIN.replace('[I]', app.repository).replace('[SID]', app.detail_targetid);

  apiGet<{ ancestors: Status[]; descendants: Status[] }>(url, app.at, {
    onSuccess: (chain) => {
      app.updateWrapperBM(chain as any, 'detail_chain');
      app.detail_chain = chain;
      app.fetch_watch.detail_chain = false;
    },
    onError: (body, status) => {
      app.popError(body, status, 'Detail');
    },
  });
}

/** お気に入りしたユーザー一覧を取得。元 fetchDetailFav */
export function fetchDetailFav(app: KktjsApp): void {
  app.fetch_watch.detail_fav = true;
  const url = DETAIL_FAV
    .replace('[I]', app.repository)
    .replace('[SID]', app.detail_targetid)
    .replace('[LM]', String(LIMIT_USER));

  apiGet<Account[]>(url, app.at, {
    onSuccess: (users) => {
      app.detail_fav = users;
      app.fetch_watch.detail_fav = false;
    },
    onError: (body, status) => {
      app.popError(body, status, 'Detail');
    },
  });
}

/** ブーストしたユーザー一覧を取得。元 fetchDetailReblog */
export function fetchDetailReblog(app: KktjsApp): void {
  app.fetch_watch.detail_reblog = true;
  const url = DETAIL_REBLOG
    .replace('[I]', app.repository)
    .replace('[SID]', app.detail_targetid)
    .replace('[LM]', String(LIMIT_USER));

  apiGet<Account[]>(url, app.at, {
    onSuccess: (users) => {
      app.detail_reblog = users;
      app.fetch_watch.detail_reblog = false;
    },
    onError: (body, status) => {
      app.popError(body, status, 'Detail');
    },
  });
}
