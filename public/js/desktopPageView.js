/* ==========================================================================
   desktopPageView.js – View for desktop-utgaven av Min friluft.

   Her ligger ALLE side-views for desktop. Koden for de forskjellige sidene
   bor i samme fil, slik at man kan se hele desktop-appen samlet.

   View leser modellen og lager HTML, men endrer ikke modellen.
   Alle brukerhandlinger går via controller-funksjoner i desktopPageController.js:

     desktopHandleLogin()               – logg inn
     desktopStartNewTrip()              – ny tur
     desktopOpenTrip(tripId)            – åpne en tur
     desktopEditTrip(tripId)            – redigere en tur
     desktopStartNewNote()              – nytt notat
     desktopOpenNote(noteId)            – åpne et notat
     desktopEditNote(noteId)            – redigere et notat
     desktopToggleTopic(topicId, page)  – slå en emneknagg av og på
     goToPage(page)                     – navigasjon i toppmenyen (common.js)
     desktopHandleLogout()              – logger ut (knappen i toppmenyen)

   Modell-state som dette viewet forventer:
     model.app.currentPage            – hvilken side som vises
     model.data.trips                 – turene
     model.data.notes                 – notatene
     model.data.activities            – turtyper
     model.data.topics                – emneknagger
     model.data.counties              – fylker
     model.data.imageTemplates        – motivene bildene er hentet fra
     model.viewState.*                – det brukeren holder på med akkurat nå

   Dataene kommer fra API-et og er hentet av desktopLoadAllData() i
   desktopPageController.js. Et bilde på en tur er en motiv-id, fordi
   serveren lagrer bildene som motiver.

   Funksjoner:
     updateViewDesktopLoginPage()        // innloggingssiden
     updateViewDesktopHomePage()         // forsiden
     updateViewDesktopTripsPage()        // turlisten
     updateViewDesktopTripViewPage()     // turdetaljer
     updateViewDesktopNewTripPage()      // skjema for ny tur
     updateViewDesktopEditTripPage()     // skjema for redigering av tur
     updateViewDesktopTripForm(page, isEdit) // samme skjema for ny tur og redigering
     updateViewDesktopNotesPage()        // notatlisten
     updateViewDesktopNoteViewPage()     // detaljer for et notat
     updateViewDesktopNewNotePage()      // skjema for nytt notat
     updateViewDesktopEditNotePage()     // skjema for redigering av notat
     updateViewDesktopNoteForm(page, isEdit) // samme skjema for nytt notat og redigering
     updateViewDesktopSearchPage()       // søkesiden
     updateViewDesktopSettingsPage()     // innstillingssiden
     createDesktopMobileAppHtml()          // lenken til mobilappen

     createDesktopShellHtml(activeNav, contentHtml) // ramme med toppmeny og innhold
     createDesktopTopbarHtml(activeNav)              // toppmenyen
     createDesktopIconHtml(pathData)                 // et lite ikon
     createDesktopEyeIconHtml(isPasswordVisible)     // øyne-ikonet i innloggingen
     createDesktopLoginErrorHtml(errorMessage)       // feilmeldingen i innloggingen
     createDesktopEmptyHtml(text)                    // tommelding
     createDesktopDialogHtml(title, text, confirmCall, cancelCall) // bekreftelsesdialog
     createDesktopOptionsHtml(list, keyName, selectedId, emptyText) // dropdownene
     createDesktopTripGridHtml(trips, emptyText)     // ruten med turkort
     createDesktopTripCardHtml(trip)                 // et turkort
     createDesktopTripImagesHtml(trip)               // bildene under et turkort
     createDesktopTripListHtml(trips, emptyText, newestFirst) // listen av turer
     createDesktopTripRowHtml(trip)                  // en rad i turlisten
     createDesktopTripMetaHtml(trip)                 // aktivitet, dato og sesong
     createDesktopLocationHtml(trip)                 // sted og fylke
     createDesktopNotesTextHtml(description)         // teksten i en logg
     createDesktopGalleryHtml(pictureIds)            // bildene på en tur
     createDesktopFormPicturesHtml(form, pageName)   // bildene i et tur-skjema
     createDesktopPictureSvgHtml(pictureId)          // et bilde fra modellen
     createDesktopPlanListHtml(trips)                // de planlagte turene
     createDesktopPlanItemHtml(trip)                 // en planlagt tur
     createDesktopTripMenuHtml(isMenuOpen)           // menyen på turvisningen
     createDesktopTripDeleteDialogHtml(trip, isDeleteDialogOpen) // slettedialogen for turer
     createDesktopNoteGridHtml(notes)                // ruten med notatkort
     createDesktopNoteCardHtml(note)                 // et notatkort
     createDesktopTopicTagsHtml(topicIds)            // emneknaggene til et notat
     createDesktopTopicChipsHtml(topicIds, pageName) // emneknaggene i et skjema
     createDesktopNoteMenuHtml(isMenuOpen)           // menyen på notatvisningen
     createDesktopNoteDeleteDialogHtml(note, isDeleteDialogOpen) // slettedialogen for notater
     createDesktopSearchResultHtml(results)          // treffene i søket
     createDesktopSearchSeasonOptionsHtml(selectedSeasonId) // sesongene i søket
     createDesktopSortOptionsHtml(selectedSortOrder) // sorteringen i søket
     createDesktopSettingsSectionHtml(title, chipsHtml, fieldName, placeholder, addCall) // en seksjon i innstillingene
     createDesktopChipListHtml(list, keyName, chipClass, removeCall) // chipene i innstillingene

     desktopGetActiveNav()         // hvilken fane i toppmenyen som er aktiv
     desktopGetPlannedTrips()      // turer som ligger fram i tid
     desktopGetDoneTrips()         // turer som er gjennomført
     desktopIsDateTodayOrLater(date) // er datoen i dag eller senere
     desktopSortTripsByDate(trips, newestFirst) // sortering på dato
     desktopSortItemsByDate(items, newestFirst) // sortering på dato
     desktopSortItemsByTitle(items, keyName)    // sortering på tittel
     desktopCountCounties()        // hvor mange fylker som er besøkt
     desktopGetSearchResults()     // turer og notater som passer søket
     desktopTripMatchesSearch(trip, text, search) // passer en tur søket
     desktopNoteMatchesSearch(note, text, search) // passer et notat søket
   ========================================================================== */

/* 1. Innlogging ============================================================ */

function updateViewDesktopLoginPage() {
  const login = model.viewState.loginPage;

  const html = /*HTML*/ `
    <main class="login-desktop">
        <div class="login-card">
            <div class="login-brand">
                <div class="login-logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M8 3l4 8 5-5 5 15H2L8 3z"></path>
                    </svg>
                </div>
                <h1>Min friluft</h1>                
            </div>

            <form class="login-form" onsubmit="desktopHandleLogin(); return false;">
                <div class="field">
                    <label for="epost">E-post</label>
                    <input
                        class="input"
                        type="email"
                        id="epost"
                        name="epost"
                        placeholder="navn@eksempel.no"
                        autocomplete="email"
                        value="${escapeHtml(login.userInput)}"
                        oninput="model.viewState.loginPage.userInput = this.value;"
                    />
                </div>

                <div class="field">
                    <label for="passord">Passord</label>
                    <div class="password-field">
                        <input
                            class="input"
                            type="${login.isPasswordVisible ? "text" : "password"}"
                            id="passord"
                            name="passord"
                            placeholder="••••••••"
                            autocomplete="current-password"
                            value="${escapeHtml(login.passwordInput)}"
                            oninput="model.viewState.loginPage.passwordInput = this.value;"
                        />
                        <button
                            type="button"
                            class="password-toggle"
                            aria-label="${login.isPasswordVisible ? "Skjul passord" : "Vis passord"}"
                            onclick="desktopTogglePasswordVisibility();"
                        >
                            ${createDesktopEyeIconHtml(login.isPasswordVisible)}
                        </button>
                    </div>
                </div>

                ${createDesktopLoginErrorHtml(login.errorMessage)}

                <button type="submit" class="btn btn-primary login-btn">
                    Logg inn
                </button>
            </form>
        </div>
    </main>
  `;

  document.getElementById("app").innerHTML = html;
}

