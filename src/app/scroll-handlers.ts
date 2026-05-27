// スクロール/ホイール駆動の取得・トリミング（legacy から機械変換で移行）。
// debounce ラッパは legacy 側に残し、本体のみ TS に委譲（timing を厳密維持）。
import type { KktjsApp } from '../types/kktjs-app';
import { LIMIT, LIMIT_NOTIF } from '../core/constants';
// threshold_* は created で再代入される可変値のため __kktjsConf ブリッジから都度読む。
const __conf = (): any => (window as any).__kktjsConf || {};
type A = any;

export function handleWheel(app: KktjsApp, arg0: any): void {
  const a = app as A;
            if (!a.result_lock) {
                a.result_type = '';
                a.result_text = '';
                a.error_cnt = 0;
            }
}

export function handleScrollHome(app: KktjsApp, arg0: any): void {
  const a = app as A;
            const threshold_low: number = __conf().threshold_low;
            const threshold_high: number = __conf().threshold_high;
            if (!a.result_lock) {
                a.result_type = '';
                a.result_text = '';
                a.error_cnt = 0;
            }
            a.home_posy = parseInt(String(arg0.target.scrollTop));
            a.home_posy_b = parseInt(String(arg0.target.scrollHeight - arg0.target.clientHeight - arg0.target.scrollTop));
            if (!a.fetch_lock.home && a.home_posy != a.home_posy_b && threshold_low >= a.home_posy_b && 0 <= a.home_posy_b) {
                a.fetch_lock.home = true;
                a.home_unread = a.homes.length - LIMIT;
                a.fetchHome();
            } else if (!a.fetch_lock.home && a.home_posy != a.home_posy_b && threshold_high >= a.home_posy && 0 <= a.home_posy_b) {
                if (a.home_unread - LIMIT < 0) {
                    a.home_unread = 0;
                    a.homes.splice(LIMIT);
                    a.home_id = a.hasHome ? a.homes[a.homes.length - 1].id : '';
                    a.fetch_comp.home = false;
                    return;
                }
                a.home_unread = a.home_unread - LIMIT;
                if (0 >= a.home_posy) {
                    a.jumpKatsu('home', a.homes[LIMIT + a.home_unread].id);
                }
            } else if (a.homes.length - 1 - a.home_unread > LIMIT * 2) {
                a.homes.splice(a.home_unread + LIMIT * 2);
                a.home_id = a.hasHome ? a.homes[a.homes.length - 1].id : '';
                a.fetch_comp.home = false;
            }
}

export function handleScrollLocal(app: KktjsApp, arg0: any): void {
  const a = app as A;
            const threshold_low: number = __conf().threshold_low;
            const threshold_high: number = __conf().threshold_high;
            if (!a.result_lock) {
                a.result_type = '';
                a.result_text = '';
                a.error_cnt = 0;
            }
            a.local_posy = parseInt(String(arg0.target.scrollTop));
            a.local_posy_b = parseInt(String(arg0.target.scrollHeight - arg0.target.clientHeight - arg0.target.scrollTop));
            if (!a.fetch_lock.local && a.local_posy != a.local_posy_b && threshold_low >= a.local_posy_b && 0 <= a.local_posy_b) {
                a.fetch_lock.local = true;
                a.local_unread = a.locals.length - LIMIT;
                a.fetchLocal();
            } else if (!a.fetch_lock.local && a.local_posy != a.local_posy_b && threshold_high >= a.local_posy && 0 <= a.local_posy) {
                if (a.local_unread - LIMIT < 0) {
                    a.local_unread = 0;
                    a.locals.splice(LIMIT);
                    a.local_id = a.hasLocal ? a.locals[a.locals.length - 1].id : '';
                    a.fetch_comp.local = false;
                    return;
                }
                a.local_unread = a.local_unread - LIMIT;
                if (0 >= a.local_posy) {
                    a.jumpKatsu('local', a.locals[LIMIT + a.local_unread].id);
                }
            } else if (a.locals.length - 1 - a.local_unread > LIMIT * 2) {
                a.locals.splice(a.local_unread + LIMIT * 2);
                a.local_id = a.hasLocal ? a.locals[a.locals.length - 1].id : '';
                a.fetch_comp.local = false;
            }
}

