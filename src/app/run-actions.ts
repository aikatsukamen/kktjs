// run* オーケストレーション系（legacy から機械変換で移行）。
// this['x'] → a.x、!![]→true、![]→false へ変換。app/console は実行時グローバル。
import type { KktjsApp } from '../types/kktjs-app';
// 定数は共有 TS モジュールから import（app-core の const は実行時グローバルにならない）。
import { SEARCH, LIST_ALL, LIST_OBJ, CLIENT } from '../api/endpoints';
import { REQ_TIMEOUT, LIMIT_POLLEXPIRE } from '../core/constants';
declare const app: any;
// redirect_url / redirect_sub はデプロイ依存のため __kktjsConf ブリッジから実行時に読む。
const __conf = (): any => (window as any).__kktjsConf || {};
declare function encodeHtmlForm(o?: any): string;
const userConf = localStorage;
type A = any;

export function runInit(app: KktjsApp): void {
  const a = app as A;
            a.showDetail = false;
            a.showAcct = false;
            a.showNotif = false;
            a.showMulti = false;
            if (a.showForm) {
                a.saveKatsu();
                a.showForm = false;
            }
            a.showSearch = false;
            a.showStream = false;
            a.showSetting = false;
            a.showLink = false;
            a.showHome = false;
            a.showLocal = false;
            a.home_type = "Home";
            a.local_type = "Local";
            a.multi_type = 'Direct';
            a.multi_target = '';
            if (1 == a.optColumns) {
                a.optMode = true;
                if ('2' == a.optPtl) {
                    a.showHome = true;
                } else {
                    a.showLocal = true;
                }
                return;
            }
            if (0x2 == a.optColumns) {
                a.optMode = true;
                a.showHome = true;
                a.showLocal = true;
                return;
            }
            a.optMode = false;
            a.showHome = true;
            a.showLocal = true;
            a.showNotif = true;
}

export function runCustom(app: KktjsApp): void {
  const a = app as A;
            a.showHome = true;
            a.showLocal = true;
            if (1 == a.optColumns) {
                a.optMode = true;
                if (!a.showNotif && !a.showDetail && !a.showAcct && !a.showMulti) {
                    if ('2' != a.optPtl) {
                        a.showHome = false;
                    } else {
                        a.showLocal = false;
                    }
                } else {
                    a.showHome = false;
                    a.showLocal = false;
                }
                return;
            }
            if (0x2 == a.optColumns) {
                a.optMode = true;
                if (a.showNotif || a.showDetail || a.showAcct || a.showMulti) {
                    if ('2' != a.optPtl) {
                        a.showHome = false;
                    } else {
                        a.showLocal = false;
                    }
                }
                return;
            }
            a.optMode = false;
            if (!a.showNotif && !a.showDetail && !a.showAcct && !a.showMulti) {
                a.runNotif('all');
            }
}

export function runHome(app: KktjsApp): void {
  const a = app as A;
            if (!a.showHome) {
                a.home_posy = 0;
            }
            if (!a.showHomeOption && a.home_posy != 0) {
                setTimeout(function () {
                    (app as any).upHome();
                }, 0);
            } else {
                a.showHomeOption = a.showHome && !a.showHomeOption ? true : false;
            }
            if (a.optMode) {
                a.showHome = true;
                if (0x2 == a.optColumns) {
                    a.showLocal = true;
                } else {
                    a.showLocal = false;
                }
                a.showDetail = false;
                a.showAcct = false;
                a.showNotif = false;
                a.showMulti = false;
                if (a.showForm) {
                    a.saveKatsu();
                    a.showForm = false;
                }
                a.showSearch = false;
                a.showStream = false;
                a.showSetting = false;
                a.showLink = false;
            }
}