/* Øynet viser eller skjuler passordet. Hvilket ikon vi skal vise
   avgjøres av model.viewState.loginPage.isPasswordVisible. */
function createDesktopEyeIconHtml(isPasswordVisible) {
  if (isPasswordVisible) {
    return /*HTML*/ `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 10-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
        `;
  }

  return /*HTML*/ `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    `;
}

/* Feilmeldingen vises bare når controlleren har satt en melding i view state. */
function createDesktopLoginErrorHtml(errorMessage) {
  if (!errorMessage) {
    return "";
  }

  return /*HTML*/ `<p class="login-error">${escapeHtml(errorMessage)}</p>`;
}

/* 2. Hjem ================================================================= */

function updateViewDesktopHomePage() {
  const doneTrips = desktopGetDoneTrips();
  const plannedTrips = desktopGetPlannedTrips();

  /* På forsiden viser vi de siste turene, og de planlagte turene som
     kommer først. */
  const recentTrips = desktopSortTripsByDate(doneTrips, true).slice(0, 3);
  const upcomingTrips = desktopSortTripsByDate(plannedTrips, false).slice(0, 4);

  const html = createDesktopShellHtml(
    desktopGetActiveNav(),
    /*HTML*/ `
        <div class="layout">
            <section class="panel">
                <div class="panel-head">
                    <h2>Siste turer</h2>
                    <a href="#" onclick="goToPage('tripsPage');">Se hele loggen →</a>
                </div>
                <div class="panel-body">
                    ${createDesktopTripGridHtml(recentTrips, "Ingen gjennomførte turer ennå.")}
                </div>
            </section>

            <div class="side-column">
                <section class="panel">
                    <div class="panel-head">
                        <h2>Planlagte turer</h2>
                    </div>
                    <div class="panel-body">
                        ${
                          upcomingTrips.length === 0
                            ? createDesktopEmptyHtml(
                                "Ingen planlagte turer ennå.",
                              )
                            : createDesktopPlanListHtml(upcomingTrips)
                        }
                    </div>
                </section>
            </div>
        </div>
    `,
  );

  document.getElementById("app").innerHTML = html;
}

/* 3. Turer ================================================================= */

function updateViewDesktopTripsPage() {
  const plannedTrips = desktopGetPlannedTrips();
  const doneTrips = desktopGetDoneTrips();

  const html = createDesktopShellHtml(
    desktopGetActiveNav(),
    /*HTML*/ `
        <div class="layout layout--halves">
            <section class="panel">
                <div class="panel-head">
                    <h2>Planlagte turer</h2>
                </div>
                <div class="panel-body">
                    ${createDesktopTripListHtml(plannedTrips, "Ingen planlagte turer ennå.", false)}
                </div>
            </section>

            <section class="panel">
                <div class="panel-head">
                    <h2>Siste turer</h2>
                </div>
                <div class="panel-body">
                    ${createDesktopTripListHtml(doneTrips, "Ingen gjennomførte turer ennå.", true)}
                </div>
            </section>
        </div>
    `,
  );

  document.getElementById("app").innerHTML = html;
}

/* Turdetaljer. Viewet vet hvilken tur som er åpen via
   model.viewState.tripViewPage.tripId. */
function updateViewDesktopTripViewPage() {
  const viewState = model.viewState.tripViewPage;
  const trip = findObjectById(model.data.trips, viewState.tripId);

  if (!trip) {
    const notFoundHtml = createDesktopShellHtml(
      desktopGetActiveNav(),
      /*HTML*/ `
            <div class="view-header">
                <div>
                    <h1>Turdetaljer</h1>
                </div>
            </div>
            <section class="panel">
                <div class="panel-body">
                    ${createDesktopEmptyHtml("Fant ikke turen.")}
                </div>
            </section>
        `,
    );

    document.getElementById("app").innerHTML = notFoundHtml;
    return;
  }

  const html = createDesktopShellHtml(
    desktopGetActiveNav(),
    /*HTML*/ `
        <div class="view-header">
            <div>
                <a class="back-link" href="#" onclick="goToPage('tripsPage');">← Alle turer</a>
                <h1>${escapeHtml(trip.title)}</h1>
            </div>
            <div class="row">
                <button class="btn btn-secondary" type="button" onclick="desktopEditTrip(${trip.id});">
                    Rediger
                </button>
                <div class="menu-wrap">
                    <button class="icon-btn" type="button" title="Mer" onclick="desktopToggleTripMenu();">
                        ${createDesktopIconHtml("M12 5h.01M12 12h.01M12 19h.01")}
                    </button>
                    ${createDesktopTripMenuHtml(viewState.isMenuOpen)}
                </div>
            </div>
        </div>

        ${viewState.errorMessage ? /*HTML*/ `<p class="error-text">${escapeHtml(viewState.errorMessage)}</p>` : ""}

        <div class="detail-grid">
            <div class="side-column">
                <section class="panel">
                    <div class="panel-head">
                        <h2>Om turen</h2>
                    </div>
                    <div class="panel-body">
                        ${createDesktopTripMetaHtml(trip)}
                        ${createDesktopLocationHtml(trip)}
                        <h3>Logg</h3>
                        ${createDesktopNotesTextHtml(trip.description)}
                        <p class="note-updated">Sist endret: ${formatDate(trip.updatedAt)}</p>
                    </div>
                </section>
            </div>
            <section class="panel">
                <div class="panel-head">
                    <h2>Bilder</h2>
                </div>
                <div class="panel-body">
                    ${
                      trip.pictures.length === 0
                        ? createDesktopEmptyHtml("Ingen bilder på turen.")
                        : createDesktopGalleryHtml(trip.pictures)
                    }
                </div>
            </section>
        </div>

        ${createDesktopTripDeleteDialogHtml(trip, viewState.isDeleteDialogOpen)}
    `,
  );

  document.getElementById("app").innerHTML = html;
}

/* 4. Skjema for turer ====================================================== */

/* Samme skjema brukes til ny tur og til redigering. Forskjellen er hvilket
   view state vi henter verdiene fra, og hva knappen og toppteksten sier. */
function updateViewDesktopNewTripPage() {
  updateViewDesktopTripForm("newTripPage", false);
}

function updateViewDesktopEditTripPage() {
  updateViewDesktopTripForm("editTripPage", true);
}

