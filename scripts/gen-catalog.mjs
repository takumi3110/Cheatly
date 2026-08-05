// packs/*.json から packs/index.json（カタログ）を生成する。
// count は各パックの commands 数から自動算出するので手で数える必要はない。
// 使い方: node scripts/gen-catalog.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "packs");
const OUT = join(packsDir, "index.json");

const files = readdirSync(packsDir)
  .filter((f) => f.endsWith(".json") && f !== "index.json")
  .sort();

const packs = files.map((file) => {
  const pack = JSON.parse(readFileSync(join(packsDir, file), "utf8"));

  const problems = [];
  if (typeof pack.id !== "string") problems.push("id が無い");
  if (typeof pack.label !== "string") problems.push("label が無い");
  if (typeof pack.desc !== "string") problems.push("desc が無い");
  if (!Array.isArray(pack.commands) || pack.commands.length === 0)
    problems.push("commands が空");
  if (problems.length) throw new Error(file + ": " + problems.join(" / "));

  return {
    id: pack.id,
    label: pack.label,
    cat: pack.commands[0].cat,
    count: pack.commands.length,
    desc: pack.desc,
  };
});

writeFileSync(OUT, JSON.stringify({ version: 1, packs }, null, 2) + "\n");
console.log("packs/index.json を生成しました（" + packs.length + " パック）");