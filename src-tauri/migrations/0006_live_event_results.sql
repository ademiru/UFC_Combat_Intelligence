ALTER TABLE fights ADD COLUMN fight_time TEXT;

INSERT OR REPLACE INTO app_metadata(key, value, updated_at)
VALUES ('live_results_schema', '1', CURRENT_TIMESTAMP);
