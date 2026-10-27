/* ==========================================================================
   apiStub.js – En falsk API for controller-testene

   Controller-testene skal kjøre uten en server. Derfor erstatter denne
   filen api-objektet fra js/api.js med en kjent kopi som ligger i
   minnet.

   Stubben følger samme regler som serveren:
     - id-ene settes av "serveren", ikke av klienten
     - tittel og dato må være fyllt inn
     - en tur som tilhører en annen bruker gir 404
     - en aktivitet eller et fylke som er i bruk kan ikke slettes

   Alle kall legges i apiStub.calls, slik at testene kan sjekke hva
   controlleren faktisk sendte.
   ========================================================================== */

const apiStub = {
  /* Alle kallene som er gjort, i rekkefølge. */
  calls: [],

  /* Dataene i den falske databasen. */
  data: null,

  /* Neste id "serveren" gir ut. */
  nextId: 1,

  /* Hvilken feil det neste kallet skal gi, hvis testen vil ha det.
     Sett den til null for vanlig oppførsel. */
  failWith: null,
};

/* Bygger en ny, tom database. */
function apiStubReset() {
  apiStub.calls = [];
  apiStub.nextId = 1000;
  apiStub.failWith = null;

  apiStub.data = {
    user: { id: 1, email: "terje@example.no", displayName: "Terje" },

    activities: [
      { id: 1, activity: "Bærtur" },
      { id: 2, activity: "Gåtur" },
      { id: 3, activity: "Fisketur" },
    ],
    topics: [
      { id: 1, topic: "Planlegging" },
      { id: 2, topic: "Tips" },
    ],
    counties: [
      { id: 1, county: "Agder" },
      { id: 2, county: "Vestfold" },
      { id: 3, county: "Trøndelag" },
    ],
    seasons: [
      { id: 1, season: "Vår" },
      { id: 2, season: "Sommer" },
      { id: 3, season: "Høst" },
      { id: 4, season: "Vinter" },
      { id: 5, season: "Alle" },
    ],
    imageTemplates: [
      { id: 1, label: "Fjell", svg: "<svg></svg>" },
      { id: 2, label: "Skog", svg: "<svg></svg>" },
      { id: 3, label: "Innsjø", svg: "<svg></svg>" },
    ],

    trips: [
      {
        id: 10,
        activityId: 1,
        countyId: 1,
        title: "Bærtur til Holtet",
        location: "Holtet",
        date: "2026-08-15",
        description: "Bærtur i skogen.",
        pictures: [1, 2],
        updatedAt: "2026-08-15T10:00:00Z",
      },
      {
        id: 11,
        activityId: 2,
        countyId: 2,
        title: "Gåtur til Fjellheia",
        location: "Fjellheia",
        date: "2026-10-01",
        description: "Pent tur.",
        pictures: [],
        updatedAt: "2026-10-01T10:00:00Z",
      },
    ],

    notes: [
      {
        id: 20,
        title: "Sesongplanlegging",
        date: "2026-09-05",
        description: "Planlegger turer.",
        topics: [1],
        updatedAt: "2026-09-05T10:00:00Z",
      },
    ],
  };

  return apiStub.data;
}

/* Kaster feilen testen ba om, hvis den ba om en. */
function apiStubMaybeFail(method, path, body) {
  apiStub.calls.push({ method, path, body });

  if (apiStub.failWith) {
    const error = new Error(apiStub.failWith.message);
    error.status = apiStub.failWith.status;

    throw error;
  }
}

/* Finner en tur, og kastet 404 hvis den ikke finnes. */
function apiStubFindTrip(tripId) {
  const trip = apiStub.data.trips.find((entry) => entry.id === tripId);

  if (!trip) {
    const error = new Error("Fant ikke turen.");
    error.status = 404;
    throw error;
  }

  return trip;
}

/* Sjekker de samme tingene serveren sjekker. */
function apiStubValidateTrip(body) {
  const title = body.title ? String(body.title).trim() : "";
  const date = body.date ? String(body.date).trim() : "";

  if (title === "" || date === "") {
    const error = new Error("Tittel og dato må være fyllt inn.");
    error.status = 400;
    throw error;
  }

  const pictures = body.pictures ? body.pictures.slice() : [];

  for (const templateId of pictures) {
    const found = apiStub.data.imageTemplates.some(
      (template) => template.id === templateId,
    );

    if (!found) {
      const error = new Error("Bildet finnes ikke.");
      error.status = 400;
      throw error;
    }
  }

  return { title, date, pictures };
}

