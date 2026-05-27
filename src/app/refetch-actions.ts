// debounce 対象の取得/カウント系（legacy から機械変換で移行）。
// debounce ラッパは legacy 残置、本体のみ委譲。XHR は元実装を維持。
import type { KktjsApp } from '../types/kktjs-app';
// 定数は共有 TS モジュールから import する（app-core の const はモジュールローカルで
// 実行時グローバルにならないため、declare では実体に解決できない）。
import { HOME, LOCAL, GLOBAL, DIRECT, LIST, HASHTAG, NOTIF } from '../api/endpoints';
import { LIMIT, LIMIT_NOTIF, REQ_TIMEOUT } from '../core/constants';
declare const app: any;
type A = any;

export function refetchHome(app: KktjsApp): void {
  const a = app as A;
            const thisObj: A = a;
            var _0x174de3 = [];
            var _0x13ba1a = HOME;
            thisObj.fetch_lock.home = true;
            var _0x39a20e = 'home';
            var request = new XMLHttpRequest();
            request.open('GET', _0x13ba1a.replace('[I]', thisObj.repository).replace('[PID]', '').replace('[LM]', String(LIMIT)));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + thisObj.at);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x39a20e == 'home' && thisObj.fetch_lock.home) {
                        _0x174de3 = JSON.parse(request.responseText);
                        if (null != thisObj.homes && !thisObj.equalArr(_0x174de3, thisObj.homes)) {
                            thisObj.updateWrapperBM(_0x174de3, 'home');
                            thisObj.updateFilterBM(_0x174de3, 'home');
                            thisObj.updateImgLoading(_0x174de3);
                            thisObj.homes = _0x174de3;
                            thisObj.home_unread = 0;
                            thisObj.home_id = thisObj.homes[thisObj.homes.length - 1] ? thisObj.homes[thisObj.homes.length - 1].id : '0';
                            thisObj['$nextTick'](function () {
                                thisObj.backHome();
                                thisObj.openImageAll(_0x174de3);
                            });
                        }
                        thisObj.fetch_lock.home = false;
                        thisObj.fetch_comp.home = _0x174de3.length < LIMIT;
                        thisObj['$forceUpdate']();
                    }
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj.fetch_lock.home = false;
                    thisObj['$forceUpdate']();
                }
            }
                ;
            request.send();
}

export function refetchLocal(app: KktjsApp): void {
  const a = app as A;
            const thisObj: A = a;
            var _0x4c597d = [];
            var _0x1fc859 = thisObj.local_type == 'Global' ? GLOBAL : LOCAL;
            thisObj.fetch_lock.local = true;
            var _0x3cfcd7 = thisObj.local_type;
            var request = new XMLHttpRequest();
            request.open('GET', _0x1fc859.replace('[I]', thisObj.repository).replace('[PID]', '').replace('[LM]', String(LIMIT)));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer\x20' + thisObj.at);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x3cfcd7 == thisObj.local_type && thisObj.fetch_lock.local) {
                        _0x4c597d = JSON.parse(request.responseText);
                        if (null != thisObj.locals && !thisObj.equalArr(_0x4c597d, thisObj.locals)) {
                            thisObj.updateWrapperBM(_0x4c597d, 'local');
                            thisObj.updateFilterBM(_0x4c597d, 'local');
                            thisObj.updateImgLoading(_0x4c597d);
                            thisObj.locals = _0x4c597d;
                            thisObj.local_unread = 0;
                            thisObj.local_id = thisObj.locals[thisObj.locals.length - 1] ? thisObj.locals[thisObj.locals.length - 1].id : '0';
                            thisObj["$nextTick"](function () {
                                thisObj.backLocal();
                                thisObj.openImageAll(_0x4c597d);
                            });
                        }
                        thisObj.fetch_lock.local = false;
                        thisObj.fetch_comp.local = _0x4c597d.length < LIMIT;
                        thisObj['$forceUpdate']();
                    }
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj.fetch_lock.local = false;
                    thisObj['$forceUpdate']();
                }
            }
                ;
            request.send();
}

