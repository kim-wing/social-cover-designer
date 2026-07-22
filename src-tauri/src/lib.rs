use base64::Engine;
use std::thread;
use std::time::Duration;
use tauri::Emitter;
use tauri_plugin_updater::UpdaterExt;

const MAX_REMOTE_IMAGE_BYTES: u64 = 20 * 1024 * 1024;
const MAX_EXPORT_FILE_BYTES: usize = 80 * 1024 * 1024;
const MAX_SEEDREAM_INPUT_BYTES: usize = 30 * 1024 * 1024;
const SEEDREAM_IMAGE_RETRY_ATTEMPTS: usize = 3;
const SEEDREAM_IMAGE_ENDPOINT: &str =
    "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const SEEDREAM_MODEL: &str = "doubao-seedream-5-0-pro-260628";

#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalFont {
    family: String,
    full_name: String,
    postscript_name: String,
    style: String,
    file_name: String,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct SeedreamImageRequest {
    api_key: String,
    prompt: Option<String>,
    size: Option<String>,
    image: Option<String>,
    optimize_mode: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct RemoteAssetRequest {
    url: String,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportFileRequest {
    filename: String,
    text: Option<String>,
    data_url: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
struct SeedreamImageResponse {
    data: Option<Vec<SeedreamImageData>>,
    error: Option<SeedreamError>,
}

#[derive(Debug, serde::Deserialize)]
struct SeedreamImageData {
    b64_json: Option<String>,
    url: Option<String>,
    output_format: Option<String>,
    error: Option<SeedreamError>,
}

#[derive(Debug, serde::Deserialize)]
struct SeedreamError {
    message: String,
}

#[tauri::command]
fn app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
async fn seedream_generate_image(request: SeedreamImageRequest) -> Result<String, String> {
    if request.api_key.trim().is_empty() {
        return Err("请先填写火山方舟 API Key。".to_string());
    }
    let body = build_seedream_request_body(&request)?;
    let response = send_seedream_json_with_retry(request.api_key.trim(), &body)
        .await
        .map_err(|error| seedream_network_error_message("Seedream 请求失败", &error.to_string()))?;
    parse_seedream_image_response(response).await
}

fn build_seedream_request_body(
    request: &SeedreamImageRequest,
) -> Result<serde_json::Value, String> {
    let prompt = request
        .prompt
        .as_deref()
        .unwrap_or("")
        .trim()
        .to_string();
    if prompt.is_empty() {
        return Err("Prompt 不能为空。".to_string());
    }

    let size = request
        .size
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("2K");
    validate_seedream_output_size(size)?;
    let optimize_mode = request
        .optimize_mode
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("standard");
    if !matches!(optimize_mode, "standard" | "fast") {
        return Err("Seedream 生成模式只支持 standard 或 fast。".to_string());
    }

    let mut body = serde_json::json!({
        "model": SEEDREAM_MODEL,
        "prompt": prompt,
        "size": size,
        "response_format": "b64_json",
        "output_format": "png",
        "watermark": false,
        "optimize_prompt_options": {
            "mode": optimize_mode
        }
    });

    if let Some(image) = request
        .image
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        validate_seedream_image_input(image)?;
        body["image"] = serde_json::Value::String(image.to_string());
    }
    Ok(body)
}

fn validate_seedream_output_size(size: &str) -> Result<(), String> {
    if matches!(size, "1K" | "2K") {
        return Ok(());
    }
    let Some((width, height)) = size.split_once('x') else {
        return Err("Seedream 输出尺寸格式应为 2K 或 <宽>x<高>。".to_string());
    };
    let width = width
        .parse::<u64>()
        .map_err(|_| "Seedream 输出宽度必须是整数。".to_string())?;
    let height = height
        .parse::<u64>()
        .map_err(|_| "Seedream 输出高度必须是整数。".to_string())?;
    if width == 0 || height == 0 {
        return Err("Seedream 输出宽高必须大于 0。".to_string());
    }
    let pixels = width.saturating_mul(height);
    if !(512_u64 * 512_u64..=2048_u64 * 2048_u64).contains(&pixels) {
        return Err("Seedream 输出总像素需在 512x512 到 2048x2048 之间。".to_string());
    }
    if width > height.saturating_mul(16) || height > width.saturating_mul(16) {
        return Err("Seedream 输出比例需在 1:16 到 16:1 之间。".to_string());
    }
    Ok(())
}

fn validate_seedream_image_input(image: &str) -> Result<(), String> {
    if image.starts_with("https://") || image.starts_with("http://") {
        return Ok(());
    }
    let Some((metadata, payload)) = image.split_once(',') else {
        return Err("Seedream 参考图必须是可访问的 URL 或 Base64 Data URL。".to_string());
    };
    if !metadata.starts_with("data:image/") || !metadata.ends_with(";base64") {
        return Err("Seedream 参考图 Base64 格式不正确。".to_string());
    }
    let approximate_bytes = payload.len().saturating_mul(3) / 4;
    if approximate_bytes > MAX_SEEDREAM_INPUT_BYTES {
        return Err("Seedream 参考图不能超过 30MB。".to_string());
    }
    Ok(())
}

async fn parse_seedream_image_response(response: reqwest::Response) -> Result<String, String> {
    let status = response.status();
    let response_text = response
        .text()
        .await
        .map_err(|error| format!("Seedream 响应读取失败：{error}"))?;
    let payload = serde_json::from_str::<SeedreamImageResponse>(&response_text).map_err(|error| {
        format!("Seedream 响应解析失败：{error}。HTTP 状态：{status}")
    })?;

    if !status.is_success() {
        return Err(payload
            .error
            .map(|error| error.message)
            .unwrap_or_else(|| format!("Seedream 接口请求失败：{status}")));
    }

    if let Some(first) = payload.data.and_then(|mut data| data.drain(..).next()) {
        if let Some(error) = first.error {
            return Err(error.message);
        }
        if let Some(image) = first.b64_json {
            if image.starts_with("data:image/") {
                return Ok(image);
            }
            let output_format = first.output_format.as_deref().unwrap_or("png");
            return Ok(format!("data:image/{output_format};base64,{image}"));
        }
        if let Some(url) = first.url {
            return image_source_to_data_url(&url).await;
        }
    }

    Err("Seedream 没有返回图片数据。".to_string())
}

async fn send_seedream_json_with_retry(
    api_key: &str,
    body: &serde_json::Value,
) -> Result<reqwest::Response, reqwest::Error> {
    let client = seedream_http_client();
    let mut last_error = None;
    for attempt in 1..=SEEDREAM_IMAGE_RETRY_ATTEMPTS {
        match client
            .post(SEEDREAM_IMAGE_ENDPOINT)
            .bearer_auth(api_key)
            .header(reqwest::header::ACCEPT, "application/json")
            .json(body)
            .send()
            .await
        {
            Ok(response) => return Ok(response),
            Err(error) => {
                if attempt >= SEEDREAM_IMAGE_RETRY_ATTEMPTS || !is_retryable_reqwest_error(&error) {
                    return Err(error);
                }
                last_error = Some(error);
                thread::sleep(Duration::from_millis(650 * attempt as u64));
            }
        }
    }
    Err(last_error.expect("retry loop should have an error"))
}

fn is_retryable_reqwest_error(error: &reqwest::Error) -> bool {
    if error.is_timeout() || error.is_connect() || error.is_request() {
        return true;
    }
    let message = error.to_string().to_ascii_lowercase();
    message.contains("connection closed")
        || message.contains("incomplete message")
        || message.contains("connection reset")
        || message.contains("operation timed out")
        || message.contains("unexpected eof")
}

fn seedream_network_error_message(prefix: &str, error: &str) -> String {
    let lower = error.to_ascii_lowercase();
    if lower.contains("connection closed")
        || lower.contains("incomplete message")
        || lower.contains("unexpected eof")
        || lower.contains("connection reset")
    {
        return format!(
            "{prefix}：火山方舟连接提前中断，已自动重试 {SEEDREAM_IMAGE_RETRY_ATTEMPTS} 次仍失败。请稍后重试或检查当前网络。原始错误：{error}"
        );
    }
    if lower.contains("timed out") || lower.contains("timeout") {
        return format!(
            "{prefix}：图片生成等待超时，可能是 Seedream 排队或网络不稳定。请稍后重试，或改用快速模式。原始错误：{error}"
        );
    }
    format!("{prefix}：{error}")
}

fn seedream_http_client() -> reqwest::Client {
    http_client(Duration::from_secs(240))
}

#[cfg(test)]
mod seedream_tests {
    use super::*;

    fn request(image: Option<&str>, optimize_mode: Option<&str>) -> SeedreamImageRequest {
        SeedreamImageRequest {
            api_key: "test-key".to_string(),
            prompt: Some("生成一张旅游海报".to_string()),
            size: Some("1080x1440".to_string()),
            image: image.map(str::to_string),
            optimize_mode: optimize_mode.map(str::to_string),
        }
    }

    #[test]
    fn builds_seedream_generation_body_without_legacy_openai_fields() {
        let body = build_seedream_request_body(&request(None, Some("standard"))).unwrap();

        assert_eq!(body["model"], SEEDREAM_MODEL);
        assert_eq!(body["response_format"], "b64_json");
        assert_eq!(body["output_format"], "png");
        assert_eq!(body["watermark"], false);
        assert_eq!(body["optimize_prompt_options"]["mode"], "standard");
        assert!(body.get("image").is_none());
        assert!(body.get("n").is_none());
        assert!(body.get("quality").is_none());
        assert!(body.get("stream").is_none());
    }

    #[test]
    fn adds_reference_image_to_the_same_seedream_endpoint_body() {
        let image = "data:image/png;base64,aGVsbG8=";
        let body = build_seedream_request_body(&request(Some(image), Some("fast"))).unwrap();

        assert_eq!(body["image"], image);
        assert_eq!(body["optimize_prompt_options"]["mode"], "fast");
    }

    #[test]
    fn rejects_unsupported_mode_and_output_size() {
        assert!(build_seedream_request_body(&request(None, Some("turbo"))).is_err());
        assert!(validate_seedream_output_size("128x128").is_err());
        assert!(validate_seedream_output_size("1080x1440").is_ok());
    }
}

fn remote_asset_http_client() -> reqwest::Client {
    http_client(Duration::from_secs(45))
}

fn http_client(timeout: Duration) -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(timeout)
        .redirect(reqwest::redirect::Policy::limited(4))
        .build()
        .expect("failed to build HTTP client")
}

#[tauri::command]
fn save_export_file(request: ExportFileRequest) -> Result<String, String> {
    let filename = sanitize_export_filename(&request.filename);
    if filename.is_empty() {
        return Err("导出文件名不能为空。".to_string());
    }

    let bytes = if let Some(text) = request.text {
        let bytes = text.into_bytes();
        ensure_export_size(bytes.len())?;
        bytes
    } else if let Some(data_url) = request.data_url {
        let bytes = decode_export_data_url(&data_url)?;
        ensure_export_size(bytes.len())?;
        bytes
    } else {
        return Err("没有可导出的文件内容。".to_string());
    };

    let mut dialog = rfd::FileDialog::new().set_file_name(&filename);
    let extension = std::path::Path::new(&filename)
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    dialog = match extension.as_str() {
        "png" => dialog.add_filter("PNG 图片", &["png"]),
        "jpg" | "jpeg" => dialog.add_filter("JPG 图片", &["jpg", "jpeg"]),
        "youdesign" => dialog.add_filter("YOUDESIGN 工程", &["youdesign"]),
        _ => dialog,
    };
    let Some(path) = dialog.save_file() else {
        return Ok(String::new());
    };
    std::fs::write(&path, bytes).map_err(|error| format!("导出文件写入失败：{error}"))?;
    Ok(path.to_string_lossy().to_string())
}

fn ensure_export_size(size: usize) -> Result<(), String> {
    if size > MAX_EXPORT_FILE_BYTES {
        return Err("导出文件超过 80MB，请降低导出倍率或压缩图片后重试。".to_string());
    }
    Ok(())
}

fn sanitize_export_filename(filename: &str) -> String {
    filename
        .trim()
        .chars()
        .map(|ch| match ch {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '-',
            ch if ch.is_control() => '-',
            ch => ch,
        })
        .collect::<String>()
        .trim_matches([' ', '.'])
        .to_string()
}

fn decode_export_data_url(data_url: &str) -> Result<Vec<u8>, String> {
    let (metadata, payload) = data_url
        .split_once(',')
        .ok_or_else(|| "图片导出数据格式不正确。".to_string())?;
    if !metadata.starts_with("data:image/") || !metadata.ends_with(";base64") {
        return Err("只支持导出 base64 图片数据。".to_string());
    }
    if payload.len() > (MAX_EXPORT_FILE_BYTES * 4 / 3) + 4 {
        return Err("导出文件超过 80MB，请降低导出倍率或压缩图片后重试。".to_string());
    }
    base64::engine::general_purpose::STANDARD
        .decode(payload)
        .map_err(|error| format!("图片导出数据解析失败：{error}"))
}

async fn image_source_to_data_url(source: &str) -> Result<String, String> {
    if source.starts_with("data:image/") {
        return Ok(source.to_string());
    }
    if source.starts_with("http://") || source.starts_with("https://") {
        return download_url_as_data_url(source).await;
    }
    Ok(format!("data:image/png;base64,{source}"))
}

#[tauri::command]
async fn download_remote_asset(request: RemoteAssetRequest) -> Result<String, String> {
    let url = validate_remote_image_url(&request.url)?;
    download_url_as_data_url(url.as_str()).await
}

fn validate_remote_image_url(url: &str) -> Result<reqwest::Url, String> {
    let parsed = reqwest::Url::parse(url.trim()).map_err(|_| "图片地址格式不正确。".to_string())?;
    if !matches!(parsed.scheme(), "https" | "http") {
        return Err("只支持下载 http/https 图片资源。".to_string());
    }
    if parsed.username() != "" || parsed.password().is_some() {
        return Err("图片地址不能包含用户名或密码。".to_string());
    }
    Ok(parsed)
}

async fn download_url_as_data_url(url: &str) -> Result<String, String> {
    let response = remote_asset_http_client()
        .get(url)
        .send()
        .await
        .map_err(|error| format!("图片下载失败：{error}"))?;
    let status = response.status();
    if !status.is_success() {
        return Err(format!("图片下载失败：{status}"));
    }
    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("image/png")
        .split(';')
        .next()
        .unwrap_or("image/png")
        .to_string();
    if !content_type.starts_with("image/") {
        return Err("远程资源不是图片。".to_string());
    }
    if response.content_length().unwrap_or(0) > MAX_REMOTE_IMAGE_BYTES {
        return Err("图片超过 20MB，无法加入画布。".to_string());
    }
    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("图片读取失败：{error}"))?;
    if bytes.len() as u64 > MAX_REMOTE_IMAGE_BYTES {
        return Err("图片超过 20MB，无法加入画布。".to_string());
    }
    let encoded = base64::engine::general_purpose::STANDARD.encode(bytes);
    Ok(format!("data:{content_type};base64,{encoded}"))
}

