// 移行済みメソッドのレジストリ。
//
// legacy/app-core.js は import 時に new Vue(...) を実行し、created() フック内で
// this.fetchHome() などを呼ぶ。そのため「移行済みメソッドの実体」は legacy が
// 読み込まれる前に window.__kktjsMethods へ登録しておく必要がある。
// main.ts はこのモジュールを legacy より前に import すること。

import { fetchHome, fetchLocal, fetchMulti } from '../app/timeline';
import {
  fetchNotifAll,
  fetchNotifMention,
  fetchNotifFav,
  fetchNotifFollow,
  fetchNotifReblog,
} from '../app/notifications';
import { registerVueComponentsAndDirectives } from '../app/vue-setup';
import {
  fetchAcctAll,
  fetchAcctMedia,
  fetchAcctFav,
  fetchAcctFollow,
  fetchAcctFollower,
  fetchAcctMute,
  fetchAcctBlock,
  fetchAcctFollowRequest,
  fetchAcctRelation,
  fetchAcctProfile,
  fetchAcctProfileRelation,
  fetchAcctPinned,
} from '../app/accounts';
import {
  fetchDetail,
  fetchDetailChain,
  fetchDetailFav,
  fetchDetailReblog,
} from '../app/detail';
import { searchAll, searchAcct } from '../app/search';
import {
  actFav,
  actUnFav,
  actReblog,
  actUnReblog,
  updateFav,
  updateReblog,
  actPin,
  actUnPin,
  updatePin,
  actDelete,
  updateDelete,
} from '../app/status-actions';
import { actList, actUnList, updateList } from '../app/list-actions';
import * as predicates from './predicates';
import {
  resetHomeColumn,
  resetLocalColumn,
  resetNotifColumn,
  resetMultiColumn,
  resetAcctColumn,
  resetStreamList,
} from '../app/columns';
import {
  spoilerLength,
  contentLength,
  popError,
  playSound,
  openImage,
  openImageAll,
} from '../app/ui-helpers';
import {
  actFollow,
  actUnFollow,
  actMute,
  actUnMute,
  actBlock,
  actUnBlock,
  updateRelation,
  updateFollowAuth,
  actFollowAuth,
  actUnFollowAuth,
} from '../app/account-actions';
import {
  formatDate,
  formatDateFull,
  formatDateVote,
  formatDomain,
  checkDisplayName,
  checkKatsuChain,
  checkHeader,
  checkAvatar,
  checkMedia,
  checkAvatarDiscord,
  checkVote,
  equalArr,
  isSetVote,
} from './formatters';

declare global {
  interface Window {
    __kktjsMethods?: Record<string, (...args: any[]) => any>;
  }
}

