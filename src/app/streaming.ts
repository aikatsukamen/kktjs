// ストリーミング（WebSocket 接続/再接続）。legacy から機械変換で移行。
// ソケット変数・共有定数は window.__kktjsStream ブリッジ経由（モジュール境界を跨ぐため）。
// 本番検証済みの dedup/onmessage/再接続ロジックを忠実に維持する。
import type { KktjsApp } from '../types/kktjs-app';
import { popNotif } from '../core/utils';
declare const app: any;
const KKT1_LASTID = 4919581;
const LIMIT = 0x28;
const LIMIT_NOTIF = 0x1e;
type A = any;

// --- 再接続バックオフ ---
// 以前は onclose（200ms debounce）で即座に refetch + 再接続していたため、
// ネットワーク断や接続拒否で WebSocket が即失敗すると、約200ms 間隔で
// タイムライン取得と再接続を無限に繰り返していた。
// ストリームごとに失敗回数を数え、連続失敗時は待ち時間を倍々に延ばす。
const BACKOFF_BASE_MS = 1000;   // 2回目の再接続待ち
const BACKOFF_MAX_MS = 30000;   // 待ち時間の上限
const STABLE_MS = 10000;        // この時間以上つながっていたら失敗回数をリセット
type StreamKey = 'home' | 'local' | 'multi';
type Backoff = { attempt: number; timer: ReturnType<typeof setTimeout> | null; openedAt: number };
const backoffs: Record<StreamKey, Backoff> = {
  home: { attempt: 0, timer: null, openedAt: 0 },
  local: { attempt: 0, timer: null, openedAt: 0 },
  multi: { attempt: 0, timer: null, openedAt: 0 },
};

/** 接続確立を記録する（一定時間安定していれば次の切断時に失敗回数をリセットするため）。 */
function noteStreamOpen(key: StreamKey): void {
  backoffs[key].openedAt = Date.now();
}

/** 次の再接続までの待ち時間（ms）。1回目は即時、以降 1s,2s,4s… 最大30s、±20%の揺らぎ付き。 */
export function streamBackoffDelay(attempt: number): number {
  if (attempt <= 0) return 0;
  const base = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * Math.pow(2, attempt - 1));
  const jitter = base * 0.2 * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(base + jitter));
}

/** 切断時の再接続をバックオフ付きで予約する。予約済みなら重ねて予約しない。 */
function scheduleStreamReconnect(key: StreamKey, run: () => void): void {
  const b = backoffs[key];
  if (b.openedAt && Date.now() - b.openedAt >= STABLE_MS) {
    b.attempt = 0;
  }
  b.openedAt = 0;
  if (b.timer) return;
  const delay = streamBackoffDelay(b.attempt);
  b.attempt++;
  b.timer = setTimeout(function () {
    b.timer = null;
    run();
  }, delay);
}

/** バックオフ状態を初期化する（アプリ復帰などユーザー起点の強制再接続時に呼ぶ）。 */
export function resetStreamBackoff(): void {
  (Object.keys(backoffs) as StreamKey[]).forEach(function (k) {
    const b = backoffs[k];
    if (b.timer) clearTimeout(b.timer);
    b.timer = null;
    b.attempt = 0;
    b.openedAt = 0;
  });
}
(window as any).kktjsResetStreamBackoff = resetStreamBackoff;
(window as any).__kktjsStreamBackoffs = backoffs; // 検証用

