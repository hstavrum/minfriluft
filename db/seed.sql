-- ==========================================================================
-- Min friluft – seed data
--
-- Kjøres én gang, rett etter at skjemaet er opprettet.
-- Inneholder de faste referansedataene som alle brukere deler:
-- bildemotiver og sesonger.
--
-- Brukerens egne lister (aktiviteter, emneknagger, fylker) legges inn
-- av serveren når en ny bruker opprettes, ikke her.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Bildemotiver. id-ene 1-6 er de samme som templateId i modellen.
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO image_templates (id, label, svg) VALUES
  (1, 'Fjell', '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#cfe8ff"/><circle cx="76" cy="22" r="8" fill="#ffd54f"/><path d="M0 100 L35 35 L60 70 L75 50 L100 100 Z" fill="#78909c"/></svg>'),
  (2, 'Skog', '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#e8f5e9"/><circle cx="20" cy="20" r="10" fill="#fff59d"/><path d="M0 100 L30 40 L55 100 Z" fill="#2e7d32"/><path d="M45 100 L72 32 L100 100 Z" fill="#1b5e20"/></svg>'),
  (3, 'Innsjø', '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#e1f5fe"/><path d="M0 58 L30 28 L55 58 Z" fill="#90a4ae"/><rect y="58" width="100" height="42" fill="#4fc3f7"/><line x1="0" y1="58" x2="100" y2="58" stroke="#0288d1" stroke-width="2"/></svg>'),
  (4, 'Snø', '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#e3f2fd"/><path d="M0 100 L50 18 L100 100 Z" fill="#eceff1"/><path d="M34 45 L50 18 L66 45 L50 37 Z" fill="#ffffff"/></svg>'),
  (5, 'Solnedgang', '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#ffe0b2"/><rect width="100" height="58" fill="#ffab91"/><circle cx="50" cy="58" r="14" fill="#fff176"/><path d="M0 100 L30 68 L60 100 Z" fill="#6d4c41"/></svg>'),
  (6, 'Kyst', '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#b3e5fc"/><path d="M8 54 L30 34 L46 54 Z" fill="#8d6e63"/><rect y="54" width="100" height="46" fill="#0288d1"/><line x1="0" y1="54" x2="100" y2="54" stroke="#01579b" stroke-width="2"/></svg>');

-- --------------------------------------------------------------------------
-- Sesonger. id-ene 1-5 er de samme som i modellen.
-- Vinter går over årsskiftet, derfor start_month > end_month.
-- "Alle" (id 5) er et filter, ikke en sesong: is_all = 1.
-- --------------------------------------------------------------------------
INSERT OR REPLACE INTO seasons (id, season, start_month, end_month, is_all) VALUES
  (1, 'Vår',    3,  5, 0),
  (2, 'Sommer', 6,  8, 0),
  (3, 'Høst',   9, 11, 0),
  (4, 'Vinter',12,  2, 0),
  (5, 'Alle',   1, 12, 1);

-- --------------------------------------------------------------------------
-- Standardlister for en ny bruker.
--
-- Kalles fra serveren når brukeren opprettes, inne i én transaksjon.
-- --------------------------------------------------------------------------
-- INSERT INTO activities (user_id, activity) VALUES (?, 'Bærtur');
-- INSERT INTO activities (user_id, activity) VALUES (?, 'Båttur');
-- INSERT INTO activities (user_id, activity) VALUES (?, 'Gåtur');
-- INSERT INTO activities (user_id, activity) VALUES (?, 'Fisketur');
-- INSERT INTO activities (user_id, activity) VALUES (?, 'Klatring');
-- INSERT INTO activities (user_id, activity) VALUES (?, 'Skitur');
-- INSERT INTO activities (user_id, activity) VALUES (?, 'Sykkeltur');
--
-- INSERT INTO topics (user_id, topic) VALUES (?, 'Planlegging');
-- INSERT INTO topics (user_id, topic) VALUES (?, 'Utstyr');
-- INSERT INTO topics (user_id, topic) VALUES (?, 'Refleksjon');
-- INSERT INTO topics (user_id, topic) VALUES (?, 'Mål');
-- INSERT INTO topics (user_id, topic) VALUES (?, 'Tips');
--
-- INSERT INTO counties (user_id, county) VALUES (?, 'Agder');
-- INSERT INTO counties (user_id, county) VALUES (?, 'Innlandet');
-- INSERT INTO counties (user_id, county) VALUES (?, 'Oslo');
-- INSERT INTO counties (user_id, county) VALUES (?, 'Rogaland');
-- INSERT INTO counties (user_id, county) VALUES (?, 'Vestfold');
