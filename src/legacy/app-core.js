// =============================================================================
// legacy/app-core.js
// 旧 main.js（難読化）を解読・整形した中核ロジック。Vueアプリ本体
// （data/created/watch/computed/243 methods）とストリーミング/各種グローバル
// 関数を含む。段階的TS移行の出発点として丸ごと取り込み、ビルド成果物を従来と
// 同等に保つ。メソッドは順次 src/ 配下の型付きモジュールへ切り出していく。
// グローバル（Vue / _ / emojione）は index.html 読み込みのものを参照する。
// =============================================================================
/* eslint-disable */
// @ts-nocheck

const BOOP = 'sounds/boop.mp3';
const BOOP_EX = 'sounds/boop.mp3';
const IMG_DUMMY = '/kktjs/img/missing_header.png';
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
const DIS_API = 'discordapp.com/api';
const DIS_API_VER = '6';
const DIS_TOKEN = 'https://[I]/oauth2/token';
const DIS_ST = 'https://[I]/gateway';
const DIS_USER = 'https://[I]/users/@me';
const DIS_TH = 'https://[I]/channels/[CH]/messages?limit=[LM]';
const DIS_CHANNEL = {
    'room0': '405706906049708034',
    'room1': '305718290016370688',
    'room2': '305717014822125568'
};
const DIS_WTH1 = 'https://[I]/webhooks/405741747357089792/BJer_pYIrH5Cx6NZITjTRBWojqvUnemz8fkH9vBKCkH-1bVW8rQfQTL5ZFRDoT0MHx2I';
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
let ST_DISCORD = '';
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
var wsDiscord = null;
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
// （main.ts が new Vue より前に registerVueComponentsAndDirectives() を実行）

