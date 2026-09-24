import type { Command } from "../types";

/**
 * 「コピーしたい」のような話し言葉の語尾。パックの kw は名詞中心なので、
 * 語尾を付けたままだと部分一致しない。長いものから順に1回だけ落とす。
 */
const VERB_SUFFIXES = [
  "させたい",
  "したい",
  "したく",
  "しよう",
  "します",
  "できる",
  "する",
  "して",
  "たい",
  "ます",
];

/**
 * 動詞の語幹 → パック側でよく使われる言い換え。
 * 語幹は「消したい」→「消」のように語尾を落とした後の token に含まれていれば発動する。
 * 上から順に見て当たった語幹は消費するので、「取り消」が「消」に二重に当たらないよう長い語幹のグループを先に置く。
 */
const SYNONYMS: { stems: string[]; words: string[] }[] = [
  { stems: ["取り消", "戻", "元に"], words: ["取り消し", "戻す", "復元", "undo"] },
  { stems: ["消", "削除"], words: ["削除", "消す", "除去", "クリア"] },
  { stems: ["探", "検索", "調べ"], words: ["検索", "探す", "調べる", "find"] },
  { stems: ["作", "新規"], words: ["作成", "新規", "create"] },
  { stems: ["見", "確認"], words: ["表示", "確認", "一覧"] },
  { stems: ["写", "複製", "コピー"], words: ["コピー", "複製", "copy"] },
  { stems: ["動か", "移動", "移"], words: ["移動", "move"] },
  { stems: ["名前", "リネーム"], words: ["名前変更", "リネーム", "rename"] },
  { stems: ["変え", "変更"], words: ["変更", "変換", "置換"] },
  { stems: ["置き換", "置換"], words: ["置換", "replace"] },
  { stems: ["貼", "ペースト"], words: ["貼り付け", "paste"] },
  { stems: ["保存", "書き"], words: ["保存", "書き込み", "書き出し"] },
  { stems: ["閉じ", "やめ", "終わ", "抜け"], words: ["終了", "閉じる", "抜ける"] },
  { stems: ["止め", "停止"], words: ["停止", "終了", "stop"] },
  { stems: ["比べ", "比較", "違い"], words: ["比較", "差分", "diff"] },
  { stems: ["並べ", "ソート"], words: ["並び替え", "ソート", "sort"] },
  { stems: ["数え", "カウント"], words: ["カウント", "集計", "行数"] },
  { stems: ["開"], words: ["開く", "起動", "open"] },
];

function findSynonyms(token: string): string[] {
  let rest = token;
  const words: string[] = [];
  for (const group of SYNONYMS) {
    const stem = group.stems.find((s) => rest.includes(s));
    if (!stem) continue;
    words.push(...group.words);
    rest = rest.replace(stem, "");
  }
  return words;
}

function stripVerbSuffix(token: string): string {
  const suffix = VERB_SUFFIXES.find(
    (s) => token.endsWith(s) && token.length > s.length,
  );
  return suffix ? token.slice(0, -suffix.length) : token;
}

/**
 * 検索語1つを「どれか1つでも含まれていれば一致」とみなす候補に広げる。
 * 「ファイルを消したい」のように助詞でつながった入力は「を」で区切って別の語として扱う。
 */
function expandTerms(query: string): string[][] {
  return query
    .toLowerCase()
    .split(/[\s　を]+/)
    .filter(Boolean)
    .map((raw) => {
      const token = stripVerbSuffix(raw);
      const synonyms = findSynonyms(token);
      // 言い換えが見つかったら語幹そのものは使わない。「消」1文字だと「取り消し」まで拾ってしまうため
      return synonyms.length ? [raw, ...synonyms] : [raw, token];
    });
}

/**
 * やりたいこと（逆引き）とコマンド名の両方で引ける判定関数を作る。
 * 全語が何らかの形で含まれれば一致。展開はコマンドごとにやると無駄なので最初に1回だけ行う。
 */
export function createCommandMatcher(
  query: string,
): (command: Command) => boolean {
  const terms = expandTerms(query);
  return (command) => {
    const hay =
      `${command.title} ${command.code} ${command.kw} ${command.env} ${command.tag}`.toLowerCase();
    return terms.every((candidates) => candidates.some((c) => hay.includes(c)));
  };
}
