# Users – Servizio gestione utenti

Questo documento descrive architettura, configurazione e flussi principali del microservizio `users` (Node.js/Express) che gestisce la creazione e la lettura degli utenti e fornisce una cache utenti per l’interfaccia.

## Stack e dipendenze chiave
- Node.js 20
- Express 5
- cookie-parser (lettura cookie httpOnly se necessario)
- pg (Postgres) e mongoose (Mongo) tramite config locali

## Struttura del progetto
```
services/users/
  src/
    configs/
      mongo.ts
      postgres.ts
    controllers/
      user.controller.ts
    models/
      response.ts
      user.ts
      users-cache.ts
      user-notes-cache.ts
      utils.ts
    repositories/
      user.repository.ts
    routes/
      user.routes.ts
    utils/
      server-error.ts
    index.ts
  Dockerfile.dev
  package.json
```

## Configurazione e variabili d’ambiente
- Caricate con `dotenv` in `src/index.ts`.
- Variabili rilevanti:
  - `PORT` (default: 3002)
  - Postgres: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
  - Mongo: `MONGO_URL` (es. `mongodb://mongo:27017`)

## Avvio e lifecycle
- Startup (`src/index.ts`): inizializza Postgres e Mongo, poi avvia l’HTTP server.
- Graceful shutdown: intercetta `SIGINT`/`SIGTERM`, chiude pool Postgres e connessione Mongo.
- Middleware globali: `express.json()`, `cookieParser()` e error handler centralizzato.

## Routing e controller
`src/routes/user.routes.ts` mappa le rotte verso `user.controller`:

- `GET /`
  - Restituisce la lista utenti “others” visibili al richiedente come `LabelValue[]`.
  - Richiede header `x-user-id` propagato dal gateway.

- `POST /`
  - Crea un nuovo utente con `username` univoco; risponde con `UserDTO`.
  - In caso di duplicato, risponde `409 Username already taken`.

- `GET /:id`
  - Restituisce `UserDTO` per id; `404` se non trovato.

- `GET /search/by-username?username=<name>`
  - Cerca utente per username; `400` se mancante, `404` se non trovato.

## Persistenza e cache
- Postgres (sorgente autorevole)
  - Tabelle: `users` (unico su `username`).
  - Repository: `user.repository.ts`.
- Mongo (cache denormalizzate)
  - `users_cache`: per ciascun `userId` mantiene `others: CachedUser[]` per suggerimenti/lista utenti.
  - `user_notes_cache`: (condiviso) snapshot note per utente per ridurre join e tempi di risposta in front-end.

## Sicurezza e integrazione con il gateway
- Il gateway protegge `/users/*` con `authMiddleware` e propaga `Authorization: Bearer` + header `x-user-id`, `x-username`.
- L’endpoint `POST /` è usato internamente dal servizio `auth` durante la registrazione.

## Contratti di risposta
- `NotivoResponse<T>`: `{ message: string; data: T }` (o `null`).
- Errori: eccezioni `ServerError` gestite dall’handler centralizzato con `status` e `message`.

## API di esempio (curl)
```
# Crea utente (usato da auth)
curl -i -X POST http://localhost:3002/ \
  -H 'content-type: application/json' \
  -d '{"username":"demo"}'

# Elenco utenti visibili (richiede header dal gateway)
curl -i http://localhost:3002/ \
  -H 'authorization: Bearer <ACCESS_TOKEN>' \
  -H 'x-user-id: <USER_ID>'

# Dettaglio per id
curl -i http://localhost:3002/<USER_ID>

# Ricerca per username
curl -i 'http://localhost:3002/search/by-username?username=demo'
```

## Note operative
- In produzione esporre le rotte tramite gateway (`/users/*`) per garantire autenticazione e CORS corretti.
- Mantenere coerente la cache `users_cache` quando si aggiungono utenti o cambiano visibilità/relazioni.

## Politiche di aggiornamento cache (`users_cache`)
- Trigger consigliati:
  - Dopo `POST /users` (creazione utente): ricostruire `others` per tutti gli utenti interessati o invalidare globalmente.
  - Al login/refresh lato frontend: se `updatedAt` è “vecchio”, richiedere ricostruzione per l’utente corrente.
  - Job periodico (es. ogni 15–60 min) per rinfrescare documenti obsoleti.
- Strategie di invalidazione:
  - Soft-invalidate: marcare come stale e rigenerare on-demand alla prossima richiesta.
  - Hard-invalidate: cancellare il documento `users_cache` dell’utente impattato; il successivo accesso lo ricrea.
- Coerenza:
  - Preferire ricalcolo atomico del documento per `userId` coinvolto invece di update parziali.
  - Usare `updatedAt` per politiche TTL applicative e ordinamento.

