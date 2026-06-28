// 外部 <script> で読み込まれるライブラリ・グローバル変数の型宣言。
// lodash(_) / emojione は index.html で個別 <script> 読み込みされる CDN グローバル。
// Vue は npm 依存から import（Vite がバンドル）するため、もはや window グローバルではない。

declare global {
  // vite.config.ts の define で注入されるコンパイル時定数。
  // package.json の version を埋め込む（バンドル時に文字列リテラルに置換される）。
  const __KKTJS_VERSION__: string;

  interface Window {
    // Vue は CDN グローバルではなくなった（import 'vue' でバンドル）。後方互換のため optional 宣言のみ残す。
    Vue?: any;
    _: any;
    emojione: any;
    app: any;
    // 画像 onerror フォールバック用（inline HTML 属性から参照）。
    IMG_DUMMY?: string;
    // 移行した TS メソッドが legacy のモジュールスコープを跨いで参照するブリッジ群。
    // （legacy が createApp/mount より前に設定する。詳細は legacy/app-core.ts を参照）
    __kktjsMethods?: Record<string, (...args: any[]) => any>;
    __kktjsConf?: any;          // open*/auth が参照するデプロイ依存定数・OAuth情報
    __kktjsAudioContext?: any;  // setNotifSound 用 AudioContext
    __kktjsMedia?: any;         // checkActMedia/actMedia 共有のメディア処理状態
    __kktjsStream?: any;        // streaming 用ソケット変数・ST_*・dedupヘルパ
    kktjsForceReconnectAll?: () => void;
    // index.html の inline HTML 属性ハンドラ（onDragover/onDrop/onPaste 等）から
    // 呼ばれる関数群。app-core.ts が window へ公開する（バンドル後もグローバル参照可能）。
    changeAppActive?: (active: boolean) => void;
    importclick?: (...args: any[]) => any;
    importdragenter?: (e: any) => any;
    importdragover?: (e: any) => any;
    importdrop?: (e: any) => any;
    importpaste?: (e: any) => any;
    // 拡大表示メディア保存は廃止（長押し/右クリックの標準保存に一本化）。
    // ストリーミング用 WebSocket（core/streaming.ts が管理）
    wsHome: WebSocket | null;
    wsLocal: WebSocket | null;
    wsMulti: WebSocket | null;
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
}

export {};
