// アカウントに対するアクション（follow / mute / block とその解除）と関係の反映。
// legacy から移行。いずれも「確認 → POST([AID]) → 応答を acct_relation[0] に格納 →
// updateRelation で accts_users_relation を更新」という同一パターン。

import {
  ACT_FOLLOW, ACT_UNFOLLOW, ACT_MUTE, ACT_UNMUTE, ACT_BLOCK, ACT_UNBLOCK,
  FOLLOW_AUTH, FOLLOW_REJECT,
} from '../api/endpoints';
import { apiSend } from '../api/client';
import type { KktjsApp } from '../types/kktjs-app';
import type { Account, Relationship } from '../types/mastodon';

/** accts_users_relation 内の該当アカウントの関係（following/requested/blocking）を更新。元 updateRelation */
export function updateRelation(app: KktjsApp, id: string, rel: Relationship): void {
  app.accts_users_relation.forEach((r) => {
    if (r.id === id) {
      r.following = rel.following;
      r.requested = rel.requested;
      r.blocking = rel.blocking;
    }
  });
  app.$forceUpdate();
}

interface RelationActionOpts {
  account: Account & Record<string, unknown>;
  confirmKey: string;
  skipConfirm: boolean;
  reqFlag: 'req_follow' | 'req_mute' | 'req_block';
  endpoint: string; // [I]/[AID] を含むテンプレート
  errorLabel: string;
}

function runRelationAction(app: KktjsApp, opts: RelationActionOpts): void {
  const { account } = opts;
  if ((app.optConfirm as any)[opts.confirmKey] === 1 && opts.skipConfirm !== true) {
    (app as any).confirm(account, opts.confirmKey);
    return;
  }
  (account as any)[opts.reqFlag] = true;
  app.$forceUpdate();

  const url = opts.endpoint.replace('[I]', app.repository).replace('[AID]', account.id);
  apiSend<Relationship>('POST', url, app.at, {}, {
    onSuccess: (rel) => {
      (app.acct_relation as any) = app.acct_relation || ([] as any);
      (app.acct_relation as any)[0] = rel;
      updateRelation(app, account.id, rel);
      app.$forceUpdate();
    },
    onError: (body, status) => {
      app.popError(body, status, opts.errorLabel);
    },
    onSettled: () => {
      (account as any)[opts.reqFlag] = false;
      app.$forceUpdate();
    },
  });
}

export function actFollow(app: KktjsApp, account: Account, skip?: boolean): void {
  runRelationAction(app, { account: account as any, confirmKey: 'follow', skipConfirm: skip === true, reqFlag: 'req_follow', endpoint: ACT_FOLLOW, errorLabel: 'Follow' });
}
export function actUnFollow(app: KktjsApp, account: Account, skip?: boolean): void {
  runRelationAction(app, { account: account as any, confirmKey: 'unfollow', skipConfirm: skip === true, reqFlag: 'req_follow', endpoint: ACT_UNFOLLOW, errorLabel: 'Follow' });
}
export function actMute(app: KktjsApp, account: Account, skip?: boolean): void {
  runRelationAction(app, { account: account as any, confirmKey: 'mute', skipConfirm: skip === true, reqFlag: 'req_mute', endpoint: ACT_MUTE, errorLabel: 'Mute' });
}
export function actUnMute(app: KktjsApp, account: Account, skip?: boolean): void {
  runRelationAction(app, { account: account as any, confirmKey: 'unmute', skipConfirm: skip === true, reqFlag: 'req_mute', endpoint: ACT_UNMUTE, errorLabel: 'Mute' });
}
export function actBlock(app: KktjsApp, account: Account, skip?: boolean): void {
  runRelationAction(app, { account: account as any, confirmKey: 'block', skipConfirm: skip === true, reqFlag: 'req_block', endpoint: ACT_BLOCK, errorLabel: 'Block' });
}
export function actUnBlock(app: KktjsApp, account: Account, skip?: boolean): void {
  runRelationAction(app, { account: account as any, confirmKey: 'unblock', skipConfirm: skip === true, reqFlag: 'req_block', endpoint: ACT_UNBLOCK, errorLabel: 'Block' });
}

// --- フォローリクエストの承認/拒否 ---
// 確認なし。POST 後に updateFollowAuth で accts_users[].authorize を更新し件数を再計算。

/** accts_users 内の該当アカウントの authorize を更新し、件数を再計算。元 updateFollowAuth */
export function updateFollowAuth(app: KktjsApp, id: string, value: boolean): void {
  app.accts_users.forEach((u: any) => {
    if (u.id === id) u.authorize = value;
  });
  (app as any).countFollowRequest();
  app.$forceUpdate();
}

function runFollowAuth(
  app: KktjsApp,
  account: Account & Record<string, unknown>,
  endpoint: string,
  authorized: boolean
): void {
  (account as any).req_follow = true;
  app.$forceUpdate();
  const url = endpoint.replace('[I]', app.repository).replace('[AID]', account.id);
  apiSend('POST', url, app.at, {}, {
    onSuccess: () => updateFollowAuth(app, account.id, authorized),
    onError: (body, status) => app.popError(body, status, 'Request'),
    onSettled: () => {
      (account as any).req_follow = false;
      app.$forceUpdate();
    },
  });
}

export function actFollowAuth(app: KktjsApp, account: Account): void {
  runFollowAuth(app, account as any, FOLLOW_AUTH, true);
}
export function actUnFollowAuth(app: KktjsApp, account: Account): void {
  runFollowAuth(app, account as any, FOLLOW_REJECT, false);
}
