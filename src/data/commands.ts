import type { Group } from "../types";

/**
 * カテゴリのグループ分けと並び順。同梱・パック配信にかかわらず全カテゴリを並べる。
 * サイドバーに出るのは実際にコマンドを持つカテゴリだけで、ここに無いカテゴリは
 * 「その他」にまとめられる（src/components/Sidebar.tsx）。
 */
export const GROUPS: Group[] = [
  { key: "os", label: "OS / Terminal", cats: ["Linux", "PowerShell", "cmd"] },
  { key: "editor", label: "Editor", cats: ["Vim", "VS Code"] },
  { key: "dev", label: "Dev Tools", cats: ["Git", "Docker"] },
  { key: "lang", label: "Language", cats: ["Python", "JavaScript"] },
];

/** GROUPS のどれにも属さないカテゴリの受け皿 */
export const OTHER_GROUP_KEY = "other";

/** env / cat -> [背景色, 文字色] */
export const BADGES: Record<string, [string, string]> = {
  Linux: ["#1d3a2a", "#4ade80"],
  PowerShell: ["#1a2f4a", "#60a5fa"],
  cmd: ["#333333", "#c5c5c5"],
  Vim: ["#1d3a2a", "#a3e635"],
  "VS Code": ["#16324a", "#4fc1ff"],
  Git: ["#3d2417", "#fb923c"],
  Docker: ["#12333d", "#22d3ee"],
  Python: ["#3a3317", "#fbbf24"],
  JavaScript: ["#3a3617", "#facc15"],
};

export const DEFAULT_BADGE: [string, string] = ["#333333", "#cccccc"];

export const TAGS = [
  "ファイル操作",
  "検索",
  "ネットワーク",
  "コード",
  "バージョン管理",
];
