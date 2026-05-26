// 検索（legacy から移行）。
// searchAll: ハッシュタグ/ステータス検索を行い、続けて searchAcct を呼ぶ。
// searchAcct: アカウント検索の結果で search_type を確定し、ロックを解除する。

import { SEARCH, ACCT_SEARCH } from '../api/endpoints';
import { LIMIT_USER } from '../core/constants';
import { apiGet } from '../api/client';
import type { KktjsApp } from '../types/kktjs-app';

/** v2 検索（ハッシュタグ/ステータス）を実行し、結果取得後に searchAcct を連鎖。元 searchAll */
export function searchAll(app: KktjsApp): void {
  if (app.search_type !== 'hashtag') {
    app.search_type = 'hashtag';
  }
  if (!app.showSearch) {
    (app as any).toggleSearch();
  }
  app.searchs = [] as any;
  app.fetch_lock.search = true;
  const url = SEARCH.replace('[I]', app.repository).replace('[STR]', app.search_text);

  apiGet<any>(url, app.at, {
    onSuccess: (result) => {
      app.searchs = result;
      searchAcct(app);
    },
    onError: (body, status) => {
      app.popError(body, status, 'Search');
    },
  });
}

/** アカウント検索（following=false）。結果で search_type を確定。元 searchAcct */
export function searchAcct(app: KktjsApp): void {
  const url = ACCT_SEARCH
    .replace('[I]', app.repository)
    .replace('[STR]', app.search_text)
    .replace('[FL]', String(false))
    .replace('[LM]', String(LIMIT_USER));

  apiGet<any[]>(url, app.at, {
    onSuccess: (accountsEx) => {
      app.searchs.accounts_ex = accountsEx;
      if (app.hasSearch && (app.searchs.hashtags as any[]).length === 0) {
        if (accountsEx.length === 0) {
          app.search_type = 'katsu';
        } else {
          app.search_type = 'acct';
        }
      }
      app.fetch_lock.search = false;
      app.$forceUpdate();
    },
    onError: (body, status) => {
      app.fetch_lock.search = false;
      app.popError(body, status, 'Search');
      app.$forceUpdate();
    },
  });
}
