/* ==========================================================================
   controllerTests.js – QUnit-tester for loginPageController.js,
                        tripsPageController.js, notesPageController.js
                        og settingsPageController.js

   Controllerne lagrer og sletter via API-et, og er derfor asynkrone.
   Testene bruker en falsk API (test/apiStub.js), så de kjører uten en
   server, og kan sjekke nøyaktig hva controlleren sendte.

   Vi tester controller-logikken ved å kontrollere hvordan modellen endres,
   slik retningslinjene sier. Viewet tegnes ikke i disse testene: updateView()
   er erstattet med en teller, slik at vi kan telle hvor mange ganger
   controlleren ber om ny HTML uten å være avhengig av de andre sidene.
   ========================================================================== */

/* Antall ganger updateView() har blitt kalt siden siste reset. */
let updateViewCallCount = 0;

/* ==========================================================================
   Oppsett
   ========================================================================== */

/* Setter alt tilbake til utgangspunktet: en fersk falsk database, og en
   modell som er fylt med dataene fra den. */
function resetTest() {
  const data = apiStubReset();

  apiStub.loggedIn = true;

  model.app.currentPage = "loginPage";

  model.data.trips = data.trips.map((trip) => Object.assign({}, trip));
  model.data.notes = data.notes.map((note) => Object.assign({}, note));
  model.data.activities = data.activities.map((item) => Object.assign({}, item));
  model.data.topics = data.topics.map((item) => Object.assign({}, item));
  model.data.counties = data.counties.map((item) => Object.assign({}, item));
  model.data.seasons = data.seasons.map((item) => Object.assign({}, item));
  model.data.imageTemplates = data.imageTemplates.map((item) => Object.assign({}, item));

  const login = model.viewState.loginPage;
  login.userInput = "";
  login.passwordInput = "";
  login.isPasswordVisible = false;
  login.errorMessage = "";

  const newTrip = model.viewState.newTripPage;
  newTrip.activityId = null;
  newTrip.title = "";
  newTrip.location = "";
  newTrip.date = "";
  newTrip.countyId = null;
  newTrip.description = "";
  newTrip.pictures = [];
  newTrip.errorMessage = "";

  const editTrip = model.viewState.editTripPage;
  editTrip.tripId = null;
  editTrip.activityId = null;
  editTrip.title = "";
  editTrip.location = "";
  editTrip.date = "";
  editTrip.countyId = null;
  editTrip.description = "";
  editTrip.pictures = [];
  editTrip.errorMessage = "";

  const tripView = model.viewState.tripViewPage;
  tripView.tripId = null;
  tripView.pageNumber = 0;
  tripView.isMenuOpen = false;
  tripView.isDeleteDialogOpen = false;
  tripView.errorMessage = "";

  const newNote = model.viewState.newNotePage;
  newNote.title = "";
  newNote.date = "";
  newNote.description = "";
  newNote.topics = [];
  newNote.errorMessage = "";

  const editNote = model.viewState.editNotePage;
  editNote.noteId = null;
  editNote.title = "";
  editNote.date = "";
  editNote.description = "";
  editNote.topics = [];
  editNote.errorMessage = "";

  const noteView = model.viewState.noteViewPage;
  noteView.noteId = null;
  noteView.isMenuOpen = false;
  noteView.isEditing = false;
  noteView.isDeleteDialogOpen = false;
  noteView.errorMessage = "";

  const settings = model.viewState.settingsPage;
  settings.newActivity = null;
  settings.newTopic = null;
  settings.newCounty = null;
  settings.errorMessage = "";

  const search = model.viewState.searchPage;
  search.searchStr = "";
  search.selectedActivity = null;
  search.selectedTopic = null;
  search.season = null;
  search.sortOrder = "dateDesc";

  updateViewCallCount = 0;
}

/* Kort hjelp: sett brukerens innskrevne data. */
function fillLoginTest(userInput, passwordInput) {
  model.viewState.loginPage.userInput = userInput;
  model.viewState.loginPage.passwordInput = passwordInput;
}

/* Finner det siste kallet controlleren gjorde til API-et. */
function lastApiCall(method) {
  for (let i = apiStub.calls.length - 1; i >= 0; i--) {
    if (!method || apiStub.calls[i].method === method) {
      return apiStub.calls[i];
    }
  }

  return null;
}

/* ==========================================================================
   Innlogging
   ========================================================================== */

QUnit.module("handleLogin", function () {
  QUnit.test("tomt e-postfelt gir feilmelding", async function (assert) {
    resetTest();
    fillLoginTest("", "hemmelig");

    const result = await handleLogin();

    assert.equal(
      model.viewState.loginPage.errorMessage,
      "Fyll inn både e-post og passord.",
      "errorMessage er satt",
    );
    assert.equal(model.app.currentPage, "loginPage", "vi blir på innloggingen");
    assert.equal(updateViewCallCount, 1, "updateView ble kalt én gang");
    assert.equal(result, false, "skjemaet ble ikke sendt");
    assert.equal(lastApiCall("POST"), null, "vi prøver ikke å logge inn");
  });

  QUnit.test("tomt passordfelt gir feilmelding", async function (assert) {
    resetTest();
    fillLoginTest("terje@example.no", "");

    await handleLogin();

    assert.equal(
      model.viewState.loginPage.errorMessage,
      "Fyll inn både e-post og passord.",
      "errorMessage er satt",
    );
    assert.equal(model.app.currentPage, "loginPage", "vi blir på innloggingen");
  });

  QUnit.test("kun mellomrom teller som tomt", async function (assert) {
    resetTest();
    fillLoginTest("   ", "hemmelig");

    await handleLogin();

    assert.equal(
      model.viewState.loginPage.errorMessage,
      "Fyll inn både e-post og passord.",
      "mellomrom er trimmet bort før sjekken",
    );
  });

  QUnit.test("vellykket innlogging går til turer", async function (assert) {
    resetTest();
    fillLoginTest("terje@example.no", "hemmelig");

    const result = await handleLogin();

    assert.equal(model.app.currentPage, "tripsPage", "vi går til turer");
    assert.equal(model.viewState.loginPage.errorMessage, "", "ingen feilmelding");
    assert.equal(result, false, "skjemaet ble ikke sendt");
    assert.equal(lastApiCall("POST").path, "/api/auth/login", "vi kalte innloggingen");
  });

  QUnit.test("innlogging nullstiller passord og øyevisning", async function (assert) {
    resetTest();
    fillLoginTest("terje@example.no", "hemmelig");
    model.viewState.loginPage.isPasswordVisible = true;

    await handleLogin();

    assert.equal(model.viewState.loginPage.passwordInput, "", "passordet er tømt");
    assert.equal(model.viewState.loginPage.isPasswordVisible, false, "passordet er skjult");
    assert.equal(
      model.viewState.loginPage.userInput,
      "terje@example.no",
      "e-posten beholdes, så brukeren slipper skrive den igjen",
    );
  });

  QUnit.test("feil passord gir melding fra serveren", async function (assert) {
    resetTest();
    fillLoginTest("terje@example.no", "feil");

    await handleLogin();

    assert.equal(
      model.viewState.loginPage.errorMessage,
      "E-post eller passord er feil.",
      "meldingen fra serveren vises",
    );
    assert.equal(model.app.currentPage, "loginPage", "vi blir stående på innloggingen");
    assert.equal(model.viewState.loginPage.passwordInput, "", "passordet er tømt");
  });

  QUnit.test("innlogging henter alle dataene", async function (assert) {
    resetTest();
    fillLoginTest("terje@example.no", "hemmelig");

    await handleLogin();

    assert.equal(model.data.trips.length, 2, "turene er hentet");
    assert.equal(model.data.notes.length, 1, "notatene er hentet");
    assert.equal(model.data.activities.length, 3, "aktivitetene er hentet");
    assert.equal(model.data.topics.length, 2, "emneknaggene er hentet");
    assert.equal(model.data.counties.length, 3, "fylkene er hentet");
    assert.equal(model.data.imageTemplates.length, 3, "motivene er hentet");
    assert.equal(model.data.seasons.length, 5, "sesongene er hentet");
  });
});

