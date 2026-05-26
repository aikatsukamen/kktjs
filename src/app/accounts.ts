// アカウント関連の取得（legacy から移行）。
// サブパターンごとに共通化:
//  - ステータス一覧 → accts（AcctAll/AcctMedia: last-id ページング, AcctFav: Link ページング）
//  - ユーザー一覧 → accts_users（Follow/Follower/Mute/Block: Link ページング + 関係取得）
//  - 一回限り（FollowRequest / Relation / Profile / ProfileRelation / Pinned）

import {
  ACCT, MEDIA, FAVO, FOLLOW, FOLLOWER, MUTE, BLOCK,
  FOLLOW_REQUEST, RELATION, ACCT_OBJ, ACCT_RELATION, PINNED,
} from '../api/endpoints';
import { LIMIT, LIMIT_USER } from '../core/constants';
import { apiGet, parseMaxId } from '../api/client';
import type { KktjsApp } from '../types/kktjs-app';
import type { Status, Account, Relationship } from '../types/mastodon';

function ensureType(app: KktjsApp, type: string): void {
  if (app.acct_type !== type) {
    app.acct_type = type;
    (app as any).resetAcctColumn();
  }
}

// --- ステータス一覧 → accts ---

interface StatusListOpts {
  type: string;
  buildUrl: (app: KktjsApp) => string;
  /** true: Link ヘッダから acct_id、false: 末尾要素 id から acct_id */
  linkPaging: boolean;
}

function fetchAcctStatusList(app: KktjsApp, opts: StatusListOpts): void {
  ensureType(app, opts.type);
  app.fetch_lock.acct = true;

  apiGet<Status[]>(opts.buildUrl(app), app.at, {
    onSuccess: (items, getHeader) => {
      if (app.acct_type === opts.type && app.fetch_lock.acct) {
        app.updateWrapperBM(items, 'acct');
        if (app.accts.length === 0) {
          app.accts = items;
        } else {
          Array.prototype.push.apply(app.accts, items);
        }
        if (opts.linkPaging) {
          app.acct_id = parseMaxId(getHeader('link'));
        } else {
          const last = app.accts[app.accts.length - 1];
          app.acct_id = last ? last.id : '0';
        }
        app.fetch_lock.acct = false;
        app.fetch_comp.acct = items.length < LIMIT;
        app.$forceUpdate();
      }
    },
    onError: (body, status) => {
      app.fetch_lock.acct = false;
      app.popError(body, status, 'Account');
      app.$forceUpdate();
    },
  });
}

export const fetchAcctAll = (app: KktjsApp) =>
  fetchAcctStatusList(app, {
    type: 'katsu',
    linkPaging: false,
    buildUrl: (a) => ACCT
      .replace('[I]', a.repository)
      .replace('[AID]', a.acct_targetid)
      .replace('[PID]', a.acct_id)
      .replace('[LM]', String(LIMIT)),
  });

export const fetchAcctMedia = (app: KktjsApp) =>
  fetchAcctStatusList(app, {
    type: 'media',
    linkPaging: false,
    buildUrl: (a) => MEDIA
      .replace('[I]', a.repository)
      .replace('[AID]', a.acct_targetid)
      .replace('[PID]', a.acct_id)
      .replace('[LM]', String(LIMIT)),
  });

export const fetchAcctFav = (app: KktjsApp) =>
  fetchAcctStatusList(app, {
    type: 'fav',
    linkPaging: true,
    buildUrl: (a) => FAVO
      .replace('[I]', a.repository)
      .replace('[PID]', a.acct_id)
      .replace('[LM]', String(LIMIT)),
  });

// --- ユーザー一覧 → accts_users（Link ページング, 完了後に関係取得） ---

interface UserListOpts {
  type: string;
  buildUrl: (app: KktjsApp) => string;
}

function fetchAcctUserList(app: KktjsApp, opts: UserListOpts): void {
  ensureType(app, opts.type);
  app.fetch_lock.acct = true;

  apiGet<Account[]>(opts.buildUrl(app), app.at, {
    onSuccess: (users, getHeader) => {
      if (app.acct_type === opts.type && app.fetch_lock.acct) {
        if (app.accts_users.length === 0) {
          app.accts_users = users;
        } else {
          Array.prototype.push.apply(app.accts_users, users);
        }
        app.acct_id = parseMaxId(getHeader('link'));
        app.fetch_lock.acct = false;
        app.fetch_comp.acct = users.length < LIMIT_USER;
        fetchAcctRelation(app);
      }
    },
    onError: (body, status) => {
      app.fetch_lock.acct = false;
      app.popError(body, status, 'Account');
      app.$forceUpdate();
    },
  });
}

