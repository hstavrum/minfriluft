/* ==========================================================================
   tripsPageController.js – Controller for turene

   Controller håndterer brukerhandlinger og endrer modellen.
   Controller bygger ikke HTML. Etter hver endring kalles updateView().

   Funksjonene som lagrer eller sletter noe er asynkrone: de venter på
   svar fra serveren før modellen oppdateres og skjemaet tegnes på nytt.

  Funksjoner:
    openTrip(tripId)       // Åpner en eksisterende tur
    startNewTrip()         // Starter et nytt tur-skjema
    toggleTripMenu()       // Viser/skjuler menyen på turvisning
    askDeleteTrip()        // Viser dialog for å slette tur
    cancelDeleteTrip()     // Skjuler dialog for å slette tur
    confirmDeleteTrip()    // Sletter tur og bildene som hører til
    duplicateTrip()        // Lager en kopi av turen og bildene som hører til
    editTrip(tripId)       // Åpner et eksisterende tur-skjema
    showPreviousPictures() // Viser forrige side med bilder
    showNextPictures()     // Viser neste side med bilder
    saveNewTrip()          // Lagrer ny tur
    saveEditedTrip()       // Lagrer endringer på tur
    cancelNewTripForm()    // Avbryter nytt tur-skjema
    cancelEditTripForm()   // Avbryter redigering av tur
    addPictureToNewTripForm()  // Legger til et bilde i nytt tur-skjema
    addPictureToEditTripForm() // Legger til et bilde i rediger tur-skjema
    removePictureFromNewTripForm(index)  // Fjerner et bilde fra nytt tur-skjema
    removePictureFromEditTripForm(index) // Fjerner et bilde fra rediger tur-skjema
    isTripFormValid(form)  // Sjekker om skjemaet er gyldig
    clearTripForm(form)    // Tømmer et skjema, slik at det ikke husker halvutfylte verdier
    addPictureToForm(form) // Legger til et bilde i skjemaet
    getNextTemplateId(pictureCount)        // Henter neste motiv for et bilde, slik at motivene går i runde
    removePictureFromForm(form, index)     // Fjerner et bilde fra skjemaet
    tripPayload(form)      // Gjør et skjema om til det serveren forventer

   ========================================================================== */

function openTrip(tripId) {
  const trip = findObjectById(model.data.trips, tripId);

  if (!trip) {
    return;
  }

  /* Vi lagrer bare id-en av turen i view state. Selve turen
       ligger allerede i model.data.trips. */
  const tripView = model.viewState.tripViewPage;

  tripView.tripId = trip.id;
  tripView.pageNumber = 0;
  tripView.isMenuOpen = false;
  tripView.isDeleteDialogOpen = false;
  tripView.errorMessage = "";

  model.app.currentPage = "tripViewPage";
  updateView();
}

function startNewTrip() {
  clearTripForm(model.viewState.newTripPage);

  model.app.currentPage = "newTripPage";
  updateView();
}

function toggleTripMenu() {
  const tripView = model.viewState.tripViewPage;

  tripView.isMenuOpen = !tripView.isMenuOpen;
  updateView();
}

function askDeleteTrip() {
  const tripView = model.viewState.tripViewPage;

  tripView.isMenuOpen = false;
  tripView.isDeleteDialogOpen = true;
  updateView();
}

function cancelDeleteTrip() {
  const tripView = model.viewState.tripViewPage;

  tripView.isDeleteDialogOpen = false;
  updateView();
}

async function confirmDeleteTrip() {
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

  /* Turen og bildene hører til sammen i databasen, så serveren sletter
     bildene for oss. Her fjerner vi turen fra modellen. */
  const index = findIndexById(model.data.trips, trip.id);

  if (index !== -1) {
    model.data.trips.splice(index, 1);
  }

  tripView.tripId = null;
  tripView.pageNumber = 0;
  tripView.isDeleteDialogOpen = false;
  tripView.errorMessage = "";

  model.app.currentPage = "tripsPage";
  updateView();
}

async function duplicateTrip() {
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
  tripView.pageNumber = 0;
  tripView.isMenuOpen = false;
  tripView.errorMessage = "";

  updateView();
}