function apiStubValidateNote(body) {
  const title = body.title ? String(body.title).trim() : "";
  const date = body.date ? String(body.date).trim() : "";

  if (title === "" || date === "") {
    const error = new Error("Tittel og dato må være fyllt inn.");
    error.status = 400;
    throw error;
  }

  return { title, date };
}

/* Tiden "serveren" bruker. */
function apiStubNow() {
  return "2026-10-23T12:00:00Z";
}

/* Selve API-et. Samme metode som js/api.js. */
const api = {
  /* --- Innlogging ------------------------------------------------------- */

  async login(email, password) {
    apiStubMaybeFail("POST", "/api/auth/login", { email, password });

    if (password === "feil") {
      const error = new Error("E-post eller passord er feil.");
      error.status = 401;
      throw error;
    }

    return { user: apiStub.data.user };
  },

  async logout() {
    apiStubMaybeFail("POST", "/api/auth/logout");
  },

  async me() {
    apiStubMaybeFail("GET", "/api/auth/me");

    if (!apiStub.loggedIn) {
      const error = new Error("Du er ikke logget inn.");
      error.status = 401;
      throw error;
    }

    return { user: apiStub.data.user };
  },

  /* --- Turer ------------------------------------------------------------ */

  async getTrips() {
    apiStubMaybeFail("GET", "/api/trips");

    return { trips: apiStub.data.trips.map((trip) => Object.assign({}, trip)) };
  },

  async createTrip(trip) {
    apiStubMaybeFail("POST", "/api/trips", trip);

    const clean = apiStubValidateTrip(trip);

    const created = {
      id: apiStub.nextId++,
      activityId: trip.activityId || null,
      countyId: trip.countyId || null,
      title: clean.title,
      location: trip.location || "",
      date: clean.date,
      description: trip.description || "",
      pictures: clean.pictures,
      createdAt: apiStubNow(),
      updatedAt: apiStubNow(),
    };

    apiStub.data.trips.push(created);

    return { trip: Object.assign({}, created) };
  },

  async updateTrip(tripId, trip) {
    apiStubMaybeFail("PUT", "/api/trips/" + tripId, trip);

    const existing = apiStubFindTrip(tripId);
    const clean = apiStubValidateTrip(trip);

    existing.activityId = trip.activityId || null;
    existing.countyId = trip.countyId || null;
    existing.title = clean.title;
    existing.location = trip.location || "";
    existing.date = clean.date;
    existing.description = trip.description || "";
    existing.pictures = clean.pictures;
    existing.updatedAt = apiStubNow();

    return { trip: Object.assign({}, existing) };
  },

  async deleteTrip(tripId) {
    apiStubMaybeFail("DELETE", "/api/trips/" + tripId);

    const index = apiStub.data.trips.findIndex((trip) => trip.id === tripId);

    if (index === -1) {
      const error = new Error("Fant ikke turen.");
      error.status = 404;
      throw error;
    }

    apiStub.data.trips.splice(index, 1);
  },

  /* --- Notater ---------------------------------------------------------- */

  async getNotes() {
    apiStubMaybeFail("GET", "/api/notes");

    return { notes: apiStub.data.notes.map((note) => Object.assign({}, note)) };
  },

  async createNote(note) {
    apiStubMaybeFail("POST", "/api/notes", note);

    const clean = apiStubValidateNote(note);

    const created = {
      id: apiStub.nextId++,
      title: clean.title,
      date: clean.date,
      description: note.description || "",
      topics: note.topics ? note.topics.slice() : [],
      createdAt: apiStubNow(),
      updatedAt: apiStubNow(),
    };

    apiStub.data.notes.push(created);

    return { note: Object.assign({}, created) };
  },

  async updateNote(noteId, note) {
    apiStubMaybeFail("PUT", "/api/notes/" + noteId, note);

    const existing = apiStub.data.notes.find((entry) => entry.id === noteId);

    if (!existing) {
      const error = new Error("Fant ikke notatet.");
      error.status = 404;
      throw error;
    }

    const clean = apiStubValidateNote(note);

    existing.title = clean.title;
    existing.date = clean.date;
    existing.description = note.description || "";
    existing.topics = note.topics ? note.topics.slice() : [];
    existing.updatedAt = apiStubNow();

    return { note: Object.assign({}, existing) };
  },

  async deleteNote(noteId) {
    apiStubMaybeFail("DELETE", "/api/notes/" + noteId);

    const index = apiStub.data.notes.findIndex((note) => note.id === noteId);

    if (index === -1) {
      const error = new Error("Fant ikke notatet.");
      error.status = 404;
      throw error;
    }

    apiStub.data.notes.splice(index, 1);
  },

  /* --- Innstillinger ---------------------------------------------------- */

  async getSettings() {
    apiStubMaybeFail("GET", "/api/settings");

    return {
      activities: apiStub.data.activities.map((item) => Object.assign({}, item)),
      topics: apiStub.data.topics.map((item) => Object.assign({}, item)),
      counties: apiStub.data.counties.map((item) => Object.assign({}, item)),
    };
  },

  async addActivity(name) {
    apiStubMaybeFail("POST", "/api/settings/activities", { name });

    const item = { id: apiStub.nextId++, activity: name };

    apiStub.data.activities.push(item);

    return { item: Object.assign({}, item) };
  },

  async removeActivity(activityId) {
    apiStubMaybeFail("DELETE", "/api/settings/activities/" + activityId);

    const inUse = apiStub.data.trips.some((trip) => trip.activityId === activityId);

    if (inUse) {
      const error = new Error("Aktiviteten er brukt av en tur, og kan ikke slettes.");
      error.status = 409;
      throw error;
    }

    const index = apiStub.data.activities.findIndex((item) => item.id === activityId);

    if (index === -1) {
      const error = new Error("Fant ikke aktiviteten.");
      error.status = 404;
      throw error;
    }

    apiStub.data.activities.splice(index, 1);
  },

  async addTopic(name) {
    apiStubMaybeFail("POST", "/api/settings/topics", { name });

    const item = { id: apiStub.nextId++, topic: name };

    apiStub.data.topics.push(item);

    return { item: Object.assign({}, item) };
  },

  async removeTopic(topicId) {
    apiStubMaybeFail("DELETE", "/api/settings/topics/" + topicId);

    const inUse = apiStub.data.notes.some((note) => note.topics.includes(topicId));

    if (inUse) {
      const error = new Error("Emneknaggen er brukt av et notat, og kan ikke slettes.");
      error.status = 409;
      throw error;
    }

    const index = apiStub.data.topics.findIndex((item) => item.id === topicId);

    if (index === -1) {
      const error = new Error("Fant ikke emneknaggen.");
      error.status = 404;
      throw error;
    }

    apiStub.data.topics.splice(index, 1);
  },

  async addCounty(name) {
    apiStubMaybeFail("POST", "/api/settings/counties", { name });

    const item = { id: apiStub.nextId++, county: name };

    apiStub.data.counties.push(item);

    return { item: Object.assign({}, item) };
  },

  async removeCounty(countyId) {
    apiStubMaybeFail("DELETE", "/api/settings/counties/" + countyId);

    const inUse = apiStub.data.trips.some((trip) => trip.countyId === countyId);

    if (inUse) {
      const error = new Error("Fylket er brukt av en tur, og kan ikke slettes.");
      error.status = 409;
      throw error;
    }

    const index = apiStub.data.counties.findIndex((item) => item.id === countyId);

    if (index === -1) {
      const error = new Error("Fant ikke fylket.");
      error.status = 404;
      throw error;
    }

    apiStub.data.counties.splice(index, 1);
  },

  /* --- Referansedata ---------------------------------------------------- */

  async getMeta() {
    apiStubMaybeFail("GET", "/api/meta");

    return {
      imageTemplates: apiStub.data.imageTemplates.map((item) => Object.assign({}, item)),
      seasons: apiStub.data.seasons.map((item) => Object.assign({}, item)),
    };
  },
};
