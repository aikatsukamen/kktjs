// 設定・トークンの削除（legacy から移行）。userConf は localStorage のラッパ。
// loadConf / saveConf / resetConf は optXxx の大量フィールド対応で純粋な代入の塊のため
// legacy に残置（型安全の利得が小さく、転記ミスのリスクのみが大きいため）。

import type { KktjsApp } from '../types/kktjs-app';

const userConf = localStorage;

/** 保存済みの表示設定を削除してリロード。元 deleteConf */
export function deleteConf(_app: KktjsApp): void {
  userConf.removeItem('columns');
  userConf.removeItem('mode');
  userConf.removeItem('ptl');
  userConf.removeItem('autoplay');
  userConf.removeItem('allnsfw');
  userConf.removeItem('conf_std');
  location.reload();
}

/** ログイン情報（トークン等）を削除してリロード。元 deleteToken */
export function deleteToken(_app: KktjsApp): void {
  userConf.removeItem('at');
  userConf.removeItem('work_user');
  location.reload();
}
