// 汎用ユーティリティ。難読化解読版 main_body.js 末尾の関数群を可読化・型付けした。
// 一部は index.html の inline ハンドラ（onkeyup/oninput 等）から呼ばれるため、
// register-globals.ts で window に公開する。

import type { CustomEmoji } from '../types/mastodon';

/** URL クエリパラメータを取得（元 getParameterByName） */
export function getParameterByName(name: string, url?: string): string | null {
  if (!url) url = window.location.href;
  const regex = new RegExp('[?&]' + name.replace(/[[\]]/g, '\\$&') + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/** dataURL(base64) を Blob に変換（元 base64ToBlob、JPEG固定） */
export function base64ToBlob(b64str: string): Blob {
  const byteString = window.atob(b64str.split(',')[1]);
  const bytes = new Uint8Array(new ArrayBuffer(byteString.length));
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'image/jpeg' });
}

/** HTML エスケープ（元 escapeHtml） */
export function escapeHtml(htmlStr: unknown): unknown {
  if (typeof htmlStr !== 'string') return htmlStr;
  const map: Record<string, string> = {
    '&': '&amp;',
    "'": '&#x27;',
    '`': '&#x60;',
    '"': '&quot;',
    '<': '&lt;',
    '>': '&gt;',
  };
  return htmlStr.replace(/[&'`"<>]/g, (s) => map[s]);
}

/** カスタム絵文字のショートコードを <img> へ置換（元 patchEmoji） */
export function patchEmoji(text: string, emojis: CustomEmoji[] | null | undefined): string {
  let result = text;
  if (emojis != null && emojis.length !== 0) {
    emojis.forEach((emoji) => {
      result = result
        .split(':' + emoji.shortcode + ':')
        .join(
          '<img class="emojione" title=":' + emoji.shortcode + ':" src="' + emoji.static_url + '">'
        );
    });
  }
  return result;
}

/** オブジェクトを application/x-www-form-urlencoded 文字列へ（元 encodeHtmlForm） */
export function encodeHtmlForm(data: Record<string, unknown>): string {
  const pairs: string[] = [];
  for (const key in data) {
    pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(data[key])));
  }
  return pairs.join('&').replace(/%20/g, '+');
}

/** システム通知を表示（元 popNotif） */
export function popNotif(title: string, options: NotificationOptions): void {
  if (!('Notification' in window)) {
    console.log('このブラウザはシステム通知をサポートしていません');
  } else if (Notification.permission === 'granted') {
    new Notification(title, options);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') new Notification(title, options);
    });
  }
}

/** textarea の高さを内容に合わせて自動調整（元 autogrow、inline onkeyup から使用） */
export function autogrow(el: HTMLTextAreaElement): void {
  el.style.height = '5px';
  el.style.height = el.scrollHeight + 4 + 'px';
  if (window.app && typeof window.app.refreshCount === 'function') {
    window.app.refreshCount();
  }
}

// --- 以下、inline ハンドラから app の data を更新する小関数（元 inputXxx） ---

export function inputVote(el: HTMLInputElement, index: number): void {
  window.app._data.katsu.poll_work.texts[index] = el.value;
}

export function inputSearch(el: HTMLInputElement): void {
  window.app._data.search_text = el.value;
}

export function inputList(el: HTMLInputElement): void {
  window.app._data.stream_list_text = el.value;
  window.app.checkStreamListText();
}

export function inputListProfile(el: HTMLInputElement): void {
  window.app._data.listprofile.name = el.value;
  window.app.checkListProfile();
}

export function inputKatsuFilterRaw(el: HTMLInputElement): void {
  const d = window.app._data;
  if (d.result_text_tmp !== '') {
    d.result_text_tmp = '';
    d.error_cnt = 0;
  }
  d.optKatsuFilterRaw = el.value;
}
