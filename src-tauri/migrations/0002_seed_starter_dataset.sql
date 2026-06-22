PRAGMA foreign_keys = ON;

-- Dataset snapshot: 2026-06-20.
-- Rankings, event cards and athlete metrics were verified against UFC.com.

ALTER TABLE fighters ADD COLUMN country TEXT;
ALTER TABLE fighters ADD COLUMN style TEXT NOT NULL DEFAULT 'Mixed';
ALTER TABLE fighters ADD COLUMN weight REAL;
ALTER TABLE fighters ADD COLUMN win_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE fighters ADD COLUMN ko_wins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE fighters ADD COLUMN submission_wins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE fighters ADD COLUMN decision_wins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE fighters ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;

ALTER TABLE fighter_stats ADD COLUMN head_pct INTEGER NOT NULL DEFAULT 60;
ALTER TABLE fighter_stats ADD COLUMN body_pct INTEGER NOT NULL DEFAULT 20;
ALTER TABLE fighter_stats ADD COLUMN leg_pct INTEGER NOT NULL DEFAULT 20;

ALTER TABLE events ADD COLUMN start_time TEXT;
ALTER TABLE events ADD COLUMN status TEXT NOT NULL DEFAULT 'upcoming';
ALTER TABLE events ADD COLUMN source_url TEXT;

