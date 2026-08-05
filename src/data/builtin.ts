import type { Command } from "../types";
import linux from "../../packs/linux.json";
import vim from "../../packs/vim.json";
import git from "../../packs/git.json";

/**
 * アプリに同梱するパック。ネット接続なしで必ず使える。
 * packs/*.json を直接読むので配信物と二重管理にならない。
 * これ以外のカテゴリは packs/ から取得する（src/lib/packs.ts）。
 */
const BUILTIN_PACKS = [linux, vim, git] as unknown as {
  commands: Command[];
}[];

/** 同梱するコマンド。各パックの commands を平坦化したもの */
export const BUILTIN_COMMANDS = BUILTIN_PACKS.flatMap((p) => p.commands);

/** 同梱済みのカテゴリ。パック一覧で「同梱」と表示する判定に使う */
export const BUILTIN_CATS = BUILTIN_PACKS.map((p) => p.commands[0].cat);
