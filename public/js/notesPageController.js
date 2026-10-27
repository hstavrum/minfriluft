/* ==========================================================================
   notesPageController.js – Controller for notatene

   Notatene lagres i API-et, så funksjonene som lagrer eller sletter noe
   er asynkrone.

   Funksjoner:
     saveNote()          // Lagrer et nytt notat, eller endrer et eksisterende
     cancelSaveNote()    // Avbryter et notat-skjema
     openNote(id)        // Åpner et notat
     editNote()          // Åpner et eksisterende notat i skjemaet
     toggleTopic(topicId)// Slår en emneknagg av og på
     deleteNote()        // Sletter notatet
     duplicateNote()     // Lager en kopi av notatet
     selectedNote()      // Skjemaet vi står i
   ========================================================================== */

/* En tom notatform. */
function emptyNoteForm() {
  return {
    noteId: null,
    title: "",
    date: "",
    description: "",
    topics: [],
    errorMessage: "",
  };
}

/* Skjemaet vi står i: enten et nytt notat, eller et vi endrer. */
function selectedNote() {
  const viewState = model.viewState;

  if (viewState.noteViewPage.isEditing) {
    return viewState.editNotePage;
  }

  return viewState.newNotePage;
}

/* Gjør et notat-skjema om til det serveren forventer. */
function notePayload(form) {
  return {
    title: form.title.trim(),
    date: form.date,
    description: form.description,
    topics: form.topics.slice(),
  };
}

async function saveNote() {
  const viewState = model.viewState;
  const isEdit = viewState.noteViewPage.isEditing;
  const form = selectedNote();

  if (form.title.trim() === "" || form.date === "") {
    form.errorMessage = "Tittel og dato må være fyllt inn.";
    updateView();
    return;
  }

  let saved;

  try {
    if (isEdit) {
      saved = await api.updateNote(form.noteId, notePayload(form));
    } else {
      saved = await api.createNote(notePayload(form));
    }
  } catch (error) {
    form.errorMessage = error.message;
    updateView();
    return;
  }

  if (isEdit) {
    /* Vi bytter ut notatet i modellen med den serveren sendte tilbake. */
    const index = findIndexById(model.data.notes, saved.note.id);

    if (index !== -1) {
      model.data.notes[index] = saved.note;
    }
  } else {
    model.data.notes.push(saved.note);
  }

  /* Skjemaet skal ikke ligge igjen som et utkast. */
  viewState.newNotePage = emptyNoteForm();
  viewState.editNotePage = emptyNoteForm();
  viewState.noteViewPage.isEditing = false;

  openNote(saved.note.id);
}

function cancelSaveNote() {
  const viewState = model.viewState;

  viewState.newNotePage = emptyNoteForm();
  viewState.editNotePage = emptyNoteForm();
  viewState.noteViewPage.isEditing = false;

  goToPage(viewState.noteViewPage.noteId === null ? "notesPage" : "noteViewPage");
}

function openNote(id) {
  model.viewState.noteViewPage.noteId = id;
  goToPage("noteViewPage");
}

/* Starter et nytt notat. Vi setter dagens dato, slik at brukeren
   slipper å skrive den selv. */
function startNewNote() {
  const form = model.viewState.newNotePage;

  form.date = getTodayAsDateText();
  form.errorMessage = "";

  model.viewState.noteViewPage.isEditing = false;

  goToPage("editNotePage");
}

function editNote() {
  const viewState = model.viewState;
  const note = findObjectById(model.data.notes, viewState.noteViewPage.noteId);

  if (!note) {
    return;
  }

  /* Skjemaet er et arbeidsutkast, så vi kopierer verdiene fra notatet,
     i stedet for å endre notatet i modellen direkte. */
  viewState.editNotePage = {
    noteId: note.id,
    title: note.title,
    date: note.date,
    description: note.description,
    topics: note.topics.slice(),
    errorMessage: "",
  };

  viewState.noteViewPage.isEditing = true;
  goToPage("editNotePage");
}

function toggleTopic(topicId) {
  const topics = selectedNote().topics;

  if (topics.includes(topicId)) {
    for (let i = 0; i < topics.length; i++) {
      if (topics[i] === topicId) {
        topics.splice(i, 1);
      }
    }
  } else {
    topics.push(topicId);
  }

  updateView();
}

async function deleteNote() {
  const viewState = model.viewState;
  const note = findObjectById(model.data.notes, viewState.noteViewPage.noteId);

  if (!note) {
    return;
  }

  try {
    await api.deleteNote(note.id);
  } catch (error) {
    viewState.noteViewPage.errorMessage = error.message;
    updateView();
    return;
  }

  const index = findIndexById(model.data.notes, note.id);

  if (index !== -1) {
    model.data.notes.splice(index, 1);
  }

  viewState.noteViewPage.noteId = null;
  viewState.noteViewPage.errorMessage = "";

  goToPage("notesPage");
}

async function duplicateNote() {
  const viewState = model.viewState;
  const note = findObjectById(model.data.notes, viewState.noteViewPage.noteId);

  if (!note) {
    return;
  }

  let created;

  try {
    created = await api.createNote({
      title: note.title + " (kopi)",
      date: note.date,
      description: note.description,
      topics: note.topics.slice(),
    });
  } catch (error) {
    viewState.noteViewPage.errorMessage = error.message;
    updateView();
    return;
  }

  model.data.notes.push(created.note);

  viewState.noteViewPage.noteId = created.note.id;
  viewState.noteViewPage.isMenuOpen = false;
  viewState.noteViewPage.errorMessage = "";

  updateView();
}

function resetNoteActions() {
  const note = model.viewState.noteViewPage;

  note.noteId = null;
  note.isEditing = false;
}
