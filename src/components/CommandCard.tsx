import { BADGES, DEFAULT_BADGE } from "../data/commands";
import { ACCENT } from "../theme";
import type { Command } from "../types";

type Props = {
  command: Command;
  copied: boolean;
  onOpen: () => void;
  onCopy: () => void;
};

export function CommandCard({ command, copied, onOpen, onCopy }: Props) {
  const [badgeBg, badgeColor] = BADGES[command.env] || DEFAULT_BADGE;

  return (
    <article
      className="card"
      onClick={onOpen}
      title="クリックしてテンプレートを作成"
      style={{
        background: "#252526",
        border: "1px solid #333333",
        borderRadius: 8,
        padding: "16px 16px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: 0,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            padding: "2px 9px",
            borderRadius: 4,
            fontSize: 10.5,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            background: badgeBg,
            color: badgeColor,
          }}
        >
          {command.env}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: "#5f5f5f",
          }}
        >
          #{command.tag}
        </span>
      </div>

      <h3
        style={{
          margin: 0,
          fontSize: 13.5,
          fontWeight: 600,
          color: "#e8e8e8",
          lineHeight: 1.45,
          textWrap: "pretty",
        }}
      >
        {command.title}
      </h3>

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          background: "#1a1a1a",
          border: "1px solid #333333",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <code
          style={{
            flex: 1,
            padding: "11px 12px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12.5,
            color: ACCENT,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            lineHeight: 1.5,
            minWidth: 0,
          }}
        >
          {command.code}
        </code>
        <button
          className="copy-btn"
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          title="クリップボードにコピー"
          style={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "0 12px",
            background: copied ? "#1d3a2a" : "#2d2d30",
            border: "none",
            borderLeft: "1px solid #333333",
            color: copied ? "#4ade80" : "#c5c5c5",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span style={{ fontSize: 12 }}>{copied ? "✓" : "⧉"}</span>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <p
          style={{
            margin: 0,
            flex: 1,
            fontSize: 11.5,
            color: "#9a9a9a",
            lineHeight: 1.55,
          }}
        >
          💡 {command.note}
        </p>
        <span
          style={{
            flex: "none",
            fontSize: 10,
            color: "#5f5f5f",
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: "nowrap",
          }}
        >
          組み立て →
        </span>
      </div>
    </article>
  );
}
