/* ==========================================================================
   loginPageView.js – View for innloggingssiden

   View leser modellen og lager HTML. View endrer ikke modellen.
   Alle brukerhandlinger går via controller-funksjoner i loginPageController.js:

     handleLogin()               – Logg inn-knappen (form onsubmit)
     togglePasswordVisibility()  – Øynet som viser/skjuler passord

   Modell-state som denne viewet forventer:
     model.app.currentPage                        = "loginPage"
     model.viewState.loginPage.userInput
     model.viewState.loginPage.passwordInput
     model.viewState.loginPage.isPasswordVisible  (bool)
     model.viewState.loginPage.errorMessage       (tekst eller "")

   Statuslinja ligger i common.js, siden den er felles for alle sider.
   ========================================================================== */

function updateViewLoginPage() {
    const login = model.viewState.loginPage;

    const html = /*HTML*/`
        <div class="page-login" style="display: flex; justify-content: center;">
            <div class="phone-frame">
                ${createStatusBarHtml()}

                <main class="login-content">
                    <div class="login-brand">
                        <div class="login-logo">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                <path d="M8 3l4 8 5-5 5 15H2L8 3z"></path>
                            </svg>
                        </div>
                        <h1>Min friluft</h1>
                    </div>

                    <form class="login-form" onsubmit="handleLogin(); return false;">
                        <div class="form-group">
                            <label for="epost">E-post</label>
                            <input
                                class="input"
                                type="email"
                                id="epost"
                                name="epost"
                                placeholder="navn@eksempel.no"
                                autocomplete="email"
                                value="${login.userInput}"
                                oninput="model.viewState.loginPage.userInput = this.value;"
                            />
                        </div>

                        <div class="form-group">
                            <label for="passord">Passord</label>
                            <div class="password-field">
                                <input
                                    class="input"
                                    type="${login.isPasswordVisible ? 'text' : 'password'}"
                                    id="passord"
                                    name="passord"
                                    placeholder="••••••••"
                                    autocomplete="current-password"
                                    value="${login.passwordInput}"
                                    oninput="model.viewState.loginPage.passwordInput = this.value;"
                                />
                                <button
                                    type="button"
                                    class="password-toggle"
                                    aria-label="${login.isPasswordVisible ? 'Skjul passord' : 'Vis passord'}"
                                    onclick="togglePasswordVisibility();"
                                >
                                    ${createEyeIconHtml(login.isPasswordVisible)}
                                </button>
                            </div>
                        </div>

                        ${createLoginErrorHtml(login.errorMessage)}

                        <button type="submit" class="btn btn-primary login-btn">
                            Logg inn
                        </button>
                    </form>
                </main>
            </div>
        </div>
    `;

    document.getElementById("app").innerHTML = html;
}

/* Øynet viser/skjuler passord. Hvilket ikon vi skal vise
   avgjøres av model.viewState.loginPage.isPasswordVisible. */
function createEyeIconHtml(isPasswordVisible) {
    if (isPasswordVisible) {
        /* Øyet er åpent: vis det lukkede øyet, altså "trykk for å skjule" */
        return /*HTML*/`
            <svg class="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 10-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
        `;
    }

    return /*HTML*/`
        <svg class="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    `;
}

/* Feilmeldingen vises bare når controlleren har satt en melding i view state. */
function createLoginErrorHtml(errorMessage) {
    if (errorMessage) {
        return /*HTML*/`<p class="login-error">${errorMessage}</p>`;
    }

    return "";
}