export function runLocal(app: KktjsApp, arg0: any): void {
  const a = app as A;
            if (!a.showLocal) {
                a.local_posy = 0;
            }
            if (!a.showLocalOption && a.local_posy != 0) {
                setTimeout(function () {
                    (app as any).upLocal();
                }, 0);
            } else {
                a.showLocalOption = a.showLocal && !a.showLocalOption && a.local_type == arg0 ? true : false;
            }
            if (a.optMode) {
                a.showLocal = true;
                if (0x2 == a.optColumns) {
                    a.showHome = true;
                } else {
                    a.showHome = false;
                }
                a.showDetail = false;
                a.showAcct = false;
                a.showNotif = false;
                a.showMulti = false;
                if (a.showForm) {
                    a.saveKatsu();
                    a.showForm = false;
                }
                a.showSearch = false;
                a.showStream = false;
                a.showSetting = false;
                a.showLink = false;
            }
}

export function runNotif(app: KktjsApp, arg0: any): void {
  const a = app as A;
            a.notif_type = '';
            a.showNotifOption = a.showNotif && !a.showNotifOption ? true : false;
            if ("all" == arg0) {
                a.notif_unread = 0;
                a.notif_unread_filter = {
                    'mention': 0,
                    'fav': 0,
                    'reblog': 0,
                    'follow': 0,
                    'others': 0,
                    'complete': true
                };
                a.notif_id = a.hasNotif ? a.notifs[a.notifs.length - 1].id : '';
                a.notif_id_bookmark = a.hasNotif ? a.notifs[0].id : a.notif_id_bookmark;
                a.countNotifUnread();
                a.notifs_filter = a.notifs.slice();
                a.upNotif();
                a.fetch_comp.notif_filter = a.fetch_comp.notif;
                a.fetch_lock.notif = a.hasNotif ? false : true;
            } else if ('mention' == arg0) {
                a.resetNotifColumn();
                a.notif_unread_filter.mention = 0;
                a.fetchNotifMention();
            } else if ('fav' == arg0) {
                a.resetNotifColumn();
                a.notif_unread_filter.fav = 0;
                a.fetchNotifFav();
            } else if ('reblog' == arg0) {
                a.resetNotifColumn();
                a.notif_unread_filter.reblog = 0;
                a.fetchNotifReblog();
            } else if ('follow' == arg0) {
                a.resetNotifColumn();
                a.notif_unread_filter.follow = 0;
                a.fetchNotifFollow();
            }
            a.showNotif = true;
            if (a.optMode) {
                if (0x2 == a.optColumns) {
                    if (0x2 == a.optPtl) {
                        a.showHome = true;
                        a.showLocal = false;
                    } else {
                        a.showLocal = true;
                        a.showHome = false;
                    }
                } else {
                    a.showHome = false;
                    a.showLocal = false;
                }
                if (a.showForm) {
                    a.saveKatsu();
                    a.showForm = false;
                }
                a.showSearch = false;
                a.showStream = false;
                a.showSetting = false;
                a.showLink = false;
            }
            a.showDetail = false;
            a.showAcct = false;
            a.showMulti = false;
}

