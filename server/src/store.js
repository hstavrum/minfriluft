"use strict";

/* ==========================================================================
   store.js – delte spørringer mot databasen

   Her ligger hjelpefunksjoner som flere ruter trenger: tidsstempel,
   oppslag i brukerens lister og håndtering av bildene på en tur.
   ========================================================================== */

const { badRequest } = require("./http");

/* Tidsstempel i samme format som modellen bruker, men med sekunder og
   uttrykt i UTC: 2026-10-23T13:36:00Z */
function nowTimestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/* Alle bildemotivene. De er felles for alle brukere. */
function getImageTemplates(db) {
  return db.prepare("SELECT id, label, svg FROM image_templates ORDER BY id").all();
}

/* Sjekker at alle motivene finnes. Returnerer de som mangler. */
function findMissingTemplates(db, templateIds) {
  if (templateIds.length === 0) {
    return [];
  }

  const placeholders = templateIds.map(() => "?").join(", ");
  const found = db
    .prepare(`SELECT id FROM image_templates WHERE id IN (${placeholders})`)
    .all(...templateIds)
    .map((row) => row.id);

  return templateIds.filter((id) => !found.includes(id));
}

/* Sjekker at en aktivitet tilhører brukeren. */
function assertActivityExists(db, userId, activityId) {
  if (activityId === null) {
    return;
  }

  const row = db
    .prepare("SELECT id FROM activities WHERE id = ? AND user_id = ?")
    .get(activityId, userId);

  if (!row) {
    throw badRequest("Aktiviteten finnes ikke.");
  }
}

/* Sjekker at et fylke tilhører brukeren. */
function assertCountyExists(db, userId, countyId) {
  if (countyId === null) {
    return;
  }

  const row = db
    .prepare("SELECT id FROM counties WHERE id = ? AND user_id = ?")
    .get(countyId, userId);

  if (!row) {
    throw badRequest("Fylket finnes ikke.");
  }
}

/* Sjekker at emneknaggene tilhører brukeren. Returnerer de som mangler. */
function findMissingTopics(db, userId, topicIds) {
  if (topicIds.length === 0) {
    return [];
  }

  const placeholders = topicIds.map(() => "?").join(", ");
  const found = db
    .prepare(`SELECT id FROM topics WHERE id IN (${placeholders}) AND user_id = ?`)
    .all(...topicIds, userId)
    .map((row) => row.id);

  return topicIds.filter((id) => !found.includes(id));
}

/* Motivene på en tur, i den rekkefølgen de står. */
function getTripPictureTemplateIds(db, tripId) {
  return db
    .prepare("SELECT template_id FROM trip_images WHERE trip_id = ? ORDER BY position")
    .all(tripId)
    .map((row) => row.template_id);
}

/* Legger inn bildene på en tur. Brukes inne i en transaksjon. */
function insertTripImages(db, tripId, templateIds) {
  const insert = db.prepare(
    "INSERT INTO trip_images (trip_id, template_id, position) VALUES (?, ?, ?)",
  );

  templateIds.forEach((templateId, index) => {
    insert.run(tripId, templateId, index);
  });
}

/* Sletter bildene på en tur og legger inn de nye. */
function replaceTripImages(db, tripId, templateIds) {
  db.prepare("DELETE FROM trip_images WHERE trip_id = ?").run(tripId);
  insertTripImages(db, tripId, templateIds);
}

/* Emneknaggene til et notat. */
function getNoteTopicIds(db, noteId) {
  return db
    .prepare("SELECT topic_id FROM note_topics WHERE note_id = ? ORDER BY topic_id")
    .all(noteId)
    .map((row) => row.topic_id);
}

/* Legger inn emneknaggene til et notat. */
function insertNoteTopics(db, noteId, topicIds) {
  const insert = db.prepare(
    "INSERT INTO note_topics (note_id, topic_id) VALUES (?, ?)",
  );

  for (const topicId of topicIds) {
    insert.run(noteId, topicId);
  }
}

/* Sletter emneknaggene til et notat og legger inn de nye. */
function replaceNoteTopics(db, noteId, topicIds) {
  db.prepare("DELETE FROM note_topics WHERE note_id = ?").run(noteId);
  insertNoteTopics(db, noteId, topicIds);
}

module.exports = {
  nowTimestamp,
  getImageTemplates,
  findMissingTemplates,
  assertActivityExists,
  assertCountyExists,
  findMissingTopics,
  getTripPictureTemplateIds,
  insertTripImages,
  replaceTripImages,
  getNoteTopicIds,
  insertNoteTopics,
  replaceNoteTopics,
};
