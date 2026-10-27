"use strict";

/* ==========================================================================
   e2e/mobile.spec.js – end-to-end-tester for mobilutgaven

   Testene kjører mot en ekte server, med ekte data i SQLite, i en ekte
   nettleser. Hver test går gjennom den samme veien som en bruker:
   logge inn, lage noe, og se at det ligger der neste gang.
   ========================================================================== */

const { test, expect } = require("@playwright/test");
const { loginMobile, EMAIL, PASSWORD } = require("./helpers");

/* Mobilappen er en telefonmock. */
test.use({ viewport: { width: 390, height: 844 } });

test.describe("Mobilutgaven", () => {
  test("viser innloggingen når vi ikke er logget inn", async ({ page }) => {
    await page.goto("/index.html");

    await expect(page.locator(".login-form")).toBeVisible();
  });

  test("avviser feil passord", async ({ page }) => {
    await page.goto("/index.html");

    await page.fill("#epost", EMAIL);
    await page.fill("#passord", "feil-passord");
    await page.click("button.login-btn");

    await expect(page.locator(".login-error")).toHaveText(
      "E-post eller passord er feil.",
    );
    await expect(page.locator(".login-form")).toBeVisible();
  });

  test("forklarer hva som er feil når API-et ikke svarer", async ({ page }) => {
    /* Vi etterligner en statisk webserver som svarer på /api, altså at
       Node-serveren ikke er koblet til. */
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({
        status: 404,
        contentType: "text/html",
        body: "<html><body>Not Found</body></html>",
      }),
    );

    await page.goto("/index.html");

    await page.fill("#epost", EMAIL);
    await page.fill("#passord", PASSWORD);
    await page.click("button.login-btn");

    await expect(page.locator(".login-error")).toContainText("404");
  });

  test("logger inn og viser turene", async ({ page }) => {
    await loginMobile(page);

    await expect(
      page.locator(".trip-card", { hasText: "Sykkeltur til Fjellheia" }),
    ).toBeVisible();
  });

  test("husker innloggingen etter en omlasting", async ({ page }) => {
    await loginMobile(page);

    await page.reload();

    /* Vi skal ikke havne på innloggingen igjen. */
    await expect(page.locator(".trip-card").first()).toBeVisible();
    await expect(page.locator(".login-form")).toHaveCount(0);
  });

  test("lager en tur som overlever en omlasting", async ({ page }) => {
    await loginMobile(page);

    await page.click(".floating-action");
    await page.fill("#tittel", "E2E-tur fra mobil");
    await page.fill("#sted", "Testtoppen");
    await page.fill("#dato", "2026-10-20");
    await page.click(".btn-group .btn-primary");

    await expect(page.locator(".detail-content")).toContainText("E2E-tur fra mobil");

    await page.reload();

    await expect(
      page.locator(".trip-card", { hasText: "E2E-tur fra mobil" }),
    ).toBeVisible();
  });

  test("lager et notat som overlever en omlasting", async ({ page }) => {
    await loginMobile(page);

    await page.click(".nav-item:has-text('Notater')");
    await page.click(".floating-action");

    await page.fill("input[placeholder*='Sesongplanlegging']", "E2E-notat fra mobil");
    await page.fill("#notat", "Tekst fra end-to-end-testen.");
    await page.click(".action-bar .btn-primary");

    await expect(page.locator("#viewTitle")).toHaveText("E2E-notat fra mobil");

    await page.reload();
    await page.click(".nav-item:has-text('Notater')");

    await expect(
      page.locator(".note-card", { hasText: "E2E-notat fra mobil" }),
    ).toBeVisible();
  });

  test("kan ikke slette en aktivitet som er i bruk av en tur", async ({ page }) => {
    await loginMobile(page);

    await page.click(".nav-item:has-text('Innstillinger')");

    /* «Bærtur» brukes av en av demodataene. Vi peker på navnet, så
       testen ikke er avhengig av rekkefølgen på listene. */
    await page
      .locator(".chip", { hasText: "Bærtur" })
      .locator(".remove")
      .click();

    await expect(page.locator(".login-error")).toHaveText(
      "Aktiviteten er brukt av en tur, og kan ikke slettes.",
    );
  });

  test("legger til en aktivitet i innstillingene", async ({ page }) => {
    await loginMobile(page);

    await page.click(".nav-item:has-text('Innstillinger')");

    const section = page.locator(".manager-section").first();

    await section.locator(".add-row input").fill("Kajakk");
    await section.locator(".add-btn").click();

    await expect(section.locator(".chip", { hasText: "Kajakk" })).toBeVisible();
  });

  test("søker i turene og notatene", async ({ page }) => {
    await loginMobile(page);

    await page.click(".nav-item:has-text('Søk')");

    await expect(page.locator(".page-search")).toBeVisible();
    await expect(page.locator("#searchInput")).toBeVisible();

    /* Uten søkeord får vi alle turene. */
    await expect(page.locator(".trip-card").first()).toBeVisible();

    /* Søker vi på et sted, finner vi turen som ligger der. */
    await page.fill("#searchInput", "Fjellheia");
    await page.click(".search-btn");

    await expect(
      page.locator(".trip-card", { hasText: "Sykkeltur til Fjellheia" }),
    ).toBeVisible();
    await expect(
      page.locator(".trip-card", { hasText: "Bærtur til Holtet" }),
    ).toHaveCount(0);

    /* Treffet markeres i teksten. */
    await expect(page.locator(".match-highlight").first()).toHaveText("Fjellheia");

    /* Et ordn som ikke passer, gir ingen treff. */
    await page.fill("#searchInput", "finnesikke");
    await page.click(".search-btn");

    await expect(page.locator(".trip-card")).toHaveCount(0);
    await expect(page.locator(".empty-text")).toContainText("Ingen treff");
  });

  test("filtrerer søket på aktivitet og sesong", async ({ page }) => {
    await loginMobile(page);

    await page.click(".nav-item:has-text('Søk')");

    await page.selectOption("#searchActivity", { label: "Sykkeltur" });

    await expect(
      page.locator(".trip-card", { hasText: "Sykkeltur til Fjellheia" }),
    ).toBeVisible();
    await expect(
      page.locator(".trip-card", { hasText: "Bærtur til Holtet" }),
    ).toHaveCount(0);

    /* Sykkelturen er i oktober, altså høst. Bærturen er i august,
       altså sommer. */
    await page.selectOption("#searchActivity", { label: "Alle" });
    await page.click(".filter-chip:has-text('Høst')");

    await expect(
      page.locator(".trip-card", { hasText: "Sykkeltur til Fjellheia" }),
    ).toBeVisible();
    await expect(
      page.locator(".trip-card", { hasText: "Bærtur til Holtet" }),
    ).toHaveCount(0);
  });

  test("åpner en tur fra treffene i søket", async ({ page }) => {
    await loginMobile(page);

    await page.click(".nav-item:has-text('Søk')");
    await page.fill("#searchInput", "Holtet");
    await page.click(".search-btn");

    await page.click(".trip-card:has-text('Bærtur til Holtet')");

    await expect(page.locator(".detail-content")).toContainText("Bærtur til Holtet");
  });

  test("fyller hele skjermen på en ekte telefon", async ({ page }) => {
    await loginMobile(page);

    /* Telefonrammen og den falske statuslinja er en forhåndsvisning
       for datamaskiner. På en telefon skal appen fylle skjermen. */
    await expect(page.locator(".status-bar")).toBeHidden();

    const frame = await page.locator(".phone-frame").evaluate((element) => {
      const style = window.getComputedStyle(element);
      const box = element.getBoundingClientRect();

      return {
        radius: style.borderRadius,
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
    });

    expect(frame.radius).toBe("0px");
    expect(frame.width).toBe(390);
    expect(frame.height).toBe(844);
  });

  test("logger ut fra innstillingene", async ({ page }) => {
    await loginMobile(page);

    await page.click(".nav-item:has-text('Innstillinger')");

    /* Vi ser hvem vi er logget inn som, og kan logge ut. */
    await expect(page.locator(".account-text").first()).toContainText(EMAIL);

    await page.click(".outline-btn:has-text('Logg ut')");

    /* Innloggingen er framme igjen, og vi er ikke logget inn. */
    await expect(page.locator(".login-form")).toBeVisible();

    await page.reload();

    await expect(page.locator(".login-form")).toBeVisible();
  });

  test("sletter en tur", async ({ page }) => {
    await loginMobile(page);

    /* Vi lager turen vi skal slette, så testen ikke er avhengig av
       de andre testene. */
    await page.click(".floating-action");
    await page.fill("#tittel", "E2E-tur som slettes");
    await page.fill("#sted", "Testtoppen");
    await page.fill("#dato", "2026-10-21");
    await page.click(".btn-group .btn-primary");

    await expect(page.locator(".detail-content")).toContainText("E2E-tur som slettes");

    await page.click(".menu-wrap .icon-btn");
    await page.click(".menu-item.danger");
    await page.click(".dialog-btn.danger");

    await expect(
      page.locator(".trip-card", { hasText: "E2E-tur som slettes" }),
    ).toHaveCount(0);
  });
});
