# Quick Start - Notivo

Guida rapida per avviare Notivo con documentazione API integrata.

## Avvio Immediato

```bash
# Clona il repository
git clone <repository-url>
cd notivo

# Avvia tutto con un comando
./scripts/dev-up.sh
```

## Cosa Succede

Lo script `dev-up.sh` avvia automaticamente:

1. **Tutti i microservizi** (auth, users, notes)
2. **Gateway con documentazione Swagger** integrata
3. **Frontend Angular**
4. **Database** (PostgreSQL + MongoDB)
5. **Nginx** per il routing

## Servizi Disponibili

| Servizio | URL | Descrizione |
|----------|-----|-------------|
| **Frontend** | https://localhost:443 | Interfaccia utente |
| **API Docs** | http://localhost:3000/api-docs | Documentazione Swagger |
| **API JSON** | http://localhost:3000/swagger.json | Specifica OpenAPI |
| **Gateway** | http://localhost:3000 | API Gateway |

## Comandi Utili

```bash
# Avvia tutto
./scripts/dev-up.sh

# Ferma tutto
./scripts/dev-down.sh

# Logs in tempo reale
docker-compose -f docker-compose.dev.yml logs -f

# Riavvia un servizio
docker-compose -f docker-compose.dev.yml restart gateway
```

## Documentazione API

La documentazione è **integrata** nel gateway e include:

- **Tutti gli endpoint** documentati
- **Autenticazione JWT** con cookie
- **Testing interattivo** 
- **Design responsive**
- **Ricerca e filtri**

### Come Utilizzare

1. Apri http://localhost:3000/api-docs
2. Effettua il login tramite `/auth/login`
3. Testa gli endpoint protetti
4. Esplora la documentazione completa

## Sviluppo

### Hot Reload
- Modifiche al codice vengono applicate automaticamente
- La documentazione si aggiorna in tempo reale
- I database mantengono i dati tra i riavvii

### Debugging
```bash
# Logs del gateway
docker-compose -f docker-compose.dev.yml logs gateway

# Logs di tutti i servizi
docker-compose -f docker-compose.dev.yml logs

# Entra in un container
docker-compose -f docker-compose.dev.yml exec gateway sh
```

## Troubleshooting

### Porta già in uso
```bash
# Ferma tutto
./scripts/dev-down.sh

# Verifica porte
lsof -i :3000
lsof -i :443
```

### Documentazione non si carica
```bash
# Riavvia solo il gateway
docker-compose -f docker-compose.dev.yml restart gateway

# Verifica che il file swagger.yaml esista
ls -la swagger.yaml
```

### Reset completo
```bash
# Ferma e rimuove tutto (ATTENZIONE: cancella i dati)
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
```

## Documentazione Completa

- [README.md](./README.md) - Documentazione principale
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Guida API
- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Configurazione Docker
- [swagger.yaml](./swagger.yaml) - Specifica OpenAPI

---

**Sviluppato da**: Giovanni Vidotto  
**Email**: giovanni.vidotto@hotmail.it
