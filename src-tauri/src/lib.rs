use base64::Engine;
use std::thread;
use std::time::Duration;
use tauri::Emitter;
use tauri_plugin_updater::UpdaterExt;

const MAX_REMOTE_IMAGE_BYTES: u64 = 20 * 1024 * 1024;
const MAX_EXPORT_FILE_BYTES: usize = 80 * 1024 * 1024;
const OPENAI_IMAGE_RETRY_ATTEMPTS: usize = 3;

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
struct OpenAIImageRequest {
    api_key: String,
    api_base: Option<String>,
    model: String,
    prompt: Option<String>,
    size: Option<String>,
    quality: Option<String>,
    image: Option<String>,
    format: Option<String>,
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
struct OpenAIImageResponse {
    data: Option<Vec<OpenAIImageData>>,
    error: Option<OpenAIError>,
}

#[derive(Debug, serde::Deserialize)]
struct OpenAIImageData {
    b64_json: Option<String>,
    url: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
struct OpenAIError {
    message: String,
}

#[tauri::command]
fn app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
async fn openai_generate_image(request: OpenAIImageRequest) -> Result<String, String> {
    if request.api_key.trim().is_empty() {
        return Err("请先填写 OpenAI API Key。".to_string());
    }
    let prompt = request
        .prompt
        .as_deref()
        .unwrap_or("")
        .trim()
        .to_string();
    if prompt.is_empty() {
        return Err("Prompt 不能为空。".to_string());
    }

    let mut body = serde_json::json!({
        "model": if request.model.trim().is_empty() { "gpt-image-2" } else { request.model.trim() },
        "prompt": prompt,
        "n": 1,
    });
    if let Some(size) = request.size.filter(|value| !value.trim().is_empty()) {
        body["size"] = serde_json::Value::String(size);
    }
    if let Some(quality) = request.quality.filter(|value| !value.trim().is_empty()) {
        body["quality"] = serde_json::Value::String(quality);
    }
    if let Some(format) = request.format.filter(|value| !value.trim().is_empty()) {
        body["format"] = serde_json::Value::String(format);
    }

    let endpoint = format!("{}/images/generations", image_api_base(request.api_base.as_deref())?);
    let response = send_openai_json_with_retry(&endpoint, request.api_key.trim(), &body)
        .await
        .map_err(|error| openai_network_error_message("OpenAI 请求失败", &error.to_string()))?;

    let status = response.status();
    let payload = response
        .json::<OpenAIImageResponse>()
        .await
        .map_err(|error| format!("OpenAI 响应解析失败：{error}"))?;

    if !status.is_success() {
        return Err(payload
            .error
            .map(|error| error.message)
            .unwrap_or_else(|| format!("OpenAI 接口请求失败：{status}")));
    }

    if let Some(first) = payload.data.and_then(|mut data| data.drain(..).next()) {
        if let Some(image) = first.b64_json {
            return Ok(format!("data:image/png;base64,{image}"));
        }
        if let Some(url) = first.url {
            return image_source_to_data_url(&url).await;
        }
    }

    Err("OpenAI 没有返回图片数据。".to_string())
}

#[tauri::command]
async fn openai_edit_image(request: OpenAIImageRequest) -> Result<String, String> {
    if request.api_key.trim().is_empty() {
        return Err("请先填写 API Key。".to_string());
    }
    let prompt = request
        .prompt
        .as_deref()
        .unwrap_or("")
        .trim()
        .to_string();
    if prompt.is_empty() {
        return Err("编辑要求不能为空。".to_string());
    }
    let image = request
        .image
        .as_deref()
        .unwrap_or("")
        .trim()
        .to_string();
    if image.is_empty() {
        return Err("缺少要编辑的图片。".to_string());
    }

    let image_bytes = decode_image_base64(&image)?;
    let endpoint = format!("{}/images/edits", image_api_base(request.api_base.as_deref())?);
    let model = if request.model.trim().is_empty() {
        "gpt-image-2".to_string()
    } else {
        request.model.trim().to_string()
    };
    let size = request.size.filter(|value| !value.trim().is_empty());
    let quality = request.quality.filter(|value| !value.trim().is_empty());
    let format = request.format.filter(|value| !value.trim().is_empty());
    let response = send_openai_multipart_with_retry(&endpoint, request.api_key.trim(), || {
        build_openai_edit_form(
            image_bytes.clone(),
            model.clone(),
            prompt.clone(),
            size.clone(),
            quality.clone(),
            format.clone(),
        )
    })
    .await
    .map_err(|error| openai_network_error_message("图片编辑请求失败", &error))?;

    parse_openai_image_response(response, "图片编辑接口请求失败").await
}

fn decode_image_base64(value: &str) -> Result<Vec<u8>, String> {
    let payload = value
        .split_once(',')
        .map(|(_, payload)| payload)
        .unwrap_or(value)
        .trim();
    if payload.is_empty() {
        return Err("缺少要编辑的图片。".to_string());
    }
    base64::engine::general_purpose::STANDARD
        .decode(payload)
        .map_err(|error| format!("图片数据解析失败：{error}"))
}

async fn parse_openai_image_response(
    response: reqwest::Response,
    error_prefix: &str,
) -> Result<String, String> {
    let status = response.status();
    let payload = response
        .json::<OpenAIImageResponse>()
        .await
        .map_err(|error| format!("图片接口响应解析失败：{error}"))?;

    if !status.is_success() {
        return Err(payload
            .error
            .map(|error| error.message)
            .unwrap_or_else(|| format!("{error_prefix}：{status}")));
    }

    if let Some(first) = payload.data.and_then(|mut data| data.drain(..).next()) {
        if let Some(image) = first.b64_json {
            return Ok(format!("data:image/png;base64,{image}"));
        }
        if let Some(url) = first.url {
            return image_source_to_data_url(&url).await;
        }
    }

    Err("图片接口没有返回图片数据。".to_string())
}

fn build_openai_edit_form(
    image_bytes: Vec<u8>,
    model: String,
    prompt: String,
    size: Option<String>,
    quality: Option<String>,
    format: Option<String>,
) -> Result<reqwest::multipart::Form, String> {
    let image_part = reqwest::multipart::Part::bytes(image_bytes)
        .file_name("image.png")
        .mime_str("image/png")
        .map_err(|error| format!("图片表单构造失败：{error}"))?;
    let mut form = reqwest::multipart::Form::new()
        .text("model", model)
        .part("image", image_part)
        .text("prompt", prompt)
        .text("n", "1");
    if let Some(size) = size {
        form = form.text("size", size);
    }
    if let Some(quality) = quality {
        form = form.text("quality", quality);
    }
    if let Some(format) = format {
        form = form.text("format", format);
    }
    Ok(form)
}

async fn send_openai_json_with_retry(
    endpoint: &str,
    api_key: &str,
    body: &serde_json::Value,
) -> Result<reqwest::Response, reqwest::Error> {
    let client = openai_http_client();
    let mut last_error = None;
    for attempt in 1..=OPENAI_IMAGE_RETRY_ATTEMPTS {
        match client
            .post(endpoint)
            .bearer_auth(api_key)
            .header(reqwest::header::ACCEPT, "application/json")
            .json(body)
            .send()
            .await
        {
            Ok(response) => return Ok(response),
            Err(error) => {
                if attempt >= OPENAI_IMAGE_RETRY_ATTEMPTS || !is_retryable_reqwest_error(&error) {
                    return Err(error);
                }
                last_error = Some(error);
                thread::sleep(Duration::from_millis(650 * attempt as u64));
            }
        }
    }
    Err(last_error.expect("retry loop should have an error"))
}

async fn send_openai_multipart_with_retry<F>(
    endpoint: &str,
    api_key: &str,
    mut build_form: F,
) -> Result<reqwest::Response, String>
where
    F: FnMut() -> Result<reqwest::multipart::Form, String>,
{
    let client = openai_http_client();
    let mut last_error = None;
    for attempt in 1..=OPENAI_IMAGE_RETRY_ATTEMPTS {
        let form = build_form()?;
        match client
            .post(endpoint)
            .bearer_auth(api_key)
            .header(reqwest::header::ACCEPT, "application/json")
            .multipart(form)
            .send()
            .await
        {
            Ok(response) => return Ok(response),
            Err(error) => {
                if attempt >= OPENAI_IMAGE_RETRY_ATTEMPTS || !is_retryable_reqwest_error(&error) {
                    return Err(error.to_string());
                }
                last_error = Some(error.to_string());
                thread::sleep(Duration::from_millis(650 * attempt as u64));
            }
        }
    }
    Err(last_error.unwrap_or_else(|| "未知网络错误".to_string()))
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

fn openai_network_error_message(prefix: &str, error: &str) -> String {
    let lower = error.to_ascii_lowercase();
    if lower.contains("connection closed")
        || lower.contains("incomplete message")
        || lower.contains("unexpected eof")
        || lower.contains("connection reset")
    {
        return format!(
            "{prefix}：图片接口连接提前中断，已自动重试 {OPENAI_IMAGE_RETRY_ATTEMPTS} 次仍失败。通常是 QuickRouter 网关或当前网络临时断连导致，请稍后重试，或切换网络/API Base。原始错误：{error}"
        );
    }
    if lower.contains("timed out") || lower.contains("timeout") {
        return format!(
            "{prefix}：图片生成等待超时，可能是模型排队或网络不稳定。请稍后重试，或降低生成质量后再试。原始错误：{error}"
        );
    }
    format!("{prefix}：{error}")
}

fn image_api_base(value: Option<&str>) -> Result<String, String> {
    let base = value
        .unwrap_or("https://api.quickrouter.ai/v1")
        .trim()
        .trim_end_matches('/');
    if !(base.starts_with("https://") || base.starts_with("http://")) {
        return Err("图片 API Base 必须以 http:// 或 https:// 开头。".to_string());
    }
    Ok(base.to_string())
}

fn openai_http_client() -> reqwest::Client {
    http_client(Duration::from_secs(180))
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
            dirs.push(std::path::PathBuf::from(home).join("Library/Fonts"));
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
        if is_font_file(&path) {
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
            openai_generate_image,
            openai_edit_image,
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