export function runUser(app: KktjsApp, arg0: any): void {
  const a = app as A;
            if (0 == a.user.length) {
                console.log("undefined my acct");
                return;
            }
            if ('fav' == arg0 && a.acct_type == arg0 && a.showAcct) {
                a.toggleSetting();
                return;
            }
            a.showAcctOption = false;
            a.acct = [];
            a.accts = [];
            a.acct_pinned = [];
            a.acct_id = '';
            a.acct_targetid = a.user.id;
            a.acct_relation = [{
                'locking': false,
                'domain_blocking': false,
                'followed_by': false,
                'following': false,
                'id': a.user.id,
                'muting': false,
                'muting_notifications': false,
                'requested': false,
                'showing_reblogs': false
            }];
            a.fetchAcctProfile();
            if ('katsu' == arg0) {
                a.fetchAcctAll();
            } else if ('media' == arg0) {
                a.fetchAcctMedia();
            } else if ('follow' == arg0) {
                a.fetchAcctFollow();
            } else if ("follower" == arg0) {
                a.fetchAcctFollower();
            } else if ('fav' == arg0 || "fav_force" == arg0) {
                a.fetchAcctFav();
            } else if ('mute' == arg0) {
                a.fetchAcctMute();
            } else if ('block' == arg0) {
                a.fetchAcctBlock();
            } else if ('request' == arg0) {
                a.fetchAcctFollowRequest();
            }
            if (a.optMode) {
                if (0x2 == a.optColumns) {
                    if (0x2 == a.optPtl) {
                        a.showHome = true;
                        a.showLocal = false;
                    } else {
                        a.showLocal = true;
                        a.showHome = false;
                    }
                } else {
                    a.showHome = false;
                    a.showLocal = false;
                }
                if (a.showForm) {
                    a.saveKatsu();
                    a.showForm = false;
                }
                a.showSearch = false;
                a.showStream = false;
                a.showSetting = false;
                a.showLink = false;
            }
            a.showNotif = false;
            a.showDetail = false;
            a.showMulti = false;
            a.showAcct = true;
}

export function runMulti(app: KktjsApp, arg0: any, arg1: any): void {
  const a = app as A;
            if (a.showMulti && arg0 == "top") {
                a.toggleStream();
                return;
            }
            if (!a.showMulti) {
                a.multi_posy = 0;
            }
            if (a.multi_posy != 0) {
                setTimeout(function () {
                    (app as any).upMulti();
                }, 0);
            }
            a.showMulti = true;
            if (a.optMode) {
                if (0x2 == a.optColumns) {
                    if (0x2 == a.optPtl) {
                        a.showHome = true;
                        a.showLocal = false;
                    } else {
                        a.showLocal = true;
                        a.showHome = false;
                    }
                } else {
                    a.showHome = false;
                    a.showLocal = false;
                }
                if (a.showForm) {
                    a.saveKatsu();
                    a.showForm = false;
                }
                a.showSearch = false;
                a.showStream = false;
                a.showSetting = false;
                a.showLink = false;
            }
            a.showDetail = false;
            a.showAcct = false;
            a.showNotif = false;
}

export function runDetail(app: KktjsApp, arg0: any): void {
  const a = app as A;
            a.detail = [];
            a.detail_fav = [];
            a.detail_reblog = [];
            a.detail_chain = [];
            a.detail_targetid = arg0;
            a.fetchDetail();
            a.showDetail = true;
            if (a.optMode) {
                if (0x2 == a.optColumns) {
                    if (0x2 == a.optPtl) {
                        a.showHome = true;
                        a.showLocal = false;
                    } else {
                        a.showLocal = true;
                        a.showHome = false;
                    }
                } else {
                    a.showHome = false;
                    a.showLocal = false;
                }
            }
            a.showNotif = false;
            a.showAcct = false;
            a.showMulti = false;
}

export function runAcct(app: KktjsApp, arg0: any): void {
  const a = app as A;
            a.showAcctOption = false;
            a.acct = [];
            a.accts = [];
            a.acct_pinned = [];
            a.acct_relation = [];
            a.acct_id = '';
            a.acct_targetid = arg0;
            a.fetchAcctProfile();
            a.fetchAcctAll();
            a.showAcct = true;
            if (a.optMode) {
                if (0x2 == a.optColumns) {
                    if (0x2 == a.optPtl) {
                        a.showHome = true;
                        a.showLocal = false;
                    } else {
                        a.showLocal = true;
                        a.showHome = false;
                    }
                } else {
                    a.showHome = false;
                    a.showLocal = false;
                }
            }
            a.showNotif = false;
            a.showDetail = false;
            a.showMulti = false;
}

