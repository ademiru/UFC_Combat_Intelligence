use chrono::{Datelike, Utc};
use futures::{stream, StreamExt};
use regex::Regex;
use reqwest::Client;
use scraper::{Html, Selector};
use serde::Serialize;
use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode},
    Connection, SqliteConnection,
};
use std::{
    collections::HashSet,
    hash::{DefaultHasher, Hash, Hasher},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    },
    time::Duration,
};
use tauri::{AppHandle, Emitter, Manager};

const UFC_BASE_URL: &str = "https://www.ufc.com";
const MAX_UPCOMING_EVENTS: usize = 5;
const PROFILE_CONCURRENCY: usize = 6;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncProgress {
    stage: String,
    message: String,
    current: usize,
    total: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncReport {
    fighter_profiles_updated: usize,
    fight_history_updated: usize,
    champions_updated: usize,
    events_updated: usize,
    fights_updated: usize,
    synced_at: String,
    source: String,
    warnings: Vec<String>,
}

#[derive(Clone, Debug)]
struct ChampionUpdate {
    weight_class: String,
    name: String,
    source_url: String,
    display_order: i64,
}

#[derive(Clone, Debug)]
struct FightUpdate {
    fighter1_name: String,
    fighter1_url: String,
    fighter2_name: String,
    fighter2_url: String,
    weight_class: String,
    card_type: String,
    bout_order: i64,
}

#[derive(Clone, Debug)]
struct EventUpdate {
    name: String,
    date: String,
    location: String,
    start_time: String,
    source_url: String,
    fights: Vec<FightUpdate>,
}

#[derive(Clone, Debug)]
struct FighterUpdate {
    name: String,
    source_url: String,
    image_url: String,
    image_path: String,
    weight_class: String,
    wins: i64,
    losses: i64,
    draws: i64,
    win_streak: i64,
    ko_wins: i64,
    submission_wins: i64,
    decision_wins: i64,
    height: f64,
    weight: f64,
    reach: f64,
    slpm: f64,
    str_acc: f64,
    sapm: f64,
    str_def: f64,
    td_avg: f64,
    td_acc: f64,
    td_def: f64,
    sub_avg: f64,
    head_pct: i64,
    body_pct: i64,
    leg_pct: i64,
    fight_history: Vec<FightHistoryUpdate>,
}

#[derive(Clone, Debug)]
struct FightHistoryUpdate {
    opponent_name: String,
    opponent_url: String,
    result: String,
    fight_date: String,
    event_name: String,
    event_url: String,
    method: String,
    round: i64,
    fight_time: String,
}

#[tauri::command]
pub async fn sync_online_data(app: AppHandle) -> Result<SyncReport, String> {
    emit_progress(&app, "connecting", "Resmî UFC kaynağına bağlanılıyor", 0, 1);

    let client = Client::builder()
        .user_agent("UFC Panel/0.1 (+local-first desktop analytics)")
        .timeout(Duration::from_secs(25))
        .connect_timeout(Duration::from_secs(10))
        .redirect(reqwest::redirect::Policy::limited(5))
        .build()
        .map_err(|error| format!("HTTP istemcisi hazırlanamadı: {error}"))?;

    let mut warnings = Vec::new();

    emit_progress(&app, "rankings", "Güncel şampiyonlar alınıyor", 0, 1);
    let rankings_html = fetch_html(&client, &format!("{UFC_BASE_URL}/rankings")).await?;
    let champions = parse_rankings(&rankings_html);
    if champions.is_empty() {
        return Err("UFC sıralama sayfasında şampiyon verisi bulunamadı.".into());
    }

    emit_progress(
        &app,
        "events",
        "Yaklaşan etkinlikler ve kartlar alınıyor",
        0,
        MAX_UPCOMING_EVENTS,
    );
    let events_index = fetch_html(&client, &format!("{UFC_BASE_URL}/events")).await?;
    let event_urls = parse_event_links(&events_index)
        .into_iter()
        .take(MAX_UPCOMING_EVENTS)
        .collect::<Vec<_>>();
    let event_total = event_urls.len();
    let event_counter = Arc::new(AtomicUsize::new(0));

    let event_results = stream::iter(event_urls.into_iter().map(|url| {
        let client = client.clone();
        let app = app.clone();
        let event_counter = Arc::clone(&event_counter);
        async move {
            let result = fetch_html(&client, &url)
                .await
                .and_then(|html| parse_event_page(&url, &html));
            let completed = event_counter.fetch_add(1, Ordering::Relaxed) + 1;
            emit_progress(
                &app,
                "events",
                "Etkinlik kartları güncelleniyor",
                completed,
                event_total,
            );
            (url, result)
        }
    }))
    .buffer_unordered(3)
    .collect::<Vec<_>>()
    .await;

    let mut events = Vec::new();
    for (url, result) in event_results {
        match result {
            Ok(event) => events.push(event),
            Err(error) => warnings.push(format!("Etkinlik atlandı ({url}): {error}")),
        }
    }
    events.sort_by(|first, second| first.date.cmp(&second.date));
    let mut seen_event_keys = HashSet::new();
    events.retain(|event| seen_event_keys.insert((event.name.to_lowercase(), event.date.clone())));

    let database_path = database_path(&app)?;
    let mut connection = connect_database(&database_path).await?;
    let existing_urls = sqlx::query_scalar::<_, String>(
        "SELECT source_url FROM fighters WHERE source_url IS NOT NULL AND is_active = 1",
    )
    .fetch_all(&mut connection)
    .await
    .map_err(|error| format!("Yerel sporcu kaynakları okunamadı: {error}"))?;
    connection
        .close()
        .await
        .map_err(|error| format!("Veritabanı bağlantısı kapatılamadı: {error}"))?;

    let mut profile_urls = existing_urls.into_iter().collect::<HashSet<_>>();
    for champion in &champions {
        profile_urls.insert(champion.source_url.clone());
    }
    for event in &events {
        for fight in &event.fights {
            profile_urls.insert(fight.fighter1_url.clone());
            profile_urls.insert(fight.fighter2_url.clone());
        }
    }
    let mut profile_urls = profile_urls.into_iter().collect::<Vec<_>>();
    profile_urls.sort();
    let profile_total = profile_urls.len();
    let profile_counter = Arc::new(AtomicUsize::new(0));
    let image_directory = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Fotoğraf önbellek yolu hazırlanamadı: {error}"))?
        .join("fighter-images");
    tokio::fs::create_dir_all(&image_directory)
        .await
        .map_err(|error| format!("Fotoğraf önbelleği oluşturulamadı: {error}"))?;

    emit_progress(
        &app,
        "fighters",
        "Sporcu profilleri ve performans metrikleri alınıyor",
        0,
        profile_total,
    );
    let profile_results = stream::iter(profile_urls.into_iter().map(|url| {
        let client = client.clone();
        let app = app.clone();
        let profile_counter = Arc::clone(&profile_counter);
        let image_directory = image_directory.clone();
        async move {
            let result = match fetch_html(&client, &url).await {
                Ok(html) => match parse_fighter_profile(&url, &html) {
                    Ok(mut profile) => {
                        profile.fight_history = parse_fight_history(&url, &html);
                        if profile.fight_history.len() < 5 {
                            let next_page_url = format!("{url}?page=1");
                            if let Ok(next_page) = fetch_html(&client, &next_page_url).await {
                                profile
                                    .fight_history
                                    .extend(parse_fight_history(&url, &next_page));
                            }
                        }
                        profile
                            .fight_history
                            .sort_by(|first, second| second.fight_date.cmp(&first.fight_date));
                        let mut seen_fights = HashSet::new();
                        profile.fight_history.retain(|fight| {
                            seen_fights.insert((
                                fight.opponent_name.to_lowercase(),
                                fight.fight_date.clone(),
                            ))
                        });
                        profile.fight_history.truncate(5);

                        if !profile.image_url.is_empty() {
                            profile.image_path = cache_fighter_image(
                                &client,
                                &image_directory,
                                &profile.source_url,
                                &profile.image_url,
                            )
                            .await
                            .unwrap_or_default();
                        }
                        Ok(profile)
                    }
                    Err(error) => Err(error),
                },
                Err(error) => Err(error),
            };
            let completed = profile_counter.fetch_add(1, Ordering::Relaxed) + 1;
            emit_progress(
                &app,
                "fighters",
                "Sporcu metrikleri işleniyor",
                completed,
                profile_total,
            );
            (url, result)
        }
    }))
    .buffer_unordered(PROFILE_CONCURRENCY)
    .collect::<Vec<_>>()
    .await;

    let mut profiles = Vec::new();
    for (url, result) in profile_results {
        match result {
            Ok(profile) => profiles.push(profile),
            Err(error) => warnings.push(format!("Sporcu profili atlandı ({url}): {error}")),
        }
    }

    emit_progress(
        &app,
        "saving",
        "Güncel veriler güvenli biçimde SQLite'a yazılıyor",
        0,
        1,
    );
    let synced_at = Utc::now().to_rfc3339();
    let mut connection = connect_database(&database_path).await?;
    let mut transaction = connection
        .begin()
        .await
        .map_err(|error| format!("Güncelleme işlemi başlatılamadı: {error}"))?;

    for profile in &profiles {
        sqlx::query(
            r#"
            INSERT INTO fighters (
                name, weight_class, height, weight, reach, wins, losses, draws,
                win_streak, ko_wins, submission_wins, decision_wins, is_active,
                style, source_url, source_updated_at, image_url, image_path
            ) VALUES (?, ?, NULLIF(?, 0), NULLIF(?, 0), NULLIF(?, 0), ?, ?, ?, ?, ?, ?, ?, 1, 'Mixed', ?, ?, NULLIF(?, ''), NULLIF(?, ''))
            ON CONFLICT DO UPDATE SET
                weight_class = excluded.weight_class,
                height = COALESCE(excluded.height, fighters.height),
                weight = COALESCE(excluded.weight, fighters.weight),
                reach = COALESCE(excluded.reach, fighters.reach),
                wins = excluded.wins,
                losses = excluded.losses,
                draws = excluded.draws,
                win_streak = excluded.win_streak,
                ko_wins = excluded.ko_wins,
                submission_wins = excluded.submission_wins,
                decision_wins = excluded.decision_wins,
                source_url = excluded.source_url,
                source_updated_at = excluded.source_updated_at,
                image_url = COALESCE(excluded.image_url, fighters.image_url),
                image_path = COALESCE(excluded.image_path, fighters.image_path),
                updated_at = CURRENT_TIMESTAMP
            "#,
        )
        .bind(&profile.name)
        .bind(&profile.weight_class)
        .bind(profile.height)
        .bind(profile.weight)
        .bind(profile.reach)
        .bind(profile.wins)
        .bind(profile.losses)
        .bind(profile.draws)
        .bind(profile.win_streak)
        .bind(profile.ko_wins)
        .bind(profile.submission_wins)
        .bind(profile.decision_wins)
        .bind(&profile.source_url)
        .bind(&synced_at)
        .bind(&profile.image_url)
        .bind(&profile.image_path)
        .execute(&mut *transaction)
        .await
        .map_err(|error| format!("{} kaydedilemedi: {error}", profile.name))?;

        let fighter_id = sqlx::query_scalar::<_, i64>(
            "SELECT id FROM fighters WHERE source_url = ? OR name = ? COLLATE NOCASE LIMIT 1",
        )
        .bind(&profile.source_url)
        .bind(&profile.name)
        .fetch_one(&mut *transaction)
        .await
        .map_err(|error| format!("{} yerel kimliği bulunamadı: {error}", profile.name))?;

        sqlx::query(
            r#"
            INSERT INTO fighter_stats (
                fighter_id, slpm, str_acc, sapm, str_def, td_avg, td_acc,
                td_def, sub_avg, head_pct, body_pct, leg_pct, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(fighter_id) DO UPDATE SET
                slpm = CASE WHEN excluded.slpm > 0 THEN excluded.slpm ELSE fighter_stats.slpm END,
                str_acc = CASE WHEN excluded.str_acc > 0 THEN excluded.str_acc ELSE fighter_stats.str_acc END,
                sapm = CASE WHEN excluded.sapm > 0 THEN excluded.sapm ELSE fighter_stats.sapm END,
                str_def = CASE WHEN excluded.str_def > 0 THEN excluded.str_def ELSE fighter_stats.str_def END,
                td_avg = CASE WHEN excluded.td_avg > 0 THEN excluded.td_avg ELSE fighter_stats.td_avg END,
                td_acc = CASE WHEN excluded.td_acc > 0 THEN excluded.td_acc ELSE fighter_stats.td_acc END,
                td_def = CASE WHEN excluded.td_def > 0 THEN excluded.td_def ELSE fighter_stats.td_def END,
                sub_avg = CASE WHEN excluded.sub_avg > 0 THEN excluded.sub_avg ELSE fighter_stats.sub_avg END,
                head_pct = CASE WHEN excluded.head_pct > 0 THEN excluded.head_pct ELSE fighter_stats.head_pct END,
                body_pct = CASE WHEN excluded.body_pct > 0 THEN excluded.body_pct ELSE fighter_stats.body_pct END,
                leg_pct = CASE WHEN excluded.leg_pct > 0 THEN excluded.leg_pct ELSE fighter_stats.leg_pct END,
                updated_at = CURRENT_TIMESTAMP
            "#,
        )
        .bind(fighter_id)
        .bind(profile.slpm)
        .bind(profile.str_acc)
        .bind(profile.sapm)
        .bind(profile.str_def)
        .bind(profile.td_avg)
        .bind(profile.td_acc)
        .bind(profile.td_def)
        .bind(profile.sub_avg)
        .bind(profile.head_pct)
        .bind(profile.body_pct)
        .bind(profile.leg_pct)
        .execute(&mut *transaction)
        .await
        .map_err(|error| format!("{} istatistikleri kaydedilemedi: {error}", profile.name))?;

        if !profile.fight_history.is_empty() {
            sqlx::query("DELETE FROM fighter_fight_history WHERE fighter_id = ?")
                .bind(fighter_id)
                .execute(&mut *transaction)
                .await
                .map_err(|error| format!("{} maç geçmişi temizlenemedi: {error}", profile.name))?;

            for fight in &profile.fight_history {
                sqlx::query(
                    r#"
                    INSERT INTO fighter_fight_history (
                        fighter_id, opponent_name, opponent_url, result, fight_date,
                        event_name, event_url, method, round, fight_time, source_updated_at
                    ) VALUES (?, ?, NULLIF(?, ''), ?, ?, ?, NULLIF(?, ''), ?, ?, ?, ?)
                    "#,
                )
                .bind(fighter_id)
                .bind(&fight.opponent_name)
                .bind(&fight.opponent_url)
                .bind(&fight.result)
                .bind(&fight.fight_date)
                .bind(&fight.event_name)
                .bind(&fight.event_url)
                .bind(&fight.method)
                .bind(fight.round)
                .bind(&fight.fight_time)
                .bind(&synced_at)
                .execute(&mut *transaction)
                .await
                .map_err(|error| format!("{} maç geçmişi kaydedilemedi: {error}", profile.name))?;
            }
        }
    }

    sqlx::query("DELETE FROM champions")
        .execute(&mut *transaction)
        .await
        .map_err(|error| format!("Şampiyon tablosu yenilenemedi: {error}"))?;

    for champion in &champions {
        let fighter_id = ensure_minimal_fighter(
            &mut transaction,
            &champion.name,
            &champion.weight_class,
            &champion.source_url,
        )
        .await?;

        sqlx::query(
            "INSERT INTO champions(weight_class, fighter_id, display_order, since_text) VALUES (?, ?, ?, 'Live UFC sync')",
        )
        .bind(&champion.weight_class)
        .bind(fighter_id)
        .bind(champion.display_order)
        .execute(&mut *transaction)
        .await
        .map_err(|error| format!("{} şampiyonluğu kaydedilemedi: {error}", champion.name))?;
    }

    let today = Utc::now().date_naive().format("%Y-%m-%d").to_string();
    sqlx::query("UPDATE events SET status = 'archived' WHERE date < ?")
        .bind(&today)
        .execute(&mut *transaction)
        .await
        .map_err(|error| format!("Eski etkinlik durumları güncellenemedi: {error}"))?;

    let mut fights_updated = 0usize;
    for event in &events {
        sqlx::query(
            r#"
            INSERT INTO events(name, date, location, start_time, status, source_url)
            VALUES (?, ?, ?, ?, 'upcoming', ?)
            ON CONFLICT DO UPDATE SET
                name = excluded.name,
                date = excluded.date,
                location = excluded.location,
                start_time = excluded.start_time,
                status = 'upcoming',
                source_url = excluded.source_url
            "#,
        )
        .bind(&event.name)
        .bind(&event.date)
        .bind(&event.location)
        .bind(&event.start_time)
        .bind(&event.source_url)
        .execute(&mut *transaction)
        .await
        .map_err(|error| format!("{} etkinliği kaydedilemedi: {error}", event.name))?;

        let event_id =
            sqlx::query_scalar::<_, i64>("SELECT id FROM events WHERE source_url = ? LIMIT 1")
                .bind(&event.source_url)
                .fetch_one(&mut *transaction)
                .await
                .map_err(|error| format!("{} etkinlik kimliği bulunamadı: {error}", event.name))?;

        sqlx::query("DELETE FROM fights WHERE event_id = ?")
            .bind(event_id)
            .execute(&mut *transaction)
            .await
            .map_err(|error| format!("{} eski kartı temizlenemedi: {error}", event.name))?;

        for fight in &event.fights {
            let fighter1_id = ensure_minimal_fighter(
                &mut transaction,
                &fight.fighter1_name,
                &fight.weight_class,
                &fight.fighter1_url,
            )
            .await?;
            let fighter2_id = ensure_minimal_fighter(
                &mut transaction,
                &fight.fighter2_name,
                &fight.weight_class,
                &fight.fighter2_url,
            )
            .await?;

            sqlx::query(
                r#"
                INSERT INTO fights (
                    event_id, fighter1_id, fighter2_id, weight_class,
                    card_type, bout_order
                ) VALUES (?, ?, ?, ?, ?, ?)
                "#,
            )
            .bind(event_id)
            .bind(fighter1_id)
            .bind(fighter2_id)
            .bind(&fight.weight_class)
            .bind(&fight.card_type)
            .bind(fight.bout_order)
            .execute(&mut *transaction)
            .await
            .map_err(|error| format!("{} eşleşmesi kaydedilemedi: {error}", event.name))?;
            fights_updated += 1;
        }
    }

    let cached_images = profiles
        .iter()
        .filter(|profile| !profile.image_path.is_empty())
        .count()
        .to_string();
    let fight_history_updated = profiles
        .iter()
        .map(|profile| profile.fight_history.len())
        .sum::<usize>();
    let fight_history_entries = fight_history_updated.to_string();
    let metadata = [
        ("dataset_snapshot", today.as_str()),
        ("dataset_source", "UFC.com live sync"),
        ("dataset_mode", "online cache"),
        ("online_mode_enabled", "1"),
        ("last_online_sync", synced_at.as_str()),
        ("online_sync_status", "success"),
        ("online_source", UFC_BASE_URL),
        ("fighter_images_cached", cached_images.as_str()),
        ("fight_history_entries", fight_history_entries.as_str()),
    ];
    for (key, value) in metadata {
        sqlx::query(
            r#"
            INSERT INTO app_metadata(key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
            "#,
        )
        .bind(key)
        .bind(value)
        .execute(&mut *transaction)
        .await
        .map_err(|error| format!("Senkronizasyon bilgisi kaydedilemedi: {error}"))?;
    }

    transaction
        .commit()
        .await
        .map_err(|error| format!("Güncel veri işlemi tamamlanamadı: {error}"))?;

    emit_progress(
        &app,
        "complete",
        "Güncel UFC verileri çevrimdışı önbelleğe alındı",
        1,
        1,
    );

    warnings.truncate(12);
    Ok(SyncReport {
        fighter_profiles_updated: profiles.len(),
        fight_history_updated,
        champions_updated: champions.len(),
        events_updated: events.len(),
        fights_updated,
        synced_at,
        source: UFC_BASE_URL.into(),
        warnings,
    })
}

async fn ensure_minimal_fighter(
    transaction: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    name: &str,
    weight_class: &str,
    source_url: &str,
) -> Result<i64, String> {
    sqlx::query(
        r#"
        INSERT INTO fighters(name, weight_class, style, source_url, is_active)
        VALUES (?, ?, 'Mixed', ?, 1)
        ON CONFLICT DO UPDATE SET
            weight_class = excluded.weight_class,
            source_url = COALESCE(fighters.source_url, excluded.source_url),
            is_active = 1
        "#,
    )
    .bind(name)
    .bind(weight_class)
    .bind(source_url)
    .execute(&mut **transaction)
    .await
    .map_err(|error| format!("{name} yerel kaydı oluşturulamadı: {error}"))?;

    let fighter_id = sqlx::query_scalar::<_, i64>(
        "SELECT id FROM fighters WHERE source_url = ? OR name = ? COLLATE NOCASE LIMIT 1",
    )
    .bind(source_url)
    .bind(name)
    .fetch_one(&mut **transaction)
    .await
    .map_err(|error| format!("{name} yerel kimliği bulunamadı: {error}"))?;

    sqlx::query("INSERT OR IGNORE INTO fighter_stats(fighter_id) VALUES (?)")
        .bind(fighter_id)
        .execute(&mut **transaction)
        .await
        .map_err(|error| format!("{name} boş istatistik kaydı oluşturulamadı: {error}"))?;

    Ok(fighter_id)
}

fn database_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Uygulama veri dizini bulunamadı: {error}"))?;
    std::fs::create_dir_all(&directory)
        .map_err(|error| format!("Uygulama veri dizini hazırlanamadı: {error}"))?;
    Ok(directory.join("ufc_data.db"))
}

async fn connect_database(path: &PathBuf) -> Result<SqliteConnection, String> {
    let options = SqliteConnectOptions::new()
        .filename(path)
        .create_if_missing(true)
        .foreign_keys(true)
        .journal_mode(SqliteJournalMode::Wal);
    SqliteConnection::connect_with(&options)
        .await
        .map_err(|error| format!("Yerel SQLite bağlantısı açılamadı: {error}"))
}

async fn fetch_html(client: &Client, url: &str) -> Result<String, String> {
    let response = client
        .get(url)
        .header("Accept-Language", "en-US,en;q=0.9")
        .send()
        .await
        .map_err(|error| format!("{url} alınamadı: {error}"))?;
    let status = response.status();
    if !status.is_success() {
        return Err(format!("{url} HTTP {status} döndürdü"));
    }
    response
        .text()
        .await
        .map_err(|error| format!("{url} içeriği okunamadı: {error}"))
}

async fn cache_fighter_image(
    client: &Client,
    directory: &Path,
    athlete_url: &str,
    image_url: &str,
) -> Result<String, String> {
    let slug = athlete_url
        .trim_end_matches('/')
        .rsplit('/')
        .next()
        .unwrap_or("fighter")
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || matches!(character, '-' | '_') {
                character
            } else {
                '_'
            }
        })
        .collect::<String>();
    let extension = image_url
        .split('?')
        .next()
        .and_then(|value| Path::new(value).extension())
        .and_then(|value| value.to_str())
        .filter(|value| {
            matches!(
                value.to_ascii_lowercase().as_str(),
                "jpg" | "jpeg" | "png" | "webp"
            )
        })
        .unwrap_or("jpg");
    let mut hasher = DefaultHasher::new();
    image_url.hash(&mut hasher);
    let path = directory.join(format!("{slug}-{:x}.{extension}", hasher.finish()));

    if tokio::fs::metadata(&path).await.is_ok() {
        return Ok(path.to_string_lossy().into_owned());
    }

    let response = client
        .get(image_url)
        .send()
        .await
        .map_err(|error| format!("Fotoğraf indirilemedi: {error}"))?;
    if !response.status().is_success() {
        return Err(format!("Fotoğraf HTTP {} döndürdü", response.status()));
    }
    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("Fotoğraf verisi okunamadı: {error}"))?;
    tokio::fs::write(&path, bytes)
        .await
        .map_err(|error| format!("Fotoğraf önbelleğe yazılamadı: {error}"))?;

    Ok(path.to_string_lossy().into_owned())
}

