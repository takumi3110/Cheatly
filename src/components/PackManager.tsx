import { useEffect, useState } from "react";
import { PACK_HOST_CONFIGURED } from "../config";
import { BADGES, DEFAULT_BADGE } from "../data/commands";
import { isBundledPack } from "../data/builtin";
import {
  fetchCatalog,
  fetchPack,
  type CatalogSource,
  type InstalledPacks,
  type PackMeta,
} from "../lib/packs";
import { ACCENT } from "../theme";
import type { Command } from "../types";

type Props = {
  enabled: string[];
  installed: InstalledPacks;
  onToggle: (id: string, on: boolean) => void;
  onInstall: (id: string, commands: Command[]) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
};

/** 同梱分は常に出せるので、知らせるのは「配信先の追加分が見えていない」ときだけ */
const NOTICE: Record<CatalogSource, string | null> = {
  network: null,
  cache: "⚠ 配信先に接続できないため、前回取得した一覧を表示しています",
  bundled: "⚠ 配信先に接続できないため、同梱のコードセットのみ表示しています",
};

export function PackManager({
  enabled,
  installed,
  onToggle,
  onInstall,
  onRemove,
  onClose,
}: Props) {
  const [catalog, setCatalog] = useState<PackMeta[] | null>(null);
  const [source, setSource] = useState<CatalogSource>("network");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [showOwned, setShowOwned] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchCatalog().then(({ packs, source }) => {
      if (!alive) return;
      setCatalog(packs);
      setSource(source);
    });
    return () => {
      alive = false;
    };
  }, []);

  const download = async (pack: PackMeta) => {
    setBusy((s) => ({ ...s, [pack.id]: true }));
    setErrors((s) => ({ ...s, [pack.id]: "" }));
    try {
      const commands = await fetchPack(pack.id);
      onInstall(pack.id, commands);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "取得に失敗しました";
      setErrors((s) => ({ ...s, [pack.id]: msg }));
    } finally {
      setBusy((s) => ({ ...s, [pack.id]: false }));
    }
  };

  // 配信先が未設定のうちは取得が必ず失敗するので、そちらの警告に一本化する
  const notice = PACK_HOST_CONFIGURED ? NOTICE[source] : null;
  const q = query.trim().toLowerCase();
  const matches = (p: PackMeta) =>
    !q || `${p.id} ${p.label} ${p.cat} ${p.desc}`.toLowerCase().includes(q);
  const isOwned = (p: PackMeta) =>
    isBundledPack(p.id) ? enabled.includes(p.id) : !!installed[p.id];
  const pending = (catalog ?? []).filter((p) => !isOwned(p) && matches(p));
  const owned = (catalog ?? []).filter((p) => isOwned(p) && matches(p));

  const renderRow = (pack: PackMeta) => {
    const bundled = isBundledPack(pack.id);
    const got = isOwned(pack);
    const loading = busy[pack.id];
    const error = errors[pack.id];
    const dot = (BADGES[pack.cat] || DEFAULT_BADGE)[1];

    return (
      <div
        key={pack.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          padding: "14px 15px",
          background: "#2d2d30",
          border: `1px solid ${got ? "#3d6b3d" : "#3a3a3a"}`,
          borderRadius: 9,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            flex: "none",
            borderRadius: 2,
            background: dot,
          }}
        />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#e8e8e8",
            }}
          >
            {pack.label}
            <span
              style={{
                marginLeft: 8,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 400,
                color: "#6a6a6a",
              }}
            >
              {pack.count} commands{bundled ? " · 同梱" : ""}
            </span>
          </span>
          <span
            style={{
              display: "block",
              fontSize: 11,
              color: error ? "#f87171" : "#8a8a8a",
              marginTop: 2,
            }}
          >
            {error || pack.desc}
          </span>
        </span>

        {got ? (
          <button
            className="icon-btn"
            onClick={() =>
              bundled ? onToggle(pack.id, false) : onRemove(pack.id)
            }
            style={{ flex: "none", padding: "5px 11px", fontSize: 11 }}
          >
            {bundled ? "非表示" : "削除"}
          </button>
        ) : (
          <button
            className="accent-btn"
            onClick={() => (bundled ? onToggle(pack.id, true) : download(pack))}
            disabled={loading}
            style={{
              flex: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 13px",
              background: ACCENT,
              border: "none",
              borderRadius: 6,
              color: "#1e1e1e",
              fontSize: 11.5,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {bundled ? "＋ 追加" : loading ? "取得中…" : "⤓ ダウンロード"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: "100%",
          maxHeight: "86vh",
          background: "#252526",
          border: "1px solid #3e3e42",
          borderRadius: 12,
          boxShadow: "0 24px 64px rgba(0,0,0,.5)",
          overflow: "hidden",
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
            padding: "20px 22px",
            borderBottom: "1px solid #333333",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: "0 0 4px",
                fontSize: 15,
                fontWeight: 600,
                color: "#e8e8e8",
              }}
            >
              コードセットを追加
            </h2>
            <p style={{ margin: 0, fontSize: 11.5, color: "#8a8a8a" }}>
              「同梱」はすぐ追加できます。それ以外はダウンロードすると端末に保存され、次回からオフラインでも使えます
            </p>
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

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px 22px" }}>
          {!PACK_HOST_CONFIGURED && (
            <div className="pack-notice" style={{ borderColor: "#5a4020" }}>
              ⚠ 配信先URLが未設定です（src/config.ts の REMOTE_PACK_BASE_URL）
            </div>
          )}
          {notice && <div className="pack-notice">{notice}</div>}

          <div style={{ position: "relative", marginBottom: 16 }}>
            <span
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#7a7a7a",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                pointerEvents: "none",
              }}
            >
              ⌕
            </span>
            <input
              className="field-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="コードセットを検索（例：docker, git…）"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px 10px 36px",
                background: "#1a1a1a",
                border: "1px solid #3e3e42",
                borderRadius: 7,
                color: "#e8e8e8",
                fontSize: 12.5,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {catalog === null ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#7a7a7a",
                fontSize: 12.5,
              }}
            >
              一覧を取得しています…
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {pending.map(renderRow)}

              {pending.length === 0 && owned.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: "#7a7a7a",
                    fontSize: 12,
                  }}
                >
                  「{query}」に一致するコードセットがありません
                </div>
              )}

              {owned.length > 0 && (
                <div style={{ marginTop: pending.length > 0 ? 6 : 0 }}>
                  <button
                    className="icon-btn"
                    onClick={() => setShowOwned((v) => !v)}
                    style={{
                      width: "100%",
                      justifyContent: "flex-start",
                      gap: 6,
                      padding: "8px 10px",
                      fontSize: 11.5,
                      borderRadius: 7,
                    }}
                  >
                    <span>{showOwned ? "▾" : "▸"}</span>
                    追加済み（{owned.length}）
                  </button>
                  {showOwned && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 9,
                        marginTop: 9,
                      }}
                    >
                      {owned.map(renderRow)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