export function runReply(app: KktjsApp, arg0: any): void {
  const a = app as A;
            a.showForm = true;
            a.showSearch = false;
            a.showStream = false;
            a.showSetting = false;
            a.showLink = false;
            a.refreshKatsu();
            var _0x13d3f4 = '';
            var _0x25900a = new Array();
            const thisObj: A = a;
            if (null != arg0 && arg0.account) {
                _0x13d3f4 = '@' + arg0.account.acct;
                a.katsu.in_reply_to_id = arg0.id;
                a.katsu.reply = arg0;
                a.katsu.visibility = a.katsu.reply.visibility;
            } else {
                _0x13d3f4 = '@' + arg0.acct;
                a.showFormVisible = true;
                a.katsu.visibility = "unlisted";
            }
            if (null != arg0.mentions) {
                arg0.mentions.forEach(function (_0x846e8a, _0x51b06a) {
                    if ('@' + _0x846e8a.acct != _0x13d3f4 && thisObj.user.acct != _0x846e8a.acct) {
                        _0x25900a.unshift('@' + _0x846e8a.acct);
                    }
                });
            }
            a.katsu_content_text = _0x13d3f4 + '\x20' + _0x25900a.join('\x20');
            var _0xcd18d7 = document.getElementById('katsu_spoiler') as HTMLInputElement;
            var _0x122dfe = document.getElementById('katsu_content') as HTMLInputElement;
            if (_0xcd18d7 != null && _0x122dfe != null) {
                _0xcd18d7.value = a.katsu_spoiler_text;
                _0x122dfe.value = a.katsu_content_text;
            }
}

export function runToast(app: KktjsApp, arg0: any): void {
  const a = app as A;
            if (!a.result_lock && arg0) {
                if ('notif' == a.result_type) {
                    a.runNotif("all");
                }
            }
            a.result_text = '';
            a.error_cnt = 0;
            a.result_type = '';
            a.result_lock = false;
}

export function runAuthClient(app: KktjsApp): void {
  const a = app as A;
            const thisObj: A = a;
            const __c: any = __conf();
            var _0x159ef3 = [];
            var _0x4cb2fe = {
                'redirect_uris': thisObj.autologin ? __c.redirect_url : __c.redirect_sub,
                'client_name': 'kktjs(webapp)_beta',
                'scopes': 'read write follow',
                'website': 'https://aikatsukamen.github.io'
            };
            var request = new XMLHttpRequest();
            request.open('POST', CLIENT.replace('[I]', thisObj.repository), true);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) { } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj.popError(request.responseText, request.status, 'Login');
                }
            }
                ;
            request.send(encodeHtmlForm(_0x4cb2fe));
}

export function runUserId(app: KktjsApp): void {
  const a = app as A;
            if (a.search_userid.indexOf('/') != -0x1) {
                a.detail_targetid = a.search_userid.split('/')[1];
                a.runDetail(a.detail_targetid);
                return;
            }
            a.accts = [];
            a.acct_targetid = '';
            var _0x37a433 = a;
            var _0x3d8db3 = [];
            var request = new XMLHttpRequest();
            request.open('GET', SEARCH.replace('[I]', _0x37a433.repository).replace("[STR]", _0x37a433.search_userid));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x37a433.at);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (JSON.parse(request.responseText).accounts.length && _0x37a433.search_userid == JSON.parse(request.responseText).accounts[0].acct) {
                        _0x37a433.acct_targetid = JSON.parse(request.responseText).accounts[0].id;
                    }
                    _0x37a433.runAcct(_0x37a433.acct_targetid);
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x37a433.popError(request.responseText, request.status, 'Search');
                }
            }
                ;
            request.send();
}

export function runListSearch(app: KktjsApp): void {
  const a = app as A;
            if (a.stream_list_type != "search") {
                a.stream_list_type = "search";
                a.stream_list_following = false;
                a.resetStreamList();
            }
            a.fetch_lock.lists = false;
}

export function runSettingUser(app: KktjsApp): void {
  const a = app as A;
            userConf.setItem('work_user', JSON.stringify(a.user));
}

