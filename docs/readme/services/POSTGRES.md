### Schema Postgres — Relazioni tra le tabelle

Questo documento descrive le tabelle e le relazioni definite in `init.sql` per il database Postgres.

## Tabelle

- **users**: anagrafica degli utenti
  - Chiave primaria: `id UUID` (default `uuid_generate_v4()`)
  - Vincoli: `username` unico
  - Timestamp: `created_at`

- **accounts**: credenziali e metadati di account
  - Chiave primaria e FK: `user_id UUID` → `users(id)`
  - Vincoli: `ON DELETE CASCADE`
  - Campi: `password_hash`, `created_at`

- **notes**: note personali
  - Chiave primaria: `id UUID`
  - FK proprietario: `owner_id UUID` → `users(id)` con `ON DELETE CASCADE`
  - Campi: `title`, `body`, `created_at`, `updated_at`

- **notes_shared**: condivisione note-utenti (tabella ponte)
  - PK composta: `(note_id, user_id)`
  - FK: `note_id` → `notes(id)` `ON DELETE CASCADE`, `user_id` → `users(id)` `ON DELETE CASCADE`

- **tags**: etichette
  - Chiave primaria: `id UUID`
  - Vincoli: `name` unico
  - Timestamp: `created_at` (anche con `ALTER TABLE ... IF NOT EXISTS` a supporto di migrazioni sicure)

- **notes_tags**: associazione note-tag (tabella ponte)
  - PK composta: `(note_id, tag_id)`
  - FK: `note_id` → `notes(id)` `ON DELETE CASCADE`, `tag_id` → `tags(id)` `ON DELETE CASCADE`

## Relazioni e cardinalità

- **users ↔ accounts**: 1 ↔ 1
  - Ogni utente ha al più un record in `accounts` (PK su `user_id`).
  - Cancellare un `user` elimina automaticamente l'`account` associato (cascade).

- **users ↔ notes (owner)**: 1 ↔ N
  - Un utente può possedere molte note (`notes.owner_id`).
  - Cancellare il proprietario cancella tutte le note possedute (cascade su `owner_id`).

- **users ↔ notes_shared**: N ↔ N tramite tabella ponte
  - Un utente può avere molte note condivise con lui; una nota può essere condivisa con molti utenti.
  - Le righe di condivisione vengono eliminate in cascata se l'utente o la nota non esistono più.

- **notes ↔ tags**: N ↔ N tramite `notes_tags`
  - Una nota può avere molti tag; un tag può appartenere a molte note.
  - Le associazioni vengono eliminate in cascata quando la nota o il tag sono rimossi.

## Diagramma ER (testuale)

```
users (id PK, username UNIQUE)
   │1
   │  ┌──────────────┐
   └──┤ accounts     │ (user_id PK, FK → users.id, ON DELETE CASCADE)

users (id PK)
   │1
   │  ┌──────────────┐
   └──┤ notes        │ (id PK, owner_id FK → users.id, ON DELETE CASCADE)

notes (id PK) ──< notes_shared >── users (id PK)
   (note_id FK, user_id FK, PK(note_id, user_id), ON DELETE CASCADE)

notes (id PK) ──< notes_tags >── tags (id PK, name UNIQUE)
   (note_id FK, tag_id FK, PK(note_id, tag_id), ON DELETE CASCADE)
```

## Regole di integrità e cancellazioni

- Le tabelle ponte (`notes_shared`, `notes_tags`) usano chiavi primarie composte per impedire duplicati.
- Le FK hanno `ON DELETE CASCADE` per mantenere coerenza referenziale:
  - Eliminare un `user` elimina: il suo `account`, le sue `notes`, e le relative condivisioni.
  - Eliminare una `note` elimina: le righe in `notes_shared` e `notes_tags` associate.
  - Eliminare un `tag` elimina: le righe in `notes_tags` associate.

## Esempi di query utili

- Note possedute da un utente:
```sql
SELECT n.*
FROM notes n
WHERE n.owner_id = $1;
```

- Note condivise con un utente (non possedute):
```sql
SELECT n.*
FROM notes n
JOIN notes_shared ns ON ns.note_id = n.id
WHERE ns.user_id = $1
  AND n.owner_id <> $1;
```

- Tag di una nota:
```sql
SELECT t.*
FROM tags t
JOIN notes_tags nt ON nt.tag_id = t.id
WHERE nt.note_id = $1;
```

- Note che hanno un certo tag:
```sql
SELECT n.*
FROM notes n
JOIN notes_tags nt ON nt.note_id = n.id
JOIN tags t ON t.id = nt.tag_id
WHERE t.name = $1;
```


