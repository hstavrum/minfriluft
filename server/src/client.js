"use strict";

/* ==========================================================================
   client.js – velger hvilken utgave av appen vi skal vise

   Vi har to utgaven av appen:

     index.html          mobilutgaven, en telefon i en ramme
     index-desktop.html  skrivebordsutgaven, brede ruter og tabeller

   De er to forskjellige grensesnitt over det samme API-et, så de ligger
   i hver sin fil. Det som trengs, er én tydelig adresse til mennesker:
   "/" skal gi den utgaven som passer til skjermen.

   Regelen er den samme som i webserveren (se server/README.md for
   NGINX-varianten): er det en telefon eller et nettbrett, får den
   mobilutgaven. Alt annet får skrivebordsutgaven.
   ========================================================================== */

/* Navnene på filene, slik at de samme navnene brukes overalt. */
const MOBILE_APP_FILE = "index.html";
const DESKTOP_APP_FILE = "index-desktop.html";

/* Kjennetegn på telefoner og nettbrett. */
const MOBILE_PATTERN = /android|iphone|ipad|ipod|mobile|blackberry|iemobile/i;

function isMobileUserAgent(userAgent) {
  return MOBILE_PATTERN.test(userAgent || "");
}

/* Hvilken fil skal vi vise denne brukeren? */
function pickAppFile(userAgent) {
  return isMobileUserAgent(userAgent) ? MOBILE_APP_FILE : DESKTOP_APP_FILE;
}

module.exports = {
  MOBILE_APP_FILE,
  DESKTOP_APP_FILE,
  isMobileUserAgent,
  pickAppFile,
};
