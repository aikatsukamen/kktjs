// iOS Safari 復帰時の通信復旧処理。
// 別アプリ/別タブへ切り替えてしばらく経つと iOS はページを凍結し WebSocket を
// 裏で切断する。元実装は復帰検知を #app の focus/blur に頼っていたため、
// タブ/アプリ単位の前面復帰では確実に発火せず、死んだソケットが復旧されないまま
// タイムライン取得の通信中アイコン（fetch_lock.*ws）が点いたままになっていた。
//
// visibilitychange / pageshow / focus / online を監視して復帰を検知し、
// 実際の再接続（死活判定とソケット張り直し）は legacy 側の
// kktjsForceReconnectAll() に委ねる。ソケット変数(wsHome等)は legacy モジュール内に
// 閉じているため、単一の真実点を保つにはそこで操作するのが安全なため。

let resumeScheduled = false;
let lastResumeAt = 0;

function scheduleResume(): void {
  if (resumeScheduled) return;
  // 直近に再接続したばかりなら抑制（focus/visibilitychange/pageshow が連続発火しても
  // まとめて1回だけにし、元の changeAppActive と二重に走るのを避ける）。
  if (Date.now() - lastResumeAt < 3000) return;
  resumeScheduled = true;
  // 復帰直後はネットワークが不安定なことがあるため少し待ってから実行。
  setTimeout(() => {
    resumeScheduled = false;
    lastResumeAt = Date.now();
    const fn = (window as unknown as { kktjsForceReconnectAll?: () => void }).kktjsForceReconnectAll;
    if (typeof fn === 'function') fn();
  }, 500);
}

export function initResumeReconnect(): void {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleResume();
  });
  window.addEventListener('pageshow', scheduleResume);
  window.addEventListener('focus', scheduleResume);
  window.addEventListener('online', scheduleResume);
}
