// =============================================================================
// kktjs エントリポイント
//
// 役割:
//  1. legacy/app-core を読み込んでアプリ本体（Vueインスタンス app）を起動する。
//     ※ app-core はトップレベルで `Vue.createApp(...).mount('#app')` を実行し、
//        mount の戻り値（公開インスタンス）を window.app へ公開する。
//  2. 型付きで切り出し済みの機能を初期化・公開する。
//  3. index.html の inline ハンドラ/テンプレートから参照される関数を window へ。
//
// メソッドの TS 移行は完了済み（全 257 件）。legacy/app-core.ts には Vue ハーネス
// （data/created/watch/computed）、共有 kktjs* 関数、モジュールグローバル、window
// ブリッジのみが残る。各メソッドは window.__kktjsMethods へ委譲する薄いスタブ。
// =============================================================================

// (0) 移行済みメソッドを登録する。legacy の created() が初期化中に呼ぶため、
//     必ず legacy より前に実行する（このモジュールが import 時に登録する）。
import './core/register-methods';

// (1) アプリ本体（副作用で window.app を生成）。レジストリ登録の後に読み込む。
// 型定義 types/globals.d.ts は tsconfig の include で自動的に拾われる。
import './legacy/app-core';

// (2) 型付きで切り出した機能
import { initViewportHeight } from './features/viewport-height';
import { initResumeReconnect } from './features/resume-reconnect';

// (3) inline ハンドラ用ユーティリティ
import {
  autogrow,
  inputVote,
  inputSearch,
  inputList,
  inputListProfile,
  inputKatsuFilterRaw,
} from './core/utils';
import { asset, getBasePath, getAppOrigin } from './core/base-path';

// 移行済みメソッドは core/register-methods.ts で登録済み（legacy のスタブが委譲）。

// --- 機能の初期化 ---
initViewportHeight();
initResumeReconnect();

// --- window への公開 ---
// inline ハンドラ（onkeyup/oninput 等）から呼ばれる関数群
Object.assign(window, {
  autogrow,
  inputVote,
  inputSearch,
  inputList,
  inputListProfile,
  inputKatsuFilterRaw,
});

// 配信場所に依存しない資産URL解決ヘルパー（legacy や将来コードからも使える）。
Object.assign(window, {
  kktjsAsset: asset,
  kktjsBasePath: getBasePath,
  kktjsAppOrigin: getAppOrigin,
});
