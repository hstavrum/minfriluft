/* ==========================================================================
   loginPageController.js – Controller for innloggingssiden

   Innloggingen går mot API-et, og ikke lenger bare mot en lokal sjekk.
   Er begge feltene fylt, prøver vi å logge inn. Gir serveren tilbake
   en sesjon, henter vi alle dataene og går til turlisten.

   Brukerhandlinger:
     mobileBoot()                 – Starter appen og sjekker om vi er logget inn
     mobileLoadAllData()          – Henter turer, notater, innstillinger og referansedata
     handleLogin()                – Logg inn-knappen
     togglePasswordVisibility()   – Øynet som viser/skjuler passord
   ========================================================================== */

/* Starter appen. Vi spør API-et om vi allerede er logget inn. Er vi det,
   henter vi dataene med en gang, ellers viser vi innloggingen. */
async function mobileBoot() {
  mobileResetModelData();

  let user = null;

  try {
    user = await api.me();
  } catch {
    /* Serveren er nede. Da viser vi innloggingen, og får en melding
       dersom brukeren prøver å logge inn. */
    user = null;
  }

  if (!user) {
    model.app.user = null;
    model.app.currentPage = "loginPage";
    updateView();
    return;
  }

  model.app.user = user;

  await mobileLoadAllData();

  model.app.currentPage = "tripsPage";
  updateView();

  /* Snarveien i manifestet, «Ny tur», åpner appen med tur-skjemaet
     klart. Det er en ekstra-parameter i adressen. */
  const handling = new URLSearchParams(window.location.search).get("handling");

  if (handling === "ny-tur") {
    startNewTrip();
  }
}

/* Tømmer modellens data. Dataene kommer fra API-et, så demodataene i
   modellen skal ikke vises. */
function mobileResetModelData() {
  model.data.trips = [];
  model.data.notes = [];
  model.data.activities = [];
  model.data.topics = [];
  model.data.counties = [];
  model.data.images = [];
}

/* Henter turer, notater, innstillinger og referansedata fra API-et, og
   legger dem i modellen. */
async function mobileLoadAllData() {
  const [trips, notes, settings, meta] = await Promise.all([
    api.getTrips(),
    api.getNotes(),
    api.getSettings(),
    api.getMeta(),
  ]);

  model.data.trips = trips.trips;
  model.data.notes = notes.notes;
  model.data.activities = settings.activities;
  model.data.topics = settings.topics;
  model.data.counties = settings.counties;
  model.data.imageTemplates = meta.imageTemplates;
  model.data.seasons = meta.seasons;
}

/* Logger inn mot API-et. Er påloggingen feil, viser vi meldingen
   serveren sendte. */
async function handleLogin() {
  const login = model.viewState.loginPage;

  const userInput = login.userInput.trim();
  const passwordInput = login.passwordInput;

  if (userInput === "" || passwordInput === "") {
    login.errorMessage = "Fyll inn både e-post og passord.";
    updateView();
    return false;
  }

  login.errorMessage = "";

  try {
    const result = await api.login(userInput, passwordInput);

    model.app.user = result ? result.user : null;
  } catch (error) {
    login.errorMessage = error.message;
    login.passwordInput = "";
    updateView();
    return false;
  }

  await mobileLoadAllData();

  login.passwordInput = "";
  login.isPasswordVisible = false;

  model.app.currentPage = "tripsPage";
  updateView();

  return false;
}

function togglePasswordVisibility() {
  const login = model.viewState.loginPage;

  login.isPasswordVisible = !login.isPasswordVisible;
  updateView();
}
