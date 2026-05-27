<!--
  components/VersionBadge.vue — SFC(.vue) 動作実証用コンポーネント。

  目的: Vite + @vitejs/plugin-vue による SFC ビルドパイプラインが本番でも機能することを
  示す最小例。アプリのバージョン文字列を小さなバッジで表示する（既存 UI を壊さない）。
  既存の x-template モーダル群はそのまま温存しつつ、今後の画面を段階的に SFC 化していく
  際の出発点。app.component('version-badge', VersionBadge) で登録する（vue-setup.ts）。

  注: テンプレートは props の version をそのまま表示するだけ。スタイルは scoped。
-->
<template>
  <span class="kktjs-version-badge" :title="title">{{ label }}</span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'VersionBadge',
  props: {
    version: { type: String, default: '' },
    prefix: { type: String, default: 'v' },
  },
  computed: {
    label(): string {
      return this.version ? this.prefix + this.version : '';
    },
    title(): string {
      return 'kktjs ' + (this.version || '');
    },
  },
});
</script>

<style scoped>
.kktjs-version-badge {
  font-size: 11px;
  opacity: 0.7;
  letter-spacing: 0.02em;
}
</style>
