// Discord 連携（legacy から機械変換で移行）。socket/定数は __kktjsStream ブリッジ経由。
import type { KktjsApp } from '../types/kktjs-app';
import { encodeHtmlForm, getParameterByName } from '../core/utils';
import { REQ_TIMEOUT } from '../core/constants';
declare const app: any;
const userConf = localStorage;
// Discord 関連の静的定数（legacy と同値）。
const LIMIT_DIS = 0x64;
const DIS_API_VER = '6';
const DIS_TOKEN = 'https://[I]/oauth2/token';
const DIS_ST = 'https://[I]/gateway';
const DIS_USER = 'https://[I]/users/@me';
const DIS_TH = 'https://[I]/channels/[CH]/messages?limit=[LM]';
const DIS_CHANNEL: any = {
  'room0': '405706906049708034',
  'room1': '305718290016370688',
  'room2': '305717014822125568',
};
const DIS_WTH1 = 'https://[I]/webhooks/405741747357089792/BJer_pYIrH5Cx6NZITjTRBWojqvUnemz8fkH9vBKCkH-1bVW8rQfQTL5ZFRDoT0MHx2I';
// 元コードで未定義のまま参照されるグローバル（実行時 undefined）。挙動を忠実に維持。
const discord_id: any = undefined;
const discord_secret: any = undefined;
type A = any;

export function fetchTokenDiscord(app: KktjsApp): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む
            var _0x12583b = a;
            var _0x2ea3de = [];
            var _0x59dacd = {
                'response_type': 'code',
                'client_id': discord_id,
                'client_secret': discord_secret,
                'grant_type': 'authorization_code',
                'code': _0x12583b.code
            };
            var request = new XMLHttpRequest();
            request.open('POST', DIS_TOKEN.replace('[I]', S.DIS_API).replace("[V]", DIS_API_VER), true);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader("Content-type", 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    userConf.setItem('at_discord', request.responseText);
                    location.href = location.origin + location.pathname;
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x12583b.popError(request.responseText, request.status, 'Login');
                }
            }
                ;
            request.send(encodeHtmlForm(_0x59dacd));
}

export function refetchTokenDiscord(app: KktjsApp): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む
            var _0x2cf9e6 = a;
            var _0x34f144 = [];
            var _0x9cff3c = {
                'response_type': 'code',
                'client_id': discord_id,
                'client_secret': discord_secret,
                'grant_type': "refresh_token",
                'refresh_token': _0x2cf9e6.at_discord.refresh_token
            };
            var request = new XMLHttpRequest();
            request.open('POST', DIS_TOKEN.replace('[I]', S.DIS_API).replace("[V]", DIS_API_VER), true);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader("Content-type", 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    userConf.setItem('at_discord', request.responseText);
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x2cf9e6.popError(request.responseText, request.status, 'Login');
                }
            }
                ;
            request.send(encodeHtmlForm(_0x9cff3c));
}

export function actKatsuDiscord(app: KktjsApp): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む
            var _0x254c57 = a;
            var _0x34969e = [];
            var date = new Date();
            var _0x38b86d = {
                'content': ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2),
                'username': _0x254c57.user_discord.username,
                'avatar_url': "https://cdn.discordapp.com/" + "avatars/" + _0x254c57.user_discord.id + '/' + _0x254c57.user_discord.avatar + ".png"
            };
            var request = new XMLHttpRequest();
            request.open('POST', DIS_WTH1.replace('[I]', S.DIS_API).replace("[V]", DIS_API_VER), true);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader("Content-type", 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) { } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x254c57.popError(request.responseText, request.status, 'Login');
                }
            }
                ;
            request.send(encodeHtmlForm(_0x38b86d));
}

export function fetchUserDiscord(app: KktjsApp): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む
            var _0x12be43 = a;
            var _0x3f5ec8 = [];
            var request = new XMLHttpRequest();
            request.open('GET', DIS_USER.replace('[I]', S.DIS_API).replace('[V]', DIS_API_VER));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer\x20' + _0x12be43.at_discord.access_token);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x12be43.user_discord = JSON.parse(request.responseText);
                    _0x12be43.actKatsuDiscord();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x12be43.popError(request.responseText, request.status, 'Discord');
                }
            }
                ;
            request.send();
}

export function fetchSocketDiscord(app: KktjsApp): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む
            var _0x1389c4 = a;
            var _0x421eac = [];
            var request = new XMLHttpRequest();
            request.open('GET', DIS_ST.replace('[I]', S.DIS_API).replace("[V]", DIS_API_VER));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x1389c4.at_discord.access_token);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    S.ST_DISCORD = JSON.parse(request.responseText).url + "?v=[V]&encoding=json";
                    _0x1389c4.openWsDiscord();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x1389c4.popError(request.responseText, request.status, "Discord");
                }
            }
                ;
            request.send();
}

