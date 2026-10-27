"use strict";

/* ==========================================================================
   scripts/import-demo.js – importerer demodataene fra modellen

   Modellen i js/model.js inneholder en ferdig demo-database. Her henter vi
   den og legger den inn i databasen, som en bruker med egne turer og notater.

   Bruk:
     node scripts/import-demo.js --email demo@eksempel.no --password hemmelig

   Scriptet slår sammen lister, så det er trygt å kjøre det flere ganger:
   Da blir det bare laget en bruker til.
   ========================================================================== */

const { openDatabase, migrate } = require("../src/db");
const { findUserByEmail } = require("../src/users");
const { importDemoData } = require("../src/demoData");

function readArgument(name) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return null;
  }

  const value = process.argv[index + 1];

  return value && !value.startsWith("--") ? value : null;
}

function main() {
  const email = readArgument("--email");
  const password = readArgument("--password");
  const displayName = readArgument("--name") || "";

  if (!email || !password) {
    console.error(
      "Bruk: node scripts/import-demo.js --email E-POST --password PASSORD",
    );
    process.exitCode = 1;
    return;
  }

  const db = openDatabase();

  migrate(db);

  if (findUserByEmail(db, email)) {
    console.error("Brukeren finnes allerede:", email);
    process.exitCode = 1;
    return;
  }

  const result = importDemoData(db, { email, password, displayName });

  console.log("Demodata er importert:");
  console.log("  e-post: ", email);
  console.log("  turer:  ", result.trips);
  console.log("  notater:", result.notes);
}

main();
