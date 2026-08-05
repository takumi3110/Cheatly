import { useEffect, useRef, useState } from "react";
import { BADGES, DEFAULT_BADGE } from "../data/commands";
import { ACCENT } from "../theme";
import type { Builder, Command } from "../types";

type Props = {
  command: Command;
  onClose: () => void;
};

function compose(b: Builder, checked: boolean[], values: string[]) {
  const fparts = b.flags.filter((_, i) => checked[i]).map((f) => f.opt);
  const aparts = b.args.map(
    (a, i) => (a.prefix || "") + ((values[i] || "").trim() || `[${a.name}]`),
  );
  if (b.sep) {
    // vim の :%s/old/new/g 形式
    return b.cmd + b.sep + aparts.join(b.sep) + b.sep + fparts.join("");
  }
  return [b.cmd, ...fparts, ...aparts].join(" ");
}

export function CommandDrawer({ command, onClose }: Props) {
  const b = command.b;
  const [checked, setChecked] = useState<boolean[]>(() =>
    b ? b.flags.map(() => false) : [],
  );
  const [values, setValues] = useState<string[]>(() =>
    b ? b.args.map(() => "") : [],
  );
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const [badgeBg, badgeColor] = BADGES[command.env] || DEFAULT_BADGE;
  const composed = b ? compose(b, checked, values) : command.code;

  const copy = () => {
    navigator.clipboard.writeText(composed).catch(() => {});
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.5)",
          zIndex: 40,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 460,
          maxWidth: "92vw",
          background: "#252526",
          borderLeft: "1px solid #3e3e42",
          boxShadow: "-8px 0 32px rgba(0,0,0,.4)",
          zIndex: 41,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            flex: "none",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "18px 20px",
            borderBottom: "1px solid #333333",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "inline-block",
                padding: "2px 9px",
                borderRadius: 4,
                fontSize: 10.5,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                background: badgeBg,
                color: badgeColor,
                marginBottom: 8,
              }}
            >
              {command.env}
            </span>
            <h2
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: "#e8e8e8",
                lineHeight: 1.4,
                textWrap: "pretty",
              }}
            >
              {command.title}
            </h2>
          </div>
          <button
            className="icon-btn"
            onClick={onClose}
            title="閉じる"
            style={{ width: 28, height: 28, fontSize: 14, borderRadius: 6 }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {b && b.flags.length > 0 && (
            <>
              <div className="section-label">オプションを選択</div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                  marginBottom: 22,
                }}
              >
                {b.flags.map((f, i) => {
                  const on = checked[i];
                  return (
                    <button
                      key={f.opt}
                      className="flag-row"
                      onClick={() => {
                        setChecked((prev) =>
                          prev.map((v, idx) => (idx === i ? !v : v)),
                        );
                        setCopied(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 11,
                        width: "100%",
                        padding: "10px 12px",
                        background: on ? "#2a3a2a" : "#2d2d30",
                        border: `1px solid ${on ? "#3d6b3d" : "#3a3a3a"}`,
                        borderRadius: 7,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          flex: "none",
                          width: 17,
                          height: 17,
                          borderRadius: 4,
                          border: `1.5px solid ${on ? "#4ade80" : "#5a5a5a"}`,
                          background: on ? "#4ade80" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#1e1e1e",
                        }}
                      >
                        {on ? "✓" : ""}
                      </span>
                      <code
                        style={{
                          flex: "none",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: ACCENT,
                          minWidth: 64,
                        }}
                      >
                        {f.opt}
                      </code>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 12,
                          color: on ? "#e8e8e8" : "#c5c5c5",
                        }}
                      >
                        {f.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {b && b.args.length > 0 && (
            <>
              <div className="section-label">引数を入力</div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginBottom: 22,
                }}
              >
                {b.args.map((a, i) => (
                  <label key={a.name} style={{ display: "block" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 11.5,
                        color: "#b5b5b5",
                        marginBottom: 5,
                      }}
                    >
                      {a.name}
                    </span>
                    <input
                      className="field-input"
                      value={values[i] || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setValues((prev) =>
                          prev.map((old, idx) => (idx === i ? v : old)),
                        );
                        setCopied(false);
                      }}
                      placeholder={a.ph || ""}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 11px",
                        background: "#1a1a1a",
                        border: "1px solid #3e3e42",
                        borderRadius: 6,
                        color: "#e8e8e8",
                        fontSize: 12.5,
                        fontFamily: "'JetBrains Mono', monospace",
                        outline: "none",
                      }}
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          <div className="section-label">完成コード</div>
          <div
            style={{
              background: "#1a1a1a",
              border: "1px solid #333333",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <code
              style={{
                display: "block",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                color: ACCENT,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                lineHeight: 1.6,
              }}
            >
              {composed}
            </code>
          </div>

          <button
            className="accent-btn"
            onClick={copy}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: 13,
              background: copied ? "#1d3a2a" : ACCENT,
              border: "none",
              borderRadius: 8,
              color: copied ? "#4ade80" : "#1e1e1e",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 15 }}>{copied ? "✓" : "⧉"}</span>
            {copied ? "コピーしました" : "コードをコピー"}
          </button>

          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "12px 14px",
              background: "#2d2d30",
              border: "1px solid #333333",
              borderRadius: 8,
            }}
          >
            <span style={{ flex: "none" }}>💡</span>
            <p
              style={{
                margin: 0,
                fontSize: 11.5,
                color: "#9a9a9a",
                lineHeight: 1.6,
              }}
            >
              {command.note}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
