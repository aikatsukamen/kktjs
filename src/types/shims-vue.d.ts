// .vue（単一ファイルコンポーネント）の ambient 型宣言。
// これがないと `import X from './X.vue'` が型解決できない。
// SFC を段階導入するための最小シム（型は any 互換。厳密化したい場合は vue-tsc に委ねる）。

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
  export default component;
}