function updateViewDesktopTripForm(pageName, isEdit) {
  const form = model.viewState[pageName];
  const cancelCall = isEdit
    ? "desktopCancelTripForm('editTripPage');"
    : "desktopCancelTripForm('newTripPage');";
  const saveCall = isEdit
    ? "desktopSaveEditedTrip();"
    : "desktopSaveNewTrip();";
  const heading = isEdit ? "Rediger tur" : "Ny tur";
  const subheading = isEdit
    ? "Endre informasjonen om turen."
    : "Registrer en ny tur i dagboka.";
  const saveText = isEdit ? "Lagre endring" : "Lagre tur";

  const html = createDesktopShellHtml(
    desktopGetActiveNav(),
    /*HTML*/ `
        <div class="view-header">
            <div>
                <h1>${heading}</h1>
                <p>${subheading}</p>
            </div>
        </div>

        <section class="panel form-panel">
            <div class="panel-body">
                <div class="form-grid">
                    <div class="field">
                        <label for="aktivitet">Aktivitet</label>
                        <select
                            class="select"
                            id="aktivitet"
                            onchange="model.viewState.${pageName}.activityId = this.value ? Number(this.value) : null;"
                        >
                            ${createDesktopOptionsHtml(model.data.activities, "activity", form.activityId, "Velg aktivitet")}
                        </select>
                    </div>

                    <div class="field">
                        <label for="fylke">Fylke</label>
                        <select
                            class="select"
                            id="fylke"
                            onchange="model.viewState.${pageName}.countyId = this.value ? Number(this.value) : null;"
                        >
                            ${createDesktopOptionsHtml(model.data.counties, "county", form.countyId, "Velg fylke")}
                        </select>
                    </div>

                    <div class="field field--wide">
                        <label for="tittel">Tittel</label>
                        <input
                            class="input"
                            type="text"
                            id="tittel"
                            placeholder="f.eks. Skitur til Prekestolen"
                            value="${escapeHtml(form.title)}"
                            oninput="model.viewState.${pageName}.title = this.value;"
                        />
                    </div>

                    <div class="field">
                        <label for="sted">Sted</label>
                        <input
                            class="input"
                            type="text"
                            id="sted"
                            placeholder="f.eks. Prekestolen, Ryfylke"
                            value="${escapeHtml(form.location)}"
                            oninput="model.viewState.${pageName}.location = this.value;"
                        />
                    </div>

                    <div class="field">
                        <label for="dato">Dato</label>
                        <input
                            class="input"
                            type="date"
                            id="dato"
                            value="${form.date ? form.date : ""}"
                            onchange="model.viewState.${pageName}.date = this.value;"
                        />
                    </div>

                    <div class="field field--wide">
                        <label>Bilder</label>
                        ${createDesktopFormPicturesHtml(form, pageName)}
                    </div>

                    <div class="field field--wide">
                        <label for="logg">Logg</label>
                        <textarea
                            class="textarea"
                            id="logg"
                            rows="6"
                            placeholder="Skriv refleksjoner, observasjoner eller minner fra turen..."
                            oninput="model.viewState.${pageName}.description = this.value;"
                        >${escapeHtml(form.description)}</textarea>
                    </div>
                </div>

                ${form.errorMessage ? /*HTML*/ `<p class="error-text">${escapeHtml(form.errorMessage)}</p>` : ""}
            </div>

            <div class="panel-foot">
                <button class="btn btn-secondary" type="button" onclick="${cancelCall}">
                    Avbryt
                </button>
                <button class="btn btn-primary" type="button" onclick="${saveCall}">
                    ${saveText}
                </button>
            </div>
        </section>
    `,
  );

  document.getElementById("app").innerHTML = html;
}

/* 5. Notater ============================================================== */

function updateViewDesktopNotesPage() {
  const notes = desktopSortItemsByTitle(model.data.notes, "title");

  const html = createDesktopShellHtml(
    desktopGetActiveNav(),
    /*HTML*/ `
        <div class="view-header">
            <div>
                <h1>Notater</h1>
                <p>Planer, tanker og refleksjoner fra dagboka.</p>
            </div>
        </div>

        <section class="panel">
            <div class="panel-body">
                ${
                  notes.length === 0
                    ? createDesktopEmptyHtml("Ingen notater ennå.")
                    : createDesktopNoteGridHtml(notes)
                }
            </div>
        </section>
    `,
  );

  document.getElementById("app").innerHTML = html;
}

/* Detaljvisning av et notat. */
function updateViewDesktopNoteViewPage() {
  const viewState = model.viewState.noteViewPage;
  const note = findObjectById(model.data.notes, viewState.noteId);

  if (!note) {
    const notFoundHtml = createDesktopShellHtml(
      desktopGetActiveNav(),
      /*HTML*/ `
            <div class="view-header">
                <div>
                    <h1>Notat</h1>
                </div>
            </div>
            <section class="panel">
                <div class="panel-body">
                    ${createDesktopEmptyHtml("Fant ikke notatet.")}
                </div>
            </section>
        `,
    );

    document.getElementById("app").innerHTML = notFoundHtml;
    return;
  }

  const html = createDesktopShellHtml(
    desktopGetActiveNav(),
    /*HTML*/ `
        <div class="view-header">
            <div>
                <a class="back-link" href="#" onclick="goToPage('notesPage');">← Alle notater</a>
                <h1>${escapeHtml(note.title)}</h1>
            </div>
            <div class="row">
                <button class="btn btn-secondary" type="button" onclick="desktopEditNote(${note.id});">
                    Rediger
                </button>
                <div class="menu-wrap">
                    <button class="icon-btn" type="button" title="Mer" onclick="desktopToggleNoteMenu();">
                        ${createDesktopIconHtml("M12 5h.01M12 12h.01M12 19h.01")}
                    </button>
                    ${createDesktopNoteMenuHtml(viewState.isMenuOpen)}
                </div>
            </div>
        </div>

        ${viewState.errorMessage ? /*HTML*/ `<p class="error-text">${escapeHtml(viewState.errorMessage)}</p>` : ""}

        <div class="detail-grid">
            <section class="panel">
                <div class="panel-body">
                    <p class="note-detail-text">${escapeHtml(note.description)}</p>
                    <div class="tag-row">
                        ${createDesktopTopicTagsHtml(note.topics)}
                    </div>
                </div>
            </section>

            <div class="side-column">
                <section class="panel">
                    <div class="panel-head">
                        <h2>Om notatet</h2>
                    </div>
                    <div class="panel-body">
                        <div class="trip-meta">
                            <span class="meta-chip">
                                ${createDesktopIconHtml("M3 4h18v18H3zM16 2v4M8 2v4M3 10h18")}
                                ${formatDate(note.date)}
                            </span>
                        </div>
                        <p class="note-updated">Sist oppdatert: ${formatDate(note.updatedAt)}</p>
                    </div>
                </section>
            </div>
        </div>

        ${createDesktopNoteDeleteDialogHtml(note, viewState.isDeleteDialogOpen)}
    `,
  );

  document.getElementById("app").innerHTML = html;
}

/* 6. Skjema for notater ==================================================== */

/* Samme skjema brukes til nytt notat og til redigering. Datoen kommer fra
   controlleren, som også tømmer skjemaet. Viewet bare leser verdiene. */
function updateViewDesktopNewNotePage() {
  updateViewDesktopNoteForm("newNotePage", false);
}

function updateViewDesktopEditNotePage() {
  updateViewDesktopNoteForm("editNotePage", true);
}

