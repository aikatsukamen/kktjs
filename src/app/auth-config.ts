// 認証・設定の読み書き（legacy から機械変換で移行）。
import type { KktjsApp } from '../types/kktjs-app';
import { encodeHtmlForm, getParameterByName } from '../core/utils';
import { TOKEN, USER } from '../api/endpoints';
import { REQ_TIMEOUT } from '../core/constants';
const userConf = localStorage;
type A = any;

export function fetchToken(app: KktjsApp): void {
  const a = app as A;
            const C: any = (window as any).__kktjsConf || {}; // ブリッジは実行時に読む
            const thisObj: A = a;
            var _0x1dc48b = [];
            var _0x5cd270 = {
                'grant_type': 'authorization_code',
                'redirect_uri': thisObj.autologin ? C.redirect_url : C.redirect_sub,
                'client_id': thisObj.autologin ? C.client_id : C.client_id_sub,
                'client_secret': thisObj.autologin ? C.client_secret : C.client_secret_sub,
                'code': thisObj.code
            };
            var request = new XMLHttpRequest();
            request.open('POST', TOKEN.replace('[I]', thisObj.repository), true);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    userConf.setItem('at', JSON.parse(request.responseText).access_token);
                    location.href = location.origin + location.pathname;
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj.popError(request.responseText, request.status, "Token");
                }
            }
                ;
            request.send(encodeHtmlForm(_0x5cd270));
}

export function fetchUser(app: KktjsApp): void {
  const a = app as A;
            const thisObj: A = a;
            var _0x5c0028 = [];
            var request = new XMLHttpRequest();
            request.open('GET', USER.replace('[I]', thisObj.repository));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + thisObj.at);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    thisObj.user = JSON.parse(request.responseText);
                    thisObj.fetch_after.user = false;
                    thisObj.$forceUpdate();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj.popError(request.responseText, request.status, "User");
                    thisObj.fetch_after.user = true;
                } else if (request.readyState == 0x3 && request.status == 0x1f4) {
                    userConf.removeItem('at');
                    userConf.removeItem('work_user');
                    thisObj.at = null;
                    thisObj.fetch_after.user = false;
                }
            }
                ;
            request.send();
}

