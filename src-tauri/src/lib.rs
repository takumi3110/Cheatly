// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, LogicalSize, Manager, PhysicalPosition, Rect, WebviewWindow,
};

/// メニューバーから開いた時の最小ウインドウサイズ（検索＋結果のみ表示）
const COMPACT_SIZE: (f64, f64) = (400.0, 520.0);
/// 「展開」した時の通常ウインドウサイズ
const FULL_SIZE: (f64, f64) = (800.0, 600.0);
/// トレイアイコン・画面端とウインドウの間隔（論理px）
const EDGE_GAP: f64 = 8.0;

/// 物理ピクセルの矩形（左上座標と大きさ）
#[derive(Clone, Copy)]
struct PixelRect {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

/**
 * トレイアイコンの真下・中央そろえになるウインドウ左上座標を返す。
 * 作業領域 `area` からはみ出す場合は内側に寄せる。全て物理ピクセル。
 * 収まらないほど作業領域が狭い場合は左上を優先する。
 */
fn place_under_icon(
    icon: PixelRect,
    win: (f64, f64),
    area: Option<PixelRect>,
    scale: f64,
) -> (f64, f64) {
    let (win_w, win_h) = win;
    let gap = EDGE_GAP * scale;
    let x = icon.x + icon.width / 2.0 - win_w / 2.0;
    let y = icon.y + icon.height + gap;
    let Some(area) = area else {
        return (x, y);
    };
    (
        x.min(area.x + area.width - win_w - gap).max(area.x + gap),
        y.min(area.y + area.height - win_h - gap).max(area.y + gap),
    )
}

/**
 * トレイアイコンの真下にコンパクトウインドウを移動する。
 * サイズ変更はイベントループ越しで即座には反映されないため、
 * 実サイズではなく COMPACT_SIZE から座標を計算する。
 */
fn move_under_tray(window: &WebviewWindow, tray: Rect) {
    let scale = window.scale_factor().unwrap_or(1.0);
    let pos = tray.position.to_physical::<f64>(scale);
    let size = tray.size.to_physical::<f64>(scale);
    let icon = PixelRect {
        x: pos.x,
        y: pos.y,
        width: size.width,
        height: size.height,
    };
    let win = (COMPACT_SIZE.0 * scale, COMPACT_SIZE.1 * scale);

    // クリックされたアイコンのあるディスプレイに合わせる（マルチディスプレイ対策）
    let monitor = window
        .monitor_from_point(icon.x + icon.width / 2.0, icon.y + icon.height / 2.0)
        .ok()
        .flatten()
        .or_else(|| window.primary_monitor().ok().flatten());
    let area = monitor.map(|m| {
        let work = m.work_area();
        PixelRect {
            x: work.position.x as f64,
            y: work.position.y as f64,
            width: work.size.width as f64,
            height: work.size.height as f64,
        }
    });

    let (x, y) = place_under_icon(icon, win, area, scale);
    let _ = window.set_position(PhysicalPosition::new(x, y));
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// コンパクトウインドウから通常サイズへ戻す。フロントの「展開」ボタンから呼ばれる
#[tauri::command]
fn expand_window(window: tauri::WebviewWindow) {
    let _ = window.set_size(LogicalSize::new(FULL_SIZE.0, FULL_SIZE.1));
    let _ = window.center();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        rect,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        let Some(window) = app.get_webview_window("main") else {
                            return;
                        };
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ =
                                window.set_size(LogicalSize::new(COMPACT_SIZE.0, COMPACT_SIZE.1));
                            move_under_tray(&window, rect);
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = app.emit("tray-open", ());
                        }
                    }
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, expand_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    /// メニューバー下の 1920x1080 ディスプレイを想定した作業領域
    const AREA: PixelRect = PixelRect {
        x: 0.0,
        y: 25.0,
        width: 1920.0,
        height: 1055.0,
    };
    const WIN: (f64, f64) = (400.0, 520.0);

    fn icon_at(x: f64) -> PixelRect {
        PixelRect {
            x,
            y: 0.0,
            width: 24.0,
            height: 24.0,
        }
    }

    #[test]
    fn centers_under_the_icon() {
        // x: アイコン中央 812 - 幅の半分 200 = 612
        // y: アイコン下端 24 は作業領域の上端 25 より上なので 25 + 間隔 8 に押し下げられる
        assert_eq!(
            place_under_icon(icon_at(800.0), WIN, Some(AREA), 1.0),
            (612.0, 33.0)
        );
    }

    #[test]
    fn keeps_window_inside_the_right_edge() {
        // 右端のアイコンだと 1712 になってしまうので 1920-400-8 に寄せる
        assert_eq!(
            place_under_icon(icon_at(1900.0), WIN, Some(AREA), 1.0),
            (1512.0, 33.0)
        );
    }

    #[test]
    fn keeps_window_inside_a_left_side_display() {
        // 左に並べたサブディスプレイ（原点が負）でも作業領域内に収まる
        let area = PixelRect { x: -1920.0, ..AREA };
        assert_eq!(
            place_under_icon(icon_at(-1910.0), WIN, Some(area), 1.0),
            (-1912.0, 33.0)
        );
    }

    #[test]
    fn scales_the_gap_with_the_scale_factor() {
        // Retina では間隔も物理ピクセルへ倍化する（アイコン下端 48 + 8*2 = 64）
        let area = PixelRect {
            x: 0.0,
            y: 0.0,
            width: 3840.0,
            height: 2160.0,
        };
        let icon = PixelRect {
            x: 1600.0,
            y: 0.0,
            width: 48.0,
            height: 48.0,
        };
        assert_eq!(
            place_under_icon(icon, (800.0, 1040.0), Some(area), 2.0).1,
            64.0
        );
    }
}
