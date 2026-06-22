ALTER TABLE fighters ADD COLUMN image_url TEXT;
ALTER TABLE fighters ADD COLUMN image_path TEXT;

INSERT OR REPLACE INTO app_metadata(key, value, updated_at)
VALUES
    ('fighter_image_source', 'Official UFC athlete profiles', CURRENT_TIMESTAMP),
    ('fighter_images_cached', '0', CURRENT_TIMESTAMP);
