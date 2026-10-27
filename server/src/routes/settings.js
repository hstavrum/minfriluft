"use strict";

/* ==========================================================================
   routes/settings.js – brukerens lister

   Aktiviteter, emneknagger og fylker tilhører hver sin bruker. En verdi
   som brukes av en tur eller et notat, kan ikke slettes. Da ville turen
   stått igjen med en verdi som ikke finnes.
   ========================================================================== */

const express = require("express");

const { asyncHandler, badRequest, conflict, notFound, parseId, cleanText } = require("../http");

/* De tre listene har samme form. Derfor beskriver vi dem med en
   beskrivelse, og går gjennom dem med én funksjon. */
const LISTS = {
  activities: {
    table: "activities",
    column: "activity",
    label: "Aktiviteten",
    /* Hva som gjør at verdien er i bruk. */
    inUse: (db, id) =>
      db.prepare("SELECT 1 FROM trips WHERE activity_id = ? LIMIT 1").get(id) !== undefined,
    inUseMessage: "Aktiviteten er brukt av en tur, og kan ikke slettes.",
  },
  topics: {
    table: "topics",
    column: "topic",
    label: "Emneknaggen",
    inUse: (db, id) =>
      db.prepare("SELECT 1 FROM notes WHERE id IN (SELECT note_id FROM note_topics WHERE topic_id = ?) LIMIT 1").get(id) !==
      undefined,
    inUseMessage: "Emneknaggen er brukt av et notat, og kan ikke slettes.",
  },
  counties: {
    table: "counties",
    column: "county",
    label: "Fylket",
    inUse: (db, id) =>
      db.prepare("SELECT 1 FROM trips WHERE county_id = ? LIMIT 1").get(id) !== undefined,
    inUseMessage: "Fylket er brukt av en tur, og kan ikke slettes.",
  },
};

/* Sjekker navnet før det lagres. Samme regler som i frontendens
   desktopGetNewName(). Vi godtar både {name} og {activity}/{topic}/{county}. */
function readName(list, body) {
  const name = cleanText(body.name || body[list.column]);

  if (name === "") {
    throw badRequest("Navnet kan ikke være tomt.");
  }

  return name;
}

/* Finner en verdi som allerede finnes, uten skilletegn mellom store og
   små bokstaver. */
function nameIsTaken(db, list, userId, name) {
  const row = db
    .prepare(
      `SELECT id FROM ${list.table} WHERE user_id = ? AND ${list.column} = ? COLLATE NOCASE`,
    )
    .get(userId, name);

  return row !== undefined;
}

function createSettingsRouter(db) {
  const router = express.Router();

  /* Alle tre listene. */
  router.get(
    "/settings",
    asyncHandler((req, res) => {
      const result = {};

      for (const [key, list] of Object.entries(LISTS)) {
        /* Vi gir kolonnen sitt eget navn tilbake, slik at svaret ser
           ut som modellen: {id, activity}, {id, topic}, {id, county}. */
        const rows = db
          .prepare(`SELECT id, ${list.column} FROM ${list.table} WHERE user_id = ? ORDER BY ${list.column}`)
          .all(req.user.id);

        result[key] = rows;
      }

      res.json(result);
    }),
  );

  /* Legger til en verdi i en av listene. */
  router.post(
    "/settings/:listName",
    asyncHandler((req, res) => {
      const list = LISTS[req.params.listName];

      if (!list) {
        throw notFound("Fant ikke innstillingene.");
      }

      const name = readName(list, req.body || {});

      if (nameIsTaken(db, list, req.user.id, name)) {
        throw conflict(list.label + " «" + name + "» finnes allerede.");
      }

      const result = db
        .prepare(`INSERT INTO ${list.table} (user_id, ${list.column}) VALUES (?, ?)`)
        .run(req.user.id, name);

      res.status(201).json({
        item: { id: Number(result.lastInsertRowid), [list.column]: name },
      });
    }),
  );

  /* Sletter en verdi. Verdier som er i bruk blir nektet. */
  router.delete(
    "/settings/:listName/:itemId",
    asyncHandler((req, res) => {
      const list = LISTS[req.params.listName];

      if (!list) {
        throw notFound("Fant ikke innstillingene.");
      }

      const itemId = parseId(req.params.itemId, "id");

      const row = db
        .prepare(`SELECT id FROM ${list.table} WHERE id = ? AND user_id = ?`)
        .get(itemId, req.user.id);

      if (!row) {
        throw notFound("Fant ikke " + list.label.toLowerCase() + ".");
      }

      if (list.inUse(db, itemId)) {
        throw conflict(list.inUseMessage);
      }

      db.prepare(`DELETE FROM ${list.table} WHERE id = ? AND user_id = ?`).run(itemId, req.user.id);

      res.status(204).end();
    }),
  );

  return router;
}

module.exports = { createSettingsRouter, LISTS };