export const fetchAcctFollow = (app: KktjsApp) =>
  fetchAcctUserList(app, {
    type: 'follow',
    buildUrl: (a) => FOLLOW
      .replace('[I]', a.repository)
      .replace('[AID]', a.acct_targetid)
      .replace('[UID]', a.acct_id)
      .replace('[LM]', String(LIMIT_USER)),
  });

export const fetchAcctFollower = (app: KktjsApp) =>
  fetchAcctUserList(app, {
    type: 'follower',
    buildUrl: (a) => FOLLOWER
      .replace('[I]', a.repository)
      .replace('[AID]', a.acct_targetid)
      .replace('[UID]', a.acct_id)
      .replace('[LM]', String(LIMIT_USER)),
  });

export const fetchAcctMute = (app: KktjsApp) =>
  fetchAcctUserList(app, {
    type: 'mute',
    buildUrl: (a) => MUTE
      .replace('[I]', a.repository)
      .replace('[UID]', a.acct_id)
      .replace('[LM]', String(LIMIT_USER)),
  });

export const fetchAcctBlock = (app: KktjsApp) =>
  fetchAcctUserList(app, {
    type: 'block',
    buildUrl: (a) => BLOCK
      .replace('[I]', a.repository)
      .replace('[UID]', a.acct_id)
      .replace('[LM]', String(LIMIT_USER)),
  });

// --- フォローリクエスト一覧（ページングなし。件数を保持） ---

export function fetchAcctFollowRequest(app: KktjsApp): void {
  ensureType(app, 'request');
  app.fetch_lock.acct = true;
  const url = FOLLOW_REQUEST.replace('[I]', app.repository).replace('[LM]', String(LIMIT_USER));

  apiGet<Account[]>(url, app.at, {
    onSuccess: (users) => {
      if (app.acct_type === 'request' && app.fetch_lock.acct) {
        app.accts_users = users;
        app.user_requesting_count = app.accts_users.length;
        app.fetch_lock.acct = false;
        app.fetch_comp.acct = users.length < LIMIT_USER;
        fetchAcctRelation(app);
      }
    },
    onError: (body, status) => {
      app.fetch_lock.acct = false;
      app.popError(body, status, 'Account');
      app.$forceUpdate();
    },
  });
}

// --- accts_users 全員分の関係をまとめて取得 ---

export function fetchAcctRelation(app: KktjsApp): void {
  if (app.accts_users.length === 0) return;
  let url = RELATION.replace('[I]', app.repository);
  for (let i = 0; i < app.accts_users.length; i++) {
    url += 'id[]=' + app.accts_users[i].id + '&';
  }
  apiGet<Relationship[]>(url, app.at, {
    onSuccess: (rel) => {
      app.accts_users_relation = rel;
    },
    onError: (body, status) => {
      app.popError(body, status, 'Account');
    },
  });
}

// --- プロフィール（acct）取得とそれに続く pinned / relation の連鎖 ---

export function fetchAcctProfile(app: KktjsApp): void {
  app.fetch_watch.acct_profile = true;
  const url = ACCT_OBJ.replace('[I]', app.repository).replace('[AID]', app.acct_targetid);

  apiGet<Account>(url, app.at, {
    onSuccess: (account) => {
      app.acct = account;
      app.fetch_watch.acct_profile = false;
      fetchAcctPinned(app);
      if (app.isMyAcct) {
        (app as any).countFollowRequest();
      } else {
        fetchAcctProfileRelation(app);
      }
    },
    onError: (body, status) => {
      app.fetch_watch.acct_profile = false;
      app.popError(body, status, 'Account');
    },
  });
}

export function fetchAcctProfileRelation(app: KktjsApp): void {
  app.fetch_watch.acct_profile_rel = true;
  const url = ACCT_RELATION.replace('[I]', app.repository).replace('[AID]', app.acct_targetid);

  apiGet<Relationship[]>(url, app.at, {
    onSuccess: (rel) => {
      app.acct_relation = rel as any;
      app.fetch_watch.acct_profile_rel = false;
    },
    onError: (body, status) => {
      app.fetch_watch.acct_profile_rel = false;
      app.popError(body, status, 'Account');
    },
  });
}

export function fetchAcctPinned(app: KktjsApp): void {
  app.fetch_watch.acct_profile_pin = true;
  const url = PINNED.replace('[I]', app.repository).replace('[AID]', app.acct_targetid);

  apiGet<Status[]>(url, app.at, {
    onSuccess: (items) => {
      app.updateWrapperBM(items, 'acct');
      app.acct_pinned = items;
      app.fetch_watch.acct_profile_pin = false;
    },
    onError: (body, status) => {
      app.fetch_watch.acct_profile_pin = false;
      app.popError(body, status, 'Account');
    },
  });
}
