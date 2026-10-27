"use strict";

/* ==========================================================================
   routes/notes.js – notater

   Notatene tilhører en bruker, og emneknaggene hører til brukerens egen
   liste. Et notat og emneknaggene lagres i én transaksjon.
   ========================================================================== */

const express = require("express");

const {
  asyncHandler,
  badRequest,
  notFound,
  parseId,
  cleanText,
} = require("../http");
const {
  nowTimestamp,
  findMissingTopics,
  getNoteTopicIds,
  replaceNoteTopics,
} = require("../store");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/* Leser datoen og sjekker at den er gyldig. */
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

/* Leser listen med emneknagg-id-er. Duplikater fjernes, siden en
   emneknagg ikke kan stå to ganger på samme notat. */
function readTopicIds(value) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw badRequest("Ugyldig liste med emneknagger.");
  }

  const ids = [];

  for (const entry of value) {
    const id = Number(entry);

    if (!Number.isInteger(id) || id <= 0) {
      throw badRequest("Ugyldig emneknagg-id.");
    }

    if (!ids.includes(id)) {
      ids.push(id);
    }
  }

  return ids;
}

/* Gjør en notatrad om til JSON. */
function noteToJson(db, row) {
  return {
    id: row.id,
    title: row.title,
    date: row.note_date,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    topics: getNoteTopicIds(db, row.id),
  };
}

/* Leser og sjekker et notat fra forespørselen. */
function readNoteInput(db, userId, body) {
  const title = cleanText(body.title);
  const date = readDate(body.date);

  if (title === "" || date === "") {
    throw badRequest("Tittel og dato må være fyllt inn.");
  }

  const topics = readTopicIds(body.topics);

  if (findMissingTopics(db, userId, topics).length > 0) {
    throw badRequest("Emneknaggen finnes ikke.");
  }

  return {
    title,
    date,
    description: typeof body.description === "string" ? body.description : "",
    topics,
  };
}

function createNotesRouter(db) {
  const router = express.Router();

  const selectNote = db.prepare("SELECT * FROM notes WHERE id = ? AND user_id = ?");

  /* Alle notatene til brukeren, nyeste først. */
  router.get(
    "/notes",
    asyncHandler((req, res) => {
      const rows = db
        .prepare("SELECT * FROM notes WHERE user_id = ? ORDER BY note_date DESC, id DESC")
        .all(req.user.id);

      res.json({ notes: rows.map((row) => noteToJson(db, row)) });
    }),
  );

  /* Étt notat. */
  router.get(
    "/notes/:noteId",
    asyncHandler((req, res) => {
      const noteId = parseId(req.params.noteId, "notat-id");
      const row = selectNote.get(noteId, req.user.id);

      if (!row) {
        throw notFound("Fant ikke notatet.");
      }

      res.json({ note: noteToJson(db, row) });
    }),
  );

  /* Lager et nytt notat. */
  router.post(
    "/notes",
    asyncHandler((req, res) => {
      const input = readNoteInput(db, req.user.id, req.body || {});
      const now = nowTimestamp();

      const saveNote = db.transaction(() => {
        const result = db
          .prepare(
            `INSERT INTO notes (user_id, title, note_date, description, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .run(req.user.id, input.title, input.date, input.description, now, now);

        const noteId = Number(result.lastInsertRowid);

        replaceNoteTopics(db, noteId, input.topics);

        return noteId;
      });

      const noteId = saveNote();

      res.status(201).json({ note: noteToJson(db, selectNote.get(noteId, req.user.id)) });
    }),
  );

  /* Endrer et notat. Emneknaggene byttes ut, så en emneknagg som ble
     fjernet i skjemaet forsvinner. */
  router.put(
    "/notes/:noteId",
    asyncHandler((req, res) => {
      const noteId = parseId(req.params.noteId, "notat-id");
      const row = selectNote.get(noteId, req.user.id);

      if (!row) {
        throw notFound("Fant ikke notatet.");
      }

      const input = readNoteInput(db, req.user.id, req.body || {});
      const now = nowTimestamp();

      const saveNote = db.transaction(() => {
        db.prepare(
          `UPDATE notes
              SET title = ?, note_date = ?, description = ?, updated_at = ?
            WHERE id = ? AND user_id = ?`,
        ).run(input.title, input.date, input.description, now, noteId, req.user.id);

        replaceNoteTopics(db, noteId, input.topics);
      });

      saveNote();

      res.json({ note: noteToJson(db, selectNote.get(noteId, req.user.id)) });
    }),
  );

  /* Sletter et notat. Emneknaggene slettes av seg selv, takket være
     ON DELETE CASCADE. */
  router.delete(
    "/notes/:noteId",
    asyncHandler((req, res) => {
      const noteId = parseId(req.params.noteId, "notat-id");
      const row = selectNote.get(noteId, req.user.id);

      if (!row) {
        throw notFound("Fant ikke notatet.");
      }

      db.prepare("DELETE FROM notes WHERE id = ? AND user_id = ?").run(noteId, req.user.id);

      res.status(204).end();
    }),
  );

  return router;
}

module.exports = { createNotesRouter };
