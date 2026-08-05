import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/**
 * メニューバーのアイコンから開かれた時に発火する "tray-open" を購読する。
 * ブラウザでの開発時（Tauri外）は listen が失敗するので何もしない no-op を返す。
 */
export async function onTrayOpen(handler: () => void): Promise<UnlistenFn> {
  try {
    return await listen("tray-open", () => handler());
  } catch {
    return () => {};
  }
}

/** コンパクトウインドウを通常サイズに戻す。Tauri外では何もしない */
export async function expandWindow(): Promise<void> {
  try {
    await invoke("expand_window");
  } catch {
    // ブラウザでの開発時は Tauri コマンドが無いので無視
  }
}
