# Configurazione Docker per Notivo

Questa guida spiega come configurare e utilizzare l'ambiente Docker per Notivo con documentazione API integrata.

## Avvio Rapido

### Opzione 1: Con Script (Raccomandato)
```bash
# Avvia tutti i servizi inclusa la documentazione API
./scripts/dev-up.sh
```

### Opzione 2: Con Docker Compose
```bash
# Avvia tutti i servizi inclusa la documentazione API
docker-compose -f docker-compose.dev.yml up
```

## Servizi Disponibili

| Servizio | Porta | Descrizione | URL |
|----------|-------|-------------|-----|
| **Gateway** | 3000 | API Gateway con Swagger | http://localhost:3000 |
| **Swagger UI** | 3000 | Documentazione API | http://localhost:3000/api-docs |
| **API JSON** | 3000 | Specifica OpenAPI | http://localhost:3000/swagger.json |
| **Frontend** | 4200 | Interfaccia Angular | http://localhost:4200 |
| **Auth Service** | 3001 | Autenticazione | Interno |
| **Users Service** | 3002 | Gestione utenti | Interno |
| **Notes Service** | 3003 | Gestione note | Interno |
| **PostgreSQL** | 5432 | Database relazionale | Interno |
| **MongoDB** | 27017 | Database documentale | Interno |

## Configurazione

### Variabili d'Ambiente

Il gateway utilizza le seguenti variabili d'ambiente:

```bash
NODE_ENV=development
JWT_ACCESS_SECRET=dev-access-secret
AUTH_SERVICE_URL=http://auth-service:3001
USERS_SERVICE_URL=http://users-service:3002
NOTES_SERVICE_URL=http://notes-service:3003
CORS_ORIGIN=*
```

### Volumi Docker

- `./gateway:/app` - Codice sorgente del gateway
- `./swagger.yaml:/app/swagger.yaml:ro` - Documentazione Swagger
- `./services/*:/app` - Codice sorgente dei microservizi
- `postgres_data:/var/lib/postgresql/data` - Dati PostgreSQL
- `mongo_data:/data/db` - Dati MongoDB

## Documentazione API

### Accesso alla Documentazione

1. **Swagger UI**: http://localhost:3000/api-docs
   - Interfaccia interattiva per testare l'API
   - Gestione automatica dei cookie per l'autenticazione
   - Design responsive per mobile e desktop

2. **API JSON**: http://localhost:3000/swagger.json
   - Specifica OpenAPI 3.0 in formato JSON
   - Utilizzabile per generare client SDK
   - Importabile in Postman, Insomnia, etc.

### Caratteristiche della Documentazione

- **Tutti gli endpoint** documentati con esempi
- **Autenticazione JWT** con cookie HTTP-only
- **Testing interattivo** direttamente dall'interfaccia
- **Responsive design** per mobile e desktop
- **Ricerca e filtri** per trovare endpoint specifici

## Sviluppo

### Hot Reload

Tutti i servizi supportano il hot reload:
- Modifiche al codice vengono applicate automaticamente
- La documentazione Swagger si aggiorna in tempo reale
- I database mantengono i dati tra i riavvii

### Debugging

Per debuggare i servizi:

```bash
# Logs del gateway
docker-compose -f docker-compose.dev.yml logs gateway

# Logs di tutti i servizi
docker-compose -f docker-compose.dev.yml logs

# Logs in tempo reale
docker-compose -f docker-compose.dev.yml logs -f
```

### Database

I database sono persistenti tra i riavvii:
- **PostgreSQL**: Dati salvati in `postgres_data` volume
- **MongoDB**: Dati salvati in `mongo_data` volume

Per resettare i database:
```bash
docker-compose -f docker-compose.dev.yml down -v
```

## Troubleshooting

### Problemi Comuni

**Porta già in uso**:
```bash
# Verifica porte in uso
lsof -i :3000
lsof -i :4200

# Ferma processi in conflitto
docker-compose -f docker-compose.dev.yml down
```

**Documentazione non si carica**:
```bash
# Verifica che il file swagger.yaml esista
ls -la swagger.yaml

# Riavvia solo il gateway
docker-compose -f docker-compose.dev.yml restart gateway
```

**Errori di autenticazione**:
- Verifica che i microservizi siano in esecuzione
- Controlla i log per errori specifici
- Assicurati che i database siano inizializzati

### Logs e Debug

```bash
# Logs dettagliati del gateway
docker-compose -f docker-compose.dev.yml logs gateway --tail=100

# Logs di un servizio specifico
docker-compose -f docker-compose.dev.yml logs auth-service

# Logs in tempo reale
docker-compose -f docker-compose.dev.yml logs -f gateway
```

## Comandi Utili

### Gestione Container

```bash
# Avvia servizi
docker-compose -f docker-compose.dev.yml up

# Avvia in background
docker-compose -f docker-compose.dev.yml up -d

# Ferma servizi
docker-compose -f docker-compose.dev.yml down

# Riavvia un servizio
docker-compose -f docker-compose.dev.yml restart gateway

# Rebuild e avvia
docker-compose -f docker-compose.dev.yml up --build
```

### Pulizia

```bash
# Ferma e rimuove container
docker-compose -f docker-compose.dev.yml down

# Rimuove anche i volumi (ATTENZIONE: cancella i dati)
docker-compose -f docker-compose.dev.yml down -v

# Rimuove immagini non utilizzate
docker image prune
```

## Risorse Aggiuntive

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Guida completa alla documentazione
- [swagger.yaml](./swagger.yaml) - Specifica OpenAPI completa
- [README.md](./README.md) - Documentazione principale del progetto

---

**Nota**: La documentazione API è integrata nel gateway e disponibile automaticamente quando avvii i servizi con Docker Compose.
