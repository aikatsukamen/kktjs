// 認証付き XHR の薄いヘルパー。legacy の各 fetch* が同じ XHR 定型を持つため、
// 移行時の共通化に使う。元コードと同じく XMLHttpRequest ベース・Bearer 認証。

import { REQ_TIMEOUT } from '../core/constants';

export interface ApiGetCallbacks<T> {
  /** status 200 で JSON パース成功時。第2引数で Link ヘッダ等を取得できる。 */
  onSuccess: (data: T, getHeader: (name: string) => string | null) => void;
  /** DONE かつ 200 以外（エラー）時 */
  onError: (responseText: string, status: number) => void;
}

/** 認証付き GET を実行し、結果をコールバックへ渡す。 */
export function apiGet<T = unknown>(
  url: string,
  token: string | null,
  cb: ApiGetCallbacks<T>
): void {
  const request = new XMLHttpRequest();
  request.open('GET', url);
  request.timeout = REQ_TIMEOUT;
  request.setRequestHeader('Authorization', 'Bearer ' + token);
  request.onreadystatechange = function () {
    if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
      cb.onSuccess(
        JSON.parse(request.responseText) as T,
        (name: string) => request.getResponseHeader(name)
      );
    } else if (request.readyState === XMLHttpRequest.DONE) {
      cb.onError(request.responseText, request.status);
    }
  };
  request.send();
}

/** Mastodon の Link ヘッダから max_id を抽出する。無ければ '0'。 */
export function parseMaxId(linkHeader: string | null): string {
  if (linkHeader == null) return '0';
  const matched = linkHeader.match(/max_id=(.*?)>/);
  return matched != null && matched[1].length !== 0 ? matched[1] : '0';
}

export interface ApiSendCallbacks<T> {
  onSuccess: (data: T, getHeader: (name: string) => string | null) => void;
  onError: (responseText: string, status: number) => void;
  /** 成功/失敗を問わず DONE 時に必ず実行（フラグ解除等）。 */
  onSettled?: () => void;
}

/**
 * 認証付きで本文付きリクエスト（POST/PUT/DELETE）を送る。
 * 既定は application/x-www-form-urlencoded。json=true で application/json 送信。
 */
export function apiSend<T = unknown>(
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  token: string | null,
  body: Record<string, unknown> | string | null,
  cb: ApiSendCallbacks<T>,
  opts?: { json?: boolean }
): void {
  const json = opts?.json === true;
  const request = new XMLHttpRequest();
  request.open(method, url, true);
  request.timeout = REQ_TIMEOUT;
  request.setRequestHeader('Authorization', 'Bearer ' + token);
  request.setRequestHeader(
    'Content-type',
    json ? 'application/json' : 'application/x-www-form-urlencoded'
  );
  request.onreadystatechange = function () {
    if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
      let data: T = undefined as any;
      try {
        data = request.responseText ? (JSON.parse(request.responseText) as T) : (undefined as any);
      } catch {
        data = undefined as any;
      }
      cb.onSuccess(data, (name) => request.getResponseHeader(name));
    } else if (request.readyState === XMLHttpRequest.DONE) {
      cb.onError(request.responseText, request.status);
    }
    if (request.readyState === XMLHttpRequest.DONE && cb.onSettled) {
      cb.onSettled();
    }
  };
  let payload: string | null;
  if (body == null) {
    payload = null;
  } else if (typeof body === 'string') {
    payload = body;
  } else if (json) {
    payload = JSON.stringify(body);
  } else {
    payload = encodeFormBody(body);
  }
  request.send(payload as any);
}

/** オブジェクトを x-www-form-urlencoded 文字列へ（utils.encodeHtmlForm 相当）。 */
function encodeFormBody(data: Record<string, unknown>): string {
  const pairs: string[] = [];
  for (const key in data) {
    pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(data[key])));
  }
  return pairs.join('&').replace(/%20/g, '+');
}