export function loadConf(app: KktjsApp): void {
  const a = app as A;
            /** 
             * 1: スマホ
             * 2: タブレット
             * 3: PC
             */
            let deviceType = 2;
            var _0x16db8f = true;
            if (window.innerWidth < 0x280) {
                deviceType = 1;
            } else if (window.innerWidth >= 0x3f0) {
                deviceType = 3;
                _0x16db8f = false;
            }
            a.confs = null != userConf.getItem('conf_std') ? JSON.parse(userConf.getItem('conf_std')) : {};
            if (null != userConf.getItem('conf_std')) {
                a.optVer = null != a.confs && null != a.confs.ver ? a.confs.ver : 0;
                a.optColumns = null != a.confs && null != a.confs.columns ? a.confs.columns : deviceType;
                a.optMode = null != a.confs && null != a.confs.mode ? a.confs.mode : _0x16db8f;
                a.optPtl = null != a.confs && null != a.confs.ptl ? a.confs.ptl : '1';
                a.optSimple = null != a.confs && null != a.confs.simple ? a.confs.simple : false;
                a.optAutoPlay = null != a.confs && null != a.confs.autoplay ? a.confs.autoplay : '1';
                a.optMediaHeight = null != a.confs && null != a.confs.mediaheight ? a.confs.mediaheight : '';
                a.optMediaFit = null != a.confs && null != a.confs.mediafit ? a.confs.mediafit : '';
                a.optKatsuTrim = null != a.confs && null != a.confs.katsutrim ? a.confs.katsutrim : '';
                a.optAllNsfw = null != a.confs && null != a.confs.allnsfw ? a.confs.allnsfw : false;
                a.optAllOpen = null != a.confs && null != a.confs.allopen ? a.confs.allopen : false;
                a.optKatsuFilter = null != a.confs && null != a.confs.filkatsu ? a.confs.filkatsu : '';
                a.optKatsuFilterRaw = null != a.confs && null != a.confs.filkatsuraw ? a.confs.filkatsuraw : '';
                a.optKatsuFilterStr = null != a.confs && null != a.confs.filkatsustr ? a.confs.filkatsustr : '^s$';
                a.optNotifFilter = null != a.confs && null != a.confs.filnotif ? a.confs.filnotif : false;
                a.optConfirm = null != a.confs && null != a.confs.confirm ? a.confs.confirm : {
                    'katsu': 1,
                    'delete': 1,
                    'fav': 0,
                    'unfav': 0,
                    'reblog': 1,
                    'unreblog': 0,
                    'follow': 1,
                    'unfollow': 1,
                    'mute': 1,
                    'unmute': 0,
                    'block': 1,
                    'unblock': 0
                };
                a.optColumnWide = null != a.confs && null != a.confs.columnwide ? a.confs.columnwide : false;
                a.optAutoLayout = null != a.confs && null != a.confs.autolayout ? a.confs.autolayout : false;
                a.optKeepForm = null != a.confs && null != a.confs.keepform ? a.confs.keepform : true;
                a.optConvMedia = null != a.confs && null != a.confs.convmedia ? a.confs.convmedia : '';
                a.optThemeTops = null != a.confs && null != a.confs.tops ? a.confs.tops : '';
                a.optThemeBottoms = null != a.confs && null != a.confs.bottoms ? a.confs.bottoms : '';
                a.optThemeSound = null != a.confs && null != a.confs.boop ? a.confs.boop : '';
                a.optShortNotif = null != a.confs && null != a.confs.shortnotif ? a.confs.shortnotif : true;
                a.optPushNotif = null != a.confs && null != a.confs.push ? a.confs.push : true;
            } else {
                a.optVer = 0;
                a.optColumns = null != userConf.getItem('columns') ? userConf.getItem('columns') : deviceType;
                a.optMode = "true" == userConf.getItem("mode") ? true : _0x16db8f;
                a.optPtl = null != userConf.getItem('ptl') ? userConf.getItem('ptl') : '1';
                a.optSimple = null != userConf.getItem("simple") ? userConf.getItem("simple") : false;
                a.optAutoPlay = null != userConf.getItem("autoplay") ? userConf.getItem("autoplay") : '1';
                a.optMediaHeight = '';
                a.optMediaFit = '';
                a.optKatsuTrim = '';
                a.optAllNsfw = 'true' == userConf.getItem("allnsfw") ? true : false;
                a.optAllOpen = false;
                a.optKatsuFilter = '';
                a.optKatsuFilterRaw = '';
                a.optKatsuFilterStr = '^s$';
                a.optNotifFilter = '';
                a.optConfirm = {
                    'katsu': 1,
                    'delete': 1,
                    'fav': 0,
                    'unfav': 0,
                    'reblog': 1,
                    'unreblog': 0,
                    'follow': 1,
                    'unfollow': 1,
                    'mute': 1,
                    'unmute': 0,
                    'block': 1,
                    'unblock': 0
                };
                a.optColumnWide = false;
                a.optAutoLayout = false;
                a.optKeepForm = true;
                a.optConvMedia = '';
                a.optThemeTops = '';
                a.optThemeBottoms = '';
                a.optThemeSound = '';
                a.optShortNotif = true;
                a.optPushNotif = true;
            }
            a.confs.ver = a.optVer;
            a.confs.columns = a.optColumns;
            a.confs.mode = a.optMode;
            a.confs.ptl = a.optPtl;
            a.confs.simple = a.optSimple;
            a.confs.autoplay = a.optAutoPlay;
            a.confs.mediaheight = a.optMediaHeight;
            a.confs.mediafit = a.optMediaFit;
            a.confs.katsutrim = a.optKatsuTrim;
            a.confs.allnsfw = a.optAllNsfw;
            a.confs.allopen = a.optAllOpen;
            a.confs.filkatsu = a.optKatsuFilter;
            a.confs.filkatsuraw = a.optKatsuFilterRaw;
            a.confs.filkatsustr = a.optKatsuFilterStr;
            a.confs.filnotif = a.optNotifFilter;
            a.confs.confirm = a.optConfirm;
            a.confs.columnwide = a.optColumnWide;
            a.confs.autolayout = a.optAutoLayout;
            a.confs.keepform = a.optKeepForm;
            a.confs.convmedia = a.optConvMedia;
            a.confs.tops = a.optThemeTops;
            a.confs.bottoms = a.optThemeBottoms;
            a.confs.boop = a.optThemeSound;
            a.confs.shortnotif = a.optShortNotif;
            a.confs.push = a.optPushNotif;
}

