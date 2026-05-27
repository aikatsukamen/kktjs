// 投稿エディタの本文⇄下書き変換（legacy から移行）。いずれも DOM とエディタ状態の
// 自己完結した変換。複雑な posting フォーム全体に絡む katsuToDraft/draftToKatsu は
// legacy に残置（actKatsu と同じく相互依存が強いため）。

import type { KktjsApp } from '../types/kktjs-app';

/** スポイラーと本文の入れ替え。元 contentExchange */
export function contentExchange(app: KktjsApp): void {
  const spoiler = document.getElementById('katsu_spoiler') as HTMLInputElement | null;
  const content = document.getElementById('katsu_content') as HTMLTextAreaElement | null;
  if (!spoiler || !content) return;
  const a = app as any;
  a.katsu_spoiler_text_bu = spoiler.value;
  a.katsu_spoiler_text = content.value;
  a.katsu_content_text = a.katsu_spoiler_text_bu;
  spoiler.value = a.katsu_spoiler_text;
  content.value = a.katsu_content_text;
}

/** 本文を下書きへ退避して本文をクリア。元 contentToDraft */
export function contentToDraft(app: KktjsApp): void {
  const content = document.getElementById('katsu_content') as HTMLTextAreaElement | null;
  if (!content) return;
  const a = app as any;
  a.content_text_drafts.unshift(content.value);
  a.katsu_content_text = '';
  content.value = a.katsu_content_text;
}

/**
 * 下書きを本文へ反映。元 draftToContent。
 * replace=true: 本文を下書きで置き換え、その下書きを削除。
 * replace=false: カーソル位置に下書きを挿入。
 */
export function draftToContent(app: KktjsApp, index: number, replace?: boolean): void {
  const content = document.getElementById('katsu_content') as HTMLTextAreaElement | null;
  if (!content) return;
  const a = app as any;
  if (replace) {
    a.katsu_content_text = a.content_text_drafts[index];
    content.value = a.katsu_content_text;
    a.content_text_drafts.splice(index, 1);
    return;
  }
  const before = content.value.substr(0, content.selectionStart || 0);
  const after = content.value.substr(content.selectionStart || 0, content.value.length);
  a.katsu_content_text = before + a.content_text_drafts[index] + after;
  content.value = a.katsu_content_text;
  (app as any).refreshCount();
}