function updateViewDesktopNoteForm(pageName, isEdit) {
  const form = model.viewState[pageName];
  const cancelCall = isEdit
    ? "desktopCancelNoteForm('editNotePage');"
    : "desktopCancelNoteForm('newNotePage');";
  const saveCall = isEdit
    ? "desktopSaveEditedNote();"
    : "desktopSaveNewNote();";
  const heading = isEdit ? "Rediger notat" : "Nytt notat";
  const subheading = isEdit
    ? "Endre notatet."
    : "Skriv ned en tanke, en plan eller en refleksjon.";
  const saveText = isEdit ? "Lagre endring" : "Lagre notat";

  const html = createDesktopShellHtml(
    desktopGetActiveNav(),
    /*HTML*/ `
        <div class="view-header">
            <div>
                <h1>${heading}</h1>
                <p>${subheading}</p>
            </div>
        </div>

        <section class="panel form-panel">
            <div class="panel-body">
                <div class="form-grid">
                    <div class="field field--wide">
                        <label for="notatTittel">Tittel</label>
                        <input
                            class="input"
                            type="text"
                            id="notatTittel"
                            placeholder="f.eks. Sesongplanlegging vinter 2027"
                            value="${escapeHtml(form.title)}"
                            oninput="model.viewState.${pageName}.title = this.value;"
                        />
                    </div>

                    <div class="field">
                        <label for="notatDato">Dato</label>
                        <input
                            class="input"
                            type="date"
                            id="notatDato"
                            value="${form.date ? form.date : ""}"
                            onchange="model.viewState.${pageName}.date = this.value;"
                        />
                    </div>

                    <div class="field">
                        <label>Emneknagger</label>
                        ${createDesktopTopicChipsHtml(form.topics, pageName)}
                    </div>

                    <div class="field field--wide">
                        <label for="notatTekst">Notat</label>
                        <textarea
                            class="textarea"
                            id="notatTekst"
                            rows="10"
                            placeholder="Skriv dine tanker, refleksjoner eller planer her..."
                            oninput="model.viewState.${pageName}.description = this.value;"
                        >${escapeHtml(form.description)}</textarea>
                    </div>
                </div>

                ${form.errorMessage ? /*HTML*/ `<p class="error-text">${escapeHtml(form.errorMessage)}</p>` : ""}
            </div>

            <div class="panel-foot">
                <button class="btn btn-secondary" type="button" onclick="${cancelCall}">
                    Avbryt
                </button>
                <button class="btn btn-primary" type="button" onclick="${saveCall}">
                    ${saveText}
                </button>
            </div>
        </section>
    `,
  );

  document.getElementById("app").innerHTML = html;
}

/* 7. Søk ================================================================== */

function updateViewDesktopSearchPage() {
  const search = model.viewState.searchPage;
  const results = desktopGetSearchResults();
  const numberOfHits = results.trips.length + results.notes.length;

  const html = createDesktopShellHtml(
    desktopGetActiveNav(),
    /*HTML*/ `
        <div class="view-header">
            <div>
                <h1>Søk</h1>
                <p>Finn turer og notater i dagboka.</p>
            </div>
        </div>

        <div class="search-layout">
            <aside class="panel filter-panel">
                <div class="panel-head">
                    <h2>Filtre</h2>
                </div>
                <div class="panel-body">
                    <div class="field">
                        <label for="soketekst">Søkeord</label>
                        <input
                            class="input"
                            type="search"
                            id="soketekst"
                            placeholder="Søk i titler og noter"
                            value="${escapeHtml(search.searchStr)}"
                            oninput="model.viewState.searchPage.searchStr = this.value;"
                            onkeydown="if (event.key === 'Enter') { desktopRunSearch(); }"
                        />
                    </div>

                    <div class="field">
                        <label for="sokAktivitet">Aktivitet</label>
                        <select
                            class="select"
                            id="sokAktivitet"
                            onchange="desktopSetSearchFilter('selectedActivity', this.value);"
                        >
                            ${createDesktopOptionsHtml(
                              model.data.activities,
                              "activity",
                              search.selectedActivity,
                              "Alle aktiviteter",
                            )}
                        </select>
                    </div>

                    <div class="field">
                        <label for="sokEmne">Emneknagg</label>
                        <select
                            class="select"
                            id="sokEmne"
                            onchange="desktopSetSearchFilter('selectedTopic', this.value);"
                        >
                            ${createDesktopOptionsHtml(
                              model.data.topics,
                              "topic",
                              search.selectedTopic,
                              "Alle emneknagger",
                            )}
                        </select>
                    </div>

                    <div class="field">
                        <label for="sokSesong">Sesong</label>
                        <select
                            class="select"
                            id="sokSesong"
                            onchange="desktopSetSearchFilter('season', this.value);"
                        >
                            ${createDesktopSearchSeasonOptionsHtml(search.season)}
                        </select>
                    </div>

                    <div class="field">
                        <label for="sokSortering">Sortering</label>
                        <select
                            class="select"
                            id="sokSortering"
                            onchange="desktopSetSortOrder(this.value);"
                        >
                            ${createDesktopSortOptionsHtml(search.sortOrder)}
                        </select>
                    </div>

                    <button class="btn btn-primary" type="button" onclick="desktopRunSearch();">
                        Søk
                    </button>
                </div>
            </aside>

            <section class="panel">
                <div class="panel-head">
                    <h2>Treff</h2>
                    <p class="search-summary">${numberOfHits} treff</p>
                </div>
                <div class="panel-body">
                    ${
                      numberOfHits === 0
                        ? createDesktopEmptyHtml(
                            "Ingen treff. Prøv et annet søkeord.",
                          )
                        : createDesktopSearchResultHtml(results)
                    }
                </div>
            </section>
        </div>
    `,
  );

  document.getElementById("app").innerHTML = html;
}

/* 8. Innstillinger ========================================================= */

/* Lenken til mobilappen. Den ligger i en egen adresse, så den virker
   uansett hvordan webserveren er satt opp. */
function createDesktopMobileAppHtml() {
  return /*HTML*/ `
    <div class="panel">
        <div class="panel-head">
            <h2>Mobilappen</h2>
        </div>
        <div class="panel-body">
            <p>
                Har du en telefon? Åpne adressen under på telefonen, og
                legg appen på hjemskjermen. Den bruker de samme turene
                og notatene som her.
            </p>
            <a class="btn btn-secondary" href="/index.html" target="_blank" rel="noopener">
                Åpne mobilappen
            </a>
        </div>
    </div>
  `;
}

function updateViewDesktopSettingsPage() {
  const doneTrips = desktopGetDoneTrips();
  const plannedTrips = desktopGetPlannedTrips();

  const settings = model.viewState.settingsPage;

  const html = createDesktopShellHtml(
    desktopGetActiveNav(),
    /*HTML*/ `
        <div class="view-header">
            <div>
                <h1>Innstillinger</h1>
                <p>Her bestemmer du hvilke turtyper, emneknagger og fylker du har.</p>
            </div>
        </div>

        ${settings.errorMessage ? /*HTML*/ `<p class="error-text">${escapeHtml(settings.errorMessage)}</p>` : ""}

        <div class="settings-grid">
            ${createDesktopSettingsSectionHtml(
              "Aktiviteter",
              createDesktopChipListHtml(
                model.data.activities,
                "activity",
                "chip-type",
                "desktopRemoveActivity",
              ),
              "newActivity",
              "Ny turtype…",
              "desktopAddActivity();",
            )}

            ${createDesktopSettingsSectionHtml(
              "Emneknagger",
              createDesktopChipListHtml(
                model.data.topics,
                "topic",
                "chip-tag",
                "desktopRemoveTopic",
              ),
              "newTopic",
              "Ny emneknagg…",
              "desktopAddTopic();",
            )}

            ${createDesktopSettingsSectionHtml(
              "Fylker",
              createDesktopChipListHtml(
                model.data.counties,
                "county",
                "chip-county",
                "desktopRemoveCounty",
              ),
              "newCounty",
              "Nytt fylke…",
              "desktopAddCounty();",
            )}
        </div>

        ${createDesktopMobileAppHtml()}

        <div class="view-header">
            <div>
                <h1><br>Statistikk</h1>
                <section class="stats">
                    <div class="stat">
                        <div class="value">${model.data.trips.length}</div>
                        <div class="label">Registrerte turer</div>
                    </div>
                    <div class="stat">
                        <div class="value">${model.data.notes.length}</div>
                        <div class="label">Notater</div>
                    </div>
                    <div class="stat">
                        <div class="value">${desktopCountCounties()}</div>
                        <div class="label">Fylker besøkt</div>
                    </div>
                    <div class="stat">
                        <div class="value">${plannedTrips.length}</div>
                        <div class="label">Planlagte turer</div>
                    </div>
                </section>
            </div>
        </div>        
    `,
  );

  document.getElementById("app").innerHTML = html;
}