export function openWsHome(app: KktjsApp): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む（import時は未設定のため）
            const thisObj: A = a;
            var _0x3cfda4 = S.ST_HOME;
            if (S.wsHome == null && thisObj.at != null) {
                S.wsHome = new WebSocket(_0x3cfda4.replace('[I]', thisObj.repository).replace('[AT]', thisObj.at));
                S.wsHome.onopen = onopen;
                S.wsHome.onclose = S._.debounce(_0x3b7770, 200);
                S.wsHome.onerror = onerror;
                S.wsHome.onmessage = onmessage;
                function onopen() {
                    noteStreamOpen('home');
                    setTimeout(function () {
                        try {
                            thisObj.connHome = 'open';
                            thisObj.fetch_lock.homews = false;
                            S.wsHome.send('5j');
                        } catch (_0x1c206b) {
                            onerror();
                        }
                    }, 0x1f4);
                }
                ; function _0x3b7770(e?: any) {
                    thisObj.fetch_lock.homews = true;
                    thisObj.connHome = 'ready';
                    S.wsHome = null;
                    if (thisObj.app_active) {
                        scheduleStreamReconnect('home', function () {
                            // 待機中に強制再接続などで既に張り直されていれば何もしない。
                            if (S.wsHome != null || !thisObj.app_active) return;
                            thisObj.refetchHome();
                            thisObj.refetchNotifAll();
                            thisObj.openWsHome();
                        });
                    } else {
                        thisObj.app_network = false;
                    }
                }
                ; function onerror(e?: any) {
                    thisObj.connHome = 'lost';
                    if (S.wsHome != null) {
                        thisObj.fetch_lock.homews = true;
                        thisObj.connHome = 'close';
                        S.wsHome.close();
                    }
                }
                ; function onmessage(e?: any) {
                    var _0x109fd1 = JSON.parse(e.data);
                    var _0x1c8865 = JSON.parse(_0x109fd1.payload);
                    if ("update" == _0x109fd1.event) {
                        if (null == thisObj.homes[0] || null != thisObj.homes[0] && thisObj.home_id > KKT1_LASTID && thisObj.home_id > _0x1c8865.id) {
                            return;
                        }
                        // 重複ガード: 既に同一IDが home に存在するなら挿入しない（復帰再接続との競合対策）
                        if (S.alreadyInTimeline(thisObj.homes, _0x1c8865)) {
                            return;
                        }
                        if (0 == thisObj.home_posy && 0 == thisObj.home_unread) {
                            thisObj.homes.splice(LIMIT - 0x1);
                            thisObj.home_id = thisObj.hasHome ? thisObj.homes[thisObj.homes.length - 1].id : '';
                            thisObj.fetch_comp.home = false;
                        } else {
                            thisObj.home_unread = thisObj.home_unread + 1;
                        }
                        _0x1c8865.loading_avatar = true;
                        if (null != _0x1c8865.reblog && 0 != _0x1c8865.reblog.media_attachments || 0 != _0x1c8865.media_attachments) {
                            _0x1c8865.loading_media = true;
                        }
                        thisObj.updateWrapperBM(_0x1c8865, "socket");
                        thisObj.updateFilterBM(_0x1c8865, "socket");
                        thisObj.homes.unshift(_0x1c8865);
                        // Vue 3 proxy は unshift を追跡するため reactivity で新着が表示される。
                        // openImage は $nextTick 内で proxy 経由で呼ぶことで loading_avatar も解除（検証済み）。
                        thisObj.$nextTick(function () {
                            // Vue 3: 生オブジェクト直接変更では reactivity が発火しないため、
                            // 配列経由（reactive proxy）でアクセスして openImage を呼ぶ。これをしないと
                            // 最新 1 件の loading_avatar=true が解除されず、アバター部分が空のままになる。
                            var _r = thisObj.homes[0];
                            if (!_r || _r.id !== _0x1c8865.id) {
                                _r = thisObj.homes.find(function (s) { return s && s.id === _0x1c8865.id; });
                            }
                            if (_r) thisObj.openImage(_r);
                        });
                    } else if ("notification" == _0x109fd1.event) {
                        if (null == thisObj.notifs[0] || null != thisObj.notifs[0] && thisObj.notif_id > KKT1_LASTID && thisObj.notif_id > _0x1c8865.id) {
                            return;
                        }
                        // 重複ガード: 既に同一IDの通知が存在するなら挿入しない（二重接続対策）
                        if (S.alreadyInTimeline(thisObj.notifs, _0x1c8865)) {
                            return;
                        }
                        if (thisObj.showNotif && 0 == thisObj.notif_posy && 0 == thisObj.notif_unread && thisObj.notifJudge(_0x1c8865)) {
                            thisObj.notifs_filter.splice(LIMIT_NOTIF - 0x1);
                            thisObj.notif_id = thisObj.hasNotif ? thisObj.notifs_filter[thisObj.notifs_filter.length - 1].id : '';
                            thisObj.notif_id_bookmark = _0x1c8865.id;
                            thisObj.countNotifUnread();
                            thisObj.fetch_comp.notif_filter = false;
                        } else {
                            if ('mention' == _0x1c8865.type) {
                                thisObj.notif_unread_filter.mention = thisObj.notif_unread_filter.mention + 1;
                            } else if ('favourite' == _0x1c8865.type) {
                                thisObj.notif_unread_filter.fav = thisObj.notif_unread_filter.fav + 1;
                            } else if ('reblog' == _0x1c8865.type) {
                                thisObj.notif_unread_filter.reblog = thisObj.notif_unread_filter.reblog + 1;
                            } else if ('follow' == _0x1c8865.type) {
                                thisObj.notif_unread_filter.follow = thisObj.notif_unread_filter.follow + 1;
                            } else {
                                thisObj.notif_unread_filter.others = thisObj.notif_unread_filter.others + 1;
                            }
                        }
                        if ("poll" == _0x1c8865.type) {
                            thisObj.updateVote(_0x1c8865.status.id, _0x1c8865.status.poll);
                        }
                        _0x1c8865.loading_avatar = true;
                        if (null != _0x1c8865.status && (null != _0x1c8865.status.reblog && 0 != _0x1c8865.status.reblog.media_attachments || 0 != _0x1c8865.status.media_attachments)) {
                            _0x1c8865.loading_media = true;
                        }
                        thisObj.notifs_filter.unshift(_0x1c8865);
                        thisObj.notifs.unshift(_0x1c8865);
                        // Vue 3 proxy は unshift を追跡（検証済み）。
                        thisObj.$nextTick(function () {
                            // Vue 3: 生オブジェクト直接変更では reactivity が発火しないため proxy 経由で。
                            var _r = thisObj.notifs[0];
                            if (!_r || _r.id !== _0x1c8865.id) {
                                _r = thisObj.notifs.find(function (s) { return s && s.id === _0x1c8865.id; });
                            }
                            if (_r) thisObj.openImage(_r);
                        });
                        var _0x2ff618 = 0 != _0x1c8865.account.display_name.length ? _0x1c8865.account.display_name : _0x1c8865.account.acct;
                        var _0x172d00 = _0x1c8865.type == 'follow' ? 'you' : "your katsu";
                        var _0x5551c0 = _0x2ff618 + '‭\x20' + _0x1c8865.type + '\x20' + _0x172d00;
                        var _0x3a5570 = {
                            'body': _0x1c8865.status ? _0x1c8865.status.spoiler_text.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '') + _0x1c8865.status.content.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '') : '',
                            'icon': _0x1c8865.account.avatar_static
                        };
                        if ('off' != thisObj.optThemeSound) {
                            thisObj.playSound("sound" + thisObj.optThemeSound);
                        }
                        if (thisObj.optShortNotif) {
                            thisObj.result_type = 'notif';
                            thisObj.result_text = _0x2ff618 + '‭\x20' + _0x1c8865.type + " - " + _0x3a5570.body;
                        }
                        if (thisObj.optPushNotif) {
                            popNotif(_0x5551c0, _0x3a5570);
                        }
                    } else if ("delete" == _0x109fd1.event) {
                        thisObj.updateDelete(_0x109fd1.payload);
                    }
                }
                ;
            }
}

