import { useEffect, useMemo, useRef, useState } from "react";
import { CommandCard } from "./components/CommandCard";
import { CommandDrawer } from "./components/CommandDrawer";
import { PackManager } from "./components/PackManager";
import { Sidebar } from "./components/Sidebar";
import { BUILTIN_CATS, BUILTIN_COMMANDS } from "./data/builtin";
import { OTHER_GROUP_KEY, TAGS } from "./data/commands";
import {
  fetchCatalog,
  loadInstalled,
  saveInstalled,
  type InstalledPacks,
  type PackMeta,
} from "./lib/packs";
import { onTrayOpen, expandWindow } from "./lib/trayWindow";
import { openWebSearch } from "./lib/websearch";
import { ACCENT, GRID_COLS } from "./theme";
import type { Command } from "./types";
import "./App.css";

/** 同梱＋取得済みパックを結合する。id 重複は同梱を優先して1件に潰す */
function mergeCommands(installed: InstalledPacks): Command[] {
  const byId = new Map<string, Command>();
  for (const c of BUILTIN_COMMANDS) byId.set(c.id, c);
  for (const pack of Object.values(installed)) {
    for (const c of pack) if (!byId.has(c.id)) byId.set(c.id, c);
  }
  return [...byId.values()];
}

function App() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    os: true,
    editor: true,
    dev: true,
    lang: true,
    [OTHER_GROUP_KEY]: true,
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [packsOpen, setPacksOpen] = useState(false);
  const [installed, setInstalled] = useState<InstalledPacks>({});
  const [catalog, setCatalog] = useState<PackMeta[] | null>(null);
  const [compact, setCompact] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setInstalled(loadInstalled());

    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(copyTimer.current);
    };
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    onTrayOpen(() => setCompact(true)).then((fn) => {
      unlisten = fn;
    });
    return () => unlisten?.();
  }, []);

  const handleExpand = () => {
    setCompact(false);
    expandWindow();
  };

  const allCommands = useMemo(() => mergeCommands(installed), [installed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCommands.filter((d) => {
      if (activeCat && d.cat !== activeCat) return false;
      if (activeTag && d.tag !== activeTag) return false;
      if (!q) return true;
      const hay =
        `${d.title} ${d.code} ${d.kw} ${d.env} ${d.tag}`.toLowerCase();
      return q.split(/\s+/).every((t) => hay.includes(t));
    });
  }, [allCommands, query, activeCat, activeTag]);

  const hasFilter = !!(query.trim() || activeCat || activeTag);
  const drawerCommand = allCommands.find((d) => d.id === drawerId);
  const noResult = filtered.length === 0;
  const searchTerm = query.trim() || activeTag || activeCat || "";

  // カタログは結果ゼロの画面でしか要らないので、そこに来たときに一度だけ取りに行く
  useEffect(() => {
    if (!noResult || catalog) return;
    let alive = true;
    fetchCatalog().then(({ packs }) => {
      if (alive) setCatalog(packs);
    });
    return () => {
      alive = false;
    };
  }, [noResult, catalog]);

  /**
   * 取れるコードセットが残っているか。
   * カテゴリを絞っているならそのカテゴリだけを見る（＝取得済みなら誘導しない）。
   * カタログ未取得の間は出さない（結局取れるものが無かったとき、ボタンがちらつくため）。
   */
  const canDownloadPacks = (
    activeCat
      ? (catalog ?? []).filter((p) => p.cat === activeCat)
      : (catalog ?? [])
  ).some((p) => !BUILTIN_CATS.includes(p.cat) && !installed[p.id]);

  const updateInstalled = (next: InstalledPacks) => {
    setInstalled(next);
    saveInstalled(next);
  };

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(id);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopiedId(null), 1400);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#1e1e1e",
      }}
    >
      {!compact && (
        <Sidebar
          commands={allCommands}
          open={sidebarOpen}
          onToggleOpen={() => setSidebarOpen((v) => !v)}
          expanded={expanded}
          onToggleGroup={(key) =>
            setExpanded((s) => ({ ...s, [key]: !s[key] }))
          }
          activeCat={activeCat}
          onSelectCat={setActiveCat}
          onOpenPacks={() => setPacksOpen(true)}
        />
      )}

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <header
          style={{
            flex: "none",
            padding: compact ? "12px 14px 10px" : "20px 28px 14px",
            borderBottom: "1px solid #333333",
            background: "#1e1e1e",
          }}
        >
          {compact && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 8,
              }}
            >
              <button
                className="icon-btn"
                onClick={handleExpand}
                title="通常サイズに展開"
                style={{ padding: "4px 10px", fontSize: 11.5, borderRadius: 6 }}
              >
                ⤢ 展開
              </button>
            </div>
          )}

          <div style={{ position: "relative", maxWidth: 860 }}>
            <span
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#7a7a7a",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 15,
                pointerEvents: "none",
              }}
            >
              ⌕
            </span>
            <input
              ref={searchRef}
              className="field-input search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="やりたいこと（例：コピーしたい）や コマンド名（例：cp）で横断検索…"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 110px 13px 44px",
                background: "#2d2d30",
                border: "1px solid #3e3e42",
                borderRadius: 8,
                color: "#e8e8e8",
                fontSize: 14,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <span
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "#6a6a6a",
                background: "#1e1e1e",
                border: "1px solid #3e3e42",
                borderRadius: 4,
                padding: "3px 7px",
                pointerEvents: "none",
              }}
            >
              Ctrl+K
            </span>
          </div>

          {!compact && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 11, color: "#7a7a7a", marginRight: 2 }}>
                タグ:
              </span>
              {TAGS.map((tag) => {
                const active = activeTag === tag;
                return (
                  <button
                    key={tag}
                    className="tag-btn"
                    onClick={() => setActiveTag(active ? null : tag)}
                    style={{
                      padding: "4px 11px",
                      background: active ? ACCENT : "transparent",
                      border: `1px solid ${active ? ACCENT : "#3e3e42"}`,
                      borderRadius: 99,
                      color: active ? "#1e1e1e" : "#9a9a9a",
                      fontSize: 11.5,
                      cursor: "pointer",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: compact ? "10px 14px 20px" : "18px 28px 40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 12, color: "#9a9a9a" }}>
              {activeCat
                ? `${activeCat} のコマンド`
                : query.trim() || activeTag
                  ? "検索結果"
                  : "すべてのコマンド"}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "#6a6a6a",
              }}
            >
              {filtered.length} results
            </span>
            {hasFilter && (
              <button
                className="icon-btn"
                onClick={() => {
                  setQuery("");
                  setActiveCat(null);
                  setActiveTag(null);
                }}
                style={{
                  marginLeft: "auto",
                  padding: "3px 10px",
                  fontSize: 11,
                  borderRadius: 5,
                }}
              >
                ✕ フィルタ解除
              </button>
            )}
          </div>

          {filtered.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: GRID_COLS,
                gap: 14,
              }}
            >
              {filtered.map((cmd) => (
                <CommandCard
                  key={cmd.id}
                  command={cmd}
                  copied={copiedId === cmd.id}
                  onOpen={() => setDrawerId(cmd.id)}
                  onCopy={() => copyCode(cmd.id, cmd.code)}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "70px 20px",
                color: "#7a7a7a",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 28,
                  marginBottom: 12,
                }}
              >
                ¯\_(ツ)_/¯
              </div>
              <div style={{ fontSize: 13 }}>
                「{searchTerm}」に一致するコマンドが見つかりません
              </div>
              <div style={{ fontSize: 11.5, color: "#5f5f5f", marginTop: 6 }}>
                {canDownloadPacks
                  ? "別のキーワードを試すか、コードセットのダウンロードか Web 検索を試してみてください"
                  : "別のキーワードを試すか、Web で検索してみてください"}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <button
                  className="accent-btn"
                  onClick={() => openWebSearch(searchTerm, activeCat)}
                  style={{
                    padding: "7px 15px",
                    background: ACCENT,
                    border: "none",
                    borderRadius: 6,
                    color: "#1e1e1e",
                    fontSize: 11.5,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  ⌕ Web で検索
                </button>
                {canDownloadPacks && (
                  <button
                    className="icon-btn"
                    onClick={() => setPacksOpen(true)}
                    style={{
                      padding: "6px 14px",
                      fontSize: 11.5,
                      borderRadius: 6,
                    }}
                  >
                    ⤓ コードセットをダウンロード
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {packsOpen && (
        <PackManager
          installed={installed}
          onInstall={(id, commands) =>
            updateInstalled({ ...installed, [id]: commands })
          }
          onRemove={(id) => {
            const next = { ...installed };
            delete next[id];
            updateInstalled(next);
          }}
          onClose={() => setPacksOpen(false)}
        />
      )}

      {drawerCommand && (
        <CommandDrawer
          key={drawerCommand.id}
          command={drawerCommand}
          onClose={() => setDrawerId(null)}
        />
      )}
    </div>
  );
}

export default App;
