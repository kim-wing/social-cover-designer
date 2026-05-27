use tauri::Emitter;
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
fn app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) -> Result<bool, String> {
    app.emit("youdesign:update-status", serde_json::json!({ "status": "checking" }))
        .map_err(|error| error.to_string())?;

    match app.updater().map_err(|error| error.to_string())?.check().await {
        Ok(Some(update)) => {
            app.emit(
                "youdesign:update-status",
                serde_json::json!({
                    "status": "available",
                    "version": update.version,
                    "releaseDate": update.date.map(|date| date.to_string()),
                    "releaseName": update.body
                }),
            )
            .map_err(|error| error.to_string())?;
            Ok(true)
        }
        Ok(None) => {
            app.emit("youdesign:update-status", serde_json::json!({ "status": "not-available" }))
                .map_err(|error| error.to_string())?;
            Ok(false)
        }
        Err(error) => {
            app.emit(
                "youdesign:update-status",
                serde_json::json!({ "status": "error", "message": error.to_string() }),
            )
            .map_err(|emit_error| emit_error.to_string())?;
            Err(error.to_string())
        }
    }
}

#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<bool, String> {
    app.emit("youdesign:update-status", serde_json::json!({ "status": "checking" }))
        .map_err(|error| error.to_string())?;

    let Some(update) = app
        .updater()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| error.to_string())?
    else {
        app.emit("youdesign:update-status", serde_json::json!({ "status": "not-available" }))
            .map_err(|error| error.to_string())?;
        return Ok(false);
    };

    let app_for_progress = app.clone();
    let mut downloaded = 0usize;
    update
        .download_and_install(
            move |chunk_len, content_len| {
                downloaded += chunk_len;
                let percent = content_len
                    .filter(|total| *total > 0)
                    .map(|total| ((downloaded as f64 / total as f64) * 100.0).round() as u64)
                    .unwrap_or(0);
                let _ = app_for_progress.emit(
                    "youdesign:update-status",
                    serde_json::json!({ "status": "downloading", "percent": percent }),
                );
            },
            || {},
        )
        .await
        .map_err(|error| error.to_string())?;

    app.emit("youdesign:update-status", serde_json::json!({ "status": "downloaded" }))
        .map_err(|error| error.to_string())?;
    app.restart();
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            app_version,
            check_for_updates,
            install_update
        ])
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;
                let window = _app.get_webview_window("main").expect("main window");
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running YOUDESIGN");
}
