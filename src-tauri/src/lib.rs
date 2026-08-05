// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, LogicalSize, Manager,
};

/// メニューバーから開いた時の最小ウインドウサイズ（検索＋結果のみ表示）
const COMPACT_SIZE: (f64, f64) = (400.0, 520.0);
/// 「展開」した時の通常ウインドウサイズ
const FULL_SIZE: (f64, f64) = (800.0, 600.0);

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
                            let _ = window.center();
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
