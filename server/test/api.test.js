"use strict";

/* ==========================================================================
   test/api.test.js – tester for turer, bilder og notater

   Testene dekker innlogging, validering, at dataene blir lagret riktig,
   at én bruker ikke ser en annens data, og at sletting rydder opp.
   ========================================================================== */

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");

const { startTestServer, createClient, login } = require("../test-support/helpers");
const { createUser } = require("../src/users");

const PASSWORD = "hemmelig123";

let server;
let alice;
let bob;
let aliceClient;
let bobClient;
let aliceDefaults;
let bobDefaults;

/* Hver bruker har sine egne lister, så testene må bruke id-ene som
   hører til den aktuelle brukeren. */
function defaultsFor(userId) {
  const activity = server.db
    .prepare("SELECT id FROM activities WHERE user_id = ? ORDER BY id LIMIT 1")
    .get(userId);
  const county = server.db
    .prepare("SELECT id FROM counties WHERE user_id = ? ORDER BY id LIMIT 1")
    .get(userId);
  const topics = server.db
    .prepare("SELECT id FROM topics WHERE user_id = ? ORDER BY id")
    .all(userId)
    .map((row) => row.id);

  return { activityId: activity.id, countyId: county.id, topics };
}

/* Liker en tur som blir brukt i flere tester. */
function tripInput(overrides = {}) {
  return {
    activityId: aliceDefaults.activityId,
    countyId: aliceDefaults.countyId,
    title: "Fisketur til Hammervatnet",
    location: "Hammervatnet",
    date: "2026-10-30",
    description: "Pent tur.",
    pictures: [1, 2, 3],
    ...overrides,
  };
}

/* En tur som tilhører Bob, med Bobs lister. */
function bobTripInput(overrides = {}) {
  return tripInput({
    activityId: bobDefaults.activityId,
    countyId: bobDefaults.countyId,
    ...overrides,
  });
}

function noteInput(overrides = {}) {
  return {
    title: "Sesongplanlegging høst 2026",
    date: "2026-09-05",
    description: "Prioriter turer i september.",
    topics: aliceDefaults.topics.slice(0, 3),
    ...overrides,
  };
}

function bobNoteInput(overrides = {}) {
  return noteInput({
    topics: bobDefaults.topics.slice(0, 3),
    ...overrides,
  });
}

before(async () => {
  server = await startTestServer();

  alice = createUser(server.db, { email: "alice@example.no", password: PASSWORD });
  bob = createUser(server.db, { email: "bob@example.no", password: PASSWORD });

  aliceDefaults = defaultsFor(alice.id);
  bobDefaults = defaultsFor(bob.id);

  aliceClient = await login(server.baseUrl, "alice@example.no", PASSWORD);
  bobClient = await login(server.baseUrl, "bob@example.no", PASSWORD);
});

after(async () => {
  await server.close();
});

/* ==========================================================================
   Innlogging
   ========================================================================== */

