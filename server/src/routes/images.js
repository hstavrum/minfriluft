"use strict";

/* ==========================================================================
   routes/images.js – bildene på en tur

   Bildene ligger i tabellen trip_images, der position er rekkefølgen i
   bildekarusellen. Ett bilde kjennes igjen på plasseringen, fordi det
   kan være samme motiv flere ganger på én tur.
   ========================================================================== */

const express = require("express");

const {
  asyncHandler,
  badRequest,
  notFound,
  parseId,
} = require("../http");
const {
  findMissingTemplates,
  getTripPictureTemplateIds,
  replaceTripImages,
} = require("../store");

/* Finner turen, men bare hvis den tilhører den innloggede brukeren. */
function findTrip(db, userId, tripId) {
  return db
    .prepare("SELECT * FROM trips WHERE id = ? AND user_id = ?")
    .get(tripId, userId);
}

/* Plasseringen i listen starter på 0, slik som i svaret fra GET. */
function parsePosition(value) {
  const position = Number(value);

  if (!Number.isInteger(position) || position < 0) {
    throw badRequest("Ugyldig plassering.");
  }

  return position;
}

/* Bildene som JSON. */
function imagesToJson(db, tripId) {
  return getTripPictureTemplateIds(db, tripId).map((templateId, position) => ({
    position,
    templateId,
  }));
}

function createImagesRouter(db) {
  const router = express.Router();

  /* Alle bildene på turen, i rekkefølge. */
  router.get(
    "/trips/:tripId/images",
    asyncHandler((req, res) => {
      const tripId = parseId(req.params.tripId, "tur-id");

      if (!findTrip(db, req.user.id, tripId)) {
        throw notFound("Fant ikke turen.");
      }

      res.json({ images: imagesToJson(db, tripId) });
    }),
  );

  /* Legger til ett bilde på slutten. */
  router.post(
    "/trips/:tripId/images",
    asyncHandler((req, res) => {
      const tripId = parseId(req.params.tripId, "tur-id");

      if (!findTrip(db, req.user.id, tripId)) {
        throw notFound("Fant ikke turen.");
      }

      const body = req.body || {};
      const templateId = Number(body.templateId);

      if (!Number.isInteger(templateId) || templateId <= 0) {
        throw badRequest("Ugyldig bilde-id.");
      }

      if (findMissingTemplates(db, [templateId]).length > 0) {
        throw badRequest("Bildet finnes ikke.");
      }

      const templateIds = getTripPictureTemplateIds(db, tripId);

      templateIds.push(templateId);

      const replaceImages = db.transaction(() => {
        replaceTripImages(db, tripId, templateIds);
      });

      replaceImages();

      res.status(201).json({
        image: { position: templateIds.length - 1, templateId },
        images: imagesToJson(db, tripId),
      });
    }),
  );

  /* Bytter om rekkefølgen, eller bytter ut hele listen. */
  router.put(
    "/trips/:tripId/images",
    asyncHandler((req, res) => {
      const tripId = parseId(req.params.tripId, "tur-id");

      if (!findTrip(db, req.user.id, tripId)) {
        throw notFound("Fant ikke turen.");
      }

      const body = req.body || {};
      const source = Array.isArray(body.templateIds) ? body.templateIds : body.pictures;

      if (!Array.isArray(source)) {
        throw badRequest("Ugyldig liste med bilder.");
      }

      const templateIds = source.map((entry) => {
        const id = Number(entry);

        if (!Number.isInteger(id) || id <= 0) {
          throw badRequest("Ugyldig bilde-id.");
        }

        return id;
      });

      if (findMissingTemplates(db, templateIds).length > 0) {
        throw badRequest("Bildet finnes ikke.");
      }

      const replaceImages = db.transaction(() => {
        replaceTripImages(db, tripId, templateIds);
      });

      replaceImages();

      res.json({ images: imagesToJson(db, tripId) });
    }),
  );

  /* Sletter ett bilde. Resten får ny, sammenhengende nummerering. */
  router.delete(
    "/trips/:tripId/images/:position",
    asyncHandler((req, res) => {
      const tripId = parseId(req.params.tripId, "tur-id");
      const position = parsePosition(req.params.position);

      if (!findTrip(db, req.user.id, tripId)) {
        throw notFound("Fant ikke turen.");
      }

      const templateIds = getTripPictureTemplateIds(db, tripId);

      if (position >= templateIds.length) {
        throw notFound("Fant ikke bildet.");
      }

      templateIds.splice(position, 1);

      const replaceImages = db.transaction(() => {
        replaceTripImages(db, tripId, templateIds);
      });

      replaceImages();

      res.status(204).end();
    }),
  );

  return router;
}

module.exports = { createImagesRouter };