fn parse_rankings(html: &str) -> Vec<ChampionUpdate> {
    let document = Html::parse_document(html);
    let group_selector = selector(".view-grouping");
    let header_selector = selector(".view-grouping-header");
    let champion_selector = selector(".rankings--athlete--champion h5 a");
    let mut output = Vec::new();

    for group in document.select(&group_selector) {
        let Some(header) = group.select(&header_selector).next() else {
            continue;
        };
        let weight_class = collapse_text(header.text());
        if weight_class.contains("Pound-for-Pound") || weight_class.is_empty() {
            continue;
        }
        let Some(champion) = group.select(&champion_selector).next() else {
            continue;
        };
        let Some(href) = champion.value().attr("href") else {
            continue;
        };
        let name = collapse_text(champion.text());
        if name.is_empty() {
            continue;
        }
        output.push(ChampionUpdate {
            weight_class,
            name,
            source_url: absolute_ufc_url(href),
            display_order: (output.len() + 1) as i64,
        });
    }

    output
}

fn parse_event_links(html: &str) -> Vec<String> {
    let document = Html::parse_document(html);
    let link_selector = selector("a[href]");
    let mut seen = HashSet::new();
    let mut output = Vec::new();

    for link in document.select(&link_selector) {
        let Some(href) = link.value().attr("href") else {
            continue;
        };
        if !href.contains("/event/") {
            continue;
        }
        let url = absolute_ufc_url(href);
        if seen.insert(url.clone()) {
            output.push(url);
        }
    }
    output
}