describe("innlogging", () => {
  test("krever både e-post og passord", async () => {
    const client = createClient(server.baseUrl);
    const response = await client.post("/api/auth/login", { email: "", password: "" });

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Fyll inn både e-post og passord.");
  });

  test("avviser feil passord", async () => {
    const client = createClient(server.baseUrl);
    const response = await client.post("/api/auth/login", {
      email: "alice@example.no",
      password: "feil-passord",
    });

    assert.equal(response.status, 401);
    assert.equal(response.body.error, "E-post eller passord er feil.");
  });

  test("avviser ukjent e-post med samme melding", async () => {
    const client = createClient(server.baseUrl);
    const response = await client.post("/api/auth/login", {
      email: "finnesikke@example.no",
      password: PASSWORD,
    });

    assert.equal(response.status, 401);
    assert.equal(response.body.error, "E-post eller passord er feil.");
  });

  test("logger inn og setter en sikker cookie", async () => {
    const client = createClient(server.baseUrl);
    const response = await client.post("/api/auth/login", {
      email: "alice@example.no",
      password: PASSWORD,
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.user.email, "alice@example.no");
    assert.equal(response.body.user.id, alice.id);
    assert.equal("passwordHash" in response.body.user, false);

    const cookie = response.setCookies.find((entry) => entry.startsWith("mf_session="));

    assert.ok(cookie, "cookien skal settes");
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
  });

  test("gir brukeren ved /api/auth/me", async () => {
    const client = await login(server.baseUrl, "alice@example.no", PASSWORD);
    const response = await client.get("/api/auth/me");

    assert.equal(response.status, 200);
    assert.equal(response.body.user.email, "alice@example.no");
  });

  test("avviser /api/auth/me uten cookie", async () => {
    const client = createClient(server.baseUrl);
    const response = await client.get("/api/auth/me");

    assert.equal(response.status, 401);
    assert.equal(response.body.error, "Du er ikke logget inn.");
  });

  test("beskyttede ruter krever innlogging", async () => {
    const client = createClient(server.baseUrl);

    for (const requestPath of ["/api/trips", "/api/notes", "/api/meta"]) {
      const response = await client.get(requestPath);

      assert.equal(response.status, 401, requestPath + " skal kreve innlogging");
    }
  });

  test("logger ut, og sesjonen virker ikke mer", async () => {
    const client = await login(server.baseUrl, "alice@example.no", PASSWORD);

    const logout = await client.post("/api/auth/logout", {});

    assert.equal(logout.status, 204);

    const after = await client.get("/api/auth/me");

    assert.equal(after.status, 401);
  });

  test("API-et svarer også uten /api-prefixet", async () => {
    /* En proxy med avsluttende skråstrek fjerner /api fra adressen.
       Da skal innloggingen fortsatt virke. */
    const response = await fetch(server.baseUrl + "/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "alice@example.no", password: PASSWORD }),
    });

    assert.equal(response.status, 200);
    assert.equal((await response.json()).user.email, "alice@example.no");
  });

  test("forklarer seg når appens egne sider havner hos API-et", async () => {
    /* Det betyr at webserveren sender alt hit, i stedet for å serve
       de statiske filene. Da skal vi si fra om det, og ikke svare med
       en 401 som ser ut som en innloggingsfeil. */
    const response = await fetch(server.baseUrl + "/");

    assert.equal(response.status, 404);

    const body = await response.json();

    assert.match(body.error, /Dette er API-et/);
  });

  test("turene krever fortsatt en sesjon", async () => {
    const response = await fetch(server.baseUrl + "/trips");

    assert.equal(response.status, 401);
  });
});

/* ==========================================================================
   Turer
   ========================================================================== */

