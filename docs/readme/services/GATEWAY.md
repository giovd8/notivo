# Gateway – Reverse Proxy e API Edge

Questo documento descrive l’architettura, la configurazione e i flussi principali del servizio `gateway` (Node.js/Express) che funge da API Gateway e reverse proxy tra il frontend e i microservizi `auth`, `users` e `notes`.

## Stack e dipendenze chiave
- **Node.js 20**
- **Express 5**: routing, middleware chain e gestione errori
- **http-proxy-middleware**: inoltro richieste verso i microservizi interni
- **pino / pino-http**: logging strutturato con rotazione file
- **helmet, cors, compression**: hardening e performance HTTP
- **express-rate-limit**: rate limiting ambiente non-dev
- **jsonwebtoken**: validazione JWT a livello di edge
- **zod**: validazione configurazioni ambiente

## Struttura del progetto
```
gateway/
  src/
    configs/
      limiter.ts
      logger.ts
      proxy.ts
      environment.ts
      public-routes.ts
      swagger.ts
      swagger-loader.ts
    middlewares/
      auth.ts
    index.ts
  Dockerfile.dev
  package.json
```

## Configurazione e variabili d’ambiente
- Validazione tramite `zod` (`EnvSchema` in `src/configs/environment.ts`). Variabili:
  - `PORT` (default: 3000)
  - `NODE_ENV` (`development` | `production`, default: `development`)
  - `AUTH_SERVICE_URL` (default: `http://auth-service:3001`)
  - `USERS_SERVICE_URL` (default: `http://users-service:3002`)
  - `NOTES_SERVICE_URL` (default: `http://notes-service:3003`)
  - `CORS_ORIGIN` (lista separata da virgole o singolo origin; se assente → `true`)
  - `JWT_ACCESS_SECRET` (usata dal middleware `auth` se presente; default di sviluppo interno)
  - Opzionali per logging:
    - `LOG_LEVEL` (default: `debug` in dev, `info` in prod)
    - `LOG_DIR` (default: `logs`)

## Avvio e comandi
- Sviluppo: `npm run dev` (ts-node-dev) – legge `src/index.ts`.
- Build: `npm run build` → `dist/`.
- Produzione: `npm start` → `node dist/index.js`.
- Docker (dev): vedi `Dockerfile.dev` e `docker-compose.dev.yml` alla radice del monorepo.

## Pipeline HTTP e middleware
Ordinamento principale in `src/index.ts`:
1. Disabilitazione `x-powered-by` e `trust proxy` abilitato.
2. Logging HTTP con `pino-http` e propagazione `x-request-id` (riuso o generazione via `randomUUID`).
3. In ambienti non-dev: attivazione `rate-limit` (`limiter.ts`).
4. Hardening e performance: `helmet`, `cors` (origini dal `CORS_ORIGIN`), `compression`.
5. Probe:
   - `GET /health` → `{ message: "ok" }`
   - `GET /ready` → `{ message: "ready" }`
6. API Docs: `/api-docs` (Swagger UI), `/swagger.json` (documento JSON)
7. Routing proxy:
   - `/auth` → `AUTH_SERVICE_URL` (pubblico)
   - `/notes` → `NOTES_SERVICE_URL` (protetto da `authMiddleware`)
   - `/users` → `USERS_SERVICE_URL` (protetto da `authMiddleware`)
8. Parser body: `express.json`/`urlencoded` (limite 1MB).
9. 404 handler e error handler centralizzato.
10. Timeouts HTTP hardenizzati:
    - `keepAliveTimeout = 65s`, `headersTimeout = 70s`, `requestTimeout = 30s`.

## Proxy: opzioni comuni
- `configs/proxy.ts` esporta `commonProxyOptions`:
  - `changeOrigin: true`, `timeout`/`proxyTimeout` = 25s
  - `onError`: log dell’errore e 502 verso il client
  - `onProxyReq`: propagazione `x-request-id` a valle

## Autenticazione a livello gateway
- `middlewares/auth.ts` implementa `authMiddleware`:
  - Whitelist rotte pubbliche in `configs/public-routes.ts` (array `{ url, method }`).
  - Estrae JWT da cookie `accessToken` oppure header `Authorization: Bearer`.
  - Verifica il token con `JWT_ACCESS_SECRET`.
  - Popola `req.user`, `req.headers.authorization` e header ausiliari (`x-user-id`, `x-username`).
  - In caso di token mancante/invalidato → `401`.

Rotte attualmente pubbliche (prefisso completo, match per `startsWith`):
```
/public-routes.ts
- POST /notes/tags
- POST /auth/register/test-users
- POST /notes/test-notes
```

## CORS
- Origine consentita configurata da `CORS_ORIGIN` (stringa singola o CSV). In assenza, `cors({ origin: true, credentials: true })`.
- I cookie vengono accettati e passati a valle per consentire sessioni basate su cookie.

## Logging
- `configs/logger.ts` configura Pino con:
  - Pretty printing in sviluppo.
  - Scrittura su file giornaliero `logs/gateway-YYYY-MM-DD.log`.
  - Redazione campi sensibili (`authorization`, `cookie`, token, password).

## Sicurezza e limiti
- Header di sicurezza via `helmet`.
- Rate limiting in ambienti non-dev (100 req/min per IP, configurabile).
- Body size limit 1MB.
- Error handling centralizzato con risposta generica 500 e logging dettagliato.

## Networking e integrazione
- In dev, Nginx (`nginx/nginx.dev.conf`) espone:
  - UI: `https://localhost` → `frontend:4200`
  - API: `https://localhost/api/*` → `gateway:3000/*`
- Il gateway a sua volta instrada:
  - `/auth/*` → `AUTH_SERVICE_URL`
  - `/notes/*` → `NOTES_SERVICE_URL` (con `authMiddleware`)
  - `/users/*` → `USERS_SERVICE_URL` (con `authMiddleware`)

## Estensioni suggerite
- Circuit breaker / retry (ad es. `http-proxy-middleware` + resilienza custom, o spostamento su un API Gateway dedicato).
- Telemetria (OpenTelemetry) e correlation id end-to-end.
- Arricchimento `public-routes` con pattern/regex e metodi multipli.
- Configurazione CSP lato Nginx più restrittiva con allowlist dinamica per `connect-src`.
