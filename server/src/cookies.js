"use strict";

/* ==========================================================================
   cookies.js – leser cookies fra forespørslene

   Vi trenger bare å lese én cookie, så en egen liten parser er nok,
   og vi slipper en ekstra avhengighet.
   ========================================================================== */

function parseCookies(header) {
  const cookies = {};

  if (!header) {
    return cookies;
  }

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();

    if (name === "") {
      continue;
    }

    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }

  return cookies;
}

/* Legger cookie-ene på req.cookies, slik at rutene kan lese dem. */
function cookieParser(req, res, next) {
  req.cookies = parseCookies(req.headers.cookie);
  next();
}

module.exports = { parseCookies, cookieParser };
