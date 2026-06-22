mod sync;

use tauri_plugin_sql::{Migration, MigrationKind};

fn database_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_ufc_schema",
            sql: include_str!("../migrations/0001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "seed_verified_starter_dataset",
            sql: include_str!("../migrations/0002_seed_starter_dataset.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_online_sync_metadata",
            sql: include_str!("../migrations/0003_online_sync.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_local_fighter_image_cache",
            sql: include_str!("../migrations/0004_fighter_images.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add_official_fighter_fight_history",
            sql: include_str!("../migrations/0005_fight_history.sql"),
            kind: MigrationKind::Up,
        },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![sync::sync_online_data])
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:ufc_data.db", database_migrations())
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("UFC Panel başlatılırken kritik bir hata oluştu");
}
