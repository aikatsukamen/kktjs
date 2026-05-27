// 配信場所（ルート / サブパス / 独自ドメイン）に依存しないためのベースパス導出。
//
// 従来コードは '/kktjs/...' を直書きしており、GitHub Pages のサブパス
// (https://aikatsukamen.github.io/kktjs/) 専用になっていた。独自ドメインのルートや
// 別パスへ移すと壊れるため、実行時に「自分がどこから配信されているか」を検出して
// 相対的に資産URLを組み立てる。

let cachedBase: string | null = null;

/**
 * アプリのベースパス（末尾スラッシュ付き、例 "/kktjs/" や "/"）を返す。
 * 優先順位:
 *   1. <base href> があればそのパス部分
 *   2. このモジュール自身の URL（import.meta.url）から導出
 *      （Vite 生成の …/<base>/assets/index-[hash].js → /assets/ の手前がアプリルート）
 *   3. 読み込まれている script の src からの導出（…/assets/ または …/js/main.js）
 *   4. 取得できなければ location.pathname のディレクトリ部
 */
export function getBasePath(): string {
  if (cachedBase != null) return cachedBase;

  // 1) <base href>
  const baseEl = document.querySelector('base[href]') as HTMLBaseElement | null;
  if (baseEl) {
    try {
      cachedBase = ensureTrailingSlash(new URL(baseEl.href).pathname);
      return cachedBase;
    } catch {
      /* fallthrough */
    }
  }

  // 2) このモジュール自身の URL から導出（Vite: …/<base>/assets/index-[hash].js）。
  //    最も確実な方法。バンドルされた本モジュールの位置からアプリルートを割り出す。
  try {
    const meta = import.meta as unknown as { url?: string };
    if (meta && meta.url) {
      const fromMeta = baseFromAssetUrl(meta.url);
      if (fromMeta) {
        cachedBase = fromMeta;
        return cachedBase;
      }
    }
  } catch {
    /* import.meta 非対応環境などはフォールバックへ */
  }

  // 3) script の src から導出（…/assets/index-*.js または 後方互換の …/js/main.js）。
  const script =
    (document.querySelector('script[src*="/assets/"]') as HTMLScriptElement | null) ||
    (document.querySelector('script[src*="js/main.js"]') as HTMLScriptElement | null) ||
    (document.currentScript as HTMLScriptElement | null);
  if (script && script.src) {
    const fromScript = baseFromAssetUrl(script.src);
    if (fromScript) {
      cachedBase = fromScript;
      return cachedBase;
    }
  }

  // 4) 最後の手段: 現在のパスのディレクトリ部
  const dir = location.pathname.replace(/[^/]*$/, '');
  cachedBase = ensureTrailingSlash(dir || '/');
  return cachedBase;
}

/** アセット URL（…/<base>/assets/... または …/<base>/js/main.js）からアプリルートを切り出す。 */
function baseFromAssetUrl(url: string): string | null {
  try {
    const p = new URL(url).pathname;
    const ai = p.lastIndexOf('/assets/');
    if (ai !== -1) return ensureTrailingSlash(p.slice(0, ai));
    const ji = p.lastIndexOf('/js/');
    if (ji !== -1) return ensureTrailingSlash(p.slice(0, ji));
  } catch {
    /* noop */
  }
  return null;
}

/** ベースパスからの相対資産パスを絶対URLパスに解決する。 */
export function asset(path: string): string {
  const base = getBasePath();
  const clean = path.replace(/^\.?\//, ''); // 先頭の "./" や "/" を除去
  return base + clean;
}

/** アプリのルート絶対URL（origin + base、末尾スラッシュ付き）。OAuth redirect 等に使う。 */
export function getAppOrigin(): string {
  return location.origin + getBasePath();
}

function ensureTrailingSlash(s: string): string {
  if (s === '' ) return '/';
  return s.endsWith('/') ? s : s + '/';
}
