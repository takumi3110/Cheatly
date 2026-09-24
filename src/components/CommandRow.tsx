import { ACCENT } from "../theme";
import type { Command } from "../types";

type Props = {
  command: Command;
  copied: boolean;
  onOpen: () => void;
  onCopy: () => void;
};

/** カテゴリ絞り込み時のチートシート表示用。カードより密に1行1コマンドで並べる */
export function CommandRow({ command, copied, onOpen, onCopy }: Props) {
  return (
    <div
      className="cmd-row"
      onClick={onOpen}
      title="クリックしてテンプレートを作成"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(140px, 2fr) minmax(0, 3fr) auto",
        alignItems: "center",
        gap: 14,
        padding: "8px 10px 8px 14px",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          fontSize: 12.5,
          color: "#e8e8e8",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {command.title}
      </span>
      <code
        title={command.code}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: ACCENT,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
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
          width: 30,
          height: 26,
          background: copied ? "#1d3a2a" : "#2d2d30",
          border: "1px solid #3a3a3a",
          borderRadius: 5,
          color: copied ? "#4ade80" : "#c5c5c5",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        {copied ? "✓" : "⧉"}
      </button>
    </div>
  );
}
