// =============================================================================
// legacy/app-core.ts
// 旧 main.js（難読化）を解読・整形した残置ハーネス。Vue アプリ本体
// （data / created / watch / computed）とストリーミング等の共有 kktjs* 関数、
// モジュールグローバル、および TS 側へ状態を渡す window ブリッジを含む。
//
// メソッド（全 257 件）は src/ 配下の型付きモジュールへ移行済み。ここに残る各
// メソッドは window.__kktjsMethods['name'](this, ...) へ委譲する薄いスタブ
// （debounce 対象は _.debounce(委譲, TIME) のラッパを保持）。ブリッジ
// （__kktjsConf / __kktjsAudioContext / __kktjsMedia / __kktjsStream）は
// createApp/mount より前に設定し、created() からの呼び出しに備える。
// グローバル（Vue / _ / emojione）は index.html 読み込みのものを参照する。
// =============================================================================
/* eslint-disable */
// (ts-nocheck removed for full TS conversion)

// Vue 3: コンポーネント/ディレクティブ登録は app インスタンスへ行う（末尾の mount 前）。
import { registerVueComponentsAndDirectives } from '../app/vue-setup';

// Vue は npm 依存から import（Vite が SFC とともにバンドル）。createApp 等を名前空間で使う。
import * as Vue from 'vue';

// 配信場所非依存のベースパス導出（単一実装）。
import { getBasePath } from '../core/base-path';

// 外部 <script> 由来のグローバル（index.html 読み込み）。型は globals.d.ts も参照。
// lodash(_) / emojione は引き続き CDN グローバル（external）。
declare const _: any;
declare function addToHomescreen(opts: any): void;
// 元コードが swipedetect 内で代入する暗黙のグローバル（読み出しは無いが挙動維持のため宣言）。
declare var dist: any;

const BOOP = 'sounds/boop.mp3';
const BOOP_EX = 'sounds/boop.mp3';
// 配信場所に依存しないベースパス導出は core/base-path.ts に一本化（import.meta.url ベース。
// Vite の assets/index-[hash].js の位置や <base href> から検出。旧 js/main.js 検出も後方互換で残置）。
const __kktjsBase = getBasePath();
const IMG_DUMMY = __kktjsBase + 'img/missing_header.png';

