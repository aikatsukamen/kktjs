// 投稿アクション（fav / reblog / pin / delete）と、その楽観的UI反映（update*）。
// legacy から移行。act* は確認ダイアログ → POST → 成功時に update* を呼ぶ定型。
// update* は全カラム配列へ状態を伝播させる。fav/reblog はパターンが完全一致のため
// propagateStatusField に共通化した。pin/delete は対象範囲が異なるため個別実装。

import { ACT_FAV, ACT_UNFAV, ACT_REBLOG, ACT_UNREBLOG, ACT_PIN, ACT_UNPIN, DETAIL } from '../api/endpoints';
import { apiSend } from '../api/client';
import type { KktjsApp } from '../types/kktjs-app';
import type { Status } from '../types/mastodon';

type StatusField = 'favourited' | 'reblogged' | 'pinned' | 'visibility';

/**
 * 指定 id の投稿（および各カラム配列内の reblog 先）に field=value を反映する。
 * 反映先: homes / locals / notifs / notifs_filter / accts / acct_pinned /
 *         detail / detail_chain(ancestors,descendants) / multis
 * fav/reblog の元実装と同一の走査範囲・ロジック。
 */
function propagateStatusField(app: KktjsApp, id: string, field: StatusField, value: unknown): void {
  const setOn = (s: Status | undefined | null): boolean => {
    if (s && s.id === id) {
      (s as any)[field] = value;
      return true;
    }
    return false;
  };
  const setWithReblog = (s: Status): void => {
    if (s.id === id) {
      (s as any)[field] = value;
    } else if (s.reblog && s.reblog.id === id) {
      (s.reblog as any)[field] = value;
    }
  };

  app.homes.forEach(setWithReblog);
  app.locals.forEach((s) => setOn(s));
  app.notifs.forEach((n: any) => { if (n.status) setOn(n.status); });
  app.notifs_filter.forEach((n: any) => { if (n.status) setOn(n.status); });
  app.accts.forEach(setWithReblog);
  app.acct_pinned.forEach((s) => setOn(s));
  if ((app.detail as any) && (app.detail as any).id === id) {
    (app.detail as any)[field] = value;
  }
  const chain = app.detail_chain as any;
  if (chain && chain.length !== 0 && chain.ancestors) {
    chain.ancestors.forEach((s: Status) => setOn(s));
    chain.descendants.forEach((s: Status) => setOn(s));
  }
  app.multis.forEach((s) => setOn(s));
  app.$forceUpdate();
}

export function updateFav(app: KktjsApp, id: string, value: boolean | null): void {
  propagateStatusField(app, id, 'favourited', value);
}

export function updateReblog(app: KktjsApp, id: string, value: boolean | null): void {
  propagateStatusField(app, id, 'reblogged', value);
}

// --- 共通アクション送信（act* の定型） ---
interface ActionOpts {
  status: Status & { req_favourite?: boolean; req_reblog?: boolean };
  /** 確認設定キー（optConfirm[key]）と確認種別。null なら確認なし。 */
  confirmKey: string | null;
  skipConfirm: boolean;
  reqFlag: 'req_favourite' | 'req_reblog' | null;
  endpoint: string; // [I]/[SID] を含むテンプレート
  errorLabel: string;
  onDone: () => void;
}

function runStatusAction(app: KktjsApp, opts: ActionOpts): void {
  const { status } = opts;
  if (
    opts.confirmKey != null &&
    (app.optConfirm as any)[opts.confirmKey] === 1 &&
    opts.skipConfirm !== true
  ) {
    (app as any).confirm(status, opts.confirmKey);
    return;
  }
  if (opts.reqFlag) {
    (status as any)[opts.reqFlag] = true;
    app.$forceUpdate();
  }
  const url = opts.endpoint.replace('[I]', app.repository).replace('[SID]', status.id);
  apiSend(
    'POST',
    url,
    app.at,
    {},
    {
      onSuccess: () => opts.onDone(),
      onError: (body, st) => app.popError(body, st, opts.errorLabel),
      onSettled: () => {
        if (opts.reqFlag) (status as any)[opts.reqFlag] = false;
        app.$forceUpdate();
      },
    }
  );
  app.modal_issue = '' as any;
}

export function actFav(app: KktjsApp, status: Status, skip?: boolean): void {
  runStatusAction(app, {
    status, confirmKey: 'fav', skipConfirm: skip === true, reqFlag: 'req_favourite',
    endpoint: ACT_FAV, errorLabel: 'Fav',
    onDone: () => updateFav(app, status.id, true),
  });
}
export function actUnFav(app: KktjsApp, status: Status, skip?: boolean): void {
  runStatusAction(app, {
    status, confirmKey: 'unfav', skipConfirm: skip === true, reqFlag: 'req_favourite',
    endpoint: ACT_UNFAV, errorLabel: 'Fav',
    onDone: () => updateFav(app, status.id, null),
  });
}
export function actReblog(app: KktjsApp, status: Status, skip?: boolean): void {
  runStatusAction(app, {
    status, confirmKey: 'reblog', skipConfirm: skip === true, reqFlag: 'req_reblog',
    endpoint: ACT_REBLOG, errorLabel: 'Reblog',
    onDone: () => updateReblog(app, status.id, true),
  });
}
export function actUnReblog(app: KktjsApp, status: Status, skip?: boolean): void {
  runStatusAction(app, {
    status, confirmKey: 'unreblog', skipConfirm: skip === true, reqFlag: 'req_reblog',
    endpoint: ACT_UNREBLOG, errorLabel: 'Reblog',
    onDone: () => updateReblog(app, status.id, null),
  });
}