export function registerMigratedMethods(): void {
  const methods: Record<string, (...args: any[]) => any> = {
    // legacy 側の薄いスタブから this(=app) を受け取って委譲する。
    fetchHome: (app: any) => fetchHome(app),
    fetchLocal: (app: any) => fetchLocal(app),
    fetchMulti: (app: any) => fetchMulti(app),

    // 通知取得（全件＋種別フィルタ）。
    fetchNotifAll: (app: any) => fetchNotifAll(app),
    fetchNotifMention: (app: any) => fetchNotifMention(app),
    fetchNotifFav: (app: any) => fetchNotifFav(app),
    fetchNotifFollow: (app: any) => fetchNotifFollow(app),
    fetchNotifReblog: (app: any) => fetchNotifReblog(app),

    // アカウント関連取得。
    fetchAcctAll: (app: any) => fetchAcctAll(app),
    fetchAcctMedia: (app: any) => fetchAcctMedia(app),
    fetchAcctFav: (app: any) => fetchAcctFav(app),
    fetchAcctFollow: (app: any) => fetchAcctFollow(app),
    fetchAcctFollower: (app: any) => fetchAcctFollower(app),
    fetchAcctMute: (app: any) => fetchAcctMute(app),
    fetchAcctBlock: (app: any) => fetchAcctBlock(app),
    fetchAcctFollowRequest: (app: any) => fetchAcctFollowRequest(app),
    fetchAcctRelation: (app: any) => fetchAcctRelation(app),
    fetchAcctProfile: (app: any) => fetchAcctProfile(app),
    fetchAcctProfileRelation: (app: any) => fetchAcctProfileRelation(app),
    fetchAcctPinned: (app: any) => fetchAcctPinned(app),

    // 詳細（投稿詳細＋スレッド/Fav/Reblog）。
    fetchDetail: (app: any) => fetchDetail(app),
    fetchDetailChain: (app: any) => fetchDetailChain(app),
    fetchDetailFav: (app: any) => fetchDetailFav(app),
    fetchDetailReblog: (app: any) => fetchDetailReblog(app),

    // 検索。
    searchAll: (app: any) => searchAll(app),
    searchAcct: (app: any) => searchAcct(app),

    // 投稿アクション（fav / reblog）。第2引数は status、第3引数は確認スキップ。
    actFav: (app: any, status: any, skip?: boolean) => actFav(app, status, skip),
    actUnFav: (app: any, status: any, skip?: boolean) => actUnFav(app, status, skip),
    actReblog: (app: any, status: any, skip?: boolean) => actReblog(app, status, skip),
    actUnReblog: (app: any, status: any, skip?: boolean) => actUnReblog(app, status, skip),
    updateFav: (app: any, id: string, value: any) => updateFav(app, id, value),
    updateReblog: (app: any, id: string, value: any) => updateReblog(app, id, value),
    actPin: (app: any, status: any, skip?: boolean) => actPin(app, status, skip),
    actUnPin: (app: any, status: any, skip?: boolean) => actUnPin(app, status, skip),
    updatePin: (app: any, id: string, value: any) => updatePin(app, id, value),
    actDelete: (app: any, status: any, skip?: boolean) => actDelete(app, status, skip),
    updateDelete: (app: any, id: string) => updateDelete(app, id),

    // リストメンバー操作。
    actList: (app: any, acct: any, skip?: boolean) => actList(app, acct, skip),
    actUnList: (app: any, acct: any, skip?: boolean) => actUnList(app, acct, skip),
    updateList: (app: any, acct: any, added: boolean) => updateList(app, acct, added),

    // 述語（computed 相当: 引数なし / methods 相当: id を取る）。
    hasAuth: () => predicates.hasAuth(),
    isMyAcct: (app: any) => predicates.isMyAcct(app),
    hasHome: (app: any) => predicates.hasHome(app),
    hasLocal: (app: any) => predicates.hasLocal(app),
    hasNotif: (app: any) => predicates.hasNotif(app),
    hasNotifFilter: (app: any) => predicates.hasNotifFilter(app),
    hasMulti: (app: any) => predicates.hasMulti(app),
    hasDetail: (app: any) => predicates.hasDetail(app),
    hasSearch: (app: any) => predicates.hasSearch(app),
    hasSearchAcctEx: (app: any) => predicates.hasSearchAcctEx(app),
    hasAcctProfile: (app: any) => predicates.hasAcctProfile(app),
    hasAcct: (app: any) => predicates.hasAcct(app),
    hasAcctNote: (app: any) => predicates.hasAcctNote(app),
    hasAcctUser: (app: any) => predicates.hasAcctUser(app),
    hasStreamList: (app: any) => predicates.hasStreamList(app),
    hasReply: (app: any) => predicates.hasReply(app),
    hasKatsuDraft: (app: any) => predicates.hasKatsuDraft(app),
    hasInfo: (app: any) => predicates.hasInfo(app),
    isHashtagMax: (app: any) => predicates.isHashtagMax(app),
    isListMax: (app: any) => predicates.isListMax(app),
    isListFollowMax: (app: any) => predicates.isListFollowMax(app),
    isFollow: (app: any, id: string) => predicates.isFollow(app, id),
    isBlock: (app: any, id: string) => predicates.isBlock(app, id),
    isRequest: (app: any, id: string) => predicates.isRequest(app, id),
    isList: (app: any, id: string) => predicates.isList(app, id),
    isListFollow: (app: any, id: string) => predicates.isListFollow(app, id),

    // カラムリセット。
    resetHomeColumn: (app: any) => resetHomeColumn(app),
    resetLocalColumn: (app: any) => resetLocalColumn(app),
    resetNotifColumn: (app: any) => resetNotifColumn(app),
    resetMultiColumn: (app: any) => resetMultiColumn(app),
    resetAcctColumn: (app: any) => resetAcctColumn(app),
    resetStreamList: (app: any) => resetStreamList(app),

    // 小さな UI/エディタ補助。
    spoilerLength: () => spoilerLength(),
    contentLength: () => contentLength(),
    popError: (app: any, body: string, status: number, label: string) => popError(app, body, status, label),
    playSound: (app: any, id: string) => playSound(app, id),
    openImage: (app: any, media: any) => openImage(app, media),
    openImageAll: (app: any, list: any) => openImageAll(app, list),

    // アカウントアクション（follow / mute / block）。
    actFollow: (app: any, acct: any, skip?: boolean) => actFollow(app, acct, skip),
    actUnFollow: (app: any, acct: any, skip?: boolean) => actUnFollow(app, acct, skip),
    actMute: (app: any, acct: any, skip?: boolean) => actMute(app, acct, skip),
    actUnMute: (app: any, acct: any, skip?: boolean) => actUnMute(app, acct, skip),
    actBlock: (app: any, acct: any, skip?: boolean) => actBlock(app, acct, skip),
    actUnBlock: (app: any, acct: any, skip?: boolean) => actUnBlock(app, acct, skip),
    updateRelation: (app: any, id: string, rel: any) => updateRelation(app, id, rel),

    // フォローリクエストの承認/拒否。
    actFollowAuth: (app: any, acct: any) => actFollowAuth(app, acct),
    actUnFollowAuth: (app: any, acct: any) => actUnFollowAuth(app, acct),
    updateFollowAuth: (app: any, id: string, value: any) => updateFollowAuth(app, id, value),

    // フォーマッタ/チェック（純粋関数。引数はテンプレートから渡る値、
    // repository を要するものは legacy スタブが this.repository を渡す）。
    formatDate: (_app: any, dateStr: string) => formatDate(dateStr),
    formatDateFull: (_app: any, dateStr: string) => formatDateFull(dateStr),
    formatDateVote: (_app: any, seconds: number) => formatDateVote(seconds),
    formatDomain: (_app: any, obj: any) => formatDomain(obj),
    checkDisplayName: (_app: any, name: string) => checkDisplayName(name),
    checkKatsuChain: (_app: any, status: any) => checkKatsuChain(status),
    checkHeader: (app: any, url: string) => checkHeader(app.repository, url),
    checkAvatar: (app: any, url: string) => checkAvatar(app.repository, url),
    checkMedia: (_app: any, preview: string, remote: string) => checkMedia(preview, remote),
    checkAvatarDiscord: (_app: any, user: any) => checkAvatarDiscord(user),
    checkVote: (_app: any, poll: any) => checkVote(poll),
    equalArr: (_app: any, a: any[], b: any[]) => equalArr(a, b),
    isSetVote: (_app: any, poll: any, index: number) => isSetVote(poll, index),

    // 今後ここへ移行済みメソッドを追加していく。
  };
  window.__kktjsMethods = Object.assign(window.__kktjsMethods || {}, methods);
}

// import された時点で即実行（legacy が new Vue する前に行う必要がある）。
// Vue 2 ではコンポーネント/ディレクティブのグローバル登録を new Vue より前に行う。
registerVueComponentsAndDirectives();
registerMigratedMethods();
