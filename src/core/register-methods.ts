// 移行済みメソッドのレジストリ。
//
// legacy/app-core.ts は import 時に Vue.createApp(...).mount('#app') を実行し、
// created() フック内で this.fetchHome() などを呼ぶ。そのため「移行済みメソッドの実体」は
// legacy が読み込まれる前に window.__kktjsMethods へ登録しておく必要がある。
// main.ts はこのモジュールを legacy より前に import すること。

import { fetchHome, fetchLocal, fetchMulti } from '../app/timeline';
import {
  fetchNotifAll,
  fetchNotifMention,
  fetchNotifFav,
  fetchNotifFollow,
  fetchNotifReblog,
} from '../app/notifications';
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
  formatContent,
  formatSpoiler,
  formatContentConfirm,
  formatSpoilerConfirm,
  formatEmoji,
  formatEmojiDraft,
} from './content-format';
import {
  updateWrapperBM,
  updateWrapperAll,
  updateWrapper,
  updateFilterBM,
  updateFilterAll,
  updateImgLoading,
  updateVote,
} from '../app/display-wrappers';
import {
  notifJudge,
  countNotifUnread,
  addSpoiler,
  restoreSpoiler,
  disableSpoiler,
  addContent,
} from '../app/notif-helpers';
import {
  contentExchange,
  contentToDraft,
  draftToContent,
} from '../app/editor-helpers';
import {
  fetchStreamList,
  fetchListListed,
  fetchListListedBackup,
  fetchListSearch,
  fetchListFollow,
  fetchListFollower,
  fetchListAcctRelation,
} from '../app/list-stream';
import { deleteConf, deleteToken } from '../app/config';
import {
  toggleHomeOption, toggleLocalOption, toggleNotifOption, toggleAcctEdit, toggleAcctOption,
  toggleSetting, toggleSearch, toggleStream, toggleStreamEdit, toggleForm,
  toggleFormSpoiler, toggleFormVote, toggleFormDraft, toggleFormVisible,
  toggleSideLink, toggleLink, toggleLinkSearch, toggleLinkStream,
} from '../app/ui-toggles';
import {
  upHome, backHome, nextHome, upLocal, backLocal, nextLocal,
  upMulti, backMulti, nextMulti, upNotif,
  updateMediaWrapper, updateContentWrapper,
} from '../app/column-scroll';
import {
  openThisPage, openAuth, openProfile, openMastodon, openAbout,
  openPolicy, openWiki, openDirectry, openEmoji, closeEmoji,
} from '../app/external-links';
import {
  setResizer, setHistory, setNotifSound, resetColumn,
  addStreamHashtag, removeStreamHashtag, serviceWorkerUpdateCheck,
  reloadForce, reopenForce, confirm as confirmModal, countFollowRequest,
} from '../app/system';
import {
  runInit, runCustom, runHome, runLocal, runNotif, runUser, runMulti,
  runDetail, runAcct, runReply, runToast, runAuthClient, runUserId, runListSearch,
  runSettingUser, runSettingDrafts, runSettingKatsuDrafts, runSettingStreamHashtags,
  runSettingBookmark, runSettingBookmarkNotif, runBookmark, runAddList, runRemoveList, runExtime,
} from '../app/run-actions';
import {
  handleWheel, handleScrollHome, handleScrollLocal,
  handleScrollMulti, handleScrollNotif, handleScrollAcct,
} from '../app/scroll-handlers';
import {
  refetchHome, refetchLocal, refetchMulti, refetchNotifAll,
  refreshCount, checkStreamListText, checkListProfile,
} from '../app/refetch-actions';
import {
  checkStreamHashtag, actVote, setVote, actReport, actProfile, actListProfile,
  checkActMedia, actMedia, removeMedia, saveKatsu, actKatsuShortCut, actKatsu,
  refreshKatsu, katsuToDraft, draftToKatsu, checkKatsu, jumpKatsu,
} from '../app/posting-actions';
import {
  fetchToken, fetchUser, loadConf, saveConf, resetConf,
} from '../app/auth-config';
import {
  openWsHome, reopenWsHome, openWsLocal, reopenWsLocal, openWsMulti, reopenWsMulti,
} from '../app/streaming';
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

    // 本文・スポイラー・絵文字の整形。
    formatContent: (_app: any, text: any, emojis: any) => formatContent(text, emojis),
    formatSpoiler: (_app: any, text: any, emojis: any) => formatSpoiler(text, emojis),
    formatContentConfirm: (_app: any, text: any, emojis: any) => formatContentConfirm(text, emojis),
    formatSpoilerConfirm: (_app: any, text: any, emojis: any) => formatSpoilerConfirm(text, emojis),
    formatEmoji: (_app: any, text: any, emojis: any) => formatEmoji(text, emojis),
    formatEmojiDraft: (_app: any, text: any, emojis: any) => formatEmojiDraft(text, emojis),

    // 表示整形（開閉フラグ / フィルタ / ローディング / 投票反映）。
    updateWrapperBM: (app: any, data: any, mode: any) => updateWrapperBM(app, data, mode),
    updateWrapperAll: (app: any) => updateWrapperAll(app),
    updateWrapper: (app: any, status: any, caught: any) => updateWrapper(app, status, caught),
    updateFilterBM: (app: any, data: any, mode: any) => updateFilterBM(app, data, mode),
    updateFilterAll: (app: any) => updateFilterAll(app),
    updateImgLoading: (app: any, list: any) => updateImgLoading(app, list),
    updateVote: (app: any, id: string, poll: any) => updateVote(app, id, poll),

    // 通知判定/カウント・エディタ補助。
    notifJudge: (app: any, notif: any) => notifJudge(app, notif),
    countNotifUnread: (app: any) => countNotifUnread(app),
    addSpoiler: (app: any, text: any) => addSpoiler(app, text),
    restoreSpoiler: (app: any) => restoreSpoiler(app),
    disableSpoiler: (app: any) => disableSpoiler(app),
    addContent: (app: any, text: any) => addContent(app, text),

    // 本文⇄下書き変換。
    contentExchange: (app: any) => contentExchange(app),
    contentToDraft: (app: any) => contentToDraft(app),
    draftToContent: (app: any, index: any, replace: any) => draftToContent(app, index, replace),

    // ストリームリスト（リスト管理パネル）の取得系。
    fetchStreamList: (app: any) => fetchStreamList(app),
    fetchListListed: (app: any) => fetchListListed(app),
    fetchListListedBackup: (app: any) => fetchListListedBackup(app),
    fetchListSearch: (app: any) => fetchListSearch(app),
    fetchListFollow: (app: any) => fetchListFollow(app),
    fetchListFollower: (app: any) => fetchListFollower(app),
    fetchListAcctRelation: (app: any) => fetchListAcctRelation(app),

    // 設定/トークンの削除。
    deleteConf: (app: any) => deleteConf(app),
    deleteToken: (app: any) => deleteToken(app),

    // 表示トグル。
    toggleHomeOption: (app: any) => toggleHomeOption(app),
    toggleLocalOption: (app: any) => toggleLocalOption(app),
    toggleNotifOption: (app: any) => toggleNotifOption(app),
    toggleAcctEdit: (app: any) => toggleAcctEdit(app),
    toggleAcctOption: (app: any) => toggleAcctOption(app),
    toggleSetting: (app: any) => toggleSetting(app),
    toggleSearch: (app: any) => toggleSearch(app),
    toggleStream: (app: any) => toggleStream(app),
    toggleStreamEdit: (app: any) => toggleStreamEdit(app),
    toggleForm: (app: any) => toggleForm(app),
    toggleFormSpoiler: (app: any) => toggleFormSpoiler(app),
    toggleFormVote: (app: any) => toggleFormVote(app),
    toggleFormDraft: (app: any) => toggleFormDraft(app),
    toggleFormVisible: (app: any) => toggleFormVisible(app),
    toggleSideLink: (app: any) => toggleSideLink(app),
    toggleLink: (app: any) => toggleLink(app),
    toggleLinkSearch: (app: any) => toggleLinkSearch(app),
    toggleLinkStream: (app: any, target: any) => toggleLinkStream(app, target),

    // カラムスクロール（up/back/next）＋メディア/本文開閉。
    upHome: (app: any) => upHome(app),
    backHome: (app: any) => backHome(app),
    nextHome: (app: any) => nextHome(app),
    upLocal: (app: any) => upLocal(app),
    backLocal: (app: any) => backLocal(app),
    nextLocal: (app: any) => nextLocal(app),
    upMulti: (app: any) => upMulti(app),
    backMulti: (app: any) => backMulti(app),
    nextMulti: (app: any) => nextMulti(app),
    upNotif: (app: any) => upNotif(app),
    updateMediaWrapper: (app: any, status: any, opened: any) => updateMediaWrapper(app, status, opened),
    updateContentWrapper: (app: any, status: any, opened: any) => updateContentWrapper(app, status, opened),

    // 外部リンク・絵文字開閉。
    openThisPage: (app: any) => openThisPage(app),
    openAuth: (app: any) => openAuth(app),
    openProfile: (app: any) => openProfile(app),
    openMastodon: (app: any) => openMastodon(app),
    openAbout: (app: any) => openAbout(app),
    openPolicy: (app: any) => openPolicy(app),
    openWiki: (app: any) => openWiki(app),
    openDirectry: (app: any) => openDirectry(app),
    openEmoji: (app: any) => openEmoji(app),
    closeEmoji: (app: any) => closeEmoji(app),

    // システム/セットアップ系。
    setResizer: (app: any) => setResizer(app),
    setHistory: (app: any) => setHistory(app),
    setNotifSound: (app: any, id: any, url: any) => setNotifSound(app, id, url),
    resetColumn: (app: any, width: any) => resetColumn(app, width),
    addStreamHashtag: (app: any) => addStreamHashtag(app),
    removeStreamHashtag: (app: any, tag: any) => removeStreamHashtag(app, tag),
    serviceWorkerUpdateCheck: (app: any) => serviceWorkerUpdateCheck(app),
    reloadForce: (app: any) => reloadForce(app),
    reopenForce: (app: any) => reopenForce(app),
    confirm: (app: any, issue: any, type: any) => confirmModal(app, issue, type),
    countFollowRequest: (app: any) => countFollowRequest(app),

    // run* オーケストレーション系。
    runInit: (app: any) => runInit(app),
    runCustom: (app: any) => runCustom(app),
    runHome: (app: any) => runHome(app),
    runLocal: (app: any, arg0: any) => runLocal(app, arg0),
    runNotif: (app: any, arg0: any) => runNotif(app, arg0),
    runUser: (app: any, arg0: any) => runUser(app, arg0),
    runMulti: (app: any, arg0: any, arg1: any) => runMulti(app, arg0, arg1),
    runDetail: (app: any, arg0: any) => runDetail(app, arg0),
    runAcct: (app: any, arg0: any) => runAcct(app, arg0),
    runReply: (app: any, arg0: any) => runReply(app, arg0),
    runToast: (app: any, arg0: any) => runToast(app, arg0),
    runAuthClient: (app: any) => runAuthClient(app),
    runUserId: (app: any) => runUserId(app),
    runListSearch: (app: any) => runListSearch(app),
    runSettingUser: (app: any) => runSettingUser(app),
    runSettingDrafts: (app: any) => runSettingDrafts(app),
    runSettingKatsuDrafts: (app: any) => runSettingKatsuDrafts(app),
    runSettingStreamHashtags: (app: any) => runSettingStreamHashtags(app),
    runSettingBookmark: (app: any) => runSettingBookmark(app),
    runSettingBookmarkNotif: (app: any) => runSettingBookmarkNotif(app),
    runBookmark: (app: any, arg0: any, arg1: any) => runBookmark(app, arg0, arg1),
    runAddList: (app: any) => runAddList(app),
    runRemoveList: (app: any, arg0: any, arg1: any) => runRemoveList(app, arg0, arg1),
    runExtime: (app: any) => runExtime(app),

    // スクロール/ホイール（debounce ラッパは legacy 残置、本体のみ委譲）。
    handleWheel: (app: any, e: any) => handleWheel(app, e),
    handleScrollHome: (app: any, e: any) => handleScrollHome(app, e),
    handleScrollLocal: (app: any, e: any) => handleScrollLocal(app, e),
    handleScrollMulti: (app: any, e: any) => handleScrollMulti(app, e),
    handleScrollNotif: (app: any, e: any) => handleScrollNotif(app, e),
    handleScrollAcct: (app: any, e: any) => handleScrollAcct(app, e),

    // debounce 対象（ラッパ legacy 残置、本体委譲）。
    refetchHome: (app: any) => refetchHome(app),
    refetchLocal: (app: any) => refetchLocal(app),
    refetchMulti: (app: any) => refetchMulti(app),
    refetchNotifAll: (app: any) => refetchNotifAll(app),
    refreshCount: (app: any) => refreshCount(app),
    checkStreamListText: (app: any) => checkStreamListText(app),
    checkListProfile: (app: any) => checkListProfile(app),

    // 投稿・メディア・投票・プロフィール系。
    checkStreamHashtag: (app: any) => checkStreamHashtag(app),
    actVote: (app: any, a0: any, a1: any) => actVote(app, a0, a1),
    setVote: (app: any, a0: any, a1: any) => setVote(app, a0, a1),
    actReport: (app: any, a0: any, a1: any) => actReport(app, a0, a1),
    actProfile: (app: any) => actProfile(app),
    actListProfile: (app: any) => actListProfile(app),
    checkActMedia: (app: any, a0: any) => checkActMedia(app, a0),
    actMedia: (app: any, a0: any, a1: any, a2: any) => actMedia(app, a0, a1, a2),
    removeMedia: (app: any, a0: any) => removeMedia(app, a0),
    saveKatsu: (app: any) => saveKatsu(app),
    actKatsuShortCut: (app: any) => actKatsuShortCut(app),
    actKatsu: (app: any, a0: any, a1: any) => actKatsu(app, a0, a1),
    refreshKatsu: (app: any) => refreshKatsu(app),
    katsuToDraft: (app: any) => katsuToDraft(app),
    draftToKatsu: (app: any, a0: any, a1: any) => draftToKatsu(app, a0, a1),
    checkKatsu: (app: any) => checkKatsu(app),
    jumpKatsu: (app: any, a0: any, a1: any) => jumpKatsu(app, a0, a1),

    // 認証・設定。
    fetchToken: (app: any) => fetchToken(app),
    fetchUser: (app: any) => fetchUser(app),
    loadConf: (app: any) => loadConf(app),
    saveConf: (app: any) => saveConf(app),
    resetConf: (app: any) => resetConf(app),

    // ストリーミング（WebSocket 接続/再接続。dedup/再接続の本番修正を維持）。
    openWsHome: (app: any) => openWsHome(app),
    reopenWsHome: (app: any, a0: any) => reopenWsHome(app, a0),
    openWsLocal: (app: any) => openWsLocal(app),
    reopenWsLocal: (app: any, a0: any) => reopenWsLocal(app, a0),
    openWsMulti: (app: any) => openWsMulti(app),
    reopenWsMulti: (app: any, a0: any, a1: any) => reopenWsMulti(app, a0, a1),

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
    checkVote: (_app: any, poll: any) => checkVote(poll),
    equalArr: (_app: any, a: any[], b: any[]) => equalArr(a, b),
    isSetVote: (_app: any, poll: any, index: number) => isSetVote(poll, index),

    // 今後ここへ移行済みメソッドを追加していく。
  };
  window.__kktjsMethods = Object.assign(window.__kktjsMethods || {}, methods);
}

// import された時点で即実行（legacy が createApp する前に行う必要がある）。
// Vue 3: コンポーネント/ディレクティブ登録は app-core が createApp 後・mount 前に
// app インスタンスへ行う（registerVueComponentsAndDirectives(app)）。ここではメソッド
// レジストリのみ登録する（legacy の created() が初期化中にこれらを参照するため）。
registerMigratedMethods();
