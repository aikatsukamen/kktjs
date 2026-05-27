// 投稿本文・スポイラー・絵文字の整形（legacy から移行）。
//
// emojione.toImage(patchEmoji(...)) で絵文字を画像化し、インスタンス内リンク
// (kirakiratter.com の status / tags / @user) をアプリ内ナビゲーション用の
// javascript: ハンドラへ書き換える。元実装の文字列・正規表現を忠実に再現する。
//
// 注意: 書き換え対象ドメインは元コードのまま 'kirakiratter.com' を直書きしている
// （リンク書き換えの挙動を変えないため）。インスタンスを変える場合はここも要変更。

import { patchEmoji, escapeHtml } from './utils';

declare const emojione: { toImage: (s: string) => string };

// インスタンス内リンク → アプリ内ナビゲーションへの書き換え（split/join 連結）。
// formatContent / formatSpoiler / *Confirm で共通。
function rewriteInstanceLinks(html: string): string {
  return html
    .split('<a href="https://kirakiratter.com/web/statuses/')
    .join('<a href="javascript:void(0)" onClick="app.$data.detail_targetid = decodeURIComponent(this.getAttribute(\'stats\'));app.runDetail(app.$data.detail_targetid);return false;" stats="')
    .split('<a href="https://kirakiratter.com/tags/')
    .join('<a href="javascript:void(0)" onClick="app.$data.search_hashtag = decodeURIComponent(this.getAttribute(\'tag\'));app.runMulti(\'Hashtag\', app.$data.search_hashtag);app.reopenWsMulti(\'Hashtag\', app.$data.search_hashtag);return false;" tag="')
    .split('<a href="https://kirakiratter.com/@')
    .join('<a href="javascript:void(0)" onClick="app.$data.search_userid = this.getAttribute(\'user\');app.runUserId();return false;" user="');
}

const NAME_BADGE = /:name_badge:/g;
const DOUBLE_SPACE = / {2}/g;
// タイムライン表示用: メディアURLを含む span をアイコンに置換
const MEDIA_SPAN = />kirakiratter.com\/media\/[\s\S]*?<\/span>/g;
// 確認モーダル用: メディアURL（末尾スペースまで）をアイコンに置換
const MEDIA_BARE = /https:\/\/kirakiratter.com\/media\/[\s\S]*? /g;
const MEDIA_ICON_SPAN = '><i class="fa fa-fw fa-photo "></i></span>';
const MEDIA_ICON = '<i class="fa fa-fw fa-photo "></i>';

/** 投稿本文の整形（タイムライン表示用）。元 formatContent */
export function formatContent(text: string | null, customEmojis: unknown): string {
  if (text == null) return '';
  const img = emojione.toImage(patchEmoji(text, customEmojis as any));
  return rewriteInstanceLinks(img)
    .replace(MEDIA_SPAN, MEDIA_ICON_SPAN)
    .replace(NAME_BADGE, '📛')
    .replace(DOUBLE_SPACE, '&nbsp;&nbsp;');
}

/** スポイラー文の整形（escapeHtml + 改行を <br>）。元 formatSpoiler */
export function formatSpoiler(text: string | null, customEmojis: unknown): string {
  if (text == null) return '';
  const img = emojione.toImage(patchEmoji(escapeHtml(text) as string, customEmojis as any));
  return rewriteInstanceLinks(img)
    .replace(MEDIA_SPAN, MEDIA_ICON_SPAN)
    .replace(NAME_BADGE, '📛')
    .replace(DOUBLE_SPACE, '&nbsp;&nbsp;')
    .replace(/\r\n/g, '<br />')
    .replace(/(\n|\r)/g, '<br />');
}

/** 投稿本文の整形（確認モーダル用。連続改行は2連まで圧縮）。元 formatContentConfirm */
export function formatContentConfirm(text: string | null, customEmojis: unknown): string {
  if (text == null) return '';
  const img = emojione.toImage(patchEmoji(escapeHtml(text) as string, customEmojis as any));
  return rewriteInstanceLinks(img)
    .replace(MEDIA_BARE, MEDIA_ICON)
    .replace(NAME_BADGE, '📛')
    .replace(DOUBLE_SPACE, '&nbsp;&nbsp;')
    .replace(/(\r\n){2,}/g, '<br /><br />')
    .replace(/(\n|\r){2,}/g, '<br /><br />')
    .replace(/\r\n/g, '<br />')
    .replace(/(\n|\r)/g, '<br />');
}

/** スポイラー文の整形（確認モーダル用）。元 formatSpoilerConfirm */
export function formatSpoilerConfirm(text: string | null, customEmojis: unknown): string {
  if (text == null) return '';
  const img = emojione.toImage(patchEmoji(escapeHtml(text) as string, customEmojis as any));
  return rewriteInstanceLinks(img)
    .replace(MEDIA_BARE, MEDIA_ICON)
    .replace(NAME_BADGE, '📛')
    .replace(DOUBLE_SPACE, '&nbsp;&nbsp;')
    .replace(/\r\n/g, '<br />')
    .replace(/(\n|\r)/g, '<br />');
}

/** 絵文字のみ画像化。元 formatEmoji */
export function formatEmoji(text: string | null, customEmojis: unknown): string {
  if (text == null) return '';
  return emojione.toImage(patchEmoji(text, customEmojis as any)).replace(NAME_BADGE, '📛');
}

/** 絵文字のみ画像化（下書き用。escapeHtml 付き）。元 formatEmojiDraft */
export function formatEmojiDraft(text: string | null, customEmojis: unknown): string {
  if (text == null) return '';
  return emojione.toImage(patchEmoji(escapeHtml(text) as string, customEmojis as any)).replace(NAME_BADGE, '📛');
}