QUnit.module("togglePasswordVisibility", function () {
  QUnit.test("skjult passord blir synlig", function (assert) {
    resetTest();

    togglePasswordVisibility();

    assert.equal(model.viewState.loginPage.isPasswordVisible, true, "passordet er synlig");
    assert.equal(updateViewCallCount, 1, "updateView ble kalt én gang");
  });

  QUnit.test("synlig passord blir skjult", function (assert) {
    resetTest();
    model.viewState.loginPage.isPasswordVisible = true;

    togglePasswordVisibility();

    assert.equal(model.viewState.loginPage.isPasswordVisible, false, "passordet er skjult");
  });

  QUnit.test("to trykk gir tilbake til start", function (assert) {
    resetTest();

    togglePasswordVisibility();
    togglePasswordVisibility();

    assert.equal(model.viewState.loginPage.isPasswordVisible, false, "passordet er skjult");
  });

  QUnit.test("funksjonen endrer ikke passordet", function (assert) {
    resetTest();
    fillLoginTest("terje@example.no", "hemmelig");

    togglePasswordVisibility();

    assert.equal(
      model.viewState.loginPage.passwordInput,
      "hemmelig",
      "passordet står uendret",
    );
  });
});

/* ==========================================================================
   Turer
   ========================================================================== */

QUnit.module("openTrip", function () {
  QUnit.test("åpner turen og nullstiller visningen", function (assert) {
    resetTest();
    model.viewState.tripViewPage.pageNumber = 3;

    openTrip(10);

    assert.equal(model.viewState.tripViewPage.tripId, 10, "turen er åpnet");
    assert.equal(model.viewState.tripViewPage.pageNumber, 0, "vi er på første side");
    assert.equal(model.app.currentPage, "tripViewPage", "vi er på turvisningen");
  });

  QUnit.test("lukket meny og åpen dialog nullstilles", function (assert) {
    resetTest();
    model.viewState.tripViewPage.isMenuOpen = true;
    model.viewState.tripViewPage.isDeleteDialogOpen = true;

    openTrip(11);

    assert.equal(model.viewState.tripViewPage.isMenuOpen, false, "menyen er lukket");
    assert.equal(model.viewState.tripViewPage.isDeleteDialogOpen, false, "dialogen er lukket");
  });

  QUnit.test("ukjent tur gir ingen endring", function (assert) {
    resetTest();
    model.app.currentPage = "tripsPage";

    openTrip(999);

    assert.equal(model.app.currentPage, "tripsPage", "vi blir stående");
    assert.equal(updateViewCallCount, 0, "viewet ble ikke tegnet");
  });
});

QUnit.module("startNewTrip", function () {
  QUnit.test("går til skjemaet og tømmer det", function (assert) {
    resetTest();
    model.viewState.newTripPage.title = "Rest fra i går";
    model.viewState.newTripPage.pictures = [1, 2];

    startNewTrip();

    assert.equal(model.app.currentPage, "newTripPage", "vi er på skjemaet");
    assert.equal(model.viewState.newTripPage.title, "", "skjemaet er tømt");
    assert.deepEqual(model.viewState.newTripPage.pictures, [], "bildene er tømt");
  });

  QUnit.test("rører ikke turene", function (assert) {
    resetTest();

    startNewTrip();

    assert.equal(model.data.trips.length, 2, "turene er uendret");
  });
});

QUnit.module("toggleTripMenu", function () {
  QUnit.test("lukket meny blir åpen", function (assert) {
    resetTest();

    toggleTripMenu();

    assert.equal(model.viewState.tripViewPage.isMenuOpen, true, "menyen er åpen");
  });

  QUnit.test("to trykk gir tilbake til lukket", function (assert) {
    resetTest();

    toggleTripMenu();
    toggleTripMenu();

    assert.equal(model.viewState.tripViewPage.isMenuOpen, false, "menyen er lukket");
  });
});

QUnit.module("askDeleteTrip", function () {
  QUnit.test("lukker menyen og viser dialogen", function (assert) {
    resetTest();
    model.viewState.tripViewPage.isMenuOpen = true;

    askDeleteTrip();

    assert.equal(model.viewState.tripViewPage.isMenuOpen, false, "menyen er lukket");
    assert.equal(model.viewState.tripViewPage.isDeleteDialogOpen, true, "dialogen er åpen");
  });

  QUnit.test("turen beholdes", function (assert) {
    resetTest();

    askDeleteTrip();

    assert.equal(model.data.trips.length, 2, "turen er ikke slettet");
  });
});

