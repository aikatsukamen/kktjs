// 外部 <script> で読み込まれるライブラリ・グローバル変数の型宣言。
// Vue / lodash(_) / emojione は index.html で個別読み込みされる。

// Vue 2 は型パッケージを入れず、最小限の any 互換で扱う（段階移行のため）。
// 厳密化したい場合は @types/vue (v2) を devDependencies に追加して差し替え可能。
declare global {
  interface Window {
    Vue: any;
    _: any;
    emojione: any;
    app: any;
    // 拡大表示メディア保存は廃止（長押し/右クリックの標準保存に一本化）。
    // ストリーミング用 WebSocket（core/streaming.ts が管理）
    wsHome: WebSocket | null;
    wsLocal: WebSocket | null;
    wsMulti: WebSocket | null;
    wsDiscord: WebSocket | null;
    // AudioContext のベンダプレフィックス対応
    webkitAudioContext?: typeof AudioContext;
    mozNotification?: typeof Notification;
    webkitNotification?: typeof Notification;
  }

  // main.js 互換のグローバル（バンドル後も window 経由で参照される）
  var app: any;
  var wsHome: WebSocket | null;
  var wsLocal: WebSocket | null;
  var wsMulti: WebSocket | null;
  var wsDiscord: WebSocket | null;
}

export {};
