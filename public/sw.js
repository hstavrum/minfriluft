/* ==========================================================================
   sw.js – service worker for mobil-utgaven av Min friluft

   Formålet er todelt:

   1. Appen skal kunne starte, selv om nettet er borte. Derfor legger vi
      de statiske filene i en cache (skallet), og henter dem fra nettet
      først når vi kan.

   2. Dataene turer, notater og innstillinger ligger på serveren, og det
      er der de skal hentes fra. Derfor rører vi ALLE API-kall: de går
      rett til serveren, og caches aldri. En tur som ble lagret i dag,
      skal ikke dukke opp igjen fra en gammel cache i morgen.

   Skillet er derfor: /api går rett gjennom, alt annet kan caches.
   ========================================================================== */

const CACHE_VERSION = "minfriluft-v1";

const SHELL_CACHE = CACHE_VERSION + "-shell";
const RUNTIME_CACHE = CACHE_VERSION + "-runtime";

/* Filene som utgjør appen. De legges i cache ved installasjon, slik at
   appen kan starte uten nett. */
const SHELL_FILES = [
  "/index.html",
  "/manifest.webmanifest",
  "/css/style.css",
  "/js/model.js",
  "/js/common.js",
  "/js/api.js",
  "/js/pwa.js",
  "/js/loginPageView.js",
  "/js/loginPageController.js",
  "/js/tripsPageView.js",
  "/js/tripsPageController.js",
  "/js/notesPageView.js",
  "/js/notesPageController.js",
  "/js/searchPageView.js",
  "/js/searchPageController.js",
  "/js/settingsPageView.js",
  "/js/settingsPageController.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

/* Adressene appen åpnes fra. Bare disse får offline-støtte, slik at
   desktop-utgaven på /index-desktop.html ikke blir påvirket. */
const APP_PATHS = ["/", "/index.html"];

/* De statiske filene appen består av. */
const ASSET_PREFIXES = ["/css/", "/js/", "/icons/"];

function isAppAsset(pathname) {
  if (pathname === "/manifest.webmanifest") {
    return true;
  }

  return ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/* Legger filene i cache. Hvis én fil mangler, skal resten likevel
   komme med, så vi henter dem én og én. */
async function cacheShellFiles() {
  const cache = await caches.open(SHELL_CACHE);

  await Promise.all(
    SHELL_FILES.map(async (file) => {
      try {
        const response = await fetch(file, { cache: "reload" });

        if (response.ok) {
          await cache.put(file, response);
        }
      } catch {
        /* Filen mangler eller nettet er borte. Da hopper vi over den. */
      }
    }),
  );
}

/* Henter fra nettet først. Bare når det ikke går, tar vi den cachede
   versjonen. Da får brukeren alltid ferske filer når de er på nett. */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await caches.match(request);

    if (cached) {
      return cached;
    }

    throw error;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheShellFiles().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => !name.startsWith(CACHE_VERSION))
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  /* API-et går alltid rett til serveren. Vi svarer ikke på det, og
     det havner aldri i en cache. */
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    return;
  }

  /* Bare GET-forespørseler kan caches. */
  if (request.method !== "GET") {
    return;
  }

  /* Kjøring av en side. Hvis det er mobil-appen, prøver vi nettet
     først, og faller tilbake på den cachede appen. */
  if (request.mode === "navigate") {
    if (!APP_PATHS.includes(url.pathname)) {
      return;
    }

    event.respondWith(
      networkFirst(request, RUNTIME_CACHE).catch(async () => {
        const cached = await caches.match("/index.html");

        if (cached) {
          return cached;
        }

        return new Response(
          "<!doctype html><html lang='nb'><head><meta charset='UTF-8'>" +
            "<title>Min friluft</title></head><body>" +
            "<p>Du er frakoblet, og appen er ikke lagret på telefonen ennå.</p>" +
            "</body></html>",
          { headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      }),
    );

    return;
  }

  /* Statiske filer i appen: fra nettet først, fra cache hvis ikke.
     Vi rører bare appens egne filer, så alt annet går rett videre. */
  if (!isAppAsset(url.pathname)) {
    return;
  }

  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

/* Når en ny versjon er klar, kan vi si ifra at den skal ta over med
   en gang. */
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