/* ==========================================================================
   Hjelpere for oppsettet
   ========================================================================== */

/* Rammen rundt alle sidene: toppmeny og innhold. */
function createDesktopShellHtml(activeNav, contentHtml) {
  return /*HTML*/ `
    <div class="app-frame">
        ${createDesktopTopbarHtml(activeNav)}

        <main class="view">
            ${contentHtml}
        </main>
    </div>
  `;
}

/* Toppmenyen. activeNav avgjør hvilken fane som er valgt. */
function createDesktopTopbarHtml(activeNav) {
  return /*HTML*/ `
        <header class="topbar">
            <a class="brand ${activeNav === "home" ? "active" : ""}" href="#" onclick="goToPage('homePage');">
                ${createDesktopIconHtml("M3 20l7-14 4 7 3-3 4 10z")}
                Min friluft
            </a>

            <nav class="topnav">
                <a class="${activeNav === "trips" ? "active" : ""}" href="#" onclick="goToPage('tripsPage');">
                    Turer
                </a>
                <a class="${activeNav === "notes" ? "active" : ""}" href="#" onclick="goToPage('notesPage');">
                    Notater
                </a>
                <a class="${activeNav === "search" ? "active" : ""}" href="#" onclick="goToPage('searchPage');">
                    Søk
                </a>                
                <a class="${activeNav === "settings" ? "active" : ""}" href="#" onclick="goToPage('settingsPage');">
                    Innstillinger
                </a>
            </nav>

            <div class="topbar-right">
                <button class="btn btn-primary btn-new" type="button" onclick="desktopStartNewTrip();">
                    Ny tur
                </button>
                <button class="btn btn-primary btn-new" type="button" onclick="desktopStartNewNote();">
                    Nytt notat
                </button>                
                <button class="icon-btn" type="button" title="Logg ut" aria-label="Logg ut" onclick="desktopHandleLogout();">
                    ${createDesktopIconHtml("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9")}
                </button>
            </div>
        </header>
    `;
}

/* Hvilken fane i toppmenyen som er aktiv, ut fra hvilken side vi er på. */
function desktopGetActiveNav() {
  const page = model.app.currentPage;

  if (page === "homePage") {
    return "home";
  }

  if (
    page === "tripsPage" ||
    page === "tripViewPage" ||
    page === "newTripPage" ||
    page === "editTripPage"
  ) {
    return "trips";
  }

  if (
    page === "notesPage" ||
    page === "noteViewPage" ||
    page === "newNotePage" ||
    page === "editNotePage"
  ) {
    return "notes";
  }

  if (page === "searchPage") {
    return "search";
  }

  if (page === "settingsPage") {
    return "settings";
  }

  return "";
}

/* Et lite ikon. Vi skriver stien som en streng, slik at alle ikonene
   har samme strek og samme størrelse. */
function createDesktopIconHtml(pathData) {
  return /*HTML*/ `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="${pathData}"></path>
        </svg>
    `;
}

/* Bildene fra modellen er kvadratiske (100 x 100), mens rutene på desktop
   er brede. Derfor sier vi at bildet skal fylle ruten og klippes, slik at
   det ikke får hvite striper på siden.

   Et bilde i desktop-utgaven er en motiv-id, fordi serveren lagrer
   bildene som motiver. Motivet finner vi i model.data.imageTemplates. */
function createDesktopPictureSvgHtml(templateId) {
  const template = findObjectById(model.data.imageTemplates, templateId);

  if (!template) {
    return "";
  }

  return template.svg.replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ');
}

/* Navnet på bildet. Det er motivet i model.data.imageTemplates som
   gir navnet, så bildet selv har ikke noe navn. */
function getDesktopPictureLabel(templateId) {
  const template = findObjectById(model.data.imageTemplates, templateId);

  if (template) {
    return template.label;
  }

  return "Bilde";
}

/* ==========================================================================
   Hjelpere for turene
   ========================================================================== */

/* Ruten med turkort. */
function createDesktopTripGridHtml(trips, emptyText) {
  if (trips.length === 0) {
    return createDesktopEmptyHtml(emptyText);
  }

  let html = /*HTML*/ `<div class="trip-grid">`;

  for (const trip of trips) {
    html += createDesktopTripCardHtml(trip);
  }

  html += "</div>";

  return html;
}

/* Ett turkort. Aktivitet, fylke og bilder hentes med id fra modellen. */
function createDesktopTripCardHtml(trip) {
  const activityName = getActivityName(trip.activityId);
  const countyName = getCountyName(trip.countyId);
  const preview = createPreview(trip.description);

  let html = /*HTML*/ `
        <button class="trip-card" type="button" onclick="desktopOpenTrip(${trip.id});">
            <div class="trip-card-header">
                <span class="trip-type">${escapeHtml(activityName)}</span>
                <span class="trip-date">${formatDate(trip.date)}</span>
            </div>

            <h3>${escapeHtml(trip.title)}</h3>

            <p class="location">
                ${createDesktopIconHtml("M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM15 10a3 3 0 11-6 0 3 3 0 016 0z")}
                ${escapeHtml(trip.location)}, ${escapeHtml(countyName)}
            </p>
    `;

  if (trip.pictures.length > 0) {
    html += /*HTML*/ `
            <div class="trip-images">
                ${createDesktopTripImagesHtml(trip)}
            </div>
        `;
  }

  if (preview) {
    html += /*HTML*/ `<p class="trip-preview">${escapeHtml(preview)}</p>`;
  }

  html += /*HTML*/ `
            <div class="card-meta">
                <span class="tag">#${escapeHtml(getSeasonName(trip.date).toLowerCase())}</span>
                <span class="open-hint">Åpne tur →</span>
            </div>
        </button>
    `;

  return html;
}

/* Bildeplass-holderne under et turkort. Bildene ligger i turens
   pictures-liste, og er motiv-id-er. */
function createDesktopTripImagesHtml(trip) {
  let html = "";

  for (const templateId of trip.pictures) {
    html += /*HTML*/ `
            <div class="img-placeholder" title="${escapeHtml(getDesktopPictureLabel(templateId))}">
                ${createDesktopPictureSvgHtml(templateId)}
            </div>
        `;
  }

  return html;
}

