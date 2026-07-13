use reqwest::Client;
use scraper::{Html, Selector};
use serde::Serialize;
use serde_json::Value;
use sqlx::{Connection, SqliteConnection};
use std::{path::PathBuf, str::FromStr, time::Duration};
use tauri::{AppHandle, Manager};

const UFC_BASE_URL: &str = "https://www.ufc.com";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FighterVideo {
    id: i64,
    fighter_id: i64,
    ufc_node_id: i64,
    dve_id: i64,
    title: String,
    thumbnail_url: Option<String>,
    source_url: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoPlayback {
    hls_url: String,
    thumbnail_url: Option<String>,
    duration: Option<i64>,
}

fn database_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Video veritabanı yolu bulunamadı: {error}"))?
        .join("ufc_data.db"))
}

async fn connect_database(app: &AppHandle) -> Result<SqliteConnection, String> {
    let path = database_path(app)?;
    let options =
        sqlx::sqlite::SqliteConnectOptions::from_str(&format!("sqlite:{}", path.to_string_lossy()))
            .map_err(|error| format!("Video veritabanı ayarı hazırlanamadı: {error}"))?
            .create_if_missing(true)
            .foreign_keys(true);
    SqliteConnection::connect_with(&options)
        .await
        .map_err(|error| format!("Video veritabanı açılamadı: {error}"))
}

fn client() -> Result<Client, String> {
    Client::builder()
        .user_agent("Combat Intelligence/0.1 (+official UFC video library)")
        .timeout(Duration::from_secs(25))
        .connect_timeout(Duration::from_secs(8))
        .redirect(reqwest::redirect::Policy::limited(5))
        .build()
        .map_err(|error| format!("Video istemcisi hazırlanamadı: {error}"))
}

fn clean_text(value: &str) -> String {
    value.split_whitespace().collect::<Vec<_>>().join(" ")
}

struct ParsedVideo {
    node_id: i64,
    dve_id: i64,
    title: String,
    thumbnail_url: Option<String>,
    source_url: String,
}

fn parse_videos(html: &str) -> Result<Vec<ParsedVideo>, String> {
    let document = Html::parse_document(html);
    let card_selector = Selector::parse("a.c-card[href^='/video/']")
        .map_err(|_| "Video kartı seçicisi hazırlanamadı.".to_string())?;
    let title_selector = Selector::parse(".c-card__headline")
        .map_err(|_| "Video başlığı seçicisi hazırlanamadı.".to_string())?;
    let image_selector =
        Selector::parse("img").map_err(|_| "Video görseli seçicisi hazırlanamadı.".to_string())?;

    Ok(document
        .select(&card_selector)
        .take(12)
        .filter_map(|card| {
            let path = card.value().attr("href")?;
            let node_id = path
                .trim_start_matches("/video/")
                .split('?')
                .next()?
                .parse::<i64>()
                .ok()?;
            let dve_id = card
                .value()
                .attr("data-video-meta-id")?
                .parse::<i64>()
                .ok()?;
            let title = card
                .select(&title_selector)
                .next()
                .map(|node| clean_text(&node.text().collect::<String>()))
                .filter(|title| !title.is_empty())
                .unwrap_or_else(|| format!("UFC Video #{node_id}"));
            let thumbnail_url = card
                .select(&image_selector)
                .next()
                .and_then(|image| image.value().attr("src"))
                .map(|url| {
                    if url.starts_with('/') {
                        format!("{UFC_BASE_URL}{url}")
                    } else {
                        url.to_string()
                    }
                });

            Some(ParsedVideo {
                node_id,
                dve_id,
                title,
                thumbnail_url,
                source_url: format!("{UFC_BASE_URL}{path}"),
            })
        })
        .collect())
}

