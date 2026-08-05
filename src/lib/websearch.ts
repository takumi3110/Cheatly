import { openUrl } from "@tauri-apps/plugin-opener";

const SEARCH_URL = "https://www.google.com/search?q=";

/** 「コピーしたい」のような語だけでは関係ない記事が並ぶので、コマンド探し向けに補う */
export function buildSearchQuery(term: string): string {
  const t = term.trim();
  return t.includes("コマンド") ? t : `${t} コマンド`;
}

/**
 * 検索語を既定のブラウザで開く。
 * Tauri では window.open が使えないので opener プラグインを通す。
 * ブラウザで開発中は opener が無くて失敗するので window.open に落とす。
 */
export async function openWebSearch(term: string): Promise<void> {
  const url = SEARCH_URL + encodeURIComponent(buildSearchQuery(term));
  try {
    await openUrl(url);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