/* Listene på tur-siden: planlagte turer og siste turer. */
function createDesktopTripListHtml(trips, emptyText, newestFirst) {
  if (trips.length === 0) {
    return createDesktopEmptyHtml(emptyText);
  }

  const sortedTrips = desktopSortTripsByDate(trips, newestFirst);

  let html = /*HTML*/ `<div class="list">`;

  for (const trip of sortedTrips) {
    html += createDesktopTripRowHtml(trip);
  }

  html += "</div>";

  return html;
}

/* En rad i turlisten. */
function createDesktopTripRowHtml(trip) {
  const activityName = getActivityName(trip.activityId);
  const countyName = getCountyName(trip.countyId);
  const isPlanned = desktopIsDateTodayOrLater(trip.date);

  const badge = isPlanned
    ? /*HTML*/ `<span class="badge badge--planlagt">Planlagt</span>`
    : /*HTML*/ `<span class="badge badge--gjort">Gjennomført</span>`;

  const thumbnail =
    trip.pictures.length > 0
      ? /*HTML*/ `<div class="list-row-thumb">${createDesktopPictureSvgHtml(trip.pictures[0])}</div>`
      : /*HTML*/ `<div class="list-row-thumb">
            <span class="thumb-icon">${createDesktopIconHtml("M3 20l7-14 4 7 3-3 4 10z")}</span>
        </div>`;

  return /*HTML*/ `
        <button class="list-row" type="button" onclick="desktopOpenTrip(${trip.id});">
            ${thumbnail}

            <div class="list-row-main">
                <span class="trip-type">${escapeHtml(activityName)}</span>
                <p class="list-row-title">${escapeHtml(trip.title)}</p>
                <p class="location">
                    ${createDesktopIconHtml("M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM15 10a3 3 0 11-6 0 3 3 0 016 0z")}
                    ${escapeHtml(trip.location)}, ${escapeHtml(countyName)}
                </p>
            </div>

            <div class="list-row-side">
                <span class="trip-date">${formatDate(trip.date)}</span>
                ${badge}
            </div>
        </button>
    `;
}

/* De planlagte turene i høydekolonnen på hjem-siden. */
function createDesktopPlanListHtml(trips) {
  let html = "";

  for (const trip of trips) {
    html += createDesktopPlanItemHtml(trip);
  }

  return html;
}

/* En planlagt tur, med datoen i en firkant. */
function createDesktopPlanItemHtml(trip) {
  const activityName = getActivityName(trip.activityId);
  const countyName = getCountyName(trip.countyId);
  const date = new Date(trip.date);

  const dayText = date.getDate();
  const monthText = date.toLocaleDateString("nb-NO", { month: "short" });

  return /*HTML*/ `
        <button class="plan-item" type="button" onclick="desktopOpenTrip(${trip.id});">
            <div class="plan-date">
                <span class="d">${dayText}</span>
                <span class="m">${escapeHtml(monthText)}</span>
            </div>
            <div class="plan-info">
                <p class="plan-title">${escapeHtml(trip.title)}</p>
                <p class="plan-sub">${escapeHtml(activityName)} · ${escapeHtml(trip.location)}, ${escapeHtml(countyName)}</p>
            </div>
        </button>
    `;
}

/* Aktivitet, dato og sesong. */
function createDesktopTripMetaHtml(trip) {
  const activityName = getActivityName(trip.activityId);
  const dateText = formatDate(trip.date);
  const seasonName = getSeasonName(trip.date);

  return /*HTML*/ `
        <div class="trip-meta">
            <span class="meta-chip">
                ${createDesktopIconHtml("M14 4v10.54a4 4 0 11-4 0V4a2 2 0 014 0z")}
                ${escapeHtml(activityName)}
            </span>

            <span class="meta-chip">
                ${createDesktopIconHtml("M3 4h18v18H3zM16 2v4M8 2v4M3 10h18")}
                ${dateText}
            </span>

            <span class="meta-chip">${escapeHtml(seasonName)}</span>
        </div>
    `;
}

/* Sted og fylke. */
function createDesktopLocationHtml(trip) {
  const countyName = getCountyName(trip.countyId);

  return /*HTML*/ `
        <p class="location-row">
            ${createDesktopIconHtml("M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM15 10a3 3 0 11-6 0 3 3 0 016 0z")}
            ${escapeHtml(trip.location)}, ${escapeHtml(countyName)}
        </p>
    `;
}

/* Loggen er delt i avsnitt med en tom linje mellom. */
function createDesktopNotesTextHtml(description) {
  if (!description) {
    return createDesktopEmptyHtml("Ingen notater på turen.");
  }

  const paragraphs = description.split("\n\n");
  let html = "";

  for (const paragraph of paragraphs) {
    const text = paragraph.trim();

    if (text !== "") {
      html += /*HTML*/ `<p class="notes-text">${escapeHtml(text)}</p>`;
    }
  }

  return html;
}

/* Bildene på en tur, i et rutenett. */
function createDesktopGalleryHtml(pictureIds) {
  let html = /*HTML*/ `<div class="gallery-grid">`;

  for (const templateId of pictureIds) {
    html += /*HTML*/ `
            <div class="gallery-img" title="${escapeHtml(getDesktopPictureLabel(templateId))}">
                ${createDesktopPictureSvgHtml(templateId)}
            </div>
        `;
  }

  html += "</div>";

  return html;
}

/* Bildene i skjemaet for en tur, pluss en knapp som legger til et nytt bilde.
   Opplastingen er simulert: vi velger et ferdig motiv fra
   model.data.imageTemplates. */
function createDesktopFormPicturesHtml(form, pageName) {
  let html = /*HTML*/ `<div class="gallery-grid">`;

  form.pictures.forEach((templateId, index) => {
    html += /*HTML*/ `
            <div class="gallery-img" title="${escapeHtml(getDesktopPictureLabel(templateId))}">
                ${createDesktopPictureSvgHtml(templateId)}
                <button
                    class="gallery-img-remove"
                    type="button"
                    title="Fjern bildet"
                    onclick="desktopRemovePictureFromTripForm(${index}, '${pageName}');"
                >&times;</button>
            </div>
        `;
  });

  html += /*HTML*/ `
            <button class="gallery-add" type="button" onclick="desktopAddPictureToTripForm('${pageName}');">
                ${createDesktopIconHtml("M3 3h18v18H3zM10 8.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM21 15l-5-5L5 21")}
                <span>Legg til bilde</span>
            </button>
        </div>
    `;

  return html;
}

/* Overleggsmenyen med Dupliser og Slett. Den er lukket med hidden-attributtet. */
function createDesktopTripMenuHtml(isMenuOpen) {
  return /*HTML*/ `
        <div class="menu" ${isMenuOpen ? "" : "hidden"}>
            <button class="menu-item" type="button" onclick="desktopDuplicateTrip();">
                ${createDesktopIconHtml("M9 9h13v13H9zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1")}
                Dupliser tur
            </button>

            <div class="menu-divider"></div>

            <button class="menu-item danger" type="button" onclick="desktopAskDeleteTrip();">
                ${createDesktopIconHtml("M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2")}
                Slett tur
            </button>
        </div>
    `;
}

/* Bekreftelsesdialogen. Den tegnes bare når controlleren har slått den på. */
function createDesktopTripDeleteDialogHtml(trip, isDeleteDialogOpen) {
  if (!isDeleteDialogOpen) {
    return /*HTML*/ `<div class="dialog-backdrop" hidden></div>`;
  }

  return createDesktopDialogHtml(
    "Slette turen?",
    `«${trip.title}» blir permanent slettet. Dette kan ikke angres.`,
    "desktopConfirmDeleteTrip();",
    "desktopCancelDeleteTrip();",
  );
}