export function refetchMulti(app: KktjsApp): void {
  const a = app as A;
            const thisObj: A = a;
            var resList = [];
            let directUrl = DIRECT; // ★
            if (thisObj.multi_type == 'List') {
                directUrl = LIST.replace('[LID]', thisObj.multi_target);
            } else if (thisObj.multi_type == 'Hashtag') {
                directUrl = HASHTAG.replace('[TAG]', thisObj.multi_target);
            }
            thisObj.fetch_lock.multi = true;
            var _0x9d4feb = thisObj.multi_type;
            const request = new XMLHttpRequest();
            request.open('GET', directUrl.replace('[I]', thisObj.repository).replace('[PID]', '').replace('[LM]', String(LIMIT)));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + thisObj.at);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x9d4feb == thisObj.multi_type && thisObj.fetch_lock.multi) {
                        resList = JSON.parse(request.responseText);
                        // Directならcoversationを整形
                        if (thisObj.multi_type === "Direct") {
                            resList = resList.map(item => {
                                return item.last_status
                            });
                        }

                        if (null != thisObj.multis && !thisObj.equalArr(resList, thisObj.multis)) {
                            thisObj.updateWrapperBM(resList, 'multi');
                            thisObj.updateFilterBM(resList, 'multi');
                            thisObj.updateImgLoading(resList);
                            thisObj.multis = resList;
                            thisObj.multi_unread = 0;
                            thisObj.multi_id = thisObj.multis[thisObj.multis.length - 1] ? thisObj.multis[thisObj.multis.length - 1].id : '0';
                            thisObj['$nextTick'](function () {
                                thisObj.backMulti();
                                thisObj.openImageAll(resList);
                            });
                        }
                        thisObj.fetch_lock.multi = false;
                        thisObj.fetch_comp.multi = resList.length < LIMIT;
                        thisObj['$forceUpdate']();
                    }
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj.fetch_lock.multi = false;
                    thisObj['$forceUpdate']();
                }
            }
                ;
            request.send();
}

export function refetchNotifAll(app: KktjsApp): void {
  const a = app as A;
            if (a.notif_type != '') {
                a.notif_type = '';
                a.resetNotifColumn();
            }
            const thisObj: A = a;
            var _0x7b4132 = [];
            var _0x55309e = [];
            thisObj.fetch_lock.notif = true;
            var request = new XMLHttpRequest();
            request.open('GET', NOTIF.replace('[I]', thisObj.repository).replace('[PID]', '').replace('[LM]', String(LIMIT_NOTIF)));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + thisObj.at);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (thisObj.notif_type == '' && thisObj.fetch_lock.notif) {
                        _0x7b4132 = JSON.parse(request.responseText);
                        thisObj.updateWrapperBM(_0x7b4132, 'notif');
                        if (null != thisObj.notifs && !thisObj.equalArr(_0x7b4132, thisObj.notifs)) {
                            thisObj.notifs = _0x7b4132.slice();
                            thisObj.fetch_comp.notif = _0x7b4132.length < LIMIT_NOTIF;
                        }
                        if (null != thisObj.notifs_filter && !thisObj.equalArr(_0x7b4132, thisObj.notifs_filter)) {
                            thisObj.notifs_filter = _0x7b4132;
                            _0x55309e = null != request.getResponseHeader('link') ? request.getResponseHeader('link').match(/max_id=(.*?)>/) : null;
                            thisObj.notif_id = null != _0x55309e && 0 != _0x55309e[1].length ? _0x55309e[1] : '0';
                            if (thisObj.showNotif) {
                                thisObj.notif_id_bookmark = thisObj.hasNotif ? thisObj.notifs[0].id : thisObj.notif_id_bookmark;
                                thisObj.countNotifUnread();
                                thisObj["$nextTick"](function () {
                                    thisObj.upNotif();
                                });
                            }
                        }
                        thisObj.fetch_lock.notif = false;
                        thisObj.fetch_comp.notif_filter = _0x7b4132.length < LIMIT_NOTIF;
                        thisObj['$forceUpdate']();
                    }
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj.fetch_lock.notif = false;
                    thisObj['$forceUpdate']();
                }
            }
                ;
            request.send();
}

export function refreshCount(app: KktjsApp): void {
  const a = app as A;
            app['$forceUpdate']();
}

export function checkStreamListText(app: KktjsApp): void {
  const a = app as A;
            a.stream_list_text_check = a.stream_list_text != null && a.stream_list_text.length > 0 ? true : false;
}

export function checkListProfile(app: KktjsApp): void {
  const a = app as A;
            a.stream_list_profile_check = a.listprofile.name != null && a.listprofile.name.length > 0 ? true : false;
}
