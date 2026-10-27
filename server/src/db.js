"use strict";

/* ==========================================================================
   db.js – åpner databasen og kjører migreringene

   Databasen er en vanlig SQLite-fil. Skjemaet kommer fra db/schema.sql,
   og referansedata fra db/seed.sql. Begge kjøres automatisk ved oppstart,
   og bare én gang hver, styrt av tabellen schema_migrations.
   ========================================================================== */

const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

/* Skjemafilene ligger i db/ i prosjektroten, ikke i server/. */
const MIGRATION_DIR = path.join(__dirname, "..", "..", "db");

/* Rekkefølgen her bestemmer rekkefølgen migreringene kjøres i. */
const MIGRATIONS = [
  { version: "001_init", file: path.join(MIGRATION_DIR, "schema.sql") },
  { version: "002_reference_data", file: path.join(MIGRATION_DIR, "seed.sql") },
];

/* Standardstien til databasen. I produksjon settes DB_PATH i miljøet,
   slik at filen ligger utenfor webroten.

   Stien slås opp hver gang den brukes, og ikke når modulen lastes.
   Ellers ville en endring av DB_PATH etter at modulen er lastet, bli
   ignorert. */
function defaultDbPath() {
  return process.env.DB_PATH || path.join(__dirname, "..", "data", "app.db");
}

/* Åpner databasen og setter alle innstillingene vi trenger.
   Innstillingene må settes per tilkobling, og det er derfor de står her
   og ikke i en pragma-kommando inne i skjemafilene. */
function openDatabase(dbPath = defaultDbPath()) {
  const file = dbPath === ":memory:" ? dbPath : path.resolve(dbPath);

  if (file !== ":memory:") {
    const dir = path.dirname(file);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(file);

  /* WAL gjør at lesere ikke stopper skriveren. */
  db.pragma("journal_mode = WAL");

  /* Denne er AV i SQLite som standard. Uten den blir
     ON DELETE CASCADE og ON DELETE SET NULL ignorert. */
  db.pragma("foreign_keys = ON");

  /* Vent på en opptatt database i stedet for å kaste feil. */
  db.pragma("busy_timeout = 5000");

  db.pragma("synchronous = NORMAL");

  return db;
}

/* Kjører migreringene som ikke er kjørt før. Hver migrering kjøres i
   sin egen transaksjon, så en feilende migrering ikke gir en halvferdig
   database. */
function migrate(db) {
  /* Tabellen med versjonene lages av den første migreringen, så den
     finnes ikke ennå når vi kjører for første gang. */
  const versionsTableExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
    )
    .get();

  const applied = new Set(
    versionsTableExists
      ? db.prepare("SELECT version FROM schema_migrations").all().map((row) => row.version)
      : [],
  );

  const runMigrations = db.transaction(() => {
    for (const migration of MIGRATIONS) {
      if (applied.has(migration.version)) {
        continue;
      }

      const sql = fs.readFileSync(migration.file, "utf8");

      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(migration.version);

      console.log("migrering kjørt:", migration.version);
    }
  });

  runMigrations();
}

module.exports = { openDatabase, migrate, defaultDbPath, MIGRATIONS };
