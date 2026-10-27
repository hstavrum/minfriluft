"use strict";

/* ==========================================================================
   e2e/start-server.js – starter serveren som end-to-end-testene bruker

   Serveren får sin egen database i en midlertidig mappe, med demodata
   og en demobruker. Static-root peker på public-mappen, slik at appen
   og API-et ligger på samme opprinnelse, akkurat som bak NGINX.
   ========================================================================== */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { PORT, EMAIL, PASSWORD } = require("./config");

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "minfriluft-e2e-"));
const dbPath = path.join(directory, "e2e.db");

/* Miljøvariablene må settes FØR db.js lastes. Standardstien til
   databasen blir bestemt når modulen lastes, så setter vi DB_PATH
   først, ellers åpner serveren en annen database enn den vi fyller. */
process.env.DB_PATH = dbPath;
process.env.STATIC_ROOT = path.join(__dirname, "..", "..", "public");
process.env.COOKIE_SECURE = "false";
process.env.PORT = String(PORT);
process.env.NODE_ENV = "test";

const { openDatabase, migrate } = require("../src/db");
const { importDemoData } = require("../src/demoData");

const db = openDatabase(dbPath);

migrate(db);

importDemoData(db, { email: EMAIL, password: PASSWORD });

db.close();

require("../src/server.js");