QUnit.module("cancelDeleteTrip", function () {
  QUnit.test("lukker dialogen og beholder turen", function (assert) {
    resetTest();
    model.viewState.tripViewPage.isDeleteDialogOpen = true;

    cancelDeleteTrip();

    assert.equal(model.viewState.tripViewPage.isDeleteDialogOpen, false, "dialogen er lukket");
    assert.equal(model.data.trips.length, 2, "turen er beholdt");
  });
});

QUnit.module("confirmDeleteTrip", function () {
  QUnit.test("sletter turen hos serveren", async function (assert) {
    resetTest();
    model.viewState.tripViewPage.tripId = 10;

    await confirmDeleteTrip();

    assert.equal(lastApiCall("DELETE").path, "/api/trips/10", "vi slettet turen");
    assert.equal(model.data.trips.length, 1, "turen er borte fra modellen");
    assert.equal(model.app.currentPage, "tripsPage", "vi går til turlisten");
    assert.equal(model.viewState.tripViewPage.tripId, null, "vi har ingen åpen tur");
  });

  QUnit.test("går tilbake til turlisten", async function (assert) {
    resetTest();
    model.viewState.tripViewPage.tripId = 11;

    await confirmDeleteTrip();

    assert.equal(model.app.currentPage, "tripsPage", "vi går til turlisten");
  });

  QUnit.test("ukjent tur sletter ingenting", async function (assert) {
    resetTest();
    model.viewState.tripViewPage.tripId = 999;

    await confirmDeleteTrip();

    assert.equal(lastApiCall("DELETE"), null, "vi kalte ikke serveren");
    assert.equal(model.data.trips.length, 2, "turene er uendret");
  });

  QUnit.test("feil fra serveren vises i stedet for å slette", async function (assert) {
    resetTest();
    model.viewState.tripViewPage.tripId = 10;
    apiStub.failWith = { status: 500, message: "Noe gikk galt på serveren." };

    await confirmDeleteTrip();

    assert.equal(
      model.viewState.tripViewPage.errorMessage,
      "Noe gikk galt på serveren.",
      "meldingen vises",
    );
    assert.equal(model.data.trips.length, 2, "turen er ikke slettet");
  });
});

QUnit.module("duplicateTrip", function () {
  QUnit.test("lager en kopi med ny id", async function (assert) {
    resetTest();
    model.viewState.tripViewPage.tripId = 10;

    await duplicateTrip();

    assert.equal(model.data.trips.length, 3, "kopien er lagt til");
    assert.equal(lastApiCall("POST").path, "/api/trips", "vi kalte serveren");
    assert.equal(lastApiCall("POST").body.title, "Bærtur til Holtet (kopi)", "tittelen er kopiert");
    assert.notEqual(model.data.trips[2].id, 10, "kopien har sin egen id");
  });

  QUnit.test("kopien får egne bilder", async function (assert) {
    resetTest();
    model.viewState.tripViewPage.tripId = 10;

    await duplicateTrip();

    assert.deepEqual(lastApiCall("POST").body.pictures, [1, 2], "bildene er kopiert");
    assert.deepEqual(model.data.trips[2].pictures, [1, 2], "kopien har bildene");
  });

  QUnit.test("kopien åpnes og visningen nullstilles", async function (assert) {
    resetTest();
    model.viewState.tripViewPage.tripId = 10;
    model.viewState.tripViewPage.isMenuOpen = true;

    await duplicateTrip();

    assert.equal(model.viewState.tripViewPage.isMenuOpen, false, "menyen er lukket");
    assert.equal(model.viewState.tripViewPage.tripId, model.data.trips[2].id, "kopien er åpen");
  });

  QUnit.test("turer uten bilder kopieres uten bilder", async function (assert) {
    resetTest();
    model.viewState.tripViewPage.tripId = 11;

    await duplicateTrip();

    assert.deepEqual(lastApiCall("POST").body.pictures, [], "ingen bilder");
  });

  QUnit.test("ukjent tur lager ingen kopi", async function (assert) {
    resetTest();
    model.viewState.tripViewPage.tripId = 999;

    await duplicateTrip();

    assert.equal(lastApiCall("POST"), null, "vi kalte ikke serveren");
    assert.equal(model.data.trips.length, 2, "turene er uendret");
  });
});

QUnit.module("editTrip", function () {
  QUnit.test("fyller skjemaet med verdiene fra turen", function (assert) {
    resetTest();

    editTrip(10);

    assert.equal(model.viewState.editTripPage.tripId, 10, "turen er valgt");
    assert.equal(model.viewState.editTripPage.title, "Bærtur til Holtet", "tittelen er kopiert");
    assert.equal(model.viewState.editTripPage.date, "2026-08-15", "datoen er kopiert");
    assert.equal(model.app.currentPage, "editTripPage", "vi er på skjemaet");
  });

  QUnit.test("skjemaet får en egen liste av bildene", function (assert) {
    resetTest();

    editTrip(10);

    assert.deepEqual(model.viewState.editTripPage.pictures, [1, 2], "bildene er kopiert");
    assert.notEqual(
      model.viewState.editTripPage.pictures,
      model.data.trips[0].pictures,
      "listen er en kopi, ikke den samme",
    );
  });

  QUnit.test("menyen lukkes", function (assert) {
    resetTest();
    model.viewState.tripViewPage.isMenuOpen = true;

    editTrip(10);

    assert.equal(model.viewState.tripViewPage.isMenuOpen, false, "menyen er lukket");
  });

  QUnit.test("endringene i skjemaet rører ikke turen", function (assert) {
    resetTest();

    editTrip(10);
    model.viewState.editTripPage.title = "Endret";

    assert.equal(model.data.trips[0].title, "Bærtur til Holtet", "turen er uendret");
  });

  QUnit.test("ukjent tur åpner ikke skjemaet", function (assert) {
    resetTest();
    model.app.currentPage = "tripsPage";

    editTrip(999);

    assert.equal(model.app.currentPage, "tripsPage", "vi blir stående");
  });
});

