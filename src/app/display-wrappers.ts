// 表示整形まわり（legacy から移行）。
//  - updateWrapperBM / updateWrapperAll / updateWrapper: media/content の開閉フラグ付与
//  - updateFilterBM / updateFilterAll: NGワード/正規表現フィルタ判定（caught_katsufilter）
//  - updateImgLoading: 画像ローディングフラグ付与
//  - updateVote: 投票結果(poll)を全カラムへ反映
// 元実装の挙動（socket/detail/detail_chain/配列の各モード、設定値の解釈）を忠実に再現する。

import type { KktjsApp } from '../types/kktjs-app';
import type { Status } from '../types/mastodon';

// HTMLタグ除去（フィルタ判定で本文からタグを取り除くための元コードと同じ正規表現）。
const STRIP_TAGS = /<("[^"]*"|'[^']*'|[^'">])*>/g;

function openFlags(app: KktjsApp): { media: true | undefined; content: true | undefined } {
  const all = (app as any).optAllOpen;
  return {
    media: all === 'both' || all === 'media' ? true : undefined,
    content: all === 'both' || all === 'katsu' ? true : undefined,
  };
}

function applyOpen(s: any, media: unknown, content: unknown, withReblogStatus = false): void {
  s['media_opened'] = media;
  s['content_opened'] = content;
  if (withReblogStatus) {
    if (s['reblog']) { s['reblog']['media_opened'] = media; s['reblog']['content_opened'] = content; }
    if (s['status']) { s['status']['media_opened'] = media; s['status']['content_opened'] = content; }
  }
}

/** media/content の開閉フラグを対象へ付与。元 updateWrapperBM。
 *  mode: 'socket' | 'detail' | 'detail_chain' | それ以外（配列）。 */
export function updateWrapperBM(app: KktjsApp, data: any, mode?: string): void {
  if ((app as any).optAllOpen === '') return;
  const { media, content } = openFlags(app);

  if (mode === 'socket') {
    data['media_opened'] = media;
    data['content_opened'] = content;
    if (data['reblog']) { data['reblog']['media_opened'] = media; data['reblog']['content_opened'] = content; }
    if (data['status']) { data['status']['media_opened'] = media; data['status']['content_opened'] = content; }
    app.$forceUpdate();
    return;
  }
  if (mode === 'detail') {
    data['media_opened'] = media;
    data['content_opened'] = content;
    app.$forceUpdate();
    return;
  }
  if (mode === 'detail_chain' && data.length !== 0) {
    data['ancestors'].forEach((s: Status) => applyOpen(s, media, content));
    data['descendants'].forEach((s: Status) => applyOpen(s, media, content));
    app.$forceUpdate();
    return;
  }
  data.forEach((s: any) => applyOpen(s, media, content, true));
  app.$forceUpdate();
}

/** 全カラムへ media/content 開閉フラグを付与。元 updateWrapperAll。 */
export function updateWrapperAll(app: KktjsApp): void {
  const { media, content } = openFlags(app);
  app.homes.forEach((s: any) => applyOpen(s, media, content, !!s.reblog));
  app.locals.forEach((s: any) => applyOpen(s, media, content));
  app.notifs.forEach((n: any) => { if (n.status) applyOpen(n.status, media, content); });
  app.notifs_filter.forEach((n: any) => { if (n.status) applyOpen(n.status, media, content); });
  app.accts.forEach((s: any) => applyOpen(s, media, content, !!s.reblog));
  app.acct_pinned.forEach((s: any) => applyOpen(s, media, content));
  if (app.detail as any) {
    (app.detail as any)['media_opened'] = media;
    (app.detail as any)['content_opened'] = content;
  }
  const chain = app.detail_chain as any;
  if (chain && chain.length !== 0) {
    chain['ancestors'].forEach((s: Status) => applyOpen(s, media, content));
    chain['descendants'].forEach((s: Status) => applyOpen(s, media, content));
  }
  app.multis.forEach((s: any) => applyOpen(s, media, content));
  app.$forceUpdate();
}

/** 単一ステータスにフィルタ判定値を設定。元 updateWrapper（caught_katsufilter）。 */
export function updateWrapper(app: KktjsApp, status: any, caught: unknown): void {
  status['caught_katsufilter'] = caught;
  app.$forceUpdate();
}

function filterTest(re: RegExp, s: any): boolean {
  return re.test((s['spoiler_text'] || '') + (s['content'] || '').replace(STRIP_TAGS, ''));
}