#[tauri::command]
fn list_local_fonts() -> Vec<LocalFont> {
    let mut fonts = Vec::new();
    for dir in font_dirs() {
        collect_fonts_from_dir(&dir, &mut fonts, 0);
    }
    fonts.sort_by(|a, b| {
        a.family
            .to_lowercase()
            .cmp(&b.family.to_lowercase())
            .then_with(|| a.style.to_lowercase().cmp(&b.style.to_lowercase()))
    });
    fonts.dedup_by(|a, b| {
        a.family.eq_ignore_ascii_case(&b.family) && a.style.eq_ignore_ascii_case(&b.style)
    });
    fonts
}

fn font_dirs() -> Vec<std::path::PathBuf> {
    let mut dirs = Vec::new();

    #[cfg(target_os = "macos")]
    {
        dirs.push(std::path::PathBuf::from("/System/Library/Fonts"));
        dirs.push(std::path::PathBuf::from("/Library/Fonts"));
        if let Some(home) = std::env::var_os("HOME") {
            let home = std::path::PathBuf::from(home);
            dirs.push(home.join("Library/Fonts"));
            dirs.push(home.join("Library/Application Support/zihun_client_reborn/core-assets"));
            dirs.push(home.join("Library/Application Support/zihun_client_reborn/Cache"));
            dirs.push(home.join("Library/Application Support/hellofont"));
            dirs.push(home.join("Library/Application Support/HellFont"));
            dirs.push(home.join("Documents/ZihunClientFileCache/font-cache"));
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Some(windir) = std::env::var_os("WINDIR") {
            dirs.push(std::path::PathBuf::from(windir).join("Fonts"));
        } else {
            dirs.push(std::path::PathBuf::from(r"C:\Windows\Fonts"));
        }
        if let Some(local_app_data) = std::env::var_os("LOCALAPPDATA") {
            dirs.push(std::path::PathBuf::from(local_app_data).join("Microsoft/Windows/Fonts"));
        }
    }

    #[cfg(target_os = "linux")]
    {
        dirs.push(std::path::PathBuf::from("/usr/share/fonts"));
        dirs.push(std::path::PathBuf::from("/usr/local/share/fonts"));
        if let Some(home) = std::env::var_os("HOME") {
            dirs.push(std::path::PathBuf::from(home).join(".local/share/fonts"));
            dirs.push(std::path::PathBuf::from(home).join(".fonts"));
        }
    }

    dirs
}

fn collect_fonts_from_dir(dir: &std::path::Path, fonts: &mut Vec<LocalFont>, depth: usize) {
    if depth > 6 {
        return;
    }
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_fonts_from_dir(&path, fonts, depth + 1);
            continue;
        }
        if is_font_file(&path) || is_font_cache_file(&path) {
            collect_fonts_from_file(&path, fonts);
        }
    }
}

