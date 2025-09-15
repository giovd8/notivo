
# Notivo – Frontend Angular

Questo documento descrive l’architettura, la struttura dei moduli, i flussi principali e le convenzioni adottate nel progetto frontend contenuto nella cartella `frontend`. È pensato per una documentazione di analisi tecnica.

## Stack e dipendenze chiave

- **Angular 20**: applicazione standalone (senza NgModule) con `provideRouter`, `provideHttpClient` e change detection senza Zone (`provideZonelessChangeDetection`).
- **@ngrx/signals**: gestione dello stato tramite Signal Store per feature e dominio.
- **RxJS 7.8**: orchestrazione chiamate HTTP e side-effect (operatori `tap`, `share`, `finalize`, `switchMap`, ecc.).
- **Tailwind CSS v4**: definizione tema e utility-first styling; classi riutilizzabili in `src/styles.css`.
- **Quill 2**: editor rich text per le note.

## Struttura del progetto

```
frontend/
  src/
    app/
      app.ts, app.html, app.config.ts, app.routes.ts
      auth/
        auth.store.ts
        auth.routes.ts
        services/auth.ts
        guards/
          auth-guard.ts
          not-auth-guard.ts
        pages/
          login/
          register/
      core/
        components/ (es. sidenav, toast, modal)
        interceptors/error-interceptor.ts
        models.ts
        services/toast.ts
        utils.ts
      features/
        notes/
          notes.ts, notes.html
          create-edit-note/
          note-details/
          notes-list/
          components/ (es. notes-legend)
        stores/
          note.ts
          common.ts
      services/
        common.ts
        note.ts
        modal.service.ts
      shared/
        components/ (...)
        directives/
        models/
          note.ts, user.ts, utils.ts
    index.html
    main.ts
    styles.css
```

### Entry point e bootstrap

- `src/main.ts`: bootstrap dell’applicazione con `bootstrapApplication(App, appConfig)`.
- `src/app/app.config.ts`: configura provider globali:
  - `provideBrowserGlobalErrorListeners()`
  - `provideZonelessChangeDetection()`
  - `provideRouter([...authRoutes, ...routes])`
  - `provideHttpClient(withInterceptors([errorInterceptor]))`
  - localizzazione italiana (`LOCALE_ID = 'it'`, `registerLocaleData(localeIt)`).
- `src/app/app.routes.ts`: definisce le rotte applicative principali e lazy loading dei componenti/feature.

### Routing

- Rotta protetta `notes` con lazy component:
  - `loadComponent: () => import('./features/notes/notes').then((m) => m.Notes)`
  - Guard: `canActivate` e `canActivateChild` con `authGuard`.
- Root `''` e wildcard `**` reindirizzano a `notes`.
- `auth.routes.ts` espone rotte pubbliche:
  - `login`, `register`: protette da `notAuthGuard` (impedisce accesso ad utenti autenticati e consente fallback su refresh anonimo).

### Autenticazione e Guard

- `AuthStore` (`src/app/auth/auth.store.ts`): Signal Store con stato `{ user: User | null, isAuthenticated: boolean }` e metodi `login`, `register`, `refresh`, `logout` che delegano ad `AuthService`.
- `authGuard`:
  - Se `isAuthenticated` è true → consente accesso.
  - Altrimenti invoca `AuthStore.refresh()`; su successo consente, su errore reindirizza a `/login?redirect=<url>`.
- `notAuthGuard`:
  - Se già autenticato → redireziona a `/` (con `redirect`);
  - consente l’accesso diretto a `/login` e `/register`;
  - in altri casi prova `refresh`; se va a buon fine redireziona a `/`, altrimenti consente l’accesso pubblico.

### Interceptor HTTP

- `error-interceptor.ts` registra un `HttpInterceptorFn` globale:
  - Gestione centralizzata errori HTTP (`HttpErrorResponse`).
  - Hook per logout su `401`; integrazione prevista con `AuthStore` e `Router`.

### Servizi di dominio (API client)

- `services/note.ts` (`NoteService`):
  - `createOne(payload: NotePayload)` → POST `/api/notes`
  - `updateOne(id, payload)` → PUT `/api/notes/:id`
  - `getAll(search?, tags?)` → GET `/api/notes`
  - `deleteOne(id)` → DELETE `/api/notes/:id`
  - Tutte le chiamate usano `withCredentials: true`.
- `services/common.ts` (`Common`):
  - `getTags()` → GET `/api/notes/tags`
  - `getUsers()` → GET `/api/users`
