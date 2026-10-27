"use strict";

/* ==========================================================================
   server.js – starter API-et

   Kjøres av systemd i produksjon. NGINX snakker med denne prosessen på
   127.0.0.1, og prosessen er ikke tilgjengelig utenfra.
   ========================================================================== */

const { createApp } = require("./app");
const { deleteExpiredSessions } = require("./auth");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";

const app = createApp();

/* Rydder ut utløpte sesjoner en gang i timen. */
const cleanup = setInterval(() => {
  deleteExpiredSessions(app.locals.db);
}, 60 * 60 * 1000);

cleanup.unref();

app.listen(PORT, HOST, () => {
  console.log("Min friluft-API lytter på http://" + HOST + ":" + PORT);
});
