// タイムライン取得（Home / Local / Multi）。legacy から移行。
// Vue インスタンスへの依存は引数 `app` で受け取り、他メソッド
// （updateWrapperBM / updateFilterBM / popError 等。いずれも TS 化済み）は
// app 経由で呼ぶ（実体は register-methods 経由で解決される）。
// register-methods.ts で登録し、legacy 側の薄いスタブから委譲される。

import { HOME, LOCAL, GLOBAL, DIRECT, LIST, HASHTAG } from '../api/endpoints';
import { LIMIT } from '../core/constants';
import { apiGet } from '../api/client';
import type { KktjsApp } from '../types/kktjs-app';
import type { Status } from '../types/mastodon';

/** ホームタイムラインを取得して app.homes へ追記する（元 fetchHome） */
export function fetchHome(app: KktjsApp): void {
  app.fetch_lock.home = true;
  const url = HOME
    .replace('[I]', app.repository)
    .replace('[PID]', app.home_id)
    .replace('[LM]', String(LIMIT));

  apiGet<Status[]>(url, app.at, {
    onSuccess: (items) => {
      if (app.fetch_lock.home) {
        app.updateWrapperBM(items, 'home');
        app.updateFilterBM(items, 'home');
        if (app.homes.length === 0) {
          app.homes = items;
        } else {
          Array.prototype.push.apply(app.homes, items);
        }
        const last = app.homes[app.homes.length - 1];
        app.home_id = last ? last.id : '0';
        app.fetch_lock.home = false;
        app.fetch_comp.home = items.length < LIMIT;
        app.$forceUpdate();
      }
    },
    onError: (body, status) => {
      app.fetch_lock.home = false;
      app.popError(body, status, 'Home');
      app.$forceUpdate();
    },
  });
}

/** ローカル/グローバルタイムラインを取得して app.locals へ追記する（元 fetchLocal） */
export function fetchLocal(app: KktjsApp): void {
  const endpoint = app.local_type === 'Global' ? GLOBAL : LOCAL;
  app.fetch_lock.local = true;
  // フェッチ中に local_type が切り替わったら結果を破棄するためのガード。
  const requestedType = app.local_type;
  const url = endpoint
    .replace('[I]', app.repository)
    .replace('[PID]', app.local_id)
    .replace('[LM]', String(LIMIT));

  apiGet<Status[]>(url, app.at, {
    onSuccess: (items) => {
      if (requestedType === app.local_type && app.fetch_lock.local) {
        app.updateWrapperBM(items, 'local');
        app.updateFilterBM(items, 'local');
        if (app.locals.length === 0) {
          app.locals = items;
        } else {
          Array.prototype.push.apply(app.locals, items);
        }
        const last = app.locals[app.locals.length - 1];
        app.local_id = last ? last.id : '0';
        app.fetch_lock.local = false;
        app.fetch_comp.local = items.length < LIMIT;
        app.$forceUpdate();
      }
    },
    onError: (body, status) => {
      app.fetch_lock.local = false;
      app.popError(body, status, 'Local');
      app.$forceUpdate();
    },
  });
}

/** Multi（リスト/ハッシュタグ/ダイレクト）を取得して app.multis へ追記する（元 fetchMulti） */
export function fetchMulti(app: KktjsApp): void {
  let endpoint = DIRECT;
  if (app.multi_type === 'List') {
    endpoint = LIST.replace('[LID]', app.multi_target);
  } else if (app.multi_type === 'Hashtag') {
    endpoint = HASHTAG.replace('[TAG]', app.multi_target);
  }
  app.fetch_lock.multi = true;
  const requestedType = app.multi_type;
  const url = endpoint
    .replace('[I]', app.repository)
    .replace('[PID]', app.multi_id)
    .replace('[LM]', String(LIMIT));

  apiGet<any[]>(url, app.at, {
    onSuccess: (raw) => {
      if (requestedType === app.multi_type && app.fetch_lock.multi) {
        // Direct は conversation 形式なので last_status を取り出す。
        let items: Status[] = raw;
        if (requestedType === 'Direct') {
          items = raw.map((item: any) => item.last_status);
        }
        app.updateWrapperBM(items, 'multi');
        app.updateFilterBM(items, 'multi');
        if (app.multis.length === 0) {
          app.multis = items;
        } else {
          Array.prototype.push.apply(app.multis, items);
        }
        const last = app.multis[app.multis.length - 1];
        app.multi_id = last ? last.id : '0';
        app.fetch_lock.multi = false;
        app.fetch_comp.multi = items.length < LIMIT;
        app.$forceUpdate();
      }
    },
    onError: (body, status) => {
      app.fetch_lock.multi = false;
      app.popError(body, status, 'Multi');
      app.$forceUpdate();
    },
  });
}