fn parse_event_page(url: &str, html: &str) -> Result<EventUpdate, String> {
    let document = Html::parse_document(html);
    let title = first_document_text(&document, "title")
        .ok_or_else(|| "Etkinlik başlığı bulunamadı".to_string())?;
    let name = title
        .split(" | UFC")
        .next()
        .unwrap_or(&title)
        .replace(" | ", ": ")
        .trim()
        .to_string();

    let description_selector = selector("meta[name='description']");
    let description = document
        .select(&description_selector)
        .next()
        .and_then(|element| element.value().attr("content"))
        .unwrap_or_default();
    let date = parse_event_date(description)
        .ok_or_else(|| format!("{name} için tam etkinlik tarihi meta açıklamasında bulunamadı"))?;

    let location = first_document_text(&document, ".field--name-venue")
        .unwrap_or_else(|| "Konum açıklanmadı".into());
    let start_time = first_document_text(&document, ".c-hero__headline-suffix")
        .and_then(|value| value.split('/').nth(1).map(str::trim).map(str::to_string))
        .unwrap_or_else(|| "Saat açıklanmadı".into());

    let mut fights = Vec::new();
    fights.extend(parse_fight_group(&document, "#main-card", "Main Card"));
    fights.extend(parse_fight_group(&document, "#prelims-card", "Prelims"));
    fights.extend(parse_fight_group(
        &document,
        "#early-prelims",
        "Early Prelims",
    ));

    Ok(EventUpdate {
        name,
        date,
        location,
        start_time,
        source_url: url.into(),
        fights,
    })
}

