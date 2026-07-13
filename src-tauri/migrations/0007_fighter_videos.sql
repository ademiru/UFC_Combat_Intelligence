PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS fighter_videos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    fighter_id     INTEGER NOT NULL,
    ufc_node_id    INTEGER NOT NULL,
    dve_id         INTEGER NOT NULL,
    title          TEXT NOT NULL,
    thumbnail_url  TEXT,
    source_url     TEXT NOT NULL,
    updated_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (fighter_id, ufc_node_id),
    FOREIGN KEY (fighter_id) REFERENCES fighters(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fighter_videos_fighter
    ON fighter_videos(fighter_id, id DESC);
