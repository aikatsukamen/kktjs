// リストへのメンバー追加/削除（legacy から移行）。
// リスト系は JSON ボディ（account_ids）を送る点が他アクションと異なる。

import { LIST_ACCT } from '../api/endpoints';
import { apiSend } from '../api/client';
import type { KktjsApp } from '../types/kktjs-app';
import type { Account } from '../types/mastodon';

/**
 * stream_list_users_bu にメンバーを追加/削除して表示へ反映。元 updateList。
 * 注意: 元実装は削除時にインデックス未発見でも splice(undefined,1) する挙動だが、
 * 忠実に再現する（見つからなければ splice しないよう -1 ガードのみ元と同じ）。
 */
export function updateList(app: KktjsApp, account: Account, added: boolean): void {
  const bu = (app as any).stream_list_users_bu as Account[];
  if (added) {
    bu.push(account);
  } else {
    let idx: number | undefined;
    bu.forEach((u, i) => {
      if (u.id === account.id) idx = i;
    });
    if (idx !== -1) {
      bu.splice(idx as number, 1);
    }
  }
  app.$forceUpdate();
}

function runListAction(
  app: KktjsApp,
  method: 'POST' | 'DELETE',
  account: Account & Record<string, unknown>,
  confirmKey: string,
  skip: boolean,
  added: boolean
): void {
  if (skip !== true) {
    (app as any).confirm(account, confirmKey);
    return;
  }
  (account as any).req_list = true;
  // proxy への同期変更。reactivity で反映（検証済み）。
  const body = { account_ids: [account.id] };
  const url = LIST_ACCT
    .replace('[I]', app.repository)
    .replace('[LID]', (app as any).stream_list.id);

  apiSend(method, url, app.at, body, {
    onSuccess: () => {
      updateList(app, account, added);
      app.$forceUpdate();
    },
    onError: (b, st) => app.popError(b, st, 'List'),
    onSettled: () => {
      (account as any).req_list = false;
      app.$forceUpdate();
    },
  }, { json: true });
}

/** リストにメンバー追加（確認 'list'）。元 actList */
export function actList(app: KktjsApp, account: Account, skip?: boolean): void {
  runListAction(app, 'POST', account as any, 'list', skip === true, true);
}

/** リストからメンバー削除（確認 'unlist'）。元 actUnList */
export function actUnList(app: KktjsApp, account: Account, skip?: boolean): void {
  runListAction(app, 'DELETE', account as any, 'unlist', skip === true, false);
}