QUnit.module("showNextPictures og showPreviousPictures", function () {
  QUnit.test("turer uten bilder har én tom side", function (assert) {
    resetTest();
    model.viewState.tripViewPage.tripId = 11;

    showNextPictures();

    assert.equal(model.viewState.tripViewPage.pageNumber, 0, "vi blir på første side");
  });

  QUnit.test("ukjent tur endrer ikke siden", function (assert) {
    resetTest();

    showNextPictures();

    assert.equal(model.viewState.tripViewPage.pageNumber, 0, "siden er uendret");
  });
});

QUnit.module("saveNewTrip", function () {
  QUnit.test("manglende tittel gir feilmelding", async function (assert) {
    resetTest();
    model.viewState.newTripPage.date = "2026-05-05";

    await saveNewTrip();

    assert.equal(
      model.viewState.newTripPage.errorMessage,
      "Tittel og dato må være fyllt inn.",
      "errorMessage er satt",
    );
    assert.equal(lastApiCall("POST"), null, "vi lagrer ikke");
  });

  QUnit.test("manglende dato gir feilmelding", async function (assert) {
    resetTest();
    model.viewState.newTripPage.title = "Testtur";

    await saveNewTrip();

    assert.equal(
      model.viewState.newTripPage.errorMessage,
      "Tittel og dato må være fyllt inn.",
      "errorMessage er satt",
    );
  });

  QUnit.test("lager turen og åpner den", async function (assert) {
    resetTest();
    model.viewState.newTripPage.title = "Testtur";
    model.viewState.newTripPage.date = "2026-05-05";

    await saveNewTrip();

    assert.equal(model.data.trips.length, 3, "turen er lagt til");
    assert.equal(model.app.currentPage, "tripViewPage", "vi er på turvisningen");
    assert.equal(
      model.viewState.tripViewPage.tripId,
      model.data.trips[2].id,
      "den nye turen er åpen",
    );
  });

  QUnit.test("mellomrom i tittel og sted er bortfør", async function (assert) {
    resetTest();
    model.viewState.newTripPage.title = "  Testtur  ";
    model.viewState.newTripPage.location = "  Teststed  ";
    model.viewState.newTripPage.date = "2026-05-05";

    await saveNewTrip();

    assert.equal(lastApiCall("POST").body.title, "Testtur", "tittelen er trimmet");
    assert.equal(lastApiCall("POST").body.location, "Teststed", "stedet er trimmet");
  });

  QUnit.test("skjemaet tømmes etter lagring", async function (assert) {
    resetTest();
    model.viewState.newTripPage.title = "Testtur";
    model.viewState.newTripPage.date = "2026-05-05";

    await saveNewTrip();

    assert.equal(model.viewState.newTripPage.title, "", "tittelen er tømt");
    assert.deepEqual(model.viewState.newTripPage.pictures, [], "bildene er tømt");
  });

  QUnit.test("bildene sendes med i samme kall", async function (assert) {
    resetTest();
    model.viewState.newTripPage.title = "Testtur";
    model.viewState.newTripPage.date = "2026-05-05";
    model.viewState.newTripPage.pictures = [1, 3];

    await saveNewTrip();

    assert.deepEqual(lastApiCall("POST").body.pictures, [1, 3], "bildene er sendt med");
  });

  QUnit.test("feil fra serveren vises i skjemaet", async function (assert) {
    resetTest();
    model.viewState.newTripPage.title = "Testtur";
    model.viewState.newTripPage.date = "2026-05-05";
    apiStub.failWith = { status: 400, message: "Bildet finnes ikke." };

    await saveNewTrip();

    assert.equal(
      model.viewState.newTripPage.errorMessage,
      "Bildet finnes ikke.",
      "meldingen vises",
    );
    assert.equal(model.data.trips.length, 2, "turen ble ikke laget");
  });
});

QUnit.module("saveEditedTrip", function () {
  QUnit.test("manglende tittel gir feilmelding", async function (assert) {
    resetTest();
    model.viewState.editTripPage.tripId = 10;
    model.viewState.editTripPage.date = "2026-05-05";

    await saveEditedTrip();

    assert.equal(
      model.viewState.editTripPage.errorMessage,
      "Tittel og dato må være fyllt inn.",
      "errorMessage er satt",
    );
    assert.equal(lastApiCall("PUT"), null, "vi lagrer ikke");
  });

  QUnit.test("endrer den eksisterende turen", async function (assert) {
    resetTest();
    model.viewState.editTripPage.tripId = 10;
    model.viewState.editTripPage.title = "Ny tittel";
    model.viewState.editTripPage.date = "2026-08-15";

    await saveEditedTrip();

    assert.equal(lastApiCall("PUT").path, "/api/trips/10", "vi endret turen");
    assert.equal(model.data.trips[0].title, "Ny tittel", "turen er endret i modellen");
  });

  QUnit.test("turen åpnes etter lagring", async function (assert) {
    resetTest();
    model.viewState.editTripPage.tripId = 10;
    model.viewState.editTripPage.title = "Ny tittel";
    model.viewState.editTripPage.date = "2026-08-15";

    await saveEditedTrip();

    assert.equal(model.app.currentPage, "tripViewPage", "vi er på turvisningen");
    assert.equal(model.viewState.tripViewPage.tripId, 10, "turen er åpen");
  });

  QUnit.test("skjemaet husker ikke turen etter lagring", async function (assert) {
    resetTest();
    model.viewState.editTripPage.tripId = 10;
    model.viewState.editTripPage.title = "Ny tittel";
    model.viewState.editTripPage.date = "2026-08-15";

    await saveEditedTrip();

    assert.equal(model.viewState.editTripPage.tripId, null, "skjemaet har glemt turen");
  });

  QUnit.test("bilder som er fjernet fra skjemaet, sendes bort", async function (assert) {
    resetTest();
    model.viewState.editTripPage.tripId = 10;
    model.viewState.editTripPage.title = "Bærtur til Holtet";
    model.viewState.editTripPage.date = "2026-08-15";
    model.viewState.editTripPage.pictures = [1];

    await saveEditedTrip();

    assert.deepEqual(lastApiCall("PUT").body.pictures, [1], "bare det ene bildet er med");
  });

  QUnit.test("ukjent tur går tilbake til turlisten", async function (assert) {
    resetTest();
    model.viewState.editTripPage.tripId = 999;
    model.viewState.editTripPage.title = "Testtur";
    model.viewState.editTripPage.date = "2026-05-05";

    await saveEditedTrip();

    assert.equal(model.app.currentPage, "tripsPage", "vi går til turlisten");
  });
});

