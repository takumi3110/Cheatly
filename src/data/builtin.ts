import type { Command } from "../types";

type PackFile = { commands: Command[] };

const unwrap = (m: { default: unknown }) => m.default as unknown as PackFile;

/**
 * アプリに同梱するパック。ネット接続なしで必ず使える。
 * ここに無いパック（Python / JavaScript / VS Code）は配信先から取得する（src/lib/packs.ts）。
 *
 * 動的 import なので、有効化されたパックの JSON だけが実際に読み込まれる。
 * 同梱を増減するときはここだけ直せばよく、packs/index.json は配信物と共通のまま使える。
 */
const LOADERS: Record<string, () => Promise<PackFile>> = {
  linux: () => import("../../packs/linux.json").then(unwrap),
  vim: () => import("../../packs/vim.json").then(unwrap),
  git: () => import("../../packs/git.json").then(unwrap),
  cmd: () => import("../../packs/cmd.json").then(unwrap),
  docker: () => import("../../packs/docker.json").then(unwrap),
  powershell: () => import("../../packs/powershell.json").then(unwrap),
};

/** 同梱しているパックの ID 一覧 */
export const BUNDLED_PACK_IDS = Object.keys(LOADERS);

/** 初回起動時に有効にしておくパック。残りの同梱パックはユーザーが追加する */
export const DEFAULT_ENABLED_PACK_IDS = ["linux", "vim", "git"];

export function isBundledPack(id: string): boolean {
  return id in LOADERS;
}

/** 同梱パックのコマンドを読み込む。同梱していない ID なら空を返す */
export async function loadBundledPack(id: string): Promise<Command[]> {
  const loader = LOADERS[id];
  if (!loader) return [];
  return (await loader()).commands;
}
