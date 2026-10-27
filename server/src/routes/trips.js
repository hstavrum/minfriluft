"use strict";

/* ==========================================================================
   routes/trips.js – turer

   Alle spørringene filtrerer på user_id, så en bruker bare ser sine
   egne turer. En tur som tilhører en annen bruker svarer 404, ikke 403,
   slik at vi ikke røper at den finnes.
   ========================================================================== */

const express = require("express");

const {
  asyncHandler,
  badRequest,
  notFound,
  parseId,
  toNullableId,
  cleanText,
} = require("../http");
const {
  nowTimestamp,
  assertActivityExists,
  assertCountyExists,
  findMissingTemplates,
  getTripPictureTemplateIds,
  replaceTripImages,
} = require("../store");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/* Leser datoen og sjekker at den er en gyldig dato. */
function readDate(value) {
  const date = cleanText(value);

  if (date === "") {
    return "";
  }

  if (!DATE_PATTERN.test(date)) {
    throw badRequest("Datoen må være på formatet YYYY-MM-DD.");
  }

  const parsed = new Date(date + "T00:00:00Z");

  if (Number.isNaN(parsed.getTime())) {
    throw badRequest("Datoen er ikke gyldig.");
  }

  return date;
}

/* Leser listen med motiv-id-er. */
function readTemplateIds(value) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw badRequest("Ugyldig liste med bilder.");
  }

  return value.map((entry) => {
    const id = Number(entry);

    if (!Number.isInteger(id) || id <= 0) {
      throw badRequest("Ugyldig bilde-id.");
    }

    return id;
  });
}

/* Gjør en turrad om til JSON, slik frontendens modell forventer. */
function tripToJson(db, row) {
  return {
    id: row.id,
    activityId: row.activity_id,
    countyId: row.county_id,
    title: row.title,
    location: row.location,
    date: row.trip_date,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pictures: getTripPictureTemplateIds(db, row.id),
  };
}

/* Leser og sjekker en tur fra forespørselen. */
function readTripInput(db, userId, body) {
  const title = cleanText(body.title);
  const date = readDate(body.date);

  if (title === "" || date === "") {
    throw badRequest("Tittel og dato må være fyllt inn.");
  }

  const activityId = toNullableId(body.activityId);
  const countyId = toNullableId(body.countyId);

  assertActivityExists(db, userId, activityId);
  assertCountyExists(db, userId, countyId);

  const pictures = readTemplateIds(body.pictures);

  if (findMissingTemplates(db, pictures).length > 0) {
    throw badRequest("Bildet finnes ikke.");
  }

  return {
    title,
    date,
    activityId,
    countyId,
    location: cleanText(body.location),
    description: typeof body.description === "string" ? body.description : "",
    pictures,
  };
}

function createTripsRouter(db) {
  const router = express.Router();

  const selectTrip = db.prepare("SELECT * FROM trips WHERE id = ? AND user_id = ?");

  /* Alle turene til brukeren, nyeste først. */
  router.get(
    "/trips",
    asyncHandler((req, res) => {
      const rows = db
        .prepare("SELECT * FROM trips WHERE user_id = ? ORDER BY trip_date DESC, id DESC")
        .all(req.user.id);

      res.json({ trips: rows.map((row) => tripToJson(db, row)) });
    }),
  );

  /* Én tur. */
  router.get(
    "/trips/:tripId",
    asyncHandler((req, res) => {
      const tripId = parseId(req.params.tripId, "tur-id");
      const row = selectTrip.get(tripId, req.user.id);

      if (!row) {
        throw notFound("Fant ikke turen.");
      }

      res.json({ trip: tripToJson(db, row) });
    }),
  );

  /* Lager en ny tur. Turen og bildene lagres i én transaksjon, slik at
     vi aldri får en tur uten bildene. */
  router.post(
    "/trips",
    asyncHandler((req, res) => {
      const input = readTripInput(db, req.user.id, req.body || {});
      const now = nowTimestamp();

      const saveTrip = db.transaction(() => {
        const result = db
          .prepare(
            `INSERT INTO trips
               (user_id, activity_id, county_id, title, location, trip_date, description, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            req.user.id,
            input.activityId,
            input.countyId,
            input.title,
            input.location,
            input.date,
            input.description,
            now,
            now,
          );

        const tripId = Number(result.lastInsertRowid);

        replaceTripImages(db, tripId, input.pictures);

        return tripId;
      });

      const tripId = saveTrip();

      res.status(201).json({ trip: tripToJson(db, selectTrip.get(tripId, req.user.id)) });
    }),
  );

  /* Endrer en tur. */
  router.put(
    "/trips/:tripId",
    asyncHandler((req, res) => {
      const tripId = parseId(req.params.tripId, "tur-id");
      const row = selectTrip.get(tripId, req.user.id);

      if (!row) {
        throw notFound("Fant ikke turen.");
      }

      const input = readTripInput(db, req.user.id, req.body || {});
      const now = nowTimestamp();

      const saveTrip = db.transaction(() => {
        db.prepare(
          `UPDATE trips
              SET activity_id = ?, county_id = ?, title = ?, location = ?,
                  trip_date = ?, description = ?, updated_at = ?
            WHERE id = ? AND user_id = ?`,
        ).run(
          input.activityId,
          input.countyId,
          input.title,
          input.location,
          input.date,
          input.description,
          now,
          tripId,
          req.user.id,
        );

        replaceTripImages(db, tripId, input.pictures);
      });

      saveTrip();

      res.json({ trip: tripToJson(db, selectTrip.get(tripId, req.user.id)) });
    }),
  );

  /* Sletter en tur. Bildene på turen slettes av seg selv, takket være
     ON DELETE CASCADE. */
  router.delete(
    "/trips/:tripId",
    asyncHandler((req, res) => {
      const tripId = parseId(req.params.tripId, "tur-id");
      const row = selectTrip.get(tripId, req.user.id);

      if (!row) {
        throw notFound("Fant ikke turen.");
      }

      db.prepare("DELETE FROM trips WHERE id = ? AND user_id = ?").run(tripId, req.user.id);

      res.status(204).end();
    }),
  );

  return router;
}

module.exports = { createTripsRouter, tripToJson, readTemplateIds };
