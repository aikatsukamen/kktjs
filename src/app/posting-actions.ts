// 投稿・メディア・投票・プロフィール系（legacy から機械変換で移行）。
import type { KktjsApp } from '../types/kktjs-app';
import { encodeHtmlForm, base64ToBlob } from '../core/utils';
import { KATSU_MEDIA, KATSU, MEDIA, VOTE, REPORT, PROFILE, SEARCH, HOME, LIST_OBJ } from '../api/endpoints';
import { asset } from '../core/base-path';
import { IMG_DUMMY_REL, REQ_TIMEOUT, LIMIT } from '../core/constants';
declare const app: any;
// メディア関連の静的定数（legacy と同値）。
const LIMIT_IMGFILE = 0x800000;
const LIMIT_MOVFILE = 0x2800000;
const LIMIT_ACCTNAME = 0x1e;
const LIMIT_LISTNAME = 0x12c;
const LIMIT_POLLOPTION = 0x19;
const IMAGE_MAXLEN = 0x500;
const IMAGE_MAXPIXEL = 0x500 * 0x500;
// メディア処理中の進行メッセージ（処理完了時に自動で消すため定数化して判定に使う）。
const MEDIA_PROGRESS_MSGS = [
  '[Media] 画像を読み込んでいます…',
  '[Media] 画像を縮小しています…',
  '[Media] HEIC → JPEG に変換しています…',
];
type A = any;

export function checkStreamHashtag(app: KktjsApp): void {
  const a = app as A;
            a.stream_hashtag_text = '';
            var _0x190cc4 = a;
            var _0x121dfd: any = [];
            var _0x68ba5e: any = [];
            _0x190cc4.fetch_lock.search_hashtag = true;
            // fetch_lock は $data のネストプロパティ。同期変更は reactivity で反映（検証済み）。
            var request = new XMLHttpRequest();
            request.open('GET', SEARCH.replace('[I]', _0x190cc4.repository).replace("[STR]", _0x190cc4.search_text));
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x190cc4.at);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    if (_0x190cc4.fetch_lock.search_hashtag) {
                        _0x68ba5e = JSON.parse(request.responseText);
                        if (null != _0x68ba5e.hashtags[0] && _0x68ba5e.hashtags[0].name.toLowerCase() == _0x190cc4.search_text.toLowerCase()) {
                            _0x190cc4.stream_hashtag_text = _0x190cc4.search_text;
                        }
                    }
                    _0x190cc4.fetch_lock.search_hashtag = false;
                    _0x190cc4['$forceUpdate']();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x190cc4.fetch_lock.search_hashtag = false;
                    _0x190cc4.popError(request.responseText, request.status, "Search");
                    _0x190cc4['$forceUpdate']();
                }
            }
                ;
            request.send();
}

export function actVote(app: KktjsApp, arg0: any, arg1: any): void {
  const a = app as A;
            if (true !== arg1) {
                a.confirm(arg0, "vote");
                return;
            }
            if (null == arg0.poll.choices) {
                arg0.poll.choices = [false, false, false, false];
            }
            var _0x4d82dd = new Array();
            arg0.poll.choices.forEach(function (arg1, _0x3534fb) {
                if (arg1) {
                    _0x4d82dd.push(_0x3534fb + '');
                }
            });
            arg0.req_vote = true;
            // arg0 は proxy。req_vote の同期変更は reactivity で反映（検証済み）。
            var _0xbfd9d2 = a;
            var _0x5c7866: any = [];
            var _0xf0ed26 = {
                'choices': _0x4d82dd
            };
            var request = new XMLHttpRequest();
            request.open('POST', VOTE.replace('[I]', _0xbfd9d2.repository).replace("[VID]", arg0.poll.id), true);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0xbfd9d2.at);
            request.setRequestHeader("Content-type", "application/json");
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0xbfd9d2.poll = JSON.parse(request.responseText);
                    _0xbfd9d2.updateVote(arg0.id, _0xbfd9d2.poll);
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0xbfd9d2.popError(request.responseText, request.status, "Vote");
                }
                arg0.req_vote = false;
                _0xbfd9d2['$forceUpdate']();
            }
                ;
            request.send(JSON.stringify(_0xf0ed26));
}

export function setVote(app: KktjsApp, arg0: any, arg1: any): void {
  const a = app as A;
            if (null == arg0.poll.choices || !arg0.poll.multiple) {
                arg0.poll.choices = [false, false, false, false];
            }
            arg0.poll.choices[arg1] = !arg0.poll.choices[arg1];
            a.$forceUpdate();
}

