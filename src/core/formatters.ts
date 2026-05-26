// 日付フォーマットと各種チェック/述語ヘルパー（legacy から移行）。
// いずれも純粋関数に近く、型付けの恩恵が大きく移行リスクが低いものを対象とする。
// formatContent / formatSpoiler 系（巨大な埋め込みHTML文字列を持つ）は誤りやすく
// 型安全の恩恵も薄いため、現時点では legacy に残す。

import { NOIMAGE_HEADER, NOIMAGE_AVATAR, NOIMAGE_MEDIA, NOIMAGE_MEDIA_PROXY, IMG_DUMMY } from './constants';
import type { Status, MediaAttachment, Account, Poll } from '../types/mastodon';

/** 2桁ゼロ埋め */
function pad2(n: number): string {
  return ('0' + n).slice(-2);
}

/** 投稿日時の整形（1年以上前は年も表示）。元 formatDate */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  if (d.getTime() < oneYearAgo.getTime()) {
    return (
      pad2(d.getFullYear()) + '/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes())
    );
  }
  return (
    pad2(d.getMonth() + 1) + '/' + pad2(d.getDate()) +
    ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes())
  );
}

/** 年月日時分秒まで含む整形。元 formatDateFull */
export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    pad2(d.getFullYear()) + '/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate()) +
    ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds())
  );
}

/** 投票締切（現在 + 秒数）の整形。元 formatDateVote */
export function formatDateVote(seconds: number): string {
  const d = new Date();
  d.setSeconds(d.getSeconds() + seconds);
  return (
    d.getFullYear() + '/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate()) +
    ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes())
  );
}

/** カード等の URL からドメインを抽出（副作用で obj.domain/passed を更新）。元 formatDomain */
export function formatDomain(obj: { passed?: boolean; url: string | null; domain?: string }): string | undefined {
  if (!obj.passed && obj.url != null) {
    const matched = obj.url.match(/^[httpsfile]+:\/{2,3}([0-9a-z.\-:]+?):?[0-9]*?\//i);
    if (matched) {
      obj.domain = matched[1];
    } else {
      console.warn(`formatDomain Error. URL=${obj.url}`);
    }
  }
  obj.passed = true;
  return obj.domain;
}

/** 表示名が空白のみでないか。元 checkDisplayName */
export function checkDisplayName(name: string | null | undefined): boolean {
  return !!name && name.length > 0 && name.replace(/^[\s　]+|[\s　]+$/g, '').length > 0;
}

/** スレッド（返信/被返信）を持つか。元 checkKatsuChain */
export function checkKatsuChain(status: Status): boolean {
  return status.replies_count !== 0 || status.in_reply_to_id != null;
}

/** ヘッダ画像がデフォルト（未設定）か。元 checkHeader */
export function checkHeader(repository: string, headerUrl: string): boolean {
  return 'https://' + repository + NOIMAGE_HEADER === headerUrl;
}

/** アバターがデフォルトならローカルのダミーへ差し替え。元 checkAvatar */
export function checkAvatar(repository: string, avatarUrl: string): string {
  return 'https://' + repository + NOIMAGE_AVATAR === avatarUrl
    ? '/kktjs/img/missing_icon.png'
    : avatarUrl;
}

/** メディアの表示URLを選ぶ（プロキシ/ダミー考慮）。元 checkMedia */
export function checkMedia(preview: string | null, remote: string | null): string | null {
  if (NOIMAGE_MEDIA === preview) {
    return IMG_DUMMY;
  } else if (preview != null && preview.indexOf(NOIMAGE_MEDIA_PROXY) === -1) {
    return preview;
  } else {
    return remote;
  }
}

/** Discord アバターURLを組み立てる。元 checkAvatarDiscord */
export function checkAvatarDiscord(user: { id: string; avatar: string }): string {
  return 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.png';
}

/** 投票が有効（未終了）か。元 checkVote */
export function checkVote(poll: Poll & { choices?: unknown; expired?: boolean }): boolean {
  return poll.choices != null && !poll.expired;
}

/** 2つの配列が id ベースで等しいか。元 equalArr */
export function equalArr(a: Array<{ id: string }>, b: Array<{ id: string }>): boolean {
  let eq = true;
  a.forEach((item, i) => {
    eq = eq && b[i] != null && item.id === b[i].id;
  });
  return eq;
}

/** 投票の選択肢が設定済みか。元 isSetVote */
export function isSetVote(poll: { choices?: unknown[] }, index: number): boolean {
  return poll.choices != null && !!poll.choices[index];
}