// ストリーミング受信投稿の重複挿入ガード。
// 復帰時の再接続と refetch が競合すると、同一IDの投稿が onmessage の unshift と
// refetch の置き換えで二重に入ることがある。挿入前に既存配列へ同一IDが無いか確認する。
function kktjsAlreadyInTimeline(list, status) {
  if (!list || !status) return false;
  var id = status['id'];
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i]['id'] === id) return true;
  }
  return false;
}
const NOIMAGE_AVATAR = '/avatars/original/missing.png';
const NOIMAGE_HEADER = '/headers/original/missing.png';
const NOIMAGE_MEDIA = '/files/small/missing.png';
const NOIMAGE_MEDIA_PROXY = 'media_proxy';
var IMAGE_MAXLEN = 0x500;
var IMAGE_MAXPIXEL = 0x500 * 0x500;
var urlParams = [], userDevice, userDeviceOp, option, userAppMode;
const userConf = localStorage;
var Notification = window.Notification || window.mozNotification || window.webkitNotification;
var userAgent = window.navigator['userAgent']['toLowerCase']();
var serviceWorker = window.navigator.serviceWorker;
var isLocal = Boolean(window.location.hostname === 'localhost' || window.location.hostname === '[::1]' || window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
var LIMIT = 0x28;
var LIMIT_USER = 0x50;
var LIMIT_NOTIF = 0x1e;
var LIMIT_DIS = 0x64;
var LIMIT_LISTS = 0x32;
var LIMIT_HASHTAGS = 0x14;
var LIMIT_ACCTNAME = 0x1e;
var LIMIT_LISTNAME = 0x12c;
var LIMIT_POLLOPTION = 0x19;
var LIMIT_POLLEXPIRE = 0x263b44;
var LIMIT_IMGFILE = 0x800000;
var LIMIT_MOVFILE = 0x2800000;
var TIME_SCROLL = 0x3c;
var TIME_TOUCH = 0x28;
var TIME_REFRESH = 0x44c;
var REQ_TIMEOUT = 0x3a98;
var threshold_high = 0x44c;
var threshold_low = 0xa8c;
const redirect_url = 'https://aikatsukamen.github.io/kktjs/';
const redirect_sub = 'urn:ietf:wg:oauth:2.0:oob';
// 本家
// var client_id = '53101426dce20fef441eee023ba2dc8c0e838e3688d189b87e2e6133a70ce686';
// var client_id_sub = 'uaO-aPO-tkFS4cSiZmvR_-q7QLeCFjt922zSL8CNDLc';
// var client_secret = 'e479cba0c0cf6e29017c696e773e4369e32a3ae0f010e04676627f3dd13a11d3';
// var client_secret_sub = 'dKK1HSpL9lEzFxWGGhl-52AbDcoVT4RfXg2SSDSZ_RA';
// kamen
/** 通常認証 api/v1/appsで登録したもの */
const client_id = 'Zl8G71GsqB4E-Ze89rA5Gly99wOiU5g6eymHGeaDMQ0';
/** コード認証 */
const client_id_sub = 'qrzMcJTeBiaPYqScFTgx77dSwfI7vM4erlXyufeSVws';
// const vapid_key = "BA-WSCqn52VjR-MiXZ7Qn_5KXsRPGEXHg1lNXk1Z0PGC8CckdInvECBFYrOs03BRRgB701OeEqQcjGq3-9dcBZ8="
const client_secret = 'pxueumQ_Rrw35cgF_vLk1etwzT0I2l3NBnJ_RToJr5Y';
const client_secret_sub = 'mU6GdW47CI0p_hYbZfwSufcKZZ8NA-YkfmG93ztuSrQ';
const TOKEN = 'https://[I]/oauth/token';
const AUTH_URL = 'https://[I]/oauth/authorize?client_id=[CID]&response_type=code&redirect_uri=[URL]&scope=read%20write%20follow';
const PROFILE_URL = 'https://[I]/settings/profile';
const MASTODON_URL = 'https://[I]/about';
const ABOUT_URL = 'https://[I]/about/more';
const POLICY_URL = 'https://[I]/terms';
const WIKI_URL = 'https://ja.mstdn.wiki/Kirakiratter.com';
const DIRECTRY_URL = 'https://[I]/explore';
const CLIENT = 'https://[I]/api/v1/apps';
const USER = 'https://[I]/api/v1/accounts/verify_credentials';
const PROFILE = 'https://[I]/api/v1/accounts/update_credentials';
const HOME = 'https://[I]/api/v1/timelines/home?max_id=[PID]&limit=[LM]&';
const LOCAL = 'https://[I]/api/v1/timelines/public?local=true&max_id=[PID]&limit=[LM]&';
const GLOBAL = 'https://[I]/api/v1/timelines/public?max_id=[PID]&limit=[LM]&';
const DIRECT = "https://kirakiratter.com/api/v1/conversations"; //"https://[I]/api/v1/timelines/conversation?max_id=[PID]&limit=[LM]&"; ★
const NOTIF = 'https://[I]/api/v1/notifications?max_id=[PID]&limit=[LM]&';
const HASHTAG = 'https://[I]/api/v1/timelines/tag/[TAG]?max_id=[PID]&limit=[LM]&';
const LIST = 'https://[I]/api/v1/timelines/list/[LID]?max_id=[PID]&limit=[LM]&';
const SEARCH = 'https://[I]/api/v2/search?q=[STR]&resolve=true';
const ACCT_SEARCH = 'https://[I]/api/v1/accounts/search?q=[STR]&following=[FL]&limit=[LM]&';
const ST_HOME = 'wss://[I]/api/v1/streaming?access_token=[AT]&stream=user';
const ST_LOCAL = 'wss://[I]/api/v1/streaming?access_token=[AT]&stream=public:local';
const ST_GLOBAL = 'wss://[I]/api/v1/streaming?access_token=[AT]&stream=public';
const ST_DIRECT = 'wss://[I]/api/v1/streaming?access_token=[AT]&stream=direct';
const ST_HASHTAG = 'wss://[I]/api/v1/streaming?access_token=[AT]&stream=hashtag&tag=[TAG]';
const ST_LIST = 'wss://[I]/api/v1/streaming?access_token=[AT]&stream=list&list=[LID]';
const KATSU = 'https://[I]/api/v1/statuses';
const KATSU_MEDIA = 'https://[I]/api/v1/media';
const ACCT = 'https://[I]/api/v1/accounts/[AID]/statuses?max_id=[PID]&limit=[LM]&';
const MEDIA = 'https://[I]/api/v1/accounts/[AID]/statuses?max_id=[PID]&limit=[LM]&only_media=1&';
const PINNED = 'https://[I]/api/v1/accounts/[AID]/statuses?pinned=true';
const FOLLOW = 'https://[I]/api/v1/accounts/[AID]/following?max_id=[UID]&limit=[LM]';
const FOLLOWER = 'https://[I]/api/v1/accounts/[AID]/followers?max_id=[UID]&limit=[LM]';
const ACCT_OBJ = 'https://[I]/api/v1/accounts/[AID]';
const ACCT_RELATION = 'https://[I]/api/v1/accounts/relationships?id=[AID]';
const RELATION = 'https://[I]/api/v1/accounts/relationships?';
const FAVO = 'https://[I]/api/v1/favourites?limit=[LM]&max_id=[PID]&';
const MUTE = 'https://[I]/api/v1/mutes?max_id=[UID]&limit=[LM]';
const BLOCK = 'https://[I]/api/v1/blocks?max_id=[UID]&limit=[LM]';
const REPORT = 'https://[I]/api/v1/reports';
const FOLLOW_REQUEST = 'https://[I]/api/v1/follow_requests?limit=[LM]';
const FOLLOW_AUTH = 'https://[I]/api/v1/follow_requests/[AID]/authorize';
const FOLLOW_REJECT = 'https://[I]/api/v1/follow_requests/[AID]/reject';
const LIST_ALL = 'https://[I]/api/v1/lists';
const LIST_OBJ = 'https://[I]/api/v1/lists/[LID]';
const LIST_ACCT = 'https://[I]/api/v1/lists/[LID]/accounts?limit=0';
const VOTE = 'https://[I]/api/v1/polls/[VID]/votes';
const DETAIL = 'https://[I]/api/v1/statuses/[SID]';
const DETAIL_CHAIN = 'https://[I]/api/v1/statuses/[SID]/context';
const DETAIL_FAV = 'https://[I]/api/v1/statuses/[SID]/favourited_by?limit=[LM]';
const DETAIL_REBLOG = 'https://[I]/api/v1/statuses/[SID]/reblogged_by?limit=[LM]';
const ACT_FAV = 'https://[I]/api/v1/statuses/[SID]/favourite';
const ACT_UNFAV = 'https://[I]/api/v1/statuses/[SID]/unfavourite';
const ACT_REBLOG = 'https://[I]/api/v1/statuses/[SID]/reblog';
const ACT_UNREBLOG = 'https://[I]/api/v1/statuses/[SID]/unreblog';
const ACT_PIN = 'https://[I]/api/v1/statuses/[SID]/pin';
const ACT_UNPIN = 'https://[I]/api/v1/statuses/[SID]/unpin';
const ACT_FOLLOW = 'https://[I]/api/v1/accounts/[AID]/follow';
const ACT_UNFOLLOW = 'https://[I]/api/v1/accounts/[AID]/unfollow';
const ACT_MUTE = 'https://[I]/api/v1/accounts/[AID]/mute';
const ACT_UNMUTE = 'https://[I]/api/v1/accounts/[AID]/unmute';
const ACT_BLOCK = 'https://[I]/api/v1/accounts/[AID]/block';
const ACT_UNBLOCK = 'https://[I]/api/v1/accounts/[AID]/unblock';
const KKT1_LASTID = 4919581;
var wsLocal = null;
var wsHome = null;
var wsMulti = null;
const fileReader = new FileReader();
const image = new Image();
var mediaFile;
var MediaBinary;
var MediaBlob;
var fileType;
var resizeScale;
var canvasElement = document['createElement']('canvas');
var imgElement = document['createElement']('img');
var ctx = canvasElement['getContext']('2d');
// Vue のコンポーネント/ディレクティブ登録は src/app/vue-setup.ts へ移行済み
// （Vue 3: createApp 後・mount 前に registerVueComponentsAndDirectives(app) を実行。
//  呼び出しは本ファイル末尾の mount 直前）

// === window ブリッジ（createApp/mount より前に設定。created フックが TS 実装を呼ぶため）===
// 移行した TS メソッド（open* 等）から参照する、デプロイ依存の定数群を公開する。
// これらは難読化元コードからの定数で、配信先/OAuth登録に紐づくため legacy 側を真実点とする。
window.__kktjsConf = {
  AUTH_URL: AUTH_URL,
  PROFILE_URL: PROFILE_URL,
  MASTODON_URL: MASTODON_URL,
  ABOUT_URL: ABOUT_URL,
  POLICY_URL: POLICY_URL,
  WIKI_URL: WIKI_URL,
  DIRECTRY_URL: DIRECTRY_URL,
  client_id: client_id,
  client_id_sub: client_id_sub,
  client_secret: client_secret,
  client_secret_sub: client_secret_sub,
  redirect_url: redirect_url,
  redirect_sub: redirect_sub,
  // スクロール閾値は created で iOS/Safari 時に 0 へ再代入される可変値。
  // getter で都度読み、再代入を scroll-handlers 側へ反映する。
  get threshold_low() { return threshold_low; },
  get threshold_high() { return threshold_high; },
};
// 音声再生用 AudioContext を TS（setNotifSound）から参照できるよう公開。
window.__kktjsAudioContext = context;

// メディア処理用の可変グローバル（checkActMedia/actMedia が共有）を TS から
// 読み書きできるよう、getter/setter 付きのブリッジを公開する。
window.__kktjsMedia = {
  get mediaFile() { return mediaFile; }, set mediaFile(v) { mediaFile = v; },
  get MediaBinary() { return MediaBinary; }, set MediaBinary(v) { MediaBinary = v; },
  get MediaBlob() { return MediaBlob; }, set MediaBlob(v) { MediaBlob = v; },
  get fileType() { return fileType; }, set fileType(v) { fileType = v; },
  get resizeScale() { return resizeScale; }, set resizeScale(v) { resizeScale = v; },
  canvasElement: canvasElement,
  imgElement: imgElement,
  ctx: ctx,
  fileReader: fileReader,
  image: image,
};

// ストリーミング用ソケット変数と関連ヘルパ/定数を TS（streaming.ts）から
// 読み書きできるよう公開する。getter/setter でモジュールスコープ変数に委譲。
window.__kktjsStream = {
  get wsHome() { return wsHome; }, set wsHome(v) { wsHome = v; },
  get wsLocal() { return wsLocal; }, set wsLocal(v) { wsLocal = v; },
  get wsMulti() { return wsMulti; }, set wsMulti(v) { wsMulti = v; },
  ST_HOME: ST_HOME, ST_LOCAL: ST_LOCAL, ST_GLOBAL: ST_GLOBAL,
  ST_DIRECT: ST_DIRECT, ST_HASHTAG: ST_HASHTAG, ST_LIST: ST_LIST,
  alreadyInTimeline: kktjsAlreadyInTimeline,
  _: _,
};

// Vue 3: new Vue({el,...}) を廃止し createApp(...).mount('#app') へ。
//  - el オプションは廃止（mount('#app') で指定。ファイル末尾参照）。
//  - data はルートでも関数必須（オブジェクト → 関数で新規オブジェクトを返す）。
//  - コンポーネント/ディレクティブは app インスタンスへ登録（mount 前。末尾参照）。
//  - window.app には mount() の戻り値（公開インスタンス）を入れる（末尾参照）。
var __kktjsApp = Vue.createApp({
    'data': function () { return {
        'startApp': false,
        'connHome': 'ready',
        'connLocal': 'ready',
        'connMulti': 'ready',
        'showHome': false,
        'showHomeOption': false,
        'showLocal': false,
        'showLocalOption': false,
        'showMulti': false,
        'showMultiOption': false,
        'showNotif': false,
        'showNotifOption': false,
        'showDetail': false,
        'showAcct': false,
        'showAcctEdit': false,
        'showAcctOption': false,
        'showSetting': false,
        'showSearch': false,
        'showStream': false,
        'showStreamEdit': false,
        'showForm': false,
        'showFormSpoiler': false,
        'showFormVote': false,
        'showFormDraft': false,
        'showFormFileImporter': false,
        'showFormVisible': false,
        'showSideLink': false,
        'showLink': false,
        'showLinkSearch': false,
        'showLinkStream': '',
        'showMedia': false,
        'showEmojiPicker': false,
        'showConfirm': false,
        'showDebug': false,
        'showDebugVia': false,
        'optColumns': '',
        'optPtl': '',
        'optSimple': '',
        'optAutoPlay': '',
        'optAllNsfw': '',
        'optAllOpen': '',
        'optMode': '',
        'optConfirm': {},
        'optColumnWide': false,
        'optAutoLayout': false,
        'optKeepForm': true,
        'optConvMedia': '',
        // 添付画像の最大長辺（px）。0 = 縮小しない / それ以外 = 長辺がこの値を超える画像のみ縮小。
        // 設定画面（showSetting）のプリセット/カスタム入力から変更する。
        'optMaxImageLen': 0,
        'optThemeTops': '',
        'optThemeBottoms': '',
        'optThemeSound': '',
        'optShortNotif': true,
        'optPushNotif': true,
        'optMediaHeight': '',
        'optMediaFit': '',
        'optKatsuTrim': '',
        'optKatsuFilter': '',
        'optKatsuFilterRaw': '',
        'optKatsuFilterStr': '',
        'optNotifFilter': '',
        'optVer': {},
        'confs': {},
        'code': '',
        'modal_media': '',
        'modal_issue': '',
        'result_text': '',
        'result_type': '',
        'result_lock': false,
        'result_text_tmp': '',
        'media_uploaded': '0',
        'repository': 'kirakiratter.com',
        // 内部バージョン（package.json）をビルド時に注入。設定画面のバージョン表示でのみ参照される。
        // 旧 app_name/'kktjs', app_ver/'1.4', app_ver_top/'js v1.4.8a' は固定の古い表示で、
        // 内部バージョンと連動していなかったため削除。
        'kktjs_version': __KKTJS_VERSION__,
        'app_mode': 'web',
        'app_active': true,
        'app_network': true,
        'app_wait_update': false,
        'sw_stat': {
            'enabled': 'serviceWorker' in navigator,
            'controller': 'serviceWorker' in navigator ? null != navigator['serviceWorker']["controller"] : false
        },
        'conf_ver': 1,
        'error_cnt': 0,
        'at': userConf['getItem']('at'),
        'ua': 'pc',
        'uaop': '',
        'autologin': true,
        'user': null != userConf['getItem']('work_user') ? JSON.parse(userConf['getItem']('work_user')) : [],
        'user_requesting_count': 0,
        'profile': {
            'name': '',
            'name_b': '',
            'note': ''
        },
        'listprofile': {
            'name': ''
        },
        'home_id': '',
        'homes': [],
        'home_type': '',
        'home_posy': 0,
        'home_posy_b': 0,
        'home_unread': 0,
        'local_id': '',
        'locals': [],
        'local_type': '',
        'local_posy': 0,
        'local_posy_b': 0,
        'local_unread': 0,
        'local_id_bookmark': null != userConf['getItem']('work_bookmark') ? JSON.parse(userConf['getItem']('work_bookmark')) : '',
        'notif_id': '',
        'notifs': [],
        'notifs_filter': [],
        'notif_type': '',
        'notif_posy': 0,
        'notif_posy_b': 0,
        'notif_unread': 0,
        'notif_unread_filter': {
            'mention': 0,
            'fav': 0,
            'reblog': 0,
            'follow': 0,
            'others': 0,
            'complete': true
        },
        'notif_id_bookmark': null != userConf['getItem']('work_bookmark_notif') ? JSON.parse(userConf['getItem']('work_bookmark_notif')) : '',
        'multi_id': '',
        'multis': [],
        /** Stream, Direct, HashTag, List */
        multi_type: '',
        'multi_name': '',
        'multi_target': '',
        'multi_posy': 0,
        'multi_posy_b': 0,
        'multi_unread': 0,
        'detail_targetid': '',
        'detail_id': '',
        'detail': [],
        'detail_fav': [],
        'detail_reblog': [],
        'detail_chain': [],
        'acct_targetid': '',
        'acct_id': '',
        'accts': [],
        'acct': [],
        'acct_type': '',
        'acct_relation': [],
        'acct_pinned': [],
        'accts_users': [],
        'accts_users_relation': [],
        'stream_list_id': '',
        'stream_lists': [],
        'stream_list': [],
        'stream_list_type': '',
        'stream_list_following': false,
        'stream_list_users': [],
        'stream_list_users_bu': [],
        'stream_list_users_relation': [],
        'stream_list_text': '',
        'stream_list_text_check': false,
        'stream_list_profile_check': false,
        'stream_hashtags': null != userConf['getItem']('work_stream_hashtags') ? JSON.parse(userConf['getItem']('work_stream_hashtags')) : [],
        'stream_hashtag_text': '',
        'stream_channels': ["あかりちゃんち 第一映写室", "あかりちゃんち 第二映写室"],
        'katsu': {
            'status': '',
            'in_reply_to_id': null,
            'reply': [],
            'media_ids': [],
            'sensitive': false,
            'nsfw': false,
            'spoiler_text': '',
            'visibility': '',
            'content': '',
            'media_attachments': [],
            'media_previews': [],
            'poll': {
                'options': [],
                'multiple': false,
                'expires_in': 0x15180
            },
            'poll_work': {
                'texts': [],
                'expires_at': '',
                'extime': [1, 0, 0x0]
            },
            'emojis': []
        },
        'media_tmp': {
            'id': 0,
            'type': "image",
            'url': IMG_DUMMY,
            'preview_url': IMG_DUMMY,
            'remote_url': '',
            'text_url': '',
            'meta': {}
        },
        'action_lock': '',
        'fetch_lock': {
            'update': false,
            'home': false,
            'local': false,
            'notif': false,
            'acct': false,
            'multi': false,
            'lists': false,
            'search': false,
            'search_hashtag': false,
            'homews': false,
            'localws': false,
            'multiws': false
        },
        'fetch_watch': {
            'detail': false,
            'detail_chain': false,
            'detail_fav': false,
            'detail_reblog': false,
            'acct_profile': false,
            'acct_profile_rel': false,
            'acct_profile_pin': false,
            'acct_profile_req': false
        },
        'fetch_comp': {
            'home': false,
            'local': false,
            'notif': false,
            'acct': false,
            'multi': false,
            'lists': false,
            'notif_filter': false
        },
        'fetch_after': {
            'home': false,
            'local': false,
            'notif': false,
            'lists': false,
            'user': false
        },
        'katsu_spoiler_text': '',
        'katsu_spoiler_text_bu': '',
        'katsu_content_text': '',
        'katsu_poll': null,
        'content_text_drafts': null != userConf['getItem']('work_drafts') ? JSON.parse(userConf['getItem']('work_drafts')) : [],
        'katsu_drafts': null != userConf['getItem']('work_katsu_drafts') ? JSON.parse(userConf['getItem']('work_katsu_drafts')) : [],
        'search_text': '',
        'searchs': [],
        'search_type': '',
        'search_userid': '',
        'search_hashtag': ''
    }; },
    'beforeCreate': function () {
        urlParams['code'] = getParameterByName('code');
        urlParams['app'] = getParameterByName('app');
        urlParams['nv'] = getParameterByName('nv');
        if (userAgent['indexOf']('iphone') != -1 || userAgent['indexOf']('ipad') != -0x1) {
            userDevice = 'ios';
            option = userAgent['split']('os ')[1]['split']('\x20')[0];
            if (option['indexOf']('_') >= 0) {
                option = parseInt(option['split']('_')[0]);
            }
            if (option < 0xb) {
                userDeviceOp = 'ios';
            }
        } else if (userAgent['indexOf']('android') != -0x1) {
            userDevice = 'android';
        } else {
            userDevice = 'pc';
            if (userAgent['indexOf']('safari') !== -1 && userAgent['indexOf']('chrome') === -1 && userAgent['indexOf']('edge') === -0x1) {
                userDeviceOp = 'macos_safari';
            }
        }
        if (userDevice == 'ios' || userDevice == 'pc' && userDeviceOp == 'macos_safari') {
            threshold_high = 0;
            threshold_low = 0;
            TIME_SCROLL = 0x64;
        }
        userAppMode = 'web';
    },
    // 初期処理
    'created': function () {
        this['app_mode'] = userAppMode;
        if (null == urlParams['app'] && null != urlParams['code']) {
            this['code'] = decodeURIComponent(urlParams['code']);
            this['autologin'] = true;
            this['fetchToken']();
            return;
        }
        this['ua'] = userDevice;
        this['uaop'] = userDeviceOp;
        if (this['at'] == null) {
            addToHomescreen({
                'appID': 'AddToHomescreenKktjs',
                'lifespan': 0,
                'startDelay': 0,
                'displayPace': 0
            });
            return;
        }
        this.fetchUser();
        this.fetchStreamList();
        this.loadConf();
        this.refreshKatsu();
        this.runInit();
        if (this.optAutoLayout) {
            this.setResizer();
        }
        this.fetch_lock.localws = true;
        this.resetLocalColumn();
        this.fetchLocal();
        this.openWsLocal();
        this.fetch_lock.homews = true;
        this.resetHomeColumn();
        this.fetchHome();
        this.openWsHome();
        this.fetch_lock.multiws = true;
        this.resetMultiColumn();
        this.multi_type == 'Direct';
        this.fetchMulti();
        this.openWsMulti();
        this.fetchNotifAll();
        this.setHistory();
        if (null != userConf.getItem('columns')) {
            this.showSetting = true;
        }
        if (null == userConf.getItem('conf_std')) {
            this.showSetting = true;
        }
        this.setNotifSound('soundoff', null);
        this.setNotifSound('sound', BOOP);
        this.setNotifSound('soundex', BOOP_EX);
        if (this.ua == 'ios' && this.optThemeSound != 'off') {
            this.result_lock = true;
            this.result_text = 'タップして通知音を有効化';
            this.error_cnt = 0;
        }
    },
    'watch': {
        'user': 'runSettingUser',
        'content_text_drafts': 'runSettingDrafts',
        'katsu_drafts': 'runSettingKatsuDrafts',
        'stream_hashtags': 'runSettingStreamHashtags',
        'local_id_bookmark': 'runSettingBookmark',
        'notif_id_bookmark': 'runSettingBookmarkNotif'
    },
    'computed': {
        'hasAuth': function () {
            return window.__kktjsMethods['hasAuth'](this);
        },
        'isMyAcct': function () {
            return window.__kktjsMethods['isMyAcct'](this);
        },
        'hasHome': function () {
            return window.__kktjsMethods['hasHome'](this);
        },
        'hasLocal': function () {
            return window.__kktjsMethods['hasLocal'](this);
        },
        'hasNotif': function () {
            return window.__kktjsMethods['hasNotif'](this);
        },
        'hasNotifFilter': function () {
            return window.__kktjsMethods['hasNotifFilter'](this);
        },
        'hasMulti': function () {
            return window.__kktjsMethods['hasMulti'](this);
        },
        'hasDetail': function () {
            return window.__kktjsMethods['hasDetail'](this);
        },
        'hasSearch': function () {
            return window.__kktjsMethods['hasSearch'](this);
        },
        'hasSearchAcctEx': function () {
            return window.__kktjsMethods['hasSearchAcctEx'](this);
        },
        'hasAcctProfile': function () {
            return window.__kktjsMethods['hasAcctProfile'](this);
        },
        'hasAcct': function () {
            return window.__kktjsMethods['hasAcct'](this);
        },
        'hasAcctNote': function () {
            return window.__kktjsMethods['hasAcctNote'](this);
        },
        'hasAcctUser': function () {
            return window.__kktjsMethods['hasAcctUser'](this);
        },
        'hasStreamList': function () {
            return window.__kktjsMethods['hasStreamList'](this);
        },
        'hasReply': function () {
            return window.__kktjsMethods['hasReply'](this);
        },
        'hasKatsuDraft': function () {
            return window.__kktjsMethods['hasKatsuDraft'](this);
        },
        'hasInfo': function () {
            return window.__kktjsMethods['hasInfo'](this);
        },
        'isHashtagMax': function () {
            return window.__kktjsMethods['isHashtagMax'](this);
        },
        'isListMax': function () {
            return window.__kktjsMethods['isListMax'](this);
        },
        'isListFollowMax': function () {
            return window.__kktjsMethods['isListFollowMax'](this);
        }
    },
    'methods': {
        'isSetVote': function (a, b) {
            return window.__kktjsMethods['isSetVote'](this, a, b);
        },
        'formatDate': function (v) {
            return window.__kktjsMethods['formatDate'](this, v);
        },
        'formatDateFull': function (v) {
            return window.__kktjsMethods['formatDateFull'](this, v);
        },
        'formatDateVote': function (v) {
            return window.__kktjsMethods['formatDateVote'](this, v);
        },
        'formatContent': function (a, b) {
            return window.__kktjsMethods['formatContent'](this, a, b);
        },
        'formatSpoiler': function (a, b) {
            return window.__kktjsMethods['formatSpoiler'](this, a, b);
        },
        'formatContentConfirm': function (a, b) {
            return window.__kktjsMethods['formatContentConfirm'](this, a, b);
        },
        'formatSpoilerConfirm': function (a, b) {
            return window.__kktjsMethods['formatSpoilerConfirm'](this, a, b);
        },
        'formatEmoji': function (a, b) {
            return window.__kktjsMethods['formatEmoji'](this, a, b);
        },
        'formatEmojiDraft': function (a, b) {
            return window.__kktjsMethods['formatEmojiDraft'](this, a, b);
        },
        // URLのドメイン部分を抜き出す
        'formatDomain': function (v) {
            return window.__kktjsMethods['formatDomain'](this, v);
        },
        'checkDisplayName': function (v) {
            return window.__kktjsMethods['checkDisplayName'](this, v);
        },
        'checkKatsuChain': function (v) {
            return window.__kktjsMethods['checkKatsuChain'](this, v);
        },
        'checkHeader': function (v) {
            return window.__kktjsMethods['checkHeader'](this, v);
        },
        'checkAvatar': function (v) {
            return window.__kktjsMethods['checkAvatar'](this, v);
        },
        'checkMedia': function (a, b) {
            return window.__kktjsMethods['checkMedia'](this, a, b);
        },
        'checkVote': function (v) {
            return window.__kktjsMethods['checkVote'](this, v);
        },
        'equalArr': function (a, b) {
            return window.__kktjsMethods['equalArr'](this, a, b);
        },
        'checkStreamListText': _['debounce'](function (this: any) {
            return window.__kktjsMethods['checkStreamListText'](this);
        }, TIME_REFRESH),
        'checkListProfile': _['debounce'](function (this: any) {
            return window.__kktjsMethods['checkListProfile'](this);
        }, TIME_REFRESH),
        'handleWheel': _['debounce'](function (this: any, _0x2ce36b) {
            return window.__kktjsMethods['handleWheel'](this, _0x2ce36b);
        }, TIME_SCROLL),
        'handleScrollHome': _['debounce'](function (this: any, e) {
            return window.__kktjsMethods['handleScrollHome'](this, e);
        }, TIME_SCROLL),
        'handleScrollLocal': _['debounce'](function (this: any, _0x750d55) {
            return window.__kktjsMethods['handleScrollLocal'](this, _0x750d55);
        }, TIME_SCROLL),
        'handleScrollMulti': _['debounce'](function (this: any, e) {
            return window.__kktjsMethods['handleScrollMulti'](this, e);
        }, TIME_SCROLL),
        'handleScrollNotif': _['debounce'](function (this: any, _0x178d0c) {
            return window.__kktjsMethods['handleScrollNotif'](this, _0x178d0c);
        }, TIME_SCROLL),
        'handleScrollAcct': _['debounce'](function (this: any, _0x3b2506) {
            return window.__kktjsMethods['handleScrollAcct'](this, _0x3b2506);
        }, TIME_SCROLL),
        'isFollow': function (a) {
            return window.__kktjsMethods['isFollow'](this, a);
        },
        'isBlock': function (a) {
            return window.__kktjsMethods['isBlock'](this, a);
        },
        'isRequest': function (a) {
            return window.__kktjsMethods['isRequest'](this, a);
        },
        'isList': function (a) {
            return window.__kktjsMethods['isList'](this, a);
        },
        'isListFollow': function (a) {
            return window.__kktjsMethods['isListFollow'](this, a);
        },
        'notifJudge': function (a) {
            return window.__kktjsMethods['notifJudge'](this, a);
        },
        'countNotifUnread': function (a) {
            return window.__kktjsMethods['countNotifUnread'](this, a);
        },
        'toggleHomeOption': function (a, b) {
            return window.__kktjsMethods['toggleHomeOption'](this, a, b);
        },
        'toggleLocalOption': function (a, b) {
            return window.__kktjsMethods['toggleLocalOption'](this, a, b);
        },
        'toggleNotifOption': function (a, b) {
            return window.__kktjsMethods['toggleNotifOption'](this, a, b);
        },
        'toggleAcctEdit': function (a, b) {
            return window.__kktjsMethods['toggleAcctEdit'](this, a, b);
        },
        'toggleAcctOption': function (a, b) {
            return window.__kktjsMethods['toggleAcctOption'](this, a, b);
        },
        'toggleSetting': function (a, b) {
            return window.__kktjsMethods['toggleSetting'](this, a, b);
        },
        'toggleSearch': function (a, b) {
            return window.__kktjsMethods['toggleSearch'](this, a, b);
        },
        'toggleStream': function (a, b) {
            return window.__kktjsMethods['toggleStream'](this, a, b);
        },
        'toggleStreamEdit': function (a, b) {
            return window.__kktjsMethods['toggleStreamEdit'](this, a, b);
        },
        'toggleForm': function (a, b) {
            return window.__kktjsMethods['toggleForm'](this, a, b);
        },
        'toggleFormSpoiler': function (a, b) {
            return window.__kktjsMethods['toggleFormSpoiler'](this, a, b);
        },
        'toggleFormVote': function (a, b) {
            return window.__kktjsMethods['toggleFormVote'](this, a, b);
        },
        'toggleFormDraft': function (a, b) {
            return window.__kktjsMethods['toggleFormDraft'](this, a, b);
        },
        'toggleFormVisible': function (a, b) {
            return window.__kktjsMethods['toggleFormVisible'](this, a, b);
        },
        'toggleSideLink': function (a, b) {
            return window.__kktjsMethods['toggleSideLink'](this, a, b);
        },
        'toggleLink': function (a, b) {
            return window.__kktjsMethods['toggleLink'](this, a, b);
        },
        'toggleLinkSearch': function (a, b) {
            return window.__kktjsMethods['toggleLinkSearch'](this, a, b);
        },
        'toggleLinkStream': function (a, b) {
            return window.__kktjsMethods['toggleLinkStream'](this, a, b);
        },
        'runInit': function (a, b) {
            return window.__kktjsMethods['runInit'](this, a, b);
        },
        'runCustom': function (a, b) {
            return window.__kktjsMethods['runCustom'](this, a, b);
        },
        'runHome': function (a, b) {
            return window.__kktjsMethods['runHome'](this, a, b);
        },
        'runLocal': function (a, b) {
            return window.__kktjsMethods['runLocal'](this, a, b);
        },
        'runNotif': function (a, b) {
            return window.__kktjsMethods['runNotif'](this, a, b);
        },
        'runUser': function (a, b) {
            return window.__kktjsMethods['runUser'](this, a, b);
        },
        'runMulti': function (a, b) {
            return window.__kktjsMethods['runMulti'](this, a, b);
        },
        'runDetail': function (a, b) {
            return window.__kktjsMethods['runDetail'](this, a, b);
        },
        'runAcct': function (a, b) {
            return window.__kktjsMethods['runAcct'](this, a, b);
        },
        'runReply': function (a, b) {
            return window.__kktjsMethods['runReply'](this, a, b);
        },
        'runToast': function (a, b) {
            return window.__kktjsMethods['runToast'](this, a, b);
        },
        'runAuthClient': function (a, b) {
            return window.__kktjsMethods['runAuthClient'](this, a, b);
        },
        'fetchToken': function (a, b) {
            return window.__kktjsMethods['fetchToken'](this, a, b);
        },
        'fetchUser': function (a, b) {
            return window.__kktjsMethods['fetchUser'](this, a, b);
        },
        'resetHomeColumn': function () {
            return window.__kktjsMethods['resetHomeColumn'](this);
        },
        'resetLocalColumn': function () {
            return window.__kktjsMethods['resetLocalColumn'](this);
        },
        'resetNotifColumn': function () {
            return window.__kktjsMethods['resetNotifColumn'](this);
        },
        'resetMultiColumn': function () {
            return window.__kktjsMethods['resetMultiColumn'](this);
        },
        'resetAcctColumn': function () {
            return window.__kktjsMethods['resetAcctColumn'](this);
        },
        'resetStreamList': function () {
            return window.__kktjsMethods['resetStreamList'](this);
        },
        'refetchHome': _['debounce'](function (this: any) {
            return window.__kktjsMethods['refetchHome'](this);
        }, TIME_SCROLL),
        'refetchLocal': _['debounce'](function (this: any) {
            return window.__kktjsMethods['refetchLocal'](this);
        }, TIME_SCROLL),
        'refetchMulti': _['debounce'](function (this: any) {
            return window.__kktjsMethods['refetchMulti'](this);
        }, TIME_SCROLL),
        'refetchNotifAll': _['debounce'](function (this: any) {
            return window.__kktjsMethods['refetchNotifAll'](this);
        }, TIME_SCROLL),
        // 'fetchHome' は src/app/timeline.ts へ移行済み。
        // created() フックなど Vue 初期化中にも呼ばれるため、ここには TS 実装へ
        // 委譲する薄いスタブを残す。実体は window.__kktjsMethods.fetchHome。
        'fetchHome': function () {
            if (window.__kktjsMethods && window.__kktjsMethods.fetchHome) {
                return window.__kktjsMethods.fetchHome(this);
            }
        },
        'fetchLocal': function () {
            return window.__kktjsMethods['fetchLocal'](this);
        },
        // ★いろいろ取得
        'fetchMulti': function () {
            return window.__kktjsMethods['fetchMulti'](this);
        },
        'fetchNotifAll': function () {
            return window.__kktjsMethods['fetchNotifAll'](this);
        },
        'fetchNotifMention': function () {
            return window.__kktjsMethods['fetchNotifMention'](this);
        },
        'fetchNotifFav': function () {
            return window.__kktjsMethods['fetchNotifFav'](this);
        },
        'fetchNotifFollow': function () {
            return window.__kktjsMethods['fetchNotifFollow'](this);
        },
        'fetchNotifReblog': function () {
            return window.__kktjsMethods['fetchNotifReblog'](this);
        },
        'fetchAcctAll': function () {
            return window.__kktjsMethods['fetchAcctAll'](this);
        },
        'fetchAcctMedia': function () {
            return window.__kktjsMethods['fetchAcctMedia'](this);
        },
        'fetchAcctFav': function () {
            return window.__kktjsMethods['fetchAcctFav'](this);
        },
        'fetchAcctFollow': function () {
            return window.__kktjsMethods['fetchAcctFollow'](this);
        },
        'fetchAcctFollower': function () {
            return window.__kktjsMethods['fetchAcctFollower'](this);
        },
        'fetchAcctMute': function () {
            return window.__kktjsMethods['fetchAcctMute'](this);
        },
        'fetchAcctBlock': function () {
            return window.__kktjsMethods['fetchAcctBlock'](this);
        },
        'fetchAcctFollowRequest': function () {
            return window.__kktjsMethods['fetchAcctFollowRequest'](this);
        },
        'fetchAcctRelation': function () {
            return window.__kktjsMethods['fetchAcctRelation'](this);
        },
        'fetchAcctProfile': function () {
            return window.__kktjsMethods['fetchAcctProfile'](this);
        },
        'fetchAcctProfileRelation': function () {
            return window.__kktjsMethods['fetchAcctProfileRelation'](this);
        },
        'fetchAcctPinned': function () {
            return window.__kktjsMethods['fetchAcctPinned'](this);
        },
        'countFollowRequest': function (a, b) {
            return window.__kktjsMethods['countFollowRequest'](this, a, b);
        },
        'fetchDetail': function () {
            return window.__kktjsMethods['fetchDetail'](this);
        },
        'fetchDetailChain': function () {
            return window.__kktjsMethods['fetchDetailChain'](this);
        },
        'fetchDetailFav': function () {
            return window.__kktjsMethods['fetchDetailFav'](this);
        },
        'fetchDetailReblog': function () {
            return window.__kktjsMethods['fetchDetailReblog'](this);
        },
        'searchAll': function () {
            return window.__kktjsMethods['searchAll'](this);
        },
        'searchAcct': function () {
            return window.__kktjsMethods['searchAcct'](this);
        },
        'runUserId': function (a, b) {
            return window.__kktjsMethods['runUserId'](this, a, b);
        },
        'checkStreamHashtag': function (a, b) {
            return window.__kktjsMethods['checkStreamHashtag'](this, a, b);
        },
        'fetchStreamList': function () {
            return window.__kktjsMethods['fetchStreamList'](this);
        },
        'fetchListListed': function () {
            return window.__kktjsMethods['fetchListListed'](this);
        },
        'fetchListListedBackup': function () {
            return window.__kktjsMethods['fetchListListedBackup'](this);
        },
        'runListSearch': function (a, b) {
            return window.__kktjsMethods['runListSearch'](this, a, b);
        },
        'fetchListSearch': function () {
            return window.__kktjsMethods['fetchListSearch'](this);
        },
        'fetchListFollow': function () {
            return window.__kktjsMethods['fetchListFollow'](this);
        },
        'fetchListFollower': function () {
            return window.__kktjsMethods['fetchListFollower'](this);
        },
        'fetchListAcctRelation': function () {
            return window.__kktjsMethods['fetchListAcctRelation'](this);
        },
        'openThisPage': function (a, b) {
            return window.__kktjsMethods['openThisPage'](this, a, b);
        },
        'openAuth': function (a, b) {
            return window.__kktjsMethods['openAuth'](this, a, b);
        },
        'openProfile': function (a, b) {
            return window.__kktjsMethods['openProfile'](this, a, b);
        },
        'openMastodon': function (a, b) {
            return window.__kktjsMethods['openMastodon'](this, a, b);
        },
        'openAbout': function (a, b) {
            return window.__kktjsMethods['openAbout'](this, a, b);
        },
        'openPolicy': function (a, b) {
            return window.__kktjsMethods['openPolicy'](this, a, b);
        },
        'openWiki': function (a, b) {
            return window.__kktjsMethods['openWiki'](this, a, b);
        },
        'openDirectry': function (a, b) {
            return window.__kktjsMethods['openDirectry'](this, a, b);
        },
        'loadConf': function (a, b) {
            return window.__kktjsMethods['loadConf'](this, a, b);
        },
        'saveConf': function (a, b) {
            return window.__kktjsMethods['saveConf'](this, a, b);
        },
        'resetConf': function (a, b) {
            return window.__kktjsMethods['resetConf'](this, a, b);
        },
        'deleteConf': function () {
            return window.__kktjsMethods['deleteConf'](this);
        },
        'deleteToken': function () {
            return window.__kktjsMethods['deleteToken'](this);
        },
        'serviceWorkerUpdateCheck': function (a, b) {
            return window.__kktjsMethods['serviceWorkerUpdateCheck'](this, a, b);
        },
        'reloadForce': function (a, b) {
            return window.__kktjsMethods['reloadForce'](this, a, b);
        },
        'runSettingUser': function (a, b) {
            return window.__kktjsMethods['runSettingUser'](this, a, b);
        },
        'runSettingDrafts': function (a, b) {
            return window.__kktjsMethods['runSettingDrafts'](this, a, b);
        },
        'runSettingKatsuDrafts': function (a, b) {
            return window.__kktjsMethods['runSettingKatsuDrafts'](this, a, b);
        },
        'runSettingStreamHashtags': function (a, b) {
            return window.__kktjsMethods['runSettingStreamHashtags'](this, a, b);
        },
        'runSettingBookmark': function (a, b) {
            return window.__kktjsMethods['runSettingBookmark'](this, a, b);
        },
        'runSettingBookmarkNotif': function (a, b) {
            return window.__kktjsMethods['runSettingBookmarkNotif'](this, a, b);
        },
        'playSound': function (a) {
            return window.__kktjsMethods['playSound'](this, a);
        },
        'openImage': function (a) {
            return window.__kktjsMethods['openImage'](this, a);
        },
        'openImageAll': function (a) {
            return window.__kktjsMethods['openImageAll'](this, a);
        },
        'openWsHome': function (a, b) {
            return window.__kktjsMethods['openWsHome'](this, a, b);
        },
        'reopenWsHome': function (a, b) {
            return window.__kktjsMethods['reopenWsHome'](this, a, b);
        },
        'upHome': function (a, b) {
            return window.__kktjsMethods['upHome'](this, a, b);
        },
        'backHome': function (a, b) {
            return window.__kktjsMethods['backHome'](this, a, b);
        },
        'nextHome': function (a, b) {
            return window.__kktjsMethods['nextHome'](this, a, b);
        },
        'upNotif': function (a, b) {
            return window.__kktjsMethods['upNotif'](this, a, b);
        },
        'openWsLocal': function (a, b) {
            return window.__kktjsMethods['openWsLocal'](this, a, b);
        },
        'reopenWsLocal': function (a, b) {
            return window.__kktjsMethods['reopenWsLocal'](this, a, b);
        },
        'upLocal': function (a, b) {
            return window.__kktjsMethods['upLocal'](this, a, b);
        },
        'backLocal': function (a, b) {
            return window.__kktjsMethods['backLocal'](this, a, b);
        },
        'nextLocal': function (a, b) {
            return window.__kktjsMethods['nextLocal'](this, a, b);
        },
        'openWsMulti': function (a, b) {
            return window.__kktjsMethods['openWsMulti'](this, a, b);
        },
        'reopenWsMulti': function (a, b) {
            return window.__kktjsMethods['reopenWsMulti'](this, a, b);
        },
        'upMulti': function (a, b) {
            return window.__kktjsMethods['upMulti'](this, a, b);
        },
        'backMulti': function (a, b) {
            return window.__kktjsMethods['backMulti'](this, a, b);
        },
        'nextMulti': function (a, b) {
            return window.__kktjsMethods['nextMulti'](this, a, b);
        },
        'reopenForce': function (a, b) {
            return window.__kktjsMethods['reopenForce'](this, a, b);
        },
        'confirm': function (a, b) {
            return window.__kktjsMethods['confirm'](this, a, b);
        },
        'runBookmark': function (a, b) {
            return window.__kktjsMethods['runBookmark'](this, a, b);
        },
        'actList': function (a, b) {
            return window.__kktjsMethods['actList'](this, a, b);
        },
        'actUnList': function (a, b) {
            return window.__kktjsMethods['actUnList'](this, a, b);
        },
        'updateList': function (a, b) {
            return window.__kktjsMethods['updateList'](this, a, b);
        },
        'runAddList': function (a, b) {
            return window.__kktjsMethods['runAddList'](this, a, b);
        },
        'runRemoveList': function (a, b) {
            return window.__kktjsMethods['runRemoveList'](this, a, b);
        },
        'addStreamHashtag': function (a, b) {
            return window.__kktjsMethods['addStreamHashtag'](this, a, b);
        },
        'removeStreamHashtag': function (a, b) {
            return window.__kktjsMethods['removeStreamHashtag'](this, a, b);
        },
        'actVote': function (a, b) {
            return window.__kktjsMethods['actVote'](this, a, b);
        },
        'updateVote': function (a, b) {
            return window.__kktjsMethods['updateVote'](this, a, b);
        },
        'setVote': function (a, b) {
            return window.__kktjsMethods['setVote'](this, a, b);
        },
        'runExtime': function (a, b) {
            return window.__kktjsMethods['runExtime'](this, a, b);
        },
        'actFav': function (a, b) {
            return window.__kktjsMethods['actFav'](this, a, b);
        },
        'actUnFav': function (a, b) {
            return window.__kktjsMethods['actUnFav'](this, a, b);
        },
        'updateFav': function (a, b) {
            return window.__kktjsMethods['updateFav'](this, a, b);
        },
        'actReblog': function (a, b) {
            return window.__kktjsMethods['actReblog'](this, a, b);
        },
        'actUnReblog': function (a, b) {
            return window.__kktjsMethods['actUnReblog'](this, a, b);
        },
        'updateReblog': function (a, b) {
            return window.__kktjsMethods['updateReblog'](this, a, b);
        },
        'actFollow': function (a, b) {
            return window.__kktjsMethods['actFollow'](this, a, b);
        },
        'actUnFollow': function (a, b) {
            return window.__kktjsMethods['actUnFollow'](this, a, b);
        },
        'updateRelation': function (a, b) {
            return window.__kktjsMethods['updateRelation'](this, a, b);
        },
        'actFollowAuth': function (a, b) {
            return window.__kktjsMethods['actFollowAuth'](this, a, b);
        },
        'actUnFollowAuth': function (a, b) {
            return window.__kktjsMethods['actUnFollowAuth'](this, a, b);
        },
        'updateFollowAuth': function (a, b) {
            return window.__kktjsMethods['updateFollowAuth'](this, a, b);
        },
        'actMute': function (a, b) {
            return window.__kktjsMethods['actMute'](this, a, b);
        },
        'actUnMute': function (a, b) {
            return window.__kktjsMethods['actUnMute'](this, a, b);
        },
        'actBlock': function (a, b) {
            return window.__kktjsMethods['actBlock'](this, a, b);
        },
        'actUnBlock': function (a, b) {
            return window.__kktjsMethods['actUnBlock'](this, a, b);
        },
        'actPin': function (a, b) {
            return window.__kktjsMethods['actPin'](this, a, b);
        },
        'actUnPin': function (a, b) {
            return window.__kktjsMethods['actUnPin'](this, a, b);
        },
        'updatePin': function (a, b) {
            return window.__kktjsMethods['updatePin'](this, a, b);
        },
        'actDelete': function (a, b) {
            return window.__kktjsMethods['actDelete'](this, a, b);
        },
        'updateDelete': function (a, b) {
            return window.__kktjsMethods['updateDelete'](this, a, b);
        },
        'actReport': function (a, b) {
            return window.__kktjsMethods['actReport'](this, a, b);
        },
        'actProfile': function (a, b) {
            return window.__kktjsMethods['actProfile'](this, a, b);
        },
        'actListProfile': function (a, b) {
            return window.__kktjsMethods['actListProfile'](this, a, b);
        },
        'updateImgLoading': function (a, b) {
            return window.__kktjsMethods['updateImgLoading'](this, a, b);
        },
        'updateMediaWrapper': function (a, b) {
            return window.__kktjsMethods['updateMediaWrapper'](this, a, b);
        },
        'updateContentWrapper': function (a, b) {
            return window.__kktjsMethods['updateContentWrapper'](this, a, b);
        },
        'updateWrapperBM': function (a, b) {
            return window.__kktjsMethods['updateWrapperBM'](this, a, b);
        },
        'updateWrapperAll': function (a, b) {
            return window.__kktjsMethods['updateWrapperAll'](this, a, b);
        },
        'updateWrapper': function (a, b) {
            return window.__kktjsMethods['updateWrapper'](this, a, b);
        },
        'updateFilterBM': function (a, b) {
            return window.__kktjsMethods['updateFilterBM'](this, a, b);
        },
        'updateFilterAll': function (a, b) {
            return window.__kktjsMethods['updateFilterAll'](this, a, b);
        },
        'setResizer': function (a, b) {
            return window.__kktjsMethods['setResizer'](this, a, b);
        },
        'setHistory': function (a, b) {
            return window.__kktjsMethods['setHistory'](this, a, b);
        },
        'setNotifSound': function (a, b) {
            return window.__kktjsMethods['setNotifSound'](this, a, b);
        },
        'resetColumn': function (a, b) {
            return window.__kktjsMethods['resetColumn'](this, a, b);
        },
        'checkActMedia': function (a, b) {
            return window.__kktjsMethods['checkActMedia'](this, a, b);
        },
        'actMedia': function (a, b) {
            return window.__kktjsMethods['actMedia'](this, a, b);
        },
        'removeMedia': function (a, b) {
            return window.__kktjsMethods['removeMedia'](this, a, b);
        },
        'saveKatsu': function (a, b) {
            return window.__kktjsMethods['saveKatsu'](this, a, b);
        },
        'actKatsuShortCut': function (a, b) {
            return window.__kktjsMethods['actKatsuShortCut'](this, a, b);
        },
        'actKatsu': function (a, b) {
            return window.__kktjsMethods['actKatsu'](this, a, b);
        },
        'refreshKatsu': function (a, b) {
            return window.__kktjsMethods['refreshKatsu'](this, a, b);
        },
        'spoilerLength': function () {
            return window.__kktjsMethods['spoilerLength'](this);
        },
        'contentLength': function () {
            return window.__kktjsMethods['contentLength'](this);
        },
        'refreshCount': _['debounce'](function (this: any) {
            return window.__kktjsMethods['refreshCount'](this);
        }, TIME_REFRESH),
        'addSpoiler': function (a) {
            return window.__kktjsMethods['addSpoiler'](this, a);
        },
        'restoreSpoiler': function (a) {
            return window.__kktjsMethods['restoreSpoiler'](this, a);
        },
        'disableSpoiler': function (a) {
            return window.__kktjsMethods['disableSpoiler'](this, a);
        },
        'addContent': function (a) {
            return window.__kktjsMethods['addContent'](this, a);
        },
        'contentExchange': function (a, b) {
            return window.__kktjsMethods['contentExchange'](this, a, b);
        },
        'contentToDraft': function (a, b) {
            return window.__kktjsMethods['contentToDraft'](this, a, b);
        },
        'draftToContent': function (a, b) {
            return window.__kktjsMethods['draftToContent'](this, a, b);
        },
        'katsuToDraft': function (a, b) {
            return window.__kktjsMethods['katsuToDraft'](this, a, b);
        },
        'draftToKatsu': function (a, b) {
            return window.__kktjsMethods['draftToKatsu'](this, a, b);
        },
        'checkKatsu': function (a, b) {
            return window.__kktjsMethods['checkKatsu'](this, a, b);
        },
        'openEmoji': function (a, b) {
            return window.__kktjsMethods['openEmoji'](this, a, b);
        },
        'closeEmoji': function (a, b) {
            return window.__kktjsMethods['closeEmoji'](this, a, b);
        },
        'popError': function (a, b, c) {
            return window.__kktjsMethods['popError'](this, a, b, c);
        },
        'jumpKatsu': function (a, b) {
            return window.__kktjsMethods['jumpKatsu'](this, a, b);
        }
    }
});
// Vue 3: createApp が返したアプリインスタンスへコンポーネント/ディレクティブを登録し、
// その後 mount('#app') する。mount の戻り値が公開インスタンス（旧 new Vue 相当）であり、
// 以降のコード（changeAppActive 等）および window.app はこれを参照する。
registerVueComponentsAndDirectives(__kktjsApp);
var app: any = __kktjsApp.mount('#app');

function changeAppActive(this: any, _0xa29241: any) {
    if (_0xa29241 && !app['$data']['app_network']) {
        app["refetchHome"]();
        app['refetchNotifAll']();
        app["openWsHome"]();
        app["refetchLocal"]();
        app['openWsLocal']();
        app["refetchMulti"]();
        app["openWsMulti"]();
        app['$data']["app_network"] = true;
    }
    if (this['ua'] != 'pc') {
        app['$data']["app_active"] = _0xa29241;
    }
}
function importdragenter(_0x4f918b) {
    _0x4f918b["preventDefault"]();
    if (app['$data']['at'] == null) {
        return;
    }
    if (!app['$data']['showForm']) {
        app['toggleForm']();
    }
    app['$data']["showFileImporter"] = true;
}
function importdragover(_0x3861b3) {
    _0x3861b3["preventDefault"]();
}
function importdrop(_0x31edc2) {
    _0x31edc2["preventDefault"]();
    if (app['$data']['at'] == null) {
        return;
    }
    app['$data']["showFileImporter"] = false;
    if (0x4 <= app['$data']['katsu']['media_previews'].length || app['$data']['katsu']['media_previews'].length != app['$data']['katsu']['media_attachments'].length) {
        return;
    }
    // dataTransfer / files が無い環境でも落ちないように安全に取り出す。
    var _dt = _0x31edc2 ? _0x31edc2['dataTransfer'] : null;
    var _files = _dt && _dt['files'] ? _dt['files'] : null;
    if (!_files || !_files.length) {
        return;
    }
    if (0 != _files.length && app['$data']["showFormVote"]) {
        app['$data']['result_text'] = "[Media] アンケートには画像を付けられないよ。";
        return;
    }
    app["checkActMedia"](_files);
}
function importpaste(_0xb7cd91) {
    if (app['$data']['at'] == null) {
        return;
    }
    // clipboardData / files はブラウザによって存在しない・null のことがある（特に一部 Android 系）。
    // 安全に画像ファイルの有無を取り出す。取れなければ「画像なし」として通常のテキスト貼り付けに任せる。
    var _cd = _0xb7cd91 ? _0xb7cd91['clipboardData'] : null;
    var _files = _cd && _cd['files'] ? _cd['files'] : null;
    if (!_files || !_files.length) {
        // クリップボードに画像ファイルが無い（純粋なテキスト貼り付け、または clipboardData 非対応）。
        // ブラウザ既定のテキスト貼り付けに任せるため preventDefault せずに離脱。
        return;
    }
    // ここに来た時点でクリップボードに画像ファイルがある（画像貼り付け）。
    // ブラウザ既定動作（画像の代替テキスト/HTML が投稿欄へ同時に貼られる）を抑制する。
    // これをしないと、画像アップロードとテキスト貼り付けが二重に起きてしまう。
    if (_0xb7cd91 && typeof _0xb7cd91['preventDefault'] === 'function') {
        _0xb7cd91['preventDefault']();
    }
    if (!app['$data']['showForm']) {
        app['toggleForm']();
    }
    if (0x4 <= app['$data']['katsu']['media_previews'].length || app['$data']['katsu']['media_previews'].length != app['$data']['katsu']['media_attachments'].length) {
        return;
    }
    if (0 != _files.length && app['$data']['showFormVote']) {
        app['$data']['result_text'] = '[Media]\x20アンケートには画像を付けられないよ。';
        return;
    }
    app["checkActMedia"](_files);
}
function importclick(_0xd2d1ca) {
    if (app['$data']['at'] == null) {
        return;
    }
    if (!_0xd2d1ca.length) {
        return;
    }
    if (0x4 <= app['$data']['katsu']['media_previews'].length || app['$data']['katsu']['media_previews'].length != app['$data']['katsu']['media_attachments'].length) {
        return;
    }
    if (0 != _0xd2d1ca.length && app['$data']["showFormVote"]) {
        app['$data']['result_text'] = "[Media] アンケートには画像を付けられないよ。";
        return;
    }
    app["checkActMedia"](_0xd2d1ca);
}
function touchController(_0x58e9c0, _0x4380ab) {
    if (0 == _0x58e9c0 && 1 == _0x4380ab) {
        app["toggleForm"]();
        return;
    }
    if (1 == _0x58e9c0 && 0 == _0x4380ab) {
        if (app['$data']['showForm']) {
            app["saveKatsu"]();
            app['$data']['showForm'] = false;
        }
        app['$data']['showSearch'] = false;
        app['$data']['showStream'] = false;
        app['$data']['showSetting'] = false;
        return;
    }
    if (0 == _0x58e9c0 && -1 == _0x4380ab || -1 == _0x58e9c0 && 0 == _0x4380ab) {
        app['toggleLink']();
        return;
    }
}
function swipedetect(_0x4f8ecc, _0x52cc36) {
    var _0x183dec = _0x4f8ecc, _0x267279, _0x49dc99, _0x30e866, _0x1a8dcd, _0x5bea66, _0x4d84c4 = window.innerWidth / 0x4 >= 0x78 ? window.innerWidth / 0x10 + 0x5a : window.innerWidth / 0x4 + 0x8, _0x448d26, _0x2f750a, _0x380dfd, _0x25676c = _0x52cc36 || function (_0x267279) { }
        ;
    _0x183dec['addEventListener']('touchstart', function (_0x5cdf8f) {
        if (app['$data']['showLink']) {
            _0x448d26 = -1;
        } else if (app['$data']['showForm'] || app['$data']['showSearch'] || app['$data']['showStream'] || app['$data']['showSetting']) {
            _0x448d26 = 1;
        } else {
            _0x448d26 = 0;
        }
        var _0x276250 = _0x5cdf8f["changedTouches"][0];
        dist = 0;
        _0x49dc99 = _0x276250["pageX"];
        _0x1a8dcd = _0x276250["pageY"];
    }, {
        'passive': true
    });
    _0x183dec['addEventListener']("touchmove", _['debounce'](function (this: any, _0x14cf7e) {
        var _0x59e683 = _0x14cf7e['changedTouches'][0];
        _0x267279 = 0;
        _0x30e866 = _0x59e683['pageX'] - _0x49dc99;
        _0x5bea66 = _0x59e683["pageY"] - _0x1a8dcd;
        if (Math['abs'](_0x5bea66) >= Math['abs'](_0x30e866)) {
            if (!app['$data']['result_lock']) {
                app['$data']['result_type'] = '';
                app['$data']['result_text'] = '';
                app['$data']['error_cnt'] = 0;
            }
            return;
        }
        if (app['$data']['showLink']) {
            _0x2f750a = -1;
        } else if (app['$data']['showForm'] || app['$data']['showSearch'] || app['$data']['showStream'] || app['$data']['showSetting']) {
            _0x2f750a = 1;
        } else {
            _0x2f750a = 0;
        }
        if (Math['abs'](_0x30e866) >= _0x4d84c4) {
            _0x267279 = _0x30e866 < 0 ? 1 : -1;
        }
        _0x380dfd = _0x267279 + _0x2f750a;
        if (0x2 <= _0x380dfd || _0x380dfd <= -2) {
            return;
        }
        if (0x2 <= Math['abs'](_0x448d26 - _0x380dfd)) {
            return;
        }
        if (_0x2f750a == _0x380dfd) {
            _0x380dfd = _0x448d26;
        }
        if (_0x2f750a == _0x380dfd) {
            return;
        }
        _0x25676c(_0x2f750a, _0x380dfd);
    }, TIME_TOUCH), {
        'passive': true
    });
}
swipedetect(document.getElementById('app'), touchController);
function getParameterByName(_0x55941c: string, _0x46df54?: string) {
    if (!_0x46df54) {
        _0x46df54 = window.location.href;
    }
    var _0x2b40e4 = new RegExp('[?&]' + _0x55941c.replace(/[\[\]]/g, '\\$&') + "(=([^&#]*)|&|#|$)")["exec"](_0x46df54);
    if (!_0x2b40e4) {
        return null;
    }
    if (!_0x2b40e4[2]) {
        return '';
    }
    return decodeURIComponent(_0x2b40e4[2].replace(/\+/g, '\x20'));
}
function base64ToBlob(b64str) {
    var _0x316891 = window.atob(b64str['split'](',')[1]);
    var _0x372d33 = new Uint8Array(new ArrayBuffer(_0x316891.length));
    for (var _0x3331e5 = 0; _0x3331e5 < _0x316891.length; _0x3331e5++) {
        _0x372d33[_0x3331e5] = _0x316891['charCodeAt'](_0x3331e5);
    }
    return new Blob([_0x372d33], {
        'type': 'image/jpeg'
    });
}
function inputVote(_0x4f5fb6, _0x46033e) {
    app['$data']['katsu']['poll_work']['texts'][_0x46033e] = _0x4f5fb6['value'];
}
function inputSearch(_0x80e9f5) {
    app['$data']["search_text"] = _0x80e9f5['value'];
}
function inputList(_0x3fe06d) {
    app['$data']["stream_list_text"] = _0x3fe06d['value'];
    app["checkStreamListText"]();
}
function inputListProfile(_0xce104a) {
    app['$data']["listprofile"]["name"] = _0xce104a['value'];
    app["checkListProfile"]();
}
function inputKatsuFilterRaw(_0x731379) {
    if (app['$data']['result_text_tmp'] != '') {
        app['$data']['result_text_tmp'] = '';
        app['$data']['error_cnt'] = 0;
    }
    app['$data']['optKatsuFilterRaw'] = _0x731379['value'];
}
function autogrow(_0x1d49e5) {
    _0x1d49e5['style']['height'] = '5px';
    _0x1d49e5['style']['height'] = _0x1d49e5['scrollHeight'] + 4 + 'px';
    app['refreshCount']();
}
function popNotif(_0x3df6e1, _0x4eeb24) {
    if (!("Notification" in window)) {
        console["log"]("このブラウザはシステム通知をサポートしていません");
    } else if (Notification["permission"] === "granted") {
        var _0x326cb6 = new Notification(_0x3df6e1, _0x4eeb24);
    } else if (Notification['permission'] !== "denied") {
        Notification["requestPermission"](function (_0x9e4c9e) {
            if (_0x9e4c9e === "granted") {
                var _0x326cb6 = new Notification(_0x3df6e1, _0x4eeb24);
            }
        });
    }
}
function escapeHtml(htmlStr) {
    if (typeof htmlStr !== 'string') {
        return htmlStr;
    }
    return htmlStr.replace(/[&'`"<>]/g, function (str) {
        return {
            '&': '&amp;',
            '\'': '&#x27;',
            '`': '&#x60;',
            '"': '&quot;',
            '<': '&lt;',
            '>': '&gt;'
        }[str];
    });
}
function patchEmoji(_0x54d410, _0x133a9b) {
    var _0x4a5584 = _0x54d410;
    if (_0x133a9b != null && _0x133a9b.length != 0) {
        _0x133a9b.filter(function (_0x4b3915, i) {
            _0x4a5584 = _0x4a5584['split'](':' + _0x4b3915['shortcode'] + ':')['join']('<img class="emojione" title=":' + _0x4b3915['shortcode'] + ':\x22\x20src=\x22' + _0x4b3915['static_url'] + '\x22>');
        });
    }
    return _0x4a5584;
}
function encodeHtmlForm(_0x3d1718) {
    var _0xa59a65 = [];
    for (var _0x543b96 in _0x3d1718) {
        var _0x3ee273 = encodeURIComponent(_0x543b96) + '=' + encodeURIComponent(_0x3d1718[_0x543b96]);
        _0xa59a65.push(_0x3ee273);
    }
    return _0xa59a65['join']('&').replace(/%20/g, '+');
}
app['$data']['optConvMedia'] = 'off';

// --- グローバル公開（バンドル後も index.html の inline ハンドラ/テンプレートから
//     参照できるようにするため window へ割り当てる） ---
window.app = app;
// 画像の onerror="this.src=IMG_DUMMY"（素のHTML属性=グローバル評価）から参照される。
// 元の難読化 main.js では IMG_DUMMY はトップレベル var で window に乗っていたが、
// IIFE バンドル化でモジュールローカルになり window から消えていた。挙動維持のため再公開。
window.IMG_DUMMY = IMG_DUMMY;
window.wsHome = wsHome;
window.wsLocal = wsLocal;
window.wsMulti = wsMulti;
window.changeAppActive = changeAppActive;
window.importclick = importclick;
window.importdragenter = importdragenter;
window.importdragover = importdragover;
window.importdrop = importdrop;
window.importpaste = importpaste;

// --- 復帰時の強制再接続ヘルパー（resume-reconnect から呼ばれる） ---
// ソケット変数(wsHome等)は本モジュール内で閉じているため、死活判定と張り直しも
// ここで行い、単一の真実点を保つ。
//
// 重要: 二重接続を防ぐため、「本当に死んだ」ソケット(CLOSING=2 / CLOSED=3 / null)
// のときだけ張り直す。OPEN(1) は当然そのまま、CONNECTING(0) も「生きようとしている
// 最中」なので潰さない（潰して開き直すと、閉じきる前の旧ソケットと新ソケットの双方が
// 同じ投稿を配信し、タイムラインに重複表示される）。
// また、閉じる旧ソケットの onmessage を事前に無効化し、close 後にイベントが届いても
// タイムラインへ反映されないようにする。
function kktjsIsDead(ws) {
  // null / CLOSING(2) / CLOSED(3) を死とみなす。OPEN(1) と CONNECTING(0) は生存扱い。
  return !ws || ws.readyState === 2 || ws.readyState === 3;
}
function kktjsSilenceAndClose(ws) {
  try {
    if (ws) {
      ws.onmessage = null;
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      if (ws.readyState !== 3) ws.close();
    }
  } catch (e) {}
}
function kktjsForceReconnectAll() {
  try {
    if (typeof app === 'undefined' || !app['$data']) return;
    var d = app['$data'];
    d['app_active'] = true;
    d['app_network'] = true;

    // Home: 死んでいるときだけ張り直す。
    if (kktjsIsDead(wsHome)) {
      kktjsSilenceAndClose(wsHome);
      wsHome = null;
      d['fetch_lock']['homews'] = false;
      d['connHome'] = 'ready';
      try { app['openWsHome'](); } catch (e) {}
      try { app['refetchHome'](); } catch (e) {}
      try { app['refetchNotifAll'](); } catch (e) {}
    }
    // Local
    if (kktjsIsDead(wsLocal)) {
      kktjsSilenceAndClose(wsLocal);
      wsLocal = null;
      d['fetch_lock']['localws'] = false;
      d['connLocal'] = 'ready';
      try { app['openWsLocal'](); } catch (e) {}
      try { app['refetchLocal'](); } catch (e) {}
    }
    // Multi（表示中カラムがあるときのみ再接続）
    var multiActive = !!d['multi_target'] && d['multi_target'] !== '';
    if (kktjsIsDead(wsMulti)) {
      kktjsSilenceAndClose(wsMulti);
      wsMulti = null;
      d['fetch_lock']['multiws'] = false;
      d['connMulti'] = 'ready';
      if (multiActive) {
        try { app['openWsMulti'](); } catch (e) {}
        try { app['refetchMulti'](); } catch (e) {}
      }
    }
    try { app['$forceUpdate'](); } catch (e) {}
  } catch (e) { /* noop */ }
}
window.kktjsForceReconnectAll = kktjsForceReconnectAll;

