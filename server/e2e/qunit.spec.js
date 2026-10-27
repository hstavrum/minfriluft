"use strict";

/* ==========================================================================
   e2e/qunit.spec.js – kjører QUnit-testene i public/tests.html

   Controller-testene er skrevet for QUnit og ligger i public/test/.
   Her åpner vi tests.html i en ekte nettleser og sjekker resultatet.

   QUnit hentes fra en CDN. Hvis nettverket er utilgjengelig, hopper
   testen over i stedet for å feile.
   ========================================================================== */

const { test, expect } = require("@playwright/test");

test("QUnit-testene for controllerne består", async ({ page }) => {
  await page.addInitScript(() => {
    window.__qunitResult = null;

    window.addEventListener("load", () => {
      if (window.QUnit && typeof window.QUnit.on === "function") {
        window.QUnit.on("runEnd", (details) => {
          window.__qunitResult = details;
        });
      }
    });
  });

  await page.goto("/tests.html");

  /* Uten CDN-en finner vi ingen QUnit, og da hopper vi over. */
  const hasQUnit = await page
    .waitForFunction(() => typeof window.QUnit !== "undefined", null, { timeout: 10000 })
    .then(() => true)
    .catch(() => false);

  test.skip(!hasQUnit, "QUnit kunne ikke lastes fra CDN-en (ingen nettverk?)");

  await page.waitForFunction(() => window.__qunitResult !== null, null, {
    timeout: 30000,
  });

  const result = await page.evaluate(() => ({
    total: window.__qunitResult.testCounts.total,
    passed: window.__qunitResult.testCounts.passed,
    failed: window.__qunitResult.testCounts.failed,
  }));

  const failures = await page.evaluate(() =>
    Array.from(document.querySelectorAll("#qunit-tests > li.fail"))
      .map((li) => li.textContent.trim().slice(0, 400))
      .join("\n"),
  );

  console.log("QUnit: " + JSON.stringify(result));

  expect(result.failed, failures).toBe(0);
  expect(result.total).toBeGreaterThan(0);
  expect(result.passed).toBe(result.total);
});
