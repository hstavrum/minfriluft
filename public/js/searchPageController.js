/* ==========================================================================
   searchPageController.js – Controller for søkesiden i mobilutgaven

   Søket går over turer og notater i modellen. Serveren har ingen egen
   søkerute, så treffene regnes ut når siden tegnes, og lagres derfor ikke
   i modellen.

   Brukerhandlinger:
     runSearch()                    // utfører søket og tegner siden på nytt
     setSearchFilter(field, value)  // endrer et filter (aktivitet eller emne)
     setSearchSeason(seasonId)      // endrer sesongfilteret
     setSearchSortOrder(sortOrder)  // endrer sorteringen

   Modell-state som controlleren bruker:
     model.viewState.searchPage.searchStr        – teksten i søkefeltet
     model.viewState.searchPage.selectedActivity – aktivitetens id, eller null
     model.viewState.searchPage.selectedTopic    – emneknaggens id, eller null
     model.viewState.searchPage.season           – sesongens id, eller null
     model.viewState.searchPage.sortOrder        – "dateDesc", "dateAsc" eller "locationAsc"
   ========================================================================== */

/* Utfører søket. Vi tegner siden på nytt, slik at treffene blir synlige.

   Søkefeltet overlever ikke en tegning, så når søket kommer fra
   søkefeltet gir vi det fokus tilbake, med markøren bakerst i teksten.
   Filtrene tegner siden på nytt uten å flytte fokus. */
function runSearch(refocusInput) {
  updateView();

  if (refocusInput) {
    focusSearchInput();
  }
}

/* Endrer et filter i søket. Alle filtrene er ID-er, så vi gjør om
   verdien fra skjemaet til et tall. En tom verdi betyr at vi ikke
   filtrerer på det feltet. */
function setSearchFilter(fieldName, value) {
  const search = model.viewState.searchPage;

  search[fieldName] = value ? Number(value) : null;

  runSearch();
}

/* Endrer sesongfilteret. Null betyr at vi ikke filtrerer på sesong. */
function setSearchSeason(seasonId) {
  model.viewState.searchPage.season = seasonId ? Number(seasonId) : null;

  runSearch();
}

/* Endrer sorteringen av treffene. */
function setSearchSortOrder(sortOrder) {
  model.viewState.searchPage.sortOrder = sortOrder;

  runSearch();
}

/* Gir søkefeltet fokus tilbake, og legger markøren bakerst i teksten. */
function focusSearchInput() {
  const input = document.getElementById("searchInput");

  if (!input) {
    return;
  }

  input.focus();

  const end = input.value.length;

  if (typeof input.setSelectionRange === "function") {
    input.setSelectionRange(end, end);
  }
}

/* ==========================================================================
   Treffene
   ========================================================================== */

/* Turene og notatene som passer søket. Treffene regnes ut når siden
   tegnes, og lagres derfor ikke i modellen. */
function getSearchResults() {
  const search = model.viewState.searchPage;
  const text = search.searchStr ? search.searchStr.trim().toLowerCase() : "";

  const trips = [];
  const notes = [];

  for (const trip of model.data.trips) {
    if (tripMatchesSearch(trip, text, search)) {
      trips.push(trip);
    }
  }

  for (const note of model.data.notes) {
    if (noteMatchesSearch(note, text, search)) {
      notes.push(note);
    }
  }

  return {
    trips: sortSearchResults(trips, search.sortOrder),
    notes: sortSearchResults(notes, search.sortOrder),
  };
}

/* Sjekker om en tur passer søket. Aktivitet og sesong gjelder turen,
   og emneknaggen gjelder notatene. */
function tripMatchesSearch(trip, text, search) {
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

/* Sjekker om et notat passer søket. Emneknaggen gjelder notatene. */
function noteMatchesSearch(note, text, search) {
  if (search.selectedTopic && !note.topics.includes(search.selectedTopic)) {
    return false;
  }

  if (search.season && getSeasonId(note.date) !== search.season) {
    return false;
  }

  if (text === "") {
    return true;
  }

  const haystack = (note.title + " " + note.description).toLowerCase();

  return haystack.includes(text);
}

/* Sorterer treffene. Dato går begge veier, og sted sorteres etter
   navnet på stedet. */
function sortSearchResults(items, sortOrder) {
  const sorted = items.slice();

  if (sortOrder === "locationAsc") {
    return sorted.sort(function (a, b) {
      const aText = (a.location || "").toLowerCase();
      const bText = (b.location || "").toLowerCase();

      if (aText < bText) {
        return -1;
      }

      if (aText > bText) {
        return 1;
      }

      return 0;
    });
  }

  const newestFirst = sortOrder !== "dateAsc";

  return sorted.sort(function (a, b) {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();

    if (aTime === bTime) {
      return 0;
    }

    return newestFirst ? bTime - aTime : aTime - bTime;
  });
}

/* ==========================================================================
   Hjelpere for treffene
   ========================================================================== */

/* Markerer det som treffet på søkeordet. Vi finnerstedet i den
   rå teksten, og rømmer hver del for seg, så at tegn som < og &
   ikke gir ugyldig HTML. */
function createSearchMatchHtml(text, query) {
  const rawText = text ? text : "";

  if (!query) {
    return escapeHtml(rawText);
  }

  const index = rawText.toLowerCase().indexOf(query.toLowerCase());

  if (index === -1) {
    return escapeHtml(rawText);
  }

  const before = escapeHtml(rawText.substring(0, index));
  const match = escapeHtml(rawText.substring(index, index + query.length));
  const after = escapeHtml(rawText.substring(index + query.length));

  return (
    before + /*HTML*/ `<span class="match-highlight">${match}</span>` + after
  );
}

/* Antall treff, skrevet som: "1 tur funnet", "3 turer funnet". */
function formatHitCount(count, singular, plural) {
  const word = count === 1 ? singular : plural;

  return count + " " + word + " funnet";
}
