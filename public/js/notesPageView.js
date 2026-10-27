function updateViewNotesPage() {
    const html = /*HTML*/ `
        <div class="page-notes" style="display: flex; justify-content: center;">
            <div class="phone-frame">
                ${createStatusBarHtml()}
                
                <header class="app-header">
                    <h1>Notater</h1>
                </header>                    

                ${createMainContent(model.app.currentPage)} 

                ${createFooter(model.app.currentPage)}
            </div>
        </div>
    `;
    document.getElementById("app").innerHTML = html;
}

function updateViewEditNotesPage() {
    const html = /*HTML*/ `
        <div class="page-notes" style="display: flex; justify-content: center;">
            <div class="phone-frame">
                ${createStatusBarHtml()}
                
                <header class="app-header app-header--actions">
                    ${createBackButtonHtml("notesPage", "cancelSaveNote()")}
                    <h1>Nytt notat</h1>
                </header>

                <main class="content">
                    <div class="form-body">
                        <div class="field">
                            <label>Tittel</label>
                            <input type="text" 
                                value="${selectedNote().title}"
                                oninput="selectedNote().title = this.value" 
                                placeholder="f.eks. Sesongplanlegging vinter 2027" />
                        </div>

                        <div class="field">
                            <label>Dato</label>
                            <input type="date" value="${selectedNote().date}" onchange="selectedNote().date = this.value"/>
                        </div>
                    
                        <div class="field">
                            <label for="notat">Notat</label>
                            <div class="textarea-wrap">
                                <textarea id="notat" 
                                    oninput="selectedNote().description = this.value"
                                    placeholder="Skriv dine tanker, refleksjoner eller planer her...">${selectedNote().description ? selectedNote().description : ''}</textarea>
                                <button type="button" class="mic-btn" id="micBtn" title="Snakk inn notat">
                                    <svg viewBox="0 0 24 24"
                                        fill="none" 
                                        stroke="currentColor" 
                                        stroke-width="2" 
                                        stroke-linecap="round" 
                                        stroke-linejoin="round">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                        <line x1="12" y1="19" x2="12" y2="23"/>
                                        <line x1="8" y1="23" x2="16" y2="23"/>
                                    </svg>
                                </button>
                            </div>
                            <p class="mic-status" id="micStatus" hidden></p>
                        </div>

                        <div class="tags-field">
                            <label>Emneknagger</label>
                            <div class="tag-chips">
                                ${getTags(model.data.topics, "chip")}
                            </div>
                        </div>
                    </div>
                </main>
                
                <div class="action-bar">
                    <button class="btn btn-secondary" onclick="cancelSaveNote()">Avbryt</button>
                    <button class="btn btn-primary" onclick="saveNote()">Lagre</button>
                </div>
                
            </div>
        </div>
    `;
    document.getElementById("app").innerHTML = html;
}