- `auth/services/auth.ts` (`AuthService`):
  - `login`, `register` → POST `/api/auth/*`
  - `refresh` → POST `/api/auth/refresh` con `withCredentials: true`
  - `logout` → POST `/api/auth/logout` con `withCredentials: true`

### Gestione stato con @ngrx/signals

- `features/stores/note.ts` (`NoteStore`):
  - Stato: lista note, stato `loading`, filtri `{ text, tags }`.
  - Computed `filteredNotes` con filtraggio per testo e tag.
  - Metodi `load`, `refresh`, `create`, `update`, `remove` che orchestrano `NoteService`.
  - `withHooks.onInit` esegue `load()` all’inizializzazione dello store.
- `features/stores/common.ts` (`CommonStore`):
  - Stato: `tags`, `users`, `loading`.
  - Metodi `loadTags`, `loadUsers`, `loadAll` che orchestrano `Common` service.
  - `withHooks.onInit` esegue `loadAll()` all’inizializzazione.

### Componenti e feature

- `features/home`: componente Home lazy-loaded.
- `features/notes`:
  - `notes.routes.ts` definisce le route della feature: lista, creazione/modifica, dettaglio.
  - Cartelle `notes-list`, `create-edit-note`, `note-details` con componenti standalone lazy-loaded.
- `core/components`: componenti di layout e UI condivisi (esempio `sidenav`, `toast`).
- `shared/components`: componenti riutilizzabili (es. `search-bar`, `multiselect`, `spinner`, `tooltip`, ecc.).

### Stili e tema

- `src/styles.css` importa Tailwind e temi Quill.
- Definiti CSS custom properties e utility class tramite `@theme` e `@apply` (Tailwind v4):
  - Pulsanti: `.notivo-btn-primary`, `.notivo-btn-outline-primary`, `.notivo-btn-outline-light`
  - Input: `.notivo-input`
  - Card: `.notivo-card`
  - Focus ring: `.notivo-focus`
  - Stili Quill: `.ql-toolbar`, `.ql-container`
- Font: Montserrat self-hosted con `@font-face`.

### Convenzioni e pratiche

- Componenti standalone, lazy-loading estensivo di feature e componenti per ridurre il bundle iniziale.
- Store per feature/domino con effetti a bordo store (invocazioni HTTP, gestione `loading`) e `share()` per multi-subscribe sicuri.
- Router Guard come boundary di sicurezza applicativa lato client.
- Interceptor unico per gestione errori centralizzata e punto di estensione per UX (toast, redirect 401).
- Localizzazione predefinita italiana via `LOCALE_ID` e `registerLocaleData`.
- Tipi condivisi in `shared/models/*` e `core/models.ts` per risposte API (`NotivoResponse<T>`).

### Flussi principali

- Login/Register:
  1. `AuthStore.login/register` → `AuthService`
  2. Patch dello stato utente e `isAuthenticated=true`
  3. Accesso alle rotte protette consentito da `authGuard`
- Refresh sessione:
  1. Trigger da `authGuard/notAuthGuard` o invocato esplicitamente via `AuthStore.refresh`
  2. Su fallimento viene azzerato lo stato utente e il guard redirige verso `/login`
- CRUD Note:
  - `NoteStore.load/refresh` → `NoteService.getAll`
  - `create` → POST e successivo reload elenco o update in-place a seconda del metodo
  - `update/remove` → mutazioni locali coerenti con risposte API

### Configurazione TypeScript/Angular

- `tsconfig.json`: strict mode abilitato, `strictTemplates` abilitato, target `ES2022`.
- `tsconfig.app.json`: include `src/**/*.ts`, esclude `*.spec.ts` dalla build applicativa.

### Comandi di sviluppo

Da `frontend/`:

- `npm start` → `ng serve` ambiente di sviluppo su `http://localhost:4200/`.
- `npm run build` → build produzione in `dist/`.
- `npm test` → unit test (Karma/Jasmine).
- `npm run watch` → build continua in configurazione `development`.

### Configurazioni e integrazione backend

- Le chiamate HTTP puntano a percorsi `/api/*` e utilizzano cookie (`withCredentials: true`) per la gestione sessione.
- In ambiente di sviluppo, il reverse proxy (gateway) instrada le richieste verso i microservizi (`auth`, `notes`, `users`).

### Estensioni future suggerite

- Riattivazione toast in `error-interceptor` e definizione pattern di notifica.
- Implementazione logout automatico su `401` con redirect condizionato.
- Aggiunta error/retry strategy per chiamate critiche e indicatori UX uniformi.
- Test di integrazione per guard e store tramite harness e TestBed standalone.