/** NGワード/正規表現フィルタ判定を対象へ付与。元 updateFilterBM。 */
export function updateFilterBM(app: KktjsApp, data: any, mode?: string): void {
  if ((app as any).optKatsuFilter === '') return;
  const re = new RegExp((app as any).optKatsuFilterStr);

  if (mode === 'socket') {
    if (data['reblog']) {
      data['reblog']['caught_katsufilter'] = filterTest(re, data['reblog']);
    } else if (data['status']) {
      data['status']['caught_katsufilter'] = filterTest(re, data['status']);
    } else {
      data['caught_katsufilter'] = filterTest(re, data);
    }
    app.$forceUpdate();
    return;
  }
  data.forEach((item: any) => {
    if (item['reblog']) {
      item['reblog']['caught_katsufilter'] = filterTest(re, item['reblog']);
    } else if (item['status']) {
      item['status']['caught_katsufilter'] = filterTest(re, item['status']);
    } else {
      item['caught_katsufilter'] = filterTest(re, item);
    }
  });
  app.$forceUpdate();
}

/** フィルタ設定（word/regex）を解釈してフィルタ文字列を作り、全カラム再判定。元 updateFilterAll。 */
export function updateFilterAll(app: KktjsApp): void {
  const a = app as any;
  if (a['optKatsuFilter'] === 'word') {
    const words = a['optKatsuFilterRaw'].trim().split(',').filter((item: string) => {
      // 正規表現エスケープしてから空要素を除外（元コードと同じ）
      item = item.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
      return item !== '';
    });
    words.splice(10);
    a['optKatsuFilterRaw'] = words.join(',');
    a['result_text_tmp'] = words.length >= 10 ? words.length + ' (Max)' : words.length + ' word(s)';
    a['optKatsuFilterStr'] = '(' + words.join('|') + ')';
  } else if (a['optKatsuFilter'] === 'regex') {
    a['result_text_tmp'] = 'ok.';
    a['optKatsuFilterStr'] = a['optKatsuFilterRaw'];
  } else {
    a['result_text_tmp'] = '';
    a['optKatsuFilterStr'] = '^s$';
  }
  const re = new RegExp(a['optKatsuFilterStr']);
  app.homes.forEach((item: any) => {
    if (item.reblog) item.reblog.caught_katsufilter = filterTest(re, item.reblog);
    else item.caught_katsufilter = filterTest(re, item);
  });
  app.locals.forEach((item: any) => { item.caught_katsufilter = filterTest(re, item); });
  app.multis.forEach((item: any) => { item.caught_katsufilter = filterTest(re, item); });
  app.$forceUpdate();
}

/** 画像ローディングフラグを配列の各要素へ付与。元 updateImgLoading。 */
export function updateImgLoading(app: KktjsApp, list: any[]): void {
  list.forEach((s: any) => {
    s['loading_avatar'] = true;
    if ((s['reblog'] != null && s['reblog']['media_attachments'] != 0) || s['media_attachments'] != 0) {
      s['loading_media'] = true;
    }
  });
  app.$forceUpdate();
}

/** 投票(poll)結果を全カラムの該当ステータスへ反映。元 updateVote。 */
export function updateVote(app: KktjsApp, id: string, poll: unknown): void {
  const setPoll = (s: any) => {
    if (s['id'] === id) { s['poll'] = poll; return; }
    if (s['reblog'] && s['reblog']['id'] === id) { s['reblog']['poll'] = poll; }
  };
  app.homes.forEach(setPoll);
  app.locals.forEach((s: any) => { if (s['id'] === id) s['poll'] = poll; });
  app.notifs.forEach((n: any) => { if (n.status && n.status['id'] === id) n.status['poll'] = poll; });
  app.notifs_filter.forEach((n: any) => { if (n.status && n.status['id'] === id) n.status['poll'] = poll; });
  app.accts.forEach(setPoll);
  app.acct_pinned.forEach((s: any) => { if (s['id'] === id) s['poll'] = poll; });
  if ((app.detail as any) && (app.detail as any)['id'] === id) (app.detail as any)['poll'] = poll;
  const chain = app.detail_chain as any;
  if (chain && chain.length !== 0) {
    chain['ancestors'].forEach((s: any) => { if (s['id'] === id) s['poll'] = poll; });
    chain['descendants'].forEach((s: any) => { if (s['id'] === id) s['poll'] = poll; });
  }
  app.multis.forEach((s: any) => { if (s['id'] === id) s['poll'] = poll; });
  app.$forceUpdate();
}