var app = new Vue({
    'el': "#app",
    'data': {
        'startApp': ![],
        'connHome': 'ready',
        'connLocal': 'ready',
        'connMulti': 'ready',
        'connDiscord': 'ready',
        'showHome': ![],
        'showHomeOption': ![],
        'showLocal': ![],
        'showLocalOption': ![],
        'showMulti': ![],
        'showMultiOption': ![],
        'showNotif': ![],
        'showNotifOption': ![],
        'showDetail': ![],
        'showAcct': ![],
        'showAcctEdit': ![],
        'showAcctOption': ![],
        'showSetting': ![],
        'showSearch': ![],
        'showStream': ![],
        'showStreamEdit': ![],
        'showForm': ![],
        'showFormSpoiler': ![],
        'showFormVote': ![],
        'showFormDraft': ![],
        'showFormFileImporter': ![],
        'showFormVisible': ![],
        'showSideLink': ![],
        'showLink': ![],
        'showLinkSearch': ![],
        'showLinkStream': '',
        'showMedia': ![],
        'showEmojiPicker': ![],
        'showConfirm': ![],
        'showDebug': ![],
        'showDebugVia': ![],
        'optColumns': '',
        'optPtl': '',
        'optSimple': '',
        'optAutoPlay': '',
        'optAllNsfw': '',
        'optAllOpen': '',
        'optMode': '',
        'optConfirm': {},
        'optColumnWide': ![],
        'optAutoLayout': ![],
        'optKeepForm': !![],
        'optConvMedia': '',
        'optThemeTops': '',
        'optThemeBottoms': '',
        'optThemeSound': '',
        'optShortNotif': !![],
        'optPushNotif': !![],
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
        'result_lock': ![],
        'result_text_tmp': '',
        'media_uploaded': '0',
        'repository': 'kirakiratter.com',
        'app_name': 'kktjs',
        'app_ver': '1.4',
        'app_ver_top': 'js v1.4.8a',
        'app_mode': 'web',
        'app_active': !![],
        'app_network': !![],
        'app_wait_update': ![],
        'sw_stat': {
            'enabled': 'serviceWorker' in navigator,
            'controller': 'serviceWorker' in navigator ? null != navigator['serviceWorker']["controller"] : ![]
        },
        'conf_ver': 1,
        'error_cnt': 0,
        'at': userConf['getItem']('at'),
        'ua': 'pc',
        'uaop': '',
        'autologin': !![],
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
        'user_discord': [],
        'at_discord': null != userConf['getItem']('at_discord') ? JSON.parse(userConf['getItem']('at_discord')) : '',
        'discord_id': '',
        'discords': [],
        'discord_type': "room0",
        'discord_unread': 0,
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
            'complete': !![]
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
        'stream_list_following': ![],
        'stream_list_users': [],
        'stream_list_users_bu': [],
        'stream_list_users_relation': [],
        'stream_list_text': '',
        'stream_list_text_check': ![],
        'stream_list_profile_check': ![],
        'stream_hashtags': null != userConf['getItem']('work_stream_hashtags') ? JSON.parse(userConf['getItem']('work_stream_hashtags')) : [],
        'stream_hashtag_text': '',
        'stream_channels': ["あかりちゃんち 第一映写室", "あかりちゃんち 第二映写室"],
        'katsu': {
            'status': '',
            'in_reply_to_id': null,
            'reply': [],
            'media_ids': [],
            'sensitive': ![],
            'nsfw': ![],
            'spoiler_text': '',
            'visibility': '',
            'content': '',
            'media_attachments': [],
            'media_previews': [],
            'poll': {
                'options': [],
                'multiple': ![],
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
            'update': ![],
            'home': ![],
            'local': ![],
            'notif': ![],
            'acct': ![],
            'multi': ![],
            'lists': ![],
            'search': ![],
            'search_hashtag': ![],
            'discord': ![],
            'homews': ![],
            'localws': ![],
            'multiws': ![]
        },
        'fetch_watch': {
            'detail': ![],
            'detail_chain': ![],
            'detail_fav': ![],
            'detail_reblog': ![],
            'acct_profile': ![],
            'acct_profile_rel': ![],
            'acct_profile_pin': ![],
            'acct_profile_req': ![]
        },
        'fetch_comp': {
            'home': ![],
            'local': ![],
            'notif': ![],
            'acct': ![],
            'multi': ![],
            'lists': ![],
            'notif_filter': ![]
        },
        'fetch_after': {
            'home': ![],
            'local': ![],
            'notif': ![],
            'lists': ![],
            'user': ![]
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
    },
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
            this['autologin'] = !![];
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
        this.fetch_lock.localws = !![];
        this.resetLocalColumn();
        this.fetchLocal();
        this.openWsLocal();
        this.fetch_lock.homews = !![];
        this.resetHomeColumn();
        this.fetchHome();
        this.openWsHome();
        this.fetch_lock.multiws = !![];
        this.resetMultiColumn();
        this.multi_type == 'Direct';
        this.fetchMulti();
        this.openWsMulti();
        this.fetchNotifAll();
        this.setHistory();
        if (null != userConf.getItem('columns')) {
            this.showSetting = !![];
        }
        if (null == userConf.getItem('conf_std')) {
            this.showSetting = !![];
        }
        this.setNotifSound('soundoff', null);
        this.setNotifSound('sound', BOOP);
        this.setNotifSound('soundex', BOOP_EX);
        if (this.ua == 'ios' && this.optThemeSound != 'off') {
            this.result_lock = !![];
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
        'formatContent': function (_0x2bd990, _0x543689) {
            return _0x2bd990 != null ? emojione["toImage"](patchEmoji(_0x2bd990, _0x543689)['split']("<a href=\"https://kirakiratter.com/web/statuses/")['join']("<a href=\"javascript:void(0)\" onClick=\"app._data.detail_targetid = decodeURIComponent(this.getAttribute('stats'));app.runDetail(app._data.detail_targetid);return false;\" stats=\"")['split']('<a\x20href=\x22https://kirakiratter.com/tags/')['join']("<a href=\"javascript:void(0)\" onClick=\"app._data.search_hashtag = decodeURIComponent(this.getAttribute('tag'));app.runMulti('Hashtag', app._data.search_hashtag);app.reopenWsMulti('Hashtag', app._data.search_hashtag);return false;\" tag=\"")['split']("<a href=\"https://kirakiratter.com/@")['join']('<a\x20href=\x22javascript:void(0)\x22\x20onClick=\x22app._data.search_userid\x20=\x20this.getAttribute(\x27user\x27);app.runUserId();return\x20false;\x22\x20user=\x22').replace(/>kirakiratter.com\/media\/[\s\S]*?<\/span>/g, "><i class=\"fa fa-fw fa-photo \"></i></span>")).replace(/:name_badge:/g, '📛').replace(/  /g, "&nbsp;&nbsp;") : '';
        },
        'formatSpoiler': function (_0x6e662, _0x293600) {
            return _0x6e662 != null ? emojione["toImage"](patchEmoji(escapeHtml(_0x6e662), _0x293600)['split']("<a href=\"https://kirakiratter.com/web/statuses/")['join']("<a href=\"javascript:void(0)\" onClick=\"app._data.detail_targetid = decodeURIComponent(this.getAttribute('stats'));app.runDetail(app._data.detail_targetid);return false;\" stats=\"")['split']("<a href=\"https://kirakiratter.com/tags/")['join']("<a href=\"javascript:void(0)\" onClick=\"app._data.search_hashtag = decodeURIComponent(this.getAttribute('tag'));app.runMulti('Hashtag', app._data.search_hashtag);app.reopenWsMulti('Hashtag', app._data.search_hashtag);return false;\" tag=\"")['split']("<a href=\"https://kirakiratter.com/@")['join']("<a href=\"javascript:void(0)\" onClick=\"app._data.search_userid = this.getAttribute('user');app.runUserId();return false;\" user=\"").replace(/>kirakiratter.com\/media\/[\s\S]*?<\/span>/g, "><i class=\"fa fa-fw fa-photo \"></i></span>")).replace(/:name_badge:/g, '📛').replace(/  /g, "&nbsp;&nbsp;").replace(/\r\n/g, "<br />").replace(/(\n|\r)/g, "<br />") : '';
        },
        'formatContentConfirm': function (_0x384b46, _0x32b2ea) {
            return _0x384b46 != null ? emojione["toImage"](patchEmoji(escapeHtml(_0x384b46), _0x32b2ea)['split']("<a href=\"https://kirakiratter.com/web/statuses/")['join']("<a href=\"javascript:void(0)\" onClick=\"app._data.detail_targetid = decodeURIComponent(this.getAttribute('stats'));app.runDetail(app._data.detail_targetid);return false;\" stats=\"")['split']("<a href=\"https://kirakiratter.com/tags/")['join']("<a href=\"javascript:void(0)\" onClick=\"app._data.search_hashtag = decodeURIComponent(this.getAttribute('tag'));app.runMulti('Hashtag', app._data.search_hashtag);app.reopenWsMulti('Hashtag', app._data.search_hashtag);return false;\" tag=\"")['split']("<a href=\"https://kirakiratter.com/@")['join']("<a href=\"javascript:void(0)\" onClick=\"app._data.search_userid = this.getAttribute('user');app.runUserId();return false;\" user=\"").replace(/https:\/\/kirakiratter.com\/media\/[\s\S]*? /g, "<i class=\"fa fa-fw fa-photo \"></i>")).replace(/:name_badge:/g, '📛').replace(/  /g, '&nbsp;&nbsp;').replace(/(\r\n){2,}/g, "<br /><br />").replace(/(\n|\r){2,}/g, "<br /><br />").replace(/\r\n/g, "<br />").replace(/(\n|\r)/g, "<br />") : '';
        },
        'formatSpoilerConfirm': function (_0x486e64, _0xa8e05b) {
            return _0x486e64 != null ? emojione["toImage"](patchEmoji(escapeHtml(_0x486e64), _0xa8e05b)['split']("<a href=\"https://kirakiratter.com/web/statuses/")['join']("<a href=\"javascript:void(0)\" onClick=\"app._data.detail_targetid = decodeURIComponent(this.getAttribute('stats'));app.runDetail(app._data.detail_targetid);return false;\" stats=\"")['split']("<a href=\"https://kirakiratter.com/tags/")['join']("<a href=\"javascript:void(0)\" onClick=\"app._data.search_hashtag = decodeURIComponent(this.getAttribute('tag'));app.runMulti('Hashtag', app._data.search_hashtag);app.reopenWsMulti('Hashtag', app._data.search_hashtag);return false;\" tag=\"")['split']("<a href=\"https://kirakiratter.com/@")['join']("<a href=\"javascript:void(0)\" onClick=\"app._data.search_userid = this.getAttribute('user');app.runUserId();return false;\" user=\"").replace(/https:\/\/kirakiratter.com\/media\/[\s\S]*? /g, "<i class=\"fa fa-fw fa-photo \"></i>")).replace(/:name_badge:/g, '📛').replace(/  /g, "&nbsp;&nbsp;").replace(/\r\n/g, "<br />").replace(/(\n|\r)/g, "<br />") : '';
        },
        'formatEmoji': function (_0x3d3bd4, _0xdb2ad8) {
            return _0x3d3bd4 != null ? emojione['toImage'](patchEmoji(_0x3d3bd4, _0xdb2ad8)).replace(/:name_badge:/g, '📛') : '';
        },
        'formatEmojiDraft': function (_0x1b6a15, _0x2db5e9) {
            return _0x1b6a15 != null ? emojione["toImage"](patchEmoji(escapeHtml(_0x1b6a15), _0x2db5e9)).replace(/:name_badge:/g, '📛') : '';
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
        'checkAvatarDiscord': function (v) {
            return window.__kktjsMethods['checkAvatarDiscord'](this, v);
        },
        'checkVote': function (v) {
            return window.__kktjsMethods['checkVote'](this, v);
        },
        'equalArr': function (a, b) {
            return window.__kktjsMethods['equalArr'](this, a, b);
        },
        'checkStreamListText': _['debounce'](function () {
            this["stream_list_text_check"] = this["stream_list_text"] != null && this['stream_list_text'].length > 0 ? !![] : ![];
        }, TIME_REFRESH),
        'checkListProfile': _['debounce'](function () {
            this["stream_list_profile_check"] = this["listprofile"]['name'] != null && this["listprofile"]["name"].length > 0 ? !![] : ![];
        }, TIME_REFRESH),
        'handleWheel': _['debounce'](function (_0x2ce36b) {
            if (!this['result_lock']) {
                this['result_type'] = '';
                this['result_text'] = '';
                this['error_cnt'] = 0;
            }
        }, TIME_SCROLL),
        'handleScrollHome': _['debounce'](function (e) {
            if (!this['result_lock']) {
                this['result_type'] = '';
                this['result_text'] = '';
                this['error_cnt'] = 0;
            }
            this['home_posy'] = parseInt(e.target['scrollTop']);
            this["home_posy_b"] = parseInt(e.target['scrollHeight'] - e.target['clientHeight'] - e.target['scrollTop']);
            if (!this['fetch_lock']['home'] && this['home_posy'] != this["home_posy_b"] && threshold_low >= this['home_posy_b'] && 0 <= this["home_posy_b"]) {
                this['fetch_lock']['home'] = !![];
                this.home_unread = this.homes.length - LIMIT;
                this['fetchHome']();
            } else if (!this['fetch_lock']['home'] && this['home_posy'] != this["home_posy_b"] && threshold_high >= this['home_posy'] && 0 <= this["home_posy_b"]) {
                if (this.home_unread - LIMIT < 0) {
                    this.home_unread = 0;
                    this.homes['splice'](LIMIT);
                    this['home_id'] = this["hasHome"] ? this.homes[this.homes.length - 1]['id'] : '';
                    this.fetch_comp['home'] = ![];
                    return;
                }
                this.home_unread = this.home_unread - LIMIT;
                if (0 >= this['home_posy']) {
                    this["jumpKatsu"]('home', this.homes[LIMIT + this.home_unread]['id']);
                }
            } else if (this.homes.length - 1 - this.home_unread > LIMIT * 2) {
                this.homes['splice'](this.home_unread + LIMIT * 2);
                this['home_id'] = this["hasHome"] ? this.homes[this.homes.length - 1]['id'] : '';
                this.fetch_comp['home'] = ![];
            }
        }, TIME_SCROLL),
        'handleScrollLocal': _['debounce'](function (_0x750d55) {
            if (!this['result_lock']) {
                this['result_type'] = '';
                this['result_text'] = '';
                this['error_cnt'] = 0;
            }
            this['local_posy'] = parseInt(_0x750d55['target']['scrollTop']);
            this['local_posy_b'] = parseInt(_0x750d55['target']['scrollHeight'] - _0x750d55['target']['clientHeight'] - _0x750d55['target']['scrollTop']);
            if (!this['fetch_lock']['local'] && this['local_posy'] != this['local_posy_b'] && threshold_low >= this['local_posy_b'] && 0 <= this['local_posy_b']) {
                this['fetch_lock']['local'] = !![];
                this['local_unread'] = this['locals'].length - LIMIT;
                this['fetchLocal']();
            } else if (!this['fetch_lock']['local'] && this['local_posy'] != this['local_posy_b'] && threshold_high >= this['local_posy'] && 0 <= this['local_posy']) {
                if (this['local_unread'] - LIMIT < 0) {
                    this['local_unread'] = 0;
                    this['locals']['splice'](LIMIT);
                    this['local_id'] = this['hasLocal'] ? this['locals'][this['locals'].length - 1]['id'] : '';
                    this.fetch_comp['local'] = ![];
                    return;
                }
                this['local_unread'] = this['local_unread'] - LIMIT;
                if (0 >= this['local_posy']) {
                    this["jumpKatsu"]('local', this['locals'][LIMIT + this['local_unread']]['id']);
                }
            } else if (this['locals'].length - 1 - this['local_unread'] > LIMIT * 2) {
                this['locals']['splice'](this['local_unread'] + LIMIT * 2);
                this['local_id'] = this['hasLocal'] ? this['locals'][this['locals'].length - 1]['id'] : '';
                this.fetch_comp['local'] = ![];
            }
        }, TIME_SCROLL),
        'handleScrollMulti': _['debounce'](function (e) {
            if (!this['result_lock']) {
                this['result_type'] = '';
                this['result_text'] = '';
                this['error_cnt'] = 0;
            }
            this['multi_posy'] = parseInt(e['target']['scrollTop']);
            this['multi_posy_b'] = parseInt(e['target']['scrollHeight'] - e['target']['clientHeight'] - e['target']['scrollTop']);
            if (!this['fetch_lock'].multi && this['multi_posy'] != this['multi_posy_b'] && threshold_low >= this['multi_posy_b'] && 0 <= this['multi_posy_b']) {
                this['fetch_lock'].multi = !![];
                this['multi_unread'] = this.multis.length - LIMIT;
                this['fetchMulti']();
            } else if (!this['fetch_lock'].multi && this['multi_posy'] != this['multi_posy_b'] && threshold_high >= this['multi_posy'] && 0 <= this['multi_posy']) {
                if (this['multi_unread'] - LIMIT < 0) {
                    this['multi_unread'] = 0;
                    this.multis['splice'](LIMIT);
                    this.multi_id = this['hasMulti'] ? this.multis[this.multis.length - 1]['id'] : '';
                    this.fetch_comp.multi = ![];
                    return;
                }
                this['multi_unread'] = this['multi_unread'] - LIMIT;
                if (0 >= this['multi_posy']) {
                    this['jumpKatsu']('multi', this.multis[LIMIT + this['multi_unread']]['id']);
                }
            } else if (this.multis.length - 1 - this['multi_unread'] > LIMIT * 2) {
                this.multis['splice'](this['multi_unread'] + LIMIT * 2);
                this.multi_id = this['hasMulti'] ? this.multis[this.multis.length - 1]['id'] : '';
                this.fetch_comp.multi = ![];
            }
        }, TIME_SCROLL),
        'handleScrollNotif': _['debounce'](function (_0x178d0c) {
            if (!this['result_lock']) {
                this['result_type'] = '';
                this['result_text'] = '';
                this['error_cnt'] = 0;
            }
            this["notif_posy"] = parseInt(_0x178d0c['target']['scrollTop']);
            this["notif_posy_b"] = parseInt(_0x178d0c['target']['scrollHeight'] - _0x178d0c['target']['clientHeight'] - _0x178d0c['target']['scrollTop']);
            if (!this['fetch_lock'].notif && this["notif_posy"] != this["notif_posy_b"] && threshold_low >= this["notif_posy_b"]) {
                this['fetch_lock'].notif = !![];
                this["notif_unread"] = this.notifs_filter.length - LIMIT_NOTIF;
                if (this['notif_type'] == '') {
                    this["fetchNotifAll"]();
                } else if (this['notif_type'] == 'mention') {
                    this["fetchNotifMention"]();
                } else if (this['notif_type'] == 'fav') {
                    this["fetchNotifFav"]();
                } else if (this['notif_type'] == 'reblog') {
                    this["fetchNotifReblog"]();
                } else if (this['notif_type'] == 'follow') {
                    this["fetchNotifFollow"]();
                }
            } else if (!this['fetch_lock'].notif && this["notif_posy"] != this["notif_posy_b"] && threshold_high >= this["notif_posy"]) {
                if (this["notif_unread"] - LIMIT_NOTIF < 0) {
                    this["notif_unread"] = 0;
                    if ('mention' == this['notif_type']) {
                        this["notif_unread_filter"]['mention'] = 0;
                    } else if ('fav' == this['notif_type']) {
                        this["notif_unread_filter"]['fav'] = 0;
                    } else if ('reblog' == this['notif_type']) {
                        this["notif_unread_filter"]['reblog'] = 0;
                    } else if ('follow' == this['notif_type']) {
                        this["notif_unread_filter"]['follow'] = 0;
                    } else {
                        this["notif_unread_filter"]["others"] = 0;
                    }
                    return;
                }
                this["notif_unread"] = this["notif_unread"] - LIMIT_NOTIF;
                if (0 >= this["notif_posy"]) {
                    this["jumpKatsu"]('notif', this.notifs_filter[LIMIT_NOTIF + this["notif_unread"]]['id']);
                }
            } else if (this.notifs_filter.length - 1 - this["notif_unread"] > LIMIT_NOTIF * 2) {
                this.notifs_filter['splice'](this["notif_unread"] + LIMIT_NOTIF * 2);
                this['notif_id'] = this["hasnotif"] ? this.notifs_filter[this.notifs_filter.length - 1]['id'] : '';
                this.fetch_comp['notif_filter'] = ![];
            }
            if ((this['ua'] == 'ios' || this['uaop'] == 'macos_safari') && this.notifs_filter.length - 1 - this["notif_unread"] > LIMIT * 2) {
                _0x178d0c['target']['scrollTop'] = _0x178d0c['target']['clientHeight'] + this["notif_posy_b"] / ((this.notifs_filter.length - this["notif_unread"]) / LIMIT - 0x1);
            }
        }, TIME_SCROLL),
        'handleScrollAcct': _['debounce'](function (_0x3b2506) {
            if (!this['result_lock']) {
                this['result_type'] = '';
                this['result_text'] = '';
                this['error_cnt'] = 0;
            }
            var _0x4b3a7e = parseInt(_0x3b2506['target']['scrollTop']);
            var _0x5c913c = parseInt(_0x3b2506['target']['scrollHeight'] - _0x3b2506['target']['clientHeight'] - _0x3b2506['target']['scrollTop']);
            if (!this['fetch_lock']['acct'] && _0x4b3a7e != _0x5c913c && 1 > _0x5c913c) {
                this['fetch_lock']['acct'] = !![];
                if (this['acct_type'] == 'katsu') {
                    this["fetchAcctAll"]();
                } else if (this['acct_type'] == 'media') {
                    this["fetchAcctMedia"]();
                } else if (this['acct_type'] == 'fav') {
                    this["fetchAcctFav"]();
                } else if (this['acct_type'] == 'follow') {
                    this["fetchAcctFollow"]();
                } else if (this['acct_type'] == "follower") {
                    this['fetchAcctFollower']();
                } else if (this['acct_type'] == 'mute') {
                    this["fetchAcctMute"]();
                } else if (this['acct_type'] == 'block') {
                    this["fetchAcctBlock"]();
                } else if (this['acct_type'] == "request") {
                    this["fetchAcctFollowRequest"]();
                }
            }
        }, TIME_SCROLL),
        'handleScrollDiscord': _['debounce'](function (_0x358f78) {
            if (!this['result_lock']) {
                this['result_type'] = '';
                this['result_text'] = '';
                this['error_cnt'] = 0;
            }
            var _0x193bbd = parseInt(_0x358f78['target']['scrollTop']);
            var _0x24bef0 = parseInt(_0x358f78['target']['scrollHeight'] - _0x358f78['target']['clientHeight'] - _0x358f78['target']['scrollTop']);
            if (!this['fetch_lock']["discord"] && _0x193bbd != _0x24bef0 && 1 > _0x24bef0) {
                this['fetch_lock']["discord"] = !![];
                this['fetchDiscord']();
            }
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
        'notifJudge': function (_0x8fccef) {
            return this['notif_type'] == '' || this['notif_type'] == 'mention' && 'mention' == _0x8fccef['type'] || this['notif_type'] == 'fav' && 'favourite' == _0x8fccef['type'] || this['notif_type'] == 'reblog' && 'reblog' == _0x8fccef['type'] || this['notif_type'] == 'follow' && 'follow' == _0x8fccef['type'] ? !![] : ![];
        },
        'countNotifUnread': function () {
            var _0x1a6469 = {
                'mention': 0,
                'fav': 0,
                'reblog': 0,
                'follow': 0,
                'others': 0,
                'complete': !![]
            };
            var _0x56a4ba = 0;
            if ('' == this['notif_id_bookmark']) {
                return;
            }
            for (var [_0x14c493, _0x165500] of this['notifs']["entries"]()) {
                if (_0x165500['id'] <= this['notif_id_bookmark']) {
                    break;
                }
                _0x56a4ba = _0x14c493 + 1;
                if ('mention' == _0x165500['type']) {
                    _0x1a6469['mention'] = _0x1a6469['mention'] + 1;
                } else if ('favourite' == _0x165500['type']) {
                    _0x1a6469['fav'] = _0x1a6469['fav'] + 1;
                } else if ('reblog' == _0x165500['type']) {
                    _0x1a6469['reblog'] = _0x1a6469['reblog'] + 1;
                } else if ('follow' == _0x165500['type']) {
                    _0x1a6469['follow'] = _0x1a6469['follow'] + 1;
                }
                if (_0x56a4ba == this['notifs'].length) {
                    _0x1a6469["complete"] = ![];
                }
            }
            this["notif_unread_filter"] = _0x1a6469;
            return;
        },
        'toggleHomeOption': function () {
            this["showHomeOption"] = !this["showHomeOption"];
        },
        'toggleLocalOption': function () {
            this["showLocalOption"] = !this["showLocalOption"];
        },
        'toggleNotifOption': function () {
            this['showNotifOption'] = !this["showNotifOption"];
        },
        'toggleAcctEdit': function () {
            var _0x5a8e2c;
            if (this['showAcctEdit']) {
                this['profile'] = [];
            } else {
                _0x5a8e2c = this['user']["display_name"]['split'](/[‮‭]/g);
                this["profile"]["name"] = _0x5a8e2c[0];
                this['profile']['name_b'] = _0x5a8e2c[1] != null && _0x5a8e2c[1].length > 0 ? _0x5a8e2c[1] : '';
            }
            this['showAcctEdit'] = !this['showAcctEdit'];
        },
        'toggleAcctOption': function () {
            this['showAcctOption'] = !this['showAcctOption'];
        },
        'toggleSetting': function () {
            if (this['showForm'] || this['showSearch'] || this['showStream'] || this['showLink']) {
                if (this['showForm']) {
                    this['saveKatsu']();
                    this['showForm'] = ![];
                }
                this['showSearch'] = ![];
                this['showStream'] = ![];
                this['showLink'] = ![];
            }
            this['showSetting'] = !this['showSetting'];
        },
        'toggleSearch': function () {
            if (this['showSetting'] || this['showForm'] || this['showStream'] || this['showLink']) {
                this['showSetting'] = ![];
                if (this['showForm']) {
                    this['saveKatsu']();
                    this['showForm'] = ![];
                }
                this['showStream'] = ![];
                this['showLink'] = ![];
            }
            this['showSearch'] = !this['showSearch'];
        },
        'toggleStream': function () {
            if (this["fetch_after"]["lists"]) {
                this['fetchStreamList']();
            }
            if (this['showSetting'] || this['showForm'] || this['showSearch'] || this['showLink']) {
                this['showSetting'] = ![];
                if (this['showForm']) {
                    this["saveKatsu"]();
                    this['showForm'] = ![];
                }
                this['showSearch'] = ![];
                this['showLink'] = ![];
            }
            this['showStream'] = !this['showStream'];
        },
        'toggleStreamEdit': function () {
            this["stream_list_text"] = '';
            this["listprofile"]["name"] = this["hasStreamList"] ? this['stream_list']["title"] : '';
            document.getElementById("list_name")['value'] = this["listprofile"]["name"];
            this['checkStreamListText']();
            this["checkListProfile"]();
            this["showStreamEdit"] = !this['showStreamEdit'];
        },
        'toggleForm': function () {
            if (this['showForm']) {
                this["saveKatsu"]();
            }
            if (this['showSetting'] || this['showSearch'] || this['showStream'] || this['showLink']) {
                this['showSetting'] = ![];
                this['showSearch'] = ![];
                this['showStream'] = ![];
                this['showLink'] = ![];
            }
            this['showForm'] = !this['showForm'];
        },
        'toggleFormSpoiler': function () {
            if (this["showFormSpoiler"]) {
                this["katsu_spoiler_text_bu"] = this['katsu_spoiler_text'];
                this['katsu_spoiler_text'] = '';
            } else {
                this['katsu_spoiler_text'] = this["katsu_spoiler_text_bu"];
            }
            this["showFormSpoiler"] = !this['showFormSpoiler'];
        },
        'toggleFormVote': function () {
            this["showFormVote"] = !this["showFormVote"];
        },
        'toggleFormDraft': function () {
            this["showFormDraft"] = !this["showFormDraft"];
        },
        'toggleFormVisible': function () {
            this["showFormVisible"] = !this["showFormVisible"];
        },
        'toggleSideLink': function () {
            if (this["fetch_after"]["lists"]) {
                this['fetchStreamList']();
            }
            if (this['showForm'] || this['showSearch'] || this['showStream'] || this['showSetting']) {
                this['showSetting'] = ![];
                if (this['showForm']) {
                    this["saveKatsu"]();
                    this['showForm'] = ![];
                }
                this['showSearch'] = ![];
                this['showStream'] = ![];
                return;
            }
            this["showSideLink"] = !this['showSideLink'];
        },
        'toggleLink': function () {
            if (this['fetch_after']["lists"]) {
                this['fetchStreamList']();
            }
            if (this['showSetting'] || this['showForm'] || this['showSearch'] || this['showStream']) {
                this['showSetting'] = ![];
                if (this['showForm']) {
                    this["saveKatsu"]();
                    this['showForm'] = ![];
                }
                this['showSearch'] = ![];
                this['showStream'] = ![];
            }
            this['showLink'] = !this['showLink'];
        },
        'toggleLinkSearch': function () {
            this['showLinkSearch'] = !this["showLinkSearch"];
        },
        'toggleLinkStream': function (_0x49605d) {
            if (this["fetch_after"]['lists']) {
                this['fetchStreamList']();
            }
            this["showLinkStream"] = _0x49605d == this['showLinkStream'] ? '' : _0x49605d;
        },
        'runInit': function () {
            this["showDetail"] = ![];
            this["showAcct"] = ![];
            this['showNotif'] = ![];
            this["showMulti"] = ![];
            if (this['showForm']) {
                this["saveKatsu"]();
                this['showForm'] = ![];
            }
            this['showSearch'] = ![];
            this['showStream'] = ![];
            this['showSetting'] = ![];
            this['showLink'] = ![];
            this["showHome"] = ![];
            this["showLocal"] = ![];
            this["home_type"] = "Home";
            this["local_type"] = "Local";
            this.multi_type = 'Direct';
            this['multi_target'] = '';
            if (1 == this["optColumns"]) {
                this["optMode"] = !![];
                if ('2' == this['optPtl']) {
                    this["showHome"] = !![];
                } else {
                    this["showLocal"] = !![];
                }
                return;
            }
            if (0x2 == this["optColumns"]) {
                this['optMode'] = !![];
                this["showHome"] = !![];
                this["showLocal"] = !![];
                return;
            }
            this["optMode"] = ![];
            this['showHome'] = !![];
            this["showLocal"] = !![];
            this['showNotif'] = !![];
        },
        'runCustom': function () {
            this["showHome"] = !![];
            this["showLocal"] = !![];
            if (1 == this["optColumns"]) {
                this['optMode'] = !![];
                if (!this['showNotif'] && !this["showDetail"] && !this["showAcct"] && !this["showMulti"]) {
                    if ('2' != this["optPtl"]) {
                        this["showHome"] = ![];
                    } else {
                        this["showLocal"] = ![];
                    }
                } else {
                    this["showHome"] = ![];
                    this['showLocal'] = ![];
                }
                return;
            }
            if (0x2 == this['optColumns']) {
                this['optMode'] = !![];
                if (this['showNotif'] || this["showDetail"] || this["showAcct"] || this["showMulti"]) {
                    if ('2' != this["optPtl"]) {
                        this["showHome"] = ![];
                    } else {
                        this["showLocal"] = ![];
                    }
                }
                return;
            }
            this["optMode"] = ![];
            if (!this['showNotif'] && !this['showDetail'] && !this["showAcct"] && !this["showMulti"]) {
                this["runNotif"]('all');
            }
        },
        'runHome': function () {
            if (!this["showHome"]) {
                this['home_posy'] = 0;
            }
            if (!this["showHomeOption"] && this['home_posy'] != 0) {
                setTimeout(function () {
                    app["upHome"]();
                }, 0);
            } else {
                this["showHomeOption"] = this['showHome'] && !this["showHomeOption"] ? !![] : ![];
            }
            if (this["optMode"]) {
                this['showHome'] = !![];
                if (0x2 == this['optColumns']) {
                    this["showLocal"] = !![];
                } else {
                    this["showLocal"] = ![];
                }
                this["showDetail"] = ![];
                this["showAcct"] = ![];
                this['showNotif'] = ![];
                this["showMulti"] = ![];
                if (this['showForm']) {
                    this["saveKatsu"]();
                    this['showForm'] = ![];
                }
                this['showSearch'] = ![];
                this['showStream'] = ![];
                this['showSetting'] = ![];
                this['showLink'] = ![];
            }
        },
        'runLocal': function (_0x266d97) {
            if (!this["showLocal"]) {
                this['local_posy'] = 0;
            }
            if (!this["showLocalOption"] && this['local_posy'] != 0) {
                setTimeout(function () {
                    app["upLocal"]();
                }, 0);
            } else {
                this["showLocalOption"] = this['showLocal'] && !this["showLocalOption"] && this["local_type"] == _0x266d97 ? !![] : ![];
            }
            if (this["optMode"]) {
                this['showLocal'] = !![];
                if (0x2 == this["optColumns"]) {
                    this['showHome'] = !![];
                } else {
                    this['showHome'] = ![];
                }
                this["showDetail"] = ![];
                this["showAcct"] = ![];
                this['showNotif'] = ![];
                this["showMulti"] = ![];
                if (this['showForm']) {
                    this["saveKatsu"]();
                    this['showForm'] = ![];
                }
                this['showSearch'] = ![];
                this['showStream'] = ![];
                this['showSetting'] = ![];
                this['showLink'] = ![];
            }
        },
        'runNotif': function (_0x59ac49) {
            this['notif_type'] = '';
            this["showNotifOption"] = this['showNotif'] && !this["showNotifOption"] ? !![] : ![];
            if ("all" == _0x59ac49) {
                this["notif_unread"] = 0;
                this['notif_unread_filter'] = {
                    'mention': 0,
                    'fav': 0,
                    'reblog': 0,
                    'follow': 0,
                    'others': 0,
                    'complete': !![]
                };
                this['notif_id'] = this['hasNotif'] ? this['notifs'][this['notifs'].length - 1]['id'] : '';
                this['notif_id_bookmark'] = this['hasNotif'] ? this['notifs'][0]['id'] : this['notif_id_bookmark'];
                this['countNotifUnread']();
                this.notifs_filter = this['notifs']['slice']();
                this["upNotif"]();
                this.fetch_comp['notif_filter'] = this.fetch_comp.notif;
                this['fetch_lock'].notif = this['hasNotif'] ? ![] : !![];
            } else if ('mention' == _0x59ac49) {
                this['resetNotifColumn']();
                this["notif_unread_filter"]['mention'] = 0;
                this["fetchNotifMention"]();
            } else if ('fav' == _0x59ac49) {
                this['resetNotifColumn']();
                this["notif_unread_filter"]['fav'] = 0;
                this["fetchNotifFav"]();
            } else if ('reblog' == _0x59ac49) {
                this['resetNotifColumn']();
                this["notif_unread_filter"]['reblog'] = 0;
                this["fetchNotifReblog"]();
            } else if ('follow' == _0x59ac49) {
                this['resetNotifColumn']();
                this["notif_unread_filter"]['follow'] = 0;
                this['fetchNotifFollow']();
            }
            this['showNotif'] = !![];
            if (this['optMode']) {
                if (0x2 == this["optColumns"]) {
                    if (0x2 == this["optPtl"]) {
                        this["showHome"] = !![];
                        this["showLocal"] = ![];
                    } else {
                        this["showLocal"] = !![];
                        this['showHome'] = ![];
                    }
                } else {
                    this["showHome"] = ![];
                    this['showLocal'] = ![];
                }
                if (this['showForm']) {
                    this["saveKatsu"]();
                    this['showForm'] = ![];
                }
                this['showSearch'] = ![];
                this['showStream'] = ![];
                this['showSetting'] = ![];
                this['showLink'] = ![];
            }
            this["showDetail"] = ![];
            this['showAcct'] = ![];
            this["showMulti"] = ![];
        },
        'runUser': function (_0x16acc9) {
            if (0 == this['user'].length) {
                console['log']("undefined my acct");
                return;
            }
            if ('fav' == _0x16acc9 && this['acct_type'] == _0x16acc9 && this["showAcct"]) {
                this['toggleSetting']();
                return;
            }
            this['showAcctOption'] = ![];
            this['acct'] = [];
            this['accts'] = [];
            this["acct_pinned"] = [];
            this['acct_id'] = '';
            this['acct_targetid'] = this['user']['id'];
            this["acct_relation"] = [{
                'locking': ![],
                'domain_blocking': ![],
                'followed_by': ![],
                'following': ![],
                'id': this['user']['id'],
                'muting': ![],
                'muting_notifications': ![],
                'requested': ![],
                'showing_reblogs': ![]
            }];
            this["fetchAcctProfile"]();
            if ('katsu' == _0x16acc9) {
                this['fetchAcctAll']();
            } else if ('media' == _0x16acc9) {
                this['fetchAcctMedia']();
            } else if ('follow' == _0x16acc9) {
                this["fetchAcctFollow"]();
            } else if ("follower" == _0x16acc9) {
                this["fetchAcctFollower"]();
            } else if ('fav' == _0x16acc9 || "fav_force" == _0x16acc9) {
                this['fetchAcctFav']();
            } else if ('mute' == _0x16acc9) {
                this["fetchAcctMute"]();
            } else if ('block' == _0x16acc9) {
                this["fetchAcctBlock"]();
            } else if ('request' == _0x16acc9) {
                this["fetchAcctFollowRequest"]();
            }
            if (this["optMode"]) {
                if (0x2 == this["optColumns"]) {
                    if (0x2 == this["optPtl"]) {
                        this["showHome"] = !![];
                        this["showLocal"] = ![];
                    } else {
                        this["showLocal"] = !![];
                        this['showHome'] = ![];
                    }
                } else {
                    this["showHome"] = ![];
                    this["showLocal"] = ![];
                }
                if (this['showForm']) {
                    this["saveKatsu"]();
                    this['showForm'] = ![];
                }
                this['showSearch'] = ![];
                this['showStream'] = ![];
                this['showSetting'] = ![];
                this['showLink'] = ![];
            }
            this['showNotif'] = ![];
            this["showDetail"] = ![];
            this["showMulti"] = ![];
            this["showAcct"] = !![];
        },
        'runMulti': function (_0x501e02, _0xcd7242) {
            if (this["showMulti"] && _0x501e02 == "top") {
                this["toggleStream"]();
                return;
            }
            if (!this["showMulti"]) {
                this['multi_posy'] = 0;
            }
            if (this['multi_posy'] != 0) {
                setTimeout(function () {
                    app["upMulti"]();
                }, 0);
            }
            this["showMulti"] = !![];
            if (this["optMode"]) {
                if (0x2 == this["optColumns"]) {
                    if (0x2 == this["optPtl"]) {
                        this["showHome"] = !![];
                        this["showLocal"] = ![];
                    } else {
                        this["showLocal"] = !![];
                        this["showHome"] = ![];
                    }
                } else {
                    this['showHome'] = ![];
                    this["showLocal"] = ![];
                }
                if (this['showForm']) {
                    this["saveKatsu"]();
                    this['showForm'] = ![];
                }
                this['showSearch'] = ![];
                this['showStream'] = ![];
                this['showSetting'] = ![];
                this['showLink'] = ![];
            }
            this["showDetail"] = ![];
            this["showAcct"] = ![];
            this['showNotif'] = ![];
        },
        'runDetail': function (_0xe930bb) {
            this['detail'] = [];
            this['detail_fav'] = [];
            this["detail_reblog"] = [];
            this["detail_chain"] = [];
            this["detail_targetid"] = _0xe930bb;
            this["fetchDetail"]();
            this['showDetail'] = !![];
            if (this["optMode"]) {
                if (0x2 == this["optColumns"]) {
                    if (0x2 == this["optPtl"]) {
                        this["showHome"] = !![];
                        this["showLocal"] = ![];
                    } else {
                        this['showLocal'] = !![];
                        this['showHome'] = ![];
                    }
                } else {
                    this["showHome"] = ![];
                    this["showLocal"] = ![];
                }
            }
            this['showNotif'] = ![];
            this["showAcct"] = ![];
            this['showMulti'] = ![];
        },
        'runAcct': function (_0x3b547b) {
            this['showAcctOption'] = ![];
            this['acct'] = [];
            this['accts'] = [];
            this["acct_pinned"] = [];
            this["acct_relation"] = [];
            this['acct_id'] = '';
            this['acct_targetid'] = _0x3b547b;
            this["fetchAcctProfile"]();
            this["fetchAcctAll"]();
            this["showAcct"] = !![];
            if (this['optMode']) {
                if (0x2 == this["optColumns"]) {
                    if (0x2 == this["optPtl"]) {
                        this["showHome"] = !![];
                        this["showLocal"] = ![];
                    } else {
                        this['showLocal'] = !![];
                        this["showHome"] = ![];
                    }
                } else {
                    this["showHome"] = ![];
                    this["showLocal"] = ![];
                }
            }
            this['showNotif'] = ![];
            this["showDetail"] = ![];
            this["showMulti"] = ![];
        },
        'runReply': function (_0x68b1ff) {
            this['showForm'] = !![];
            this['showSearch'] = ![];
            this['showStream'] = ![];
            this['showSetting'] = ![];
            this['showLink'] = ![];
            this['refreshKatsu']();
            var _0x13d3f4 = '';
            var _0x25900a = new Array();
            var thisObj = this;
            if (null != _0x68b1ff && _0x68b1ff["account"]) {
                _0x13d3f4 = '@' + _0x68b1ff["account"]['acct'];
                this['katsu']["in_reply_to_id"] = _0x68b1ff['id'];
                this['katsu']['reply'] = _0x68b1ff;
                this['katsu']["visibility"] = this['katsu']['reply']["visibility"];
            } else {
                _0x13d3f4 = '@' + _0x68b1ff['acct'];
                this["showFormVisible"] = !![];
                this['katsu']["visibility"] = "unlisted";
            }
            if (null != _0x68b1ff["mentions"]) {
                _0x68b1ff["mentions"]["forEach"](function (_0x846e8a, _0x51b06a) {
                    if ('@' + _0x846e8a['acct'] != _0x13d3f4 && thisObj['user']['acct'] != _0x846e8a['acct']) {
                        _0x25900a["unshift"]('@' + _0x846e8a['acct']);
                    }
                });
            }
            this["katsu_content_text"] = _0x13d3f4 + '\x20' + _0x25900a['join']('\x20');
            var _0xcd18d7 = document.getElementById('katsu_spoiler');
            var _0x122dfe = document.getElementById('katsu_content');
            if (_0xcd18d7 != null && _0x122dfe != null) {
                _0xcd18d7['value'] = this['katsu_spoiler_text'];
                _0x122dfe['value'] = this["katsu_content_text"];
            }
        },
        'runToast': function (_0x52e27c) {
            if (!this['result_lock'] && _0x52e27c) {
                if ('notif' == this['result_type']) {
                    this["runNotif"]("all");
                }
            }
            this['result_text'] = '';
            this['error_cnt'] = 0;
            this['result_type'] = '';
            this['result_lock'] = ![];
        },
        'runAuthClient': function () {
            var thisObj = this;
            var _0x159ef3 = [];
            var _0x4cb2fe = {
                'redirect_uris': thisObj['autologin'] ? redirect_url : redirect_sub,
                'client_name': 'kktjs(webapp)_beta',
                'scopes': 'read write follow',
                'website': 'https://aikatsukamen.github.io'
            };
            var request = new XMLHttpRequest();
            request.open('POST', CLIENT.replace('[I]', thisObj.repository), !![]);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) { } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj['popError'](request.responseText, request.status, 'Login');
                }
            }
                ;
            request['send'](encodeHtmlForm(_0x4cb2fe));
        },
        'fetchToken': function () {
            var thisObj = this;
            var _0x1dc48b = [];
            var _0x5cd270 = {
                'grant_type': 'authorization_code',
                'redirect_uri': thisObj['autologin'] ? redirect_url : redirect_sub,
                'client_id': thisObj['autologin'] ? client_id : client_id_sub,
                'client_secret': thisObj['autologin'] ? client_secret : client_secret_sub,
                'code': thisObj['code']
            };
            var request = new XMLHttpRequest();
            request.open('POST', TOKEN.replace('[I]', thisObj.repository), !![]);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    userConf['setItem']('at', JSON.parse(request.responseText)['access_token']);
                    location.href = location.origin + location.pathname;
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj['popError'](request.responseText, request.status, "Token");
                }
            }
                ;
            request['send'](encodeHtmlForm(_0x5cd270));
        },
        'fetchUser': function () {
            var thisObj = this;
            var _0x5c0028 = [];
            var request = new XMLHttpRequest();
            request.open('GET', USER.replace('[I]', thisObj.repository));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + thisObj['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    thisObj['user'] = JSON.parse(request.responseText);
                    thisObj["fetch_after"]['user'] = ![];
                    thisObj['$forceUpdate']();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj['popError'](request.responseText, request.status, "User");
                    thisObj["fetch_after"]['user'] = !![];
                } else if (request.readyState == 0x3 && request.status == 0x1f4) {
                    userConf["removeItem"]('at');
                    userConf['removeItem']('work_user');
                    thisObj['at'] = null;
                    thisObj["fetch_after"]['user'] = ![];
                }
            }
                ;
            request['send']();
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
        'refetchHome': _['debounce'](function () {
            var thisObj = this;
            var _0x174de3 = [];
            var _0x13ba1a = HOME;
            thisObj['fetch_lock']['home'] = !![];
            var _0x39a20e = 'home';
            var request = new XMLHttpRequest();
            request.open('GET', _0x13ba1a.replace('[I]', thisObj.repository).replace('[PID]', '').replace('[LM]', LIMIT));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + thisObj['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x39a20e == 'home' && thisObj['fetch_lock']['home']) {
                        _0x174de3 = JSON.parse(request.responseText);
                        if (null != thisObj.homes && !thisObj['equalArr'](_0x174de3, thisObj.homes)) {
                            thisObj.updateWrapperBM(_0x174de3, 'home');
                            thisObj.updateFilterBM(_0x174de3, 'home');
                            thisObj['updateImgLoading'](_0x174de3);
                            thisObj.homes = _0x174de3;
                            thisObj.home_unread = 0;
                            thisObj['home_id'] = thisObj.homes[thisObj.homes.length - 1] ? thisObj.homes[thisObj.homes.length - 1]['id'] : '0';
                            thisObj['$nextTick'](function () {
                                thisObj["backHome"]();
                                thisObj['openImageAll'](_0x174de3);
                            });
                        }
                        thisObj['fetch_lock']['home'] = ![];
                        thisObj.fetch_comp['home'] = _0x174de3.length < LIMIT;
                        thisObj['$forceUpdate']();
                    }
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj['fetch_lock']['home'] = ![];
                    thisObj['$forceUpdate']();
                }
            }
                ;
            request['send']();
        }, 0x1f4),
        'refetchLocal': _['debounce'](function () {
            var thisObj = this;
            var _0x4c597d = [];
            var _0x1fc859 = thisObj["local_type"] == 'Global' ? GLOBAL : LOCAL;
            thisObj['fetch_lock']['local'] = !![];
            var _0x3cfcd7 = thisObj["local_type"];
            var request = new XMLHttpRequest();
            request.open('GET', _0x1fc859.replace('[I]', thisObj.repository).replace('[PID]', '').replace('[LM]', LIMIT));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer\x20' + thisObj['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x3cfcd7 == thisObj["local_type"] && thisObj['fetch_lock']['local']) {
                        _0x4c597d = JSON.parse(request.responseText);
                        if (null != thisObj['locals'] && !thisObj['equalArr'](_0x4c597d, thisObj['locals'])) {
                            thisObj.updateWrapperBM(_0x4c597d, 'local');
                            thisObj.updateFilterBM(_0x4c597d, 'local');
                            thisObj['updateImgLoading'](_0x4c597d);
                            thisObj['locals'] = _0x4c597d;
                            thisObj['local_unread'] = 0;
                            thisObj['local_id'] = thisObj['locals'][thisObj['locals'].length - 1] ? thisObj['locals'][thisObj['locals'].length - 1]['id'] : '0';
                            thisObj["$nextTick"](function () {
                                thisObj['backLocal']();
                                thisObj['openImageAll'](_0x4c597d);
                            });
                        }
                        thisObj['fetch_lock']['local'] = ![];
                        thisObj.fetch_comp['local'] = _0x4c597d.length < LIMIT;
                        thisObj['$forceUpdate']();
                    }
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj['fetch_lock']['local'] = ![];
                    thisObj['$forceUpdate']();
                }
            }
                ;
            request['send']();
        }, 0x1f4),
        'refetchMulti': _['debounce'](function () {
            var thisObj = this;
            var resList = [];
            let directUrl = DIRECT; // ★
            if (thisObj.multi_type == 'List') {
                directUrl = LIST.replace('[LID]', thisObj['multi_target']);
            } else if (thisObj.multi_type == 'Hashtag') {
                directUrl = HASHTAG.replace('[TAG]', thisObj['multi_target']);
            }
            thisObj['fetch_lock'].multi = !![];
            var _0x9d4feb = thisObj.multi_type;
            const request = new XMLHttpRequest();
            request.open('GET', directUrl.replace('[I]', thisObj.repository).replace('[PID]', '').replace('[LM]', LIMIT));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + thisObj['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x9d4feb == thisObj.multi_type && thisObj['fetch_lock'].multi) {
                        resList = JSON.parse(request.responseText);
                        // Directならcoversationを整形
                        if (multi_type === "Direct") {
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
                        thisObj['fetch_lock'].multi = ![];
                        thisObj.fetch_comp.multi = resList.length < LIMIT;
                        thisObj['$forceUpdate']();
                    }
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj['fetch_lock'].multi = ![];
                    thisObj['$forceUpdate']();
                }
            }
                ;
            request['send']();
        }, 0x1f4),
        'refetchNotifAll': _['debounce'](function () {
            if (this['notif_type'] != '') {
                this['notif_type'] = '';
                this['resetNotifColumn']();
            }
            var thisObj = this;
            var _0x7b4132 = [];
            var _0x55309e = [];
            thisObj['fetch_lock'].notif = !![];
            var request = new XMLHttpRequest();
            request.open('GET', NOTIF.replace('[I]', thisObj.repository).replace('[PID]', '').replace('[LM]', LIMIT_NOTIF));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + thisObj['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (thisObj['notif_type'] == '' && thisObj['fetch_lock'].notif) {
                        _0x7b4132 = JSON.parse(request.responseText);
                        thisObj.updateWrapperBM(_0x7b4132, 'notif');
                        if (null != thisObj['notifs'] && !thisObj['equalArr'](_0x7b4132, thisObj['notifs'])) {
                            thisObj['notifs'] = _0x7b4132['slice']();
                            thisObj.fetch_comp.notif = _0x7b4132.length < LIMIT_NOTIF;
                        }
                        if (null != thisObj.notifs_filter && !thisObj['equalArr'](_0x7b4132, thisObj.notifs_filter)) {
                            thisObj.notifs_filter = _0x7b4132;
                            _0x55309e = null != request['getResponseHeader']('link') ? request['getResponseHeader']('link')['match'](/max_id=(.*?)>/) : null;
                            thisObj['notif_id'] = null != _0x55309e && 0 != _0x55309e[1].length ? _0x55309e[1] : '0';
                            if (thisObj['showNotif']) {
                                thisObj['notif_id_bookmark'] = thisObj['hasNotif'] ? thisObj['notifs'][0]['id'] : thisObj['notif_id_bookmark'];
                                thisObj['countNotifUnread']();
                                thisObj["$nextTick"](function () {
                                    thisObj["upNotif"]();
                                });
                            }
                        }
                        thisObj['fetch_lock'].notif = ![];
                        thisObj.fetch_comp['notif_filter'] = _0x7b4132.length < LIMIT_NOTIF;
                        thisObj['$forceUpdate']();
                    }
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    thisObj['fetch_lock'].notif = ![];
                    thisObj['$forceUpdate']();
                }
            }
                ;
            request['send']();
        }, 0x1f4),
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
        'countFollowRequest': function () {
            var _0x4dc31a = this;
            var _0x4170a3 = [];
            _0x4dc31a["fetch_watch"]["acct_profile_req"] = !![];
            var request = new XMLHttpRequest();
            request.open('GET', FOLLOW_REQUEST.replace('[I]', _0x4dc31a.repository).replace('[LM]', LIMIT_USER));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x4dc31a['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x4dc31a["user_requesting_count"] = JSON.parse(request.responseText).length;
                    _0x4dc31a["fetch_watch"]["acct_profile_req"] = ![];
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x4dc31a["fetch_watch"]["acct_profile_req"] = ![];
                    _0x4dc31a['popError'](request.responseText, request.status, 'Account');
                }
            }
                ;
            request['send']();
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
        'runUserId': function () {
            if (this["search_userid"]['indexOf']('/') != -0x1) {
                this["detail_targetid"] = this["search_userid"]['split']('/')[1];
                this["runDetail"](this['detail_targetid']);
                return;
            }
            this['accts'] = [];
            this['acct_targetid'] = '';
            var _0x37a433 = this;
            var _0x3d8db3 = [];
            var request = new XMLHttpRequest();
            request.open('GET', SEARCH.replace('[I]', _0x37a433.repository).replace("[STR]", _0x37a433['search_userid']));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x37a433['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (JSON.parse(request.responseText)["accounts"].length && _0x37a433['search_userid'] == JSON.parse(request.responseText)["accounts"][0]['acct']) {
                        _0x37a433['acct_targetid'] = JSON.parse(request.responseText)['accounts'][0]['id'];
                    }
                    _0x37a433["runAcct"](_0x37a433['acct_targetid']);
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x37a433['popError'](request.responseText, request.status, 'Search');
                }
            }
                ;
            request['send']();
        },
        'checkStreamHashtag': function () {
            this["stream_hashtag_text"] = '';
            var _0x190cc4 = this;
            var _0x121dfd = [];
            var _0x68ba5e = [];
            _0x190cc4['fetch_lock']["search_hashtag"] = !![];
            _0x190cc4['$forceUpdate']();
            var request = new XMLHttpRequest();
            request.open('GET', SEARCH.replace('[I]', _0x190cc4.repository).replace("[STR]", _0x190cc4["search_text"]));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x190cc4['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x190cc4['fetch_lock']["search_hashtag"]) {
                        _0x68ba5e = JSON.parse(request.responseText);
                        if (null != _0x68ba5e['hashtags'][0] && _0x68ba5e['hashtags'][0]["name"]['toLowerCase']() == _0x190cc4['search_text']['toLowerCase']()) {
                            _0x190cc4["stream_hashtag_text"] = _0x190cc4['search_text'];
                        }
                    }
                    _0x190cc4['fetch_lock']["search_hashtag"] = ![];
                    _0x190cc4['$forceUpdate']();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x190cc4['fetch_lock']["search_hashtag"] = ![];
                    _0x190cc4['popError'](request.responseText, request.status, "Search");
                    _0x190cc4['$forceUpdate']();
                }
            }
                ;
            request['send']();
        },
        'fetchStreamList': function () {
            var _0xff44f6 = this;
            var _0x4c5241 = [];
            _0xff44f6['fetch_lock']["lists"] = !![];
            var request = new XMLHttpRequest();
            request.open('GET', LIST_ALL.replace('[I]', _0xff44f6.repository));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0xff44f6['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0xff44f6['stream_lists'] = JSON.parse(request.responseText);
                    _0xff44f6['fetch_lock']["lists"] = ![];
                    _0xff44f6["fetch_after"]["lists"] = ![];
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0xff44f6['fetch_lock']['lists'] = ![];
                    _0xff44f6['popError'](request.responseText, request.status, 'List');
                    _0xff44f6['fetch_after']["lists"] = !![];
                }
            }
                ;
            request['send']();
        },
        'fetchListListed': function () {
            if (this["stream_list_type"] != "listed") {
                this["stream_list_type"] = "listed";
                this["resetStreamList"]();
            }
            var _0x1679c5 = this;
            var _0x1c562c = [];
            _0x1679c5['fetch_lock']["lists"] = !![];
            var request = new XMLHttpRequest();
            request.open('GET', LIST_ACCT.replace('[I]', _0x1679c5.repository).replace('[LID]', _0x1679c5['stream_list']['id']));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x1679c5['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x1679c5['stream_list_type'] == "listed" && _0x1679c5['fetch_lock']["lists"]) {
                        _0x1c562c = JSON.parse(request.responseText);
                        _0x1679c5['stream_list_users'] = _0x1c562c;
                        _0x1679c5['fetch_lock']["lists"] = ![];
                        _0x1679c5.fetch_comp["lists"] = !![];
                    }
                    _0x1679c5['fetchListAcctRelation']();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x1679c5['fetch_lock']["lists"] = ![];
                    _0x1679c5['popError'](request.responseText, request.status, 'List');
                }
            }
                ;
            request['send']();
        },
        'fetchListListedBackup': function () {
            var _0x21be21 = this;
            var _0x55de28 = [];
            var request = new XMLHttpRequest();
            request.open('GET', LIST_ACCT.replace('[I]', _0x21be21.repository).replace('[LID]', _0x21be21['stream_list']['id']));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x21be21['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x21be21['stream_list_users_bu'] = JSON.parse(request.responseText);
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x21be21['popError'](request.responseText, request.status, 'List');
                }
            }
                ;
            request['send']();
        },
        'runListSearch': function () {
            if (this['stream_list_type'] != "search") {
                this["stream_list_type"] = "search";
                this["stream_list_following"] = ![];
                this["resetStreamList"]();
            }
            this['fetch_lock']['lists'] = ![];
        },
        'fetchListSearch': function () {
            if (this["stream_list_type"] != "search") {
                this["stream_list_type"] = "search";
                this["resetStreamList"]();
            }
            var _0x7a68ef = this;
            var _0x3185d1 = [];
            _0x7a68ef['fetch_lock']["lists"] = !![];
            var request = new XMLHttpRequest();
            request.open('GET', ACCT_SEARCH.replace('[I]', _0x7a68ef.repository).replace("[STR]", _0x7a68ef["search_text"]).replace("[FL]", _0x7a68ef["stream_list_following"]).replace('[LM]', LIMIT_USER));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x7a68ef['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x7a68ef["stream_list_type"] == "search" && _0x7a68ef['fetch_lock']['lists']) {
                        _0x3185d1 = JSON.parse(request.responseText);
                        _0x7a68ef['stream_list_users'] = _0x3185d1;
                        _0x7a68ef['fetch_lock']["lists"] = ![];
                        _0x7a68ef.fetch_comp['lists'] = !![];
                    }
                    _0x7a68ef["fetchListAcctRelation"]();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x7a68ef['fetch_lock']["lists"] = ![];
                    _0x7a68ef['popError'](request.responseText, request.status, 'List');
                }
            }
                ;
            request['send']();
        },
        'fetchListFollow': function () {
            if (this["stream_list_type"] != 'follow') {
                this["stream_list_type"] = 'follow';
                this['resetStreamList']();
            }
            var _0x5033ff = this;
            var _0x422421 = [];
            var _0x2b0767 = [];
            _0x5033ff['fetch_lock']["lists"] = !![];
            var request = new XMLHttpRequest();
            request.open('GET', FOLLOW.replace('[I]', _0x5033ff.repository).replace('[AID]', _0x5033ff['user']['id']).replace('[UID]', _0x5033ff["stream_list_id"]).replace('[LM]', LIMIT_USER));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x5033ff['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x5033ff['stream_list_type'] == 'follow' && _0x5033ff['fetch_lock']["lists"]) {
                        _0x422421 = JSON.parse(request.responseText);
                        if (0 == _0x5033ff['stream_list_users'].length) {
                            _0x5033ff['stream_list_users'] = _0x422421;
                        } else {
                            Array.prototype.push.apply(_0x5033ff['stream_list_users'], _0x422421);
                        }
                        _0x2b0767 = null != request['getResponseHeader']('link') ? request['getResponseHeader']('link')['match'](/max_id=(.*?)>/) : null;
                        _0x5033ff["stream_list_id"] = null != _0x2b0767 && 0 != _0x2b0767[1].length ? _0x2b0767[1] : '0';
                        _0x5033ff['fetch_lock']["lists"] = ![];
                        _0x5033ff.fetch_comp["lists"] = _0x422421.length < LIMIT_USER;
                        _0x5033ff["fetchListAcctRelation"]();
                    }
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x5033ff['fetch_lock']["lists"] = ![];
                    _0x5033ff['popError'](request.responseText, request.status, 'List');
                }
            }
                ;
            request['send']();
        },
        'fetchListFollower': function () {
            if (this["stream_list_type"] != "follower") {
                this["stream_list_type"] = "follower";
                this["resetStreamList"]();
            }
            var _0x5980c3 = this;
            var _0x59993f = [];
            var _0x24f3cc = [];
            _0x5980c3['fetch_lock']["lists"] = !![];
            var request = new XMLHttpRequest();
            request.open('GET', FOLLOWER.replace('[I]', _0x5980c3.repository).replace('[AID]', _0x5980c3['user']['id']).replace("[UID]", _0x5980c3['stream_list_id']).replace('[LM]', LIMIT_USER));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x5980c3['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x5980c3["stream_list_type"] == "follower" && _0x5980c3['fetch_lock']["lists"]) {
                        if (0 == _0x5980c3['stream_list_users'].length) {
                            _0x5980c3['stream_list_users'] = JSON.parse(request.responseText);
                        } else {
                            Array.prototype.push.apply(_0x5980c3['stream_list_users'], JSON.parse(request.responseText));
                        }
                        _0x24f3cc = null != request['getResponseHeader']('link') ? request['getResponseHeader']('link')['match'](/max_id=(.*?)>/) : null;
                        _0x5980c3["stream_list_id"] = null != _0x24f3cc && 0 != _0x24f3cc[1].length ? _0x24f3cc[1] : '0';
                        _0x5980c3['fetch_lock']["lists"] = ![];
                        _0x5980c3['fetchListAcctRelation']();
                    }
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x5980c3['fetch_lock']["lists"] = ![];
                    _0x5980c3['popError'](request.responseText, request.status, 'List');
                }
            }
                ;
            request['send']();
        },
        'fetchListAcctRelation': function () {
            if (0 == this['stream_list_users'].length) {
                return;
            }
            var _0x2299b9 = 0;
            var _0x12ad4f = RELATION.replace('[I]', this.repository);
            while (_0x2299b9 < this['stream_list_users'].length) {
                _0x12ad4f = _0x12ad4f + 'id[]=' + this['stream_list_users'][_0x2299b9]['id'] + '&';
                _0x2299b9 = _0x2299b9 + 1 | 0;
            }
            var _0x1536f4 = this;
            var _0x11393f = [];
            var request = new XMLHttpRequest();
            request.open('GET', _0x12ad4f);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x1536f4['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x1536f4['stream_list_users_relation'] = JSON.parse(request.responseText);
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x1536f4['popError'](request.responseText, request.status, 'List');
                }
            }
                ;
            request['send']();
        },
        'fetchTokenDiscord': function () {
            var _0x12583b = this;
            var _0x2ea3de = [];
            var _0x59dacd = {
                'response_type': 'code',
                'client_id': discord_id,
                'client_secret': discord_secret,
                'grant_type': 'authorization_code',
                'code': _0x12583b['code']
            };
            var request = new XMLHttpRequest();
            request.open('POST', DIS_TOKEN.replace('[I]', DIS_API).replace("[V]", DIS_API_VER), !![]);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader("Content-type", 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    userConf['setItem']('at_discord', request.responseText);
                    location.href = location["origin"] + location["pathname"];
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x12583b['popError'](request.responseText, request.status, 'Login');
                }
            }
                ;
            request.send(encodeHtmlForm(_0x59dacd));
        },
        'refetchTokenDiscord': function () {
            var _0x2cf9e6 = this;
            var _0x34f144 = [];
            var _0x9cff3c = {
                'response_type': 'code',
                'client_id': discord_id,
                'client_secret': discord_secret,
                'grant_type': "refresh_token",
                'refresh_token': _0x2cf9e6["at_discord"]["refresh_token"]
            };
            var request = new XMLHttpRequest();
            request.open('POST', DIS_TOKEN.replace('[I]', DIS_API).replace("[V]", DIS_API_VER), !![]);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader("Content-type", 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    userConf['setItem']('at_discord', request.responseText);
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x2cf9e6['popError'](request.responseText, request.status, 'Login');
                }
            }
                ;
            request['send'](encodeHtmlForm(_0x9cff3c));
        },
        'actKatsuDiscord': function () {
            var _0x254c57 = this;
            var _0x34969e = [];
            var date = new Date();
            var _0x38b86d = {
                'content': ('0' + date["getHours"]())['slice'](-2) + ':' + ('0' + date["getMinutes"]())['slice'](-2),
                'username': _0x254c57["user_discord"]["username"],
                'avatar_url': "https://cdn.discordapp.com/" + "avatars/" + _0x254c57["user_discord"]['id'] + '/' + _0x254c57["user_discord"]['avatar'] + ".png"
            };
            var request = new XMLHttpRequest();
            request.open('POST', DIS_WTH1.replace('[I]', DIS_API).replace("[V]", DIS_API_VER), !![]);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader("Content-type", 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) { } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x254c57['popError'](request.responseText, request.status, 'Login');
                }
            }
                ;
            request['send'](encodeHtmlForm(_0x38b86d));
        },
        'openThisPage': function () {
            window.location.href = location.origin + location.pathname;
        },
        'openAuth': function () {
            window.location.href = this.autologin ? AUTH_URL.replace('[I]', this.repository).replace('[CID]', client_id).replace('[URL]', redirect_url) : AUTH_URL.replace('[I]', this.repository).replace('[CID]', client_id_sub).replace('[URL]', redirect_sub);
        },
        'openProfile': function () {
            window.open(PROFILE_URL.replace('[I]', this.repository), '_blank');
        },
        'openMastodon': function () {
            window.open(MASTODON_URL.replace('[I]', this.repository), '_blank');
        },
        'openAbout': function () {
            window.open(ABOUT_URL.replace('[I]', this.repository), '_blank');
        },
        'openPolicy': function () {
            window.open(POLICY_URL.replace('[I]', this.repository), '_blank');
        },
        'openWiki': function () {
            window.open(WIKI_URL, '_blank');
        },
        'openDirectry': function () {
            window.open(DIRECTRY_URL.replace('[I]', this.repository), '_blank');
        },
        'loadConf': function () {
            /** 
             * 1: スマホ
             * 2: タブレット
             * 3: PC
             */
            let deviceType = 2;
            var _0x16db8f = !![];
            if (window.innerWidth < 0x280) {
                deviceType = 1;
            } else if (window.innerWidth >= 0x3f0) {
                deviceType = 3;
                _0x16db8f = ![];
            }
            this['confs'] = null != userConf['getItem']('conf_std') ? JSON.parse(userConf['getItem']('conf_std')) : {};
            if (null != userConf['getItem']('conf_std')) {
                this["optVer"] = null != this['confs'] && null != this['confs']['ver'] ? this['confs']['ver'] : 0;
                this["optColumns"] = null != this['confs'] && null != this['confs']['columns'] ? this['confs']['columns'] : deviceType;
                this["optMode"] = null != this['confs'] && null != this['confs']["mode"] ? this['confs']["mode"] : _0x16db8f;
                this["optPtl"] = null != this['confs'] && null != this['confs']["ptl"] ? this['confs']["ptl"] : '1';
                this['optSimple'] = null != this['confs'] && null != this['confs']['simple'] ? this['confs']["simple"] : ![];
                this["optAutoPlay"] = null != this['confs'] && null != this['confs']['autoplay'] ? this['confs']["autoplay"] : '1';
                this["optMediaHeight"] = null != this['confs'] && null != this['confs']["mediaheight"] ? this['confs']["mediaheight"] : '';
                this["optMediaFit"] = null != this['confs'] && null != this['confs']["mediafit"] ? this['confs']["mediafit"] : '';
                this['optKatsuTrim'] = null != this['confs'] && null != this['confs']["katsutrim"] ? this['confs']["katsutrim"] : '';
                this["optAllNsfw"] = null != this['confs'] && null != this['confs']['allnsfw'] ? this['confs']['allnsfw'] : ![];
                this["optAllOpen"] = null != this['confs'] && null != this['confs']["allopen"] ? this['confs']["allopen"] : ![];
                this['optKatsuFilter'] = null != this['confs'] && null != this['confs']['filkatsu'] ? this['confs']["filkatsu"] : '';
                this['optKatsuFilterRaw'] = null != this['confs'] && null != this['confs']["filkatsuraw"] ? this['confs']["filkatsuraw"] : '';
                this['optKatsuFilterStr'] = null != this['confs'] && null != this['confs']["filkatsustr"] ? this['confs']["filkatsustr"] : '^s$';
                this["optNotifFilter"] = null != this['confs'] && null != this['confs']["filnotif"] ? this['confs']["filnotif"] : ![];
                this["optConfirm"] = null != this['confs'] && null != this['confs']["confirm"] ? this['confs']["confirm"] : {
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
                this["optColumnWide"] = null != this['confs'] && null != this['confs']["columnwide"] ? this['confs']["columnwide"] : ![];
                this['optAutoLayout'] = null != this['confs'] && null != this['confs']["autolayout"] ? this['confs']["autolayout"] : ![];
                this["optKeepForm"] = null != this['confs'] && null != this['confs']['keepform'] ? this['confs']["keepform"] : !![];
                this['optConvMedia'] = null != this['confs'] && null != this['confs']["convmedia"] ? this['confs']["convmedia"] : '';
                this["optThemeTops"] = null != this['confs'] && null != this['confs']["tops"] ? this['confs']["tops"] : '';
                this["optThemeBottoms"] = null != this['confs'] && null != this['confs']["bottoms"] ? this['confs']["bottoms"] : '';
                this['optThemeSound'] = null != this['confs'] && null != this['confs']["boop"] ? this['confs']["boop"] : '';
                this['optShortNotif'] = null != this['confs'] && null != this['confs']["shortnotif"] ? this['confs']["shortnotif"] : !![];
                this['optPushNotif'] = null != this['confs'] && null != this['confs'].push ? this['confs'].push : !![];
            } else {
                this["optVer"] = 0;
                this["optColumns"] = null != userConf['getItem']('columns') ? userConf['getItem']('columns') : deviceType;
                this["optMode"] = "true" == userConf['getItem']("mode") ? !![] : _0x16db8f;
                this["optPtl"] = null != userConf['getItem']('ptl') ? userConf['getItem']('ptl') : '1';
                this["optSimple"] = null != userConf['getItem']("simple") ? userConf['getItem']("simple") : ![];
                this['optAutoPlay'] = null != userConf['getItem']("autoplay") ? userConf['getItem']("autoplay") : '1';
                this["optMediaHeight"] = '';
                this["optMediaFit"] = '';
                this["optKatsuTrim"] = '';
                this['optAllNsfw'] = 'true' == userConf['getItem']("allnsfw") ? !![] : ![];
                this["optAllOpen"] = ![];
                this['optKatsuFilter'] = '';
                this['optKatsuFilterRaw'] = '';
                this['optKatsuFilterStr'] = '^s$';
                this["optNotifFilter"] = '';
                this["optConfirm"] = {
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
                this["optColumnWide"] = ![];
                this['optAutoLayout'] = ![];
                this['optKeepForm'] = !![];
                this['optConvMedia'] = '';
                this['optThemeTops'] = '';
                this["optThemeBottoms"] = '';
                this['optThemeSound'] = '';
                this["optShortNotif"] = !![];
                this["optPushNotif"] = !![];
            }
            this['confs']['ver'] = this["optVer"];
            this['confs']['columns'] = this["optColumns"];
            this['confs']["mode"] = this["optMode"];
            this['confs']["ptl"] = this["optPtl"];
            this['confs']["simple"] = this["optSimple"];
            this['confs']["autoplay"] = this["optAutoPlay"];
            this['confs']["mediaheight"] = this["optMediaHeight"];
            this['confs']['mediafit'] = this["optMediaFit"];
            this['confs']["katsutrim"] = this["optKatsuTrim"];
            this['confs']["allnsfw"] = this['optAllNsfw'];
            this['confs']["allopen"] = this['optAllOpen'];
            this['confs']["filkatsu"] = this['optKatsuFilter'];
            this['confs']["filkatsuraw"] = this['optKatsuFilterRaw'];
            this['confs']["filkatsustr"] = this['optKatsuFilterStr'];
            this['confs']["filnotif"] = this["optNotifFilter"];
            this['confs']['confirm'] = this["optConfirm"];
            this['confs']["columnwide"] = this["optColumnWide"];
            this['confs']["autolayout"] = this['optAutoLayout'];
            this['confs']["keepform"] = this["optKeepForm"];
            this['confs']["convmedia"] = this['optConvMedia'];
            this['confs']["tops"] = this["optThemeTops"];
            this['confs']['bottoms'] = this["optThemeBottoms"];
            this['confs']["boop"] = this['optThemeSound'];
            this['confs']["shortnotif"] = this["optShortNotif"];
            this['confs'].push = this["optPushNotif"];
        },
        'saveConf': function () {
            userConf["removeItem"]('columns');
            userConf['removeItem']("mode");
            userConf["removeItem"]('ptl');
            userConf["removeItem"]("autoplay");
            userConf["removeItem"]('allnsfw');
            this["updateFilterAll"]();
            this["optVer"] = this["conf_ver"];
            this['confs']['ver'] = this["optVer"];
            this['confs']['columns'] = this["optColumns"];
            this['confs']["mode"] = this["optMode"];
            this['confs']["ptl"] = this["optPtl"];
            this['confs']["simple"] = this["optSimple"];
            this['confs']["autoplay"] = this["optAutoPlay"];
            this['confs']["mediaheight"] = this["optMediaHeight"];
            this['confs']['mediafit'] = this["optMediaFit"];
            this['confs']["katsutrim"] = this['optKatsuTrim'];
            this['confs']["allnsfw"] = this["optAllNsfw"];
            this['confs']["allopen"] = this["optAllOpen"];
            this['confs']["filkatsu"] = this['optKatsuFilter'];
            this['confs']['filkatsustr'] = this['optKatsuFilterStr'];
            this['confs']['filkatsuraw'] = this['optKatsuFilterRaw'];
            this['confs']["filnotif"] = this["optNotifFilter"];
            this['confs']["confirm"] = this["optConfirm"];
            this['confs']["columnwide"] = this["optColumnWide"];
            this['confs']["autolayout"] = this['optAutoLayout'];
            this['confs']["keepform"] = this["optKeepForm"];
            this['confs']["convmedia"] = this['optConvMedia'];
            this['confs']["tops"] = this["optThemeTops"];
            this['confs']["bottoms"] = this['optThemeBottoms'];
            this['confs']["boop"] = this['optThemeSound'];
            this['confs']["shortnotif"] = this['optShortNotif'];
            this['confs'].push = this["optPushNotif"];
            userConf['setItem']('conf_std', JSON['stringify'](this['confs']));
            this['runInit']();
            this['showSetting'] = ![];
        },
        'resetConf': function () {
            var _0x2a2fa8 = 0x2;
            var _0x2125a1 = !![];
            if (window.innerWidth < 0x280) {
                _0x2a2fa8 = 1;
            } else if (window.innerWidth >= 0x3f0) {
                _0x2a2fa8 = 0x3;
                _0x2125a1 = ![];
            }
            this["optVer"] = this["conf_ver"];
            this["optColumns"] = _0x2a2fa8;
            this["optMode"] = _0x2125a1;
            this["optPtl"] = '1';
            this["optSimple"] = ![];
            this["optAutoPlay"] = '1';
            this["optMediaHeight"] = '';
            this['optMediaFit'] = '';
            this['optKatsuTrim'] = '';
            this["optAllNsfw"] = ![];
            this["optAllOpen"] = ![];
            this['optKatsuFilter'] = '';
            this['optKatsuFilterRaw'] = '';
            this['optKatsuFilterStr'] = '^s$';
            this["optNotifFilter"] = '';
            this["optConfirm"] = {
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
            this["optColumnWide"] = ![];
            this['optAutoLayout'] = ![];
            this["optKeepForm"] = !![];
            this['optConvMedia'] = '';
            this['optThemeTops'] = '';
            this["optThemeBottoms"] = '';
            this['optThemeSound'] = '';
            this['optShortNotif'] = !![];
            this["optPushNotif"] = !![];
            this['confs']['ver'] = this["optVer"];
            this['confs']['columns'] = this["optColumns"];
            this['confs']["mode"] = this["optMode"];
            this['confs']["ptl"] = this["optPtl"];
            this['confs']["simple"] = this['optSimple'];
            this['confs']["autoplay"] = this["optAutoPlay"];
            this['confs']['mediaheight'] = this["optMediaHeight"];
            this['confs']["mediafit"] = this["optMediaFit"];
            this['confs']['katsutrim'] = this['optKatsuTrim'];
            this['confs']["allnsfw"] = this['optAllNsfw'];
            this['confs']["allopen"] = this['optAllOpen'];
            this['confs']["filkatsu"] = this['optKatsuFilter'];
            this['confs']['filkatsuraw'] = this['optKatsuFilterRaw'];
            this['confs']["filkatsustr"] = this['optKatsuFilterStr'];
            this['confs']["filnotif"] = this["optNotifFilter"];
            this['confs']["confirm"] = this['optConfirm'];
            this['confs']["columnwide"] = this["optColumnWide"];
            this['confs']["autolayout"] = this['optAutoLayout'];
            this['confs']["keepform"] = this["optKeepForm"];
            this['confs']['convmedia'] = this['optConvMedia'];
            this['confs']["tops"] = this['optThemeTops'];
            this['confs']['bottoms'] = this["optThemeBottoms"];
            this['confs']["boop"] = this['optThemeSound'];
            this['confs']["shortnotif"] = this["optShortNotif"];
            this['confs'].push = this["optPushNotif"];
            userConf['setItem']('conf_std', JSON['stringify'](this['confs']));
            this['runCustom']();
        },
        'deleteConf': function () {
            userConf["removeItem"]('columns');
            userConf['removeItem']("mode");
            userConf["removeItem"]('ptl');
            userConf['removeItem']("autoplay");
            userConf["removeItem"]("allnsfw");
            userConf["removeItem"]('conf_std');
            location["reload"]();
        },
        'deleteToken': function () {
            userConf["removeItem"]('at');
            userConf["removeItem"]('at_discord');
            userConf["removeItem"]('work_user');
            location["reload"]();
        },
        'serviceWorkerUpdateCheck': function () {
            this['fetch_lock']["update"] = !![];
            navigator['serviceWorker']["controller"]["postMessage"]("check");
            setTimeout(function () {
                app['_data']['fetch_lock']["update"] = ![];
            }, REQ_TIMEOUT / 0xa);
        },
        'reloadForce': function () {
            location['reload'](!![]);
        },
        'runSettingUser': function () {
            userConf['setItem']('work_user', JSON['stringify'](this['user']));
        },
        'runSettingDrafts': function () {
            userConf['setItem']('work_drafts', JSON['stringify'](this['content_text_drafts']));
        },
        'runSettingKatsuDrafts': function () {
            userConf['setItem']('work_katsu_drafts', JSON['stringify'](this['katsu_drafts']));
        },
        'runSettingStreamHashtags': function () {
            userConf['setItem']('work_stream_hashtags', JSON['stringify'](this['stream_hashtags']));
        },
        'runSettingBookmark': function () {
            userConf['setItem']('work_bookmark', JSON['stringify'](this['local_id_bookmark']));
        },
        'runSettingBookmarkNotif': function () {
            userConf['setItem']('work_bookmark_notif', JSON['stringify'](this['notif_id_bookmark']));
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
        'openWsHome': function () {
            var thisObj = this;
            var _0x3cfda4 = ST_HOME;
            if (wsHome == null && thisObj['at'] != null) {
                wsHome = new WebSocket(_0x3cfda4.replace('[I]', thisObj.repository).replace('[AT]', thisObj['at']));
                wsHome['onopen'] = onopen;
                wsHome['onclose'] = _['debounce'](_0x3b7770, 200);
                wsHome['onerror'] = onerror;
                wsHome['onmessage'] = onmessage;
                function onopen() {
                    setTimeout(function () {
                        try {
                            thisObj['connHome'] = 'open';
                            thisObj['fetch_lock']['homews'] = ![];
                            wsHome['send']('5j');
                        } catch (_0x1c206b) {
                            onerror();
                        }
                    }, 0x1f4);
                }
                ; function _0x3b7770(e) {
                    thisObj['fetch_lock']['homews'] = !![];
                    thisObj['connHome'] = 'ready';
                    wsHome = null;
                    if (thisObj["app_active"]) {
                        thisObj["refetchHome"]();
                        thisObj['refetchNotifAll']();
                        thisObj['openWsHome']();
                    } else {
                        thisObj["app_network"] = ![];
                    }
                }
                ; function onerror(e) {
                    thisObj['connHome'] = 'lost';
                    if (wsHome != null) {
                        thisObj['fetch_lock']['homews'] = !![];
                        thisObj['connHome'] = 'close';
                        wsHome["close"]();
                    }
                }
                ; function onmessage(e) {
                    var _0x109fd1 = JSON.parse(e['data']);
                    var _0x1c8865 = JSON.parse(_0x109fd1['payload']);
                    if ("update" == _0x109fd1['event']) {
                        if (null == thisObj.homes[0] || null != thisObj.homes[0] && thisObj['home_id'] > KKT1_LASTID && thisObj['home_id'] > _0x1c8865['id']) {
                            return;
                        }
                        if (0 == thisObj['home_posy'] && 0 == thisObj.home_unread) {
                            thisObj.homes['splice'](LIMIT - 0x1);
                            thisObj['home_id'] = thisObj['hasHome'] ? thisObj.homes[thisObj.homes.length - 1]['id'] : '';
                            thisObj.fetch_comp['home'] = ![];
                        } else {
                            thisObj.home_unread = thisObj.home_unread + 1;
                        }
                        _0x1c8865['loading_avatar'] = !![];
                        if (null != _0x1c8865['reblog'] && 0 != _0x1c8865['reblog']['media_attachments'] || 0 != _0x1c8865['media_attachments']) {
                            _0x1c8865['loading_media'] = !![];
                        }
                        thisObj.updateWrapperBM(_0x1c8865, "socket");
                        thisObj.updateFilterBM(_0x1c8865, "socket");
                        thisObj.homes["unshift"](_0x1c8865);
                        thisObj['$forceUpdate']();
                        thisObj["$nextTick"](function () {
                            thisObj["openImage"](_0x1c8865);
                        });
                    } else if ("notification" == _0x109fd1['event']) {
                        if (null == thisObj['notifs'][0] || null != thisObj['notifs'][0] && thisObj['notif_id'] > KKT1_LASTID && thisObj['notif_id'] > _0x1c8865['id']) {
                            return;
                        }
                        if (thisObj['showNotif'] && 0 == thisObj["notif_posy"] && 0 == thisObj["notif_unread"] && thisObj["notifJudge"](_0x1c8865)) {
                            thisObj.notifs_filter['splice'](LIMIT_NOTIF - 0x1);
                            thisObj['notif_id'] = thisObj['hasNotif'] ? thisObj.notifs_filter[thisObj.notifs_filter.length - 1]['id'] : '';
                            thisObj['notif_id_bookmark'] = _0x1c8865['id'];
                            thisObj['countNotifUnread']();
                            thisObj.fetch_comp['notif_filter'] = ![];
                        } else {
                            if ('mention' == _0x1c8865['type']) {
                                thisObj["notif_unread_filter"]['mention'] = thisObj['notif_unread_filter']['mention'] + 1;
                            } else if ('favourite' == _0x1c8865['type']) {
                                thisObj["notif_unread_filter"]['fav'] = thisObj["notif_unread_filter"]['fav'] + 1;
                            } else if ('reblog' == _0x1c8865['type']) {
                                thisObj["notif_unread_filter"]['reblog'] = thisObj['notif_unread_filter']['reblog'] + 1;
                            } else if ('follow' == _0x1c8865['type']) {
                                thisObj["notif_unread_filter"]['follow'] = thisObj["notif_unread_filter"]['follow'] + 1;
                            } else {
                                thisObj['notif_unread_filter']["others"] = thisObj['notif_unread_filter']["others"] + 1;
                            }
                        }
                        if ("poll" == _0x1c8865['type']) {
                            thisObj["updateVote"](_0x1c8865.status['id'], _0x1c8865.status["poll"]);
                        }
                        _0x1c8865['loading_avatar'] = !![];
                        if (null != _0x1c8865.status && (null != _0x1c8865.status['reblog'] && 0 != _0x1c8865.status['reblog']['media_attachments'] || 0 != _0x1c8865.status['media_attachments'])) {
                            _0x1c8865['loading_media'] = !![];
                        }
                        thisObj.notifs_filter["unshift"](_0x1c8865);
                        thisObj['notifs']['unshift'](_0x1c8865);
                        thisObj['$forceUpdate']();
                        thisObj["$nextTick"](function () {
                            thisObj["openImage"](_0x1c8865);
                        });
                        var _0x2ff618 = 0 != _0x1c8865['account']["display_name"].length ? _0x1c8865['account']['display_name'] : _0x1c8865["account"]['acct'];
                        var _0x172d00 = _0x1c8865['type'] == 'follow' ? 'you' : "your katsu";
                        var _0x5551c0 = _0x2ff618 + '‭\x20' + _0x1c8865['type'] + '\x20' + _0x172d00;
                        var _0x3a5570 = {
                            'body': _0x1c8865.status ? _0x1c8865.status['spoiler_text'].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '') + _0x1c8865.status['content'].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '') : '',
                            'icon': _0x1c8865["account"]["avatar_static"]
                        };
                        if ('off' != thisObj['optThemeSound']) {
                            thisObj["playSound"]("sound" + thisObj['optThemeSound']);
                        }
                        if (thisObj["optShortNotif"]) {
                            thisObj['result_type'] = 'notif';
                            thisObj['result_text'] = _0x2ff618 + '‭\x20' + _0x1c8865['type'] + " - " + _0x3a5570['body'];
                        }
                        if (thisObj['optPushNotif']) {
                            popNotif(_0x5551c0, _0x3a5570);
                        }
                    } else if ("delete" == _0x109fd1['event']) {
                        thisObj["updateDelete"](_0x109fd1['payload']);
                    }
                }
                ;
            }
        },
        'reopenWsHome': function (_0x312ae2) {
            if (this['home_type'] == _0x312ae2 || this['fetch_lock']['homews']) {
                return;
            }
            this['fetch_lock']['homews'] = !![];
            this['connHome'] = "close";
            this['home_type'] = "Force" != _0x312ae2 && null != _0x312ae2 ? _0x312ae2 : this['home_type'];
            this['resetHomeColumn']();
            this['fetchHome']();
            this['resetNotifColumn']();
            this['notifs'] = [];
            this.fetch_comp.notif = ![];
            this["fetchNotifAll"]();
            if (wsHome != null) {
                wsHome["close"]();
            }
        },
        'upHome': function () {
            var dom = document.getElementById('home');
            if (null != dom) {
                dom['scrollTop'] = 0;
                this.home_unread = 0;
                this.homes['splice'](LIMIT);
                this['home_id'] = this["hasHome"] ? this.homes[this.homes.length - 1]['id'] : '';
                this.fetch_comp['home'] = ![];
            }
        },
        'backHome': function () {
            var dom = document.getElementById('home');
            if (null != dom) {
                dom['scrollTop'] = 0;
                this['fetch_lock']['home'] = ![];
            }
        },
        'nextHome': function () {
            var dom = document.getElementById('home');
            if (null != dom) {
                dom['scrollTop'] = dom['scrollHeight'];
            }
        },
        'upNotif': function () {
            var dom = document.getElementById('notif');
            if (null != dom) {
                dom['scrollTop'] = 0;
            }
        },
        'openWsLocal': function () {
            var thisObj = this;
            var _0x5e7fea = thisObj["local_type"] == "Global" ? ST_GLOBAL : ST_LOCAL;
            if (wsLocal == null && thisObj['at'] != null) {
                wsLocal = new WebSocket(_0x5e7fea.replace('[I]', thisObj.repository).replace("[AT]", thisObj['at']));
                wsLocal['onopen'] = _0x1d6410;
                wsLocal['onclose'] = _['debounce'](_0x8b86f8, 200);
                wsLocal['onerror'] = _0x1870a7;
                wsLocal['onmessage'] = _0x1719e1;
                function _0x1d6410() {
                    setTimeout(function () {
                        try {
                            thisObj["connLocal"] = 'open';
                            thisObj['fetch_lock']['localws'] = ![];
                            wsLocal['send']('5j');
                        } catch (_0x11044b) {
                            _0x1870a7();
                        }
                    }, 0x1f4);
                }
                ; function _0x8b86f8(_0x4f5811) {
                    thisObj['fetch_lock']['localws'] = !![];
                    thisObj['connLocal'] = 'ready';
                    wsLocal = null;
                    if (thisObj["app_active"]) {
                        thisObj["refetchLocal"]();
                        thisObj['openWsLocal']();
                    } else {
                        thisObj['app_network'] = ![];
                    }
                }
                ; function _0x1870a7(_0x3a6aee) {
                    thisObj["connLocal"] = 'lost';
                    if (wsLocal != null) {
                        thisObj['fetch_lock']['localws'] = !![];
                        thisObj["connLocal"] = "close";
                        wsLocal["close"]();
                    }
                }
                ; function _0x1719e1(_0x3ee549) {
                    var _0x43b0f1 = JSON.parse(_0x3ee549['data']);
                    var _0x4c2dc9 = JSON.parse(_0x43b0f1['payload']);
                    var _0x55d664, _0x49f5cd;
                    if ("update" == _0x43b0f1['event']) {
                        if (null == thisObj['locals'][0] || null != thisObj['locals'][0] && thisObj['local_id'] > KKT1_LASTID && thisObj['local_id'] > _0x4c2dc9['id']) {
                            return;
                        }
                        if (0 == thisObj['local_posy'] && 0 == thisObj['local_unread']) {
                            thisObj['locals']['splice'](LIMIT - 0x1);
                            thisObj["local_id"] = thisObj["hasLocal"] ? thisObj['locals'][thisObj['locals'].length - 1]['id'] : '';
                            thisObj.fetch_comp['local'] = ![];
                        } else {
                            thisObj['local_unread'] = thisObj['local_unread'] + 1;
                        }
                        _0x4c2dc9['loading_avatar'] = !![];
                        if (0 != _0x4c2dc9['media_attachments']) {
                            _0x4c2dc9['loading_media'] = !![];
                        }
                        thisObj.updateWrapperBM(_0x4c2dc9, "socket");
                        thisObj.updateFilterBM(_0x4c2dc9, "socket");
                        thisObj['locals']["unshift"](_0x4c2dc9);
                        thisObj['$forceUpdate']();
                        thisObj["$nextTick"](function () {
                            thisObj["openImage"](_0x4c2dc9);
                        });
                    } else if ('delete' == _0x43b0f1['event']) {
                        thisObj["updateDelete"](_0x43b0f1['payload']);
                    }
                }
                ;
            }
        },
        'reopenWsLocal': function (_0x1a6119) {
            if (this["local_type"] == _0x1a6119 || this['fetch_lock']['localws']) {
                return;
            }
            this['fetch_lock']['localws'] = !![];
            this["connLocal"] = "close";
            this["local_type"] = "Force" != _0x1a6119 && null != _0x1a6119 ? _0x1a6119 : this["local_type"];
            this['resetLocalColumn']();
            this['fetchLocal']();
            if (wsLocal != null) {
                wsLocal["close"]();
            }
        },
        'upLocal': function () {
            var _0x348592 = document.getElementById('local');
            if (null != _0x348592) {
                _0x348592['scrollTop'] = 0;
                this['local_unread'] = 0;
                this['locals']['splice'](LIMIT);
                this["local_id"] = this["hasLocal"] ? this['locals'][this['locals'].length - 1]['id'] : '';
                this.fetch_comp['local'] = ![];
            }
        },
        'backLocal': function () {
            var _0x36cada = document.getElementById('local');
            if (null != _0x36cada) {
                _0x36cada['scrollTop'] = 0;
                this['fetch_lock']['local'] = ![];
            }
        },
        'nextLocal': function () {
            var _0x3b0555 = document.getElementById('local');
            if (null != _0x3b0555) {
                _0x3b0555['scrollTop'] = _0x3b0555['scrollHeight'];
            }
        },
        'openWsMulti': function () {
            var thisObj = this;
            let streamingUrl = ST_DIRECT;
            if (thisObj.multi_type == 'List') {
                streamingUrl = ST_LIST.replace('[LID]', thisObj['multi_target']);
            } else if (thisObj.multi_type == 'Hashtag') {
                streamingUrl = ST_HASHTAG.replace('[TAG]', thisObj['multi_target']);
            }
            if (wsMulti == null && thisObj['at'] != null) {
                wsMulti = new WebSocket(streamingUrl.replace('[I]', thisObj.repository).replace('[AT]', thisObj['at']));
                wsMulti['onopen'] = _0x195c15;
                wsMulti['onclose'] = _['debounce'](_0xb78230, 200);
                wsMulti['onerror'] = _0x5a9cd8;
                wsMulti['onmessage'] = onmessage;
                function _0x195c15() {
                    setTimeout(function () {
                        try {
                            thisObj["connMulti"] = 'open';
                            thisObj['fetch_lock']['multiws'] = ![];
                            wsMulti['send']('5j');
                        } catch (_0x577fd5) {
                            onmessage();
                        }
                    }, 0x1f4);
                }
                ; function _0xb78230(_0x35f22d) {
                    thisObj['fetch_lock']['multiws'] = !![];
                    thisObj["connMulti"] = 'ready';
                    wsMulti = null;
                    if (thisObj["app_active"]) {
                        thisObj["refetchMulti"]();
                        thisObj['openWsMulti']();
                    } else {
                        thisObj["app_network"] = ![];
                    }
                }
                ; function _0x5a9cd8(_0x4b4d5) {
                    thisObj["connMulti"] = 'lost';
                    if (wsMulti != null) {
                        thisObj['fetch_lock']['multiws'] = !![];
                        thisObj['connMulti'] = "close";
                        wsMulti["close"]();
                    }
                }
                ; function onmessage(_0xad3e45) {
                    var _0x2b6070 = JSON.parse(_0xad3e45['data']);
                    var _0x3e1dc6 = JSON.parse(_0x2b6070['payload']);
                    var _0x5798ad, _0xd10c45;
                    if ("update" == _0x2b6070['event']) {
                        if (null == thisObj.multis[0] || null != thisObj.multis[0] && thisObj.multi_id > KKT1_LASTID && thisObj.multi_id > _0x3e1dc6['id']) {
                            return;
                        }
                        if (0 == thisObj['multi_posy'] && 0 == thisObj['multi_unread']) {
                            thisObj.multis['splice'](LIMIT - 0x1);
                            thisObj.multi_id = thisObj['hasMulti'] ? thisObj.multis[thisObj.multis.length - 1]['id'] : '';
                            thisObj.fetch_comp.multi = ![];
                        } else {
                            thisObj['multi_unread'] = thisObj['multi_unread'] + 1;
                        }
                        _0x3e1dc6['loading_avatar'] = !![];
                        if (null != _0x3e1dc6['reblog'] && 0 != _0x3e1dc6['reblog']['media_attachments'] || 0 != _0x3e1dc6['media_attachments']) {
                            _0x3e1dc6['loading_media'] = !![];
                        }
                        thisObj.updateWrapperBM(_0x3e1dc6, "socket");
                        thisObj.updateFilterBM(_0x3e1dc6, "socket");
                        thisObj.multis['unshift'](_0x3e1dc6);
                        thisObj['$forceUpdate']();
                        thisObj["$nextTick"](function () {
                            thisObj["openImage"](_0x3e1dc6);
                        });
                    } else if ("delete" == _0x2b6070['event']) {
                        thisObj["updateDelete"](_0x2b6070['payload']);
                    }
                }
                ;
            }
        },
        'reopenWsMulti': function (_0x2cb3b0, _0x40e5c1) {
            var _0xd643f0 = _0x40e5c1;
            var _0x38d452 = _0x40e5c1;
            if ('List' == _0x2cb3b0) {
                _0xd643f0 = _0x40e5c1['id'];
                _0x38d452 = _0x40e5c1['title'];
            }
            if (this.multi_type == _0x2cb3b0 && this['multi_target']['toLowerCase']() == (_0xd643f0 + '')['toLowerCase']() || this['fetch_lock']['multiws']) {
                return;
            }
            this['fetch_lock']['multiws'] = !![];
            this["connMulti"] = "close";
            if ("Force" != _0x2cb3b0 && null != _0x2cb3b0) {
                this.multi_type = _0x2cb3b0;
                this['multi_target'] = _0xd643f0;
                this["multi_name"] = _0x38d452;
            }
            this['resetMultiColumn']();
            this['fetchMulti']();
            if (wsMulti != null) {
                wsMulti["close"]();
            }
        },
        'upMulti': function () {
            var _0x31ed05 = document.getElementById('multi');
            if (null != _0x31ed05) {
                _0x31ed05['scrollTop'] = 0;
                this['multi_unread'] = 0;
                this.multis['splice'](LIMIT);
                this.multi_id = this['hasMulti'] ? this.multis[this.multis.length - 1]['id'] : '';
                this.fetch_comp.multi = ![];
            }
        },
        'backMulti': function () {
            var _0x23c6cb = document.getElementById('multi');
            if (null != _0x23c6cb) {
                _0x23c6cb['scrollTop'] = 0;
                this['fetch_lock'].multi = ![];
            }
        },
        'nextMulti': function () {
            var _0x511fba = document.getElementById('multi');
            if (null != _0x511fba) {
                _0x511fba['scrollTop'] = _0x511fba['scrollHeight'];
            }
        },
        'reopenForce': function () {
            this["reopenWsHome"]('Force');
            this["reopenWsLocal"]("Force");
            this["reopenWsMulti"]("Force");
            this["showHomeOption"] = ![];
            this["showLocalOption"] = ![];
            if (this["fetch_after"]['user']) {
                this['fetchUser']();
            }
            if (this["fetch_after"]["lists"]) {
                this['fetchStreamList']();
            }
        },
        'fetchUserDiscord': function () {
            var _0x12be43 = this;
            var _0x3f5ec8 = [];
            var request = new XMLHttpRequest();
            request.open('GET', DIS_USER.replace('[I]', DIS_API).replace('[V]', DIS_API_VER));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer\x20' + _0x12be43["at_discord"]['access_token']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x12be43["user_discord"] = JSON.parse(request.responseText);
                    _0x12be43['actKatsuDiscord']();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x12be43['popError'](request.responseText, request.status, 'Discord');
                }
            }
                ;
            request['send']();
        },
        'fetchSocketDiscord': function () {
            var _0x1389c4 = this;
            var _0x421eac = [];
            var request = new XMLHttpRequest();
            request.open('GET', DIS_ST.replace('[I]', DIS_API).replace("[V]", DIS_API_VER));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x1389c4["at_discord"]['access_token']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    ST_DISCORD = JSON.parse(request.responseText)['url'] + "?v=[V]&encoding=json";
                    _0x1389c4["openWsDiscord"]();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x1389c4['popError'](request.responseText, request.status, "Discord");
                }
            }
                ;
            request['send']();
        },
        'fetchDiscord': function () {
            var _0x21069f = this;
            var _0x18a980 = [];
            var _0x30fe10 = DIS_TH;
            var _0x372485 = _0x21069f['discord_type'];
            if ('' != _0x21069f['discord_id']) {
                _0x30fe10 = _0x30fe10 + "&before=" + _0x21069f["discord_id"];
            }
            _0x21069f['fetch_lock']["discord"] = !![];
            var request = new XMLHttpRequest();
            request.open('GET', _0x30fe10.replace('[I]', DIS_API).replace("[V]", DIS_API_VER).replace('[CH]', DIS_CHANNEL[_0x21069f['discord_type']]).replace('[LM]', LIMIT_DIS));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', "MzA1NzE1MTk5MTQ1NTQxNjQy.DUo5Ug.urLP-IQad2lPuRJ2tabPnlUpYyI");
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x372485 == _0x21069f['discord_type'] && _0x21069f['fetch_lock']["discord"]) {
                        if (0 == _0x21069f["discords"].length) {
                            _0x21069f["discords"] = JSON.parse(request.responseText);
                        } else {
                            Array.prototype.push.apply(_0x21069f["discords"], JSON.parse(request.responseText));
                        }
                        _0x21069f["discord_id"] = _0x21069f["discords"][_0x21069f["discords"].length - 1] ? _0x21069f["discords"][_0x21069f["discords"].length - 1]['id'] : '0';
                    }
                    _0x21069f['fetch_lock']['discord'] = ![];
                    _0x21069f['$forceUpdate']();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x21069f['fetch_lock']['discord'] = ![];
                    _0x21069f['popError'](request.responseText, request.status, 'Discord');
                }
            }
                ;
            request['send']();
        },
        'openWsDiscord': function () {
            var _0x5c41f4 = this;
            var _0xa8eda5 = ST_DISCORD;
            var _0x3f6294 = 0;
            if (wsDiscord == null && _0x5c41f4['at'] != null) {
                wsDiscord = new WebSocket(_0xa8eda5.replace("[V]", DIS_API_VER));
                wsDiscord['onopen'] = function () {
                    var _0x3b47e5 = {
                        'op': 0x2,
                        'd': {
                            'compress': ![],
                            'large_threshold': 0x64,
                            'presence': {
                                'status': "online",
                                'since': 0,
                                'afk': ![],
                                'game': 'kktjs'
                            },
                            'afk': ![],
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
                    wsDiscord['send'](JSON['stringify'](_0x3b47e5));
                    _0x5c41f4['connDiscord'] = 'open';
                    _0x5c41f4['fetch_lock']["discordws"] = ![];
                }
                    ;
                wsDiscord['onclose'] = function (_0x5c6e6d) {
                    _0x5c41f4["connDiscord"] = 'ready';
                }
                    ;
                wsDiscord['onerror'] = function (_0x25d69d) {
                    _0x5c41f4["connDiscord"] = "err";
                }
                    ;
                wsDiscord['onmessage'] = function (_0xb14bfe) {
                    var _0x40782d = JSON.parse(_0xb14bfe['data']);
                    if (0xa == _0x40782d['op']) {
                        wsDiscord["onheartbeat"](_0x40782d['d']["heartbeat_interval"]);
                    }
                    if (0 != _0x40782d['op']) {
                        return;
                    }
                    _0x3f6294 = _0x40782d['s'];
                    if ("MESSAGE_CREATE" == _0x40782d['t'] && DIS_CHANNEL[_0x5c41f4['discord_type']] == _0x40782d['d']["channel_id"]) {
                        var _0x3a5011 = _0x40782d['d'];
                        if (null == _0x5c41f4["discords"][0] || null != _0x5c41f4["discords"][0] && _0x5c41f4["discord_id"] > _0x3a5011['id']) {
                            return;
                        }
                        _0x5c41f4["discords"]["unshift"](_0x3a5011);
                    }
                }
                    ;
                wsDiscord["onheartbeat"] = function (_0x5d9051) {
                    setInterval(function () {
                        var _0x34ec8e = {
                            'op': 1,
                            'd': _0x3f6294
                        };
                        wsDiscord['send'](JSON['stringify'](_0x34ec8e));
                    }, _0x5d9051);
                }
                    ;
                wsDiscord["onidentify"] = function () {
                    var _0x734c89 = {
                        'd': "405706906049708032",
                        'op': 0xc
                    };
                    wsDiscord['send'](JSON['stringify'](_0x734c89));
                }
                    ;
            }
        },
        'reopenWsDiscord': function (_0x20b291) {
            if (this['discord_type'] == _0x20b291) {
                return;
            }
            this['fetch_lock']['discordws'] = !![];
            this["connDiscord"] = "close";
            this["discord_type"] = "Force" != _0x20b291 ? _0x20b291 : this["discord_type"];
            this["resetDiscordColumn"]();
            if (wsDiscord != null) {
                wsDiscord['close']();
            }
        },
        'confirm': function (_0x1992cf, _0x4c2da1) {
            this['modal_issue'] = _0x1992cf;
            this["modal_issue"]["confirm"] = '';
            this["modal_issue"]["confirmtype"] = _0x4c2da1;
            this["showConfirm"] = !![];
        },
        'runBookmark': function (_0x4a00c1, _0xa62eaf) {
            if (!![] !== _0xa62eaf) {
                this["confirm"](_0x4a00c1, "bookmark");
                return;
            }
            this['local_id_bookmark'] = _0x4a00c1['id'];
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
        'runAddList': function () {
            if (this['fetch_lock']["lists"]) {
                return;
            }
            var _0x28ffab = this;
            var _0x22da9c = [];
            var _0x31c4c6 = {
                'title': this["stream_list_text"]
            };
            _0x28ffab['fetch_lock']["lists"] = !![];
            _0x28ffab['$forceUpdate']();
            var request = new XMLHttpRequest();
            request.open('POST', LIST_ALL.replace('[I]', _0x28ffab.repository), !![]);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer\x20' + _0x28ffab['at']);
            request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x28ffab['fetchStreamList']();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x28ffab['popError'](request.responseText, request.status, 'List');
                }
                document.getElementById("list_name_new")['value'] = '';
                _0x28ffab['fetch_lock']["lists"] = ![];
                _0x28ffab['$forceUpdate']();
            }
                ;
            request['send'](encodeHtmlForm(_0x31c4c6));
        },
        'runRemoveList': function (_0x2979bd, _0x33558f) {
            if (this['fetch_lock']["lists"]) {
                return;
            }
            var _0x45cd89 = this;
            var _0x51ac2d = [];
            _0x45cd89['fetch_lock']["lists"] = !![];
            _0x45cd89['$forceUpdate']();
            var request = new XMLHttpRequest();
            request.open("DELETE", LIST_OBJ.replace('[I]', _0x45cd89.repository).replace('[LID]', _0x2979bd), !![]);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x45cd89['at']);
            request.setRequestHeader("Content-type", 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x45cd89['fetchStreamList']();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x45cd89['popError'](request.responseText, request.status, 'List');
                }
                _0x45cd89['fetch_lock']["lists"] = ![];
                _0x45cd89['$forceUpdate']();
            }
                ;
            request['send'](encodeHtmlForm());
        },
        'addStreamHashtag': function () {
            if (this['stream_hashtag_text'] != null && this["stream_hashtag_text"] != '' && this['stream_hashtags']['indexOf'](this["stream_hashtag_text"]) == -0x1) {
                this['stream_hashtags'].push(this["stream_hashtag_text"]);
            }
            document.getElementById("hashtag_name_new")['value'] = '';
            this["search_text"] = '';
            this["stream_hashtag_text"] = '';
        },
        'removeStreamHashtag': function (_0x52b0b3) {
            var _0x192949 = this['stream_hashtags']['indexOf'](_0x52b0b3);
            if (_0x192949 != -0x1) {
                this['stream_hashtags']['splice'](_0x192949, 0x1);
            }
        },
        'actVote': function (_0x43463d, _0x531f62) {
            if (!![] !== _0x531f62) {
                this['confirm'](_0x43463d, "vote");
                return;
            }
            if (null == _0x43463d["poll"]['choices']) {
                _0x43463d["poll"]['choices'] = [![], ![], ![], ![]];
            }
            var _0x4d82dd = new Array();
            _0x43463d["poll"]['choices']["forEach"](function (_0x531f62, _0x3534fb) {
                if (_0x531f62) {
                    _0x4d82dd.push(_0x3534fb + '');
                }
            });
            _0x43463d['req_vote'] = !![];
            this['$forceUpdate']();
            var _0xbfd9d2 = this;
            var _0x5c7866 = [];
            var _0xf0ed26 = {
                'choices': _0x4d82dd
            };
            var request = new XMLHttpRequest();
            request.open('POST', VOTE.replace('[I]', _0xbfd9d2.repository).replace("[VID]", _0x43463d["poll"]['id']), !![]);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0xbfd9d2['at']);
            request.setRequestHeader("Content-type", "application/json");
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0xbfd9d2["poll"] = JSON.parse(request.responseText);
                    _0xbfd9d2["updateVote"](_0x43463d['id'], _0xbfd9d2["poll"]);
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0xbfd9d2['popError'](request.responseText, request.status, "Vote");
                }
                _0x43463d["req_vote"] = ![];
                _0xbfd9d2['$forceUpdate']();
            }
                ;
            request['send'](JSON['stringify'](_0xf0ed26));
        },
        'updateVote': function (_0x20fb65, _0x582ab7) {
            var _0x3dec96 = this;
            _0x3dec96.homes.filter(function (_0x37d52f, _0x54458c) {
                if (_0x37d52f['id'] == _0x20fb65) {
                    _0x37d52f["poll"] = _0x582ab7;
                    return !![];
                }
                if (_0x37d52f['reblog'] && _0x37d52f['reblog']['id'] == _0x20fb65) {
                    _0x37d52f['reblog']['poll'] = _0x582ab7;
                    return !![];
                }
            });
            _0x3dec96['locals'].filter(function (_0x258676, _0x3c9a36) {
                if (_0x258676['id'] == _0x20fb65) {
                    _0x258676["poll"] = _0x582ab7;
                    return !![];
                }
            });
            _0x3dec96['notifs'].filter(function (_0x8ad24d, _0x7dfcc8) {
                if (_0x8ad24d.status && _0x8ad24d.status['id'] == _0x20fb65) {
                    _0x8ad24d.status["poll"] = _0x582ab7;
                    return !![];
                }
            });
            _0x3dec96.notifs_filter.filter(function (_0x2e267e, _0x349fd1) {
                if (_0x2e267e.status && _0x2e267e.status['id'] == _0x20fb65) {
                    _0x2e267e.status['poll'] = _0x582ab7;
                    return !![];
                }
            });
            _0x3dec96['accts'].filter(function (_0x44c2ab, _0x42de4c) {
                if (_0x44c2ab['id'] == _0x20fb65) {
                    _0x44c2ab["poll"] = _0x582ab7;
                    return !![];
                }
                if (_0x44c2ab['reblog'] && _0x44c2ab['reblog']['id'] == _0x20fb65) {
                    _0x44c2ab['reblog']['poll'] = _0x582ab7;
                    return !![];
                }
            });
            _0x3dec96["acct_pinned"].filter(function (_0x164d7c, _0x4adb40) {
                if (_0x164d7c['id'] == _0x20fb65) {
                    _0x164d7c["poll"] = _0x582ab7;
                    return !![];
                }
            });
            if (_0x3dec96['detail']['id'] == _0x20fb65) {
                _0x3dec96['detail']["poll"] = _0x582ab7;
            }
            if (0 != _0x3dec96['detail_chain'].length) {
                _0x3dec96["detail_chain"]["ancestors"].filter(function (_0x97a840, _0x251da4) {
                    if (_0x97a840['id'] == _0x20fb65) {
                        _0x97a840["poll"] = _0x582ab7;
                        return !![];
                    }
                });
                _0x3dec96["detail_chain"]["descendants"].filter(function (_0x381811, _0x27fa49) {
                    if (_0x381811['id'] == _0x20fb65) {
                        _0x381811["poll"] = _0x582ab7;
                        return !![];
                    }
                });
            }
            _0x3dec96.multis.filter(function (_0x4418ed, _0x566b9e) {
                if (_0x4418ed['id'] == _0x20fb65) {
                    _0x4418ed['poll'] = _0x582ab7;
                    return !![];
                }
            });
            _0x3dec96['$forceUpdate']();
        },
        'setVote': function (_0x27e3ac, _0x4e84a5) {
            if (null == _0x27e3ac["poll"]['choices'] || !_0x27e3ac["poll"]["multiple"]) {
                _0x27e3ac["poll"]['choices'] = [![], ![], ![], ![]];
            }
            _0x27e3ac["poll"]['choices'][_0x4e84a5] = !_0x27e3ac["poll"]['choices'][_0x4e84a5];
            this['$forceUpdate']();
        },
        'runExtime': function () {
            var _0x49c9f7 = app['_data']['katsu']['poll_work']["extime"][0] * 0x15180 + app['_data']['katsu']['poll_work']["extime"][1] * 0xe10 + app['_data']['katsu']['poll_work']['extime'][2] * 0x3c;
            if (_0x49c9f7 < 0x12c) {
                _0x49c9f7 = 0x12c;
                app['_data']['katsu']['poll_work']['extime'] = [0, 0, 0x5];
            } else if (_0x49c9f7 > LIMIT_POLLEXPIRE) {
                _0x49c9f7 = LIMIT_POLLEXPIRE;
                app['_data']['katsu']['poll_work']["extime"] = [0x1c, 0, 0x0];
            }
            app['_data']['katsu']['poll']["expires_in"] = _0x49c9f7;
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
        'actReport': function (_0x5460c4, _0x3d2fc4) {
            if (!![] !== _0x3d2fc4) {
                this["confirm"](_0x5460c4, "report");
                return;
            }
            _0x5460c4['req_report'] = !![];
            this["showConfirm"] = ![];
            this['$forceUpdate']();
            var _0x27e7e7 = this;
            var _0x518e9f = [];
            var _0x5c7d23 = {
                'account_id': _0x5460c4['account']['id'],
                'status_ids': _0x5460c4['id'],
                'comment': null == document.getElementById("report_text") ? '' : document.getElementById("report_text")['value']
            };
            var request = new XMLHttpRequest();
            request.open('POST', REPORT.replace('[I]', _0x27e7e7.repository).replace("[SID]", _0x5460c4['id']), !![]);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x27e7e7['at']);
            request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) { } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x27e7e7['popError'](request.responseText, request.status, "Report");
                }
                _0x5460c4["req_report"] = ![];
                _0x27e7e7['$forceUpdate']();
            }
                ;
            request['send'](encodeHtmlForm(_0x5c7d23));
        },
        'actProfile': function () {
            var _0x1d79b3 = this['profile']["name"];
            if (this['profile']["name_b"] != null && this["profile"]["name_b"].length > 0) {
                _0x1d79b3 = _0x1d79b3 + '‮' + this['profile']["name_b"] + '‭';
            }
            if (_0x1d79b3.length > LIMIT_ACCTNAME) {
                this['result_text'] = "[Profile] 名前は30文字以内に設定してね。";
                return;
            }
            var _0x5b02aa = this;
            var _0x4b295e = [];
            var _0xc2b230 = {
                'display_name': _0x1d79b3
            };
            _0x5b02aa['acct']["req_profile"] = !![];
            _0x5b02aa['$forceUpdate']();
            var request = new XMLHttpRequest();
            request.open("PATCH", PROFILE.replace('[I]', _0x5b02aa.repository), !![]);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer\x20' + _0x5b02aa['at']);
            request.setRequestHeader("Content-type", 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x5b02aa["runAcct"](_0x5b02aa['user']['id']);
                    _0x5b02aa['fetchUser']();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x5b02aa['popError'](request.responseText, request.status, "Profile");
                }
                _0x5b02aa['acct']["req_profile"] = ![];
                _0x5b02aa['profile'] = [];
                _0x5b02aa['showAcctEdit'] = ![];
                _0x5b02aa['$forceUpdate']();
            }
                ;
            request['send'](encodeHtmlForm(_0xc2b230));
        },
        'actListProfile': function () {
            var _0x482c96 = this["listprofile"]["name"];
            if (_0x482c96.length > LIMIT_LISTNAME) {
                this['result_text'] = "[Profile] リストの名前は300文字以内に設定してね。";
                return;
            }
            var _0x5445e0 = this;
            var _0x293d27 = [];
            var _0x13f7a7 = {
                'title': _0x482c96
            };
            _0x5445e0['stream_list']["req_profile"] = !![];
            _0x5445e0['$forceUpdate']();
            var request = new XMLHttpRequest();
            request.open('PUT', LIST_OBJ.replace('[I]', _0x5445e0.repository).replace('[LID]', _0x5445e0['stream_list']['id']), !![]);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x5445e0['at']);
            request.setRequestHeader("Content-type", 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x5445e0['stream_list'] = JSON.parse(request.responseText);
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x5445e0['popError'](request.responseText, request.status, "Profile");
                }
                _0x5445e0['stream_list']["req_profile"] = ![];
                _0x5445e0['showStreamEdit'] = ![];
                _0x5445e0["listprofile"]["name"] = _0x5445e0['stream_list']["title"];
                _0x5445e0['$forceUpdate']();
            }
                ;
            request['send'](encodeHtmlForm(_0x13f7a7));
        },
        'updateImgLoading': function (_0x1c31e2) {
            var _0x3efaa2 = this;
            _0x1c31e2.filter(function (_0x338855, _0xbd1025) {
                _0x338855['loading_avatar'] = !![];
                if (null != _0x338855['reblog'] && 0 != _0x338855['reblog']['media_attachments'] || 0 != _0x338855['media_attachments']) {
                    _0x338855['loading_media'] = !![];
                }
            });
            _0x3efaa2['$forceUpdate']();
            return;
        },
        'updateMediaWrapper': function (_0x46a934, _0x50244d) {
            _0x46a934['media_opened'] = _0x50244d;
            this['$forceUpdate']();
        },
        'updateContentWrapper': function (_0x349496, _0x2b8e9d) {
            _0x349496["content_opened"] = _0x2b8e9d;
            this['$forceUpdate']();
        },
        'updateWrapperBM': function (_0x3332a9, _0x7e3127) {
            if ('' == this["optAllOpen"]) {
                return;
            }
            var _0x32e81d = this;
            var _0x354845 = "both" == _0x32e81d["optAllOpen"] || 'media' == _0x32e81d['optAllOpen'] ? !![] : void 0;
            var _0x4adbb3 = "both" == _0x32e81d['optAllOpen'] || 'katsu' == _0x32e81d["optAllOpen"] ? !![] : void 0;
            if ("socket" == _0x7e3127) {
                _0x3332a9["media_opened"] = _0x354845;
                _0x3332a9['content_opened'] = _0x4adbb3;
                if (_0x3332a9['reblog']) {
                    _0x3332a9['reblog']["media_opened"] = _0x354845;
                    _0x3332a9['reblog']["content_opened"] = _0x4adbb3;
                }
                if (_0x3332a9.status) {
                    _0x3332a9.status["media_opened"] = _0x354845;
                    _0x3332a9.status["content_opened"] = _0x4adbb3;
                }
                _0x32e81d['$forceUpdate']();
                return;
            }
            if ('detail' == _0x7e3127) {
                _0x3332a9["media_opened"] = _0x354845;
                _0x3332a9["content_opened"] = _0x4adbb3;
                _0x32e81d['$forceUpdate']();
                return;
            }
            if ("detail_chain" == _0x7e3127 && 0 != _0x3332a9.length) {
                _0x3332a9["ancestors"].filter(function (_0x1ca57f, _0x542290) {
                    _0x1ca57f["media_opened"] = _0x354845;
                    _0x1ca57f['content_opened'] = _0x4adbb3;
                });
                _0x3332a9['descendants'].filter(function (_0xcf85aa, _0x448dcc) {
                    _0xcf85aa['media_opened'] = _0x354845;
                    _0xcf85aa["content_opened"] = _0x4adbb3;
                });
                _0x32e81d['$forceUpdate']();
                return;
            }
            _0x3332a9.filter(function (_0x2b1974, _0x4786ca) {
                _0x2b1974["media_opened"] = _0x354845;
                _0x2b1974["content_opened"] = _0x4adbb3;
                if (_0x2b1974['reblog']) {
                    _0x2b1974['reblog']["media_opened"] = _0x354845;
                    _0x2b1974['reblog']["content_opened"] = _0x4adbb3;
                }
                if (_0x2b1974.status) {
                    _0x2b1974.status["media_opened"] = _0x354845;
                    _0x2b1974.status["content_opened"] = _0x4adbb3;
                }
            });
            _0x32e81d['$forceUpdate']();
        },
        'updateWrapperAll': function () {
            var _0x2c3978 = this;
            var _0x5c6aee = 'both' == _0x2c3978["optAllOpen"] || 'media' == _0x2c3978["optAllOpen"] ? !![] : void 0;
            var _0x1d416c = 'both' == _0x2c3978['optAllOpen'] || 'katsu' == _0x2c3978["optAllOpen"] ? !![] : void 0;
            _0x2c3978.homes.filter(function (_0x4c1474, _0x10ff79) {
                _0x4c1474['media_opened'] = _0x5c6aee;
                _0x4c1474["content_opened"] = _0x1d416c;
                if (_0x4c1474['reblog']) {
                    _0x4c1474['reblog']["media_opened"] = _0x5c6aee;
                    _0x4c1474['reblog']["content_opened"] = _0x1d416c;
                }
            });
            _0x2c3978['locals'].filter(function (_0x35644c, _0x5113b4) {
                _0x35644c["media_opened"] = _0x5c6aee;
                _0x35644c["content_opened"] = _0x1d416c;
            });
            _0x2c3978['notifs'].filter(function (_0x240d8b, _0x360895) {
                if (_0x240d8b.status) {
                    _0x240d8b.status['media_opened'] = _0x5c6aee;
                    _0x240d8b.status["content_opened"] = _0x1d416c;
                }
            });
            _0x2c3978.notifs_filter.filter(function (_0x2c2458, _0x2bf44b) {
                if (_0x2c2458.status) {
                    _0x2c2458.status["media_opened"] = _0x5c6aee;
                    _0x2c2458.status["content_opened"] = _0x1d416c;
                }
            });
            _0x2c3978['accts'].filter(function (_0x263ff9, _0x4a630d) {
                _0x263ff9['media_opened'] = _0x5c6aee;
                _0x263ff9["content_opened"] = _0x1d416c;
                if (_0x263ff9['reblog']) {
                    _0x263ff9['reblog']["media_opened"] = _0x5c6aee;
                    _0x263ff9['reblog']["content_opened"] = _0x1d416c;
                }
            });
            _0x2c3978['acct_pinned'].filter(function (_0x3d46e8, _0x228381) {
                _0x3d46e8["media_opened"] = _0x5c6aee;
                _0x3d46e8["content_opened"] = _0x1d416c;
            });
            _0x2c3978['detail']["media_opened"] = _0x5c6aee;
            _0x2c3978['detail']["content_opened"] = _0x1d416c;
            if (0 != _0x2c3978["detail_chain"].length) {
                _0x2c3978["detail_chain"]["ancestors"].filter(function (_0xba81b9, _0x18ab68) {
                    _0xba81b9["media_opened"] = _0x5c6aee;
                    _0xba81b9["content_opened"] = _0x1d416c;
                });
                _0x2c3978['detail_chain']['descendants'].filter(function (_0x2f8102, _0x56d009) {
                    _0x2f8102["media_opened"] = _0x5c6aee;
                    _0x2f8102["content_opened"] = _0x1d416c;
                });
            }
            _0x2c3978.multis.filter(function (_0x42d835, _0x16b29f) {
                _0x42d835["media_opened"] = _0x5c6aee;
                _0x42d835["content_opened"] = _0x1d416c;
            });
            _0x2c3978['$forceUpdate']();
        },
        'updateWrapper': function (_0x44a4cc, _0x401cf8) {
            _0x44a4cc['caught_katsufilter'] = _0x401cf8;
            this['$forceUpdate']();
        },
        'updateFilterBM': function (_0x3e4291, _0x5a3621) {
            if ('' == this['optKatsuFilter']) {
                return;
            }
            var _0x160b73 = this;
            var _0x455ded = new RegExp(this['optKatsuFilterStr']);
            if ("socket" == _0x5a3621) {
                if (_0x3e4291['reblog']) {
                    _0x3e4291['reblog']['caught_katsufilter'] = _0x455ded['test'](_0x3e4291['reblog']['spoiler_text'] + _0x3e4291['reblog']['content'].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, ''));
                } else if (_0x3e4291.status) {
                    _0x3e4291.status['caught_katsufilter'] = _0x455ded['test'](_0x3e4291.status['spoiler_text'] + _0x3e4291.status['content'].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, ''));
                } else {
                    _0x3e4291['caught_katsufilter'] = _0x455ded['test'](_0x3e4291['spoiler_text'] + _0x3e4291['content'].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, ''));
                }
                _0x160b73['$forceUpdate']();
                return;
            }
            _0x3e4291.filter(function (_0x42fcdc, _0x58320c) {
                if (_0x42fcdc['reblog']) {
                    _0x42fcdc['reblog']['caught_katsufilter'] = _0x455ded['test'](_0x42fcdc['reblog']['spoiler_text'] + _0x42fcdc['reblog']['content'].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, ''));
                } else if (_0x42fcdc.status) {
                    _0x42fcdc.status['caught_katsufilter'] = _0x455ded['test'](_0x42fcdc.status['spoiler_text'] + _0x42fcdc.status['content'].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, ''));
                } else {
                    _0x42fcdc['caught_katsufilter'] = _0x455ded['test'](_0x42fcdc['spoiler_text'] + _0x42fcdc['content'].replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, ''));
                }
            });
            _0x160b73['$forceUpdate']();
        },
        'updateFilterAll': function () {
            if ('word' == this['optKatsuFilter']) {
                var _0x4d138f = this['optKatsuFilterRaw'].trim().split(',').filter(function (item, i) {
                    item = item.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
                    return item !== '';
                });
                _0x4d138f['splice'](0xa);
                this['optKatsuFilterRaw'] = _0x4d138f.join(',');
                this['result_text_tmp'] = _0x4d138f.length >= 0xa ? _0x4d138f.length + ' (Max)' : _0x4d138f.length + ' word(s)';
                this['optKatsuFilterStr'] = '(' + _0x4d138f['join']('|') + ')';
            } else if ('regex' == this['optKatsuFilter']) {
                this['result_text_tmp'] = 'ok.';
                this['optKatsuFilterStr'] = this['optKatsuFilterRaw'];
            } else {
                this['result_text_tmp'] = '';
                this['optKatsuFilterStr'] = '^s$';
            }
            var thisObj = this;
            const katsuFileterRegex = new RegExp(this['optKatsuFilterStr']);
            thisObj.homes.filter(function (item, i) {
                if (item.reblog) {
                    item.reblog.caught_katsufilter = katsuFileterRegex.test(item.reblog.spoiler_text + item.reblog.content.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, ''));
                } else {
                    item.caught_katsufilter = katsuFileterRegex.test(item.spoiler_text + item.content.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, ''));
                }
            });
            thisObj.locals.filter(function (item, i) {
                item.caught_katsufilter = katsuFileterRegex.test(item.spoiler_text + item.content.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, ''));
            });
            thisObj.multis.filter(function (item, i) {
                item.caught_katsufilter = katsuFileterRegex.test(item.spoiler_text + item.content.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, ''));
            });
            thisObj['$forceUpdate']();
        },
        'setResizer': function () {
            var _0x22c968 = this;
            window['onresize'] = _['debounce'](function () {
                _0x22c968['resetColumn'](window.innerWidth);
            }, 0x258);
            window.onorientationchange = _['debounce'](function () {
                _0x22c968['resetColumn'](window.innerWidth);
            }, 200);
            this['resetColumn'](window.innerWidth);
        },
        'setHistory': function () {
            var _0x852f2a = this;
            history['pushState']('kktjs', null, location.href);
            window['addEventListener']("popstate", function (_0x229dce) {
                if (_0x852f2a['showEmojiPicker']) {
                    _0x852f2a["showEmojiPicker"] = ![];
                    history['pushState']('kktjs', null, location.href);
                    return;
                }
                if (_0x852f2a['showForm'] || _0x852f2a['showSearch'] || _0x852f2a['showStream'] || _0x852f2a['showSetting'] || _0x852f2a['showLink']) {
                    if (this['showForm']) {
                        _0x852f2a["saveKatsu"]();
                        _0x852f2a['showForm'] = ![];
                    }
                    _0x852f2a['showSearch'] = ![];
                    _0x852f2a['showStream'] = ![];
                    _0x852f2a['showSetting'] = ![];
                    _0x852f2a['showLink'] = ![];
                    history['pushState']('kktjs', null, location.href);
                    return;
                }
                if ('2' == _0x852f2a["optPtl"] && !_0x852f2a["showHome"]) {
                    _0x852f2a["runHome"]();
                    history['pushState']('kktjs', null, location.href);
                    return;
                }
                if ('2' != _0x852f2a["optPtl"] && !_0x852f2a["showLocal"]) {
                    _0x852f2a["runLocal"]();
                    history['pushState']('kktjs', null, location.href);
                    return;
                }
                _0x852f2a['showLink'] = !![];
                history['pushState']('kktjs', null, location.href);
                return;
            });
        },
        'setNotifSound': function (_0x3c71f6, _0x3f103f) {
            if (null == _0x3f103f) {
                return;
            }
            var request = new XMLHttpRequest();
            request["responseType"] = "arraybuffer";
            request.open('GET', _0x3f103f, !![]);
            request.timeout = REQ_TIMEOUT;
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && (request.status == 0 || request.status == 200)) {
                    context["decodeAudioData"](request["response"], function (_0x44907e) {
                        var _0x243bc7 = document.getElementById(_0x3c71f6);
                        _0x243bc7['addEventListener']('click', function () {
                            var _0x1331f6 = context["createBufferSource"]();
                            _0x1331f6["buffer"] = _0x44907e;
                            _0x1331f6["connect"](context["destination"]);
                            _0x1331f6['start'](0);
                        });
                    });
                }
            }
                ;
            request['send']('');
        },
        'resetColumn': function (_0x3282f7) {
            if (this["optColumnWide"]) {
                return;
            }
            if (_0x3282f7 < 0x280) {
                this['optColumns'] = 1;
                this["optMode"] = !![];
            } else if (_0x3282f7 >= 0x3f0) {
                this["optColumns"] = 0x3;
                this["optMode"] = ![];
            } else {
                this["optColumns"] = 0x2;
                this["optMode"] = !![];
            }
            this["runCustom"]();
        },
        'checkActMedia': function (_0x27136a) {
            var _0x1ae4ff = this;
            mediaFile = _0x27136a[0];
            document.getElementById("uploader")['value'] = null;
            if (!/^(image\/(png|jpeg|gif|bmp|webp)|video\/(mp4|webm|quicktime))$/['test'](mediaFile['type'])) {
                _0x1ae4ff['result_text'] = "UnSupport Media (" + mediaFile['type'] + ')';
                return;
            } else if (/^(image\/(png|jpeg))$/['test'](mediaFile['type'])) {
                fileType = 'img';
            } else if (/^(image\/(bmp|webp))$/['test'](mediaFile['type'])) {
                fileType = "img_ex";
            } else if (/^(image\/(gif))$/['test'](mediaFile['type'])) {
                fileType = "gif";
            } else {
                fileType = "mov";
            }
            if (('off' == _0x1ae4ff['optConvMedia'] && fileType != "mov" || fileType == "gif") && mediaFile["size"] > LIMIT_IMGFILE) {
                _0x1ae4ff['result_text'] = "Images must be less than 8 MB";
                return;
            }
            if (fileType == "mov" && mediaFile["size"] > LIMIT_MOVFILE) {
                _0x1ae4ff['result_text'] = "Videos must be less than 40 MB";
                return;
            }
            fileReader["onload"] = function () {
                if (fileType == 'mov' || fileType == 'gif') {
                    _0x1ae4ff['actMedia'](fileReader["result"], mediaFile, ![]);
                } else {
                    imgElement["src"] = fileReader["result"];
                    image['onload'] = function () {
                        if ('hd' == _0x1ae4ff['optConvMedia']) {
                            var _0x34f152 = image['width'] > image['height'] ? image["width"] : image['height'];
                            resizeScale = IMAGE_MAXLEN / _0x34f152 < 1 ? IMAGE_MAXLEN / _0x34f152 : 1;
                        } else if ('off' != _0x1ae4ff['optConvMedia']) {
                            resizeScale = IMAGE_MAXPIXEL / (image["width"] * image['height']) < 1 ? Math["pow"](IMAGE_MAXPIXEL / (image["width"] * image['height']), 1 / 2) : 1;
                        } else {
                            resizeScale = 1;
                        }
                        if (fileType != "img_ex" && ('off' == _0x1ae4ff['optConvMedia'] || resizeScale == 0x1)) {
                            _0x1ae4ff["actMedia"](fileReader["result"], mediaFile, ![]);
                        } else {
                            canvasElement['width'] = image["width"] * resizeScale;
                            canvasElement['height'] = image['height'] * resizeScale;
                            ctx["drawImage"](image, 0, 0, image["width"], image['height'], 0, 0, image['width'] * resizeScale, image['height'] * resizeScale);
                            MediaBinary = canvasElement['toDataURL']('image/jpeg');
                            MediaBlob = base64ToBlob(MediaBinary);
                            _0x1ae4ff["actMedia"](MediaBinary, MediaBlob, !![]);
                        }
                    }
                        ;
                    image["src"] = imgElement["src"];
                }
            }
                ;
            fileReader["readAsDataURL"](mediaFile);
        },
        'actMedia': function (_0x4b79b6, _0x1a700a, _0x27c093) {
            if ('' != this['action_lock']) {
                return ![];
            }
            this['action_lock'] = 'media';
            this['katsu']['media_previews'].push({
                'url': _0x4b79b6,
                'preview_url': IMG_DUMMY,
                'type': _0x1a700a['type']['slice'](0, 0x5),
                'converted': _0x27c093
            });
            var _0x38d96c = this;
            var _0x521de8;
            var _0x773119 = new FormData();
            _0x773119["append"]("file", _0x1a700a);
            var request = new XMLHttpRequest();
            request.open('POST', KATSU_MEDIA.replace('[I]', _0x38d96c.repository), !![]);
            request.timeout = REQ_TIMEOUT * 0xf0;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x38d96c['at']);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x38d96c['katsu']['media_attachments'].push(JSON.parse(request.responseText));
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x38d96c['katsu']['media_previews']["pop"]();
                    _0x38d96c['popError'](request.responseText, request.status, "Media");
                }
                _0x38d96c['action_lock'] = '';
                _0x38d96c["media_uploaded"] = '0';
            }
                ;
            request['send'](_0x773119);
        },
        'removeMedia': function (_0x5f4a2a) {
            if (null == this['katsu']['media_attachments'][_0x5f4a2a]) {
                return;
            }
            this['katsu']['media_previews']['splice'](_0x5f4a2a, 0x1);
            this['katsu']['media_attachments']['splice'](_0x5f4a2a, 0x1);
        },
        'saveKatsu': function () {
            if (!this["optKeepForm"]) {
                this['refreshKatsu']();
                return;
            }
            var _0x29a3b7 = document.getElementById('katsu_spoiler');
            var _0xdc7dac = document.getElementById('katsu_content');
            if (null == _0x29a3b7 || null == _0xdc7dac) {
                return ![];
            }
            this['katsu_spoiler_text'] = _0x29a3b7['value'];
            this["katsu_content_text"] = _0xdc7dac['value'];
        },
        'actKatsuShortCut': function () {
            if ((event["ctrlKey"] && !event["metaKey"] || !event["ctrlKey"] && event["metaKey"]) && event["keyCode"] == 0xd) {
                this['actKatsu'](this['katsu']);
            }
        },
        'actKatsu': function (_0x2ca602, _0x969d50) {
            var _0x91807d = document.getElementById('katsu_spoiler');
            var _0x510760 = document.getElementById('katsu_content');
            this['katsu_spoiler_text'] = _0x91807d['value'];
            this["katsu_content_text"] = _0x510760['value'];
            if (!this["checkKatsu"]()) {
                return;
            }
            this['katsu']["poll"]["options"] = this['katsu']['poll_work']['texts'].filter(function (_0x40ecd1, _0x41a6b6, _0x24e249) {
                return _0x40ecd1.length > 0 && _0x40ecd1.replace(/^[\s|　]+|[\s|　]+$/g, '').length > 0 && _0x24e249['indexOf'](_0x40ecd1) === _0x41a6b6;
            });
            for (var _0x9ba4dc of this['katsu']['poll']['options']) {
                if (_0x9ba4dc.length > LIMIT_POLLOPTION) {
                    this['result_text'] = "[Poll] アンケートの答えは25文字以内に設定してね。";
                    return;
                }
            }
            ; if (this["showFormVote"] && 1 == this['katsu']["poll"]['options'].length) {
                this['result_text'] = "[Poll] アンケートには2つ以上の答えを用意してね。";
                return;
            }
            this['action_lock'] = 'katsu';
            var _0x1e214f = new Array();
            this['katsu']['media_attachments']["forEach"](function (_0x4621ae, _0x54f06e) {
                if (_0x54f06e >= 0x4) {
                    return;
                }
                _0x1e214f.push(_0x4621ae['id']);
            });
            this['katsu']["media_ids"] = _0x1e214f;
            this['katsu']['spoiler_text'] = this['katsu_spoiler_text'];
            this['katsu'].status = this["katsu_content_text"];
            this['katsu'].status = this['katsu'].status.replace(/^#/g, '\x20#');
            this['katsu']['content'] = this["katsu_content_text"];
            if (this["showFormVote"] && 0 != this['katsu']["poll"]['options'].length) {
                this["katsu_poll"] = this['katsu']['poll'];
                this['katsu']["poll"]['choices'] = [![], ![], ![], ![]];
                this['katsu']['poll_work']["expires_at"] = this['formatDateVote'](this['katsu']["poll"]['expires_in']);
            } else {
                this["katsu_poll"] = null;
            }
            if (0 == this['katsu']["media_ids"].length) {
                this['katsu']["nsfw"] = ![];
            }
            this['katsu']["sensitive"] = this['katsu']["nsfw"] || 0 < this['katsu_spoiler_text'].length ? !![] : ![];
            if (1 == this['optConfirm']['katsu'] && !![] !== _0x969d50) {
                this["confirm"](_0x2ca602, 'katsu');
                this['action_lock'] = '';
                return;
            }
            _0x2ca602['req_katsu'] = !![];
            this['$forceUpdate']();
            var _0x5e35cf = this;
            var _0x284c21 = [];
            var _0x33bd48 = {
                'status': this['katsu'].status,
                'in_reply_to_id': this['katsu']['in_reply_to_id'],
                'media_ids': this['katsu']["media_ids"],
                'sensitive': this['katsu']["sensitive"],
                'spoiler_text': this['katsu_spoiler_text'],
                'poll': this["katsu_poll"],
                'visibility': this['katsu']['visibility']
            };
            var request = new XMLHttpRequest();
            request.open('POST', KATSU.replace('[I]', _0x5e35cf.repository), !![]);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer\x20' + _0x5e35cf['at']);
            request.setRequestHeader("Content-type", 'application/json');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x5e35cf['refreshKatsu']();
                    if (_0x5e35cf['showForm']) {
                        _0x5e35cf["saveKatsu"]();
                        _0x5e35cf['showForm'] = ![];
                    }
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x5e35cf['popError'](request.responseText, request.status, 'Katsu');
                    _0x5e35cf['action_lock'] = '';
                }
                _0x2ca602["req_katsu"] = ![];
                _0x5e35cf['$forceUpdate']();
            }
                ;
            request['send'](JSON['stringify'](_0x33bd48));
        },
        'refreshKatsu': function (_0x3fff1a, _0x15b187) {
            var _0x3fff1a = document.getElementById('katsu_spoiler');
            var _0x15b187 = document.getElementById('katsu_content');
            this['katsu'] = {
                'status': '',
                'in_reply_to_id': null,
                'reply': [],
                'media_ids': [],
                'sensitive': ![],
                'nsfw': ![],
                'spoiler_text': '',
                'visibility': '',
                'content': '',
                'media_attachments': [],
                'media_previews': [],
                'poll': {
                    'options': [],
                    'multiple': ![],
                    'expires_in': 0x15180
                },
                'poll_work': {
                    'texts': [],
                    'expires_at': '',
                    'extime': [1, 0, 0x0]
                },
                'emojis': []
            },
                this['katsu_spoiler_text'] = '';
            this["katsu_spoiler_text_bu"] = '';
            this["katsu_content_text"] = '';
            this["katsu_poll"] = null;
            this['katsu']["visibility"] = this['user']["locked"] ? "private" : "public";
            if (null != _0x3fff1a && null != _0x15b187) {
                _0x3fff1a['value'] = this['katsu_spoiler_text'];
                _0x15b187['value'] = this["katsu_content_text"];
            }
            this["showFormSpoiler"] = ![];
            this["showFormVote"] = ![];
            this["showFormDraft"] = this["content_text_drafts"].length > 0 ? !![] : ![];
            this["showFormVisible"] = this['katsu']["visibility"] != 'public' ? !![] : ![];
            this['action_lock'] = '';
        },
        'spoilerLength': function () {
            return window.__kktjsMethods['spoilerLength'](this);
        },
        'contentLength': function () {
            return window.__kktjsMethods['contentLength'](this);
        },
        'refreshCount': _['debounce'](function () {
            app['$forceUpdate']();
        }, TIME_REFRESH),
        'addSpoiler': function (_0x1e58d2) {
            var _0x4b6644 = document.getElementById('katsu_spoiler');
            var _0x342c76 = _0x4b6644['value']["substr"](0, _0x4b6644["selectionStart"]);
            var _0x5d8af7 = _0x4b6644['value']["substr"](_0x4b6644["selectionStart"], _0x4b6644['value'].length);
            this['katsu_spoiler_text'] = _0x342c76 + _0x1e58d2 + _0x5d8af7;
            _0x4b6644['value'] = this['katsu_spoiler_text'];
        },
        'restoreSpoiler': function () {
            var _0x35276a = document.getElementById('katsu_spoiler');
            this['katsu_spoiler_text'] = this["katsu_spoiler_text_bu"];
            _0x35276a['value'] = this['katsu_spoiler_text'];
        },
        'disableSpoiler': function () {
            var _0x26a7c0 = document.getElementById('katsu_spoiler');
            this["katsu_spoiler_text_bu"] = _0x26a7c0['value'];
            this['katsu_spoiler_text'] = '';
            _0x26a7c0['value'] = '';
        },
        'addContent': function (_0x51d0d4) {
            var _0x4d3706 = document.getElementById('katsu_content');
            var _0x42f402 = _0x4d3706['value']["substr"](0, _0x4d3706["selectionStart"]);
            var _0xbcc4d3 = _0x4d3706['value']['substr'](_0x4d3706["selectionStart"], _0x4d3706['value'].length);
            this["katsu_content_text"] = _0x42f402 + _0x51d0d4 + _0xbcc4d3;
            _0x4d3706['value'] = this["katsu_content_text"];
        },
        'contentExchange': function () {
            var _0x2fdc93 = document.getElementById('katsu_spoiler');
            var _0x3966c2 = document.getElementById('katsu_content');
            this["katsu_spoiler_text_bu"] = _0x2fdc93['value'];
            this['katsu_spoiler_text'] = _0x3966c2['value'];
            this["katsu_content_text"] = this["katsu_spoiler_text_bu"];
            _0x2fdc93['value'] = this['katsu_spoiler_text'];
            _0x3966c2['value'] = this["katsu_content_text"];
        },
        'contentToDraft': function () {
            var _0x1491ec = document.getElementById('katsu_content');
            this['content_text_drafts']["unshift"](_0x1491ec['value']);
            this["katsu_content_text"] = '';
            _0x1491ec['value'] = this['katsu_content_text'];
        },
        'draftToContent': function (_0x41b094, _0x778fd2) {
            var _0x3eae02 = document.getElementById('katsu_content');
            if (_0x778fd2) {
                this['katsu_content_text'] = this['content_text_drafts'][_0x41b094];
                _0x3eae02['value'] = this["katsu_content_text"];
                this["content_text_drafts"]['splice'](_0x41b094, 0x1);
                return;
            }
            var _0x255a2b = _0x3eae02['value']['substr'](0, _0x3eae02["selectionStart"]);
            var _0x15e2d6 = _0x3eae02['value']['substr'](_0x3eae02['selectionStart'], _0x3eae02['value'].length);
            this["katsu_content_text"] = _0x255a2b + this["content_text_drafts"][_0x41b094] + _0x15e2d6;
            _0x3eae02['value'] = this['katsu_content_text'];
            this['refreshCount']();
        },
        'katsuToDraft': function () {
            if (!this["checkKatsu"]()) {
                return;
            }
            var _0x37bee6 = document.getElementById('katsu_spoiler');
            var _0x62d4ab = document.getElementById('katsu_content');
            this['katsu_spoiler_text'] = null != _0x37bee6 ? _0x37bee6['value'] : this['katsu_spoiler_text'];
            this["katsu_content_text"] = null != _0x62d4ab ? _0x62d4ab['value'] : this["katsu_content_text"];
            this['katsu']['spoiler_text'] = this['katsu_spoiler_text'];
            this['katsu'].status = this["katsu_content_text"];
            if (!this['showFormVote']) {
                this['katsu']["poll"] = {
                    'options': [],
                    'multiple': ![],
                    'expires_in': 0x15180
                };
                this['katsu']['poll_work'] = {
                    'texts': [],
                    'expires_at': '',
                    'extime': [1, 0, 0x0]
                };
            }
            this['katsu_drafts']["unshift"](this['katsu']);
            var _0x3d5ee8 = document.getElementById("vote_title_0");
            var _0x5be2c5 = document.getElementById("vote_title_1");
            var _0x4a6db7 = document.getElementById("vote_title_2");
            var _0x13fa5b = document.getElementById("vote_title_3");
            if (null != _0x3d5ee8) {
                _0x3d5ee8['value'] = '';
            }
            if (null != _0x5be2c5) {
                _0x5be2c5['value'] = '';
            }
            if (null != _0x4a6db7) {
                _0x4a6db7['value'] = '';
            }
            if (null != _0x13fa5b) {
                _0x13fa5b['value'] = '';
            }
            this['refreshKatsu']();
        },
        'draftToKatsu': function (_0x1960a2, _0xe130dc) {
            var _0x51c6b1 = document.getElementById('katsu_spoiler');
            var _0x59649d = document.getElementById('katsu_content');
            this['katsu'] = this['katsu_drafts'][_0x1960a2];
            if (_0xe130dc) {
                this['katsu_drafts']['splice'](_0x1960a2, 0x1);
            }
            this['katsu_spoiler_text'] = this['katsu']['spoiler_text'];
            this["katsu_content_text"] = this['katsu'].status;
            _0x51c6b1['value'] = this['katsu_spoiler_text'];
            _0x59649d['value'] = this["katsu_content_text"];
            this["showFormSpoiler"] = this['katsu_spoiler_text'].length > 0 ? !![] : ![];
            this['showFormVote'] = this['katsu']['poll_work']['texts'].length > 0 ? !![] : ![];
            this["showFormVisible"] = this['katsu']["visibility"] != "public" ? !![] : ![];
            var _0x1574a5 = document.getElementById("vote_title_0");
            var _0x267354 = document.getElementById('vote_title_1');
            var _0x3b2dc1 = document.getElementById("vote_title_2");
            var _0x3b2757 = document.getElementById('vote_title_3');
            if (null != _0x1574a5) {
                _0x1574a5['value'] = null != this['katsu']['poll_work']['texts'][0] ? this['katsu']['poll_work']['texts'][0] : '';
            }
            if (null != _0x267354) {
                _0x267354['value'] = null != this['katsu']['poll_work']['texts'][1] ? this['katsu']['poll_work']['texts'][1] : '';
            }
            if (null != _0x3b2dc1) {
                _0x3b2dc1['value'] = null != this['katsu']['poll_work']['texts'][2] ? this['katsu']['poll_work']['texts'][2] : '';
            }
            if (null != _0x3b2757) {
                _0x3b2757['value'] = null != this['katsu']['poll_work']['texts'][3] ? this['katsu']['poll_work']['texts'][3] : '';
            }
            this['refreshCount']();
        },
        'checkKatsu': function () {
            if ('' != this['action_lock']) {
                return ![];
            }
            var spoilerDom = document.getElementById('katsu_spoiler');
            var contentDom = document.getElementById('katsu_content');
            if (null == spoilerDom || null == contentDom) {
                return ![];
            }
            this['katsu_spoiler_text'] = spoilerDom.value;
            this['katsu_content_text'] = contentDom.value;
            if (0 != this['katsu']['media_previews'].length && this['katsu']['media_previews'].length != this['katsu']['media_attachments'].length) {
                return ![];
            }
            if ((0 == contentDom['value']['trim']().length || 0 == this["contentLength"]()) && 0 == this['katsu']['media_previews'].length) {
                return ![];
            }
            if (0x1f4 < spoilerDom['value'].length + this["contentLength"]()) {
                return ![];
            }
            return !![];
        },
        'openEmoji': function () {
            var _0x9b1cce = document.getElementById('katsu_content');
            this['katsu_content_text'] = _0x9b1cce['value'];
            var _0x4e4149 = document.getElementById('katsu');
            _0x4e4149['value'] = this['katsu_content_text'];
        },
        'closeEmoji': function () {
            var _0x315fec = document.getElementById('katsu_content');
            var _0x448ff3 = document.getElementById('katsu');
            this["katsu_content_text"] = emojione["shortnameToUnicode"](_0x448ff3['value']);
            _0x315fec['value'] = this["katsu_content_text"];
        },
        'popError': function (a, b, c) {
            return window.__kktjsMethods['popError'](this, a, b, c);
        },
        'jumpKatsu': function (_0x244166, _0x410568) {
            var _0x5e219a = document.getElementById(_0x244166 + '' + _0x410568);
            if (_0x5e219a != null && (_0x244166 == 'home' && this['showHome'] || _0x244166 == 'local' && this["showLocal"] || _0x244166 == 'notif' && this['showNotif'] || _0x244166 == 'multi' && this['showMulti'])) {
                var _0x610350 = document.getElementById(_0x244166);
                setTimeout(function () {
                    _0x610350['scrollTop'] = _0x610350['scrollTop'] + _0x5e219a['getBoundingClientRect']()["top"] + window['pageYOffset'] - 0x58;
                }, 0);
            }
        }
    }
});
function changeAppActive(_0xa29241) {
    if (_0xa29241 && !app['_data']['app_network']) {
        app["refetchHome"]();
        app['refetchNotifAll']();
        app["openWsHome"]();
        app["refetchLocal"]();
        app['openWsLocal']();
        app["refetchMulti"]();
        app["openWsMulti"]();
        app['_data']["app_network"] = !![];
    }
    if (this['ua'] != 'pc') {
        app['_data']["app_active"] = _0xa29241;
    }
}
function importdragenter(_0x4f918b) {
    _0x4f918b["preventDefault"]();
    if (app['_data']['at'] == null) {
        return;
    }
    if (!app['_data']['showForm']) {
        app['toggleForm']();
    }
    app['_data']["showFileImporter"] = !![];
}
function importdragover(_0x3861b3) {
    _0x3861b3["preventDefault"]();
}
function importdrop(_0x31edc2) {
    _0x31edc2["preventDefault"]();
    if (app['_data']['at'] == null) {
        return;
    }
    app['_data']["showFileImporter"] = ![];
    if (0x4 <= app['_data']['katsu']['media_previews'].length || app['_data']['katsu']['media_previews'].length != app['_data']['katsu']['media_attachments'].length) {
        return;
    }
    if (0 != _0x31edc2["dataTransfer"]["files"].length && app['_data']["showFormVote"]) {
        app['_data']['result_text'] = "[Media] アンケートには画像を付けられないよ。";
        return;
    }
    app["checkActMedia"](_0x31edc2["dataTransfer"]["files"]);
}
function importpaste(_0xb7cd91) {
    if (app['_data']['at'] == null) {
        return;
    }
    if (!_0xb7cd91["clipboardData"]["files"].length) {
        return;
    }
    if (!app['_data']['showForm']) {
        app['toggleForm']();
    }
    if (0x4 <= app['_data']['katsu']['media_previews'].length || app['_data']['katsu']['media_previews'].length != app['_data']['katsu']['media_attachments'].length) {
        return;
    }
    if (0 != _0xb7cd91["clipboardData"]["files"].length && app['_data']['showFormVote']) {
        app['_data']['result_text'] = '[Media]\x20アンケートには画像を付けられないよ。';
        return;
    }
    app["checkActMedia"](_0xb7cd91["clipboardData"]["files"]);
}
function importclick(_0xd2d1ca) {
    if (app['_data']['at'] == null) {
        return;
    }
    if (!_0xd2d1ca.length) {
        return;
    }
    if (0x4 <= app['_data']['katsu']['media_previews'].length || app['_data']['katsu']['media_previews'].length != app['_data']['katsu']['media_attachments'].length) {
        return;
    }
    if (0 != _0xd2d1ca.length && app['_data']["showFormVote"]) {
        app['_data']['result_text'] = "[Media] アンケートには画像を付けられないよ。";
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
        if (app['_data']['showForm']) {
            app["saveKatsu"]();
            app['_data']['showForm'] = ![];
        }
        app['_data']['showSearch'] = ![];
        app['_data']['showStream'] = ![];
        app['_data']['showSetting'] = ![];
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
        if (app['_data']['showLink']) {
            _0x448d26 = -1;
        } else if (app['_data']['showForm'] || app['_data']['showSearch'] || app['_data']['showStream'] || app['_data']['showSetting']) {
            _0x448d26 = 1;
        } else {
            _0x448d26 = 0;
        }
        var _0x276250 = _0x5cdf8f["changedTouches"][0];
        dist = 0;
        _0x49dc99 = _0x276250["pageX"];
        _0x1a8dcd = _0x276250["pageY"];
    }, {
        'passive': !![]
    });
    _0x183dec['addEventListener']("touchmove", _['debounce'](function (_0x14cf7e) {
        var _0x59e683 = _0x14cf7e['changedTouches'][0];
        _0x267279 = 0;
        _0x30e866 = _0x59e683['pageX'] - _0x49dc99;
        _0x5bea66 = _0x59e683["pageY"] - _0x1a8dcd;
        if (Math['abs'](_0x5bea66) >= Math['abs'](_0x30e866)) {
            if (!app['_data']['result_lock']) {
                app['_data']['result_type'] = '';
                app['_data']['result_text'] = '';
                app['_data']['error_cnt'] = 0;
            }
            return;
        }
        if (app['_data']['showLink']) {
            _0x2f750a = -1;
        } else if (app['_data']['showForm'] || app['_data']['showSearch'] || app['_data']['showStream'] || app['_data']['showSetting']) {
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
        'passive': !![]
    });
}
swipedetect(document.getElementById('app'), touchController);
function getParameterByName(_0x55941c, _0x46df54) {
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
    app['_data']['katsu']['poll_work']['texts'][_0x46033e] = _0x4f5fb6['value'];
}
function inputSearch(_0x80e9f5) {
    app['_data']["search_text"] = _0x80e9f5['value'];
}
function inputList(_0x3fe06d) {
    app['_data']["stream_list_text"] = _0x3fe06d['value'];
    app["checkStreamListText"]();
}
function inputListProfile(_0xce104a) {
    app['_data']["listprofile"]["name"] = _0xce104a['value'];
    app["checkListProfile"]();
}
function inputKatsuFilterRaw(_0x731379) {
    if (app['_data']['result_text_tmp'] != '') {
        app['_data']['result_text_tmp'] = '';
        app['_data']['error_cnt'] = 0;
    }
    app['_data']['optKatsuFilterRaw'] = _0x731379['value'];
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
app['_data']['optConvMedia'] = 'off';

// --- グローバル公開（バンドル後も index.html の inline ハンドラ/テンプレートから
//     参照できるようにするため window へ割り当てる） ---
window.app = app;
window.wsHome = wsHome;
window.wsLocal = wsLocal;
window.wsMulti = wsMulti;
window.wsDiscord = wsDiscord;
window.changeAppActive = changeAppActive;
window.importclick = importclick;
window.importdragenter = importdragenter;
window.importdragover = importdragover;
window.importdrop = importdrop;
window.importpaste = importpaste;

// --- 復帰時の強制再接続ヘルパー（resume-reconnect から呼ばれる） ---
// ソケット変数(wsHome等)は本モジュール内で閉じているため、死活判定と張り直しも
// ここで行い、単一の真実点を保つ。OPEN(1)以外は死んでいるとみなす。
function kktjsForceReconnectAll() {
  try {
    if (typeof app === 'undefined' || !app['_data']) return;
    var d = app['_data'];
    d['app_active'] = true;
    d['app_network'] = true;

    // Home
    if (!wsHome || wsHome.readyState !== 1) {
      try { if (wsHome && wsHome.readyState !== 3) wsHome.close(); } catch (e) {}
      wsHome = null;
      d['fetch_lock']['homews'] = false;
      d['connHome'] = 'ready';
      try { app['openWsHome'](); } catch (e) {}
      try { app['refetchHome'](); } catch (e) {}
      try { app['refetchNotifAll'](); } catch (e) {}
    }
    // Local
    if (!wsLocal || wsLocal.readyState !== 1) {
      try { if (wsLocal && wsLocal.readyState !== 3) wsLocal.close(); } catch (e) {}
      wsLocal = null;
      d['fetch_lock']['localws'] = false;
      d['connLocal'] = 'ready';
      try { app['openWsLocal'](); } catch (e) {}
      try { app['refetchLocal'](); } catch (e) {}
    }
    // Multi（表示中カラムがあるときのみ再接続）
    var multiActive = !!d['multi_target'] && d['multi_target'] !== '';
    if (!wsMulti || wsMulti.readyState !== 1) {
      try { if (wsMulti && wsMulti.readyState !== 3) wsMulti.close(); } catch (e) {}
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
