/* ==========================================================================
   searchPageView.js – View for søkesiden i mobilutgaven

   View leser modellen og lager HTML, men endrer ikke modellen.
   Alle brukerhandlinger går via controller-funksjoner i
   searchPageController.js:

     runSearch()                    – utfører søket
     setSearchFilter(field, value)  – endrer aktivitet eller emne
     setSearchSeason(seasonId)      – endrer sesongfilteret
     setSearchSortOrder(sortOrder)  – endrer sorteringen
     openTrip(tripId)               – åpner en tur
     openNote(noteId)               – åpner et notat

   Modell-state som dette viewet forventer:
     model.app.currentPage = "searchPage"
     model.viewState.searchPage             – søket og filtrene
     model.data.trips                       – turene
     model.data.notes                       – notatene
     model.data.activities                  – aktivitetene
     model.data.topics                      – emneknaggene
     model.data.counties                    – fylkene
     model.data.seasons                     – sesongene

   Funksjoner:
     updateViewSearchPage()                     // tegner hele siden
     createSearchBoxHtml()                      // søkefeltet med knappen
     createSearchFilterRowHtml()                // raden med aktivitet og emne
     createSearchSelectHtml(label, id, list, keyName, selectedId, onChange) // et filter
     createSearchOptionHtml(value, text, selectedId) // én <option>
     createSearchSeasonChipsHtml()              // sesongene som knapper
     createSearchSortChipsHtml()                // sorteringen som knapper
     createSearchResultsHtml()                  // treffene
     createSearchTripCardHtml(trip)             // ett turkort
     createSearchNoteCardHtml(note)             // ett notatkort
   ========================================================================== */

/* Søkesiden. Her finner brukeren turer og notater i dagboka. */
function updateViewSearchPage() {
  const search = model.viewState.searchPage;
  const results = getSearchResults();

  const html = /*HTML*/ `
    <div class="page-search" style="display: flex; justify-content: center;">
      <div class="phone-frame">
        ${createStatusBarHtml()}

        <header class="app-header">
          <h1>Søk</h1>

          ${createSearchBoxHtml()}
        </header>

        <main class="content">
          ${createSearchFilterRowHtml()}

          ${createSearchSeasonChipsHtml()}

          ${createSearchSortChipsHtml()}

          ${createSearchResultsHtml(results)}
        </main>

        ${createBottomNavHtml("searchPage")}
      </div>
    </div>
  `;

  document.getElementById("app").innerHTML = html;
}

/* Søkefeltet. Teksten lagres i modellen mens brukeren skriver, og
   søket kjøres når brukeren trykker på den grønne knappen eller
   trykker Enter. */
function createSearchBoxHtml() {
  const search = model.viewState.searchPage;

  return /*HTML*/ `
    <div class="search-box">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>

      <label class="sr-only" for="searchInput">Søk i turer og notater</label>
      <input
        id="searchInput"
        type="search"
        placeholder="Søk i turer og notater"
        value="${escapeHtml(search.searchStr)}"
        oninput="model.viewState.searchPage.searchStr = this.value;"
        onkeydown="if (event.key === 'Enter') { runSearch(true); }"
      />

      <button class="search-btn" type="button" onclick="runSearch(true);" title="Søk">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </div>
  `;
}

/* Raden med de to nedtrekkene: aktivitet og emne. */
function createSearchFilterRowHtml() {
  const search = model.viewState.searchPage;

  return /*HTML*/ `
    <div class="filter-row">
      ${createSearchSelectHtml(
        "Aktivitet",
        "searchActivity",
        model.data.activities,
        "activity",
        search.selectedActivity,
        "setSearchFilter('selectedActivity', this.value);",
      )}

      ${createSearchSelectHtml(
        "Emne",
        "searchTopic",
        model.data.topics,
        "topic",
        search.selectedTopic,
        "setSearchFilter('selectedTopic', this.value);",
      )}
    </div>
  `;
}

/* Et filter i søket. Den tomme verdien betyr "ingen filter", og den
   er valgt når vi ikke filtrerer på feltet. */
function createSearchSelectHtml(
  label,
  id,
  list,
  keyName,
  selectedId,
  onChange,
) {
  let options = createSearchOptionHtml("", "Alle", null);

  for (const item of list) {
    options += createSearchOptionHtml(item.id, item[keyName], selectedId);
  }

  return /*HTML*/ `
    <div class="filter-field">
      <label class="filter-title" for="${id}">${label}</label>
      <select class="filter-select" id="${id}" onchange="${onChange}">
        ${options}
      </select>
    </div>
  `;
}

/* Én valgmulighet i et filter. ID-ene er tall, og verdien fra
   skjemaet er tekst, så vi sammenligner som tall. */
