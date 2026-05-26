// Vue のコンポーネント/ディレクティブ登録を集約したモジュール。
//
// これらは元々 legacy/app-core.js に散在していたが、Vue 3 移行時に最も影響を受ける
// 箇所（グローバル API 廃止・ディレクティブのフック名変更など。docs-dev/VUE3_MIGRATION.md
// 参照）なので、1 ファイルに隔離して将来の差し替えを容易にする。
//
// 重要: Vue 2 では new Vue より前にグローバル登録する必要がある。本モジュールは
// legacy/app-core.js が new Vue を実行するより前に import されること（main.ts が制御）。
// 各ディレクティブのフックは実行時に window.app を参照する（定義時には app 未生成でも可）。

import Vue from 'vue'; // build.mjs により window.Vue へ解決される

type El = HTMLElement & { play?: () => void; value?: string };

export function registerVueComponentsAndDirectives(): void {
  const V = Vue as any;

  // --- コンポーネント（x-template を参照するモーダル類） ---
  V.component('media', { template: '#modal-media' });
  V.component('emojipicker', { template: '#modal-input' });
  V.component('confirm', { template: '#modal-confirm' });
  V.component('info', { template: '#modal-info' });

  // --- ディレクティブ ---
  // 動画要素を再生する。
  V.directive('play', function (el: El) {
    el.play && el.play();
  });

  // 挿入時にフォーカス。
  V.directive('focus', {
    inserted: function (el: El) {
      el.focus();
    },
  });

  // 下書き等の復元（挿入時に window.app の値を流し込む）。
  V.directive('restore-s', {
    inserted: function (el: El) {
      el.value = window.app._data.katsu_spoiler_text;
      window.app.refreshCount();
    },
  });
  V.directive('restore-c', {
    inserted: function (el: El) {
      el.value = window.app._data.katsu_content_text;
      window.app.refreshCount();
    },
  });
  V.directive('restore-kfr', {
    inserted: function (el: El) {
      el.value = window.app._data.optKatsuFilterRaw;
    },
  });

  // 投票の各選択肢を復元。
  for (let i = 0; i < 4; i++) {
    V.directive('restore-vote' + i, {
      inserted: function (el: El) {
        const texts = window.app._data.katsu.poll_work.texts;
        el.value = texts[i] != null ? texts[i] : '';
      },
    });
  }
}
