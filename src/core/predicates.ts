// 述語ヘルパー（legacy の computed および methods から移行）。
// すべて純粋な読み取り。Vue の computed getter / method スタブから this(=app) を渡して委譲する。

import { LIMIT_HASHTAGS, LIMIT_LISTS, LIMIT_USER } from './constants';
import type { KktjsApp } from '../types/kktjs-app';

// --- computed 相当（引数なし、this を参照） ---
export const hasAuth = (): boolean => !!localStorage.getItem('at');
export const isMyAcct = (a: KktjsApp): boolean =>
  (a.user as any).length !== 0 && (a.user as any).id === a.acct_targetid;
export const hasHome = (a: KktjsApp): boolean => a.homes.length > 0;
export const hasLocal = (a: KktjsApp): boolean => a.locals.length > 0;
export const hasNotif = (a: KktjsApp): boolean => a.notifs.length > 0;
export const hasNotifFilter = (a: KktjsApp): boolean => a.notifs_filter.length > 0;
export const hasMulti = (a: KktjsApp): boolean => a.multis.length > 0;
export const hasDetail = (a: KktjsApp): boolean => !!((a.detail as any) && (a.detail as any).id);
export const hasSearch = (a: KktjsApp): boolean => a.searchs.hashtags != null;
export const hasSearchAcctEx = (a: KktjsApp): boolean => a.searchs.accounts_ex != null;
export const hasAcctProfile = (a: KktjsApp): boolean =>
  !!((a.acct as any) && (a.acct as any).length !== 0 && a.acct_relation);
export const hasAcct = (a: KktjsApp): boolean => a.accts.length > 0;
export const hasAcctNote = (a: KktjsApp): boolean => (a.acct as any).note.length > 7;
export const hasAcctUser = (a: KktjsApp): boolean =>
  a.accts_users.length > 0 && a.accts_users_relation.length > 0;
export const hasStreamList = (a: KktjsApp): boolean => (a as any).stream_list.length !== 0;
export const hasReply = (a: KktjsApp): boolean =>
  !!((a as any).katsu.reply && (a as any).katsu.reply.id);
export const hasKatsuDraft = (a: KktjsApp): boolean =>
  !!((a as any).katsu_drafts && (a as any).katsu_drafts.length > 0);
export const hasInfo = (a: KktjsApp): boolean => !!(a.result_text && a.result_text.length > 0);
export const isHashtagMax = (a: KktjsApp): boolean =>
  (a as any).stream_hashtags.length >= LIMIT_HASHTAGS;
export const isListMax = (a: KktjsApp): boolean => a.stream_lists.length >= LIMIT_LISTS;
export const isListFollowMax = (a: KktjsApp): boolean =>
  a.stream_list_users.length === 0 || a.stream_list_users.length % LIMIT_USER !== 0;

// --- methods 相当（id を引数に取り関係配列を走査） ---
function lookupFlag(arr: any[], id: string, field: string): boolean {
  let result = false;
  arr.forEach((item) => {
    if (item.id === id) result = item[field];
  });
  return result;
}
export const isFollow = (a: KktjsApp, id: string): boolean =>
  lookupFlag(a.accts_users_relation as any[], id, 'following');
export const isBlock = (a: KktjsApp, id: string): boolean =>
  lookupFlag(a.accts_users_relation as any[], id, 'blocking');
export const isRequest = (a: KktjsApp, id: string): boolean =>
  lookupFlag(a.accts_users_relation as any[], id, 'requested');
export const isListFollow = (a: KktjsApp, id: string): boolean =>
  lookupFlag((a as any).stream_list_users_relation, id, 'following');

/** stream_list_users_bu に id が含まれるか。元 isList */
export const isList = (a: KktjsApp, id: string): boolean => {
  let found = false;
  ((a as any).stream_list_users_bu as any[]).forEach((item) => {
    if (item.id === id) found = true;
  });
  return found;
};
