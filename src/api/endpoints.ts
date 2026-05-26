// Mastodon / Discord の API エンドポイントテンプレート。
// プレースホルダ: [I]=インスタンス, [PID]=max_id, [LM]=limit, [AID]/[UID]=アカウントID,
// [SID]=ステータスID, [TAG]=ハッシュタグ, [LID]=リストID, [STR]=検索語, [FL]=following, [VID]=投票ID

// 認証
export const TOKEN = 'https://[I]/oauth/token';
export const AUTH_URL =
  'https://[I]/oauth/authorize?client_id=[CID]&response_type=code&redirect_uri=[URL]&scope=read%20write%20follow';
export const CLIENT = 'https://[I]/api/v1/apps';
export const USER = 'https://[I]/api/v1/accounts/verify_credentials';
export const PROFILE = 'https://[I]/api/v1/accounts/update_credentials';

// タイムライン
export const HOME = 'https://[I]/api/v1/timelines/home?max_id=[PID]&limit=[LM]&';
export const LOCAL = 'https://[I]/api/v1/timelines/public?local=true&max_id=[PID]&limit=[LM]&';
export const GLOBAL = 'https://[I]/api/v1/timelines/public?max_id=[PID]&limit=[LM]&';
export const DIRECT = 'https://kirakiratter.com/api/v1/conversations';
export const NOTIF = 'https://[I]/api/v1/notifications?max_id=[PID]&limit=[LM]&';
export const HASHTAG = 'https://[I]/api/v1/timelines/tag/[TAG]?max_id=[PID]&limit=[LM]&';
export const LIST = 'https://[I]/api/v1/timelines/list/[LID]?max_id=[PID]&limit=[LM]&';

// 検索
export const SEARCH = 'https://[I]/api/v2/search?q=[STR]&resolve=true';
export const ACCT_SEARCH = 'https://[I]/api/v1/accounts/search?q=[STR]&following=[FL]&limit=[LM]&';

// ストリーミング(WebSocket)
export const ST_HOME = 'wss://[I]/api/v1/streaming?access_token=[AT]&stream=user';
export const ST_LOCAL = 'wss://[I]/api/v1/streaming?access_token=[AT]&stream=public:local';
export const ST_GLOBAL = 'wss://[I]/api/v1/streaming?access_token=[AT]&stream=public';
export const ST_DIRECT = 'wss://[I]/api/v1/streaming?access_token=[AT]&stream=direct';
export const ST_HASHTAG = 'wss://[I]/api/v1/streaming?access_token=[AT]&stream=hashtag&tag=[TAG]';
export const ST_LIST = 'wss://[I]/api/v1/streaming?access_token=[AT]&stream=list&list=[LID]';

// 投稿・メディア
export const KATSU = 'https://[I]/api/v1/statuses';
export const KATSU_MEDIA = 'https://[I]/api/v1/media';

// アカウント
export const ACCT = 'https://[I]/api/v1/accounts/[AID]/statuses?max_id=[PID]&limit=[LM]&';
export const MEDIA = 'https://[I]/api/v1/accounts/[AID]/statuses?max_id=[PID]&limit=[LM]&only_media=1&';
export const PINNED = 'https://[I]/api/v1/accounts/[AID]/statuses?pinned=true';
export const FOLLOW = 'https://[I]/api/v1/accounts/[AID]/following?max_id=[UID]&limit=[LM]';
export const FOLLOWER = 'https://[I]/api/v1/accounts/[AID]/followers?max_id=[UID]&limit=[LM]';
export const ACCT_OBJ = 'https://[I]/api/v1/accounts/[AID]';
export const ACCT_RELATION = 'https://[I]/api/v1/accounts/relationships?id=[AID]';
export const RELATION = 'https://[I]/api/v1/accounts/relationships?';

// 一覧系
export const FAVO = 'https://[I]/api/v1/favourites?limit=[LM]&max_id=[PID]&';
export const MUTE = 'https://[I]/api/v1/mutes?max_id=[UID]&limit=[LM]';
export const BLOCK = 'https://[I]/api/v1/blocks?max_id=[UID]&limit=[LM]';
export const REPORT = 'https://[I]/api/v1/reports';
export const FOLLOW_REQUEST = 'https://[I]/api/v1/follow_requests?limit=[LM]';
export const FOLLOW_AUTH = 'https://[I]/api/v1/follow_requests/[AID]/authorize';
export const FOLLOW_REJECT = 'https://[I]/api/v1/follow_requests/[AID]/reject';
export const LIST_ALL = 'https://[I]/api/v1/lists';
export const LIST_OBJ = 'https://[I]/api/v1/lists/[LID]';
export const LIST_ACCT = 'https://[I]/api/v1/lists/[LID]/accounts?limit=0';
export const VOTE = 'https://[I]/api/v1/polls/[VID]/votes';

// 詳細・アクション
export const DETAIL = 'https://[I]/api/v1/statuses/[SID]';
export const DETAIL_CHAIN = 'https://[I]/api/v1/statuses/[SID]/context';
export const DETAIL_FAV = 'https://[I]/api/v1/statuses/[SID]/favourited_by?limit=[LM]';
export const DETAIL_REBLOG = 'https://[I]/api/v1/statuses/[SID]/reblogged_by?limit=[LM]';
export const ACT_FAV = 'https://[I]/api/v1/statuses/[SID]/favourite';
export const ACT_UNFAV = 'https://[I]/api/v1/statuses/[SID]/unfavourite';
export const ACT_REBLOG = 'https://[I]/api/v1/statuses/[SID]/reblog';
export const ACT_UNREBLOG = 'https://[I]/api/v1/statuses/[SID]/unreblog';
export const ACT_PIN = 'https://[I]/api/v1/statuses/[SID]/pin';
export const ACT_UNPIN = 'https://[I]/api/v1/statuses/[SID]/unpin';
export const ACT_FOLLOW = 'https://[I]/api/v1/accounts/[AID]/follow';
export const ACT_UNFOLLOW = 'https://[I]/api/v1/accounts/[AID]/unfollow';
export const ACT_MUTE = 'https://[I]/api/v1/accounts/[AID]/mute';
export const ACT_UNMUTE = 'https://[I]/api/v1/accounts/[AID]/unmute';
export const ACT_BLOCK = 'https://[I]/api/v1/accounts/[AID]/block';
export const ACT_UNBLOCK = 'https://[I]/api/v1/accounts/[AID]/unblock';

// エンドポイントのプレースホルダを置換するヘルパー。
export type EndpointParams = Partial<{
  I: string; CID: string; URL: string; AT: string;
  PID: string; LM: string | number; UID: string;
  AID: string; SID: string; TAG: string; LID: string;
  STR: string; FL: string | boolean; VID: string;
}>;

export function fillEndpoint(template: string, params: EndpointParams): string {
  let url = template;
  for (const [key, value] of Object.entries(params)) {
    url = url.split(`[${key}]`).join(String(value));
  }
  return url;
}
