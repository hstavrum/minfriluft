"use strict";

/* ==========================================================================
   app.js – bygger Express-appen

   app.js lager bare appen, slik at testene kan starte den på en
   tilfeldig port uten å starte en egen prosess.
   ========================================================================== */

const express = require("express");
const fs = require("node:fs");
const path = require("node:path");

const { openDatabase, migrate } = require("./db");
const { cookieParser } = require("./cookies");
const { errorHandler, asyncHandler } = require("./http");
const { requireAuth } = require("./auth");
const { createAuthRouter } = require("./routes/auth");
const { createTripsRouter } = require("./routes/trips");
const { createImagesRouter } = require("./routes/images");
const { createNotesRouter } = require("./routes/notes");
const { createSettingsRouter } = require("./routes/settings");
const { getImageTemplates } = require("./store");
const { pickAppFile } = require("./client");

/* Stiene som API-et svarer på, uten /api-prefixet.

   Vi trenger dem fordi en router som er montert i roten ser ALLE
   stier, også appens egne sider. Da ville innloggingssjekken kjørt
   på hver forespørsel, og appens sider ville svart 401 i stedet for
   å bli levert av webserveren. */
const ROOT_API_PATHS = ["/auth", "/trips", "/notes", "/settings", "/meta", "/health"];

/* Webroten i prosjektet. Her ligger index.html, index-desktop.html,
   js/, css/ og test/ (QUnit-testene). */
const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");

/* Finner ut hvor de statiske filene skal serveres fra.

   Rekkefølgen er:
     1. options.staticRoot === false  -> ingen statiske filer (API-testene)
     2. options.staticRoot            -> eksplisitt angitt sti
     3. STATIC_ROOT i miljøet         -> konfigurert sti
     4. standard: public/ i prosjektet -> slik at "npm start" serverer
        både appen og API-et på samme opprinnelse. I produksjon ligger
        filene hos NGINX, og da er STATIC_ROOT bare en ekstra sikkerhet. */
function resolveStaticRoot(options) {
  if (options.staticRoot === false) {
    return null;
  }

  if (options.staticRoot) {
    return options.staticRoot;
  }

  if (process.env.STATIC_ROOT !== undefined) {
    /* Tom verdi slår av serveringen av statiske filer. */
    return process.env.STATIC_ROOT.trim() === "" ? null : process.env.STATIC_ROOT;
  }

  return PUBLIC_DIR;
}

function isApiPath(path) {
  return ROOT_API_PATHS.some(
    (prefix) => path === prefix || path.startsWith(prefix + "/"),
  );
}

/* Beskytter en router med innlogging, men bare for API-stiene. */
function protectedRouter(db, router) {
  const auth = requireAuth(db);

  return function protectedRouterMiddleware(req, res, next) {
    if (!isApiPath(req.path)) {
      next();
      return;
    }

    auth(req, res, (error) => {
      if (error) {
        next(error);
        return;
      }

      router(req, res, next);
    });
  };
}

/* Bygger appen. Alternativet db brukes av testene, ellers åpnes
   databasen på vanlig måte. */
function createApp(options = {}) {
  const db = options.db || openDatabase(options.dbPath);

  if (options.migrate !== false) {
    migrate(db);
  }

  const app = express();

  /* Bak NGINX er forespørslene fra en proxy, ikke fra klienten. */
  app.set("trust proxy", true);

  /* I produksjon serverer NGINX de statiske filene. Som standard
     serverer vi dem her i stedet, slik at appen og API-et ligger på
     samme opprinnelse. Det gjør "npm start" til én eneste kommando
     i lokal utvikling, og det er slik E2E-testene kjører.

     STATIC_ROOT i miljøet overstyrer standardstien, og
     staticRoot: false slår serveringen av helt (API-testene). */
  const staticRoot = resolveStaticRoot(options);

  if (staticRoot && fs.existsSync(staticRoot)) {
    /* Startadressen "/" gir den utgaven av appen som passer til
       skjermen: mobilutgaven på telefon, skrivebordsutgaven ellers.
       Resten av filene ligger fortsatt på egne adresser, så
       /index.html og /index-desktop.html alltid virker. */
    app.get("/", (req, res, next) => {
      const file = pickAppFile(req.headers["user-agent"]);

      res.sendFile(path.resolve(staticRoot, file), (error) => {
        if (error) {
          next(error);
        }
      });
    });

    /* index: false, fordi "/" håndteres over. Da skal ikke den statiske
       filtjeneringen serve index.html på egen hånd. */
    app.use(express.static(staticRoot, { index: false }));
  } else if (staticRoot) {
    console.warn(
      "Fant ingen statiske filer i " +
        staticRoot +
        ". Sett STATIC_ROOT, eller la serveren bruke standardstien public/.",
    );
  }

  app.use(express.json({ limit: "256kb" }));
  app.use(cookieParser);

  /* API-svar skal aldri ligge i en cache, verken i nettleseren eller i
     service workeren. Dataene ligger på serveren, og brukeren skal alltid
     se de siste. */
  app.use((req, res, next) => {
    if (req.path === "/api" || req.path.startsWith("/api/") || isApiPath(req.path)) {
      res.set("Cache-Control", "no-store");
    }

    next();
  });

  const authRouter = createAuthRouter(db);
  const tripsRouter = createTripsRouter(db);
  const imagesRouter = createImagesRouter(db);
  const notesRouter = createNotesRouter(db);
  const settingsRouter = createSettingsRouter(db);

  const healthHandler = (req, res) => {
    res.json({ ok: true });
  };

  const metaHandler = asyncHandler((req, res) => {
    const seasons = db
      .prepare("SELECT id, season FROM seasons ORDER BY id")
      .all();

    res.json({ imageTemplates: getImageTemplates(db), seasons });
  });

  /* Helsesjekk, uten innlogging. */
  app.get("/api/health", healthHandler);

  /* Innlogging er den eneste delen av API-et som er åpent. */
  app.use("/api", authRouter);

  /* Alt annet krever en gyldig sesjon. */
  app.use("/api", requireAuth(db));

  app.use("/api", tripsRouter);
  app.use("/api", imagesRouter);
  app.use("/api", notesRouter);
  app.use("/api", settingsRouter);

  /* Felles referansedata: bildemotivene og sesongene. */
  app.get("/api/meta", metaHandler);

  /* Samme API, men uten /api-prefixet.

     En vanlig feil i NGINX-konfigurasjonen er en avsluttende skråstrek
     på proxy_pass:

         proxy_pass http://127.0.0.1:3000/;   <-- fjerner /api

     Da kommer forespørselen hiten som /auth/login i stedet for
     /api/auth/login, og uten denne blokken ville alt blitt 404.
     Derfor godtar vi begge formene. */
  app.get("/health", healthHandler);
  app.use("/", authRouter);
  app.use("/", protectedRouter(db, tripsRouter));
  app.use("/", protectedRouter(db, imagesRouter));
  app.use("/", protectedRouter(db, notesRouter));
  app.use("/", protectedRouter(db, settingsRouter));
  app.get("/meta", protectedRouter(db, metaHandler));

  /* Hvis webserveren sender appens egne sider hit, er det greit å si fra
     om det, i stedet for å svare med en 401 som ser ut som en
     innloggingsfeil. */
  app.use((req, res) => {
    res.status(404).json({
      error:
        "Dette er API-et, ikke appen. Webserveren må serve de statiske " +
        "filene, og bare /api skal sendes hit.",
    });
  });

  app.use(errorHandler);

  /* Slik at rutene og testene kan nå databasen. */
  app.locals.db = db;

  return app;
}

module.exports = { createApp };
