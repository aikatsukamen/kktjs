// アプリ独自の設定・状態の型定義。
// data 直下のフィールド（難読化解読版 main_body.js 216行目以降）に対応。

export type ConnState = 'ready' | 'open' | 'close' | 'lost';

// fetch_lock: タイムライン取得/接続中のロックフラグ群（通信中アイコンの表示制御に使用）
export interface FetchLock {
  update: boolean;
  home: boolean;
  local: boolean;
  notif: boolean;
  acct: boolean;
  multi: boolean;
  lists: boolean;
  search: boolean;
  search_hashtag: boolean;
  homews: boolean;
  localws: boolean;
  multiws: boolean;
}

// Service Worker の状態
export interface SwStat {
  enabled: boolean;
  controller: boolean;
}

// ユーザー設定（confs に保存され localStorage に永続化される想定）
export interface UserConf {
  ver: number;
  mode: string;
  ptl: boolean;
  simple: boolean;
  autoplay: string;
  mediaheight: string;
  mediafit: string;
  katsutrim: boolean;
  allnsfw: boolean;
  allopen: boolean;
  filkatsu: boolean;
  filkatsuraw: string;
  filkatsustr: string;
  filnotif: boolean;
  confirm: boolean;
  columnwide: boolean;
  autolayout: boolean;
  keepform: boolean;
  convmedia: string;
  tops: string;
  bottoms: string;
  shortnotif: boolean;
  [key: string]: unknown;
}

// 通知の未読カウント（種別ごと）
export interface NotifUnreadFilter {
  mention: number;
  fav: number;
  reblog: number;
  follow: number;
  others: number;
}
