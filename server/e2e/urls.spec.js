"use strict";

/* ==========================================================================
   e2e/urls.spec.js – hvordan appen ligger på webserveren

   Vi har to utgaven av appen. Startadressen "/" skal gi den utgaven
   som passer til skjermen, og de andre adressene skal alltid virke.
   ========================================================================== */

const { test, expect } = require("@playwright/test");

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

test.describe("Adressene til appen", () => {
  test("startadressen gir skrivebordsutgaven på en datamaskin", async ({ page }) => {
    await page.goto("/");

    /* Skrivebordsutgaven kjennetegnes av innloggingen i et kort, uten
       telefonramme rundt. */
    await expect(page.locator(".login-form")).toBeVisible();
    await expect(page.locator(".phone-frame")).toHaveCount(0);
  });

  test("startadressen gir mobilutgaven på en telefon", async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: MOBILE_UA,
      viewport: { width: 430, height: 932 },
    });

    try {
      const page = await context.newPage();

      await page.goto("/");

      /* Mobilutgaven kjennetegnes av telefonrammen, og den har ingen
         toppmeny. */
      await expect(page.locator(".phone-frame")).toBeVisible();
      await expect(page.locator(".topbar")).toHaveCount(0);
      await expect(page.locator(".login-form")).toBeVisible();

      /* På en telefon er rammen borte, og appen fyller skjermen. */
      await expect(page.locator(".status-bar")).toBeHidden();
    } finally {
      await context.close();
    }
  });

  test("begge utgavene har sin egen adresse", async ({ page }) => {
    await page.goto("/index.html");

    /* Mobilutgaven har telefonrammen. */
    await expect(page.locator(".phone-frame")).toBeVisible();

    await page.goto("/index-desktop.html");

    /* Skrivebordsutgaven har ikke det. */
    await expect(page.locator(".login-form")).toBeVisible();
    await expect(page.locator(".phone-frame")).toHaveCount(0);
  });

  test("skrivebordsutgaven lenker til mobilappen", async ({ page }) => {
    await page.goto("/index-desktop.html");

    await page.fill("#epost", "e2e@example.no");
    await page.fill("#passord", "e2e-passord123");
    await page.click("button.login-btn");

    await page.waitForSelector(".trip-card");

    await page.getByRole("link", { name: "Innstillinger" }).click();

    const link = page.getByRole("link", { name: "Åpne mobilappen" });

    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/index.html");
  });
});