export function reopenWsHome(app: KktjsApp, arg0: any): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む（import時は未設定のため）
            if (a.home_type == arg0 || a.fetch_lock.homews) {
                return;
            }
            a.fetch_lock.homews = true;
            a.connHome = "close";
            a.home_type = "Force" != arg0 && null != arg0 ? arg0 : a.home_type;
            a.resetHomeColumn();
            a.fetchHome();
            a.resetNotifColumn();
            a.notifs = [];
            a.fetch_comp.notif = false;
            a.fetchNotifAll();
            if (S.wsHome != null) {
                S.wsHome.close();
            }
}

export function openWsLocal(app: KktjsApp): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む（import時は未設定のため）
            const thisObj: A = a;
            var _0x5e7fea = thisObj.local_type == "Global" ? S.ST_GLOBAL : S.ST_LOCAL;
            if (S.wsLocal == null && thisObj.at != null) {
                S.wsLocal = new WebSocket(_0x5e7fea.replace('[I]', thisObj.repository).replace("[AT]", thisObj.at));
                S.wsLocal.onopen = _0x1d6410;
                S.wsLocal.onclose = S._.debounce(_0x8b86f8, 200);
                S.wsLocal.onerror = _0x1870a7;
                S.wsLocal.onmessage = _0x1719e1;
                function _0x1d6410() {
                    noteStreamOpen('local');
                    setTimeout(function () {
                        try {
                            thisObj.connLocal = 'open';
                            thisObj.fetch_lock.localws = false;
                            S.wsLocal.send('5j');
                        } catch (_0x11044b) {
                            _0x1870a7();
                        }
                    }, 0x1f4);
                }
                ; function _0x8b86f8(_0x4f5811?: any) {
                    thisObj.fetch_lock.localws = true;
                    thisObj.connLocal = 'ready';
                    S.wsLocal = null;
                    if (thisObj.app_active) {
                        scheduleStreamReconnect('local', function () {
                            if (S.wsLocal != null || !thisObj.app_active) return;
                            thisObj.refetchLocal();
                            thisObj.openWsLocal();
                        });
                    } else {
                        thisObj.app_network = false;
                    }
                }
                ; function _0x1870a7(_0x3a6aee?: any) {
                    thisObj.connLocal = 'lost';
                    if (S.wsLocal != null) {
                        thisObj.fetch_lock.localws = true;
                        thisObj.connLocal = "close";
                        S.wsLocal.close();
                    }
                }
                ; function _0x1719e1(_0x3ee549?: any) {
                    var _0x43b0f1 = JSON.parse(_0x3ee549.data);
                    var _0x4c2dc9 = JSON.parse(_0x43b0f1.payload);
                    var _0x55d664, _0x49f5cd;
                    if ("update" == _0x43b0f1.event) {
                        if (null == thisObj.locals[0] || null != thisObj.locals[0] && thisObj.local_id > KKT1_LASTID && thisObj.local_id > _0x4c2dc9.id) {
                            return;
                        }
                        // 重複ガード: 既に同一IDが local に存在するなら挿入しない
                        if (S.alreadyInTimeline(thisObj.locals, _0x4c2dc9)) {
                            return;
                        }
                        if (0 == thisObj.local_posy && 0 == thisObj.local_unread) {
                            thisObj.locals.splice(LIMIT - 0x1);
                            thisObj.local_id = thisObj.hasLocal ? thisObj.locals[thisObj.locals.length - 1].id : '';
                            thisObj.fetch_comp.local = false;
                        } else {
                            thisObj.local_unread = thisObj.local_unread + 1;
                        }
                        _0x4c2dc9.loading_avatar = true;
                        if (0 != _0x4c2dc9.media_attachments) {
                            _0x4c2dc9.loading_media = true;
                        }
                        thisObj.updateWrapperBM(_0x4c2dc9, "socket");
                        thisObj.updateFilterBM(_0x4c2dc9, "socket");
                        thisObj.locals.unshift(_0x4c2dc9);
                        // Vue 3 proxy は unshift を追跡（検証済み）。
                        thisObj.$nextTick(function () {
                            // Vue 3: 生オブジェクト直接変更では reactivity が発火しないため proxy 経由で。
                            var _r = thisObj.locals[0];
                            if (!_r || _r.id !== _0x4c2dc9.id) {
                                _r = thisObj.locals.find(function (s) { return s && s.id === _0x4c2dc9.id; });
                            }
                            if (_r) thisObj.openImage(_r);
                        });
                    } else if ('delete' == _0x43b0f1.event) {
                        thisObj.updateDelete(_0x43b0f1.payload);
                    }
                }
                ;
            }
}