fn is_font_file(path: &std::path::Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| {
            matches!(
                extension.to_ascii_lowercase().as_str(),
                "ttf" | "otf" | "ttc" | "otc"
            )
        })
        .unwrap_or(false)
}

fn is_font_cache_file(path: &std::path::Path) -> bool {
    if !is_zihun_cache_path(path) {
        return false;
    }
    let Ok(metadata) = std::fs::metadata(path) else {
        return false;
    };
    if !metadata.is_file() || metadata.len() == 0 || metadata.len() > 64 * 1024 * 1024 {
        return false;
    }

    let Ok(mut file) = std::fs::File::open(path) else {
        return false;
    };
    let mut signature = [0_u8; 4];
    if std::io::Read::read_exact(&mut file, &mut signature).is_err() {
        return false;
    }
    matches!(&signature, b"OTTO" | b"ttcf" | b"true" | [0, 1, 0, 0])
}

fn is_zihun_cache_path(path: &std::path::Path) -> bool {
    let path = path.to_string_lossy();
    path.contains("zihun_client_reborn") || path.contains("ZihunClientFileCache")
}

fn collect_fonts_from_file(path: &std::path::Path, fonts: &mut Vec<LocalFont>) {
    let Ok(data) = std::fs::read(path) else {
        return;
    };
    let face_count = ttf_parser::fonts_in_collection(&data).unwrap_or(1);
    for index in 0..face_count {
        let Ok(face) = ttf_parser::Face::parse(&data, index) else {
            continue;
        };
        if let Some(font) = font_from_face(&face, path) {
            fonts.push(font);
        }
    }
}