QUnit.module("cancelNewTripForm", function () {
  QUnit.test("tømmer skjemaet og går til turlisten", function (assert) {
    resetTest();
    model.viewState.newTripPage.title = "Testtur";

    cancelNewTripForm();

    assert.equal(model.viewState.newTripPage.title, "", "skjemaet er tømt");
    assert.equal(model.app.currentPage, "tripsPage", "vi går til turlisten");
  });

  QUnit.test("ingen tur blir laget", function (assert) {
    resetTest();

    cancelNewTripForm();

    assert.equal(model.data.trips.length, 2, "turene er uendret");
    assert.equal(lastApiCall("POST"), null, "vi kalte ikke serveren");
  });
});

QUnit.module("cancelEditTripForm", function () {
  QUnit.test("går tilbake til turen vi kom fra", function (assert) {
    resetTest();
    model.viewState.editTripPage.tripId = 10;

    cancelEditTripForm();

    assert.equal(model.app.currentPage, "tripViewPage", "vi er på turvisningen");
    assert.equal(model.viewState.tripViewPage.tripId, 10, "turen er åpen");
  });

  QUnit.test("skjemaet tømmes", function (assert) {
    resetTest();
    model.viewState.editTripPage.tripId = 10;
    model.viewState.editTripPage.title = "Endret";

    cancelEditTripForm();

    assert.equal(model.viewState.editTripPage.title, "", "tittelen er tømt");
    assert.equal(model.viewState.editTripPage.pictures.length, 0, "bildene er tømt");
  });
});

/* ==========================================================================
   Bilder i skjemaene
   ========================================================================== */

QUnit.module("addPictureToForm", function () {
  QUnit.test("nytt bilde på nytturskjemaet", function (assert) {
    resetTest();

    addPictureToForm(model.viewState.newTripPage);

    assert.equal(model.viewState.newTripPage.pictures.length, 1, "ett bilde ble lagt til");
    assert.equal(
      typeof model.viewState.newTripPage.pictures[0],
      "number",
      "bildet er et motiv-id",
    );
  });

  QUnit.test("nytt bilde på redigeringsskjemaet", function (assert) {
    resetTest();

    addPictureToForm(model.viewState.editTripPage);

    assert.equal(model.viewState.editTripPage.pictures.length, 1, "ett bilde ble lagt til");
  });

  QUnit.test("motivene går i runde", function (assert) {
    resetTest();
    const form = model.viewState.newTripPage;

    addPictureToForm(form);
    addPictureToForm(form);
    addPictureToForm(form);
    addPictureToForm(form);

    const templates = model.data.imageTemplates.map((template) => template.id);

    assert.deepEqual(
      form.pictures,
      [templates[0], templates[1], templates[2], templates[0]],
      "motivene går i runde",
    );
  });
});

QUnit.module("removePictureFromForm", function () {
  QUnit.test("bildet fjernes fra skjemaet", function (assert) {
    resetTest();
    const form = model.viewState.newTripPage;

    form.pictures = [1, 2, 3];

    removePictureFromForm(form, 1);

    assert.deepEqual(form.pictures, [1, 3], "bildet i midten er borte");
  });

  QUnit.test("ukjent plassering gjør ingen ting", function (assert) {
    resetTest();
    const form = model.viewState.newTripPage;

    form.pictures = [1, 2];

    removePictureFromForm(form, 7);

    assert.deepEqual(form.pictures, [1, 2], "bildene er uendret");
  });
});

/* ==========================================================================
   Notater
   ========================================================================== */

QUnit.module("saveNote", function () {
  QUnit.test("lager et nytt notat", async function (assert) {
    resetTest();
    model.viewState.newNotePage.title = "Nytt notat";
    model.viewState.newNotePage.date = "2026-09-05";
    model.viewState.newNotePage.topics = [1];

    await saveNote();

    assert.equal(lastApiCall("POST").path, "/api/notes", "vi kalte serveren");
    assert.equal(model.data.notes.length, 2, "notatet er lagt til");
    assert.equal(model.app.currentPage, "noteViewPage", "vi er på notatet");
  });

  QUnit.test("manglende tittel gir feilmelding", async function (assert) {
    resetTest();
    model.viewState.newNotePage.date = "2026-09-05";

    await saveNote();

    assert.equal(
      model.viewState.newNotePage.errorMessage,
      "Tittel og dato må være fyllt inn.",
      "errorMessage er satt",
    );
    assert.equal(lastApiCall("POST"), null, "vi lagrer ikke");
  });

  QUnit.test("endrer et eksisterende notat", async function (assert) {
    resetTest();
    model.viewState.noteViewPage.isEditing = true;
    model.viewState.editNotePage.noteId = 20;
    model.viewState.editNotePage.title = "Ny tittel";
    model.viewState.editNotePage.date = "2026-09-05";

    await saveNote();

    assert.equal(lastApiCall("PUT").path, "/api/notes/20", "vi endret notatet");
    assert.equal(model.data.notes[0].title, "Ny tittel", "notatet er endret");
    assert.equal(model.data.notes.length, 1, "vi har ikke laget et nytt notat");
  });

  QUnit.test("emneknaggene sendes med", async function (assert) {
    resetTest();
    model.viewState.newNotePage.title = "Nytt notat";
    model.viewState.newNotePage.date = "2026-09-05";
    model.viewState.newNotePage.topics = [1, 2];

    await saveNote();

    assert.deepEqual(lastApiCall("POST").body.topics, [1, 2], "emneknaggene er sendt med");
  });

  QUnit.test("skjemaet tømmes etter lagring", async function (assert) {
    resetTest();
    model.viewState.newNotePage.title = "Nytt notat";
    model.viewState.newNotePage.date = "2026-09-05";

    await saveNote();

    assert.equal(model.viewState.newNotePage.title, "", "tittelen er tømt");
    assert.equal(model.viewState.noteViewPage.isEditing, false, "vi er ikke lenger i redigering");
  });
});

