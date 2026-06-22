PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS fighters (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL COLLATE NOCASE,
    nickname      TEXT COLLATE NOCASE,
    weight_class  TEXT NOT NULL COLLATE NOCASE,
    height        REAL CHECK (height IS NULL OR height > 0),
    reach         REAL CHECK (reach IS NULL OR reach > 0),
    stance        TEXT COLLATE NOCASE,
    wins          INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
    losses        INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
    draws         INTEGER NOT NULL DEFAULT 0 CHECK (draws >= 0),
    created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fighter_stats (
    fighter_id  INTEGER PRIMARY KEY,
    slpm        REAL NOT NULL DEFAULT 0 CHECK (slpm >= 0),
    str_acc     REAL NOT NULL DEFAULT 0 CHECK (str_acc BETWEEN 0 AND 1),
    sapm        REAL NOT NULL DEFAULT 0 CHECK (sapm >= 0),
    str_def     REAL NOT NULL DEFAULT 0 CHECK (str_def BETWEEN 0 AND 1),
    td_avg      REAL NOT NULL DEFAULT 0 CHECK (td_avg >= 0),
    td_acc      REAL NOT NULL DEFAULT 0 CHECK (td_acc BETWEEN 0 AND 1),
    td_def      REAL NOT NULL DEFAULT 0 CHECK (td_def BETWEEN 0 AND 1),
    sub_avg     REAL NOT NULL DEFAULT 0 CHECK (sub_avg >= 0),
    updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fighter_id) REFERENCES fighters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL COLLATE NOCASE,
    date        TEXT NOT NULL,
    location    TEXT NOT NULL COLLATE NOCASE,
    created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fights (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      INTEGER NOT NULL,
    fighter1_id   INTEGER NOT NULL,
    fighter2_id   INTEGER NOT NULL,
    weight_class  TEXT NOT NULL COLLATE NOCASE,
    result        TEXT,
    method        TEXT COLLATE NOCASE,
    round         INTEGER CHECK (round IS NULL OR round > 0),
    created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (fighter1_id <> fighter2_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (fighter1_id) REFERENCES fighters(id) ON DELETE RESTRICT,
    FOREIGN KEY (fighter2_id) REFERENCES fighters(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_fighters_name
    ON fighters(name);

CREATE INDEX IF NOT EXISTS idx_fighters_weight_class
    ON fighters(weight_class);

CREATE INDEX IF NOT EXISTS idx_fighters_record
    ON fighters(wins DESC, losses ASC);

CREATE INDEX IF NOT EXISTS idx_events_date
    ON events(date);

CREATE INDEX IF NOT EXISTS idx_fights_event
    ON fights(event_id);

CREATE INDEX IF NOT EXISTS idx_fights_fighter1
    ON fights(fighter1_id);

CREATE INDEX IF NOT EXISTS idx_fights_fighter2
    ON fights(fighter2_id);