export function actReport(app: KktjsApp, arg0: any, arg1: any): void {
  const a = app as A;
            if (true !== arg1) {
                a.confirm(arg0, "report");
                return;
            }
            arg0.req_report = true;
            a.showConfirm = false;
            // arg0 は proxy、showConfirm は $data。いずれも reactive なので同期 forceUpdate 不要（検証済み）。
            var _0x27e7e7 = a;
            var _0x518e9f: any = [];
            var _0x5c7d23 = {
                'account_id': arg0.account.id,
                'status_ids': arg0.id,
                'comment': null == document.getElementById("report_text") ? '' : (document.getElementById("report_text") as HTMLInputElement).value
            };
            var request = new XMLHttpRequest();
            request.open('POST', REPORT.replace('[I]', _0x27e7e7.repository).replace("[SID]", arg0.id), true);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x27e7e7.at);
            request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) { } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x27e7e7.popError(request.responseText, request.status, "Report");
                }
                arg0.req_report = false;
                _0x27e7e7['$forceUpdate']();
            }
                ;
            request.send(encodeHtmlForm(_0x5c7d23));
}

export function actProfile(app: KktjsApp): void {
  const a = app as A;
            var _0x1d79b3 = a.profile.name;
            if (a.profile.name_b != null && a.profile.name_b.length > 0) {
                _0x1d79b3 = _0x1d79b3 + '‮' + a.profile.name_b + '‭';
            }
            if (_0x1d79b3.length > LIMIT_ACCTNAME) {
                a.result_text = "[Profile] 名前は30文字以内に設定してね。";
                return;
            }
            var _0x5b02aa = a;
            var _0x4b295e: any = [];
            var _0xc2b230 = {
                'display_name': _0x1d79b3
            };
            _0x5b02aa.acct.req_profile = true;
            // proxy への同期変更。reactivity で反映（検証済み）。XHR コールバック内の forceUpdate は残す。
            var request = new XMLHttpRequest();
            request.open("PATCH", PROFILE.replace('[I]', _0x5b02aa.repository), true);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer\x20' + _0x5b02aa.at);
            request.setRequestHeader("Content-type", 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x5b02aa.runAcct(_0x5b02aa.user.id);
                    _0x5b02aa.fetchUser();
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x5b02aa.popError(request.responseText, request.status, "Profile");
                }
                _0x5b02aa.acct.req_profile = false;
                _0x5b02aa.profile = [];
                _0x5b02aa.showAcctEdit = false;
                _0x5b02aa['$forceUpdate']();
            }
                ;
            request.send(encodeHtmlForm(_0xc2b230));
}

export function actListProfile(app: KktjsApp): void {
  const a = app as A;
            var _0x482c96 = a.listprofile.name;
            if (_0x482c96.length > LIMIT_LISTNAME) {
                a.result_text = "[Profile] リストの名前は300文字以内に設定してね。";
                return;
            }
            var _0x5445e0 = a;
            var _0x293d27: any = [];
            var _0x13f7a7 = {
                'title': _0x482c96
            };
            _0x5445e0.stream_list.req_profile = true;
            // proxy への同期変更。reactivity で反映（検証済み）。XHR コールバック内の forceUpdate は残す。
            var request = new XMLHttpRequest();
            request.open('PUT', LIST_OBJ.replace('[I]', _0x5445e0.repository).replace('[LID]', _0x5445e0.stream_list.id), true);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x5445e0.at);
            request.setRequestHeader("Content-type", 'application/x-www-form-urlencoded');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x5445e0.stream_list = JSON.parse(request.responseText);
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x5445e0.popError(request.responseText, request.status, "Profile");
                }
                _0x5445e0.stream_list.req_profile = false;
                _0x5445e0.showStreamEdit = false;
                _0x5445e0.listprofile.name = _0x5445e0.stream_list.title;
                _0x5445e0['$forceUpdate']();
            }
                ;
            request.send(encodeHtmlForm(_0x13f7a7));
}

