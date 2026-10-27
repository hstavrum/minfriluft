"use strict";

/* ==========================================================================
   e2e/playwright.config.js – oppsettet for end-to-end-testene

   Testene kjører mot en ekte server med en ekte database, i en ekte
   nettleser. Playwright starter serveren selv, og rydder den opp når
   testene er ferdige.
   ========================================================================== */

const { defineConfig } = require("@playwright/test");
const { BASE_URL, CHANNEL } = require("./config");

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: "**/*.spec.js",

  /* Serveren må starte, og turene går gjennom nettleseren. */
  timeout: 30000,
  expect: { timeout: 5000 },

  /* Testene deler én database, så de kjøres etter hverandre. */
  fullyParallel: false,
  workers: 1,

  reporter: [["list"]],

  use: {
    baseURL: BASE_URL,
    channel: CHANNEL,
    viewport: { width: 1280, height: 800 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },

  webServer: {
    /* Stien er absolutt, fordi Playwright kjører kommandoen fra
       mappen konfigurasjonen ligger i. */
    command: `node "${__dirname}/start-server.js"`,
    url: BASE_URL + "/api/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