fn parse_fight_group(document: &Html, root: &str, card_type: &str) -> Vec<FightUpdate> {
    let root_selector = selector(root);
    let fight_selector = selector(".node--type-fight");
    let class_selector = selector(".c-listing-fight__class--desktop .c-listing-fight__class-text");
    let red_selector = selector(".c-listing-fight__corner-name--red a");
    let blue_selector = selector(".c-listing-fight__corner-name--blue a");
    let Some(container) = document.select(&root_selector).next() else {
        return Vec::new();
    };
    let mut output = Vec::new();

    for (index, fight) in container.select(&fight_selector).enumerate() {
        let Some(red) = fight.select(&red_selector).next() else {
            continue;
        };
        let Some(blue) = fight.select(&blue_selector).next() else {
            continue;
        };
        let Some(red_href) = red.value().attr("href") else {
            continue;
        };
        let Some(blue_href) = blue.value().attr("href") else {
            continue;
        };
        let fighter1_name = collapse_text(red.text());
        let fighter2_name = collapse_text(blue.text());
        if fighter1_name.is_empty() || fighter2_name.is_empty() {
            continue;
        }
        let weight_class = fight
            .select(&class_selector)
            .next()
            .map(|element| collapse_text(element.text()).replace(" Bout", ""))
            .unwrap_or_else(|| "Open Weight".into());

        output.push(FightUpdate {
            fighter1_name,
            fighter1_url: absolute_ufc_url(red_href),
            fighter2_name,
            fighter2_url: absolute_ufc_url(blue_href),
            weight_class,
            card_type: card_type.into(),
            bout_order: (index + 1) as i64,
        });
    }

    output
}

