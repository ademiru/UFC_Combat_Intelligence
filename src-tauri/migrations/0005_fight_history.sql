CREATE TABLE IF NOT EXISTS fighter_fight_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    fighter_id      INTEGER NOT NULL,
    opponent_name   TEXT NOT NULL COLLATE NOCASE,
    opponent_url    TEXT,
    result          TEXT NOT NULL CHECK (result IN ('W', 'L', 'D', 'NC')),
    fight_date      TEXT NOT NULL,
    event_name      TEXT NOT NULL COLLATE NOCASE,
    event_url       TEXT,
    method          TEXT NOT NULL,
    round           INTEGER NOT NULL DEFAULT 0 CHECK (round >= 0),
    fight_time      TEXT NOT NULL DEFAULT '',
    source_updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fighter_id) REFERENCES fighters(id) ON DELETE CASCADE,
    UNIQUE (fighter_id, opponent_name, fight_date)
);

CREATE INDEX IF NOT EXISTS idx_fighter_history_fighter_date
    ON fighter_fight_history(fighter_id, fight_date DESC);

INSERT OR REPLACE INTO app_metadata(key, value, updated_at)
VALUES
    ('fight_history_source', 'Official UFC athlete records', CURRENT_TIMESTAMP),
    ('fight_history_entries', '0', CURRENT_TIMESTAMP);
