/**
 * コマンドパックの配信先。
 *
 * 開発時は Vite dev サーバーがリポジトリ直下の packs/ をそのまま配信するので /packs を使う。
 * 本番はここを実際の配信先に差し替える。packs/ の中身をそのままアップロードすればよい。
 *   例: https://raw.githubusercontent.com/<user>/<repo>/main/packs
 *
 * 配信先には CORS ヘッダ (Access-Control-Allow-Origin) が必要。
 * GitHub raw / GitHub Pages はどちらも * を返すのでそのまま使える。
 */
const REMOTE_PACK_BASE_URL = "https://example.com/cheatly/packs";

export const PACK_BASE_URL = import.meta.env.DEV
  ? "/packs"
  : REMOTE_PACK_BASE_URL;

/** 配信先が未設定のままか（UI に注意書きを出すため） */
export const PACK_HOST_CONFIGURED =
  import.meta.env.DEV || !REMOTE_PACK_BASE_URL.includes("example.com");
