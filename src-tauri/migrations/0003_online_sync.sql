ALTER TABLE fighters ADD COLUMN source_url TEXT;
ALTER TABLE fighters ADD COLUMN source_updated_at TEXT;

UPDATE fighters
SET source_url = CASE name
    WHEN 'Joshua Van' THEN 'https://www.ufc.com/athlete/joshua-van'
    WHEN 'Petr Yan' THEN 'https://www.ufc.com/athlete/petr-yan'
    WHEN 'Alexander Volkanovski' THEN 'https://www.ufc.com/athlete/alexander-volkanovski'
    WHEN 'Justin Gaethje' THEN 'https://www.ufc.com/athlete/justin-gaethje'
    WHEN 'Islam Makhachev' THEN 'https://www.ufc.com/athlete/islam-makhachev'
    WHEN 'Sean Strickland' THEN 'https://www.ufc.com/athlete/sean-strickland'
    WHEN 'Carlos Ulberg' THEN 'https://www.ufc.com/athlete/carlos-ulberg'
    WHEN 'Tom Aspinall' THEN 'https://www.ufc.com/athlete/tom-aspinall'
    WHEN 'Mackenzie Dern' THEN 'https://www.ufc.com/athlete/mackenzie-dern'
    WHEN 'Valentina Shevchenko' THEN 'https://www.ufc.com/athlete/valentina-shevchenko'
    WHEN 'Kayla Harrison' THEN 'https://www.ufc.com/athlete/kayla-harrison'
    WHEN 'Alexandre Pantoja' THEN 'https://www.ufc.com/athlete/alexandre-pantoja'
    WHEN 'Merab Dvalishvili' THEN 'https://www.ufc.com/athlete/merab-dvalishvili'
    WHEN 'Ilia Topuria' THEN 'https://www.ufc.com/athlete/ilia-topuria'
    WHEN 'Ian Machado Garry' THEN 'https://www.ufc.com/athlete/ian-machado-garry'
    WHEN 'Khamzat Chimaev' THEN 'https://www.ufc.com/athlete/khamzat-chimaev'
    WHEN 'Alex Pereira' THEN 'https://www.ufc.com/athlete/alex-pereira'
    WHEN 'Ciryl Gane' THEN 'https://www.ufc.com/athlete/ciryl-gane'
    WHEN 'Zhang Weili' THEN 'https://www.ufc.com/athlete/zhang-weili'
    WHEN 'Conor McGregor' THEN 'https://www.ufc.com/athlete/conor-mcgregor'
    WHEN 'Max Holloway' THEN 'https://www.ufc.com/athlete/max-holloway'
    WHEN 'Manel Kape' THEN 'https://www.ufc.com/athlete/manel-kape'
    WHEN 'Kyoji Horiguchi' THEN 'https://www.ufc.com/athlete/kyoji-horiguchi'
    WHEN 'Ion Cutelaba' THEN 'https://www.ufc.com/athlete/ion-cutelaba'
    WHEN 'Navajo Stirling' THEN 'https://www.ufc.com/athlete/navajo-stirling'
    WHEN 'Hyder Amil' THEN 'https://www.ufc.com/athlete/hyder-amil'
    WHEN 'Christian Rodriguez' THEN 'https://www.ufc.com/athlete/christian-rodriguez'
    WHEN 'Rafael Fiziev' THEN 'https://www.ufc.com/athlete/rafael-fiziev'
    WHEN 'Manuel Torres' THEN 'https://www.ufc.com/athlete/manuel-torres'
    WHEN 'Shara Magomedov' THEN 'https://www.ufc.com/athlete/shara-magomedov'
    WHEN 'Michel Pereira' THEN 'https://www.ufc.com/athlete/michel-pereira'
    WHEN 'Asu Almabayev' THEN 'https://www.ufc.com/athlete/asu-almabayev'
    WHEN 'Charles Johnson' THEN 'https://www.ufc.com/athlete/charles-johnson'
    WHEN 'Benoît Saint Denis' THEN 'https://www.ufc.com/athlete/benoit-saint-denis'
    WHEN 'Paddy Pimblett' THEN 'https://www.ufc.com/athlete/paddy-pimblett'
    WHEN 'Cory Sandhagen' THEN 'https://www.ufc.com/athlete/cory-sandhagen'
    WHEN 'Mario Bautista' THEN 'https://www.ufc.com/athlete/mario-bautista'
    WHEN 'Brandon Royval' THEN 'https://www.ufc.com/athlete/brandon-royval'
    WHEN 'Lone’er Kavanagh' THEN 'https://www.ufc.com/athlete/loneer-kavanagh'
    ELSE source_url
END;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fighters_source_url
    ON fighters(source_url)
    WHERE source_url IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_source_url
    ON events(source_url)
    WHERE source_url IS NOT NULL;

INSERT OR REPLACE INTO app_metadata(key, value, updated_at)
VALUES
    ('online_mode_enabled', '0', CURRENT_TIMESTAMP),
    ('last_online_sync', '', CURRENT_TIMESTAMP),
    ('online_sync_status', 'never', CURRENT_TIMESTAMP),
    ('online_source', 'https://www.ufc.com', CURRENT_TIMESTAMP);