QUnit.module("editNote", function () {
  QUnit.test("fyller skjemaet med verdiene fra notatet", function (assert) {
    resetTest();
    model.viewState.noteViewPage.noteId = 20;

    editNote();

    assert.equal(model.viewState.editNotePage.noteId, 20, "notatet er valgt");
    assert.equal(model.viewState.editNotePage.title, "Sesongplanlegging", "tittelen er kopiert");
    assert.equal(model.app.currentPage, "editNotePage", "vi er på skjemaet");
    assert.equal(model.viewState.noteViewPage.isEditing, true, "vi redigerer");
  });

  QUnit.test("endringene rører ikke notatet", function (assert) {
    resetTest();
    model.viewState.noteViewPage.noteId = 20;

    editNote();
    model.viewState.editNotePage.title = "Endret";

    assert.equal(model.data.notes[0].title, "Sesongplanlegging", "notatet er uendret");
  });
});

QUnit.module("toggleTopic", function () {
  QUnit.test("slår en emneknagg av og på", function (assert) {
    resetTest();
    model.viewState.newNotePage.topics = [1];

    toggleTopic(2);
    assert.deepEqual(model.viewState.newNotePage.topics, [1, 2], "emneknaggen er lagt til");

    toggleTopic(1);
    assert.deepEqual(model.viewState.newNotePage.topics, [2], "emneknaggen er tatt bort");
  });
});

QUnit.module("deleteNote", function () {
  QUnit.test("sletter notatet hos serveren", async function (assert) {
    resetTest();
    model.viewState.noteViewPage.noteId = 20;

    await deleteNote();

    assert.equal(lastApiCall("DELETE").path, "/api/notes/20", "vi slettet notatet");
    assert.equal(model.data.notes.length, 0, "notatet er borte");
    assert.equal(model.app.currentPage, "notesPage", "vi går til notatlisten");
  });
});

QUnit.module("duplicateNote", function () {
  QUnit.test("lager en kopi av notatet", async function (assert) {
    resetTest();
    model.viewState.noteViewPage.noteId = 20;

    await duplicateNote();

    assert.equal(model.data.notes.length, 2, "kopien er lagt til");
    assert.equal(lastApiCall("POST").body.title, "Sesongplanlegging (kopi)", "tittelen er kopiert");
    assert.deepEqual(lastApiCall("POST").body.topics, [1], "emneknaggene er kopiert");
  });
});

/* ==========================================================================
   Innstillinger
   ========================================================================== */

QUnit.module("addActivity", function () {
  QUnit.test("tomt navn gir feilmelding", async function (assert) {
    resetTest();
    model.viewState.settingsPage.newActivity = "";

    await addActivity();

    assert.equal(
      model.viewState.settingsPage.errorMessage,
      "Navnet kan ikke være tomt.",
      "errorMessage er satt",
    );
    assert.equal(lastApiCall("POST"), null, "vi lagrer ikke");
  });

  QUnit.test("mellomrom teller som tomt", async function (assert) {
    resetTest();
    model.viewState.settingsPage.newActivity = "   ";

    await addActivity();

    assert.equal(
      model.viewState.settingsPage.errorMessage,
      "Navnet kan ikke være tomt.",
      "errorMessage er satt",
    );
  });

  QUnit.test("null teller som tomt", async function (assert) {
    resetTest();
    model.viewState.settingsPage.newActivity = null;

    await addActivity();

    assert.equal(
      model.viewState.settingsPage.errorMessage,
      "Navnet kan ikke være tomt.",
      "errorMessage er satt",
    );
  });

  QUnit.test("navn som finnes fra før gir feilmelding", async function (assert) {
    resetTest();
    model.viewState.settingsPage.newActivity = "Bærtur";

    await addActivity();

    assert.equal(
      model.viewState.settingsPage.errorMessage,
      "Aktiviteten «Bærtur» finnes allerede.",
      "errorMessage er satt",
    );
    assert.equal(lastApiCall("POST"), null, "vi lagrer ikke");
  });

  QUnit.test("store og små bokstaver regnes som likt", async function (assert) {
    resetTest();
    model.viewState.settingsPage.newActivity = "bærtur";

    await addActivity();

    assert.equal(
      model.viewState.settingsPage.errorMessage,
      "Aktiviteten «bærtur» finnes allerede.",
      "errorMessage er satt",
    );
  });

  QUnit.test("ny aktivitet legges til", async function (assert) {
    resetTest();
    model.viewState.settingsPage.newActivity = "Kajakk";

    await addActivity();

    assert.equal(lastApiCall("POST").path, "/api/settings/activities", "vi kalte serveren");
    assert.equal(model.data.activities.length, 4, "aktiviteten er lagt til");
    assert.equal(model.data.activities[3].activity, "Kajakk", "navnet er riktig");
  });

  QUnit.test("navnet blir trimmet", async function (assert) {
    resetTest();
    model.viewState.settingsPage.newActivity = "  Kajakk  ";

    await addActivity();

    assert.equal(lastApiCall("POST").body.name, "Kajakk", "navnet er trimmet");
  });

  QUnit.test("tidligere feilmelding fjernes", async function (assert) {
    resetTest();
    model.viewState.settingsPage.newActivity = "Bærtur";

    await addActivity();
    assert.notEqual(model.viewState.settingsPage.errorMessage, "", "først er det en feil");

    model.viewState.settingsPage.newActivity = "Kajakk";

    await addActivity();
    assert.equal(model.viewState.settingsPage.errorMessage, "", "meldingen er borte");
  });
});

QUnit.module("removeActivity", function () {
  QUnit.test("sletter aktiviteten hos serveren", async function (assert) {
    resetTest();

    await removeActivity(3);

    assert.equal(
      lastApiCall("DELETE").path,
      "/api/settings/activities/3",
      "vi slettet aktiviteten",
    );
    assert.equal(model.data.activities.length, 2, "aktiviteten er borte");
  });

  QUnit.test("aktivitet i bruk kan ikke slettes", async function (assert) {
    resetTest();

    await removeActivity(1);

    assert.equal(
      model.viewState.settingsPage.errorMessage,
      "Aktiviteten er brukt av en tur, og kan ikke slettes.",
      "meldingen vises",
    );
    assert.equal(model.data.activities.length, 3, "aktiviteten er beholdt");
  });
});