// pin / delete は確認や追加処理が fav/reblog と異なるため個別に実装する。

// --- ピン留め（accts/detail/detail_chain。fetchAcctPinned を再取得） ---
export function updatePin(app: KktjsApp, id: string, value: boolean | null): void {
  (app as any).fetchAcctPinned();
  app.accts.forEach((s) => { if (s.id === id) (s as any).pinned = value; });
  if ((app.detail as any) && (app.detail as any).id === id) {
    (app.detail as any).pinned = value;
  }
  const chain = app.detail_chain as any;
  if (chain && chain.length !== 0 && chain.ancestors) {
    chain.ancestors.forEach((s: Status) => { if (s.id === id) (s as any).pinned = value; });
    chain.descendants.forEach((s: Status) => { if (s.id === id) (s as any).pinned = value; });
  }
  app.$forceUpdate();
}

/** ピン留め。元 actPin: optConfirm ガードはなく、skip!==true なら必ず確認。
 *  さらに既にピン済み（acct_pinned に存在）なら何もしない。 */
export function actPin(app: KktjsApp, status: Status, skip?: boolean): void {
  if (skip !== true) {
    (app as any).confirm(status, 'pin');
    return;
  }
  let alreadyPinned = false;
  app.acct_pinned.forEach((s) => { if (s.id === status.id) alreadyPinned = true; });
  if (alreadyPinned) return;

  (status as any).req_pin = true;
  app.$forceUpdate();
  const url = ACT_PIN.replace('[I]', app.repository).replace('[SID]', status.id);
  apiSend('POST', url, app.at, {}, {
    onSuccess: () => updatePin(app, status.id, true),
    onError: (body, st) => app.popError(body, st, 'Pin'),
    onSettled: () => { (status as any).req_pin = false; app.$forceUpdate(); },
  });
}

/** ピン解除。元 actUnPin: optConfirm ガードなし、skip!==true なら確認。値は false で反映。 */
export function actUnPin(app: KktjsApp, status: Status, skip?: boolean): void {
  if (skip !== true) {
    (app as any).confirm(status, 'unpin');
    return;
  }
  (status as any).req_pin = true;
  app.$forceUpdate();
  const url = ACT_UNPIN.replace('[I]', app.repository).replace('[SID]', status.id);
  apiSend('POST', url, app.at, {}, {
    onSuccess: () => updatePin(app, status.id, false),
    onError: (body, st) => app.popError(body, st, 'Pin'),
    onSettled: () => { (status as any).req_pin = false; app.$forceUpdate(); },
  });
}

// --- 削除（visibility を 'deleted' に。notifs では通知オブジェクト側に設定＝元実装踏襲） ---
export function updateDelete(app: KktjsApp, id: string): void {
  const mark = (s: any) => { if (s && s.id === id) { s.visibility = 'deleted'; } };
  app.homes.forEach((s: any) => {
    if (s.id === id) { s.visibility = 'deleted'; }
    else if (s.reblog && s.reblog.id === id) { s.visibility = 'deleted'; }
  });
  app.locals.forEach(mark);
  app.notifs.forEach((n: any) => { if (n.status && n.status.id === id) { n.visibility = 'deleted'; } });
  app.notifs_filter.forEach((n: any) => { if (n.status && n.status.id === id) { n.visibility = 'deleted'; } });
  app.accts.forEach(mark);
  if ((app.detail as any) && (app.detail as any).id === id) {
    (app.detail as any).visibility = 'deleted';
  }
  const chain = app.detail_chain as any;
  if (chain && chain.length !== 0 && chain.ancestors) {
    chain.ancestors.forEach(mark);
    chain.descendants.forEach(mark);
  }
  app.multis.forEach(mark);
  app.$forceUpdate();
}

/** 削除。元 actDelete: optConfirm['delete'] ガード、req_delete、DELETE メソッド。 */
export function actDelete(app: KktjsApp, status: Status, skip?: boolean): void {
  if ((app.optConfirm as any).delete === 1 && skip !== true) {
    (app as any).confirm(status, 'delete');
    return;
  }
  (status as any).req_delete = true;
  app.$forceUpdate();
  const url = DETAIL.replace('[I]', app.repository).replace('[SID]', status.id);
  apiSend('DELETE', url, app.at, {}, {
    onSuccess: () => updateDelete(app, status.id),
    onError: (body, st) => app.popError(body, st, 'Delete'),
    onSettled: () => { (status as any).req_delete = false; app.$forceUpdate(); },
  });
}
