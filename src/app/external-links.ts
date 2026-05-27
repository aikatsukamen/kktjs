// 外部リンクを開く操作と、絵文字入力の開閉（legacy から移行）。
// URL/OAuth 定数は配信先・登録に紐づくデプロイ依存値のため legacy を真実点とし、
// window.__kktjsConf 経由で参照する（呼び出しはユーザー操作時で、その時点で設定済み）。

import type { KktjsApp } from '../types/kktjs-app';

declare const emojione: { shortnameToUnicode: (s: string) => string };

interface KktConf {
  AUTH_URL: string;
  PROFILE_URL: string;
  MASTODON_URL: string;
  ABOUT_URL: string;
  POLICY_URL: string;
  WIKI_URL: string;
  DIRECTRY_URL: string;
  client_id: string;
  client_id_sub: string;
  redirect_url: string;
  redirect_sub: string;
}
function conf(): KktConf {
  return (window as unknown as { __kktjsConf: KktConf }).__kktjsConf;
}
function fillI(tmpl: string, repository: string): string {
  return tmpl.split('[I]').join(repository);
}

/** リロード相当（同一URLへ遷移）。元 openThisPage */
export function openThisPage(_app: KktjsApp): void {
  window.location.href = location.origin + location.pathname;
}

/** OAuth 認可ページへ遷移。autologin で本登録/サブ登録を切替。元 openAuth */
export function openAuth(app: KktjsApp): void {
  const a = app as any;
  const c = conf();
  const url = a.autologin
    ? c.AUTH_URL.split('[I]').join(a.repository).split('[CID]').join(c.client_id).split('[URL]').join(c.redirect_url)
    : c.AUTH_URL.split('[I]').join(a.repository).split('[CID]').join(c.client_id_sub).split('[URL]').join(c.redirect_sub);
  window.location.href = url;
}

export function openProfile(app: KktjsApp): void {
  window.open(fillI(conf().PROFILE_URL, (app as any).repository), '_blank');
}
export function openMastodon(app: KktjsApp): void {
  window.open(fillI(conf().MASTODON_URL, (app as any).repository), '_blank');
}
export function openAbout(app: KktjsApp): void {
  window.open(fillI(conf().ABOUT_URL, (app as any).repository), '_blank');
}
export function openPolicy(app: KktjsApp): void {
  window.open(fillI(conf().POLICY_URL, (app as any).repository), '_blank');
}
export function openWiki(_app: KktjsApp): void {
  window.open(conf().WIKI_URL, '_blank');
}
export function openDirectry(app: KktjsApp): void {
  window.open(fillI(conf().DIRECTRY_URL, (app as any).repository), '_blank');
}

/** 絵文字ピッカーを開く前に本文をテキストエリアへ同期。元 openEmoji */
export function openEmoji(app: KktjsApp): void {
  const content = document.getElementById('katsu_content') as HTMLTextAreaElement | null;
  const katsu = document.getElementById('katsu') as HTMLTextAreaElement | null;
  if (!content || !katsu) return;
  (app as any).katsu_content_text = content.value;
  katsu.value = (app as any).katsu_content_text;
}

/** 絵文字ピッカーを閉じる時にショートコードを絵文字へ変換して本文へ反映。元 closeEmoji */
export function closeEmoji(app: KktjsApp): void {
  const content = document.getElementById('katsu_content') as HTMLTextAreaElement | null;
  const katsu = document.getElementById('katsu') as HTMLTextAreaElement | null;
  if (!content || !katsu) return;
  (app as any).katsu_content_text = emojione.shortnameToUnicode(katsu.value);
  content.value = (app as any).katsu_content_text;
}