QUnit.module("addTopic", function () {
  QUnit.test("tomt navn gir feilmelding", async function (assert) {
    resetTest();
    model.viewState.settingsPage.newTopic = "";

    await addTopic();

    assert.equal(
      model.viewState.settingsPage.errorMessage,
      "Navnet kan ikke være tomt.",
      "errorMessage er satt",
    );
  });

  QUnit.test("navn som finnes fra før gir feilmelding", async function (assert) {
    resetTest();
    model.viewState.settingsPage.newTopic = "Tips";

    await addTopic();

    assert.equal(
      model.viewState.settingsPage.errorMessage,
      "Emneknaggen «Tips» finnes allerede.",
      "errorMessage er satt",
    );
  });

  QUnit.test("ny emneknagg legges til", async function (assert) {
    resetTest();
    model.viewState.settingsPage.newTopic = "Mål";

    await addTopic();

    assert.equal(lastApiCall("POST").path, "/api/settings/topics", "vi kalte serveren");
    assert.equal(model.data.topics.length, 3, "emneknaggen er lagt til");
  });
});

QUnit.module("removeTopic", function () {
  QUnit.test("sletter emneknaggen hos serveren", async function (assert) {
    resetTest();

    await removeTopic(2);

    assert.equal(lastApiCall("DELETE").path, "/api/settings/topics/2", "vi slettet emneknaggen");
    assert.equal(model.data.topics.length, 1, "emneknaggen er borte");
  });

  QUnit.test("emneknagg i bruk kan ikke slettes", async function (assert) {
    resetTest();

    await removeTopic(1);

    assert.equal(
      model.viewState.settingsPage.errorMessage,
      "Emneknaggen er brukt av et notat, og kan ikke slettes.",
      "meldingen vises",
    );
    assert.equal(model.data.topics.length, 2, "emneknaggen er beholdt");
  });
});

QUnit.module("addCounty", function () {
  QUnit.test("tomt navn gir feilmelding", async function (assert) {
    resetTest();
    model.viewState.settingsPage.newCounty = "";

    await addCounty();

    assert.equal(
      model.viewState.settingsPage.errorMessage,
      "Navnet kan ikke være tomt.",
      "errorMessage er satt",
    );
  });

  QUnit.test("nytt fylke legges til", async function (assert) {
    resetTest();
    model.viewState.settingsPage.newCounty = "Innlandet";

    await addCounty();

    assert.equal(lastApiCall("POST").path, "/api/settings/counties", "vi kalte serveren");
    assert.equal(model.data.counties.length, 4, "fylket er lagt til");
  });
});

QUnit.module("removeCounty", function () {
  QUnit.test("sletter fylket hos serveren", async function (assert) {
    resetTest();

    await removeCounty(3);

    assert.equal(lastApiCall("DELETE").path, "/api/settings/counties/3", "vi slettet fylket");
    assert.equal(model.data.counties.length, 2, "fylket er borte");
  });

  QUnit.test("fylke i bruk kan ikke slettes", async function (assert) {
    resetTest();

    await removeCounty(1);

    assert.equal(
      model.viewState.settingsPage.errorMessage,
      "Fylket er brukt av en tur, og kan ikke slettes.",
      "meldingen vises",
    );
    assert.equal(model.data.counties.length, 3, "fylket er beholdt");
  });
});

/* ==========================================================================
   Søk
   ========================================================================== */

QUnit.module("runSearch", function () {
  QUnit.test("søket tegner siden på nytt", function (assert) {
    resetTest();

    runSearch();

    assert.equal(updateViewCallCount, 1, "siden ble tegnet på nytt");
  });

  QUnit.test("søket rører ikke turene og notatene", function (assert) {
    resetTest();

    const numberOfTrips = model.data.trips.length;
    const numberOfNotes = model.data.notes.length;

    runSearch();

    assert.equal(model.data.trips.length, numberOfTrips, "turene er beholdt");
    assert.equal(model.data.notes.length, numberOfNotes, "notatene er beholdt");
  });
});

QUnit.module("setSearchFilter", function () {
  QUnit.test("tallverdien blir et tall", function (assert) {
    resetTest();

    setSearchFilter("selectedActivity", "2");

    assert.equal(
      model.viewState.searchPage.selectedActivity,
      2,
      "aktiviteten er satt til id 2",
    );
  });

  QUnit.test("tom verdi slår filteret av", function (assert) {
    resetTest();

    setSearchFilter("selectedActivity", "2");
    setSearchFilter("selectedActivity", "");

    assert.equal(
      model.viewState.searchPage.selectedActivity,
      null,
      "filteret er slått av",
    );
  });

  QUnit.test("filteret setter siden på nytt", function (assert) {
    resetTest();

    setSearchFilter("selectedTopic", "1");

    assert.equal(updateViewCallCount, 1, "siden ble tegnet på nytt");
  });
});

QUnit.module("setSearchSeason", function () {
  QUnit.test("sesongen blir satt", function (assert) {
    resetTest();

    setSearchSeason(3);

    assert.equal(model.viewState.searchPage.season, 3, "sesongen er satt");
  });

  QUnit.test("null slår sesongfilteret av", function (assert) {
    resetTest();

    setSearchSeason(3);
    setSearchSeason(null);

    assert.equal(model.viewState.searchPage.season, null, "filteret er slått av");
  });
});

QUnit.module("setSearchSortOrder", function () {
  QUnit.test("sorteringen blir satt", function (assert) {
    resetTest();

    setSearchSortOrder("locationAsc");

    assert.equal(
      model.viewState.searchPage.sortOrder,
      "locationAsc",
      "sorteringen er satt",
    );
  });
});

