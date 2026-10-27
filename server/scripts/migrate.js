"use strict";

/* ==========================================================================
   scripts/migrate.js – kjører migreringene

   Migreringene kjører automatisk ved oppstart av API-et. Dette skriptet
   finnes fordi det er nyttig å kjøre dem uten å starte serveren.
   ========================================================================== */

const { openDatabase, migrate, defaultDbPath } = require("../src/db");

const dbPath = defaultDbPath();

const db = openDatabase(dbPath);

migrate(db);

console.log("Databasen er oppdatert:", dbPath);