fn font_from_face(face: &ttf_parser::Face, path: &std::path::Path) -> Option<LocalFont> {
    let mut family = None;
    let mut typographic_family = None;
    let mut full_name = None;
    let mut postscript_name = None;
    let mut style = None;

    for name in face.names() {
        let value = name.to_string();
        let Some(value) = value.filter(|value| !value.trim().is_empty()) else {
            continue;
        };
        match name.name_id {
            1 => prefer_chinese_font_name(&mut family, value),
            2 => prefer_chinese_font_name(&mut style, value),
            4 => prefer_chinese_font_name(&mut full_name, value),
            6 => {
                postscript_name.get_or_insert(value);
            }
            16 => prefer_chinese_font_name(&mut typographic_family, value),
            _ => continue,
        };
    }

    let family = typographic_family.or(family).or_else(|| full_name.clone())?;
    let style = style.unwrap_or_else(|| "Regular".to_string());
    let full_name = full_name.clone().unwrap_or_else(|| {
        if style.eq_ignore_ascii_case("regular") {
            family.clone()
        } else {
            format!("{family} {style}")
        }
    });
    let postscript_name = postscript_name.unwrap_or_else(|| full_name.replace(' ', ""));

    Some(LocalFont {
        family,
        full_name,
        postscript_name,
        style,
        file_name: path.file_name().and_then(|name| name.to_str()).unwrap_or("").to_string(),
    })
}

fn prefer_chinese_font_name(slot: &mut Option<String>, value: String) {
    match slot {
        None => *slot = Some(value),
        Some(current) if !has_chinese_text(current) && has_chinese_text(&value) => *slot = Some(value),
        _ => {}
    }
}

fn has_chinese_text(value: &str) -> bool {
    value.chars().any(|ch| ('\u{3400}'..='\u{9fff}').contains(&ch))
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
            list_local_fonts,
            seedream_generate_image,
            download_remote_asset,
            save_export_file,
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
