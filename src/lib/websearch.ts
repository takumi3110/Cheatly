import { openUrl } from "@tauri-apps/plugin-opener";

const SEARCH_URL = "https://www.google.com/search?q=";

/**
 * 「コピーしたい」のような語だけでは関係ない記事が並ぶので、コマンド探し向けに補う。
 * 選択中のカテゴリ（Python / Docker など）があれば、それも絞り込みに足す。
 * すでに検索語に入っている語は重ねない。
 */
export function buildSearchQuery(term: string, lang?: string | null): string {
  const t = term.trim();
  const l = (lang ?? "").trim();
  const withLang =
    l && !t.toLowerCase().includes(l.toLowerCase()) ? `${l} ${t}`.trim() : t;
  return withLang.includes("コマンド") ? withLang : `${withLang} コマンド`;
}

/**
 * 検索語を既定のブラウザで開く。
 * Tauri では window.open が使えないので opener プラグインを通す。
 * ブラウザで開発中は opener が無くて失敗するので window.open に落とす。
 */
export async function openWebSearch(
  term: string,
  lang?: string | null,
): Promise<void> {
  const url = SEARCH_URL + encodeURIComponent(buildSearchQuery(term, lang));
  try {
    await openUrl(url);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
