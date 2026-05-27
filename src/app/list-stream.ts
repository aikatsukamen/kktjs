// ストリームリスト（サイドパネルのリスト管理）の取得系（legacy から移行）。
// 元実装の XHR を apiGet に置き換えつつ、状態遷移・ページング・相互呼び出し
// (fetchListAcctRelation への連鎖) を忠実に再現する。

import type { KktjsApp } from '../types/kktjs-app';
import { apiGet, parseMaxId } from '../api/client';
import { fillEndpoint } from '../api/endpoints';
import {
  LIST_ALL,
  LIST_ACCT,
  ACCT_SEARCH,
  FOLLOW,
  FOLLOWER,
  RELATION,
} from '../api/endpoints';
import { LIMIT_USER } from '../core/constants';

/** 自分のリスト一覧を取得。元 fetchStreamList */
export function fetchStreamList(app: KktjsApp): void {
  const a = app as any;
  a.fetch_lock['lists'] = true;
  apiGet<any>(fillEndpoint(LIST_ALL, { I: a.repository }), a.at, {
    onSuccess: (data) => {
      a.stream_lists = data;
      a.fetch_lock['lists'] = false;
      a.fetch_after['lists'] = false;
    },
    onError: (text, status) => {
      a.fetch_lock['lists'] = false;
      a.popError(text, status, 'List');
      a.fetch_after['lists'] = true;
    },
  });
}

/** 指定リストの所属アカウントを取得 → 続けて関係性を取得。元 fetchListListed */
export function fetchListListed(app: KktjsApp): void {
  const a = app as any;
  if (a.stream_list_type !== 'listed') {
    a.stream_list_type = 'listed';
    a.resetStreamList();
  }
  a.fetch_lock['lists'] = true;
  const url = fillEndpoint(LIST_ACCT, { I: a.repository, LID: a.stream_list['id'] });
  apiGet<any>(url, a.at, {
    onSuccess: (data) => {
      if (a.stream_list_type === 'listed' && a.fetch_lock['lists']) {
        a.stream_list_users = data;
        a.fetch_lock['lists'] = false;
        a.fetch_comp['lists'] = true;
      }
      a.fetchListAcctRelation();
    },
    onError: (text, status) => {
      a.fetch_lock['lists'] = false;
      a.popError(text, status, 'List');
    },
  });
}

/** 所属アカウントを別領域(_bu)に控える。元 fetchListListedBackup */
export function fetchListListedBackup(app: KktjsApp): void {
  const a = app as any;
  const url = fillEndpoint(LIST_ACCT, { I: a.repository, LID: a.stream_list['id'] });
  apiGet<any>(url, a.at, {
    onSuccess: (data) => {
      a.stream_list_users_bu = data;
    },
    onError: (text, status) => {
      a.popError(text, status, 'List');
    },
  });
}

/** アカウント検索でリスト追加候補を取得 → 関係性取得。元 fetchListSearch */
export function fetchListSearch(app: KktjsApp): void {
  const a = app as any;
  if (a.stream_list_type !== 'search') {
    a.stream_list_type = 'search';
    a.resetStreamList();
  }
  a.fetch_lock['lists'] = true;
  const url = fillEndpoint(ACCT_SEARCH, {
    I: a.repository,
    STR: a.search_text,
    FL: a.stream_list_following,
    LM: LIMIT_USER,
  });
  apiGet<any>(url, a.at, {
    onSuccess: (data) => {
      if (a.stream_list_type === 'search' && a.fetch_lock['lists']) {
        a.stream_list_users = data;
        a.fetch_lock['lists'] = false;
        a.fetch_comp['lists'] = true;
      }
      a.fetchListAcctRelation();
    },
    onError: (text, status) => {
      a.fetch_lock['lists'] = false;
      a.popError(text, status, 'List');
    },
  });
}

/** フォロー中アカウントをページングしながら取得 → 関係性取得。元 fetchListFollow */
export function fetchListFollow(app: KktjsApp): void {
  const a = app as any;
  if (a.stream_list_type !== 'follow') {
    a.stream_list_type = 'follow';
    a.resetStreamList();
  }
  a.fetch_lock['lists'] = true;
  const url = fillEndpoint(FOLLOW, {
    I: a.repository,
    AID: a.user['id'],
    UID: a.stream_list_id,
    LM: LIMIT_USER,
  });
  apiGet<any>(url, a.at, {
    onSuccess: (data, getHeader) => {
      if (a.stream_list_type === 'follow' && a.fetch_lock['lists']) {
        if (a.stream_list_users.length === 0) {
          a.stream_list_users = data;
        } else {
          Array.prototype.push.apply(a.stream_list_users, data);
        }
        a.stream_list_id = parseMaxId(getHeader('link'));
        a.fetch_lock['lists'] = false;
        a.fetch_comp['lists'] = data.length < LIMIT_USER;
        a.fetchListAcctRelation();
      }
    },
    onError: (text, status) => {
      a.fetch_lock['lists'] = false;
      a.popError(text, status, 'List');
    },
  });
}

/** フォロワーをページングしながら取得 → 関係性取得。元 fetchListFollower */
export function fetchListFollower(app: KktjsApp): void {
  const a = app as any;
  if (a.stream_list_type !== 'follower') {
    a.stream_list_type = 'follower';
    a.resetStreamList();
  }
  a.fetch_lock['lists'] = true;
  const url = fillEndpoint(FOLLOWER, {
    I: a.repository,
    AID: a.user['id'],
    UID: a.stream_list_id,
    LM: LIMIT_USER,
  });
  apiGet<any>(url, a.at, {
    onSuccess: (data, getHeader) => {
      if (a.stream_list_type === 'follower' && a.fetch_lock['lists']) {
        if (a.stream_list_users.length === 0) {
          a.stream_list_users = data;
        } else {
          Array.prototype.push.apply(a.stream_list_users, data);
        }
        a.stream_list_id = parseMaxId(getHeader('link'));
        a.fetch_lock['lists'] = false;
        a.fetchListAcctRelation();
      }
    },
    onError: (text, status) => {
      a.fetch_lock['lists'] = false;
      a.popError(text, status, 'List');
    },
  });
}

/** 表示中ユーザー群との関係性(フォロー状態等)をまとめて取得。元 fetchListAcctRelation */
export function fetchListAcctRelation(app: KktjsApp): void {
  const a = app as any;
  if (a.stream_list_users.length === 0) return;
  let url = fillEndpoint(RELATION, { I: a.repository });
  for (let i = 0; i < a.stream_list_users.length; i++) {
    url = url + 'id[]=' + a.stream_list_users[i]['id'] + '&';
  }
  apiGet<any>(url, a.at, {
    onSuccess: (data) => {
      a.stream_list_users_relation = data;
    },
    onError: (text, status) => {
      a.popError(text, status, 'List');
    },
  });
}
