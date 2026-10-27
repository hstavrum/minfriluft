-- ==========================================================================
-- Min friluft – SQLite schema v1
--
-- Faste data (turer, notater, innstillinger) lagres i SQLite.
-- Backend: Node.js (Express) bak NGINX.
--
-- Konvensjoner:
--   - Alle tidsstempler er TEXT i ISO-8601: "2026-10-23T13:09:00".
--     SQLite har ingen egen dato-type; TEXT sorterer riktig kronologisk.
--   - Datoer bruker "YYYY-MM-DD" (ISO-8601), som gir riktig sortering
--     og kan sammenlignes med strcmp() i SQL.
--   - updated_at settes av serveren, aldri av nettleseren.
--   - Referanser til brukerens egne lister (activities, topics, counties)
--     settes til NULL ved sletting, slik at ingen tur går i stykken.
-- ==========================================================================

PRAGMA foreign_keys = ON;

-- --------------------------------------------------------------------------
-- Migreringer: versjonen av skjemaet som er kjørt i denne databasen.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- --------------------------------------------------------------------------
-- Brukere og innlogging
-- --------------------------------------------------------------------------

-- En bruker per konto. E-post er brukernavn, og sammenlignes
-- uten skilletegn mellom store og små bokstaver.
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,                 -- bcrypt, cost 12
  display_name  TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Server-side sesjoner. Vi bruker tabell og ikke JWT, slik at en
-- administrator kan logge ut en bruker ved å slette raden.
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,                  -- 32 byte random, hex
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  user_agent TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- --------------------------------------------------------------------------
-- Brukerens egne lister (deles ikke mellom brukere)
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS activities (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity   TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Samme navn kan ikke brukes to ganger for samme bruker.
CREATE UNIQUE INDEX IF NOT EXISTS uq_activities_user_name
  ON activities(user_id, activity COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS topics (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic      TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_topics_user_name
  ON topics(user_id, topic COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS counties (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  county     TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_counties_user_name
  ON counties(user_id, county COLLATE NOCASE);

-- --------------------------------------------------------------------------
-- Faste referansedata (deles av alle brukere, settes av seed.sql)
-- --------------------------------------------------------------------------

-- Motivene som brukes i stedet for opplastede bilder. id-ene 1-6 må
-- matche modellens templateId, ellers vises feil motiv.
CREATE TABLE IF NOT EXISTS image_templates (
  id    INTEGER PRIMARY KEY,
  label TEXT NOT NULL,
  svg   TEXT NOT NULL
);

-- Sesongene regnes ut fra datoen, men ligger i tabell slik at
-- nedtrekksmenyen i søket kan hentes fra serveren.
-- start_month > end_month betyr at sesongen går over årsskiftet
-- (vinter: desember til februar).
-- is_all=1 gjelder "Alle", som bare er et filter uten sesong:
-- den skal ikke treffe i visningen under.
CREATE TABLE IF NOT EXISTS seasons (
  id          INTEGER PRIMARY KEY,
  season      TEXT NOT NULL,
  start_month INTEGER NOT NULL,
  end_month   INTEGER NOT NULL,
  is_all      INTEGER NOT NULL DEFAULT 0
);

-- --------------------------------------------------------------------------
-- Turer
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS trips (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
  county_id   INTEGER REFERENCES counties(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  location    TEXT NOT NULL DEFAULT '',
  trip_date   TEXT NOT NULL,                    -- "YYYY-MM-DD"
  description TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_trips_user_date     ON trips(user_id, trip_date DESC);
CREATE INDEX IF NOT EXISTS idx_trips_user_activity ON trips(user_id, activity_id);
CREATE INDEX IF NOT EXISTS idx_trips_user_county   ON trips(user_id, county_id);

-- Bildene på en tur. Hver rad er ett bilde, og position bevarer
-- rekkefølgen i bildekarusellen. Bildene tilhører turen, så det
-- trengs ingen egen bildetabell.
CREATE TABLE IF NOT EXISTS trip_images (
  trip_id     INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES image_templates(id),
  position    INTEGER NOT NULL,
  PRIMARY KEY (trip_id, position)
);

CREATE INDEX IF NOT EXISTS idx_trip_images_trip ON trip_images(trip_id);

-- --------------------------------------------------------------------------
-- Notater
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  note_date   TEXT NOT NULL,                    -- "YYYY-MM-DD"
  description TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notes_user_date ON notes(user_id, note_date DESC);

-- Emneknaggene til et notat. Erstatter topics-listen i modellen.
CREATE TABLE IF NOT EXISTS note_topics (
  note_id  INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_note_topics_topic ON note_topics(topic_id);

-- --------------------------------------------------------------------------
-- Utsikt: turer med sesong regnet ut fra datoen
-- --------------------------------------------------------------------------

DROP VIEW IF EXISTS trips_with_season;
CREATE VIEW trips_with_season AS
SELECT
  t.*,
  s.id     AS season_id,
  s.season AS season_name
FROM trips t
LEFT JOIN seasons s
  ON s.is_all = 0
 AND ( (s.start_month <= s.end_month
       AND CAST(strftime('%m', t.trip_date) AS INTEGER) BETWEEN s.start_month AND s.end_month)
    OR (s.start_month > s.end_month
       AND (CAST(strftime('%m', t.trip_date) AS INTEGER) >= s.start_month
         OR CAST(strftime('%m', t.trip_date) AS INTEGER) <= s.end_month)) );

-- --------------------------------------------------------------------------
-- Fulltekst-søk (valgfritt, kan tas i bruk senere)
--
-- Søkefeltet i appen filtrerer i dag i nettleseren. Blir treffene
-- sakte, kan denne tabellen tas i bruk:
--
--   CREATE VIRTUAL TABLE trips_fts USING fts5(
--     title, location, description, content='trips', content_rowid='id'
--   );
--   CREATE VIRTUAL TABLE notes_fts USING fts5(
--     title, description, content='notes', content_rowid='id'
--   );
--
-- ... sammen med triggere på trips og notes som holder tabellene
-- i sync, og SELECT ... FROM trips_fts WHERE trips_fts MATCH ?.
-- --------------------------------------------------------------------------
