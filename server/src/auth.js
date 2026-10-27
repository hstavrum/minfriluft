"use strict";

/* ==========================================================================
   auth.js – innlogging med sesjoner i databasen

   Vi bruker sesjoner i tabellen sessions, ikke JWT. Da kan vi logge ut en
   bruker ved å slette raden, og utloggingen håndteres av databasen.
   ========================================================================== */

const crypto = require("node:crypto");
const { unauthorized } = require("./http");

const SESSION_COOKIE = "mf_session";
const SESSION_TTL_DAYS = 30;

/* I produksjon skal cookien ha Secure-flagget, altså bare sendes over
   HTTPS. Lokalt kan vi slå det av med COOKIE_SECURE=false. */
function cookieIsSecure() {
  if (process.env.COOKIE_SECURE !== undefined) {
    return process.env.COOKIE_SECURE === "true";
  }

  return process.env.NODE_ENV === "production";
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieIsSecure(),
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

/* Lager en ny sesjon og returnerer tokenet. */
function createSession(db, userId, userAgent = "") {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  db.prepare(
    "INSERT INTO sessions (token, user_id, expires_at, user_agent) VALUES (?, ?, ?, ?)",
  ).run(token, userId, expiresAt, String(userAgent || "").slice(0, 300));

  return { token, expiresAt };
}

/* Sletter en sesjon. */
function deleteSession(db, token) {
  if (!token) {
    return;
  }

  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

/* Sletter sesjoner som har utløpt. Kall den med jevne mellomrom. */
function deleteExpiredSessions(db) {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(
    new Date().toISOString(),
  );
}

/* Finner brukeren bak en sesjon. Returnerer null hvis sesjonen
   ikke finnes eller har utløpt. */
function findSessionUser(db, token) {
  if (!token) {
    return null;
  }

  const row = db
    .prepare(
      `SELECT u.id AS id, u.email AS email, u.display_name AS displayName,
              u.created_at AS createdAt, s.expires_at AS expiresAt
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
    )
    .get(token);

  if (!row) {
    return null;
  }

  if (new Date(row.expiresAt).getTime() <= Date.now()) {
    deleteSession(db, token);
    return null;
  }

  return row;
}

/* Middleware som krever en gyldig sesjon. Legger brukeren på req.user. */
function requireAuth(db) {
  return function authMiddleware(req, res, next) {
    const token = req.cookies ? req.cookies[SESSION_COOKIE] : null;
    const user = findSessionUser(db, token);

    if (!user) {
      next(unauthorized("Du er ikke logget inn."));
      return;
    }

    req.user = user;
    req.sessionToken = token;
    next();
  };
}

module.exports = {
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
  cookieIsSecure,
  sessionCookieOptions,
  createSession,
  deleteSession,
  deleteExpiredSessions,
  findSessionUser,
  requireAuth,
};
