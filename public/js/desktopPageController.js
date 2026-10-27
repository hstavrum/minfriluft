/* ==========================================================================
   desktopPageController.js – Controller for desktop-utgaven av Min friluft.

   Controller håndterer brukerhandlinger og endrer modellen.
   Controller bygger ikke HTML. Etter hver endring kalles updateView().

   Her ligger ALLE controller-funksjoner for desktop, slik at man kan se
   hele desktop-appen samlet.

   Dataene kommer fra API-et, ikke fra modellen. Derfor er funksjonene
   som lagrer eller sletter noe asynkrone: de venter på svar fra
   serveren før modellen oppdateres og skjemaet tegnes på nytt.

   Funksjoner:
     desktopBoot()                         // starter appen, sjekker innlogging
     desktopLoadAllData()                  // henter alt fra API-et
     desktopHandleLogin()                  // logger inn
     desktopHandleLogout()                 // logger ut
     desktopTogglePasswordVisibility()     // viser/skjuler passordet

     desktopOpenTrip(tripId)               // åpner en eksisterende tur
     desktopStartNewTrip()                 // starter et nytt tur-skjema
     desktopEditTrip(tripId)               // åpner et eksisterende tur-skjema
     desktopSaveNewTrip()                  // lagrer ny tur
     desktopSaveEditedTrip()               // lagrer endringer på tur
     desktopCancelTripForm(pageName)       // avbryter et tur-skjema
     desktopToggleTripMenu()               // viser/skjuler menyen på turvisning
     desktopAskDeleteTrip()                // viser dialog for å slette tur
     desktopCancelDeleteTrip()             // skjuler dialog for å slette tur
     desktopConfirmDeleteTrip()            // sletter tur og bildene som hører til
     desktopDuplicateTrip()                // lager en kopi av turen
     desktopAddPictureToTripForm(pageName) // legger til et bilde i et tur-skjema
     desktopRemovePictureFromTripForm(index, pageName) // fjerner et bilde

     desktopOpenNote(noteId)               // åpner et notat
     desktopStartNewNote()                 // starter et nytt notat-skjema
     desktopEditNote(noteId)               // åpner et eksisterende notat-skjema
     desktopSaveNewNote()                  // lagrer et nytt notat
     desktopSaveEditedNote()               // lagrer endringer på et notat
     desktopCancelNoteForm(pageName)       // avbryter et notat-skjema
     desktopToggleNoteMenu()               // viser/skjuler menyen på notatvisning
     desktopAskDeleteNote()                // viser dialog for å slette notat
     desktopCancelDeleteNote()             // skjuler dialog for å slette notat
     desktopConfirmDeleteNote()            // sletter notatet
     desktopDuplicateNote()                // lager en kopi av notatet
     desktopToggleTopic(topicId, pageName) // slår en emneknagg av og på

     desktopRunSearch()                    // henter treffene på nytt
     desktopSetSearchFilter(fieldName, value) // endrer et filter i søket
     desktopSetSortOrder(sortOrder)        // endrer sorteringen i søket

     desktopAddActivity()                  // legger til en ny aktivitet
     desktopRemoveActivity(id)             // sletter en aktivitet
     desktopAddTopic()                     // legger til en ny emneknagg
     desktopRemoveTopic(id)                // sletter en emneknagg
     desktopAddCounty()                    // legger til et nytt fylke
     desktopRemoveCounty(id)               // sletter et fylke

     desktopIsTripFormValid(form)          // sjekker om skjemaet er gyldig
     desktopIsNoteFormValid(form)          // sjekker om skjemaet er gyldig
     desktopClearTripForm(form)            // tømmer et tur-skjema
     desktopClearNoteForm(form)            // tømmer et notat-skjema
     desktopGetTodayAsDateText()           // dagens dato som tekst
     desktopGetNewName(name, list, keyName, label) // sjekker navnet på det som skal legges til
     desktopIsNameAlreadyUsed(list, keyName, name) // sjekker om navnet finnes fra før
   ========================================================================== */

/* ==========================================================================
   Oppstart og innlogging
   ========================================================================== */

/* Starter appen. Vi spør API-et om vi allerede er logget inn. Er vi det,
   henter vi dataene med en gang, ellers viser vi innloggingen. */
async function desktopBoot() {
  desktopResetModelData();

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

  await desktopLoadAllData();

  model.app.currentPage = "homePage";
  updateView();
}

