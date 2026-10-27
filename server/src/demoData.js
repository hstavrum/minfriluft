"use strict";

/* ==========================================================================
   demoData.js – leser demodataene fra modellen og legger dem i databasen

   Modellen i js/model.js inneholder en ferdig demo-database. Her henter vi
   den og legger den inn i databasen, som en bruker med egne lister.

   Brukes av scripts/import-demo.js og av testene i e2e/.
   ========================================================================== */

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const { createUser } = require("./users");

const MODEL_FILE = path.join(__dirname, "..", "..", "public", "js", "model.js");

/* Leser demodataene fra modellfilen. Vi kjører filen i et eget
   sammenheng, slik at vi får tak i model-objektet uten å endre filen. */
function readDemoData() {
  const source = fs.readFileSync(MODEL_FILE, "utf8");
  const context = vm.createContext({});

  vm.runInContext(source + "\n;globalThis.__demoModel = model;", context);

  return context.__demoModel.data;
}

/* Legger inn en liste og gir oss en oversettelse fra den gamle id-en
   til den nye. */
function importList(db, table, column, userId, items, keyName) {
  const insert = db.prepare(`INSERT INTO ${table} (user_id, ${column}) VALUES (?, ?)`);
  const idMap = new Map();

  for (const item of items) {
    const result = insert.run(userId, item[keyName]);

    idMap.set(item.id, Number(result.lastInsertRowid));
  }

  return idMap;
}

/* Lager brukeren og legger inn demodataene. Returnerer antallet turer
   og notater. */
function importDemoData(db, { email, password, displayName = "" }) {
  const demo = readDemoData();

  const user = createUser(db, { email, password, displayName });
  const userId = user.id;

  /* Brukeren får standardlister ved opprettelse. Vi tømmer dem og
     legger inn demodataene i stedet. */
  const importAll = db.transaction(() => {
    for (const table of ["activities", "topics", "counties"]) {
      db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(userId);
    }

    const activityIds = importList(
      db,
      "activities",
      "activity",
      userId,
      demo.activities,
      "activity",
    );
    const topicIds = importList(db, "topics", "topic", userId, demo.topics, "topic");
    const countyIds = importList(db, "counties", "county", userId, demo.counties, "county");

    /* Bildene peker på motiver. Vi trenger derfor bare motiv-id-en. */
    const templateByImageId = new Map();

    for (const image of demo.images) {
      templateByImageId.set(image.id, image.templateId);
    }

    const insertTrip = db.prepare(
      `INSERT INTO trips (user_id, activity_id, county_id, title, location, trip_date, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertTripImage = db.prepare(
      "INSERT INTO trip_images (trip_id, template_id, position) VALUES (?, ?, ?)",
    );

    for (const trip of demo.trips) {
      const result = insertTrip.run(
        userId,
        activityIds.get(trip.activityId) ?? null,
        countyIds.get(trip.countyId) ?? null,
        trip.title,
        trip.location,
        trip.date,
        trip.description,
        trip.updatedAt,
        trip.updatedAt,
      );

      const tripId = Number(result.lastInsertRowid);

      trip.pictures.forEach((imageId, index) => {
        const templateId = templateByImageId.get(imageId);

        if (templateId !== undefined) {
          insertTripImage.run(tripId, templateId, index);
        }
      });
    }

    const insertNote = db.prepare(
      `INSERT INTO notes (user_id, title, note_date, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const insertNoteTopic = db.prepare(
      "INSERT INTO note_topics (note_id, topic_id) VALUES (?, ?)",
    );

    for (const note of demo.notes) {
      const result = insertNote.run(
        userId,
        note.title,
        note.date,
        note.description,
        note.updatedAt,
        note.updatedAt,
      );

      const noteId = Number(result.lastInsertRowid);

      for (const topicId of note.topics) {
        const newTopicId = topicIds.get(topicId);

        if (newTopicId !== undefined) {
          insertNoteTopic.run(noteId, newTopicId);
        }
      }
    }
  });

  importAll();

  return { user, trips: demo.trips.length, notes: demo.notes.length };
}

module.exports = { readDemoData, importDemoData, MODEL_FILE };