// HEIC/HEIF を JPEG File に変換する（heic2any を動的 import）。
// 変換に失敗した場合は元 File をそのまま返す（呼び出し側で UnSupport Media になる挙動を維持）。
// File.type が空のことがある iOS Safari ケースに備え、拡張子でも判定する。
async function maybeConvertHeic(file: File): Promise<File> {
  const lowerName = (file.name || '').toLowerCase();
  const isHeic = /^image\/hei[fc]/.test(file.type) || /\.heic$|\.heif$/.test(lowerName);
  if (!isHeic) return file;
  try {
    // 動的 import: 通常ロード時はバンドルに含まれない（HEIC を選んだ瞬間に取得される）。
    const mod: any = await import('heic2any');
    const heic2any = mod.default || mod;
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    // HEIC sequence の場合は配列で返る。先頭フレームのみ採用。
    const blob: Blob = Array.isArray(out) ? out[0] : out;
    // ファイル名の拡張子を .jpg に置換（FormData の filename に使われる）。
    const newName = file.name ? file.name.replace(/\.(heic|heif)$/i, '.jpg') : 'image.jpg';
    return new File([blob], newName, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch (e) {
    // 変換失敗（破損 HEIC、メモリ不足等）。元 File を返して既存の UnSupport Media フローに任せる。
    return file;
  }
}

export function checkActMedia(app: KktjsApp, arg0: any): void {
  const a = app as A;
  const m = (window as any).__kktjsMedia;
            const inputFile: File = arg0[0];
            (document.getElementById("uploader") as HTMLInputElement).value = null as any;
            // HEIC/HEIF は最初に JPEG へ変換してから既存パイプラインに乗せる（縮小ロジックも自動的に効く）。
            const lowerName = (inputFile.name || '').toLowerCase();
            const looksLikeHeic = /^image\/hei[fc]/.test(inputFile.type) || /\.heic$|\.heif$/.test(lowerName);
            if (looksLikeHeic) {
                a.result_text = MEDIA_PROGRESS_MSGS[2];
                maybeConvertHeic(inputFile).then(function (converted) {
                    // 変換成功時は a.result_text を消す。失敗時（converted === inputFile）は後続の MIME チェックで弾かれる。
                    if (converted !== inputFile) a.result_text = '';
                    m.mediaFile = converted;
                    continueCheckActMedia(a, m);
                });
                return;
            }
            m.mediaFile = inputFile;
            continueCheckActMedia(a, m);
}

// checkActMedia の続き（HEIC 変換後の本処理）を分離。
function continueCheckActMedia(a: A, m: any): void {
            if (!/^(image\/(png|jpeg|gif|bmp|webp)|video\/(mp4|webm|quicktime))$/.test(m.mediaFile.type)) {
                a.result_text = "UnSupport Media (" + m.mediaFile.type + ')';
                return;
            } else if (/^(image\/(png|jpeg))$/.test(m.mediaFile.type)) {
                m.fileType = 'img';
            } else if (/^(image\/(bmp|webp))$/.test(m.mediaFile.type)) {
                m.fileType = "img_ex";
            } else if (/^(image\/(gif))$/.test(m.mediaFile.type)) {
                m.fileType = "gif";
            } else {
                m.fileType = "mov";
            }
            // 8MB 制限を適用するのは「縮小されない画像」と GIF のみ。
            // 縮小される画像（optMaxImageLen>0 または optConvMedia!='off'）は canvas で JPEG 化されて
            // サイズが小さくなるため、元ファイルが 8MB を超えていても通す（これが縮小機能の目的）。
            // GIF は縮小対象外なので従来どおり 8MB 制限。動画は後段の 40MB 制限で扱う。
            const willDownscale = (a.optMaxImageLen && a.optMaxImageLen > 0) || ('off' != a.optConvMedia);
            const applies8mb =
                (m.fileType == "gif") ||
                ((m.fileType == "img" || m.fileType == "img_ex") && !willDownscale);
            if (applies8mb && m.mediaFile.size > LIMIT_IMGFILE) {
                a.result_text = "Images must be less than 8 MB";
                return;
            }
            if (m.fileType == "mov" && m.mediaFile.size > LIMIT_MOVFILE) {
                a.result_text = "Videos must be less than 40 MB";
                return;
            }
            m.fileReader.onload = function () {
                if (m.fileType == 'mov' || m.fileType == 'gif') {
                    a.actMedia(m.fileReader.result, m.mediaFile, false);
                } else {
                    m.imgElement.src = m.fileReader.result;
                    m.image.onerror = function () {
                        // 画像読込失敗（破損ファイル・形式不一致・iOS の Canvas/Image サイズ制限超過など）。
                        // 縮小せず元ファイルでアップロードを試みる（サーバ側で弾かれても明示的なエラーになる）。
                        a.result_text = '[Media] 画像の解析に失敗したため、縮小せずに送信します。';
                        a.actMedia(m.fileReader.result, m.mediaFile, false);
                    };
                    m.image.onload = function () {
                        // --- (3) 入力検証: width/height がゼロや異常値（Image load 失敗の残骸）なら早期離脱 ---
                        const iw = m.image.naturalWidth || m.image.width || 0;
                        const ih = m.image.naturalHeight || m.image.height || 0;
                        if (iw <= 0 || ih <= 0 || !isFinite(iw) || !isFinite(ih)) {
                            a.result_text = '[Media] 画像サイズを取得できないため、縮小せずに送信します。';
                            a.actMedia(m.fileReader.result, m.mediaFile, false);
                            return;
                        }

                        // --- resizeScale 計算（既存ロジック）---
                        // 新設定 optMaxImageLen（数値、px）が有効（>0）なら、長辺がこの値を超える画像を縮小する。
                        // GIF / 動画は対象外（呼ばれない）。これは optConvMedia より優先される。
                        if (a.optMaxImageLen && a.optMaxImageLen > 0) {
                            const longSide = iw > ih ? iw : ih;
                            m.resizeScale = longSide > a.optMaxImageLen ? a.optMaxImageLen / longSide : 1;
                        } else if ('hd' == a.optConvMedia) {
                            const longSide = iw > ih ? iw : ih;
                            m.resizeScale = IMAGE_MAXLEN / longSide < 1 ? IMAGE_MAXLEN / longSide : 1;
                        } else if ('off' != a.optConvMedia) {
                            m.resizeScale = IMAGE_MAXPIXEL / (iw * ih) < 1 ? Math.pow(IMAGE_MAXPIXEL / (iw * ih), 1 / 2) : 1;
                        } else {
                            m.resizeScale = 1;
                        }
                        // 縮小不要かつ非変換フォーマット（jpeg/png）なら元ファイルをそのままアップロード。
                        // bmp/webp（img_ex）は受け付けるサーバが少ないため、たとえスケール 1 でも canvas 経由で JPEG 化する。
                        if (m.fileType != "img_ex" && m.resizeScale == 1) {
                            a.actMedia(m.fileReader.result, m.mediaFile, false);
                            return;
                        }
                        // 縮小処理中のフィードバック（iPhone の大きな写真では canvas 処理に時間がかかるため）。
                        a.result_text = MEDIA_PROGRESS_MSGS[1];
                        // --- (4) canvas 変換は try/catch で囲む（toDataURL/drawImage の例外で action_lock を残さない）---
                        try {
                            const tw = Math.max(1, Math.round(iw * m.resizeScale));
                            const th = Math.max(1, Math.round(ih * m.resizeScale));
                            m.canvasElement.width = tw;
                            m.canvasElement.height = th;
                            // --- (2) PNG 透過部分が JPEG 化で黒になる仕様未定義の挙動を回避するため白背景を塗る ---
                            // （PNG/WebP の alpha チャンネルを持つ画像で、Safari/Chrome/Firefox 間の挙動差をなくす）
                            m.ctx.fillStyle = '#ffffff';
                            m.ctx.fillRect(0, 0, tw, th);
                            m.ctx.drawImage(m.image, 0, 0, iw, ih, 0, 0, tw, th);

                            // --- (5) iOS Safari 対策: toBlob を優先（toDataURL→base64ToBlob だと中間の
                            // base64 文字列 + atob ループ + Uint8Array コピー + Blob 化と複数の大きな
                            // メモリ領域を確保し、iPhone のメモリ制限で send() 直前に内部 abort されて
                            // XHR が status=0 で返る（=「Unknown Network Error」）。toBlob なら
                            // 直接 Blob を取得でき、ピーク使用量が大幅に減る。
                            const canvasEl = m.canvasElement as HTMLCanvasElement;
                            if (typeof canvasEl.toBlob === 'function') {
                                canvasEl.toBlob(function (blob: Blob | null) {
                                    if (!blob || blob.size === 0) {
                                        // toBlob が null を返すケース（iOS の極限的なメモリ不足等）。
                                        // 元ファイルでフォールバック送信。
                                        a.action_lock = '';
                                        a.result_text = '[Media] 画像の縮小に失敗（toBlob returned null）。縮小せずに送信します。';
                                        a.actMedia(m.fileReader.result, m.mediaFile, false);
                                        return;
                                    }
                                    m.MediaBlob = blob;
                                    // プレビュー用に小さな data URL を作る（一覧表示用なのでこれは小さく抑える）。
                                    // 元の挙動互換のため MediaBinary も入れておく（プレビュー画像表示用）。
                                    m.MediaBinary = m.fileReader.result;
                                    a.actMedia(m.MediaBinary, m.MediaBlob, true);
                                }, 'image/jpeg', 0.85);
                            } else {
                                // toBlob 非対応環境の旧来パス（フォールバック）。
                                m.MediaBinary = canvasEl.toDataURL('image/jpeg', 0.85);
                                if (!m.MediaBinary || m.MediaBinary === 'data:,') {
                                    throw new Error('toDataURL returned empty (canvas size limit or memory issue)');
                                }
                                m.MediaBlob = base64ToBlob(m.MediaBinary);
                                a.actMedia(m.MediaBinary, m.MediaBlob, true);
                            }
                        } catch (e: any) {
                            // canvas サイズ制限（iOS Safari 等）・OOM などで失敗した場合は、縮小をあきらめて
                            // 元ファイルをそのまま送信。action_lock を残さないようにここで明示的に解除。
                            // エラー詳細を可能な限り出す（e.message が無い WebKit の例外オブジェクトに対処）。
                            a.action_lock = '';
                            const detail = (e && e.message) ? e.message
                                : (e && e.name) ? e.name
                                : (e ? String(e) : 'unknown');
                            a.result_text = '[Media] 画像の縮小に失敗（' + detail + '）。縮小せずに送信します。';
                            a.actMedia(m.fileReader.result, m.mediaFile, false);
                        }
                    };
                    m.image.src = m.imgElement.src;
                }
            };
            m.fileReader.onerror = function () {
                // FileReader が失敗（巨大ファイルでのメモリ不足など）。lock を残さず通知。
                a.action_lock = '';
                a.result_text = '[Media] 画像の読み込みに失敗しました。';
            };
            // 読み込み開始のフィードバック（大きい画像は readAsDataURL 自体に時間がかかるため）。
            a.result_text = MEDIA_PROGRESS_MSGS[0];
            m.fileReader.readAsDataURL(m.mediaFile);
}

export function actMedia(app: KktjsApp, arg0: any, arg1: any, arg2: any): void {
  const a = app as A;
            if ('' != a.action_lock) {
                return;
            }
            a.action_lock = 'media';
            a.katsu.media_previews.push({
                'url': arg0,
                'preview_url': asset(IMG_DUMMY_REL),
                'type': arg1.type.slice(0, 0x5),
                'converted': arg2
            });
            var _0x38d96c = a;
            var _0x521de8;
            var _0x773119 = new FormData();
            _0x773119.append("file", arg1);
            var request = new XMLHttpRequest();
            request.open('POST', KATSU_MEDIA.replace('[I]', _0x38d96c.repository), true);
            request.timeout = REQ_TIMEOUT * 0xf0;
            request.setRequestHeader('Authorization', 'Bearer ' + _0x38d96c.at);
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x38d96c.katsu.media_attachments.push(JSON.parse(request.responseText));
                    // アップロード完了。進行メッセージ（「縮小しています…」等）が残っていれば自動で消す。
                    // 自分が出した進行メッセージのときだけ消し、無関係な通知やエラーは温存する。
                    if (MEDIA_PROGRESS_MSGS.indexOf(_0x38d96c.result_text) !== -1) {
                        _0x38d96c.result_text = '';
                    }
                    _0x38d96c.action_lock = '';
                    _0x38d96c.media_uploaded = '0';
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    // status != 200 で readyState=DONE。HTTP レスポンスはあるが失敗（4xx/5xx）の場合と、
                    // status=0（ネットワーク到達失敗・abort・タイムアウト）の場合がある。
                    // status=0 の細かい区別は onerror/ontimeout/onabort で行うので、ここでは何もしない
                    // （二重通知になるのを避ける。これらのハンドラが先に動く）。
                    if (request.status !== 0) {
                        _0x38d96c.katsu.media_previews.pop();
                        _0x38d96c.popError(request.responseText, request.status, "Media");
                        _0x38d96c.action_lock = '';
                        _0x38d96c.media_uploaded = '0';
                    }
                }
            };
            // status=0 の原因を区別するためのハンドラ。これらはネットワーク層の失敗で、
            // onreadystatechange の DONE/status=0 経路と重複しうるため、ここで具体的な原因を出して
            // pop & lock 解除を行う（onreadystatechange の status=0 経路は何もしない）。
            request.onerror = function () {
                // iPhone Safari でメモリ不足で送信前に内部 abort されるケース、CORS エラー、
                // ネットワーク到達失敗など。「Unknown Network Error」より具体的なメッセージにする。
                _0x38d96c.katsu.media_previews.pop();
                _0x38d96c.action_lock = '';
                _0x38d96c.media_uploaded = '0';
                _0x38d96c.result_text = '[Media] アップロードに失敗（送信前のネットワーク/メモリエラー）。画像サイズを小さくして再試行してください。';
            };
            request.ontimeout = function () {
                _0x38d96c.katsu.media_previews.pop();
                _0x38d96c.action_lock = '';
                _0x38d96c.media_uploaded = '0';
                _0x38d96c.result_text = '[Media] アップロードがタイムアウトしました。';
            };
            request.onabort = function () {
                _0x38d96c.katsu.media_previews.pop();
                _0x38d96c.action_lock = '';
                _0x38d96c.media_uploaded = '0';
                _0x38d96c.result_text = '[Media] アップロードが中断されました。';
            };
            request.send(_0x773119);
}

