const model = {
  app: {
    currentPage: "loginPage",

    // Den innloggede brukeren, slik serveren svarte på /api/auth/me.
    // Er null når vi ikke er logget inn.
    user: null,
  },

  viewState: {
    // Login
    loginPage: {
      userInput: "",
      passwordInput: "",
      isPasswordVisible: false,
      errorMessage: "",
    },

    // Ny tur
    newTripPage: {
      activityId: null,
      title: "",
      location: "",
      date: "",
      countyId: null,
      description: "",
      pictures: [],
      errorMessage: "",
    },

    editTripPage: {
      tripId: null,
      activityId: null,
      title: "",
      location: "",
      date: "",
      countyId: null,
      description: "",
      pictures: [],
      errorMessage: "",
    },

    // Turliste
    tripViewPage: {
      tripId: null,
      pageNumber: 0, // paging av bildene
      isMenuOpen: false,
      isDeleteDialogOpen: false,
      errorMessage: "",
    },

    // Nytt notat
    newNotePage: {
      title: "",
      date: "",
      description: "",
      topics: [],
      errorMessage: "",
    },

    editNotePage: {
      noteId: null,
      title: "",
      date: "",
      description: "",
      topics: [],
      errorMessage: "",
    },

    // Notatdetaljer
    noteViewPage: {
      noteId: null,
      isMenuOpen: false,
      isEditing: false,
      isDeleteDialogOpen: false,
      errorMessage: "",
    },

    // Søk. Filterne er ID-er, bortsett fra sesongen, som er sesongens
    // ID i model.data.seasons. Treffene regnes ut når siden tegnes,
    // og lagres derfor ikke her.
    searchPage: {
      searchStr: "",
      selectedActivity: null,
      selectedTopic: null,
      season: null,
      sortOrder: "dateDesc",
    },

    // Innstillinger
    settingsPage: {
      newActivity: null,
      newTopic: null,
      newCounty: null,
      errorMessage: "",
    },
  },

  data: {
    /* Dataene under er demodata. Ingen av utgavene bruker dem lenger:
       både mobil- og desktop-utgaven henter data fra API-et og tømmer
       listen ved oppstart. Se mobileResetModelData() i
       loginPageController.js og desktopResetModelData() i
       desktopPageController.js.

       Demodataene ligger her fortsatt, fordi server/scripts/import-demo.js
       leser dem for å fylle en testdatabase. */

    activities: [
      { id: 1, activity: "Bærtur" },
      { id: 2, activity: "Båttur" },
      { id: 3, activity: "Gåtur" },
      { id: 4, activity: "Fisketur" },
      { id: 5, activity: "Klatring" },
      { id: 6, activity: "Skitur" },
      { id: 7, activity: "Sykkeltur" },
    ],

    topics: [
      { id: 1, topic: "Planlegging" },
      { id: 2, topic: "Utstyr" },
      { id: 3, topic: "Refleksjon" },
      { id: 4, topic: "Mål" },
      { id: 5, topic: "Tips" },
    ],

    counties: [
      { id: 1, county: "Agder" },
      { id: 2, county: "Innlandet" },
      { id: 3, county: "Oslo" },
      { id: 4, county: "Rogaland" },
      { id: 5, county: "Vestfold" },
    ],

    seasons: [
      { id: 1, season: "Vår" },
      { id: 2, season: "Sommer" },
      { id: 3, season: "Høst" },
      { id: 4, season: "Vinter" },
      { id: 5, season: "Alle" },
    ],
    // Turene. Bildene ligger i pictures-listen, og peker på bilder i
    // model.data.images. Det er den eneste koblingen mellom tur og bilde.
    trips: [
      {
        id: 1,
        activityId: 4,
        title: "Fisketur til Hammervatnet",
        location: "Hammervatnet",
        date: "2026-10-30",
        countyId: 5,
        pictures: [1, 2, 3],
        description: "",
        updatedAt: "2026-10-06T19:24",
      },
      {
        id: 2,
        activityId: 7,
        title: "Sykkeltur til Fjellheia",
        location: "Fjellheia",
        date: "2026-10-01",
        countyId: 5,
        pictures: [4, 5],
        description:
          "Klassisk tur til heia. Pent vær men ganske mange folk. God sikt ned til fjordarmen og klare farger i løvfellet.",
        updatedAt: "2026-10-01T19:24",
      },
      {
        id: 3,
        activityId: 1,
        title: "Bærtur til Holtet",
        location: "Holtet",
        date: "2026-08-15",
        countyId: 1,
        pictures: [6],
        description:
          "Bærtur i skogen. På vei tilbake tok vi en pause ved vannet og spiste niste. Kom tilbake til bilen ved 16-tiden. Definitivt verdt turen!",
        updatedAt: "2026-01-05T19:24",
      },
      {
        id: 4,
        activityId: 6,
        title: "Skitur til Lyngsalpan",
        location: "Lyngsalpan",
        date: "2026-01-04",
        countyId: 4,
        pictures: [7, 8, 9, 10, 11],
        description:
          "Fantastisk tur i høstsnø! Startet fra bommen ved 8-tiden og hadde strålende vær hele dagen. God sikt ned til fjordarmen og klare farger i løvfellet. Ingen problemer med snøforholdene - godt preparerte spor i store deler av turen. På vei ned tok vi en pause ved vannet og spiste niste. Kom tilbake til bilen ved 16-tiden. Definitivt verdt turen!",
        updatedAt: "2026-01-05T19:24",
      },
      {
        id: 5,
        activityId: 6,
        title: "Skitur til Lia",
        location: "Holmlien",
        date: "2026-12-29",
        countyId: 1,
        pictures: [],
        description: "",
        updatedAt: "2026-01-05T19:24",
      },
    ],

    // Bildene. Hvert bilde peker på et motiv i model.data.imageTemplates.
    // Hvilken tur et bilde hører til, står i turens pictures-liste.
    images: [
      { id: 1, templateId: 1 },
      { id: 2, templateId: 2 },
      { id: 3, templateId: 3 },
      { id: 4, templateId: 4 },
      { id: 5, templateId: 5 },
      { id: 6, templateId: 6 },
      { id: 7, templateId: 1 },
      { id: 8, templateId: 2 },
      { id: 9, templateId: 3 },
      { id: 10, templateId: 4 },
      { id: 11, templateId: 5 },
    ],

    // Ferdige bilder vi kan bruke i stedet for å laste opp filer. Hvert motiv er en inline-SVG, så ingenting lagres til disk.
    imageTemplates: [
      {
        id: 1,
        label: "Fjell",
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#cfe8ff"/><circle cx="76" cy="22" r="8" fill="#ffd54f"/><path d="M0 100 L35 35 L60 70 L75 50 L100 100 Z" fill="#78909c"/></svg>',
      },
      {
        id: 2,
        label: "Skog",
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#e8f5e9"/><circle cx="20" cy="20" r="10" fill="#fff59d"/><path d="M0 100 L30 40 L55 100 Z" fill="#2e7d32"/><path d="M45 100 L72 32 L100 100 Z" fill="#1b5e20"/></svg>',
      },
      {
        id: 3,
        label: "Innsjø",
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#e1f5fe"/><path d="M0 58 L30 28 L55 58 Z" fill="#90a4ae"/><rect y="58" width="100" height="42" fill="#4fc3f7"/><line x1="0" y1="58" x2="100" y2="58" stroke="#0288d1" stroke-width="2"/></svg>',
      },
      {
        id: 4,
        label: "Snø",
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#e3f2fd"/><path d="M0 100 L50 18 L100 100 Z" fill="#eceff1"/><path d="M34 45 L50 18 L66 45 L50 37 Z" fill="#ffffff"/></svg>',
      },
      {
        id: 5,
        label: "Solnedgang",
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#ffe0b2"/><rect width="100" height="58" fill="#ffab91"/><circle cx="50" cy="58" r="14" fill="#fff176"/><path d="M0 100 L30 68 L60 100 Z" fill="#6d4c41"/></svg>',
      },
      {
        id: 6,
        label: "Kyst",
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#b3e5fc"/><path d="M8 54 L30 34 L46 54 Z" fill="#8d6e63"/><rect y="54" width="100" height="46" fill="#0288d1"/><line x1="0" y1="54" x2="100" y2="54" stroke="#01579b" stroke-width="2"/></svg>',
      },
    ],

    // Notater
    notes: [
      {
        id: 1,
        title: "Sesongplanlegging høst 2026",
        date: "2026-09-05",
        description: `Bør prioritere turer i september–oktober før snøen legger seg i høyden. Har lyst til å prøve Nordkapp-turen igjen, kanskje kombinere med båt. Måltall for høsten er tre overnattingsturer og én fisketur. Utstyret er nesten klart, men sekken må byttes før           frosten setter inn. Neste steg: bestill billetter og legg inn planlagte turer i appen, slik at kalenderen viser hva som allerede er booket.`,
        topics: [1, 2, 5],
        updatedAt: "2026-10-06T19:24",
      },
      {
        id: 2,
        title: "Refleksjon etter sommeren",
        date: "2026-09-01",
        description: `Sommeren ble bra med mange båtturer. Skal prøve å få til flere overnattingsturer neste år. Bærturene var spesielt fine i år.`,
        topics: [3],
        updatedAt: "2026-10-01T19:24",
      },
      {
        id: 3,
        title: "Mål for sommeren",
        date: "2026-05-30",
        description: `1. Få til minst 2 overnattingsturer. 2. Prøve ny rute til Prekestolen. 3. Delta på fiskekurs i august.`,
        topics: [1, 4],
        updatedAt: "2026-05-30T19:24",
      },
    ],
  },
};