describe("turer", () => {
  test("lager en tur og lar serveren gi id", async () => {
    const response = await aliceClient.post("/api/trips", tripInput());

    assert.equal(response.status, 201);
    assert.equal(typeof response.body.trip.id, "number");
    assert.equal(response.body.trip.title, "Fisketur til Hammervatnet");
    assert.equal(response.body.trip.date, "2026-10-30");
    assert.deepEqual(response.body.trip.pictures, [1, 2, 3]);
  });

  test("setter updatedAt på serveren, ikke fra nettleseren", async () => {
    const response = await aliceClient.post("/api/trips", {
      ...tripInput(),
      updatedAt: "1999-01-01T00:00",
    });

    assert.equal(response.status, 201);
    assert.notEqual(response.body.trip.updatedAt, "1999-01-01T00:00");
    assert.match(response.body.trip.updatedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  test("avviser tur uten tittel", async () => {
    const response = await aliceClient.post("/api/trips", tripInput({ title: "  " }));

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Tittel og dato må være fyllt inn.");
  });

  test("avviser tur uten dato", async () => {
    const response = await aliceClient.post("/api/trips", tripInput({ date: "" }));

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Tittel og dato må være fyllt inn.");
  });

  test("avviser dato i feil format", async () => {
    const response = await aliceClient.post("/api/trips", tripInput({ date: "30.10.2026" }));

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Datoen må være på formatet YYYY-MM-DD.");
  });

  test("avviser ukjent aktivitet", async () => {
    const response = await aliceClient.post("/api/trips", tripInput({ activityId: 9999 }));

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Aktiviteten finnes ikke.");
  });

  test("avviser ukjent fylke", async () => {
    const response = await aliceClient.post("/api/trips", tripInput({ countyId: 9999 }));

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Fylket finnes ikke.");
  });

  test("avviser ukjent motiv", async () => {
    const response = await aliceClient.post("/api/trips", tripInput({ pictures: [1, 99] }));

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Bildet finnes ikke.");
  });

  test("lister bare egne turer", async () => {
    const created = await bobClient.post("/api/trips", bobTripInput({ title: "Bobs tur" }));

    assert.equal(created.status, 201);

    const list = await aliceClient.get("/api/trips");
    const titles = list.body.trips.map((trip) => trip.title);

    assert.equal(list.status, 200);
    assert.equal(titles.includes("Bobs tur"), false);
    assert.equal(titles.includes("Fisketur til Hammervatnet"), true);
  });

  test("gir 404 for turen til en annen bruker", async () => {
    const created = await bobClient.post("/api/trips", bobTripInput({ title: "Bobs egen tur" }));
    const tripId = created.body.trip.id;

    const get = await aliceClient.get("/api/trips/" + tripId);
    const put = await aliceClient.put("/api/trips/" + tripId, tripInput({ title: "Stjålet" }));
    const remove = await aliceClient.delete("/api/trips/" + tripId);

    assert.equal(get.status, 404);
    assert.equal(put.status, 404);
    assert.equal(remove.status, 404);

    /* Turen skal fortsatt være hos Bob. */
    const stillThere = await bobClient.get("/api/trips/" + tripId);

    assert.equal(stillThere.status, 200);
    assert.equal(stillThere.body.trip.title, "Bobs egen tur");
  });

  test("endrer en tur og bytter ut bildene", async () => {
    const created = await aliceClient.post("/api/trips", tripInput());
    const tripId = created.body.trip.id;

    const updated = await aliceClient.put("/api/trips/" + tripId, {
      ...tripInput(),
      title: "Ny tittel",
      pictures: [4],
    });

    assert.equal(updated.status, 200);
    assert.equal(updated.body.trip.title, "Ny tittel");
    assert.deepEqual(updated.body.trip.pictures, [4]);

    const stored = server.db
      .prepare("SELECT template_id FROM trip_images WHERE trip_id = ? ORDER BY position")
      .all(tripId)
      .map((row) => row.template_id);

    assert.deepEqual(stored, [4]);
  });

  test("sletter en tur og bildene på den", async () => {
    const created = await aliceClient.post("/api/trips", tripInput());
    const tripId = created.body.trip.id;

    const removed = await aliceClient.delete("/api/trips/" + tripId);

    assert.equal(removed.status, 204);

    const tripRows = server.db
      .prepare("SELECT COUNT(*) AS count FROM trips WHERE id = ?")
      .get(tripId).count;
    const imageRows = server.db
      .prepare("SELECT COUNT(*) AS count FROM trip_images WHERE trip_id = ?")
      .get(tripId).count;

    assert.equal(tripRows, 0);
    assert.equal(imageRows, 0);

    const gone = await aliceClient.get("/api/trips/" + tripId);

    assert.equal(gone.status, 404);
  });

  test("avviser id-er som ikke er tall", async () => {
    const response = await aliceClient.get("/api/trips/abc");

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Ugyldig tur-id.");
  });
});

/* ==========================================================================
   Bilder
   ========================================================================== */

describe("bilder", () => {
  let tripId;

  before(async () => {
    const created = await aliceClient.post("/api/trips", tripInput({ pictures: [1, 2] }));

    tripId = created.body.trip.id;
  });

  test("lister bildene i rekkefølge", async () => {
    const response = await aliceClient.get("/api/trips/" + tripId + "/images");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.images, [
      { position: 0, templateId: 1 },
      { position: 1, templateId: 2 },
    ]);
  });

  test("legger til et bilde på slutten", async () => {
    const response = await aliceClient.post("/api/trips/" + tripId + "/images", {
      templateId: 5,
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.image.position, 2);
    assert.equal(response.body.image.templateId, 5);
    assert.equal(response.body.images.length, 3);
  });

  test("avviser ukjent motiv", async () => {
    const response = await aliceClient.post("/api/trips/" + tripId + "/images", {
      templateId: 99,
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Bildet finnes ikke.");
  });

  test("avviser bilde-id som ikke er tall", async () => {
    const response = await aliceClient.post("/api/trips/" + tripId + "/images", {
      templateId: "abc",
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Ugyldig bilde-id.");
  });

  test("sletter et bilde og renummererer resten", async () => {
    const response = await aliceClient.delete("/api/trips/" + tripId + "/images/0");

    assert.equal(response.status, 204);

    const list = await aliceClient.get("/api/trips/" + tripId + "/images");

    assert.deepEqual(list.body.images, [
      { position: 0, templateId: 2 },
      { position: 1, templateId: 5 },
    ]);

    /* Plasseringene i databasen skal også være sammenhengende. */
    const positions = server.db
      .prepare("SELECT position FROM trip_images WHERE trip_id = ? ORDER BY position")
      .all(tripId)
      .map((row) => row.position);

    assert.deepEqual(positions, [0, 1]);
  });

  test("bytter om rekkefølgen", async () => {
    const response = await aliceClient.put("/api/trips/" + tripId + "/images", {
      templateIds: [5, 2],
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.images, [
      { position: 0, templateId: 5 },
      { position: 1, templateId: 2 },
    ]);
  });

  test("avviser bilde på turen til en annen bruker", async () => {
    const created = await bobClient.post("/api/trips", bobTripInput());
    const bobTripId = created.body.trip.id;

    const list = await aliceClient.get("/api/trips/" + bobTripId + "/images");
    const add = await aliceClient.post("/api/trips/" + bobTripId + "/images", { templateId: 1 });
    const remove = await aliceClient.delete("/api/trips/" + bobTripId + "/images/0");

    assert.equal(list.status, 404);
    assert.equal(add.status, 404);
    assert.equal(remove.status, 404);
  });
});

/* ==========================================================================
   Notater
   ========================================================================== */

describe("notater", () => {
  test("lager et notat med emneknagger", async () => {
    const response = await aliceClient.post("/api/notes", noteInput());

    assert.equal(response.status, 201);
    assert.equal(response.body.note.title, "Sesongplanlegging høst 2026");
    assert.equal(response.body.note.date, "2026-09-05");
    assert.deepEqual(response.body.note.topics, aliceDefaults.topics.slice(0, 3));
  });

  test("avviser notat uten tittel", async () => {
    const response = await aliceClient.post("/api/notes", noteInput({ title: "" }));

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Tittel og dato må være fyllt inn.");
  });

  test("avviser ukjent emneknagg", async () => {
    const response = await aliceClient.post("/api/notes", noteInput({ topics: [9999] }));

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Emneknaggen finnes ikke.");
  });

  test("avviser emneknagg til en annen bruker", async () => {
    const bobTopic = server.db
      .prepare("SELECT id FROM topics WHERE user_id = ? LIMIT 1")
      .get(bob.id);

    const response = await aliceClient.post("/api/notes", noteInput({ topics: [bobTopic.id] }));

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Emneknaggen finnes ikke.");
  });

  test("endrer et notat og bytter ut emneknaggene", async () => {
    const created = await aliceClient.post("/api/notes", noteInput());
    const noteId = created.body.note.id;

    const updated = await aliceClient.put("/api/notes/" + noteId, {
      ...noteInput(),
      title: "Ny tittel",
      topics: [aliceDefaults.topics[2]],
    });

    assert.equal(updated.status, 200);
    assert.equal(updated.body.note.title, "Ny tittel");
    assert.deepEqual(updated.body.note.topics, [aliceDefaults.topics[2]]);

    const stored = server.db
      .prepare("SELECT topic_id FROM note_topics WHERE note_id = ?")
      .all(noteId)
      .map((row) => row.topic_id);

    assert.deepEqual(stored, [aliceDefaults.topics[2]]);
  });

  test("lister bare egne notater", async () => {
    const created = await bobClient.post("/api/notes", bobNoteInput({ title: "Bobs notat" }));

    assert.equal(created.status, 201);

    const list = await aliceClient.get("/api/notes");
    const titles = list.body.notes.map((note) => note.title);

    assert.equal(titles.includes("Bobs notat"), false);
  });

  test("gir 404 for notatet til en annen bruker", async () => {
    const created = await bobClient.post("/api/notes", bobNoteInput({ title: "Bobs notat" }));
    const noteId = created.body.note.id;

    const get = await aliceClient.get("/api/notes/" + noteId);
    const put = await aliceClient.put("/api/notes/" + noteId, noteInput({ title: "Stjålet" }));
    const remove = await aliceClient.delete("/api/notes/" + noteId);

    assert.equal(get.status, 404);
    assert.equal(put.status, 404);
    assert.equal(remove.status, 404);
  });

  test("sletter et notat og emneknaggene", async () => {
    const created = await aliceClient.post("/api/notes", noteInput());
    const noteId = created.body.note.id;

    const removed = await aliceClient.delete("/api/notes/" + noteId);

    assert.equal(removed.status, 204);

    const noteRows = server.db
      .prepare("SELECT COUNT(*) AS count FROM notes WHERE id = ?")
      .get(noteId).count;
    const topicRows = server.db
      .prepare("SELECT COUNT(*) AS count FROM note_topics WHERE note_id = ?")
      .get(noteId).count;

    assert.equal(noteRows, 0);
    assert.equal(topicRows, 0);
  });
});

/* ==========================================================================
   Innstillinger
   ========================================================================== */

describe("innstillinger", () => {
  test("gir brukerens lister", async () => {
    const response = await aliceClient.get("/api/settings");

    assert.equal(response.status, 200);
    assert.equal(response.body.activities.length, 7);
    assert.equal(response.body.topics.length, 5);
    assert.equal(response.body.counties.length, 5);

    /* Rekkefølgen følger kolonnen, og sorteringen skiller ikke mellom
       æ, ø og å. Derfor sjekker vi at navnet er med, ikke hvor det står. */
    const names = response.body.activities.map((item) => item.activity);

    assert.equal(names.includes("Bærtur"), true);
    assert.equal(typeof response.body.activities[0].id, "number");
  });

  test("lister bare egne verdier", async () => {
    const response = await bobClient.get("/api/settings");

    assert.equal(response.status, 200);
    assert.equal(response.body.activities.length, 7);

    const aliceActivity = aliceDefaults.activityId;
    const bobActivity = bobDefaults.activityId;

    assert.notEqual(aliceActivity, bobActivity);
  });

  test("legger til en aktivitet", async () => {
    const response = await aliceClient.post("/api/settings/activities", {
      name: "Telemarksstien",
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.item.activity, "Telemarksstien");

    const list = await aliceClient.get("/api/settings");

    assert.equal(list.body.activities.length, 8);
  });

  test("avviser tomt navn", async () => {
    const response = await aliceClient.post("/api/settings/activities", { name: "  " });

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Navnet kan ikke være tomt.");
  });

  test("avviser et navn som finnes fra før", async () => {
    const response = await aliceClient.post("/api/settings/activities", {
      name: "fisketur",
    });

    assert.equal(response.status, 409);
    assert.equal(response.body.error, "Aktiviteten «fisketur» finnes allerede.");
  });

  test("avviser å slette en aktivitet som brukes av en tur", async () => {
    const response = await aliceClient.delete(
      "/api/settings/activities/" + aliceDefaults.activityId,
    );

    assert.equal(response.status, 409);
    assert.equal(
      response.body.error,
      "Aktiviteten er brukt av en tur, og kan ikke slettes.",
    );
  });

  test("avviser å slette en emneknagg som brukes av et notat", async () => {
    const created = await aliceClient.post("/api/notes", noteInput());
    const topicId = created.body.note.topics[0];

    const response = await aliceClient.delete("/api/settings/topics/" + topicId);

    assert.equal(response.status, 409);
    assert.equal(
      response.body.error,
      "Emneknaggen er brukt av et notat, og kan ikke slettes.",
    );
  });

  test("avviser å slette et fylke som brukes av en tur", async () => {
    const response = await aliceClient.delete(
      "/api/settings/counties/" + aliceDefaults.countyId,
    );

    assert.equal(response.status, 409);
    assert.equal(response.body.error, "Fylket er brukt av en tur, og kan ikke slettes.");
  });

  test("sletter en aktivitet som ikke er i bruk", async () => {
    const added = await aliceClient.post("/api/settings/activities", {
      name: "Midlertidig",
    });
    const activityId = added.body.item.id;

    const response = await aliceClient.delete("/api/settings/activities/" + activityId);

    assert.equal(response.status, 204);

    const list = await aliceClient.get("/api/settings");
    const found = list.body.activities.some((item) => item.id === activityId);

    assert.equal(found, false);
  });

  test("gir 404 når en verdi tilhører en annen bruker", async () => {
    const response = await aliceClient.delete(
      "/api/settings/activities/" + bobDefaults.activityId,
    );

    assert.equal(response.status, 404);
  });

  test("gir 404 for en ukjent liste", async () => {
    const response = await aliceClient.post("/api/settings/ukjent", { name: "x" });

    assert.equal(response.status, 404);
  });
});

/* ==========================================================================
   Referansedata og database
   ========================================================================== */

describe("referansedata", () => {
  test("gir bildemotiver og sesonger", async () => {
    const response = await aliceClient.get("/api/meta");

    assert.equal(response.status, 200);
    assert.equal(response.body.imageTemplates.length, 6);
    assert.equal(response.body.seasons.length, 5);
    assert.equal(response.body.imageTemplates[0].label, "Fjell");
    assert.match(response.body.imageTemplates[0].svg, /^<svg/);
  });

  test("migreringene er registrert", () => {
    const versions = server.db
      .prepare("SELECT version FROM schema_migrations ORDER BY version")
      .all()
      .map((row) => row.version);

    assert.deepEqual(versions, ["001_init", "002_reference_data"]);
  });

  test("sesongene dekker året, og «Alle» er ikke en sesong", () => {
    const seasons = server.db.prepare("SELECT * FROM seasons ORDER BY id").all();

    assert.equal(seasons.length, 5);
    assert.equal(seasons.find((row) => row.season === "Alle").is_all, 1);
    assert.equal(seasons.find((row) => row.season === "Vinter").start_month, 12);
    assert.equal(seasons.find((row) => row.season === "Vinter").end_month, 2);
  });

  test("helsesjekken svarer", async () => {
    const client = createClient(server.baseUrl);
    const response = await client.get("/api/health");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { ok: true });
  });
});
