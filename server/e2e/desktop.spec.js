"use strict";

/* ==========================================================================
   e2e/desktop.spec.js – end-to-end-tester for desktop-utgaven

   Samme fremgangsmåte som mobil-testene: logge inn, lage noe, og se at
   det ligger der neste gang.
   ========================================================================== */

const { test, expect } = require("@playwright/test");
const { loginDesktop, EMAIL, PASSWORD } = require("./helpers");

test.describe("Desktop-utgaven", () => {
  test("viser innloggingen når vi ikke er logget inn", async ({ page }) => {
    await page.goto("/index-desktop.html");

    await expect(page.locator(".login-form")).toBeVisible();
  });

  test("fyller ikke konsollen med feil når vi ikke er logget inn", async ({ page }) => {
    /* Appen spør API-et om vi er logget inn ved oppstart. Svaret er 401,
       og det er helt normalt. Nettleseren logger det i utgangspunktet,
       men appen skal ikke gjøre det vanskeligere å lese. */
    const egneMeldinger = [];

    page.on("console", (message) => {
      if (message.text().includes("API-kallet feilet")) {
        egneMeldinger.push(message.text());
      }
    });
    page.on("pageerror", (error) => egneMeldinger.push(error.message));

    await page.goto("/index-desktop.html");
    await expect(page.locator(".login-form")).toBeVisible();
    await page.waitForTimeout(500);

    expect(egneMeldinger).toEqual([]);
  });

  test("avviser feil passord", async ({ page }) => {
    await page.goto("/index-desktop.html");

    await page.fill("#epost", EMAIL);
    await page.fill("#passord", "feil-passord");
    await page.click("button.login-btn");

    await expect(page.locator(".login-error")).toHaveText(
      "E-post eller passord er feil.",
    );
  });

  test("forklarer hva som er feil når API-et ikke svarer", async ({ page }) => {
    /* Vi etterligner en statisk webserver som svarer på /api, altså at
       Node-serveren ikke er koblet til. */
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({
        status: 501,
        contentType: "text/html",
        body: "<html><body>Not Implemented</body></html>",
      }),
    );

    await page.goto("/index-desktop.html");

    await page.fill("#epost", EMAIL);
    await page.fill("#passord", PASSWORD);
    await page.click("button.login-btn");

    await expect(page.locator(".login-error")).toContainText("HTTP 501");
  });

  test("logger inn og viser de siste turene", async ({ page }) => {
    await loginDesktop(page);

    await expect(page.locator(".trip-card").first()).toBeVisible();
    await expect(page.locator(".panel", { hasText: "Siste turer" })).toContainText(
      "Sykkeltur til Fjellheia",
    );
  });

  test("lager en tur som overlever en omlasting", async ({ page }) => {
    await loginDesktop(page);

    await page.getByRole("button", { name: "Ny tur" }).click();
    await page.fill("#tittel", "E2E-tur fra desktop");
    await page.fill("#sted", "Testtoppen");
    await page.fill("#dato", "2026-10-20");
    await page.getByRole("button", { name: "Lagre tur" }).click();

    await expect(page.locator(".view-header h1")).toHaveText("E2E-tur fra desktop");

    await page.reload();

    await expect(page.locator(".trip-card", { hasText: "E2E-tur fra desktop" })).toBeVisible();
  });

  test("lager et notat med emneknagg", async ({ page }) => {
    await loginDesktop(page);

    await page.getByRole("button", { name: "Nytt notat" }).click();
    await page.fill("#notatTittel", "E2E-notat fra desktop");
    await page.fill("#notatTekst", "Tekst fra end-to-end-testen.");
    await page.locator(".chip", { hasText: "Planlegging" }).click();
    await page.getByRole("button", { name: "Lagre notat" }).click();

    await expect(page.locator(".view-header h1")).toHaveText("E2E-notat fra desktop");

    await page.reload();

    await page.getByRole("link", { name: "Notater" }).click();
    await expect(page.locator(".note-card", { hasText: "E2E-notat fra desktop" })).toBeVisible();
  });

  test("kan ikke slette en aktivitet som er i bruk av en tur", async ({ page }) => {
    await loginDesktop(page);

    await page.getByRole("link", { name: "Innstillinger" }).click();

    /* «Bærtur» brukes av en av demodataene. Vi peker på navnet, så
       testen ikke er avhengig av rekkefølgen på listene. */
    await page
      .locator(".chip", { hasText: "Bærtur" })
      .locator(".remove")
      .click();

    await expect(page.locator(".error-text")).toHaveText(
      "Aktiviteten er brukt av en tur, og kan ikke slettes.",
    );
  });

  test("logger ut med knappen i toppmenyen", async ({ page }) => {
    await loginDesktop(page);

    await expect(page.locator(".topbar")).toBeVisible();

    await page.getByRole("button", { name: "Logg ut" }).click();

    /* Vi er tilbake på innloggingen. */
    await expect(page.locator(".login-form")).toBeVisible();
    await expect(page.locator(".topbar")).toHaveCount(0);

    /* Og vi er fortsatt utlogget etter en omlasting. */
    await page.reload();

    await expect(page.locator(".login-form")).toBeVisible();
  });

  test("søker i turene", async ({ page }) => {
    await loginDesktop(page);

    await page.getByRole("link", { name: "Søk" }).click();

    /* Søket kjøres når vi trykker Enter i søkefeltet. */
    await page.fill("#soketekst", "Fjellheia");
    await page.press("#soketekst", "Enter");

    await expect(
      page.locator(".list-row", { hasText: "Sykkeltur til Fjellheia" }),
    ).toBeVisible();
  });
});
