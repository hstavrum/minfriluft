/* ==========================================================================
   pwa.js – gjør mobil-utgaven til en installerbar app (PWA)

   To ting skjer her:

   1. Vi registrerer service workeren (sw.js). Den legger appens
      statiske filer i en cache, slik at appen kan starte selv uten
      nett. Dataene turer og notater kommer alltid fra serveren, så de
      caches aldri.

   2. Nettleseren gir oss et "before install prompt"-event når appen kan
      installeres. Da lagrer vi det, så innstillingene kan tilby
      brukeren å legge appen på hjemskjermen med en knapp.

   På iPhone finnes ikke det eventet. Der forklarer vi i stedet hvordan
   brukeren legger appen på hjemskjermen selv.
   ========================================================================== */

const pwa = {
  /* Selve installasjons-hendelsen, så lenge vi ikke har brukt den. */
  installPrompt: null,

  /* Sant når appen er installert. */
  installed: false,

  /* Sant når appen kjører som en egen app (uten nettleserens ramme). */
  isStandalone: false,

  /* Starter alt. Vi kaller denne fra index.html. */
  start() {
    pwa.isStandalone = pwa.detectStandalone();
    pwa.registerServiceWorker();
    pwa.listenForInstallPrompt();
  },

  /* Kjører appen som en egen app, uten nettleserens adresse-linje? */
  detectStandalone() {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return true;
    }

    if (window.matchMedia("(display-mode: fullscreen)").matches) {
      return true;
    }

    /* iOS Safari bruker en egen egenskap. */
    return window.navigator.standalone === true;
  },

  /* Registrerer service workeren.

     Service workers krever en sikker kontekst, altså HTTPS eller
     localhost. Uten det hopper vi over, og appen fungerer som før. */
  registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (!window.isSecureContext) {
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error) => {
          console.warn(
            "Klarte ikke registrere service workeren:",
            error.message,
          );
        });
    });
  },

  /* Håndterer installasjon av appen. */
  listenForInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (event) => {
      /* Uten preventDefault viser nettleseren sin egen boks, og vi får
         ingen knapp å vise i innstillingene. */
      event.preventDefault();

      pwa.installPrompt = event;
      pwa.refreshView();
    });

    window.addEventListener("appinstalled", () => {
      pwa.installPrompt = null;
      pwa.installed = true;
      pwa.refreshView();
    });
  },

  /* Tegner siden på nytt, men bare hvis det er innstillingene som vises.
     Det er der installasjonsknappen ligger. */
  refreshView() {
    if (typeof model === "undefined" || typeof updateView !== "function") {
      return;
    }

    if (model.app.currentPage === "settingsPage") {
      updateView();
    }
  },

  /* Er appen installert? */
  isInstalled() {
    return pwa.installed || pwa.isStandalone;
  },

  /* Kan vi tilby installasjon nå? */
  canInstall() {
    return !pwa.isInstalled() && pwa.installPrompt !== null;
  },

  /* Forklaringen vi viser når vi ikke kan vise en knapp. */
  installHint() {
    if (pwa.isIos()) {
      return "På iPhone: trykk på Del-knappen og velg «Legg til på hjemskjermen».";
    }

    return "Bruk menyen i nettleseren, og velg «Legg til på hjemskjermen».";
  },

  /* Er vi på iPhone eller iPad? Der er det ingen installasjonsknapp. */
  isIos() {
    const userAgent = window.navigator.userAgent || "";

    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return true;
    }

    /* iPad Safari later som en Mac. Men den har berøringsskjerm. */
    return (
      window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1
    );
  },

  /* Starter installasjonen. */
  async install() {
    if (!pwa.installPrompt) {
      return;
    }

    try {
      pwa.installPrompt.prompt();

      await pwa.installPrompt.userChoice;
    } catch {
      /* Nettleseren godtok ikke, eller brukeren avbrøt. */
    }

    pwa.installPrompt = null;
    pwa.refreshView();
  },
};