/* ==========================================================================
   Hjelpere for notatene
   ========================================================================== */

/* Ruten med notatkort. */
function createDesktopNoteGridHtml(notes) {
  let html = /*HTML*/ `<div class="note-grid">`;

  for (const note of notes) {
    html += createDesktopNoteCardHtml(note);
  }

  html += "</div>";

  return html;
}

/* Ett notatkort. */
function createDesktopNoteCardHtml(note) {
  const preview = createPreview(note.description);

  return /*HTML*/ `
        <button class="note-card" type="button" onclick="desktopOpenNote(${note.id});">
            <div class="note-card-head">
                <span class="note-date">${formatDate(note.date)}</span>
            </div>

            <h2>${escapeHtml(note.title)}</h2>

            <p>${escapeHtml(preview)}</p>

            <div class="tag-row">
                ${createDesktopTopicTagsHtml(note.topics)}
            </div>
        </button>
    `;
}

/* Emneknaggene til et notat, som merker. */
function createDesktopTopicTagsHtml(topicIds) {
  let html = "";

  for (const topicId of topicIds) {
    const topic = findObjectById(model.data.topics, topicId);

    if (!topic) {
      continue;
    }

    html += /*HTML*/ `<span class="tag">${escapeHtml(topic.topic)}</span>`;
  }

  return html;
}

/* Emneknaggene i et skjema. Vi kan trykke på dem for å slå dem av og på. */
function createDesktopTopicChipsHtml(topicIds, pageName) {
  let html = /*HTML*/ `<div class="tag-chips">`;

  for (const topic of model.data.topics) {
    const isSelected = topicIds.includes(topic.id);

    html += /*HTML*/ `
            <button
                class="chip ${isSelected ? "selected" : ""}"
                type="button"
                onclick="desktopToggleTopic(${topic.id}, '${pageName}');"
            >${escapeHtml(topic.topic)}</button>
        `;
  }

  html += "</div>";

  return html;
}

/* Overleggsmenyen med Dupliser og Slett for et notat. */
function createDesktopNoteMenuHtml(isMenuOpen) {
  return /*HTML*/ `
        <div class="menu" ${isMenuOpen ? "" : "hidden"}>
            <button class="menu-item" type="button" onclick="desktopDuplicateNote();">
                ${createDesktopIconHtml("M9 9h13v13H9zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1")}
                Dupliser notat
            </button>

            <div class="menu-divider"></div>

            <button class="menu-item danger" type="button" onclick="desktopAskDeleteNote();">
                ${createDesktopIconHtml("M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2")}
                Slett notat
            </button>
        </div>
    `;
}

/* Bekreftelsesdialogen for sletting av notat. */
function createDesktopNoteDeleteDialogHtml(note, isDeleteDialogOpen) {
  if (!isDeleteDialogOpen) {
    return /*HTML*/ `<div class="dialog-backdrop" hidden></div>`;
  }

  return createDesktopDialogHtml(
    "Slette notatet?",
    `«${note.title}» blir permanent slettet. Dette kan ikke angres.`,
    "desktopConfirmDeleteNote();",
    "desktopCancelDeleteNote();",
  );
}

/* ==========================================================================
   Hjelpere for søk, innstillinger og dialoger
   ========================================================================== */

/* Treffene i søket: turer og notater. */
function createDesktopSearchResultHtml(results) {
  let html = /*HTML*/ `<div class="list">`;

  for (const trip of results.trips) {
    html += /*HTML*/ `
            <button class="list-row" type="button" onclick="desktopOpenTrip(${trip.id});">
                <div class="list-row-thumb">
                    ${
                      trip.pictures.length > 0
                        ? createDesktopPictureSvgHtml(trip.pictures[0])
                        : `<span class="thumb-icon">${createDesktopIconHtml("M3 20l7-14 4 7 3-3 4 10z")}</span>`
                    }
                </div>

                <div class="list-row-main">
                    <span class="result-row-kind">Tur</span>
                    <p class="list-row-title">${escapeHtml(trip.title)}</p>
                    <p class="location">
                        ${escapeHtml(getActivityName(trip.activityId))} · ${escapeHtml(trip.location)}
                    </p>
                </div>

                <div class="list-row-side">
                    <span class="trip-date">${formatDate(trip.date)}</span>
                </div>
            </button>
        `;
  }

  for (const note of results.notes) {
    html += /*HTML*/ `
            <button class="list-row" type="button" onclick="desktopOpenNote(${note.id});">
                <div class="list-row-thumb">
                    <span class="thumb-icon">${createDesktopIconHtml("M14 3v5h5M6 3h8l5 5v13H6z")}</span>
                </div>

                <div class="list-row-main">
                    <span class="result-row-kind">Notat</span>
                    <p class="list-row-title">${escapeHtml(note.title)}</p>
                    <p class="location">${escapeHtml(createPreview(note.description))}</p>
                </div>

                <div class="list-row-side">
                    <span class="trip-date">${formatDate(note.date)}</span>
                </div>
            </button>
        `;
  }

  html += "</div>";

  return html;
}

/* Sesongene i søkefiltrene. Filteret bruker sesongens ID, slik som
   de andre filtrene. "Alle sesonger" betyr at vi ikke filtrerer. */
function createDesktopSearchSeasonOptionsHtml(selectedSeasonId) {
  const seasons = model.data.seasons;

  /* Den tomme linja er valgt når vi ikke filtrerer på sesong. */
  const emptySelected =
    selectedSeasonId === null || selectedSeasonId === undefined ? "" : null;

  let html = createOptionHtml("", "Alle sesonger", emptySelected);

  for (const season of seasons) {
    /* "Alle" er ikke en sesong, men et filter. Den er alt håndtert over. */
    if (season.season === "Alle") {
      continue;
    }

    html += createOptionHtml(season.id, season.season, selectedSeasonId);
  }

  return html;
}

/* Sorteringen i søket. */
function createDesktopSortOptionsHtml(selectedSortOrder) {
  const options = [
    { id: "dateDesc", text: "Nyeste først" },
    { id: "dateAsc", text: "Eldste først" },
    { id: "titleAsc", text: "Tittel A–Å" },
  ];

  let html = "";

  for (const option of options) {
    html += createOptionHtml(option.id, option.text, selectedSortOrder);
  }

  return html;
}

/* En seksjon i innstillingene. Alle tre seksjonene har samme oppbygning:
   en tittel, en liste med chips, og en rad der brukeren kan skrive inn
   navnet på det som skal legges til. */
function createDesktopSettingsSectionHtml(
  title,
  chipsHtml,
  fieldName,
  placeholder,
  addCall,
) {
  const value = model.viewState.settingsPage[fieldName];

  return /*HTML*/ `
        <section class="manager-section">
            <h2>${title}</h2>

            <div class="section-card">
                ${chipsHtml}

                <div class="add-row">
                    <input
                        type="text"
                        placeholder="${placeholder}"
                        value="${escapeHtml(value ? value : "")}"
                        oninput="model.viewState.settingsPage.${fieldName} = this.value;"
                    />
                    <button class="add-btn" type="button" onclick="${addCall}">Legg til</button>
                </div>
            </div>
        </section>
    `;
}

/* Chipene med navnene på aktivitetene, emneknaggene eller fylkene.
   Hver chip har en knapp for å slette det som står på den. */
