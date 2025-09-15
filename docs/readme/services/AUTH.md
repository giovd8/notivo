# Auth – Servizio di autenticazione

Questo documento descrive architettura, configurazione e flussi principali del microservizio `auth` (Node.js/Express) che gestisce registrazione, login, refresh e logout. Lo stile segue quello del README del `gateway`.

## Stack e dipendenze chiave
- Node.js 20
- Express 5
- bcryptjs (hashing password)
- jsonwebtoken (JWT access/refresh)
- cookie-parser (gestione cookie httpOnly)
- pg (Postgres) e mongoose (Mongo) tramite config locali

## Struttura del progetto
```
services/auth/
  src/
    configs/
      jwt.ts
      mongo.ts
      postgres.ts
    controllers/
      auth.controller.ts
    models/
      response.ts
      session.ts
      user.ts
    repositories/
      account.repository.ts
      session.repository.ts
      user.repository.ts
    routes/
      auth.routes.ts
    services/
      auth.service.ts
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
  - JWT:
    - `JWT_ACCESS_SECRET` (default dev: `dev-access-secret`)
    - `JWT_REFRESH_SECRET` (default dev: `dev-refresh-secret`)
    - `JWT_ACCESS_TTL` (default: `15m`)
    - `JWT_REFRESH_TTL` (default: `7d`)
  - Servizi interni:
    - `USERS_SERVICE_URL` (default: `http://users-service:3002`)

## Avvio e lifecycle
- Startup (`src/index.ts`): inizializza Postgres e Mongo in parallelo, poi avvia l’HTTP server.
- Graceful shutdown: intercetta `SIGINT`/`SIGTERM`, chiude pool Postgres e connessione Mongo.
- Middleware globali: `express.json()`, `cookieParser()` e error handler centralizzato.

## Routing e controller
`src/routes/auth.routes.ts` mappa le rotte verso `auth.controller`:

- `POST /register`
  - Crea un nuovo utente: valida input, verifica unicità username, chiama Users service per creare l’anagrafica, salva l’account con `passwordHash` e rilascia coppia di token.
  - Imposta cookie httpOnly `accessToken` e `refreshToken` con attributi sicuri (prod: `secure`, `sameSite=none`).

- `POST /register/test-users`
  - Crea utenti di test da payload `{ users: { username, password }[] }`.

- `POST /login`
  - Verifica credenziali con bcrypt, genera token JWT e crea una sessione in Mongo (`sessions`).
  - Imposta cookie httpOnly con TTL coerenti ai token.

- `POST /refresh`
  - Legge `refreshToken` dal cookie, valida il token, rigenera la coppia JWT, aggiorna la sessione in Mongo e reimposta i cookie.
  - Risponde con `data: UserDTO | null` derivato dal token rigenerato.

- `POST /logout`
  - Legge `refreshToken` dal cookie, invalida la sessione in Mongo, rimuove i cookie e risponde `204`.

## Persistenza e integrazioni
- Postgres
  - Tabelle: `users`, `accounts` (hash password), coerenti con lo schema condiviso.
  - Repository: `account.repository.ts`, `user.repository.ts`.
- Mongo
  - Collezione: `sessions` (TTL su `expiresAt` a carico dell’indice creato da init Mongo).
  - Repository: `session.repository.ts` con CRUD su `sessions`.
- Servizi interni
  - Users service: `USERS_SERVICE_URL` per creare l’utente anagrafico in fase di `register`.

## JWT e cookie
- Segreti e TTL da `configs/jwt.ts` (override via env).
- `signTokenPair(payload)` genera `accessToken` e `refreshToken`.
- Cookie httpOnly impostati in `auth.controller.ts` con TTL da `getJwtTtlsMs()` e attributi sicuri in produzione.

## Sicurezza
- Password hash con `bcryptjs` (cost factor 10).
- Sessioni in Mongo con `expiresAt` coerente al TTL dell’access token.
- Cookie `httpOnly`, `secure` in produzione, `sameSite=none` in produzione, `lax` in sviluppo.

## API di esempio (curl)
```
# Registrazione
curl -i -X POST http://localhost:3001/register \
  -H 'content-type: application/json' \
  -d '{"username":"demo","password":"Passw0rd!"}'

# Login
curl -i -X POST http://localhost:3001/login \
  -H 'content-type: application/json' \
  -d '{"username":"demo","password":"Passw0rd!"}'

# Refresh (riusa cookie refreshToken)
curl -i -X POST http://localhost:3001/refresh \
  --cookie "refreshToken=<token>"

# Logout
curl -i -X POST http://localhost:3001/logout \
  --cookie "refreshToken=<token>"
```

## Note operative
- Il gateway espone `/auth/*` pubblicamente; `users` e `notes` sono dietro `authMiddleware`.
- Assicurarsi che `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` siano coerenti tra servizi in ambienti condivisi.
- In produzione, usare `secure` e `sameSite=none` per i cookie e configurare correttamente CORS a livello di gateway.