export function runSettingDrafts(app: KktjsApp): void {
  const a = app as A;
            userConf.setItem('work_drafts', JSON.stringify(a.content_text_drafts));
}

export function runSettingKatsuDrafts(app: KktjsApp): void {
  const a = app as A;
            userConf.setItem('work_katsu_drafts', JSON.stringify(a.katsu_drafts));
}

export function runSettingStreamHashtags(app: KktjsApp): void {
  const a = app as A;
            userConf.setItem('work_stream_hashtags', JSON.stringify(a.stream_hashtags));
}

export function runSettingBookmark(app: KktjsApp): void {
  const a = app as A;
            userConf.setItem('work_bookmark', JSON.stringify(a.local_id_bookmark));
}

export function runSettingBookmarkNotif(app: KktjsApp): void {
  const a = app as A;
            userConf.setItem('work_bookmark_notif', JSON.stringify(a.notif_id_bookmark));
}

export function runBookmark(app: KktjsApp, arg0: any, arg1: any): void {
  const a = app as A;
            if (true !== arg1) {
                a.confirm(arg0, "bookmark");
                return;
            }
            a.local_id_bookmark = arg0.id;
}

export function runAddList(app: KktjsApp): void {
  const a = app as A;
            if (a.fetch_lock.lists) {
                return;
            }
            var _0x28ffab = a;
            var _0x22da9c = [];
            var _0x31c4c6 = {
                'title': a.stream_list_text
            };
            _0x28ffab.fetch_lock.lists = true;
            // fetch_lock は $data のネストプロパティ。同期変更は reactivity で反映（検証済み）。
            var request = new XMLHttpRequest();
            request.open('POST', LIST_ALL.replace('[I]', _0x28ffab.repository), true);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer\x20' + _0x28ffab.at);
            request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x28ffab.fetchStreamList();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x28ffab.popError(request.responseText, request.status, 'List');
                }
                (document.getElementById("list_name_new") as HTMLInputElement).value = '';
                _0x28ffab.fetch_lock.lists = false;
                _0x28ffab['$forceUpdate']();
            }
                ;
            request.send(encodeHtmlForm(_0x31c4c6));
}

export function runRemoveList(app: KktjsApp, arg0: any, arg1: any): void {
  const a = app as A;
            if (a.fetch_lock.lists) {
                return;
            }
            var _0x45cd89 = a;
            var _0x51ac2d = [];
            _0x45cd89.fetch_lock.lists = true;
            // fetch_lock は $data のネストプロパティ。同期変更は reactivity で反映（検証済み）。
            var request = new XMLHttpRequest();
            request.open("DELETE", LIST_OBJ.replace('[I]', _0x45cd89.repository).replace('[LID]', arg0), true);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x45cd89.at);
            request.setRequestHeader("Content-type", 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x45cd89.fetchStreamList();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x45cd89.popError(request.responseText, request.status, 'List');
                }
                _0x45cd89.fetch_lock.lists = false;
                _0x45cd89['$forceUpdate']();
            }
                ;
            request.send(encodeHtmlForm());
}

export function runExtime(app: KktjsApp): void {
  const a = app as A;
            var _0x49c9f7 = (app as any).$data.katsu.poll_work.extime[0] * 0x15180 + (app as any).$data.katsu.poll_work.extime[1] * 0xe10 + (app as any).$data.katsu.poll_work.extime[2] * 0x3c;
            if (_0x49c9f7 < 0x12c) {
                _0x49c9f7 = 0x12c;
                (app as any).$data.katsu.poll_work.extime = [0, 0, 0x5];
            } else if (_0x49c9f7 > LIMIT_POLLEXPIRE) {
                _0x49c9f7 = LIMIT_POLLEXPIRE;
                (app as any).$data.katsu.poll_work.extime = [0x1c, 0, 0x0];
            }
            (app as any).$data.katsu.poll.expires_in = _0x49c9f7;
}
