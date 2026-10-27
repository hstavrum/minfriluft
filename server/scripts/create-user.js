"use strict";

/* ==========================================================================
   scripts/create-user.js – lager en brukerkonto

   Bruk:
     node scripts/create-user.js --email terje@example.no --password hemmelig
     node scripts/create-user.js --email ... --password ... --name "Terje"

   Brukeren får standardlister med aktiviteter, emneknagger og fylker.
   ========================================================================== */

const { openDatabase, migrate } = require("../src/db");
const { createUser, findUserByEmail } = require("../src/users");

/* Leser --navn verdi fra kommandolinjen. */
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
    console.error("Bruk: node scripts/create-user.js --email E-POST --password PASSORD [--name NAVN]");
    process.exitCode = 1;
    return;
  }

  const db = openDatabase();

  migrate(db);

  const existing = findUserByEmail(db, email);

  if (existing) {
    console.error("Brukeren finnes allerede:", email);
    process.exitCode = 1;
    return;
  }

  const user = createUser(db, { email, password, displayName });

  console.log("Brukeren er laget:");
  console.log("  id:   ", user.id);
  console.log("  e-post:", user.email);
  console.log("  navn: ", user.display_name || "(ikke satt)");
}

main();
