# Notes – Servizio gestione note

Questo documento descrive architettura, configurazione e flussi principali del microservizio `notes` (Node.js/Express) che gestisce CRUD note e tag. Lo stile segue i README di `gateway` e `auth`.

## Stack e dipendenze chiave
- Node.js 20
- Express 5
- cookie-parser (lettura cookie httpOnly se necessario)
- pg (Postgres) e mongoose (Mongo) tramite config locali

## Struttura del progetto
```
services/notes/
  src/
    configs/
      mongo.ts
      postgres.ts
    controllers/
      note.controller.ts
      tag.controller.ts
    models/
      note.ts
      response.ts
      search-cache.ts
      tag.ts
      tags-cache.ts
      user-notes-cache.ts
      utils.ts
    repositories/
      note.repository.ts
      tag.repository.ts
    routes/
      note.routes.ts
      tag.routes.ts
    utils/
      server-error.ts
    index.ts
  Dockerfile.dev
  package.json
```

## Configurazione e variabili d’ambiente
- Caricate con `dotenv` in `src/index.ts`.
- Variabili rilevanti:
  - `PORT` (default: 3000)
  - Postgres: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
  - Mongo: `MONGO_URL` (es. `mongodb://mongo:27017`)

## Avvio e lifecycle
- Startup (`src/index.ts`): inizializza Postgres e Mongo in parallelo, poi avvia l’HTTP server.
- Graceful shutdown: intercetta `SIGINT`/`SIGTERM`, chiude pool Postgres e connessione Mongo.
- Middleware globali: `express.json()`, `cookieParser()` e error handler centralizzato.

## Routing e controller
`src/routes/*` mappa le rotte verso i rispettivi controller.

- Note (`/` prefix)
  - `GET /` → lista note visibili all’utente corrente, con filtri opzionali `?search=..&tags=a,b`.
  - `POST /` → crea nota: `{ title, body, sharedWith?: string[], tags?: string[] }`.
  - `PUT /:id` → aggiorna nota parziale: `{ title?, body?, sharedWith?, tags? }`.
  - `DELETE /:id` → elimina nota.
  - `POST /test-notes` → crea note di test in massa.

- Tag (`/tags` prefix)
  - `GET /tags` → lista tag come `LabelValue[]`.
  - `POST /tags` → upsert di tag: `{ tags: string[] }`.

Note: le rotte note richiedono intestazioni propagate dal gateway (`x-user-id`, `x-username`); `/tags` include endpoint pubblico per bootstrap (`POST /tags`).

## Persistenza e cache
- Postgres (sorgente autorevole)
  - Tabelle: `notes`, `tags`, tabelle ponte `notes_shared`, `notes_tags` (vedi documentazione Postgres).
  - Repository: `note.repository.ts`, `tag.repository.ts`.
- Mongo (cache denormalizzate)
  - `user_notes_cache`: note per utente (proprie + condivise), includendo tag e utenti condivisi.
  - `tags_cache`: elenco tag (chiave unica `key`, tipicamente `"global"`).
  - `user_search_cache`: risultati di ricerca per utente+chiave normalizzata, con TTL 24h.

## Sicurezza e integrazione con il gateway
- Il gateway protegge `/notes/*` con `authMiddleware` e propaga JWT come `Authorization: Bearer` + header `x-user-id`, `x-username`.
- I controller validano la presenza di `x-user-id` per operazioni utente.

## Contratti di risposta
- `NotivoResponse<T>`: `{ message: string; data: T }` (o `null`).
- Errori: eccezioni `ServerError` gestite dall’handler centralizzato con `status` e `message`.

## API di esempio (curl)
```
# Lista note
curl -i 'http://localhost:3003/?search=demo&tags=work,urgent' \
  -H 'authorization: Bearer <ACCESS_TOKEN>' \
  -H 'x-user-id: <USER_ID>'

# Crea nota
curl -i -X POST http://localhost:3003/ \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer <ACCESS_TOKEN>' \
  -H 'x-user-id: <USER_ID>' \
  -d '{"title":"Titolo","body":"Contenuto","tags":["work"],"sharedWith":["user2"]}'

# Aggiorna nota
curl -i -X PUT http://localhost:3003/<NOTE_ID> \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer <ACCESS_TOKEN>' \
  -H 'x-user-id: <USER_ID>' \
  -d '{"title":"Nuovo titolo"}'

# Elimina nota
curl -i -X DELETE http://localhost:3003/<NOTE_ID> \
  -H 'authorization: Bearer <ACCESS_TOKEN>' \
  -H 'x-user-id: <USER_ID>'

# Upsert tag
curl -i -X POST http://localhost:3003/tags \
  -H 'content-type: application/json' \
  -d '{"tags":["work","urgent"]}'

# Lista tag
curl -i http://localhost:3003/tags
```