export function saveConf(app: KktjsApp): void {
  const a = app as A;
            userConf.removeItem('columns');
            userConf.removeItem("mode");
            userConf.removeItem('ptl');
            userConf.removeItem("autoplay");
            userConf.removeItem('allnsfw');
            a.updateFilterAll();
            a.optVer = a.conf_ver;
            a.confs.ver = a.optVer;
            a.confs.columns = a.optColumns;
            a.confs.mode = a.optMode;
            a.confs.ptl = a.optPtl;
            a.confs.simple = a.optSimple;
            a.confs.autoplay = a.optAutoPlay;
            a.confs.mediaheight = a.optMediaHeight;
            a.confs.mediafit = a.optMediaFit;
            a.confs.katsutrim = a.optKatsuTrim;
            a.confs.allnsfw = a.optAllNsfw;
            a.confs.allopen = a.optAllOpen;
            a.confs.filkatsu = a.optKatsuFilter;
            a.confs.filkatsustr = a.optKatsuFilterStr;
            a.confs.filkatsuraw = a.optKatsuFilterRaw;
            a.confs.filnotif = a.optNotifFilter;
            a.confs.confirm = a.optConfirm;
            a.confs.columnwide = a.optColumnWide;
            a.confs.autolayout = a.optAutoLayout;
            a.confs.keepform = a.optKeepForm;
            a.confs.convmedia = a.optConvMedia;
            a.confs.tops = a.optThemeTops;
            a.confs.bottoms = a.optThemeBottoms;
            a.confs.boop = a.optThemeSound;
            a.confs.shortnotif = a.optShortNotif;
            a.confs.push = a.optPushNotif;
            userConf.setItem('conf_std', JSON.stringify(a.confs));
            a.runInit();
            a.showSetting = false;
}

export function resetConf(app: KktjsApp): void {
  const a = app as A;
            var _0x2a2fa8 = 0x2;
            var _0x2125a1 = true;
            if (window.innerWidth < 0x280) {
                _0x2a2fa8 = 1;
            } else if (window.innerWidth >= 0x3f0) {
                _0x2a2fa8 = 0x3;
                _0x2125a1 = false;
            }
            a.optVer = a.conf_ver;
            a.optColumns = _0x2a2fa8;
            a.optMode = _0x2125a1;
            a.optPtl = '1';
            a.optSimple = false;
            a.optAutoPlay = '1';
            a.optMediaHeight = '';
            a.optMediaFit = '';
            a.optKatsuTrim = '';
            a.optAllNsfw = false;
            a.optAllOpen = false;
            a.optKatsuFilter = '';
            a.optKatsuFilterRaw = '';
            a.optKatsuFilterStr = '^s$';
            a.optNotifFilter = '';
            a.optConfirm = {
                'katsu': 1,
                'delete': 1,
                'fav': 0,
                'unfav': 0,
                'reblog': 1,
                'unreblog': 0,
                'follow': 1,
                'unfollow': 1,
                'mute': 1,
                'unmute': 0,
                'block': 1,
                'unblock': 0x0
            };
            a.optColumnWide = false;
            a.optAutoLayout = false;
            a.optKeepForm = true;
            a.optConvMedia = '';
            a.optThemeTops = '';
            a.optThemeBottoms = '';
            a.optThemeSound = '';
            a.optShortNotif = true;
            a.optPushNotif = true;
            a.confs.ver = a.optVer;
            a.confs.columns = a.optColumns;
            a.confs.mode = a.optMode;
            a.confs.ptl = a.optPtl;
            a.confs.simple = a.optSimple;
            a.confs.autoplay = a.optAutoPlay;
            a.confs.mediaheight = a.optMediaHeight;
            a.confs.mediafit = a.optMediaFit;
            a.confs.katsutrim = a.optKatsuTrim;
            a.confs.allnsfw = a.optAllNsfw;
            a.confs.allopen = a.optAllOpen;
            a.confs.filkatsu = a.optKatsuFilter;
            a.confs.filkatsuraw = a.optKatsuFilterRaw;
            a.confs.filkatsustr = a.optKatsuFilterStr;
            a.confs.filnotif = a.optNotifFilter;
            a.confs.confirm = a.optConfirm;
            a.confs.columnwide = a.optColumnWide;
            a.confs.autolayout = a.optAutoLayout;
            a.confs.keepform = a.optKeepForm;
            a.confs.convmedia = a.optConvMedia;
            a.confs.tops = a.optThemeTops;
            a.confs.bottoms = a.optThemeBottoms;
            a.confs.boop = a.optThemeSound;
            a.confs.shortnotif = a.optShortNotif;
            a.confs.push = a.optPushNotif;
            userConf.setItem('conf_std', JSON.stringify(a.confs));
            a.runCustom();
}