ALTER TABLE fights ADD COLUMN card_type TEXT NOT NULL DEFAULT 'Main Card';
ALTER TABLE fights ADD COLUMN bout_order INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fighters_unique_name
    ON fighters(name COLLATE NOCASE);

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_unique_name_date
    ON events(name COLLATE NOCASE, date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fights_unique_bout
    ON fights(event_id, fighter1_id, fighter2_id);

CREATE TABLE IF NOT EXISTS champions (
    weight_class  TEXT PRIMARY KEY COLLATE NOCASE,
    fighter_id    INTEGER NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    since_text    TEXT,
    FOREIGN KEY (fighter_id) REFERENCES fighters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_metadata (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO fighters
    (name, nickname, weight_class, height, reach, stance, wins, losses, draws,
     country, style, weight, win_streak, ko_wins, submission_wins, decision_wins, is_active)
VALUES
    ('Joshua Van', 'The Fearless', 'Flyweight', 65, 65, 'Orthodox', 17, 2, 0, 'Myanmar', 'Striker', 124.5, 0, 9, 2, 6, 1),
    ('Petr Yan', 'No Mercy', 'Bantamweight', 67.5, 67, 'Switch', 20, 5, 0, 'Russia', 'Striker', 135, 0, 7, 1, 12, 1),
    ('Alexander Volkanovski', 'The Great', 'Featherweight', 66, 71.5, 'Orthodox', 28, 4, 0, 'Australia', 'Mixed', 145, 0, 13, 3, 12, 1),
    ('Justin Gaethje', 'The Highlight', 'Lightweight', 71, 70, 'Orthodox', 28, 5, 0, 'United States', 'Striker', 155, 0, 21, 1, 6, 1),
    ('Islam Makhachev', NULL, 'Welterweight', 70, 70.5, 'Southpaw', 28, 1, 0, 'Russia', 'Grappler', 170, 16, 5, 13, 10, 1),
    ('Sean Strickland', 'Tarzan', 'Middleweight', 73, 76, 'Orthodox', 31, 7, 0, 'United States', 'Striker', 185, 0, 12, 4, 15, 1),
    ('Carlos Ulberg', 'Black Jag', 'Light Heavyweight', 76, 77, 'Orthodox', 15, 1, 0, 'New Zealand', 'Striker', 205, 0, 10, 1, 4, 1),
    ('Tom Aspinall', NULL, 'Heavyweight', 77, 78, 'Orthodox', 15, 3, 0, 'England', 'Mixed', 254, 0, 12, 3, 0, 1),
    ('Mackenzie Dern', NULL, 'Women''s Strawweight', 64, 63, 'Orthodox', 16, 5, 0, 'United States', 'BJJ', 115, 0, 0, 8, 8, 1),
    ('Valentina Shevchenko', 'Bullet', 'Women''s Flyweight', 65, 67, 'Southpaw', 26, 4, 1, 'Kyrgyzstan', 'Mixed', 125, 0, 8, 7, 11, 1),
    ('Kayla Harrison', NULL, 'Women''s Bantamweight', 68, 66, 'Southpaw', 19, 1, 0, 'United States', 'Grappler', 135, 0, 6, 8, 5, 1),
    ('Alexandre Pantoja', 'The Cannibal', 'Flyweight', 65, 67, 'Orthodox', 30, 6, 0, 'Brazil', 'BJJ', 125, 0, 8, 12, 10, 1),
    ('Merab Dvalishvili', 'The Machine', 'Bantamweight', 66, 68, 'Orthodox', 21, 5, 0, 'Georgia', 'Grappler', 135, 0, 3, 2, 16, 1),
    ('Ilia Topuria', 'El Matador', 'Lightweight', 67, 69, 'Orthodox', 17, 1, 0, 'Georgia', 'Mixed', 155, 0, 7, 8, 2, 1),
    ('Ian Machado Garry', 'The Future', 'Welterweight', 75, 74.5, 'Orthodox', 17, 1, 0, 'Ireland', 'Striker', 170, 0, 7, 1, 9, 1),
    ('Khamzat Chimaev', 'Borz', 'Middleweight', 74, 75, 'Orthodox', 15, 1, 0, 'United Arab Emirates', 'Grappler', 185, 0, 6, 6, 3, 1),
    ('Alex Pereira', 'Poatan', 'Heavyweight', 76, 79, 'Orthodox', 13, 4, 0, 'Brazil', 'Striker', 251, 0, 11, 0, 2, 1),
    ('Ciryl Gane', 'Bon Gamin', 'Heavyweight', 76, 81, 'Orthodox', 14, 2, 0, 'France', 'Striker', 247.5, 0, 7, 3, 4, 1),
    ('Zhang Weili', 'Magnum', 'Women''s Flyweight', 64, 63, 'Switch', 26, 4, 0, 'China', 'Mixed', 125, 0, 11, 8, 7, 1),
    ('Conor McGregor', 'The Notorious', 'Welterweight', 69, 74, 'Southpaw', 22, 6, 0, 'Ireland', 'Striker', 170, 0, 19, 1, 2, 1),
    ('Max Holloway', 'Blessed', 'Welterweight', 71, 69, 'Orthodox', 27, 9, 0, 'United States', 'Striker', 170, 0, 12, 2, 13, 1),
    ('Manel Kape', 'Starboy', 'Flyweight', 65, 68, 'Southpaw', 22, 7, 0, 'Portugal', 'Striker', 126, 0, 14, 5, 3, 1),
    ('Kyoji Horiguchi', 'The Typhoon', 'Flyweight', 64, 69, 'Orthodox', 36, 5, 0, 'Japan', 'Mixed', 125, 0, 15, 6, 15, 1),
    ('Ion Cutelaba', 'The Hulk', 'Light Heavyweight', 73, 75, 'Southpaw', 20, 11, 1, 'Moldova', 'Grappler', 205, 0, 13, 4, 3, 1),
    ('Navajo Stirling', NULL, 'Light Heavyweight', 76, 79, 'Orthodox', 9, 0, 0, 'New Zealand', 'Striker', 205, 9, 5, 0, 4, 1),
    ('Hyder Amil', 'The Hurricane', 'Featherweight', 69, 70, 'Southpaw', 11, 2, 0, 'Philippines', 'Striker', 145, 0, 6, 1, 4, 1),
    ('Christian Rodriguez', 'CeeRod', 'Featherweight', 67, 71.5, 'Orthodox', 12, 4, 0, 'United States', 'Mixed', 145, 0, 3, 4, 5, 1),
    ('Rafael Fiziev', 'Ataman', 'Lightweight', 68, 71.5, 'Switch', 13, 5, 0, 'Azerbaijan', 'Striker', 155, 0, 8, 1, 4, 1),
    ('Manuel Torres', 'El Loco', 'Lightweight', 70, 73.5, 'Orthodox', 17, 3, 0, 'Mexico', 'Mixed', 155, 0, 9, 7, 1, 1),
    ('Shara Magomedov', 'Bullet', 'Middleweight', 74, 73, 'Orthodox', 16, 1, 0, 'Russia', 'Striker', 185, 0, 12, 0, 4, 1),
    ('Michel Pereira', 'Demolidor', 'Middleweight', 73, 73, 'Orthodox', 32, 14, 0, 'Brazil', 'Mixed', 185, 0, 11, 9, 12, 1),
    ('Asu Almabayev', 'Zulfikar', 'Flyweight', 64, 65, 'Orthodox', 23, 3, 0, 'Kazakhstan', 'Grappler', 125, 0, 3, 10, 10, 1),
    ('Charles Johnson', 'InnerG', 'Flyweight', 69, 70, 'Switch', 19, 8, 0, 'United States', 'Mixed', 125, 0, 8, 3, 8, 1),
    ('Benoît Saint Denis', 'God of War', 'Lightweight', 71, 73, 'Southpaw', 17, 3, 0, 'France', 'Grappler', 155, 0, 6, 11, 0, 1),
    ('Paddy Pimblett', 'The Baddy', 'Lightweight', 70, 73, 'Orthodox', 23, 4, 0, 'England', 'BJJ', 155, 0, 7, 10, 6, 1),
    ('Cory Sandhagen', 'The Sandman', 'Bantamweight', 71, 70, 'Switch', 18, 6, 0, 'United States', 'Striker', 135, 0, 8, 3, 7, 1),
    ('Mario Bautista', NULL, 'Bantamweight', 69, 72, 'Switch', 17, 3, 0, 'United States', 'Mixed', 135, 0, 3, 7, 7, 1),
    ('Brandon Royval', 'Raw Dawg', 'Flyweight', 69, 68, 'Southpaw', 17, 9, 0, 'United States', 'BJJ', 125, 0, 4, 9, 4, 1),
    ('Lone’er Kavanagh', NULL, 'Flyweight', 66, 67, 'Orthodox', 10, 1, 0, 'England', 'Mixed', 125, 0, 4, 1, 5, 1);

WITH seed(name, slpm, str_acc, sapm, str_def, td_avg, td_acc, td_def, sub_avg, head_pct, body_pct, leg_pct) AS (
    VALUES
    ('Joshua Van', 8.43, .57, 5.82, .58, .82, .62, .76, .21, 73, 19, 8),
    ('Petr Yan', 5.16, .55, 4.24, .60, 1.70, .49, .86, .11, 69, 19, 12),
    ('Alexander Volkanovski', 5.99, .57, 3.31, .59, 1.63, .34, .69, .20, 65, 10, 25),
    ('Justin Gaethje', 6.48, .59, 7.05, .51, .33, .40, .74, 0, 65, 11, 24),
    ('Islam Makhachev', 2.45, .58, 1.45, .62, 3.10, .56, .91, .98, 71, 24, 6),
    ('Sean Strickland', 5.98, .43, 4.53, .61, .66, .62, .69, .15, 81, 14, 5),
    ('Carlos Ulberg', 6.57, .56, 4.03, .51, .53, .60, .86, .18, 61, 16, 23),
    ('Tom Aspinall', 7.63, .68, 3.62, .57, 2.62, .80, 1.00, 1.31, 68, 13, 19),
    ('Mackenzie Dern', 3.47, .42, 3.93, .52, .93, .18, .38, 1.06, 75, 14, 11),
    ('Valentina Shevchenko', 3.04, .53, 2.00, .64, 2.65, .62, .76, .29, 66, 14, 21),
    ('Kayla Harrison', 4.29, .62, 1.10, .66, 2.84, .38, 1.00, .95, 71, 20, 9),
    ('Alexandre Pantoja', 4.38, .50, 3.88, .50, 2.79, .48, .69, .98, 63, 21, 16),
    ('Merab Dvalishvili', 4.42, .42, 2.80, .54, 5.97, .35, .76, .35, 67, 17, 16),
    ('Ilia Topuria', 4.81, .48, 3.83, .64, 1.96, .61, .94, 1.07, 71, 17, 12),
    ('Ian Machado Garry', 4.78, .54, 2.86, .53, .92, .31, .80, .37, 56, 19, 25),
    ('Khamzat Chimaev', 4.01, .54, 2.98, .52, 5.32, .58, .88, 1.37, 76, 15, 9),
    ('Alex Pereira', 5.16, .62, 3.50, .54, .11, .50, .79, .23, 47, 26, 27),
    ('Ciryl Gane', 5.29, .62, 2.33, .61, .68, .25, .47, .60, 43, 28, 29),
    ('Zhang Weili', 4.66, .53, 2.63, .53, 1.96, .45, .64, .45, 59, 17, 24),
    ('Conor McGregor', 5.32, .50, 4.66, .54, .67, .56, .67, .13, 70, 17, 13),
    ('Max Holloway', 6.91, .48, 4.61, .59, .23, .53, .81, .28, 65, 24, 11),
    ('Manel Kape', 5.04, .56, 4.08, .57, .40, .30, .81, .27, 66, 19, 15),
    ('Kyoji Horiguchi', 3.77, .47, 2.13, .64, 1.61, .41, .61, .11, 62, 20, 18),
    ('Ion Cutelaba', 4.23, .44, 3.28, .48, 3.76, .49, .76, .19, 68, 19, 13),
    ('Navajo Stirling', 6.25, .52, 2.67, .58, .98, .29, .82, 0, 63, 18, 19),
    ('Hyder Amil', 5.81, .53, 3.95, .51, .56, .18, .66, .84, 66, 20, 14),
    ('Christian Rodriguez', 3.85, .50, 2.85, .57, 1.75, .41, .67, 1.05, 64, 21, 15),
    ('Rafael Fiziev', 4.71, .53, 4.84, .50, .83, .67, .90, 0, 55, 19, 26),
    ('Manuel Torres', 7.29, .60, 4.08, .54, 1.72, .67, .91, .86, 70, 17, 13),
    ('Shara Magomedov', 5.93, .63, 3.85, .44, 0, 0, .71, 0, 58, 20, 22),
    ('Michel Pereira', 4.46, .52, 4.40, .51, 1.21, .57, .76, .65, 67, 19, 14),
    ('Asu Almabayev', 2.31, .51, 1.99, .54, 4.46, .43, .44, 1.49, 65, 22, 13),
    ('Charles Johnson', 4.77, .50, 4.02, .56, .51, .17, .69, .34, 62, 21, 17),
    ('Benoît Saint Denis', 5.62, .59, 4.09, .42, 4.19, .36, .72, 1.75, 69, 19, 12),
    ('Paddy Pimblett', 5.49, .53, 3.89, .43, .69, .21, .44, 1.20, 68, 20, 12),
    ('Cory Sandhagen', 4.86, .45, 3.47, .57, 1.15, .35, .56, .25, 59, 20, 21),
    ('Mario Bautista', 5.30, .49, 3.98, .55, 1.91, .38, .56, .85, 65, 20, 15),
    ('Brandon Royval', 5.54, .42, 4.25, .43, .65, .75, .45, 1.08, 68, 19, 13),
    ('Lone’er Kavanagh', 4.13, .49, 3.49, .57, 1.12, .45, .94, .22, 61, 20, 19)
)
INSERT OR REPLACE INTO fighter_stats
    (fighter_id, slpm, str_acc, sapm, str_def, td_avg, td_acc, td_def, sub_avg,
     head_pct, body_pct, leg_pct, updated_at)
SELECT f.id, s.slpm, s.str_acc, s.sapm, s.str_def, s.td_avg, s.td_acc, s.td_def,
       s.sub_avg, s.head_pct, s.body_pct, s.leg_pct, CURRENT_TIMESTAMP
FROM seed s
JOIN fighters f ON f.name = s.name COLLATE NOCASE;

INSERT OR REPLACE INTO champions(weight_class, fighter_id, display_order, since_text)
SELECT 'Flyweight', id, 1, '2026 snapshot' FROM fighters WHERE name = 'Joshua Van';
INSERT OR REPLACE INTO champions(weight_class, fighter_id, display_order, since_text)
SELECT 'Bantamweight', id, 2, '2026 snapshot' FROM fighters WHERE name = 'Petr Yan';
INSERT OR REPLACE INTO champions(weight_class, fighter_id, display_order, since_text)
SELECT 'Featherweight', id, 3, '2026 snapshot' FROM fighters WHERE name = 'Alexander Volkanovski';
INSERT OR REPLACE INTO champions(weight_class, fighter_id, display_order, since_text)
SELECT 'Lightweight', id, 4, '2026 snapshot' FROM fighters WHERE name = 'Justin Gaethje';
INSERT OR REPLACE INTO champions(weight_class, fighter_id, display_order, since_text)
SELECT 'Welterweight', id, 5, '2026 snapshot' FROM fighters WHERE name = 'Islam Makhachev';
INSERT OR REPLACE INTO champions(weight_class, fighter_id, display_order, since_text)
SELECT 'Middleweight', id, 6, '2026 snapshot' FROM fighters WHERE name = 'Sean Strickland';
INSERT OR REPLACE INTO champions(weight_class, fighter_id, display_order, since_text)
SELECT 'Light Heavyweight', id, 7, '2026 snapshot' FROM fighters WHERE name = 'Carlos Ulberg';
INSERT OR REPLACE INTO champions(weight_class, fighter_id, display_order, since_text)
SELECT 'Heavyweight', id, 8, '2026 snapshot' FROM fighters WHERE name = 'Tom Aspinall';
INSERT OR REPLACE INTO champions(weight_class, fighter_id, display_order, since_text)
SELECT 'Women''s Strawweight', id, 9, '2026 snapshot' FROM fighters WHERE name = 'Mackenzie Dern';
INSERT OR REPLACE INTO champions(weight_class, fighter_id, display_order, since_text)
SELECT 'Women''s Flyweight', id, 10, '2026 snapshot' FROM fighters WHERE name = 'Valentina Shevchenko';
INSERT OR REPLACE INTO champions(weight_class, fighter_id, display_order, since_text)
SELECT 'Women''s Bantamweight', id, 11, '2026 snapshot' FROM fighters WHERE name = 'Kayla Harrison';

INSERT OR IGNORE INTO events(name, date, location, start_time, status, source_url)
VALUES
    ('UFC Fight Night: Kape vs Horiguchi', '2026-06-20', 'Meta APEX, Las Vegas, United States', '20:00 EDT', 'upcoming', 'https://www.ufc.com/event/ufc-fight-night-june-20-2026'),
    ('UFC Fight Night: Fiziev vs Torres', '2026-06-27', 'National Gymnastics Arena, Baku, Azerbaijan', '12:00 EDT', 'upcoming', 'https://www.ufc.com/event/ufc-fight-night-june-27-2026'),
    ('UFC 329: McGregor vs Holloway 2', '2026-07-11', 'T-Mobile Arena, Las Vegas, United States', '21:00 EDT', 'upcoming', 'https://www.ufc.com/event/ufc-329');

INSERT OR IGNORE INTO fights(event_id, fighter1_id, fighter2_id, weight_class, result, method, round, card_type, bout_order)
SELECT e.id, a.id, b.id, 'Flyweight', NULL, NULL, NULL, 'Main Card', 1
FROM events e, fighters a, fighters b
WHERE e.name = 'UFC Fight Night: Kape vs Horiguchi' AND a.name = 'Manel Kape' AND b.name = 'Kyoji Horiguchi';
INSERT OR IGNORE INTO fights(event_id, fighter1_id, fighter2_id, weight_class, result, method, round, card_type, bout_order)
SELECT e.id, a.id, b.id, 'Light Heavyweight', NULL, NULL, NULL, 'Main Card', 2
FROM events e, fighters a, fighters b
WHERE e.name = 'UFC Fight Night: Kape vs Horiguchi' AND a.name = 'Ion Cutelaba' AND b.name = 'Navajo Stirling';
INSERT OR IGNORE INTO fights(event_id, fighter1_id, fighter2_id, weight_class, result, method, round, card_type, bout_order)
SELECT e.id, a.id, b.id, 'Featherweight', NULL, NULL, NULL, 'Main Card', 3
FROM events e, fighters a, fighters b
WHERE e.name = 'UFC Fight Night: Kape vs Horiguchi' AND a.name = 'Hyder Amil' AND b.name = 'Christian Rodriguez';

INSERT OR IGNORE INTO fights(event_id, fighter1_id, fighter2_id, weight_class, result, method, round, card_type, bout_order)
SELECT e.id, a.id, b.id, 'Lightweight', NULL, NULL, NULL, 'Main Card', 1
FROM events e, fighters a, fighters b
WHERE e.name = 'UFC Fight Night: Fiziev vs Torres' AND a.name = 'Rafael Fiziev' AND b.name = 'Manuel Torres';
INSERT OR IGNORE INTO fights(event_id, fighter1_id, fighter2_id, weight_class, result, method, round, card_type, bout_order)
SELECT e.id, a.id, b.id, 'Middleweight', NULL, NULL, NULL, 'Main Card', 2
FROM events e, fighters a, fighters b
WHERE e.name = 'UFC Fight Night: Fiziev vs Torres' AND a.name = 'Shara Magomedov' AND b.name = 'Michel Pereira';
INSERT OR IGNORE INTO fights(event_id, fighter1_id, fighter2_id, weight_class, result, method, round, card_type, bout_order)
SELECT e.id, a.id, b.id, 'Flyweight', NULL, NULL, NULL, 'Main Card', 3
FROM events e, fighters a, fighters b
WHERE e.name = 'UFC Fight Night: Fiziev vs Torres' AND a.name = 'Asu Almabayev' AND b.name = 'Charles Johnson';

INSERT OR IGNORE INTO fights(event_id, fighter1_id, fighter2_id, weight_class, result, method, round, card_type, bout_order)
SELECT e.id, a.id, b.id, 'Welterweight', NULL, NULL, NULL, 'Main Card', 1
FROM events e, fighters a, fighters b
WHERE e.name = 'UFC 329: McGregor vs Holloway 2' AND a.name = 'Conor McGregor' AND b.name = 'Max Holloway';
INSERT OR IGNORE INTO fights(event_id, fighter1_id, fighter2_id, weight_class, result, method, round, card_type, bout_order)
SELECT e.id, a.id, b.id, 'Lightweight', NULL, NULL, NULL, 'Main Card', 2
FROM events e, fighters a, fighters b
WHERE e.name = 'UFC 329: McGregor vs Holloway 2' AND a.name = 'Benoît Saint Denis' AND b.name = 'Paddy Pimblett';
INSERT OR IGNORE INTO fights(event_id, fighter1_id, fighter2_id, weight_class, result, method, round, card_type, bout_order)
SELECT e.id, a.id, b.id, 'Bantamweight', NULL, NULL, NULL, 'Main Card', 3
FROM events e, fighters a, fighters b
WHERE e.name = 'UFC 329: McGregor vs Holloway 2' AND a.name = 'Cory Sandhagen' AND b.name = 'Mario Bautista';
INSERT OR IGNORE INTO fights(event_id, fighter1_id, fighter2_id, weight_class, result, method, round, card_type, bout_order)
SELECT e.id, a.id, b.id, 'Flyweight', NULL, NULL, NULL, 'Main Card', 4
FROM events e, fighters a, fighters b
WHERE e.name = 'UFC 329: McGregor vs Holloway 2' AND a.name = 'Brandon Royval' AND b.name = 'Lone’er Kavanagh';

INSERT OR REPLACE INTO app_metadata(key, value, updated_at)
VALUES
    ('dataset_snapshot', '2026-06-20', CURRENT_TIMESTAMP),
    ('dataset_source', 'UFC.com verified starter dataset', CURRENT_TIMESTAMP),
    ('dataset_mode', 'offline snapshot', CURRENT_TIMESTAMP);

