/* ==========================================================================
   settingsPageController.js – Controller for innstillingssiden.

   Controller håndterer brukerhandlinger og endrer modellen.
   Controller bygger ikke HTML. Etter hver endring kalles updateView().

   Aktiviteter, emneknagger og fylker lagres i API-et. En aktivitet eller
   et fylke som brukes av en tur, og en emneknagg som brukes av et notat,
   kan ikke slettes. Det sjekker serveren, og den gir oss meldingen
   som skal vises.

   Funksjoner:
     addActivity()      // Legger til en ny aktivitet
     removeActivity(id) // Sletter en aktivitet
     addTopic()         // Legger til en ny emneknagg
     removeTopic(id)    // Sletter en emneknagg
     addCounty()        // Legger til et nytt fylke
     removeCounty(id)   // Sletter et fylke
     mobileHandleLogout() // Logger ut

     getNewName(name, list, keyName, label) // sjekker navnet på det som skal legges til
     isNameAlreadyUsed(list, keyName, name) // sjekker om navnet finnes fra før
   ========================================================================== */

async function addActivity() {
  const settings = model.viewState.settingsPage;
  const name = getNewName(
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

async function removeActivity(activityId) {
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

async function addTopic() {
  const settings = model.viewState.settingsPage;
  const name = getNewName(
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

async function removeTopic(topicId) {
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

async function addCounty() {
  const settings = model.viewState.settingsPage;
  const name = getNewName(
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

async function removeCounty(countyId) {
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

/* Logger ut. Serveren sletter sesjonen og fjerner cookien, så neste
   gang appen åpnes er vi ikke logget inn.

   Selv om kallet feiler, går vi tilbake til innloggingen, så brukeren
   ikke blirfanget i en app han ikke kommer ut av. */
async function mobileHandleLogout() {
  try {
    await api.logout();
  } catch {
    /* Serveren er nede. Da fortsetter vi likevel ut av appen. */
  }

  mobileResetModelData();

  const login = model.viewState.loginPage;

  login.userInput = "";
  login.passwordInput = "";
  login.isPasswordVisible = false;
  login.errorMessage = "";

  model.app.user = null;
  model.app.currentPage = "loginPage";
  updateView();
}

/* Sjekker navnet på det som skal legges til. Gir tilbake navnet hvis det er
   bra, eller null hvis navnet er tomt eller finnes fra før. */
function getNewName(name, list, keyName, label) {
  const settings = model.viewState.settingsPage;
  /* Feltet er null helt til brukeren skriver noe, så vi må tåle
     både null og en tom tekst. */
  const trimmedName = name ? name.trim() : "";

  if (trimmedName === "") {
    settings.errorMessage = "Navnet kan ikke være tomt.";
    return null;
  }

  if (isNameAlreadyUsed(list, keyName, trimmedName)) {
    settings.errorMessage = label + " «" + trimmedName + "» finnes allerede.";
    return null;
  }

  settings.errorMessage = "";

  return trimmedName;
}

/* Sjekker om navnet finnes i listen fra før. Vi ser etter likt navn,
   uansett store og små bokstaver. */
function isNameAlreadyUsed(list, keyName, name) {
  const lowerName = name.toLowerCase();

  for (const item of list) {
    if (item[keyName].toLowerCase() === lowerName) {
      return true;
    }
  }

  return false;
}