async fn cached_videos(
    connection: &mut SqliteConnection,
    fighter_id: i64,
) -> Result<Vec<FighterVideo>, String> {
    let rows = sqlx::query_as::<_, (i64, i64, i64, i64, String, Option<String>, String)>(
        "SELECT id, fighter_id, ufc_node_id, dve_id, title, thumbnail_url, source_url
         FROM fighter_videos WHERE fighter_id = ? ORDER BY id DESC LIMIT 12",
    )
    .bind(fighter_id)
    .fetch_all(connection)
    .await
    .map_err(|error| format!("Video kataloğu okunamadı: {error}"))?;

    Ok(rows
        .into_iter()
        .map(|row| FighterVideo {
            id: row.0,
            fighter_id: row.1,
            ufc_node_id: row.2,
            dve_id: row.3,
            title: row.4,
            thumbnail_url: row.5,
            source_url: row.6,
        })
        .collect())
}

#[tauri::command]
pub async fn sync_fighter_videos(
    app: AppHandle,
    fighter_id: i64,
    source_url: String,
) -> Result<Vec<FighterVideo>, String> {
    let mut connection = connect_database(&app).await?;
    if !source_url.starts_with("https://www.ufc.com/athlete/") {
        return cached_videos(&mut connection, fighter_id).await;
    }

    let response = client()?.get(&source_url).send().await;
    let html = match response {
        Ok(response) if response.status().is_success() => response
            .text()
            .await
            .map_err(|error| format!("UFC video sayfası okunamadı: {error}"))?,
        _ => return cached_videos(&mut connection, fighter_id).await,
    };

    // HTML ayrıştırma eşzamanlı yardımcıda biter; DOM referansı await sınırını geçmez.
    let parsed_videos = parse_videos(&html)?;

    for video in parsed_videos {
        sqlx::query(
            "INSERT INTO fighter_videos
             (fighter_id, ufc_node_id, dve_id, title, thumbnail_url, source_url, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(fighter_id, ufc_node_id) DO UPDATE SET
               dve_id = excluded.dve_id,
               title = excluded.title,
               thumbnail_url = excluded.thumbnail_url,
               source_url = excluded.source_url,
               updated_at = CURRENT_TIMESTAMP",
        )
        .bind(fighter_id)
        .bind(video.node_id)
        .bind(video.dve_id)
        .bind(video.title)
        .bind(video.thumbnail_url)
        .bind(video.source_url)
        .execute(&mut connection)
        .await
        .map_err(|error| format!("Video kataloğu kaydedilemedi: {error}"))?;
    }

    cached_videos(&mut connection, fighter_id).await
}

#[tauri::command]
pub async fn resolve_fighter_video(dve_id: i64) -> Result<VideoPlayback, String> {
    if dve_id <= 0 {
        return Err("Geçersiz UFC video kimliği.".into());
    }
    let client = client()?;
    let resolver_url = client
        .post(format!("{UFC_BASE_URL}/dve.php?vid={dve_id}"))
        .send()
        .await
        .map_err(|error| format!("UFC oynatma bağlantısı alınamadı: {error}"))?
        .text()
        .await
        .map_err(|error| format!("UFC oynatma yanıtı okunamadı: {error}"))?;
    let resolver_url = resolver_url.trim();
    if !resolver_url.starts_with("https://dve-api.imggaming.com/") {
        return Err("UFC geçerli bir oynatma bağlantısı döndürmedi.".into());
    }
    let payload: Value = client
        .get(resolver_url)
        .send()
        .await
        .map_err(|error| format!("Video akışı çözümlenemedi: {error}"))?
        .json()
        .await
        .map_err(|error| format!("Video akış bilgisi okunamadı: {error}"))?;
    let hls_url = payload
        .get("hlsUrl")
        .and_then(Value::as_str)
        .filter(|url| url.starts_with("https://"))
        .ok_or_else(|| "Bu UFC videosu için oynatılabilir akış bulunamadı.".to_string())?;

    Ok(VideoPlayback {
        hls_url: hls_url.to_string(),
        thumbnail_url: payload
            .get("thumbnailUrl")
            .and_then(Value::as_str)
            .map(str::to_string),
        duration: payload.get("duration").and_then(Value::as_i64),
    })
}
