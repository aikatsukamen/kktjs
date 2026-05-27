// システム/セットアップ系メソッド（legacy から移行）。
// 一部は legacy グローバル（AudioContext, lodash）を参照する。

import _ from 'lodash';
import type { KktjsApp } from '../types/kktjs-app';
import { apiGet } from '../api/client';
import { fillEndpoint, FOLLOW_REQUEST } from '../api/endpoints';
import { LIMIT_USER } from '../core/constants';

type A = any;

/** リサイズ/回転でカラム数を再計算（debounce）。元 setResizer */
export function setResizer(app: KktjsApp): void {
  const a = app as A;
  window.onresize = _.debounce(function () {
    a.resetColumn(window.innerWidth);
  }, 600);
  (window as any).onorientationchange = _.debounce(function () {
    a.resetColumn(window.innerWidth);
  }, 200);
  a.resetColumn(window.innerWidth);
}

/** 戻る操作（popstate）でモーダル/パネルを閉じる挙動を設定。元 setHistory */
export function setHistory(app: KktjsApp): void {
  const self = app as A;
  history.pushState('kktjs', '', location.href);
  window.addEventListener('popstate', function (this: any) {
    if (self.showEmojiPicker) {
      self.showEmojiPicker = false;
      history.pushState('kktjs', '', location.href);
      return;
    }
    if (self.showForm || self.showSearch || self.showStream || self.showSetting || self.showLink) {
      // 元コードは此処で this.showForm を参照している（faithful に維持）
      if ((this as any).showForm) {
        self.saveKatsu();
        self.showForm = false;
      }
      self.showSearch = false;
      self.showStream = false;
      self.showSetting = false;
      self.showLink = false;
      history.pushState('kktjs', '', location.href);
      return;
    }
    if (self.optPtl === '2' && !self.showHome) {
      self.runHome();
      history.pushState('kktjs', '', location.href);
      return;
    }
    if (self.optPtl !== '2' && !self.showLocal) {
      self.runLocal();
      history.pushState('kktjs', '', location.href);
      return;
    }
    self.showLink = true;
    history.pushState('kktjs', '', location.href);
  });
}

/** 通知音をプリロードし、要素クリックで再生できるようにする。元 setNotifSound */
export function setNotifSound(_app: KktjsApp, elementId: string, url: string | null): void {
  if (url == null) return;
  const context = (window as any).__kktjsAudioContext as AudioContext;
  const request = new XMLHttpRequest();
  request.responseType = 'arraybuffer';
  request.open('GET', url, true);
  request.timeout = 15000;
  request.onreadystatechange = function () {
    if (request.readyState === XMLHttpRequest.DONE && (request.status === 0 || request.status === 200)) {
      context.decodeAudioData(request.response, function (buffer: AudioBuffer) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.addEventListener('click', function () {
          const src = context.createBufferSource();
          src.buffer = buffer;
          src.connect(context.destination);
          src.start(0);
        });
      });
    }
  };
  request.send('');
}

/** ウィンドウ幅からカラム数/モードを決定し再描画。元 resetColumn */
export function resetColumn(app: KktjsApp, width: number): void {
  const a = app as A;
  if (a.optColumnWide) return;
  if (width < 640) {
    a.optColumns = 1;
    a.optMode = true;
  } else if (width >= 1008) {
    a.optColumns = 3;
    a.optMode = false;
  } else {
    a.optColumns = 2;
    a.optMode = true;
  }
  a.runCustom();
}

/** 入力中のハッシュタグをストリーム対象に追加。元 addStreamHashtag */
export function addStreamHashtag(app: KktjsApp): void {
  const a = app as A;
  if (a.stream_hashtag_text != null && a.stream_hashtag_text !== '' && a.stream_hashtags.indexOf(a.stream_hashtag_text) === -1) {
    a.stream_hashtags.push(a.stream_hashtag_text);
  }
  (document.getElementById('hashtag_name_new') as HTMLInputElement).value = '';
  a.search_text = '';
  a.stream_hashtag_text = '';
}

/** ストリーム対象ハッシュタグを削除。元 removeStreamHashtag */
export function removeStreamHashtag(app: KktjsApp, tag: string): void {
  const a = app as A;
  const idx = a.stream_hashtags.indexOf(tag);
  if (idx !== -1) a.stream_hashtags.splice(idx, 1);
}

/** Service Worker に更新確認を依頼。元 serviceWorkerUpdateCheck */
export function serviceWorkerUpdateCheck(app: KktjsApp): void {
  const a = app as A;
  a.fetch_lock['update'] = true;
  navigator.serviceWorker.controller!.postMessage('check');
  setTimeout(function () {
    (window as any).app['$data']['fetch_lock']['update'] = false;
  }, 1500);
}

/** 強制リロード。元 reloadForce */
export function reloadForce(_app: KktjsApp): void {
  location.reload();
}

/** 全ストリームを強制再接続し、必要なら user/list を再取得。元 reopenForce */
export function reopenForce(app: KktjsApp): void {
  const a = app as A;
  a.reopenWsHome('Force');
  a.reopenWsLocal('Force');
  a.reopenWsMulti('Force');
  a.showHomeOption = false;
  a.showLocalOption = false;
  if (a.fetch_after['user']) a.fetchUser();
  if (a.fetch_after['lists']) a.fetchStreamList();
}

/** 確認モーダルを開く。元 confirm */
export function confirm(app: KktjsApp, issue: any, confirmType: unknown): void {
  const a = app as A;
  a.modal_issue = issue;
  a.modal_issue['confirm'] = '';
  a.modal_issue['confirmtype'] = confirmType;
  a.showConfirm = true;
}

/** フォローリクエスト数を取得。元 countFollowRequest */
export function countFollowRequest(app: KktjsApp): void {
  const a = app as A;
  a.fetch_watch['acct_profile_req'] = true;
  const url = fillEndpoint(FOLLOW_REQUEST, { I: a.repository, LM: LIMIT_USER });
  apiGet<any[]>(url, a.at, {
    onSuccess: (data) => {
      a.user_requesting_count = data.length;
      a.fetch_watch['acct_profile_req'] = false;
    },
    onError: (text, status) => {
      a.fetch_watch['acct_profile_req'] = false;
      a.popError(text, status, 'Account');
    },
  });
}