function createSearchOptionHtml(value, text, selectedId) {
  const isSelected =
    selectedId === null || selectedId === undefined
      ? value === ""
      : Number(value) === Number(selectedId);

  const selected = isSelected ? " selected" : "";

  return `<option value="${value}"${selected}>${escapeHtml(text)}</option>`;
}

/* Sesongene som knapper. "Alle" betyr at vi ikke filtrerer på sesong,
   og den er valgt når sesongfilteret står på null. */
function createSearchSeasonChipsHtml() {
  const search = model.viewState.searchPage;

  let chips = /*HTML*/ `
    <button
      class="filter-chip ${search.season === null ? "active" : ""}"
      type="button"
      onclick="setSearchSeason(null);"
    >Alle</button>
  `;

  for (const season of model.data.seasons) {
    /* "Alle" er et filter, ikke en sesong, og er alt håndtert over. */
    if (season.season === "Alle") {
      continue;
    }

    const isActive = search.season === season.id;

    chips += /*HTML*/ `
      <button
        class="filter-chip ${isActive ? "active" : ""}"
        type="button"
        onclick="setSearchSeason(${season.id});"
      >${escapeHtml(season.season)}</button>
    `;
  }

  return /*HTML*/ `
    <div class="filter-section">
      <h2 class="filter-title">Årstid</h2>
      <div class="filter-chips">
        ${chips}
      </div>
    </div>
  `;
}

/* Sorteringen som knapper. */
function createSearchSortChipsHtml() {
  const search = model.viewState.searchPage;

  const options = [
    { id: "dateDesc", text: "Dato (nyeste)" },
    { id: "dateAsc", text: "Dato (eldste)" },
    { id: "locationAsc", text: "Sted" },
  ];

  let chips = "";

  for (const option of options) {
    const isActive = search.sortOrder === option.id;

    chips += /*HTML*/ `
      <button
        class="filter-chip ${isActive ? "active" : ""}"
        type="button"
        onclick="setSearchSortOrder('${option.id}');"
      >${escapeHtml(option.text)}</button>
    `;
  }

  return /*HTML*/ `
    <div class="filter-section">
      <h2 class="filter-title">Sortér etter</h2>
      <div class="filter-chips">
        ${chips}
      </div>
    </div>
  `;
}

/* Treffene. Turene kommer først, og notatene etterpå. */
function createSearchResultsHtml(results) {
  const search = model.viewState.searchPage;
  const query = search.searchStr ? search.searchStr.trim() : "";

  const numberOfTrips = results.trips.length;
  const numberOfNotes = results.notes.length;

  let html = /*HTML*/ `
    <div class="filter-section">
      <h2 class="results-title">Resultater</h2>
    </div>
  `;

  if (numberOfTrips === 0 && numberOfNotes === 0) {
    html += /*HTML*/ `
      <p class="empty-text">Ingen treff. Prøv et annet søkeord.</p>
    `;

    return html;
  }

  if (numberOfTrips > 0) {
    html += /*HTML*/ `<p class="results-count">${formatHitCount(numberOfTrips, "tur", "turer")}</p>`;

    for (const trip of results.trips) {
      html += createSearchTripCardHtml(trip, query);
    }
  }

  if (numberOfNotes > 0) {
    html += /*HTML*/ `<p class="results-count">${formatHitCount(numberOfNotes, "notat", "notater")}</p>`;

    for (const note of results.notes) {
      html += createSearchNoteCardHtml(note, query);
    }
  }

  return html;
}

/* Ett turkort i treffene. Aktiviteten står øverst til venstre, og
   datoen til høyre. Stedet markerer det som treffet på søkeordet. */
function createSearchTripCardHtml(trip, query) {
  const activityName = getActivityName(trip.activityId);
  const countyName = getCountyName(trip.countyId);

  return /*HTML*/ `
    <article class="trip-card" onclick="openTrip(${trip.id});">
      <div class="trip-card-header">
        <span class="trip-type">${escapeHtml(activityName)}</span>
        <span class="trip-date">${formatDate(trip.date)}</span>
      </div>

      <h3>${createSearchMatchHtml(trip.title, query)}</h3>

      <p class="location">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        ${createSearchMatchHtml(trip.location, query)}, ${escapeHtml(countyName)}
      </p>
    </article>
  `;
}

/* Ett notatkort i treffene. */
function createSearchNoteCardHtml(note, query) {
  return /*HTML*/ `
    <article class="note-card" onclick="openNote(${note.id});">
      <div class="note-card-header">
        <span class="note-date">${formatDate(note.date)}</span>
      </div>

      <h2>${createSearchMatchHtml(note.title, query)}</h2>

      <p>${createSearchMatchHtml(createPreview(note.description), query)}</p>
    </article>
  `;
}
