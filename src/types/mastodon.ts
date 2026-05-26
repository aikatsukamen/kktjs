// Mastodon API のエンティティ型定義。
// 参考: https://docs.joinmastodon.org/entities/
// 必要なフィールドを中心に定義。難読化解読版での利用箇所に合わせて拡張可。

export type MediaType = 'image' | 'video' | 'gifv' | 'audio' | 'unknown';

export interface MediaAttachment {
  id: string;
  type: MediaType;
  url: string | null;
  preview_url: string | null;
  remote_url: string | null;
  description: string | null;
  blurhash?: string | null;
  // アプリ内部で付与する読み込み状態フラグ
  loading_avatar?: boolean;
  loading_media?: boolean;
}

export interface AccountField {
  name: string;
  value: string;
  verified_at: string | null;
}

export interface Account {
  id: string;
  username: string;
  acct: string;
  display_name: string;
  locked: boolean;
  bot?: boolean;
  note: string;
  url: string;
  avatar: string;
  avatar_static: string;
  header: string;
  header_static: string;
  followers_count: number;
  following_count: number;
  statuses_count: number;
  fields?: AccountField[];
  emojis?: CustomEmoji[];
}

export interface CustomEmoji {
  shortcode: string;
  url: string;
  static_url: string;
  visible_in_picker?: boolean;
}

export interface PollOption {
  title: string;
  votes_count: number | null;
}

export interface Poll {
  id: string;
  expires_at: string | null;
  expired: boolean;
  multiple: boolean;
  votes_count: number;
  voters_count: number | null;
  options: PollOption[];
  emojis: CustomEmoji[];
  voted?: boolean;
  own_votes?: number[];
}

export interface Card {
  url: string;
  title: string;
  description: string;
  type: 'link' | 'photo' | 'video' | 'rich';
  image: string | null;
}

export type Visibility = 'public' | 'unlisted' | 'private' | 'direct';

export interface Status {
  id: string;
  uri: string;
  url: string | null;
  created_at: string;
  account: Account;
  content: string;
  visibility: Visibility;
  sensitive: boolean;
  spoiler_text: string;
  media_attachments: MediaAttachment[];
  mentions: Array<{ id: string; username: string; url: string; acct: string }>;
  tags: Array<{ name: string; url: string }>;
  emojis: CustomEmoji[];
  reblogs_count: number;
  favourites_count: number;
  replies_count?: number;
  favourited?: boolean;
  reblogged?: boolean;
  bookmarked?: boolean;
  pinned?: boolean;
  in_reply_to_id: string | null;
  reblog: Status | null;
  poll: Poll | null;
  card: Card | null;
  // アプリ内部フラグ
  loading_avatar?: boolean;
  loading_media?: boolean;
  media_opened?: boolean;
  content_opened?: boolean;
  caught_katsufilter?: boolean;
}

export type NotificationType =
  | 'follow'
  | 'follow_request'
  | 'mention'
  | 'reblog'
  | 'favourite'
  | 'poll'
  | 'status'
  | 'update';

export interface MastodonNotification {
  id: string;
  type: NotificationType;
  created_at: string;
  account: Account;
  status?: Status;
}

export interface Relationship {
  id: string;
  following: boolean;
  followed_by: boolean;
  blocking: boolean;
  muting: boolean;
  requested: boolean;
}

export interface MastodonList {
  id: string;
  title: string;
}

// ストリーミングで届くイベント
export interface StreamEvent {
  event: 'update' | 'notification' | 'delete' | 'filters_changed' | string;
  payload: string;
}