QUnit.module("getSearchResults", function () {
  QUnit.test("tomt søk gir alle turene og notatene", function (assert) {
    resetTest();

    const results = getSearchResults();

    assert.equal(results.trips.length, 2, "alle turene er med");
    assert.equal(results.notes.length, 1, "alle notatene er med");
  });

  QUnit.test("søkeordet finner turen", function (assert) {
    resetTest();

    model.viewState.searchPage.searchStr = "Holtet";

    const results = getSearchResults();

    assert.equal(results.trips.length, 1, "én tur treff");
    assert.equal(results.trips[0].title, "Bærtur til Holtet", "det er riktig tur");
  });

  QUnit.test("søket er ikke følsomt for store og små bokstaver", function (assert) {
    resetTest();

    model.viewState.searchPage.searchStr = "holtet";

    const results = getSearchResults();

    assert.equal(results.trips.length, 1, "én tur treff");
  });

  QUnit.test("mellomrom i søkeordet ignoreres", function (assert) {
    resetTest();

    model.viewState.searchPage.searchStr = "  Fjellheia  ";

    const results = getSearchResults();

    assert.equal(results.trips.length, 1, "én tur treff");
  });

  QUnit.test("ingen treff gir tom liste", function (assert) {
    resetTest();

    model.viewState.searchPage.searchStr = "ingenting her";

    const results = getSearchResults();

    assert.equal(results.trips.length, 0, "ingen turer");
    assert.equal(results.notes.length, 0, "ingen notater");
  });

  QUnit.test("aktivitetsfilteret fjerner turer", function (assert) {
    resetTest();

    setSearchFilter("selectedActivity", "2");

    const results = getSearchResults();

    assert.equal(results.trips.length, 1, "én tur igjen");
    assert.equal(results.trips[0].title, "Gåtur til Fjellheia", "det er riktig tur");
  });

  QUnit.test("emnefilteret fjerner notater", function (assert) {
    resetTest();

    setSearchFilter("selectedTopic", "2");

    const results = getSearchResults();

    assert.equal(results.notes.length, 0, "ikkeaktt notatet");
  });

  QUnit.test("sesongfilteret fjerner turer", function (assert) {
    resetTest();

    /* Gåturen er i oktober, altså høst (sesong 3). Bærturen er i
       august, altså sommer (sesong 2). */
    setSearchSeason(3);

    const results = getSearchResults();

    assert.equal(results.trips.length, 1, "én tur igjen");
    assert.equal(results.trips[0].title, "Gåtur til Fjellheia", "det er riktig tur");
  });

  QUnit.test("nyeste først er standard", function (assert) {
    resetTest();

    const results = getSearchResults();

    assert.equal(results.trips[0].title, "Gåtur til Fjellheia", "den nyeste først");
  });

  QUnit.test("eldste først snur rekkefølgen", function (assert) {
    resetTest();

    setSearchSortOrder("dateAsc");

    const results = getSearchResults();

    assert.equal(results.trips[0].title, "Bærtur til Holtet", "den eldste først");
  });

  QUnit.test("sortering på sted sorterer etter navn", function (assert) {
    resetTest();

    setSearchSortOrder("locationAsc");

    const results = getSearchResults();

    assert.equal(results.trips[0].location, "Fjellheia", "F før H");
    assert.equal(results.trips[1].location, "Holtet", "H etter F");
  });
});

QUnit.module("hjelpefunksjoner i searchPageController", function () {
  QUnit.test("treffet markeres i teksten", function (assert) {
    resetTest();

    const html = createSearchMatchHtml("Bærtur til Holtet", "Holtet");

    assert.ok(
      html.includes('<span class="match-highlight">Holtet</span>'),
      "treffet er markert",
    );
  });

  QUnit.test("markerer ikke tekst som ikke passer", function (assert) {
    resetTest();

    const html = createSearchMatchHtml("Bærtur til Holtet", "Fjellheia");

    assert.ok(!html.includes("match-highlight"), "ingenting er markert");
  });

  QUnit.test("treffet er markert uansett bokstavstørrelse", function (assert) {
    resetTest();

    const html = createSearchMatchHtml("Bærtur til Holtet", "holtet");

    assert.ok(
      html.includes('<span class="match-highlight">Holtet</span>'),
      "treffet er markert",
    );
  });

  QUnit.test("HTML-tegn rømmes", function (assert) {
    resetTest();

    const html = createSearchMatchHtml("<script>alert(1)</script>", "alert");

    assert.ok(!html.includes("<script>"), "taggen er ikke rå");
    assert.ok(html.includes("&lt;script&gt;"), "taggen er rømt");
  });

  QUnit.test("antall treff skrives på norsk", function (assert) {
    assert.equal(formatHitCount(1, "tur", "turer"), "1 tur funnet", "én tur");
    assert.equal(formatHitCount(3, "tur", "turer"), "3 turer funnet", "flere turer");
    assert.equal(formatHitCount(1, "notat", "notater"), "1 notat funnet", "ett notat");
    assert.equal(formatHitCount(0, "notat", "notater"), "0 notater funnet", "ingen notater");
  });
});

/* ==========================================================================
   Hjelpefunksjoner i settingsPageController
   ========================================================================== */

QUnit.module("hjelpefunksjoner i settingsPageController", function () {
  QUnit.test("getNewName godtar et nytt navn", function (assert) {
    resetTest();

    const name = getNewName(
      "Kajakk",
      model.data.activities,
      "activity",
      "Aktiviteten",
    );

    assert.equal(name, "Kajakk", "navnet er godtatt");
    assert.equal(model.viewState.settingsPage.errorMessage, "", "ingen feilmelding");
  });

  QUnit.test("getNewName avviser et tomt navn", function (assert) {
    resetTest();

    const name = getNewName("", model.data.activities, "activity", "Aktiviteten");

    assert.equal(name, null, "navnet er avvist");
    assert.equal(
      model.viewState.settingsPage.errorMessage,
      "Navnet kan ikke være tomt.",
      "errorMessage er satt",
    );
  });

  QUnit.test("getNewName avviser et navn som finnes fra før", function (assert) {
    resetTest();

    const name = getNewName(
      "Bærtur",
      model.data.activities,
      "activity",
      "Aktiviteten",
    );

    assert.equal(name, null, "navnet er avvist");
    assert.equal(
      model.viewState.settingsPage.errorMessage,
      "Aktiviteten «Bærtur» finnes allerede.",
      "errorMessage er satt",
    );
  });

  QUnit.test("isNameAlreadyUsed ser etter likt navn", function (assert) {
    resetTest();

    assert.equal(
      isNameAlreadyUsed(model.data.activities, "activity", "Bærtur"),
      true,
      "navnet finnes",
    );
    assert.equal(
      isNameAlreadyUsed(model.data.activities, "activity", "bærtur"),
      true,
      "store og små bokstaver regnes som likt",
    );
    assert.equal(
      isNameAlreadyUsed(model.data.activities, "activity", "Kajakk"),
      false,
      "navnet finnes ikke",
    );
  });
});