function createDesktopChipListHtml(list, keyName, chipClass, removeCall) {
  let html = /*HTML*/ `<div class="tag-list">`;

  for (const item of list) {
    html += /*HTML*/ `
            <span class="chip ${chipClass}">
                ${escapeHtml(item[keyName])}
                <button
                    class="remove"
                    type="button"
                    title="Fjern"
                    onclick="${removeCall}(${item.id});"
                >&times;</button>
            </span>
        `;
  }

  html += "</div>";

  return html;
}

/* Bekreftelsesdialogen som brukes både for turer og for notater. */
function createDesktopDialogHtml(title, text, confirmCall, cancelCall) {
  return /*HTML*/ `
        <div class="dialog-backdrop">
            <div class="dialog">
                <h2 class="dialog-title">${escapeHtml(title)}</h2>
                <p class="dialog-text">${escapeHtml(text)}</p>
                <div class="dialog-actions">
                    <button class="dialog-btn" type="button" onclick="${cancelCall}">
                        Avbryt
                    </button>
                    <button class="dialog-btn danger" type="button" onclick="${confirmCall}">
                        Slett
                    </button>
                </div>
            </div>
        </div>
    `;
}

/* Tommeldingen, når det ikke er noe å vise. */
function createDesktopEmptyHtml(text) {
  return /*HTML*/ `<p class="empty-note">${escapeHtml(text)}</p>`;
}

/* Dropdownene hentes fra modellen, slik at vi ikke skriver inn listen over
   aktiviteter og fylker to steder. */
function createDesktopOptionsHtml(list, keyName, selectedId, emptyText) {
  /* Den tomme linja skal være valgt når ingenting annet er valgt. Ellers
     ville to linjer være merket som valgt samtidig. */
  const emptySelected =
    selectedId === null || selectedId === undefined ? "" : null;

  let html = createOptionHtml("", emptyText, emptySelected);

  for (const item of list) {
    const value = item.id;
    const text = item[keyName];

    html += createOptionHtml(value, text, selectedId);
  }

  return html;
}

/* ==========================================================================
   Hjelpere som regner ut lister og tall
   ========================================================================== */

/* Turer som ligger fram i tid, altså i dag eller senere. Beregnes, lagres ikke. */
function desktopGetPlannedTrips() {
  const trips = [];

  for (const trip of model.data.trips) {
    if (desktopIsDateTodayOrLater(trip.date)) {
      trips.push(trip);
    }
  }

  return trips;
}

/* Turer som er gjennomført, altså før i dag. Beregnes, lagres ikke. */
function desktopGetDoneTrips() {
  const trips = [];

  for (const trip of model.data.trips) {
    if (!desktopIsDateTodayOrLater(trip.date)) {
      trips.push(trip);
    }
  }

  return trips;
}

/* Sjekker om en dato er i dag eller senere. Vi ser bare på kalenderdagen,
   ikke på klokketiden. En tur som er planlagt for i dag, er ennå ikke
   gjennomført, og regnes derfor som planlagt. */
function desktopIsDateTodayOrLater(dateString) {
  if (!dateString) {
    return false;
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    console.error("Ugyldig dato: " + dateString);
    return false;
  }

  const today = new Date();

  /* Nullstill klokketiden, slik at vi bare sammenligner datoene. */
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return date >= today;
}

/* Sorterer turene etter dato. Vi bruker innsettingssortering, fordi sort()
   med pilfunksjoner ikke er en del av verktøykassen. Er newestFirst true,
   kommer den nyeste turen først. */
function desktopSortTripsByDate(trips, newestFirst) {
  const sorted = trips.slice();

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const currentTime = new Date(current.date).getTime();
    let j = i - 1;

    while (j >= 0) {
      const previousTime = new Date(sorted[j].date).getTime();

      if (newestFirst && previousTime < currentTime) {
        sorted[j + 1] = sorted[j];
        j = j - 1;
      } else if (!newestFirst && previousTime > currentTime) {
        sorted[j + 1] = sorted[j];
        j = j - 1;
      } else {
        break;
      }
    }

    sorted[j + 1] = current;
  }

  return sorted;
}

/* Sorterer en liste på tittel, A–Å. */
function desktopSortItemsByTitle(items, keyName) {
  const sorted = items.slice();

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const currentTitle = current[keyName].toLowerCase();
    let j = i - 1;

    while (j >= 0) {
      const previousTitle = sorted[j][keyName].toLowerCase();

      if (previousTitle > currentTitle) {
        sorted[j + 1] = sorted[j];
        j = j - 1;
      } else {
        break;
      }
    }

    sorted[j + 1] = current;
  }

  return sorted;
}

/* Hvor mange fylker brukeren har vært i. Vi teller bare fylkene på turene,
   fordi det er turene som sier hvor vi har vært. */
function desktopCountCounties() {
  const countyIds = [];

  for (const trip of model.data.trips) {
    if (!countyIds.includes(trip.countyId)) {
      countyIds.push(trip.countyId);
    }
  }

  return countyIds.length;
}

/* Turene og notatene som passer søket. Treffene regnes ut når siden tegnes,
   og lagres derfor ikke i modellen. */
function desktopGetSearchResults() {
  const search = model.viewState.searchPage;
  const text = search.searchStr ? search.searchStr.trim().toLowerCase() : "";

  const trips = [];
  const notes = [];

  for (const trip of model.data.trips) {
    if (desktopTripMatchesSearch(trip, text, search)) {
      trips.push(trip);
    }
  }

  for (const note of model.data.notes) {
    if (desktopNoteMatchesSearch(note, text, search)) {
      notes.push(note);
    }
  }

  if (search.sortOrder === "titleAsc") {
    return {
      trips: desktopSortItemsByTitle(trips, "title"),
      notes: desktopSortItemsByTitle(notes, "title"),
    };
  }

  const newestFirst = search.sortOrder !== "dateAsc";

  return {
    trips: desktopSortTripsByDate(trips, newestFirst),
    notes: desktopSortItemsByDate(notes, newestFirst),
  };
}

/* Sjekker om en tur passer søket. */
function desktopTripMatchesSearch(trip, text, search) {
  if (search.selectedActivity && trip.activityId !== search.selectedActivity) {
    return false;
  }

  if (search.season && getSeasonId(trip.date) !== search.season) {
    return false;
  }

  if (text === "") {
    return true;
  }

  const haystack = (
    trip.title +
    " " +
    trip.location +
    " " +
    trip.description
  ).toLowerCase();

  return haystack.includes(text);
}

/* Sjekker om et notat passer søket. */
function desktopNoteMatchesSearch(note, text, search) {
  if (search.selectedTopic && !note.topics.includes(search.selectedTopic)) {
    return false;
  }

  if (text === "") {
    return true;
  }

  const haystack = (note.title + " " + note.description).toLowerCase();

  return haystack.includes(text);
}

/* Sorterer notater etter dato. */
function desktopSortItemsByDate(items, newestFirst) {
  const sorted = items.slice();

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const currentTime = new Date(current.date).getTime();
    let j = i - 1;

    while (j >= 0) {
      const previousTime = new Date(sorted[j].date).getTime();

      if (newestFirst && previousTime < currentTime) {
        sorted[j + 1] = sorted[j];
        j = j - 1;
      } else if (!newestFirst && previousTime > currentTime) {
        sorted[j + 1] = sorted[j];
        j = j - 1;
      } else {
        break;
      }
    }

    sorted[j + 1] = current;
  }

  return sorted;
}
