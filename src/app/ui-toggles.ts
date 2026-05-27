// 各種パネル/フォームの表示トグル（legacy から移行）。
// いずれも app（Vue インスタンス）の show* フラグを切り替える。他メソッド呼び出し
// （fetchStreamList / saveKatsu / checkStreamListText 等）は app 経由で legacy 実装を呼ぶ。

import type { KktjsApp } from '../types/kktjs-app';

type A = any; // app の動的フィールドアクセス用

export function toggleHomeOption(app: KktjsApp): void {
  (app as A).showHomeOption = !(app as A).showHomeOption;
}
export function toggleLocalOption(app: KktjsApp): void {
  (app as A).showLocalOption = !(app as A).showLocalOption;
}
export function toggleNotifOption(app: KktjsApp): void {
  (app as A).showNotifOption = !(app as A).showNotifOption;
}

export function toggleAcctEdit(app: KktjsApp): void {
  const a = app as A;
  if (a.showAcctEdit) {
    a.profile = [];
  } else {
    const parts = a.user['display_name'].split(/[\u202e\u202d]/g);
    a.profile['name'] = parts[0];
    a.profile['name_b'] = parts[1] != null && parts[1].length > 0 ? parts[1] : '';
  }
  a.showAcctEdit = !a.showAcctEdit;
}
export function toggleAcctOption(app: KktjsApp): void {
  (app as A).showAcctOption = !(app as A).showAcctOption;
}

// 排他的に開くパネル群（設定/検索/投稿/ストリーム/リンク）。各 toggle は元実装の
// 微妙な差異（setting を残すか等）を忠実に再現するため、個別に展開している。

export function toggleSetting(app: KktjsApp): void {
  const a = app as A;
  if (a.showForm || a.showSearch || a.showStream || a.showLink) {
    if (a.showForm) { a.saveKatsu(); a.showForm = false; }
    a.showSearch = false;
    a.showStream = false;
    a.showLink = false;
  }
  a.showSetting = !a.showSetting;
}

export function toggleSearch(app: KktjsApp): void {
  const a = app as A;
  if (a.showSetting || a.showForm || a.showStream || a.showLink) {
    a.showSetting = false;
    if (a.showForm) { a.saveKatsu(); a.showForm = false; }
    a.showStream = false;
    a.showLink = false;
  }
  a.showSearch = !a.showSearch;
}

export function toggleStream(app: KktjsApp): void {
  const a = app as A;
  if (a.fetch_after['lists']) a.fetchStreamList();
  if (a.showSetting || a.showForm || a.showSearch || a.showLink) {
    a.showSetting = false;
    if (a.showForm) { a.saveKatsu(); a.showForm = false; }
    a.showSearch = false;
    a.showLink = false;
  }
  a.showStream = !a.showStream;
}

export function toggleStreamEdit(app: KktjsApp): void {
  const a = app as A;
  a.stream_list_text = '';
  a.listprofile['name'] = a.hasStreamList ? a.stream_list['title'] : '';
  (document.getElementById('list_name') as HTMLInputElement).value = a.listprofile['name'];
  a.checkStreamListText();
  a.checkListProfile();
  a.showStreamEdit = !a.showStreamEdit;
}

export function toggleForm(app: KktjsApp): void {
  const a = app as A;
  if (a.showForm) a.saveKatsu();
  if (a.showSetting || a.showSearch || a.showStream || a.showLink) {
    a.showSetting = false;
    a.showSearch = false;
    a.showStream = false;
    a.showLink = false;
  }
  a.showForm = !a.showForm;
}

export function toggleFormSpoiler(app: KktjsApp): void {
  const a = app as A;
  if (a.showFormSpoiler) {
    a.katsu_spoiler_text_bu = a.katsu_spoiler_text;
    a.katsu_spoiler_text = '';
  } else {
    a.katsu_spoiler_text = a.katsu_spoiler_text_bu;
  }
  a.showFormSpoiler = !a.showFormSpoiler;
}
export function toggleFormVote(app: KktjsApp): void {
  (app as A).showFormVote = !(app as A).showFormVote;
}
export function toggleFormDraft(app: KktjsApp): void {
  (app as A).showFormDraft = !(app as A).showFormDraft;
}
export function toggleFormVisible(app: KktjsApp): void {
  (app as A).showFormVisible = !(app as A).showFormVisible;
}

export function toggleSideLink(app: KktjsApp): void {
  const a = app as A;
  if (a.fetch_after['lists']) a.fetchStreamList();
  if (a.showForm || a.showSearch || a.showStream || a.showSetting) {
    a.showSetting = false;
    if (a.showForm) { a.saveKatsu(); a.showForm = false; }
    a.showSearch = false;
    a.showStream = false;
    return;
  }
}

export function toggleLink(app: KktjsApp): void {
  const a = app as A;
  if (a.fetch_after['lists']) a.fetchStreamList();
  if (a.showSetting || a.showForm || a.showSearch || a.showStream) {
    a.showSetting = false;
    if (a.showForm) { a.saveKatsu(); a.showForm = false; }
    a.showSearch = false;
    a.showStream = false;
  }
  a.showLink = !a.showLink;
}
export function toggleLinkSearch(app: KktjsApp): void {
  (app as A).showLinkSearch = !(app as A).showLinkSearch;
}
export function toggleLinkStream(app: KktjsApp, target: unknown): void {
  const a = app as A;
  if (a.fetch_after['lists']) a.fetchStreamList();
  a.showLinkStream = target === a.showLinkStream ? '' : target;
}
