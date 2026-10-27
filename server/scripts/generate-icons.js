"use strict";

/* ==========================================================================
   scripts/generate-icons.js – lager ikonene appen bruker

   Manifestet trenger PNG-ikoner i 192x192 og 512x512, pluss et
   maskable ikon (for Android) og et apple-touch-icon (for iPhone).

   Vi tegner et SVG og lar Chrome rasterisere det til PNG, så vi slipper
   et bildeverktøy på maskinen.

   Kjør:
     node scripts/generate-icons.js
   ========================================================================== */

const fs = require("node:fs");
const path = require("node:path");

const { chromium } = require("playwright");

const ICON_DIR = path.join(__dirname, "..", "..", "public", "icons");
const SOURCE_FILE = path.join(ICON_DIR, "icon.svg");

/* Alle ikonene vi lager. scale er hvor mye innholdet får sjekket:
   et maskable ikon kan bli klippet av systemet, så innholdet må
   trekkes inn mot midten. */
const TARGETS = [
  { file: "icon-192.png", size: 192, scale: 1 },
  { file: "icon-512.png", size: 512, scale: 1 },
  { file: "icon-maskable-512.png", size: 512, scale: 0.62 },
  { file: "apple-touch-icon.png", size: 180, scale: 1 },
];

function buildHtml(svg, size, scale) {
  const offset = (size * (1 - scale)) / 2;

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: ${size}px;
        height: ${size}px;
        overflow: hidden;
      }
      .stage {
        width: ${size}px;
        height: ${size}px;
        background: #1b5e20;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      svg {
        width: ${size * scale}px;
        height: ${size * scale}px;
        transform: translate(${offset}px, ${offset}px);
      }
    </style>
  </head>
  <body>
    <div class="stage">${svg}</div>
  </body>
</html>`;
}

async function generateIcons() {
  if (!fs.existsSync(SOURCE_FILE)) {
    throw new Error("Fant ikke kilden til ikonet: " + SOURCE_FILE);
  }

  const svg = fs.readFileSync(SOURCE_FILE, "utf8");

  const browser = await chromium.launch({ channel: "chrome" });

  try {
    for (const target of TARGETS) {
      const page = await browser.newPage({
        viewport: { width: target.size, height: target.size },
        deviceScaleFactor: 1,
      });

      await page.setContent(buildHtml(svg, target.size, target.scale));
      await page.screenshot({
        path: path.join(ICON_DIR, target.file),
        omitBackground: false,
      });

      await page.close();

      console.log("Skrev " + target.file + " (" + target.size + "x" + target.size + ")");
    }
  } finally {
    await browser.close();
  }
}

generateIcons().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