function editTrip(tripId) {
  const trip = findObjectById(model.data.trips, tripId);

  if (!trip) {
    return;
  }

  /* Skjemaet er et arbeidsutkast, så vi fyller det med verdiene fra turen, ikke med turen selv. */
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

function showPreviousPictures() {
  const tripView = model.viewState.tripViewPage;
  const trip = findObjectById(model.data.trips, tripView.tripId);

  if (!trip) {
    return;
  }

  const numberOfPages = countPicturePages(trip);

  if (tripView.pageNumber > 0) {
    tripView.pageNumber = tripView.pageNumber - 1;
  }

  /* Holder oss innenfor siste side, selv om noen har
       trykket forrige flere ganger. */
  if (tripView.pageNumber > numberOfPages - 1) {
    tripView.pageNumber = numberOfPages - 1;
  }

  updateView();
}

function showNextPictures() {
  const tripView = model.viewState.tripViewPage;
  const trip = findObjectById(model.data.trips, tripView.tripId);

  if (!trip) {
    return;
  }

  const numberOfPages = countPicturePages(trip);

  if (tripView.pageNumber < numberOfPages - 1) {
    tripView.pageNumber = tripView.pageNumber + 1;
  }

  updateView();
}

/* Gjør et tur-skjema om til det serveren forventer. */
function tripPayload(form) {
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

async function saveNewTrip() {
  const form = model.viewState.newTripPage;

  if (!isTripFormValid(form)) {
    form.errorMessage = "Tittel og dato må være fyllt inn.";
    updateView();
    return;
  }

  let created;

  try {
    created = await api.createTrip(tripPayload(form));
  } catch (error) {
    form.errorMessage = error.message;
    updateView();
    return;
  }

  /* Serveren gir oss turen tilbake, med id og tidsstempel. */
  model.data.trips.push(created.trip);

  clearTripForm(model.viewState.newTripPage);

  /* Vi åpner den nye turen, slik at brukeren ser resultatet. */
  model.viewState.tripViewPage.tripId = created.trip.id;
  model.viewState.tripViewPage.pageNumber = 0;
  model.viewState.tripViewPage.isMenuOpen = false;
  model.viewState.tripViewPage.isDeleteDialogOpen = false;
  model.viewState.tripViewPage.errorMessage = "";

  model.app.currentPage = "tripViewPage";
  updateView();
}

async function saveEditedTrip() {
  const form = model.viewState.editTripPage;

  if (!isTripFormValid(form)) {
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
    updated = await api.updateTrip(trip.id, tripPayload(form));
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

  clearTripForm(model.viewState.editTripPage);

  /* Skjemaet skal ikke huske en tur etter lagring. */
  model.viewState.editTripPage.tripId = null;

  model.viewState.tripViewPage.tripId = trip.id;
  model.viewState.tripViewPage.pageNumber = 0;
  model.viewState.tripViewPage.errorMessage = "";

  model.app.currentPage = "tripViewPage";
  updateView();
}

function cancelNewTripForm() {
  clearTripForm(model.viewState.newTripPage);

  model.app.currentPage = "tripsPage";
  updateView();
}

function cancelEditTripForm() {
  const tripId = model.viewState.editTripPage.tripId;

  clearTripForm(model.viewState.editTripPage);

  /* Vi blir stående på turen vi kom fra, hvis den fortsatt finnes. */
  if (findObjectById(model.data.trips, tripId)) {
    model.viewState.tripViewPage.tripId = tripId;
    model.app.currentPage = "tripViewPage";
  } else {
    model.app.currentPage = "tripsPage";
  }

  updateView();
}

function addPictureToNewTripForm() {
  addPictureToForm(model.viewState.newTripPage);
  updateView();
}

function addPictureToEditTripForm() {
  addPictureToForm(model.viewState.editTripPage);
  updateView();
}

function removePictureFromNewTripForm(index) {
  removePictureFromForm(model.viewState.newTripPage, index);
  updateView();
}

function removePictureFromEditTripForm(index) {
  removePictureFromForm(model.viewState.editTripPage, index);
  updateView();
}

/* Et skjema er gyldig når tittel og dato er fyllt inn. */
function isTripFormValid(form) {
  return form.title.trim() !== "" && form.date !== "" && form.date !== null;
}

/* Tømmer et skjemafelt, slik at et halvutfylt skjema ikke ligger igjen neste gang siden åpnes. */
function clearTripForm(form) {
  form.activityId = null;
  form.title = "";
  form.location = "";
  form.date = "";
  form.countyId = null;
  form.description = "";
  form.pictures = [];
  form.errorMessage = "";
}

/* Legger til et bilde i skjemaet. Vi lagrer bare motivet, og det er
   serveren som gir bildet en plass i rekken. */
function addPictureToForm(form) {
  form.pictures.push(getNextTemplateId(form.pictures.length));
}

/* Motivene går i runde, slik at en tur ikke får samme motiv to ganger på rad. */
function getNextTemplateId(pictureCount) {
  const templates = model.data.imageTemplates;

  return templates[pictureCount % templates.length].id;
}

/* Fjerner ett bilde fra skjemaet. Vi peker på plasseringen i rekken,
   fordi det kan være samme motiv flere ganger på én tur. */
function removePictureFromForm(form, index) {
  if (index < 0 || index >= form.pictures.length) {
    return;
  }

  form.pictures.splice(index, 1);
}