export function removeMedia(app: KktjsApp, arg0: any): void {
  const a = app as A;
            if (null == a.katsu.media_attachments[arg0]) {
                return;
            }
            a.katsu.media_previews.splice(arg0, 0x1);
            a.katsu.media_attachments.splice(arg0, 0x1);
}

export function saveKatsu(app: KktjsApp): void {
  const a = app as A;
            if (!a.optKeepForm) {
                a.refreshKatsu();
                return;
            }
            var _0x29a3b7 = document.getElementById('katsu_spoiler') as HTMLInputElement;
            var _0xdc7dac = document.getElementById('katsu_content') as HTMLInputElement;
            if (null == _0x29a3b7 || null == _0xdc7dac) {
                return;
            }
            a.katsu_spoiler_text = _0x29a3b7.value;
            a.katsu_content_text = _0xdc7dac.value;
}

export function actKatsuShortCut(app: KktjsApp): void {
  const a = app as A;
            if (((event as KeyboardEvent).ctrlKey && !(event as KeyboardEvent).metaKey || !(event as KeyboardEvent).ctrlKey && (event as KeyboardEvent).metaKey) && (event as KeyboardEvent).keyCode == 0xd) {
                a.actKatsu(a.katsu);
            }
}

export function actKatsu(app: KktjsApp, arg0: any, arg1: any): void {
  const a = app as A;
            var _0x91807d = document.getElementById('katsu_spoiler') as HTMLInputElement;
            var _0x510760 = document.getElementById('katsu_content') as HTMLInputElement;
            a.katsu_spoiler_text = _0x91807d.value;
            a.katsu_content_text = _0x510760.value;
            if (!a.checkKatsu()) {
                return;
            }
            a.katsu.poll.options = a.katsu.poll_work.texts.filter(function (_0x40ecd1, _0x41a6b6, _0x24e249) {
                return _0x40ecd1.length > 0 && _0x40ecd1.replace(/^[\s|　]+|[\s|　]+$/g, '').length > 0 && _0x24e249.indexOf(_0x40ecd1) === _0x41a6b6;
            });
            for (var _0x9ba4dc of a.katsu.poll.options) {
                if (_0x9ba4dc.length > LIMIT_POLLOPTION) {
                    a.result_text = "[Poll] アンケートの答えは25文字以内に設定してね。";
                    return;
                }
            }
            ; if (a.showFormVote && 1 == a.katsu.poll.options.length) {
                a.result_text = "[Poll] アンケートには2つ以上の答えを用意してね。";
                return;
            }
            a.action_lock = 'katsu';
            var _0x1e214f = new Array();
            a.katsu.media_attachments.forEach(function (_0x4621ae, _0x54f06e) {
                if (_0x54f06e >= 0x4) {
                    return;
                }
                _0x1e214f.push(_0x4621ae.id);
            });
            a.katsu.media_ids = _0x1e214f;
            a.katsu.spoiler_text = a.katsu_spoiler_text;
            a.katsu.status = a.katsu_content_text;
            a.katsu.status = a.katsu.status.replace(/^#/g, '\x20#');
            a.katsu.content = a.katsu_content_text;
            if (a.showFormVote && 0 != a.katsu.poll.options.length) {
                a.katsu_poll = a.katsu.poll;
                a.katsu.poll.choices = [false, false, false, false];
                a.katsu.poll_work.expires_at = a.formatDateVote(a.katsu.poll.expires_in);
            } else {
                a.katsu_poll = null;
            }
            if (0 == a.katsu.media_ids.length) {
                a.katsu.nsfw = false;
            }
            a.katsu.sensitive = a.katsu.nsfw || 0 < a.katsu_spoiler_text.length ? true : false;
            if (1 == a.optConfirm.katsu && true !== arg1) {
                a.confirm(arg0, 'katsu');
                a.action_lock = '';
                return;
            }
            arg0.req_katsu = true;
            // arg0 は proxy。req_katsu の同期変更は reactivity で反映（検証済み）。
            var _0x5e35cf = a;
            var _0x284c21: any = [];
            var _0x33bd48 = {
                'status': a.katsu.status,
                'in_reply_to_id': a.katsu.in_reply_to_id,
                'media_ids': a.katsu.media_ids,
                'sensitive': a.katsu.sensitive,
                'spoiler_text': a.katsu_spoiler_text,
                'poll': a.katsu_poll,
                'visibility': a.katsu.visibility
            };
            var request = new XMLHttpRequest();
            request.open('POST', KATSU.replace('[I]', _0x5e35cf.repository), true);
            request.timeout = REQ_TIMEOUT;
            request.setRequestHeader('Authorization', 'Bearer\x20' + _0x5e35cf.at);
            request.setRequestHeader("Content-type", 'application/json');
            request.onreadystatechange = function () {
                if (request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                    _0x5e35cf.refreshKatsu();
                    if (_0x5e35cf.showForm) {
                        _0x5e35cf.saveKatsu();
                        _0x5e35cf.showForm = false;
                    }
                } else if (request.readyState == XMLHttpRequest.DONE) {
                    _0x5e35cf.popError(request.responseText, request.status, 'Katsu');
                    _0x5e35cf.action_lock = '';
                }
                arg0.req_katsu = false;
                _0x5e35cf['$forceUpdate']();
            }
                ;
            request.send(JSON.stringify(_0x33bd48));
}

export function refreshKatsu(app: KktjsApp): void {
  const a = app as A;
            var domSpoiler = document.getElementById('katsu_spoiler') as HTMLInputElement;
            var domContent = document.getElementById('katsu_content') as HTMLInputElement;
            a.katsu = {
                'status': '',
                'in_reply_to_id': null,
                'reply': [],
                'media_ids': [],
                'sensitive': false,
                'nsfw': false,
                'spoiler_text': '',
                'visibility': '',
                'content': '',
                'media_attachments': [],
                'media_previews': [],
                'poll': {
                    'options': [],
                    'multiple': false,
                    'expires_in': 0x15180
                },
                'poll_work': {
                    'texts': [],
                    'expires_at': '',
                    'extime': [1, 0, 0x0]
                },
                'emojis': []
            },
                a.katsu_spoiler_text = '';
            a.katsu_spoiler_text_bu = '';
            a.katsu_content_text = '';
            a.katsu_poll = null;
            a.katsu.visibility = a.user.locked ? "private" : "public";
            if (null != domSpoiler && null != domContent) {
                domSpoiler.value = a.katsu_spoiler_text;
                domContent.value = a.katsu_content_text;
            }
            a.showFormSpoiler = false;
            a.showFormVote = false;
            a.showFormDraft = a.content_text_drafts.length > 0 ? true : false;
            a.showFormVisible = a.katsu.visibility != 'public' ? true : false;
            a.action_lock = '';
}

export function katsuToDraft(app: KktjsApp): void {
  const a = app as A;
            if (!a.checkKatsu()) {
                return;
            }
            var _0x37bee6 = document.getElementById('katsu_spoiler') as HTMLInputElement;
            var _0x62d4ab = document.getElementById('katsu_content') as HTMLInputElement;
            a.katsu_spoiler_text = null != _0x37bee6 ? _0x37bee6.value : a.katsu_spoiler_text;
            a.katsu_content_text = null != _0x62d4ab ? _0x62d4ab.value : a.katsu_content_text;
            a.katsu.spoiler_text = a.katsu_spoiler_text;
            a.katsu.status = a.katsu_content_text;
            if (!a.showFormVote) {
                a.katsu.poll = {
                    'options': [],
                    'multiple': false,
                    'expires_in': 0x15180
                };
                a.katsu.poll_work = {
                    'texts': [],
                    'expires_at': '',
                    'extime': [1, 0, 0x0]
                };
            }
            a.katsu_drafts.unshift(a.katsu);
            var _0x3d5ee8 = document.getElementById("vote_title_0") as HTMLInputElement;
            var _0x5be2c5 = document.getElementById("vote_title_1") as HTMLInputElement;
            var _0x4a6db7 = document.getElementById("vote_title_2") as HTMLInputElement;
            var _0x13fa5b = document.getElementById("vote_title_3") as HTMLInputElement;
            if (null != _0x3d5ee8) {
                _0x3d5ee8.value = '';
            }
            if (null != _0x5be2c5) {
                _0x5be2c5.value = '';
            }
            if (null != _0x4a6db7) {
                _0x4a6db7.value = '';
            }
            if (null != _0x13fa5b) {
                _0x13fa5b.value = '';
            }
            a.refreshKatsu();
}

export function draftToKatsu(app: KktjsApp, arg0: any, arg1: any): void {
  const a = app as A;
            var _0x51c6b1 = document.getElementById('katsu_spoiler') as HTMLInputElement;
            var _0x59649d = document.getElementById('katsu_content') as HTMLInputElement;
            a.katsu = a.katsu_drafts[arg0];
            if (arg1) {
                a.katsu_drafts.splice(arg0, 0x1);
            }
            a.katsu_spoiler_text = a.katsu.spoiler_text;
            a.katsu_content_text = a.katsu.status;
            _0x51c6b1.value = a.katsu_spoiler_text;
            _0x59649d.value = a.katsu_content_text;
            a.showFormSpoiler = a.katsu_spoiler_text.length > 0 ? true : false;
            a.showFormVote = a.katsu.poll_work.texts.length > 0 ? true : false;
            a.showFormVisible = a.katsu.visibility != "public" ? true : false;
            var _0x1574a5 = document.getElementById("vote_title_0") as HTMLInputElement;
            var _0x267354 = document.getElementById('vote_title_1') as HTMLInputElement;
            var _0x3b2dc1 = document.getElementById("vote_title_2") as HTMLInputElement;
            var _0x3b2757 = document.getElementById('vote_title_3') as HTMLInputElement;
            if (null != _0x1574a5) {
                _0x1574a5.value = null != a.katsu.poll_work.texts[0] ? a.katsu.poll_work.texts[0] : '';
            }
            if (null != _0x267354) {
                _0x267354.value = null != a.katsu.poll_work.texts[1] ? a.katsu.poll_work.texts[1] : '';
            }
            if (null != _0x3b2dc1) {
                _0x3b2dc1.value = null != a.katsu.poll_work.texts[2] ? a.katsu.poll_work.texts[2] : '';
            }
            if (null != _0x3b2757) {
                _0x3b2757.value = null != a.katsu.poll_work.texts[3] ? a.katsu.poll_work.texts[3] : '';
            }
            a.refreshCount();
}

export function checkKatsu(app: KktjsApp): boolean {
  const a = app as A;
            if ('' != a.action_lock) {
                return false;
            }
            var spoilerDom = document.getElementById('katsu_spoiler') as HTMLInputElement;
            var contentDom = document.getElementById('katsu_content') as HTMLInputElement;
            if (null == spoilerDom || null == contentDom) {
                return false;
            }
            a.katsu_spoiler_text = spoilerDom.value;
            a.katsu_content_text = contentDom.value;
            if (0 != a.katsu.media_previews.length && a.katsu.media_previews.length != a.katsu.media_attachments.length) {
                return false;
            }
            if ((0 == contentDom.value.trim().length || 0 == a.contentLength()) && 0 == a.katsu.media_previews.length) {
                return false;
            }
            if (0x1f4 < spoilerDom.value.length + a.contentLength()) {
                return false;
            }
            return true;
}

export function jumpKatsu(app: KktjsApp, arg0: any, arg1: any): void {
  const a = app as A;
            var _0x5e219a = document.getElementById(arg0 + '' + arg1) as HTMLInputElement;
            if (_0x5e219a != null && (arg0 == 'home' && a.showHome || arg0 == 'local' && a.showLocal || arg0 == 'notif' && a.showNotif || arg0 == 'multi' && a.showMulti)) {
                var _0x610350 = document.getElementById(arg0) as HTMLInputElement;
                setTimeout(function () {
                    _0x610350.scrollTop = _0x610350.scrollTop + _0x5e219a.getBoundingClientRect().top + window.pageYOffset - 0x58;
                }, 0);
            }
}
