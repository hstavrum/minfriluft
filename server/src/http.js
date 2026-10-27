"use strict";

/* ==========================================================================
   http.js – feilhåndtering og små hjelpere for rutingen

   Alle feil som går ut til nettleseren blir JSON på formen
   {"error": "melding på norsk"}. Frontenden viser meldingen rett ut.
   ========================================================================== */

/* En feil med en HTTP-status. Alt annet enn 4xx blir behandlet som
   en serverfeil, og da skjuler vi detaljene. */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function badRequest(message) {
  return new HttpError(400, message);
}

function unauthorized(message) {
  return new HttpError(401, message);
}

function notFound(message) {
  return new HttpError(404, message);
}

function conflict(message) {
  return new HttpError(409, message);
}

/* Pakker en async-funksjon, slik at et avbrutt promise går til
   feilhåndtereren i stedet for å forsvinne. */
function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/* Feilhåndtereren. Den må ha fire parametere, ellers kjenner ikke
   Express igjen at dette er en feilhåndterer. */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  /* SQLite sine brudd på begrensninger skyldes ofte dårlig data fra
     nettleseren, og skal svare med 400 og ikke 500. */
  const isConstraintError =
    typeof err.code === "string" && err.code.startsWith("SQLITE_CONSTRAINT");

  const status = err.status || (isConstraintError ? 400 : 500);

  if (status >= 500) {
    console.error("serverfeil:", err);
  }

  const message =
    status >= 500 ? "Noe gikk galt på serveren." : err.message || "Ukjent feil.";

  res.status(status).json({ error: message });
}

/* Leser et id fra ruten. Ugyldige id-er gir 400, ikke 500. */
function parseId(value, label = "id") {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest("Ugyldig " + label + ".");
  }

  return id;
}

/* Gjør en verdi om til et tall, eller null. Brukes på id-er fra
   skjemaer, der tomt betyr "ikke valgt". */
function toNullableId(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

/* Renser en tekst fra skjemaet. */
function cleanText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

module.exports = {
  HttpError,
  badRequest,
  unauthorized,
  notFound,
  conflict,
  asyncHandler,
  errorHandler,
  parseId,
  toNullableId,
  cleanText,
};
