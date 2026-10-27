/* ==========================================================================
   common.js – Hjelpefunksjoner og felles HTML

   Her bor det som gjenbrukes på flere sider (skall, statuslinje, bunnnavigasjon)
   og små hjelpefunksjoner som gjør koden i view og controller lesbar.
   ========================================================================== */

/* --- Felles HTML ---------------------------------------------------------- */

/* Statuslinja er felles for alle sider. */
function createStatusBarHtml() {
  return /*HTML*/ `
        <div class="status-bar">
            <span class="time">09:41</span>
            <div class="status-icons">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C7.46 3 3.34 4.78.29 7.67c-.18.18-.29.43-.29.71 0 .28.11.53.29.71l11.29 11.29c.19.19.44.29.71.29.27 0 .52-.1.71-.29L23.71 9.09c.18-.18.29-.43.29-.71 0-.28-.11-.53-.29-.71C20.66 4.78 16.54 3 12 3z"></path>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.67 4H14V2h-4v2H8.33C7.6 4.74 6.48 5.87 5.51 7.37C4.55 8.87 4 10.6 4 12.4c0 3.31 2.69 6 6 6h5.4c2.47 0 4.6-1.79 4.93-4.14l1.58-4.59c.13-.48-.22-.95-.75-.95h-.19C19.47 8.72 18.47 8 17.33 8H14v3.34L15.67 4z"></path>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 4h-3V2h-4v2H7v18h10V4z"></path>
                </svg>
            </div>
        </div>
    `;
}

/* Bunnnavigasjonen er felles for alle sider. activePage avgjør hvilken
   fane som er valgt, og sendes til goToPage() i controlleren. */
function createBottomNavHtml(activePage) {
  const turerActive = activePage === "tripsPage";
  const sokActive = activePage === "searchPage";
  const notaterActive = activePage === "notesPage";
  const innstillingerActive = activePage === "settingsPage";

  return /*HTML*/ `
    <nav class="bottom-nav">
        <a class="nav-item ${turerActive ? "active" : ""}" onclick="goToPage('tripsPage');" href="#">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
            </svg>
            <span>Turer</span>
        </a>
        <a class="nav-item ${notaterActive ? "active" : ""}" onclick="goToPage('notesPage');" href="#">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span>Notater</span>
        </a>
        <a class="nav-item ${sokActive ? "active" : ""}" onclick="goToPage('searchPage');" href="#">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Søk</span>
        </a>            
        <a class="nav-item ${innstillingerActive ? "active" : ""}" onclick="goToPage('settingsPage');" href="#">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"></path>
            </svg>
            <span>Innstillinger</span>
        </a>
    </nav>
    `;
}

/* Den runde knappen som lager ny tur. */
function createFloatingActionHtml(onclick, title) {
  return /*HTML*/ `
        <a class="floating-action" title="${title}" onclick="${onclick}" href="#">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        </a>
    `;
}

function goToPage(page) {
  if (model.app.currentPage === page) {
    return;
  }

  model.app.currentPage = page;
  updateView();
}

/* Finner et objekt i en liste på id. Vi bruker alltid id, aldri
   plasseringen i arrayen, som identitet. */
function findObjectById(array, id) {
  for (const object of array) {
    if (object.id === id) {
      return object;
    }
  }

  return null;
}

/* Finner indeksen til et objekt i en liste på id. */
function findIndexById(array, id) {
  for (let i = 0; i < array.length; i++) {
    if (array[i].id === id) {
      return i;
    }
  }

  return -1;
}

/* Finner navnet på en aktivitet, f.eks. "Fisketur". */
function getActivityName(activityId) {
  const activity = findObjectById(model.data.activities, activityId);

  if (activity) {
    return activity.activity;
  }

  return "Ukjent aktivitet";
}

/* Finner navnet på et fylkesnavn, f.eks. "Nordland". */
function getCountyName(countyId) {
  const county = findObjectById(model.data.counties, countyId);

  if (county) {
    return county.county;
  }

  return "Ukjent fylke";
}

