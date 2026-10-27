"use strict";

/* ==========================================================================
   e2e/pwa.spec.js – tester at mobilappen er en installabel PWA

   Det viktige er at appen kan installeres, og at dataene alltid
   kommer fra serveren: service workeren skal ALDRI cachee /api.
   ========================================================================== */

const { test, expect } = require("@playwright/test");
const { chromium } = require("playwright");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { BASE_URL, CHANNEL, EMAIL, PASSWORD } = require("./config");
const { loginMobile } = require("./helpers");

/* Venter til service workeren har tatt kontroll over siden. */
async function waitForServiceWorker(page) {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
    timeout: 20000,
  });
}

/* Alle URL-ene som ligger i cache-styringen. */
async function readCachedPaths(page) {
  return page.evaluate(async () => {
    const names = await caches.keys();
    const paths = [];

    for (const name of names) {
      const cache = await caches.open(name);
      const requests = await cache.keys();

      for (const request of requests) {
        paths.push(new URL(request.url).pathname);
      }
    }

    return paths;
  });
}

test.describe("PWA", () => {
  test("manifesten serveres med ikonene", async ({ page }) => {
    const response = await page.request.get("/manifest.webmanifest");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("manifest+json");

    const manifest = await response.json();

    expect(manifest.name).toBe("Min friluft");
    expect(manifest.start_url).toBe("/index.html");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#2e7d32");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    /* Alle ikonene i manifestet må finnes. */
    for (const icon of manifest.icons) {
      const iconResponse = await page.request.get(icon.src);

      expect(iconResponse.status(), icon.src).toBe(200);
      expect(iconResponse.headers()["content-type"]).toContain("image/png");
    }
  });

  test("siden lenker til manifesten og registrerer service worker", async ({ page }) => {
    await page.goto("/index.html");

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      "manifest.webmanifest",
    );
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#2e7d32",
    );

    await waitForServiceWorker(page);

    /* Skallet ligger i cache, så appen kan starte uten nett. */
    const cached = await readCachedPaths(page);

    expect(cached).toContain("/index.html");
    expect(cached).toContain("/css/style.css");
    expect(cached).toContain("/js/api.js");
  });

  test("API-data blir aldri cachet", async ({ page }) => {
    await loginMobile(page);
    await waitForServiceWorker(page);

    /* Turene er hentet fra serveren nå. Ingen av dem skal ligge i
       cache-styringen. */
    const cached = await readCachedPaths(page);

    expect(cached.filter((path) => path.startsWith("/api/"))).toEqual([]);

    /* Og serveren sier at svarene ikke skal caches. */
    const response = await page.request.get("/api/trips");

    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toBe("no-store");
  });

  test("appen starter selv om nettet er borte", async ({ page, context }) => {
    await page.goto("/index.html");
    await waitForServiceWorker(page);

    /* Vi venter på at skallet er lagt i cache. */
    await page.waitForTimeout(500);

    await context.setOffline(true);

    await page.reload();

    /* Skallet kommer fra service workeren, så appen tegner seg.
       API-et nårs ikke, og derfor viser vi innloggingen. */
    await expect(page.locator(".login-form")).toBeVisible();

    await context.setOffline(false);
  });
});

/* Chrome lar ikke nettlesere som er i «inkognito» installere apper.
   Derfor bruker vi en egen profil her, akkurat som en vanlig telefon. */
test.describe("PWA – installasjon", () => {
  test("appen er installerbar, og knappen vises i innstillingene", async () => {
    const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "minfriluft-pwa-"));

    const context = await chromium.launchPersistentContext(profileDir, {
      channel: CHANNEL,
      headless: true,
      baseURL: BASE_URL,
    });

    try {
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);

      await page.goto("/index.html");

      /* Nettleseren gir oss installasjons-hendelsen. */
      await page.waitForFunction(() => pwa.canInstall(), null, { timeout: 20000 });

      /* Chrome sier fra hvis noe hindrer installasjon. Listen skal være
         tom, altså: appen kan installeres. */
      const installability = await cdp.send("Page.getInstallabilityErrors");

      expect(installability.installabilityErrors).toEqual([]);

      /* Logg inn, og gå til innstillingene. Der skal knappen være. */
      await page.fill("#epost", EMAIL);
      await page.fill("#passord", PASSWORD);
      await page.click("button.login-btn");

      await page.waitForSelector(".trip-card");
      await page.click(".nav-item:has-text('Innstillinger')");

      const konto = page.locator(".manager-section", {
        has: page.locator("h2", { hasText: "Konto" }),
      });

      await expect(konto.locator(".add-btn")).toHaveText("Legg til");
    } finally {
      await context.close();

      fs.rmSync(profileDir, { recursive: true, force: true });
    }
  });
});
