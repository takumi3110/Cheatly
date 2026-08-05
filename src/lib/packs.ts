import catalogJson from "../../packs/index.json";
import { PACK_BASE_URL } from "../config";
import type { Builder, Command } from "../types";

export type PackMeta = {
  id: string;
  label: string;
  cat: string;
  count: number;
  desc: string;
};

/** カタログをどこから読めたか。UI で「オフライン表示中」を出すのに使う */
export type CatalogSource = "network" | "cache" | "fallback";

/** 取得済みパック: パックID -> コマンド配列 */
export type InstalledPacks = Record<string, Command[]>;

const CATALOG_KEY = "cheatly.catalog.v1";
const INSTALLED_KEY = "cheatly.installed.v1";

/**
 * 初回起動がオフラインでもパック一覧を見せられるように、カタログだけは同梱する。
 * packs/index.json を直接 import しているので配信物と二重管理にならない。
 */
const FALLBACK_CATALOG = catalogJson.packs as PackMeta[];

function isBuilder(v: unknown): v is Builder {
  if (typeof v !== "object" || v === null) return false;
  const b = v as Record<string, unknown>;
  return (
    typeof b.cmd === "string" && Array.isArray(b.flags) && Array.isArray(b.args)
  );
}

function isCommand(v: unknown): v is Command {
  if (typeof v !== "object" || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.env === "string" &&
    typeof c.cat === "string" &&
    typeof c.title === "string" &&
    typeof c.code === "string" &&
    typeof c.note === "string" &&
    typeof c.tag === "string" &&
    typeof c.kw === "string"
  );
}

/** 壊れた b が入っていてもドロワーが落ちないように、不正なら b だけ落とす */
function sanitize(c: Command): Command {
  return isBuilder(c.b) ? c : { ...c, b: undefined };
}

function isPackMeta(v: unknown): v is PackMeta {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.label === "string" &&
    typeof p.cat === "string" &&
    typeof p.count === "number" &&
    typeof p.desc === "string"
  );
}

function readCachedCatalog(): PackMeta[] | null {
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (!raw) return null;
    const json: unknown = JSON.parse(raw);
    if (!Array.isArray(json)) return null;
    const packs = json.filter(isPackMeta);
    return packs.length ? packs : null;
  } catch {
    return null;
  }
}

/**
 * パックカタログを取得する。
 * ネット → localStorage キャッシュ → 同梱カタログ の順に必ずどれかを返すので、
 * オフラインでも一覧そのものは表示できる。
 */
export async function fetchCatalog(): Promise<{
  packs: PackMeta[];
  source: CatalogSource;
}> {
  try {
    const res = await fetch(`${PACK_BASE_URL}/index.json`, {
      cache: "no-cache",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: unknown = await res.json();
    const list = (json as { packs?: unknown })?.packs;
    const packs = Array.isArray(list) ? list.filter(isPackMeta) : [];
    if (!packs.length) throw new Error("カタログが空です");
    localStorage.setItem(CATALOG_KEY, JSON.stringify(packs));
    return { packs, source: "network" };
  } catch {
    const cached = readCachedCatalog();
    if (cached) return { packs: cached, source: "cache" };
    return { packs: FALLBACK_CATALOG, source: "fallback" };
  }
}

/** 1パックを取得する。失敗時は理由付きで throw するので呼び出し側で表示する */
export async function fetchPack(id: string): Promise<Command[]> {
  let res: Response;
  try {
    res = await fetch(`${PACK_BASE_URL}/${id}.json`, { cache: "no-cache" });
  } catch {
    throw new Error("ネットワークに接続できません");
  }
  if (!res.ok) throw new Error(`取得に失敗しました (HTTP ${res.status})`);

  const json: unknown = await res.json();
  const list = (json as { commands?: unknown })?.commands;
  if (!Array.isArray(list)) throw new Error("パックの形式が不正です");

  const commands = list.filter(isCommand).map(sanitize);
  if (!commands.length) throw new Error("有効なコマンドが入っていません");
  return commands;
}

export function loadInstalled(): InstalledPacks {
  try {
    const raw = localStorage.getItem(INSTALLED_KEY);
    if (!raw) return {};
    const json: unknown = JSON.parse(raw);
    if (typeof json !== "object" || json === null) return {};

    const out: InstalledPacks = {};
    for (const [id, cmds] of Object.entries(json)) {
      if (!Array.isArray(cmds)) continue;
      const valid = cmds.filter(isCommand).map(sanitize);
      if (valid.length) out[id] = valid;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveInstalled(packs: InstalledPacks) {
  try {
    localStorage.setItem(INSTALLED_KEY, JSON.stringify(packs));
  } catch {
    // 保存に失敗してもメモリ上の状態は生きているので、この場では何もしない
  }
}
