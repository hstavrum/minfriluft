"use strict";

/* ==========================================================================
   e2e/config.js – innstillinger for end-to-end-testene

   Testene starter en egen server med en egen database, så de rører
   ikke dataene på maskinen. Alle tester logger inn med demobrukeren.
   ========================================================================== */

const PORT = Number(process.env.E2E_PORT || 3311);

module.exports = {
  PORT,
  BASE_URL: "http://127.0.0.1:" + PORT,
  EMAIL: "e2e@example.no",
  PASSWORD: "e2e-passord123",

  /* Hvilken nettleser Playwright skal bruke. Standard er Chrome, som
     er installert på maskinen. Sett E2E_CHANNEL=msedge for Edge. */
  CHANNEL: process.env.E2E_CHANNEL || "chrome",
};
