"use strict";

/* ==========================================================================
   routes/auth.js – innlogging, utlogging og "hvem er jeg"
   ========================================================================== */

const express = require("express");

const { asyncHandler, badRequest, unauthorized, cleanText } = require("../http");
const { findUserByEmail, verifyPassword, userToJson } = require("../users");
const {
  SESSION_COOKIE,
  sessionCookieOptions,
  createSession,
  deleteSession,
  requireAuth,
} = require("../auth");

function createAuthRouter(db) {
  const router = express.Router();

  /* Logger inn. Setter en sesjonscookie og svarer med brukeren. */
  router.post(
    "/auth/login",
    asyncHandler((req, res) => {
      const body = req.body || {};
      const email = cleanText(body.email);
      const password = typeof body.password === "string" ? body.password : "";

      if (email === "" || password === "") {
        throw badRequest("Fyll inn både e-post og passord.");
      }

      const user = findUserByEmail(db, email);

      /* Samme melding for ukjent e-post og feil passord, så vi ikke
         røper hvilken e-post som finnes. */
      if (!user || !verifyPassword(password, user.password_hash)) {
        throw unauthorized("E-post eller passord er feil.");
      }

      const session = createSession(db, user.id, req.headers["user-agent"]);

      res.cookie(SESSION_COOKIE, session.token, sessionCookieOptions());
      res.json({ user: userToJson(user) });
    }),
  );

  /* Logger ut. Sesjonen slettes, og cookien fjernes i nettleseren. */
  router.post(
    "/auth/logout",
    asyncHandler((req, res) => {
      const token = req.cookies ? req.cookies[SESSION_COOKIE] : null;

      deleteSession(db, token);

      res.clearCookie(SESSION_COOKIE, { path: "/" });
      res.status(204).end();
    }),
  );

  /* Gir den innloggede brukeren. */
  router.get(
    "/auth/me",
    requireAuth(db),
    asyncHandler((req, res) => {
      res.json({ user: userToJson(req.user) });
    }),
  );

  return router;
}

module.exports = { createAuthRouter };