export function fetchDiscord(app: KktjsApp): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む
            var _0x21069f = a;
            var _0x18a980 = [];
            var _0x30fe10 = DIS_TH;
            var _0x372485 = _0x21069f.discord_type;
            if ('' != _0x21069f.discord_id) {
                _0x30fe10 = _0x30fe10 + "&before=" + _0x21069f.discord_id;
            }
            _0x21069f.fetch_lock.discord = true;
            var request = new XMLHttpRequest();
            request.open('GET', _0x30fe10.replace('[I]', S.DIS_API).replace("[V]", DIS_API_VER).replace('[CH]', DIS_CHANNEL[_0x21069f.discord_type]).replace('[LM]', String(LIMIT_DIS)));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', "MzA1NzE1MTk5MTQ1NTQxNjQy.DUo5Ug.urLP-IQad2lPuRJ2tabPnlUpYyI");
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x372485 == _0x21069f.discord_type && _0x21069f.fetch_lock.discord) {
                        if (0 == _0x21069f.discords.length) {
                            _0x21069f.discords = JSON.parse(request.responseText);
                        } else {
                            Array.prototype.push.apply(_0x21069f.discords, JSON.parse(request.responseText));
                        }
                        _0x21069f.discord_id = _0x21069f.discords[_0x21069f.discords.length - 1] ? _0x21069f.discords[_0x21069f.discords.length - 1].id : '0';
                    }
                    _0x21069f.fetch_lock.discord = false;
                    _0x21069f.$forceUpdate();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x21069f.fetch_lock.discord = false;
                    _0x21069f.popError(request.responseText, request.status, 'Discord');
                }
            }
                ;
            request.send();
}

export function openWsDiscord(app: KktjsApp): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む
            var _0x5c41f4 = a;
            var _0xa8eda5 = S.ST_DISCORD;
            var _0x3f6294 = 0;
            if (S.wsDiscord == null && _0x5c41f4.at != null) {
                S.wsDiscord = new WebSocket(_0xa8eda5.replace("[V]", DIS_API_VER));
                S.wsDiscord.onopen = function () {
                    var _0x3b47e5 = {
                        'op': 0x2,
                        'd': {
                            'compress': false,
                            'large_threshold': 0x64,
                            'presence': {
                                'status': "online",
                                'since': 0,
                                'afk': false,
                                'game': 'kktjs'
                            },
                            'afk': false,
                            'game': null,
                            'since': 0,
                            'status': "online",
                            'properties': {
                                'os': "Windows",
                                'browser': "Chrome",
                                'device': '',
                                'referrer': '',
                                'referring_domain': ''
                            },
                            'browser': "Chrome",
                            'device': '',
                            'os': 'Windows',
                            'referrer': '',
                            'referring_domain': '',
                            'synced_guilds': [],
                            'token': ''
                        }
                    };
                    S.wsDiscord.send(JSON.stringify(_0x3b47e5));
                    _0x5c41f4.connDiscord = 'open';
                    _0x5c41f4.fetch_lock.discordws = false;
                }
                    ;
                S.wsDiscord.onclose = function (_0x5c6e6d) {
                    _0x5c41f4.connDiscord = 'ready';
                }
                    ;
                S.wsDiscord.onerror = function (_0x25d69d) {
                    _0x5c41f4.connDiscord = "err";
                }
                    ;
                S.wsDiscord.onmessage = function (_0xb14bfe) {
                    var _0x40782d = JSON.parse(_0xb14bfe.data);
                    if (0xa == _0x40782d.op) {
                        S.wsDiscord.onheartbeat(_0x40782d.d.heartbeat_interval);
                    }
                    if (0 != _0x40782d.op) {
                        return;
                    }
                    _0x3f6294 = _0x40782d.s;
                    if ("MESSAGE_CREATE" == _0x40782d.t && DIS_CHANNEL[_0x5c41f4.discord_type] == _0x40782d.d.channel_id) {
                        var _0x3a5011 = _0x40782d.d;
                        if (null == _0x5c41f4.discords[0] || null != _0x5c41f4.discords[0] && _0x5c41f4.discord_id > _0x3a5011.id) {
                            return;
                        }
                        _0x5c41f4.discords.unshift(_0x3a5011);
                    }
                }
                    ;
                S.wsDiscord.onheartbeat = function (_0x5d9051) {
                    setInterval(function () {
                        var _0x34ec8e = {
                            'op': 1,
                            'd': _0x3f6294
                        };
                        S.wsDiscord.send(JSON.stringify(_0x34ec8e));
                    }, _0x5d9051);
                }
                    ;
                S.wsDiscord.onidentify = function () {
                    var _0x734c89 = {
                        'd': "405706906049708032",
                        'op': 0xc
                    };
                    S.wsDiscord.send(JSON.stringify(_0x734c89));
                }
                    ;
            }
}

export function reopenWsDiscord(app: KktjsApp, arg0: any): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む
            if (a.discord_type == arg0) {
                return;
            }
            a.fetch_lock.discordws = true;
            a.connDiscord = "close";
            a.discord_type = "Force" != arg0 ? arg0 : a.discord_type;
            a.resetDiscordColumn();
            if (S.wsDiscord != null) {
                S.wsDiscord.close();
            }
}

export function handleScrollDiscord(app: KktjsApp, arg0: any): void {
  const a = app as A;
  const S: any = (window as any).__kktjsStream; // ブリッジは実行時に読む
            if (!a.result_lock) {
                a.result_type = '';
                a.result_text = '';
                a.error_cnt = 0;
            }
            var _0x193bbd = parseInt(arg0.target.scrollTop);
            var _0x24bef0 = parseInt(String(arg0.target.scrollHeight - arg0.target.clientHeight - arg0.target.scrollTop));
            if (!a.fetch_lock.discord && _0x193bbd != _0x24bef0 && 1 > _0x24bef0) {
                a.fetch_lock.discord = true;
                a.fetchDiscord();
            }
}
