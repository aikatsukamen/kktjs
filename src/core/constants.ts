// アプリ全体で使う定数群。難読化解読版 main_body.js の冒頭定義に対応。
// 値は元のコードと同一（16進は10進に直して可読化）。

export const BOOP = 'sounds/boop.mp3';
export const BOOP_EX = 'sounds/boop.mp3';
// 画像のダミー/未設定パス。配信場所に依存しないようベースからの相対パスで保持し、
// 実際のURL化は core/base-path.ts の asset() を通す（独自ドメイン/ルート配信でも動く）。
export const IMG_DUMMY_REL = 'img/missing_header.png';
export const IMG_MISSING_ICON_REL = 'img/missing_icon.png';
export const NOIMAGE_AVATAR = '/avatars/original/missing.png';
export const NOIMAGE_HEADER = '/headers/original/missing.png';
export const NOIMAGE_MEDIA = '/files/small/missing.png';
export const NOIMAGE_MEDIA_PROXY = 'media_proxy';

export const IMAGE_MAXLEN = 0x500;          // 1280
export const IMAGE_MAXPIXEL = 0x500 * 0x500;

// 取得件数の上限
export const LIMIT = 40;
export const LIMIT_USER = 80;
export const LIMIT_NOTIF = 30;
export const LIMIT_DIS = 100;
export const LIMIT_LISTS = 50;
export const LIMIT_HASHTAGS = 20;
export const LIMIT_ACCTNAME = 30;
export const LIMIT_LISTNAME = 300;
export const LIMIT_POLLOPTION = 25;
export const LIMIT_POLLEXPIRE = 2505540;
export const LIMIT_IMGFILE = 0x800000;      // 8 MB
export const LIMIT_MOVFILE = 0x2800000;     // 40 MB

// タイミング(ms)
export const TIME_SCROLL = 60;
export const TIME_TOUCH = 40;
export const TIME_REFRESH = 1100;
export const REQ_TIMEOUT = 15000;
export const THRESHOLD_HIGH = 1100;
export const THRESHOLD_LOW = 2700;

// 既知の最終ID（旧インスタンス移行用の閾値）
export const KKT1_LASTID = 4919581;

// リダイレクト / OAuth
// OAuth リダイレクト URL。Mastodon アプリ登録時の値と一致する必要があるため
// デプロイ依存。既定は実行時に getAppOrigin() で導出する想定だが、登録値を変えられない
// 場合に備え固定値も残す（legacy 側は当面この固定値を使用）。
export const REDIRECT_URL = 'https://aikatsukamen.github.io/kktjs/';
export const REDIRECT_SUB = 'urn:ietf:wg:oauth:2.0:oob';
export const CLIENT_ID = 'Zl8G71GsqB4E-Ze89rA5Gly99wOiU5g6eymHGeaDMQ0';
export const CLIENT_ID_SUB = 'qrzMcJTeBiaPYqScFTgx77dSwfI7vM4erlXyufeSVws';
export const CLIENT_SECRET = 'pxueumQ_Rrw35cgF_vLk1etwzT0I2l3NBnJ_RToJr5Y';
export const CLIENT_SECRET_SUB = 'mU6GdW47CI0p_hYbZfwSufcKZZ8NA-YkfmG93ztuSrQ';

// Discord 連携
export const DIS_API = 'discordapp.com/api';
export const DIS_API_VER = '6';
export const DIS_CHANNEL: Record<string, string> = {
  room0: '405706906049708034',
  room1: '305718290016370688',
  room2: '305717014822125568',
};
