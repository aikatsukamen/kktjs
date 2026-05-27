// Vue のコンポーネント/ディレクティブ登録を集約したモジュール。
//
// Vue 3 移行に伴う変更（docs-dev/VUE3_MIGRATION.md 参照）:
//  - グローバル API 廃止: Vue.component/Vue.directive → アプリインスタンスの
//    app.component/app.directive。本関数は createApp が返したインスタンスを受け取る。
//  - ディレクティブのフック名変更: inserted → mounted（コンポーネントと統一）。
//    関数省略記法 Vue.directive('play', fn) は { mounted } へ明示化。
//
// 呼び出しタイミング: legacy/app-core.ts が Vue.createApp(...) した直後、
// mount('#app') する前に呼ぶ（app-core が制御）。各ディレクティブのフックは
// 実行時に window.app を参照する（登録時には app 未マウントでも可。これらの
// ディレクティブは条件付き描画される要素に付くため、発火時には window.app 設定済み）。

type El = HTMLElement & { play?: () => void; value?: string };

// SFC(.vue) 動作実証用コンポーネント（Vite + @vitejs/plugin-vue でコンパイルされる）。
// 既存の x-template モーダル群と併存できることを示す段階導入の出発点。
import VersionBadge from '../components/VersionBadge.vue';

// app: Vue.createApp(...) の戻り値（アプリケーションインスタンス）。
export function registerVueComponentsAndDirectives(app: any): void {
  // --- SFC コンポーネント（.vue。Vite ビルド時に plugin-vue がコンパイル） ---
  app.component('version-badge', VersionBadge);

  // --- コンポーネント（x-template を参照するモーダル類） ---
  app.component('media', { template: '#modal-media' });
  app.component('emojipicker', { template: '#modal-input' });
  app.component('confirm', { template: '#modal-confirm' });
  app.component('info', { template: '#modal-info' });

  // --- ディレクティブ（Vue 3: inserted → mounted）---
  // 動画要素を再生する（Vue 2 の関数省略記法を { mounted } へ明示化）。
  app.directive('play', {
    mounted: function (el: El) {
      el.play && el.play();
    },
  });

  // 挿入時にフォーカス。
  app.directive('focus', {
    mounted: function (el: El) {
      el.focus();
    },
  });

  // 下書き等の復元（挿入時に window.app の値を流し込む）。
  app.directive('restore-s', {
    mounted: function (el: El) {
      el.value = window.app.$data.katsu_spoiler_text;
      window.app.refreshCount();
    },
  });
  app.directive('restore-c', {
    mounted: function (el: El) {
      el.value = window.app.$data.katsu_content_text;
      window.app.refreshCount();
    },
  });
  app.directive('restore-kfr', {
    mounted: function (el: El) {
      el.value = window.app.$data.optKatsuFilterRaw;
    },
  });

  // 投票の各選択肢を復元。
  for (let i = 0; i < 4; i++) {
    app.directive('restore-vote' + i, {
      mounted: function (el: El) {
        const texts = window.app.$data.katsu.poll_work.texts;
        el.value = texts[i] != null ? texts[i] : '';
      },
    });
  }
}
