// Vue インスタンス（app）のインターフェース。
// legacy から移行するメソッドが受け取る `app` の型。data 項目は 168 個あるため、
// よく参照されるものを明示し、残りはインデックスシグネチャで許容する。
// 移行が進むにつれてここを正式な型へ拡張していく。

import type {
  Status,
  Account,
  MastodonNotification,
  MastodonList,
  MediaAttachment,
  Relationship,
} from './mastodon';
import type { FetchLock, ConnState, NotifUnreadFilter, SwStat } from './app';

export interface KktjsApp {
  // 接続・認証
  repository: string;
  at: string | null;
  connHome: ConnState;
  connLocal: ConnState;
  connMulti: ConnState;
  connDiscord: ConnState;

  // タイムライン: Home
  homes: Status[];
  home_id: string;
  home_type: string;
  home_unread: number;
  home_posy: number;

  // Local
  locals: Status[];
  local_id: string;
  local_type: string;
  local_unread: number;

  // Notification
  notifs: MastodonNotification[];
  notifs_filter: MastodonNotification[];
  notif_id: string;
  notif_type: string;
  notif_unread: number;
  notif_unread_filter: NotifUnreadFilter;

  // Multi（リスト/ハッシュタグ/ダイレクト）
  multis: Status[];
  multi_id: string;
  multi_type: string;
  multi_target: string;
  multi_name: string;
  multi_unread: number;

  // アカウント
  user: Account | Account[] | { id?: string; length?: number };
  acct: Account | Account[] | unknown;
  accts: Status[];
  accts_users: Account[];
  accts_users_relation: Relationship[];
  acct_targetid: string;
  acct_id: string;
  acct_type: string;
  acct_relation: Relationship | null;
  acct_pinned: Status[];
  user_requesting_count: number;
  fetch_watch: Record<string, boolean>;

  // 詳細
  detail: Status | null;
  detail_targetid: string;
  detail_fav: Account[];
  detail_reblog: Account[];
  detail_chain: { ancestors: Status[]; descendants: Status[] } | unknown;

  // 検索
  searchs: { hashtags: unknown; accounts_ex: unknown; [k: string]: unknown };
  search_text: string;
  search_type: string;
  search_userid: string;
  search_hashtag: string;

  // リスト
  stream_list: unknown[];
  stream_lists: MastodonList[];
  stream_list_users: Account[];

  // 状態・ロック
  fetch_lock: FetchLock;
  fetch_comp: Record<string, boolean>;
  fetch_after: Record<string, boolean>;
  action_lock: string;
  result_text: string;
  result_type: string;
  result_lock: boolean;
  error_cnt: number;

  // 表示状態
  showMedia: boolean;
  modal_media: MediaAttachment | string;

  // ---- メソッド（移行済み/未移行を問わず呼び出せるよう緩く宣言） ----
  updateWrapperBM(list: Status[], kind: string): void;
  updateFilterBM(list: Status[], kind: string): void;
  popError(body: string, status: number, label: string): void;
  $forceUpdate(): void;
  $nextTick(cb: () => void): void;

  // それ以外のデータ項目・メソッドを許容（段階移行のため）。
  [key: string]: unknown;
}
