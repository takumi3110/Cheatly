import catalogJson from "../../packs/index.json";
import { PACK_BASE_URL } from "../config";
import {
  BUNDLED_PACK_IDS,
  DEFAULT_ENABLED_PACK_IDS,
  isBundledPack,
} from "../data/builtin";
import type { Builder, Command } from "../types";

export type PackMeta = {
  id: string;
  label: string;
  cat: string;
  count: number;
  desc: string;
};

/**
 * カタログの増分をどこまで取れたか。
 * 同梱分は必ず出るので、これは「配信先の追加パックが見えているか」を表す。
 */
export type CatalogSource = "network" | "cache" | "bundled";

/** 取得済みパック: パックID -> コマンド配列 */
export type InstalledPacks = Record<string, Command[]>;

const CATALOG_KEY = "cheatly.catalog.v1";
const INSTALLED_KEY = "cheatly.installed.v1";
const ENABLED_KEY = "cheatly.enabled.v1";

/**
 * 同梱カタログ。配信先が落ちていても未設定でも、一覧はこれだけで成立する。
 * packs/index.json を直接 import しているので配信物と二重管理にならない。
 */
const BUNDLED_CATALOG = catalogJson.packs as PackMeta[];

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

/**
 * 同梱カタログに配信側の分を重ねる。
 * 同梱パックのメタは同梱側を優先する（実データは同梱の JSON なので、
 * 配信側の count や desc が新しくても手元の中身とは一致しないため）。
 */
function mergeCatalog(remote: PackMeta[]): PackMeta[] {
  const merged = [...BUNDLED_CATALOG];
  const index = new Map(merged.map((p, i) => [p.id, i]));
  for (const pack of remote) {
    const at = index.get(pack.id);
    if (at === undefined) {
      index.set(pack.id, merged.length);
      merged.push(pack);
    } else if (!isBundledPack(pack.id)) {
      merged[at] = pack;
    }
  }
  return merged;
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
 * 同梱カタログが土台なので、配信先に届かなくても一覧は必ず全件返る。
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
    return { packs: mergeCatalog(packs), source: "network" };
  } catch {
    const cached = readCachedCatalog();
    if (cached) return { packs: mergeCatalog(cached), source: "cache" };
    return { packs: BUNDLED_CATALOG, source: "bundled" };
  }
}

/** 配信先から1パック取得する。失敗時は理由付きで throw するので呼び出し側で表示する */
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

/**
 * 有効にしている同梱パックの ID。
 * 同梱から外れた ID は落とすので、同梱構成を変えても持ち越さない。
 */
export function loadEnabled(): string[] {
  try {
    const raw = localStorage.getItem(ENABLED_KEY);
    if (!raw) return DEFAULT_ENABLED_PACK_IDS.filter(isBundledPack);
    const json: unknown = JSON.parse(raw);
    if (!Array.isArray(json)) return DEFAULT_ENABLED_PACK_IDS;
    return BUNDLED_PACK_IDS.filter((id) => json.includes(id));
  } catch {
    return DEFAULT_ENABLED_PACK_IDS.filter(isBundledPack);
  }
}

export function saveEnabled(ids: string[]) {
  try {
    localStorage.setItem(ENABLED_KEY, JSON.stringify(ids));
  } catch {
    // 保存に失敗してもメモリ上の状態は生きているので、この場では何もしない
  }
}

/**
 * 配信先から取得したパックのコマンド。
 * 同梱に移ったパックは実データを持つ意味がないので読み飛ばす。
 */
export function loadInstalled(): InstalledPacks {
  try {
    const raw = localStorage.getItem(INSTALLED_KEY);
    if (!raw) return {};
    const json: unknown = JSON.parse(raw);
    if (typeof json !== "object" || json === null) return {};

    const out: InstalledPacks = {};
    for (const [id, cmds] of Object.entries(json)) {
      if (isBundledPack(id) || !Array.isArray(cmds)) continue;
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