export function reopenWsLocal(app: KktjsApp, arg0: any): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む（import時は未設定のため）
            if (a.local_type == arg0 || a.fetch_lock.localws) {
                return;
            }
            a.fetch_lock.localws = true;
            a.connLocal = "close";
            a.local_type = "Force" != arg0 && null != arg0 ? arg0 : a.local_type;
            a.resetLocalColumn();
            a.fetchLocal();
            if (S.wsLocal != null) {
                S.wsLocal.close();
            }
}

export function openWsMulti(app: KktjsApp): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む（import時は未設定のため）
            const thisObj: A = a;
            let streamingUrl = S.ST_DIRECT;
            if (thisObj.multi_type == 'List') {
                streamingUrl = S.ST_LIST.replace('[LID]', thisObj.multi_target);
            } else if (thisObj.multi_type == 'Hashtag') {
                streamingUrl = S.ST_HASHTAG.replace('[TAG]', thisObj.multi_target);
            }
            if (S.wsMulti == null && thisObj.at != null) {
                S.wsMulti = new WebSocket(streamingUrl.replace('[I]', thisObj.repository).replace('[AT]', thisObj.at));
                S.wsMulti.onopen = _0x195c15;
                S.wsMulti.onclose = S._.debounce(_0xb78230, 200);
                S.wsMulti.onerror = _0x5a9cd8;
                S.wsMulti.onmessage = onmessage;
                function _0x195c15() {
                    noteStreamOpen('multi');
                    setTimeout(function () {
                        try {
                            thisObj.connMulti = 'open';
                            thisObj.fetch_lock.multiws = false;
                            S.wsMulti.send('5j');
                        } catch (_0x577fd5) {
                            onmessage();
                        }
                    }, 0x1f4);
                }
                ; function _0xb78230(_0x35f22d?: any) {
                    thisObj.fetch_lock.multiws = true;
                    thisObj.connMulti = 'ready';
                    S.wsMulti = null;
                    if (thisObj.app_active) {
                        scheduleStreamReconnect('multi', function () {
                            if (S.wsMulti != null || !thisObj.app_active) return;
                            thisObj.refetchMulti();
                            thisObj.openWsMulti();
                        });
                    } else {
                        thisObj.app_network = false;
                    }
                }
                ; function _0x5a9cd8(_0x4b4d5?: any) {
                    thisObj.connMulti = 'lost';
                    if (S.wsMulti != null) {
                        thisObj.fetch_lock.multiws = true;
                        thisObj.connMulti = "close";
                        S.wsMulti.close();
                    }
                }
                ; function onmessage(_0xad3e45?: any) {
                    var _0x2b6070 = JSON.parse(_0xad3e45.data);
                    var _0x3e1dc6 = JSON.parse(_0x2b6070.payload);
                    var _0x5798ad, _0xd10c45;
                    if ("update" == _0x2b6070.event) {
                        if (null == thisObj.multis[0] || null != thisObj.multis[0] && thisObj.multi_id > KKT1_LASTID && thisObj.multi_id > _0x3e1dc6.id) {
                            return;
                        }
                        // 重複ガード: 既に同一IDが multi に存在するなら挿入しない
                        if (S.alreadyInTimeline(thisObj.multis, _0x3e1dc6)) {
                            return;
                        }
                        if (0 == thisObj.multi_posy && 0 == thisObj.multi_unread) {
                            thisObj.multis.splice(LIMIT - 0x1);
                            thisObj.multi_id = thisObj.hasMulti ? thisObj.multis[thisObj.multis.length - 1].id : '';
                            thisObj.fetch_comp.multi = false;
                        } else {
                            thisObj.multi_unread = thisObj.multi_unread + 1;
                        }
                        _0x3e1dc6.loading_avatar = true;
                        if (null != _0x3e1dc6.reblog && 0 != _0x3e1dc6.reblog.media_attachments || 0 != _0x3e1dc6.media_attachments) {
                            _0x3e1dc6.loading_media = true;
                        }
                        thisObj.updateWrapperBM(_0x3e1dc6, "socket");
                        thisObj.updateFilterBM(_0x3e1dc6, "socket");
                        thisObj.multis.unshift(_0x3e1dc6);
                        // Vue 3 proxy は unshift を追跡（検証済み）。
                        thisObj.$nextTick(function () {
                            // Vue 3: 生オブジェクト直接変更では reactivity が発火しないため proxy 経由で。
                            var _r = thisObj.multis[0];
                            if (!_r || _r.id !== _0x3e1dc6.id) {
                                _r = thisObj.multis.find(function (s) { return s && s.id === _0x3e1dc6.id; });
                            }
                            if (_r) thisObj.openImage(_r);
                        });
                    } else if ("delete" == _0x2b6070.event) {
                        thisObj.updateDelete(_0x2b6070.payload);
                    }
                }
                ;
            }
}

export function reopenWsMulti(app: KktjsApp, arg0: any, arg1: any): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む（import時は未設定のため）
            var _0xd643f0 = arg1;
            var _0x38d452 = arg1;
            if ('List' == arg0) {
                _0xd643f0 = arg1.id;
                _0x38d452 = arg1.title;
            }
            if (a.multi_type == arg0 && a.multi_target.toLowerCase() == (_0xd643f0 + '').toLowerCase() || a.fetch_lock.multiws) {
                return;
            }
            a.fetch_lock.multiws = true;
            a.connMulti = "close";
            if ("Force" != arg0 && null != arg0) {
                a.multi_type = arg0;
                a.multi_target = _0xd643f0;
                a.multi_name = _0x38d452;
            }
            a.resetMultiColumn();
            a.fetchMulti();
            if (S.wsMulti != null) {
                S.wsMulti.close();
            }
}
