"use strict";

/* ==========================================================================
   users.js – brukerkontoer og standardlister

   En bruker får sine egne lister med aktiviteter, emneknagger og fylker,
   akkurat som i modellen. Liene legges inn i samme transaksjon som
   brukeren, så en bruker aldri får en konto uten lister.
   ========================================================================== */

const bcrypt = require("bcrypt");
const { badRequest } = require("./http");

/* Standardlister, de samme som i modellen. */
const DEFAULT_ACTIVITIES = [
  "Bærtur",
  "Båttur",
  "Gåtur",
  "Fisketur",
  "Klatring",
  "Skitur",
  "Sykkeltur",
];

const DEFAULT_TOPICS = ["Planlegging", "Utstyr", "Refleksjon", "Mål", "Tips"];

const DEFAULT_COUNTIES = ["Agder", "Innlandet", "Oslo", "Rogaland", "Vestfold"];

const BCRYPT_COST = 12;

/* Finner en bruker på e-post. E-posten sammenlignes uten skilletegn,
   fordi kolonnen er satt til COLLATE NOCASE. */
function findUserByEmail(db, email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(String(email || "").trim());
}

function findUserById(db, id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

/* Lager en bruker med standardlister. Kaster 400 hvis e-posten er
   tatt. */
function createUser(db, { email, password, displayName = "" }) {
  const cleanEmail = String(email || "").trim();
  const cleanPassword = String(password || "");

  if (cleanEmail === "") {
    throw badRequest("E-post må være fyllt inn.");
  }

  if (cleanPassword.length < 8) {
    throw badRequest("Passordet må ha minst 8 tegn.");
  }

  if (findUserByEmail(db, cleanEmail)) {
    throw badRequest("E-posten «" + cleanEmail + "» finnes allerede.");
  }

  const passwordHash = bcrypt.hashSync(cleanPassword, BCRYPT_COST);

  const createUserWithLists = db.transaction(() => {
    const result = db
      .prepare(
        "INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)",
      )
      .run(cleanEmail, passwordHash, String(displayName || "").trim());

    const userId = Number(result.lastInsertRowid);

    const insertActivity = db.prepare(
      "INSERT INTO activities (user_id, activity) VALUES (?, ?)",
    );
    for (const activity of DEFAULT_ACTIVITIES) {
      insertActivity.run(userId, activity);
    }

    const insertTopic = db.prepare("INSERT INTO topics (user_id, topic) VALUES (?, ?)");
    for (const topic of DEFAULT_TOPICS) {
      insertTopic.run(userId, topic);
    }

    const insertCounty = db.prepare(
      "INSERT INTO counties (user_id, county) VALUES (?, ?)",
    );
    for (const county of DEFAULT_COUNTIES) {
      insertCounty.run(userId, county);
    }

    return userId;
  });

  const userId = createUserWithLists();

  return findUserById(db, userId);
}

/* Sjekker passordet mot hashen. */
function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compareSync(String(plainPassword || ""), String(passwordHash || ""));
}

/* Gjør en bruker om til JSON. Passordet blir aldri sendt ut. */
function userToJson(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    createdAt: user.created_at,
  };
}

module.exports = {
  DEFAULT_ACTIVITIES,
  DEFAULT_TOPICS,
  DEFAULT_COUNTIES,
  BCRYPT_COST,
  findUserByEmail,
  findUserById,
  createUser,
  verifyPassword,
  userToJson,
};