export function handleScrollMulti(app: KktjsApp, arg0: any): void {
  const a = app as A;
            const threshold_low: number = __conf().threshold_low;
            const threshold_high: number = __conf().threshold_high;
            if (!a.result_lock) {
                a.result_type = '';
                a.result_text = '';
                a.error_cnt = 0;
            }
            a.multi_posy = parseInt(String(arg0.target.scrollTop));
            a.multi_posy_b = parseInt(String(arg0.target.scrollHeight - arg0.target.clientHeight - arg0.target.scrollTop));
            if (!a.fetch_lock.multi && a.multi_posy != a.multi_posy_b && threshold_low >= a.multi_posy_b && 0 <= a.multi_posy_b) {
                a.fetch_lock.multi = true;
                a.multi_unread = a.multis.length - LIMIT;
                a.fetchMulti();
            } else if (!a.fetch_lock.multi && a.multi_posy != a.multi_posy_b && threshold_high >= a.multi_posy && 0 <= a.multi_posy) {
                if (a.multi_unread - LIMIT < 0) {
                    a.multi_unread = 0;
                    a.multis.splice(LIMIT);
                    a.multi_id = a.hasMulti ? a.multis[a.multis.length - 1].id : '';
                    a.fetch_comp.multi = false;
                    return;
                }
                a.multi_unread = a.multi_unread - LIMIT;
                if (0 >= a.multi_posy) {
                    a.jumpKatsu('multi', a.multis[LIMIT + a.multi_unread].id);
                }
            } else if (a.multis.length - 1 - a.multi_unread > LIMIT * 2) {
                a.multis.splice(a.multi_unread + LIMIT * 2);
                a.multi_id = a.hasMulti ? a.multis[a.multis.length - 1].id : '';
                a.fetch_comp.multi = false;
            }
}

export function handleScrollNotif(app: KktjsApp, arg0: any): void {
  const a = app as A;
            const threshold_low: number = __conf().threshold_low;
            const threshold_high: number = __conf().threshold_high;
            if (!a.result_lock) {
                a.result_type = '';
                a.result_text = '';
                a.error_cnt = 0;
            }
            a.notif_posy = parseInt(String(arg0.target.scrollTop));
            a.notif_posy_b = parseInt(String(arg0.target.scrollHeight - arg0.target.clientHeight - arg0.target.scrollTop));
            if (!a.fetch_lock.notif && a.notif_posy != a.notif_posy_b && threshold_low >= a.notif_posy_b) {
                a.fetch_lock.notif = true;
                a.notif_unread = a.notifs_filter.length - LIMIT_NOTIF;
                if (a.notif_type == '') {
                    a.fetchNotifAll();
                } else if (a.notif_type == 'mention') {
                    a.fetchNotifMention();
                } else if (a.notif_type == 'fav') {
                    a.fetchNotifFav();
                } else if (a.notif_type == 'reblog') {
                    a.fetchNotifReblog();
                } else if (a.notif_type == 'follow') {
                    a.fetchNotifFollow();
                }
            } else if (!a.fetch_lock.notif && a.notif_posy != a.notif_posy_b && threshold_high >= a.notif_posy) {
                if (a.notif_unread - LIMIT_NOTIF < 0) {
                    a.notif_unread = 0;
                    if ('mention' == a.notif_type) {
                        a.notif_unread_filter.mention = 0;
                    } else if ('fav' == a.notif_type) {
                        a.notif_unread_filter.fav = 0;
                    } else if ('reblog' == a.notif_type) {
                        a.notif_unread_filter.reblog = 0;
                    } else if ('follow' == a.notif_type) {
                        a.notif_unread_filter.follow = 0;
                    } else {
                        a.notif_unread_filter.others = 0;
                    }
                    return;
                }
                a.notif_unread = a.notif_unread - LIMIT_NOTIF;
                if (0 >= a.notif_posy) {
                    a.jumpKatsu('notif', a.notifs_filter[LIMIT_NOTIF + a.notif_unread].id);
                }
            } else if (a.notifs_filter.length - 1 - a.notif_unread > LIMIT_NOTIF * 2) {
                a.notifs_filter.splice(a.notif_unread + LIMIT_NOTIF * 2);
                a.notif_id = a.hasnotif ? a.notifs_filter[a.notifs_filter.length - 1].id : '';
                a.fetch_comp.notif_filter = false;
            }
            if ((a.ua == 'ios' || a.uaop == 'macos_safari') && a.notifs_filter.length - 1 - a.notif_unread > LIMIT * 2) {
                arg0.target.scrollTop = arg0.target.clientHeight + a.notif_posy_b / ((a.notifs_filter.length - a.notif_unread) / LIMIT - 0x1);
            }
}

export function handleScrollAcct(app: KktjsApp, arg0: any): void {
  const a = app as A;
            if (!a.result_lock) {
                a.result_type = '';
                a.result_text = '';
                a.error_cnt = 0;
            }
            var _0x4b3a7e = parseInt(String(arg0.target.scrollTop));
            var _0x5c913c = parseInt(String(arg0.target.scrollHeight - arg0.target.clientHeight - arg0.target.scrollTop));
            if (!a.fetch_lock.acct && _0x4b3a7e != _0x5c913c && 1 > _0x5c913c) {
                a.fetch_lock.acct = true;
                if (a.acct_type == 'katsu') {
                    a.fetchAcctAll();
                } else if (a.acct_type == 'media') {
                    a.fetchAcctMedia();
                } else if (a.acct_type == 'fav') {
                    a.fetchAcctFav();
                } else if (a.acct_type == 'follow') {
                    a.fetchAcctFollow();
                } else if (a.acct_type == "follower") {
                    a.fetchAcctFollower();
                } else if (a.acct_type == 'mute') {
                    a.fetchAcctMute();
                } else if (a.acct_type == 'block') {
                    a.fetchAcctBlock();
                } else if (a.acct_type == "request") {
                    a.fetchAcctFollowRequest();
                }
            }
}
