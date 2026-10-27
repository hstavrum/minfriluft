/* ==========================================================================
   api.js – snakker med API-et

   Alle kall går til /api på samme opprinnelse som siden, slik at
   sesjonscookien blir sendt med automatisk.

   Hvis serveren svarer med en feil, kaster funksjonen et Error-objekt
   med meldingen fra serveren. Controlleren kan vise denne meldingen
   rett ut i skjemaet.
   ========================================================================== */

/* Forklaring av en feil som ikke kom fra API-et.

   Når svaret ikke er vårt JSON-format, betyr det vanligvis at
   forespørselen ikke nådde Node-serveren i det hele tatt: kanskje
   /api ikke er koblet til i webserveren, eller Node-tjenesten er
   nede. Da sier statuskoden hvilken av delene det er. */
function explainFailure(status) {
  if (status === 404) {
    return "Fant ikke API-et (404). /api er ikke koblet til Node-serveren.";
  }

  if (status === 405 || status === 501) {
    return (
      "Tjenesten på /api svarer ikke på forespørselen (HTTP " +
      status +
      "). Den statiske webserveren svarer i stedet."
    );
  }

  if (status === 502 || status === 503 || status === 504) {
    return (
      "Node-serveren svarer ikke (HTTP " +
      status +
      "). Er tjenesten startet, og lytter den på riktig port?"
    );
  }

  return "Noe gikk galt på serveren (HTTP " + status + ").";
}

const api = {
  /* Grunnkallet. Alle andre funksjoner går gjennom denne. */
  async request(method, path, body) {
    const options = {
      method: method,
      headers: {},
      credentials: "same-origin",
    };

    if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    let response;

    try {
      response = await fetch(path, options);
    } catch {
      /* Klarte ikke komme fram til serveren. */
      const error = new Error(
        "Klarte ikke kontakte serveren. Er du koblet til nettet?",
      );
      error.status = 0;
      throw error;
    }

    const text = await response.text();
    let data = null;

    if (text !== "") {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const message =
        data && data.error ? data.error : explainFailure(response.status);

      /* Når serveren svarer med vårt eget JSON, er det nok å vise
         meldingen. Men når svaret er noe annet (HTML fra en proxy, for
         eksempel), skriver vi ut detaljene, slik at det er lett å finne
         ut hva som skjedde. */
      if (!data || !data.error) {
        console.warn(
          "API-kallet feilet:",
          method,
          path,
          response.status,
          text.substring(0, 200),
        );
      }

      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return data;
  },

  /* --- Innlogging ------------------------------------------------------- */

  login(email, password) {
    return api.request("POST", "/api/auth/login", { email, password });
  },

  logout() {
    return api.request("POST", "/api/auth/logout");
  },

  /* Er vi logget inn? Gir null når vi ikke er det, og det er normalt:
     appen spør om dette ved oppstart, for å vite om den skal vise
     innloggingen eller hentede data. */
  async me() {
    try {
      const data = await api.request("GET", "/api/auth/me");

      return data ? data.user : null;
    } catch (error) {
      if (error.status === 401) {
        return null;
      }

      throw error;
    }
  },

  /* --- Turer ------------------------------------------------------------ */

  getTrips() {
    return api.request("GET", "/api/trips");
  },

  createTrip(trip) {
    return api.request("POST", "/api/trips", trip);
  },

  updateTrip(tripId, trip) {
    return api.request("PUT", "/api/trips/" + tripId, trip);
  },

  deleteTrip(tripId) {
    return api.request("DELETE", "/api/trips/" + tripId);
  },

  /* --- Bilder ----------------------------------------------------------- */

  getTripImages(tripId) {
    return api.request("GET", "/api/trips/" + tripId + "/images");
  },

  addTripImage(tripId, templateId) {
    return api.request("POST", "/api/trips/" + tripId + "/images", {
      templateId,
    });
  },

  setTripImages(tripId, templateIds) {
    return api.request("PUT", "/api/trips/" + tripId + "/images", {
      templateIds,
    });
  },

  deleteTripImage(tripId, position) {
    return api.request(
      "DELETE",
      "/api/trips/" + tripId + "/images/" + position,
    );
  },

  /* --- Notater ---------------------------------------------------------- */

  getNotes() {
    return api.request("GET", "/api/notes");
  },

  createNote(note) {
    return api.request("POST", "/api/notes", note);
  },

  updateNote(noteId, note) {
    return api.request("PUT", "/api/notes/" + noteId, note);
  },

  deleteNote(noteId) {
    return api.request("DELETE", "/api/notes/" + noteId);
  },

  /* --- Innstillinger ---------------------------------------------------- */

  getSettings() {
    return api.request("GET", "/api/settings");
  },

  addActivity(name) {
    return api.request("POST", "/api/settings/activities", { name });
  },

  removeActivity(activityId) {
    return api.request("DELETE", "/api/settings/activities/" + activityId);
  },

  addTopic(name) {
    return api.request("POST", "/api/settings/topics", { name });
  },

  removeTopic(topicId) {
    return api.request("DELETE", "/api/settings/topics/" + topicId);
  },

  addCounty(name) {
    return api.request("POST", "/api/settings/counties", { name });
  },

  removeCounty(countyId) {
    return api.request("DELETE", "/api/settings/counties/" + countyId);
  },

  /* --- Referansedata ---------------------------------------------------- */

  getMeta() {
    return api.request("GET", "/api/meta");
  },
};