function updateViewNoteViewPage() {
    const note = findObjectById(model.data.notes, model.viewState.noteViewPage.noteId)
    const html = /*HTML*/ `
        <div class="page-notes" style="display: flex; justify-content: center;">
            <div class="phone-frame">
                ${createStatusBarHtml()}
                
                <header class="app-header app-header--actions">
                    ${createBackButtonHtml("notesPage")}
                    <h1>Notat</h1>
                    <div class="header-actions">

                        <button class="icon-btn" type="button" id="editBtn" onclick="editNote()" title="Rediger">
                            <svg viewBox="0 0 24 24"  fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </button>
                        
                        <div class="menu-wrap">
                            <button class="icon-btn" type="button" onclick="toggleMenu()" title="Mer">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="5" cy="12" r="1" />
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="19" cy="12" r="1" />
                                </svg>
                            </button>

                            <div class="menu" id="moreMenu" ${model.viewState.noteViewPage.isMenuOpen ? "" : "hidden"}>
                                
                                <button class="menu-item" type="button" onclick="duplicateNote();">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" />
                                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                    </svg>
                                    Dupliser notat
                                </button>

                                <div class="menu-divider"></div>

                                <button class="menu-item danger" type="button" id="deleteBtn" onclick="deleteNote();">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                    </svg>
                                    Slett notat
                                </button>
                            </div>
                        </div>

                    </div>
                </header>
                
                <div class="detail-content" id="viewMode">
                    ${model.viewState.noteViewPage.errorMessage ? /*HTML*/ `<p class="login-error">${escapeHtml(model.viewState.noteViewPage.errorMessage)}</p>` : ""}
                    <div class="detail-section">
                        <div class="note-detail-head">
                            <span class="meta-chip">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                ${formatDate(note.date)}
                            </span>
                        </div>
                        <h2 id="viewTitle">${note.title}</h2>
                    </div>
                    <div class="detail-section">
                        <p class="note-detail-text" id="viewText">${note.description} </P>
                        <div class="note-detail-tags" id="viewTags">
                            ${getTags(note.topics, 'tag', model.data.topics)}
                        </div>
                        <p class="note-updated">Sist oppdatert: ${formatDate(note.updatedAt)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById("app").innerHTML = html;
}

function createHeader(page) {
    let html = "";
    if (page == "notesPage") {
        html = /*HTML*/ `
            <header class="app-header">
                <h1>Notater</h1>
            </header>
        `;
    } else if (page == "editNotePage") {
        html = /*HTML*/ `
            <header class="app-header app-header--actions">
                ${createBackButtonHtml("notesPage")}
                <h1>Nytt notat</h1>
            </header>
        `;
    } else if (page == "noteViewPage") {
        html /*HTML*/ ``;
    }
    return html;
}

function createMainContent(page) {
    let html = "";
    if (page == "notesPage") {
        html = /*HTML*/ `
            <main class="content">
                ${getNotes()}
            </main>
        `;
    } else if (page == "editNotePage") {
        html = /*HTML*/ `
            <main class="content">
                ${updateViewEditNotesPage()}
            </main>
        `;
    } else if (page == "noteViewPage") {
        html = /*HTML*/ `
            <main class="content">
                ${updateViewNoteViewPage()}
            </main>
        `;
    }
    return html;
}

function createFooter(page) {
    let html = "";
    if (page == "notesPage") {
        html = /*HTML*/ `
            ${createBottomNavHtml("notesPage")}
            ${createFloatingActionHtml("startNewNote();", "Nytt notat")}
        `;
    } else if (page == "editNotePage") {
        html = /*HTML*/ `
            <div class="action-bar">
                <button class="btn btn-secondary" onclick="goToPage('notesPage')">Avbryt</button>
                <button class="btn btn-primary" onclick="saveNote()">Lagre</button>
            </div>
        `;
    }
    return html;
}

function getTags(tags, styleTag, modelObject) {
    const isSelected = selectedNote().topics
    let html = "";

    if (modelObject){
        for (let tag of tags) {
            html += /*HTML*/ `
                <span class="${styleTag}">
                    ${findObjectById(modelObject, tag).topic}
                </span>
            `;
        }
        return html
    } else {
        for (let tag of tags) {
            html += /* HTML */ `
                <span class="${styleTag} ${isSelected.includes(tag.id) ? 'selected': ''}" onclick="toggleTopic(${tag.id})">
                    ${tag.topic}
                </span>
            `;
        }
        return html;
    }
}

function getNotes() {
    const data = model.data;
    const notes = model.data.notes;
    let html = "";
    resetNoteActions()

    for (let note of notes) {
        html += /* HTML */ `
            <div class="note-card" onclick="openNote(${note.id})">
                <div class="note-card-header">
                    <span class="note-date">${formatDate(note.date)}</span>
                </div>
                <h2>${note.title}</h2>
                <p>${note.description}</p>
                <div class="tags">
                    ${getTags(note.topics, "tag", data.topics)}
                </div>
            </div>
        `;
    }
    return html;
}

// prototype rest 45 - notat-detaljer.html.
// Detaljvisning av enkeltnotat. Ikke implementert.
// prototype rest117

// updateViewNotesPage()
// updateViewNoteViewPage()
// updateViewEditNotesPage()
//
