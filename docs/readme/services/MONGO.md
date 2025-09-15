### Schema Mongo — Collezioni di cache (nessuna relazione)

Questo documento elenca le collezioni Mongo usate come cache applicativa. Non esistono relazioni tra le collezioni; ogni documento è autonomo e pensato per essere ricostruibile dai dati sorgente (Postgres o servizi).

## Panoramica collezioni

- **sessions**
  - Scopo: memorizza sessioni utente attive.
  - Chiavi principali: `_id` (string), `userId`, `token`, `refreshToken`.
  - Metadati: `createdAt`, `expiresAt`, `metadata.ip`, `metadata.userAgent`.
  - Indici: TTL attivo su `expiresAt` (`expireAfterSeconds: 0`).

- **users_cache**
  - Scopo: cache della lista utenti visibili a un utente.
  - Documento tipo: `{ userId: string, others: CachedUser[], updatedAt: Date }`.
  - Vincoli/indici: `userId` unico e indicizzato; indice su `updatedAt`.
  - Note: `updatedAt` aggiornato automaticamente in save-hook.

- **tags_cache**
  - Scopo: cache dei tag disponibili.
  - Documento tipo: `{ key: string, tags: CachedTag[], updatedAt: Date }`.
  - Vincoli/indici: `key` unico e indicizzato (solitamente `"global"`).
  - Note: `updatedAt` aggiornato automaticamente in save-hook.

- **user_search_cache**
  - Scopo: cache dei risultati di ricerca per utente e filtro normalizzato.
  - Documento tipo: `{ userId: string, key: string, filter: { text, tags[] }, results: CachedNote[], lastUpdated: Date }`.
  - Indici: composto unico `{ userId, key }`; TTL su `lastUpdated` a 24h (`expireAfterSeconds: 86400`).
  - Note: `lastUpdated` aggiornato automaticamente in save-hook.

## Schemi dei tipi (indicativi)

- `CachedUser`: `{ id: string, username: string, createdAt: Date }`
- `CachedTag`: `{ id: string, name: string, createdAt: Date }`
- `CachedSharedUser`: `{ id: string, username: string, createdAt: Date }`
- `CachedNote`: `{ id, title, body, ownerId, tags: CachedTag[], sharedWith: CachedSharedUser[], createdAt, updatedAt }`

## Politiche di scadenza e ricostruzione

- Le collezioni sono cache: possono essere invalidate o rigenerate dai servizi.
- TTL attivo in `user_search_cache` (24 ore) e in `sessions` su `expiresAt`.
- `updatedAt`/`lastUpdated` vengono aggiornati in pre-save per mantenere freshness.


