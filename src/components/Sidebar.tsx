import { BADGES, DEFAULT_BADGE, GROUPS } from "../data/commands";
import { ACCENT } from "../theme";
import type { Command } from "../types";

type Props = {
  /** 同梱＋取得済みパックをマージしたコマンド。件数と取得済み判定に使う */
  commands: Command[];
  open: boolean;
  onToggleOpen: () => void;
  expanded: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
  activeCat: string | null;
  onSelectCat: (cat: string | null) => void;
  onOpenPacks: () => void;
};

export function Sidebar({
  commands,
  open,
  onToggleOpen,
  expanded,
  onToggleGroup,
  activeCat,
  onSelectCat,
  onOpenPacks,
}: Props) {
  const countOf = (cat: string) => commands.filter((d) => d.cat === cat).length;

  return (
    <aside
      style={{
        width: open ? "264px" : "57px",
        flex: "none",
        background: "#252526",
        borderRight: "1px solid #333333",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "width .12s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "16px 14px",
          borderBottom: "1px solid #333333",
          justifyContent: "center",
        }}
      >
        {open && (
          <>
            <div
              style={{
                width: 28,
                height: 28,
                flex: "none",
                borderRadius: 6,
                background: ACCENT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 14,
                color: "#1e1e1e",
              }}
            >
              &gt;_
            </div>
            <div style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#e8e8e8",
                  letterSpacing: ".02em",
                }}
              >
                Cheatly
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#7a7a7a",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                command cheatsheet
              </div>
            </div>
          </>
        )}
        <button
          className="icon-btn"
          onClick={onToggleOpen}
          title={open ? "サイドバーを畳む" : "サイドバーを開く"}
          style={{ width: 24, height: 24, fontSize: 11 }}
        >
          {open ? "◀" : "▶"}
        </button>
      </div>

      {open && (
        <>
          <nav
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px 8px",
              minWidth: 248,
            }}
          >
            <button
              className="side-btn"
              onClick={() => onSelectCat(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "7px 10px",
                background: activeCat ? "transparent" : "#37373d",
                border: "none",
                borderRadius: 5,
                color: activeCat ? "#c5c5c5" : "#ffffff",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                }}
              >
                ⌂
              </span>
              すべて表示
            </button>

            {GROUPS.map((group) => (
              <div key={group.key} style={{ marginBottom: 2 }}>
                <button
                  className="side-btn"
                  onClick={() => onToggleGroup(group.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "7px 10px",
                    background: "transparent",
                    border: "none",
                    borderRadius: 5,
                    color: "#c5c5c5",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "#8a8a8a",
                      width: 10,
                      flex: "none",
                      display: "inline-block",
                      transform: expanded[group.key]
                        ? "rotate(90deg)"
                        : "rotate(0deg)",
                      transition: "transform .1s",
                    }}
                  >
                    ▶
                  </span>
                  <span style={{ flex: 1 }}>{group.label}</span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: "#6a6a6a",
                    }}
                  >
                    {group.cats.reduce((n, c) => n + countOf(c), 0)}
                  </span>
                </button>

                {expanded[group.key] && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      padding: "2px 0 6px 0",
                      marginLeft: 15,
                      borderLeft: "1px solid #3a3a3a",
                    }}
                  >
                    {group.cats.map((cat) => {
                      const count = countOf(cat);
                      const active = activeCat === cat;
                      return (
                        <button
                          key={cat}
                          className="side-btn"
                          onClick={() => onSelectCat(active ? null : cat)
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            width: "calc(100% - 8px)",
                            marginLeft: 8,
                            padding: "5px 10px",
                            background: active ? "#37373d" : "transparent",
                            border: "none",
                            borderRadius: 5,
                            color: active
                                ? "#ffffff"
                                : "#a5a5a5",
                            fontSize: 12,
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              flex: "none",
                              borderRadius: 2,
                              background: (BADGES[cat] || DEFAULT_BADGE)[1],
                            }}
                          />
                          <span style={{ flex: 1 }}>{cat}</span>
                          <span style={{ fontSize: 10, color: "#6a6a6a" }}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div style={{ padding: "12px 14px", borderTop: "1px solid #333333" }}>
            <button
              className="accent-btn"
              onClick={onOpenPacks}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                width: "100%",
                padding: "10px 12px",
                background: ACCENT,
                border: "none",
                borderRadius: 7,
                color: "#1e1e1e",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 14 }}>⤓</span>
              <span
                style={{
                  flex: 1,
                  textAlign: "left",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                コードセットをダウンロード
              </span>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
