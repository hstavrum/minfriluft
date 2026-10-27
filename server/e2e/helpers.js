"use strict";

/* ==========================================================================
   e2e/helpers.js – felles hjelpere for end-to-end-testene
   ========================================================================== */

const { EMAIL, PASSWORD } = require("./config");

/* Logger inn på mobilutgaven og venter på at turlisten er framme. */
async function loginMobile(page) {
  await page.goto("/index.html");

  await page.fill("#epost", EMAIL);
  await page.fill("#passord", PASSWORD);
  await page.click("button.login-btn");

  await page.waitForSelector(".trip-card");
}

/* Logger inn på desktop-utgaven og venter på at forsiden er framme. */
async function loginDesktop(page) {
  await page.goto("/index-desktop.html");

  await page.fill("#epost", EMAIL);
  await page.fill("#passord", PASSWORD);
  await page.click("button.login-btn");

  await page.waitForSelector(".trip-card");
}

module.exports = { loginMobile, loginDesktop, EMAIL, PASSWORD };