fn parse_fight_history(athlete_url: &str, html: &str) -> Vec<FightHistoryUpdate> {
    let document = Html::parse_document(html);
    let card_selector = selector("article.c-card-event--athlete-results");
    let red_selector = selector(".c-card-event--athlete-results__red-image");
    let blue_selector = selector(".c-card-event--athlete-results__blue-image");
    let athlete_link_selector = selector("a[href*='/athlete/']");
    let headline_link_selector = selector(".c-card-event--athlete-results__headline a");
    let date_selector = selector(".c-card-event--athlete-results__date");
    let detail_selector = selector(".c-card-event--athlete-results__result");
    let label_selector = selector(".c-card-event--athlete-results__result-label");
    let value_selector = selector(".c-card-event--athlete-results__result-text");
    let event_selector = selector(".c-card-event--athlete-results__actions a[href*='/event/']");
    let target_key = normalized_ufc_path(athlete_url);
    let mut output = Vec::new();

    for card in document.select(&card_selector) {
        let red = card.select(&red_selector).next();
        let blue = card.select(&blue_selector).next();
        let target_side = [red, blue].into_iter().flatten().find(|side| {
            side.select(&athlete_link_selector)
                .filter_map(|link| link.value().attr("href"))
                .any(|href| normalized_ufc_path(href) == target_key)
        });
        let Some(target_side) = target_side else {
            continue;
        };
        let classes = target_side.value().attr("class").unwrap_or_default();
        let result = if classes.split_whitespace().any(|value| value == "win") {
            "W"
        } else if classes.split_whitespace().any(|value| value == "loss") {
            "L"
        } else if classes.split_whitespace().any(|value| value == "draw") {
            "D"
        } else {
            "NC"
        };

        let opponent_link = card.select(&headline_link_selector).find(|link| {
            link.value()
                .attr("href")
                .map(|href| normalized_ufc_path(href) != target_key)
                .unwrap_or(false)
        });
        let Some(opponent_link) = opponent_link else {
            continue;
        };
        let opponent_name = collapse_text(opponent_link.text());
        let opponent_url = opponent_link
            .value()
            .attr("href")
            .map(absolute_ufc_url)
            .unwrap_or_default();
        let date_text = card
            .select(&date_selector)
            .next()
            .map(|element| collapse_text(element.text()))
            .unwrap_or_default();
        let Some(fight_date) = parse_history_date(&date_text) else {
            continue;
        };

        let mut round = 0;
        let mut fight_time = String::new();
        let mut method = "Bilinmiyor".to_string();
        for detail in card.select(&detail_selector) {
            let label = detail
                .select(&label_selector)
                .next()
                .map(|element| collapse_text(element.text()).to_ascii_lowercase())
                .unwrap_or_default();
            let value = detail
                .select(&value_selector)
                .next()
                .map(|element| collapse_text(element.text()))
                .unwrap_or_default();
            match label.as_str() {
                "round" => round = value.parse().unwrap_or_default(),
                "time" => fight_time = value,
                "method" => method = value,
                _ => {}
            }
        }
        let event_url = card
            .select(&event_selector)
            .next()
            .and_then(|link| link.value().attr("href"))
            .map(absolute_ufc_url)
            .unwrap_or_default();

        output.push(FightHistoryUpdate {
            opponent_name,
            opponent_url,
            result: result.into(),
            fight_date,
            event_name: event_name_from_url(&event_url),
            event_url,
            method,
            round,
            fight_time,
        });
    }

    output
}