/* Formaterer "2026-10-30" til "30. okt. 2026". */
function formatDate(dateText) {
  if (!dateText) {
    return "";
  }

  const date = new Date(dateText);

  return date.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* Kortere utdrag av en lang tekst, til kortene på turlisten. */
function createPreview(text) {
  if (!text) {
    return "";
  }

  const maxLength = 80;

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + "...";
}

/* Sesongen regnes ut fra datoen, den lagres ikke på turen.
   Mars–mai er vår, juni–august er sommer, september–november er høst,
   desember–februar er vinter. Sesongene ligger i model.data.seasons,
   der vår er 1, sommer er 2, høst er 3 og vinter er 4. */
function getSeasonId(dateText) {
  if (!dateText) {
    return null;
  }

  const date = new Date(dateText);
  const month = date.getMonth();

  if (month >= 2 && month <= 4) {
    return 1;
  }

  if (month >= 5 && month <= 7) {
    return 2;
  }

  if (month >= 8 && month <= 10) {
    return 3;
  }

  return 4;
}

/* Navnet på sesongen. Vi slår opp i model.data.seasons, så det finnes
   bare ett sted som sier hva sesongene heter. */
function getSeasonName(dateText) {
  const seasonId = getSeasonId(dateText);

  if (seasonId === null) {
    return "";
  }

  const season = findObjectById(model.data.seasons, seasonId);

  if (season) {
    return season.season;
  }

  return "";
}

/* Tilbakeknappen i toppteksten. Den bruker goToPage() i controlleren.
   Skal vi gå tilbake til et skjema i stedet, kan vi sende inn en egen
   onclick, for eksempel "cancelEditTripForm();". */
function createBackButtonHtml(page, onclick) {
  const click = onclick ? onclick : `goToPage('${page}');`;

  return /*HTML*/ `
        <a class="back-btn" onclick="${click}" href="#" title="Tilbake">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
        </a>
    `;
}

/* Dagens dato som tekst, på formatet 2026-10-23. Vi bruker datoen på
   maskinen, ikke UTC, slik at det blir riktig dato også sent på døgnet. */
function getTodayAsDateText() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const monthText = month < 10 ? "0" + month : "" + month;
  const dayText = day < 10 ? "0" + day : "" + day;

  return "" + year + "-" + monthText + "-" + dayText;
}

/* Bygger <option>-taggene til en dropdown. Den valgte verdien
   markeres med selected. */
function createOptionHtml(value, text, selectedValue) {
  const selected = selectedValue === value ? " selected" : "";

  return /*HTML*/ `<option value="${value}"${selected}>${text}</option>`;
}
/* Tegner et bilde fra modellen. Et bilde er et motiv-id, fordi
   serveren lagrer bildene som motiver. Motivet er en ferdig inline-SVG
   i model.data.imageTemplates. */
function createPictureSvgHtml(templateId) {
  const template = findObjectById(model.data.imageTemplates, templateId);

  if (!template) {
    return "";
  }

  return template.svg;
}

/* Navnet på bildet. Det er motivet i model.data.imageTemplates som
   gir navnet, så bildet selv trenger ikke å lagre et eget navn. */
function getPictureLabel(templateId) {
  const template = findObjectById(model.data.imageTemplates, templateId);

  if (template) {
    return template.label;
  }

  return "Bilde";
}

/* Gjør en tekst trygg å putte inn i HTML. Vi bruker den på tekst som
   kommer fra brukeren, for eksempel søkeord, titler og navn. */
function escapeHtml(text) {
  if (!text) {
    return "";
  }

  let escaped = text.split("&").join("&amp;");
  escaped = escaped.split("<").join("&lt;");
  escaped = escaped.split(">").join("&gt;");
  escaped = escaped.split('"').join("&quot;");

  return escaped;
}
