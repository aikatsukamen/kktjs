// iOS ビューポート高さ補正。
// iOS Safari では 100vh がアドレスバーを隠した最大ビューポート基準で計算されるため、
// 表示中の実高さ window.innerHeight から CSS 変数 --vh を算出し、
// CSS 側で calc(var(--vh) * 100) として使う。

function setVH(): void {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', vh + 'px');
  document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
}

export function initViewportHeight(): void {
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', () => {
    // iOS ではアドレスバーのリサイズが orientationchange より遅れることがあるため再計測。
    setVH();
    setTimeout(setVH, 300);
  });
  // bfcache 復帰など resize が来ないケースの保険。
  window.addEventListener('pageshow', setVH);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setVH);
  }
}
