"use strict";

/* ==========================================================================
   test/helpers.js – hjelpere til testene

   Hver test kører mot en ekte server på en tilfeldig port, med en egen
   database i en midlertidig mappe. Testene rører derfor ikke dataene
   på maskinen, og kan kjøres parallelt.
   ========================================================================== */

const { mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { once } = require("node:events");

const { createApp } = require("../src/app");

/* Starter en server med en egen database. */
async function startTestServer() {
  const dir = mkdtempSync(path.join(os.tmpdir(), "minfriluft-test-"));
  const dbPath = path.join(dir, "test.db");

  /* staticRoot: false slår av serveringen av statiske filer, slik at
     API-testene alltid treffer API-et og ikke appens sider. */
  const app = createApp({ dbPath, staticRoot: false });
  const server = app.listen(0, "127.0.0.1");

  await once(server, "listening");

  const { port } = server.address();

  return {
    baseUrl: "http://127.0.0.1:" + port,
    server,
    db: app.locals.db,
    dbPath,

    async close() {
      await new Promise((resolve) => server.close(resolve));

      /* Databasen må lukkes før filene kan slettes på Windows. */
      try {
        app.locals.db.close();
      } catch {
        /* Allerede lukket. */
      }

      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        /* Temp-mappen blir ryddet av operativsystemet. */
      }
    },
  };
}

/* En enkel klient som holder på sesjonscookien, slik en nettleser
   gjør det. */
function createClient(baseUrl) {
  let cookie = "";

  async function request(method, requestPath, body) {
    const headers = {};

    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    if (cookie !== "") {
      headers.cookie = cookie;
    }

    const response = await fetch(baseUrl + requestPath, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const setCookies = response.headers.getSetCookie
      ? response.headers.getSetCookie()
      : [];

    for (const setCookie of setCookies) {
      const pair = setCookie.split(";")[0];

      if (pair.startsWith("mf_session=")) {
        cookie = pair === "mf_session=" ? "" : pair;
      }
    }

    const text = await response.text();

    let data = null;

    if (text !== "") {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    return { status: response.status, body: data, setCookies };
  }

  return {
    request,
    get: (requestPath) => request("GET", requestPath),
    post: (requestPath, body) => request("POST", requestPath, body),
    put: (requestPath, body) => request("PUT", requestPath, body),
    delete: (requestPath) => request("DELETE", requestPath),
    get cookie() {
      return cookie;
    },
    clearCookie() {
      cookie = "";
    },
  };
}

/* Logger inn og returnerer en klient som er logget inn. */
async function login(baseUrl, email, password) {
  const client = createClient(baseUrl);
  const response = await client.post("/api/auth/login", { email, password });

  if (response.status !== 200) {
    throw new Error(
      "Kunne ikke logge inn: " + response.status + " " + JSON.stringify(response.body),
    );
  }

  return client;
}

module.exports = { startTestServer, createClient, login };