fn normalized_ufc_path(value: &str) -> String {
    value
        .split(['?', '#'])
        .next()
        .unwrap_or(value)
        .trim_end_matches('/')
        .replace("https://www.ufc.com", "")
        .replace("https://ufc.com", "")
        .replace("http://www.ufc.com", "")
        .replace("http://ufc.com", "")
        .to_ascii_lowercase()
}

fn parse_history_date(value: &str) -> Option<String> {
    let regex = Regex::new(r"(?i)([A-Za-z]{3})\.?\s+(\d{1,2}),\s+(\d{4})")
        .expect("valid fight history date regex");
    let captures = regex.captures(value)?;
    let month = match &captures[1].to_ascii_lowercase()[..3] {
        "jan" => 1,
        "feb" => 2,
        "mar" => 3,
        "apr" => 4,
        "may" => 5,
        "jun" => 6,
        "jul" => 7,
        "aug" => 8,
        "sep" => 9,
        "oct" => 10,
        "nov" => 11,
        "dec" => 12,
        _ => return None,
    };
    let day = captures[2].parse::<u32>().ok()?;
    let year = captures[3].parse::<i32>().ok()?;
    Some(format!("{year:04}-{month:02}-{day:02}"))
}

fn event_name_from_url(url: &str) -> String {
    let slug = url
        .split('#')
        .next()
        .unwrap_or(url)
        .trim_end_matches('/')
        .rsplit('/')
        .next()
        .unwrap_or_default();
    if slug.is_empty() {
        return "UFC Etkinliği".into();
    }
    slug.split('-')
        .map(|part| {
            if part.eq_ignore_ascii_case("ufc") {
                "UFC".to_string()
            } else {
                let mut characters = part.chars();
                characters
                    .next()
                    .map(|first| first.to_uppercase().collect::<String>() + characters.as_str())
                    .unwrap_or_default()
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn parse_fighter_profile(url: &str, html: &str) -> Result<FighterUpdate, String> {
    let document = Html::parse_document(html);
    let image_url = first_document_attribute(&document, "meta[property='og:image']", "content")
        .or_else(|| first_document_attribute(&document, "meta[name='twitter:image']", "content"))
        .map(|value| absolute_ufc_url(&value))
        .unwrap_or_default();
    let name = first_document_text(&document, ".hero-profile__name")
        .ok_or_else(|| "Sporcu adı bulunamadı".to_string())?;
    let weight_class = first_document_text(&document, ".hero-profile__division-title")
        .unwrap_or_else(|| "Open Weight Division".into())
        .trim_end_matches(" Division")
        .to_string();
    let record = first_document_text(&document, ".hero-profile__division-body")
        .unwrap_or_else(|| "0-0-0".into());
    let record_regex = Regex::new(r"(\d+)-(\d+)-(\d+)").expect("valid record regex");
    let captures = record_regex
        .captures(&record)
        .ok_or_else(|| format!("{name} rekoru ayrıştırılamadı"))?;
    let wins = captures[1].parse::<i64>().unwrap_or_default();
    let losses = captures[2].parse::<i64>().unwrap_or_default();
    let draws = captures[3].parse::<i64>().unwrap_or_default();
    let visible_text = visible_text(html);

    let win_streak = capture_i64(&visible_text, r"(\d+)\s+Fight Win Streak");
    let ko_wins = capture_i64(&visible_text, r"(\d+)\s+Wins by Knockout");
    let submission_wins = capture_i64(&visible_text, r"(\d+)\s+Wins by Submission");
    let decision_wins = (wins - ko_wins - submission_wins).max(0);
    let target_regex = Regex::new(
        r"(?is)Sig\.\s*Str\.\s*by target.*?(\d+)%\s+\d+\s+Head.*?(\d+)%\s+\d+\s+Body.*?(\d+)%\s+\d+\s+Leg",
    )
    .expect("valid target regex");
    let target = target_regex.captures(&visible_text);

    Ok(FighterUpdate {
        name,
        source_url: url.into(),
        image_url,
        image_path: String::new(),
        weight_class,
        wins,
        losses,
        draws,
        win_streak,
        ko_wins,
        submission_wins,
        decision_wins,
        height: capture_f64(&visible_text, r"Height\s+([0-9.]+)"),
        weight: capture_f64(&visible_text, r"Weight\s+([0-9.]+)"),
        reach: capture_f64(&visible_text, r"Reach\s+([0-9.]+)"),
        slpm: capture_f64(
            &visible_text,
            r"([0-9.]+)\s+Sig\.\s*Str\.\s*Landed\s+Per Min",
        ),
        str_acc: capture_f64(&visible_text, r"Striking Accuracy\s+(\d+)%") / 100.0,
        sapm: capture_f64(
            &visible_text,
            r"([0-9.]+)\s+Sig\.\s*Str\.\s*Absorbed\s+Per Min",
        ),
        str_def: capture_f64(&visible_text, r"(\d+)\s*%\s+Sig\.\s*Str\.\s*Defense") / 100.0,
        td_avg: capture_f64(&visible_text, r"([0-9.]+)\s+Takedown avg\s+Per 15 Min"),
        td_acc: capture_f64(&visible_text, r"Takedown Accuracy\s+(\d+)%") / 100.0,
        td_def: capture_f64(&visible_text, r"(\d+)\s*%\s+Takedown Defense") / 100.0,
        sub_avg: capture_f64(&visible_text, r"([0-9.]+)\s+Submission avg\s+Per 15 Min"),
        head_pct: target
            .as_ref()
            .and_then(|value| value[1].parse().ok())
            .unwrap_or_default(),
        body_pct: target
            .as_ref()
            .and_then(|value| value[2].parse().ok())
            .unwrap_or_default(),
        leg_pct: target
            .as_ref()
            .and_then(|value| value[3].parse().ok())
            .unwrap_or_default(),
        fight_history: Vec::new(),
    })
}

fn visible_text(html: &str) -> String {
    let scripts = Regex::new(r"(?is)<script.*?</script>|<style.*?</style>")
        .expect("valid script regex")
        .replace_all(html, " ");
    let tags = Regex::new(r"(?is)<[^>]+>")
        .expect("valid tag regex")
        .replace_all(&scripts, " ");
    let decoded = html_escape::decode_html_entities(&tags);
    collapse_text(std::iter::once(decoded.as_ref()))
}

fn parse_event_date(description: &str) -> Option<String> {
    let regex = Regex::new(r"(?i)\b(?:on|from)\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})")
        .expect("valid event date regex");
    let captures = regex.captures(description)?;
    let month = match &captures[1].to_ascii_lowercase()[..3] {
        "jan" => 1,
        "feb" => 2,
        "mar" => 3,
        "apr" => 4,
        "may" => 5,
        "jun" => 6,
        "jul" => 7,
        "aug" => 8,
        "sep" => 9,
        "oct" => 10,
        "nov" => 11,
        "dec" => 12,
        _ => return None,
    };
    let day = captures[2].parse::<u32>().ok()?;
    let year = captures[3]
        .parse::<i32>()
        .unwrap_or_else(|_| Utc::now().year());
    Some(format!("{year:04}-{month:02}-{day:02}"))
}

fn first_document_text(document: &Html, query: &str) -> Option<String> {
    let selector = selector(query);
    document
        .select(&selector)
        .next()
        .map(|element| collapse_text(element.text()))
        .filter(|value| !value.is_empty())
}

fn first_document_attribute(document: &Html, query: &str, attribute: &str) -> Option<String> {
    let selector = selector(query);
    document
        .select(&selector)
        .next()
        .and_then(|element| element.value().attr(attribute))
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

fn collapse_text<'a>(values: impl Iterator<Item = &'a str>) -> String {
    values
        .flat_map(str::split_whitespace)
        .collect::<Vec<_>>()
        .join(" ")
}

fn capture_f64(text: &str, pattern: &str) -> f64 {
    Regex::new(pattern)
        .ok()
        .and_then(|regex| regex.captures(text))
        .and_then(|captures| captures.get(1).map(|value| value.as_str().to_string()))
        .and_then(|value| value.parse::<f64>().ok())
        .unwrap_or_default()
}

fn capture_i64(text: &str, pattern: &str) -> i64 {
    capture_f64(text, pattern) as i64
}

fn selector(value: &str) -> Selector {
    Selector::parse(value).unwrap_or_else(|_| panic!("invalid selector: {value}"))
}

fn absolute_ufc_url(value: &str) -> String {
    if value.starts_with("http://") || value.starts_with("https://") {
        value.replace("http://", "https://")
    } else {
        format!("{UFC_BASE_URL}/{}", value.trim_start_matches('/'))
    }
}

fn emit_progress(app: &AppHandle, stage: &str, message: &str, current: usize, total: usize) {
    let _ = app.emit(
        "ufc-sync-progress",
        SyncProgress {
            stage: stage.into(),
            message: message.into(),
            current,
            total,
        },
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_event_date_from_official_description() {
        let description = "Don't Miss UFC 329 Live From Las Vegas On July 11, 2026";
        assert_eq!(parse_event_date(description).as_deref(), Some("2026-07-11"));
    }

    #[test]
    fn normalizes_relative_ufc_urls() {
        assert_eq!(
            absolute_ufc_url("/athlete/islam-makhachev"),
            "https://www.ufc.com/athlete/islam-makhachev"
        );
    }

    #[test]
    fn parses_official_fighter_image() {
        let html = r#"
            <html><head>
              <meta property="og:image" content="https://ufc.com/images/fighter.png">
            </head><body>
              <h1 class="hero-profile__name">Test Fighter</h1>
              <div class="hero-profile__division-title">Lightweight Division</div>
              <div class="hero-profile__division-body">10-2-0</div>
            </body></html>
        "#;
        let fighter = parse_fighter_profile("https://www.ufc.com/athlete/test", html).unwrap();
        assert_eq!(fighter.image_url, "https://ufc.com/images/fighter.png");
    }

    #[test]
    fn parses_result_from_selected_fighter_perspective() {
        let html = r#"
          <article class="c-card-event--athlete-results">
            <div class="c-card-event--athlete-results__red-image loss">
              <a href="https://www.ufc.com/athlete/alex-pereira">Pereira</a>
            </div>
            <div class="c-card-event--athlete-results__blue-image win">
              <a href="https://www.ufc.com/athlete/ciryl-gane">Gane</a>
            </div>
            <h3 class="c-card-event--athlete-results__headline">
              <a href="https://www.ufc.com/athlete/alex-pereira">Pereira</a>
              <a href="https://www.ufc.com/athlete/ciryl-gane">Gane</a>
            </h3>
            <div class="c-card-event--athlete-results__date">Jun. 14, 2026</div>
            <div class="c-card-event--athlete-results__result">
              <div class="c-card-event--athlete-results__result-label">Round</div>
              <div class="c-card-event--athlete-results__result-text">2</div>
            </div>
            <div class="c-card-event--athlete-results__result">
              <div class="c-card-event--athlete-results__result-label">Time</div>
              <div class="c-card-event--athlete-results__result-text">1:27</div>
            </div>
            <div class="c-card-event--athlete-results__result">
              <div class="c-card-event--athlete-results__result-label">Method</div>
              <div class="c-card-event--athlete-results__result-text">KO/TKO</div>
            </div>
            <div class="c-card-event--athlete-results__actions">
              <a href="https://www.ufc.com/event/ufc-freedom-250#12707">Fight Card</a>
            </div>
          </article>
        "#;
        let pereira = parse_fight_history("https://www.ufc.com/athlete/alex-pereira", html);
        let gane = parse_fight_history("https://www.ufc.com/athlete/ciryl-gane", html);

        assert_eq!(pereira[0].result, "L");
        assert_eq!(pereira[0].opponent_name, "Gane");
        assert_eq!(pereira[0].fight_date, "2026-06-14");
        assert_eq!(pereira[0].method, "KO/TKO");
        assert_eq!(gane[0].result, "W");
    }
}
