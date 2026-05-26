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
 *   2. 読み込まれている main.js の <script src> の URL からディレクトリを2階層遡る
 *      （…/js/main.js → アプリルート）
 *   3. 取得できなければ location.pathname のディレクトリ部
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

  // 2) main.js の場所から導出（…/<base>/js/main.js）
  const script =
    (document.querySelector('script[src*="js/main.js"]') as HTMLScriptElement | null) ||
    (document.currentScript as HTMLScriptElement | null);
  if (script && script.src) {
    try {
      const p = new URL(script.src).pathname; // 例: /kktjs/js/main.js
      const idx = p.lastIndexOf('/js/');
      if (idx !== -1) {
        cachedBase = ensureTrailingSlash(p.slice(0, idx));
        return cachedBase;
      }
    } catch {
      /* fallthrough */
    }
  }

  // 3) 最後の手段: 現在のパスのディレクトリ部
  const dir = location.pathname.replace(/[^/]*$/, '');
  cachedBase = ensureTrailingSlash(dir || '/');
  return cachedBase;
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