/* Tømmer modellens data. Desktop-utgaven henter alt fra API-et, så
   demodataene i modellen skal ikke vises. */
function desktopResetModelData() {
  model.data.trips = [];
  model.data.notes = [];
  model.data.activities = [];
  model.data.topics = [];
  model.data.counties = [];
  model.data.images = [];
}

/* Henter turer, notater, innstillinger og referansedata fra API-et, og
   legger dem i modellen. */
async function desktopLoadAllData() {
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
async function desktopHandleLogin() {
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

  await desktopLoadAllData();

  login.passwordInput = "";
  login.isPasswordVisible = false;

  /* På desktop starter vi på forsiden, som viser de siste og de
     planlagte turene. */
  model.app.currentPage = "homePage";
  updateView();

  return false;
}

function desktopTogglePasswordVisibility() {
  const login = model.viewState.loginPage;

  login.isPasswordVisible = !login.isPasswordVisible;
  updateView();
}

/* Logger ut. Serveren sletter sesjonen og fjerner cookien, så neste
   gang vi laster siden er vi ikke logget inn. Selv om kallet feiler,
   viser vi innloggingen igjen, så brukeren ikke blirfanget i appen. */
async function desktopHandleLogout() {
  try {
    await api.logout();
  } catch {
    /* Serveren er nede. Da fortsetter vi likevel ut av appen. */
  }

  desktopResetModelData();

  const login = model.viewState.loginPage;

  login.userInput = "";
  login.passwordInput = "";
  login.isPasswordVisible = false;
  login.errorMessage = "";

  model.app.user = null;
  model.app.currentPage = "loginPage";
  updateView();
}

/* ==========================================================================
   Turer
   ========================================================================== */

function desktopOpenTrip(tripId) {
  const trip = findObjectById(model.data.trips, tripId);

  if (!trip) {
    return;
  }

  /* Vi lagrer bare id-en av turen i view state. Selve turen
     ligger allerede i model.data.trips. */
  const tripView = model.viewState.tripViewPage;

  tripView.tripId = trip.id;
  tripView.isMenuOpen = false;
  tripView.isDeleteDialogOpen = false;
  tripView.errorMessage = "";

  model.app.currentPage = "tripViewPage";
  updateView();
}

function desktopStartNewTrip() {
  desktopClearTripForm(model.viewState.newTripPage);

  model.app.currentPage = "newTripPage";
  updateView();
}

function desktopEditTrip(tripId) {
  const trip = findObjectById(model.data.trips, tripId);

  if (!trip) {
    return;
  }

  /* Skjemaet er et arbeidsutkast, så vi fyller det med verdiene fra turen,
     ikke med turen selv. */
  const editTripPage = model.viewState.editTripPage;

  editTripPage.tripId = trip.id;
  editTripPage.activityId = trip.activityId;
  editTripPage.title = trip.title;
  editTripPage.location = trip.location;
  editTripPage.date = trip.date;
  editTripPage.countyId = trip.countyId;
  editTripPage.description = trip.description;
  editTripPage.pictures = trip.pictures.slice();

  model.viewState.tripViewPage.isMenuOpen = false;

  model.app.currentPage = "editTripPage";
  updateView();
}

/* Gjør et tur-skjema om til det serveren forventer. */
function desktopTripPayload(form) {
  return {
    activityId: form.activityId,
    countyId: form.countyId,
    title: form.title.trim(),
    location: form.location.trim(),
    date: form.date,
    description: form.description,
    pictures: form.pictures.slice(),
  };
}

async function desktopSaveNewTrip() {
  const form = model.viewState.newTripPage;

  if (!desktopIsTripFormValid(form)) {
    form.errorMessage = "Tittel og dato må være fyllt inn.";
    updateView();
    return;
  }

  let created;

  try {
    created = await api.createTrip(desktopTripPayload(form));
  } catch (error) {
    form.errorMessage = error.message;
    updateView();
    return;
  }

  /* Serveren gir oss turen tilbake, med id og tidsstempel. */
  model.data.trips.push(created.trip);

  desktopClearTripForm(model.viewState.newTripPage);

  /* Vi åpner den nye turen, slik at brukeren ser resultatet. */
  model.viewState.tripViewPage.tripId = created.trip.id;
  model.viewState.tripViewPage.isMenuOpen = false;
  model.viewState.tripViewPage.isDeleteDialogOpen = false;
  model.viewState.tripViewPage.errorMessage = "";

  model.app.currentPage = "tripViewPage";
  updateView();
}

async function desktopSaveEditedTrip() {
  const form = model.viewState.editTripPage;

  if (!desktopIsTripFormValid(form)) {
    form.errorMessage = "Tittel og dato må være fyllt inn.";
    updateView();
    return;
  }

  const trip = findObjectById(model.data.trips, form.tripId);

  if (!trip) {
    model.app.currentPage = "tripsPage";
    updateView();
    return;
  }

  let updated;

  try {
    updated = await api.updateTrip(trip.id, desktopTripPayload(form));
  } catch (error) {
    form.errorMessage = error.message;
    updateView();
    return;
  }

  /* Vi bytter ut turen i modellen med den serveren sendte tilbake. */
  const index = findIndexById(model.data.trips, trip.id);

  if (index !== -1) {
    model.data.trips[index] = updated.trip;
  }

  desktopClearTripForm(model.viewState.editTripPage);

  /* Skjemaet skal ikke huske en tur etter lagring. */
  model.viewState.editTripPage.tripId = null;

  model.viewState.tripViewPage.tripId = trip.id;
  model.viewState.tripViewPage.errorMessage = "";

  model.app.currentPage = "tripViewPage";
  updateView();
}

function desktopCancelTripForm(pageName) {
  const form = model.viewState[pageName];

  desktopClearTripForm(form);

  if (pageName === "editTripPage") {
    /* Vi blir stående på turen vi kom fra, hvis den fortsatt finnes. */
    if (findObjectById(model.data.trips, form.tripId)) {
      model.viewState.tripViewPage.tripId = form.tripId;
      model.app.currentPage = "tripViewPage";
    } else {
      model.app.currentPage = "tripsPage";
    }
  } else {
    model.app.currentPage = "tripsPage";
  }

  updateView();
}

function desktopToggleTripMenu() {
  const tripView = model.viewState.tripViewPage;

  tripView.isMenuOpen = !tripView.isMenuOpen;
  updateView();
}

function desktopAskDeleteTrip() {
  const tripView = model.viewState.tripViewPage;

  tripView.isMenuOpen = false;
  tripView.isDeleteDialogOpen = true;
  updateView();
}

function desktopCancelDeleteTrip() {
  const tripView = model.viewState.tripViewPage;

  tripView.isDeleteDialogOpen = false;
  updateView();
}

async function desktopConfirmDeleteTrip() {
  const tripView = model.viewState.tripViewPage;
  const trip = findObjectById(model.data.trips, tripView.tripId);

  if (!trip) {
    tripView.isDeleteDialogOpen = false;
    updateView();
    return;
  }

  try {
    await api.deleteTrip(trip.id);
  } catch (error) {
    tripView.errorMessage = error.message;
    tripView.isDeleteDialogOpen = false;
    updateView();
    return;
  }

  const index = findIndexById(model.data.trips, trip.id);

  if (index !== -1) {
    model.data.trips.splice(index, 1);
  }

  tripView.tripId = null;
  tripView.isDeleteDialogOpen = false;
  tripView.errorMessage = "";

  model.app.currentPage = "tripsPage";
  updateView();
}

async function desktopDuplicateTrip() {
  const tripView = model.viewState.tripViewPage;
  const trip = findObjectById(model.data.trips, tripView.tripId);

  if (!trip) {
    return;
  }

  let created;

  try {
    created = await api.createTrip({
      activityId: trip.activityId,
      countyId: trip.countyId,
      title: trip.title + " (kopi)",
      location: trip.location,
      date: trip.date,
      description: trip.description,
      pictures: trip.pictures.slice(),
    });
  } catch (error) {
    tripView.errorMessage = error.message;
    updateView();
    return;
  }

  model.data.trips.push(created.trip);

  tripView.tripId = created.trip.id;
  tripView.isMenuOpen = false;
  tripView.errorMessage = "";

  updateView();
}

/* Legger til et bilde i skjemaet. Vi lagrer bare motivet, og det er
   serveren som gir bildet en plass i rekken. */
function desktopAddPictureToTripForm(pageName) {
  const form = model.viewState[pageName];
  const templates = model.data.imageTemplates;

  if (templates.length === 0) {
    return;
  }

  /* Motivene går i runde, slik at en tur ikke får samme motiv to
     ganger på rad. */
  form.pictures.push(templates[form.pictures.length % templates.length].id);

  updateView();
}

/* Fjerner ett bilde fra skjemaet. Vi peker på plasseringen i rekken,
   fordi det kan være samme motiv flere ganger på én tur. */
function desktopRemovePictureFromTripForm(index, pageName) {
  const form = model.viewState[pageName];

  if (index < 0 || index >= form.pictures.length) {
    return;
  }

  form.pictures.splice(index, 1);

  updateView();
}

/* ==========================================================================
   Notater
   ========================================================================== */

function desktopOpenNote(noteId) {
  const note = findObjectById(model.data.notes, noteId);

  if (!note) {
    return;
  }

  const noteView = model.viewState.noteViewPage;

  noteView.noteId = note.id;
  noteView.isMenuOpen = false;
  noteView.isDeleteDialogOpen = false;
  noteView.errorMessage = "";

  model.app.currentPage = "noteViewPage";
  updateView();
}

/* Starter et nytt notat-skjema. Vi tømmer et gammelt utkast og setter
   dagens dato, slik at brukeren slipper å skrive datoen selv. */
function desktopStartNewNote() {
  const form = model.viewState.newNotePage;

  desktopClearNoteForm(form);
  form.date = desktopGetTodayAsDateText();

  model.app.currentPage = "newNotePage";
  updateView();
}

/* Gjør et notat-skjema om til det serveren forventer. */
function desktopNotePayload(form) {
  return {
    title: form.title.trim(),
    date: form.date,
    description: form.description,
    topics: form.topics.slice(),
  };
}

async function desktopSaveNewNote() {
  const form = model.viewState.newNotePage;

  if (!desktopIsNoteFormValid(form)) {
    form.errorMessage = "Tittel og dato må være fyllt inn.";
    updateView();
    return;
  }

  let created;

  try {
    created = await api.createNote(desktopNotePayload(form));
  } catch (error) {
    form.errorMessage = error.message;
    updateView();
    return;
  }

  model.data.notes.push(created.note);

  /* Vi tømmer skjemaet, så det ikke ligger igjen som et utkast. */
  desktopClearNoteForm(model.viewState.newNotePage);

  model.viewState.noteViewPage.noteId = created.note.id;
  model.viewState.noteViewPage.isMenuOpen = false;
  model.viewState.noteViewPage.isDeleteDialogOpen = false;
  model.viewState.noteViewPage.errorMessage = "";

  model.app.currentPage = "noteViewPage";
  updateView();
}

async function desktopSaveEditedNote() {
  const form = model.viewState.editNotePage;

  if (!desktopIsNoteFormValid(form)) {
    form.errorMessage = "Tittel og dato må være fyllt inn.";
    updateView();
    return;
  }

  const note = findObjectById(model.data.notes, form.noteId);

  if (!note) {
    model.app.currentPage = "notesPage";
    updateView();
    return;
  }

  let updated;

  try {
    updated = await api.updateNote(note.id, desktopNotePayload(form));
  } catch (error) {
    form.errorMessage = error.message;
    updateView();
    return;
  }

  const index = findIndexById(model.data.notes, note.id);

  if (index !== -1) {
    model.data.notes[index] = updated.note;
  }

  desktopClearNoteForm(model.viewState.editNotePage);
  model.viewState.editNotePage.noteId = null;

  model.viewState.noteViewPage.noteId = note.id;
  model.viewState.noteViewPage.errorMessage = "";

  model.app.currentPage = "noteViewPage";
  updateView();
}

function desktopCancelNoteForm(pageName) {
  const form = model.viewState[pageName];

  desktopClearNoteForm(form);

  if (pageName === "editNotePage") {
    /* Vi blir stående på notatet vi kom fra, hvis det fortsatt finnes. */
    if (findObjectById(model.data.notes, form.noteId)) {
      model.viewState.noteViewPage.noteId = form.noteId;
      model.app.currentPage = "noteViewPage";
    } else {
      model.app.currentPage = "notesPage";
    }
  } else {
    model.app.currentPage = "notesPage";
  }

  updateView();
}

function desktopEditNote(noteId) {
  const note = findObjectById(model.data.notes, noteId);

  if (!note) {
    return;
  }

  const editNotePage = model.viewState.editNotePage;

  editNotePage.noteId = note.id;
  editNotePage.title = note.title;
  editNotePage.date = note.date;
  editNotePage.description = note.description;
  editNotePage.topics = note.topics.slice();

  model.viewState.noteViewPage.isMenuOpen = false;

  model.app.currentPage = "editNotePage";
  updateView();
}

function desktopToggleNoteMenu() {
  const noteView = model.viewState.noteViewPage;

  noteView.isMenuOpen = !noteView.isMenuOpen;
  updateView();
}

function desktopAskDeleteNote() {
  const noteView = model.viewState.noteViewPage;

  noteView.isMenuOpen = false;
  noteView.isDeleteDialogOpen = true;
  updateView();
}

function desktopCancelDeleteNote() {
  const noteView = model.viewState.noteViewPage;

  noteView.isDeleteDialogOpen = false;
  updateView();
}

async function desktopConfirmDeleteNote() {
  const noteView = model.viewState.noteViewPage;
  const note = findObjectById(model.data.notes, noteView.noteId);

  if (!note) {
    noteView.isDeleteDialogOpen = false;
    updateView();
    return;
  }

  try {
    await api.deleteNote(note.id);
  } catch (error) {
    noteView.errorMessage = error.message;
    noteView.isDeleteDialogOpen = false;
    updateView();
    return;
  }

  const index = findIndexById(model.data.notes, note.id);

  if (index !== -1) {
    model.data.notes.splice(index, 1);
  }

  noteView.noteId = null;
  noteView.isDeleteDialogOpen = false;
  noteView.errorMessage = "";

  model.app.currentPage = "notesPage";
  updateView();
}

async function desktopDuplicateNote() {
  const noteView = model.viewState.noteViewPage;
  const note = findObjectById(model.data.notes, noteView.noteId);

  if (!note) {
    return;
  }

  let created;

  try {
    created = await api.createNote({
      title: note.title + " (kopi)",
      date: note.date,
      description: note.description,
      topics: note.topics.slice(),
    });
  } catch (error) {
    noteView.errorMessage = error.message;
    updateView();
    return;
  }

  model.data.notes.push(created.note);

  noteView.noteId = created.note.id;
  noteView.isMenuOpen = false;
  noteView.errorMessage = "";

  updateView();
}

/* Slår en emneknagg av og på i det skjemaet vi står i. */
function desktopToggleTopic(topicId, pageName) {
  const topics = model.viewState[pageName].topics;

  for (let i = 0; i < topics.length; i++) {
    if (topics[i] === topicId) {
      topics.splice(i, 1);
      updateView();
      return;
    }
  }

  topics.push(topicId);
  updateView();
}

/* ==========================================================================
   Søk
   ========================================================================== */

/* Treffene regnes ut når siden tegnes, så vi trenger bare å tegne siden
   på nytt når filteret er endret. */
function desktopRunSearch() {
  updateView();
}

/* Endrer et filter i søket. Alle filtrene er ID-er, så vi gjør om
   verdien fra skjemaet til et tall. En tom verdi betyr at vi ikke
   filtrerer på det feltet. */
function desktopSetSearchFilter(fieldName, value) {
  const search = model.viewState.searchPage;

  search[fieldName] = value ? Number(value) : null;

  desktopRunSearch();
}

function desktopSetSortOrder(sortOrder) {
  model.viewState.searchPage.sortOrder = sortOrder;

  desktopRunSearch();
}

/* ==========================================================================
   Innstillinger
   ========================================================================== */

/* Aktiviteter, emneknagger og fylker ligger i modellen, og blir endret
   direkte der. En aktivitet eller et fylke som brukes av en tur, og en
   emneknagg som brukes av et notat, kan ikke slettes. Det sjekker
   serveren, og den gir oss meldingen som skal vises. */
async function desktopAddActivity() {
  const settings = model.viewState.settingsPage;
  const name = desktopGetNewName(
    settings.newActivity,
    model.data.activities,
    "activity",
    "Aktiviteten",
  );

  if (name === null) {
    updateView();
    return;
  }

  try {
    const created = await api.addActivity(name);

    model.data.activities.push(created.item);
  } catch (error) {
    settings.errorMessage = error.message;
    updateView();
    return;
  }

  settings.newActivity = "";
  settings.errorMessage = "";

  updateView();
}

async function desktopRemoveActivity(activityId) {
  const settings = model.viewState.settingsPage;
  const index = findIndexById(model.data.activities, activityId);

  if (index === -1) {
    return;
  }

  try {
    await api.removeActivity(activityId);
  } catch (error) {
    /* Serveren svarer 409 når aktiviteten er brukt av en tur. */
    settings.errorMessage = error.message;
    updateView();
    return;
  }

  model.data.activities.splice(index, 1);

  settings.errorMessage = "";

  updateView();
}

async function desktopAddTopic() {
  const settings = model.viewState.settingsPage;
  const name = desktopGetNewName(
    settings.newTopic,
    model.data.topics,
    "topic",
    "Emneknaggen",
  );

  if (name === null) {
    updateView();
    return;
  }

  try {
    const created = await api.addTopic(name);

    model.data.topics.push(created.item);
  } catch (error) {
    settings.errorMessage = error.message;
    updateView();
    return;
  }

  settings.newTopic = "";
  settings.errorMessage = "";

  updateView();
}

async function desktopRemoveTopic(topicId) {
  const settings = model.viewState.settingsPage;
  const index = findIndexById(model.data.topics, topicId);

  if (index === -1) {
    return;
  }

  try {
    await api.removeTopic(topicId);
  } catch (error) {
    /* Serveren svarer 409 når emneknaggen er brukt av et notat. */
    settings.errorMessage = error.message;
    updateView();
    return;
  }

  model.data.topics.splice(index, 1);

  settings.errorMessage = "";

  updateView();
}

async function desktopAddCounty() {
  const settings = model.viewState.settingsPage;
  const name = desktopGetNewName(
    settings.newCounty,
    model.data.counties,
    "county",
    "Fylket",
  );

  if (name === null) {
    updateView();
    return;
  }

  try {
    const created = await api.addCounty(name);

    model.data.counties.push(created.item);
  } catch (error) {
    settings.errorMessage = error.message;
    updateView();
    return;
  }

  settings.newCounty = "";
  settings.errorMessage = "";

  updateView();
}

async function desktopRemoveCounty(countyId) {
  const settings = model.viewState.settingsPage;
  const index = findIndexById(model.data.counties, countyId);

  if (index === -1) {
    return;
  }

  try {
    await api.removeCounty(countyId);
  } catch (error) {
    /* Serveren svarer 409 når fylket er brukt av en tur. */
    settings.errorMessage = error.message;
    updateView();
    return;
  }

  model.data.counties.splice(index, 1);

  settings.errorMessage = "";

  updateView();
}

/* ==========================================================================
   Hjelpere
   ========================================================================== */

/* Et tur-skjema er gyldig når tittel og dato er fyllt inn. */
function desktopIsTripFormValid(form) {
  return form.title.trim() !== "" && form.date !== "" && form.date !== null;
}

/* Et notat-skjema er gyldig når tittel og dato er fyllt inn. */
function desktopIsNoteFormValid(form) {
  return form.title.trim() !== "" && form.date !== "" && form.date !== null;
}

/* Tømmer et tur-skjema, slik at et halvutfylt skjema ikke ligger igjen
   neste gang siden åpnes. */
function desktopClearTripForm(form) {
  form.activityId = null;
  form.title = "";
  form.location = "";
  form.date = "";
  form.countyId = null;
  form.description = "";
  form.pictures = [];
  form.errorMessage = "";
}

/* Tømmer et notat-skjema. */
function desktopClearNoteForm(form) {
  form.title = "";
  form.date = "";
  form.description = "";
  form.topics = [];
  form.errorMessage = "";
}

/* Dagens dato som tekst, på formatet 2026-10-23. Vi bruker datoen på
   maskinen, ikke UTC, slik at det blir riktig dato også sent på døgnet. */
function desktopGetTodayAsDateText() {
  return getTodayAsDateText();
}

/* Sjekker navnet på det som skal legges til. Gir tilbake navnet hvis det er
   bra, eller null hvis navnet er tomt eller finnes fra før. */
function desktopGetNewName(name, list, keyName, label) {
  const settings = model.viewState.settingsPage;
  /* Feltet er null helt til brukeren skriver noe, så vi må tåle både null
     og en tom tekst. */
  const trimmedName = name ? name.trim() : "";

  if (trimmedName === "") {
    settings.errorMessage = "Navnet kan ikke være tomt.";
    return null;
  }

  if (desktopIsNameAlreadyUsed(list, keyName, trimmedName)) {
    settings.errorMessage = label + " «" + trimmedName + "» finnes allerede.";
    return null;
  }

  settings.errorMessage = "";

  return trimmedName;
}

/* Sjekker om navnet finnes i listen fra før. Vi ser etter likt navn,
   uansett store og små bokstaver. */
function desktopIsNameAlreadyUsed(list, keyName, name) {
  const lowerName = name.toLowerCase();

  for (const item of list) {
    if (item[keyName].toLowerCase() === lowerName) {
      return true;
    }
  }

  return false;
}
