# Notivo

Sistema di gestione note condivise basato su microservizi con documentazione API completa.

## Quick Start

### Avvio Rapido con Documentazione
```bash
# Avvia tutti i servizi inclusa la documentazione API integrata
./scripts/dev-up.sh

# Oppure manualmente
docker-compose -f docker-compose.dev.yml up
```

### Accesso alla Documentazione
- **Swagger UI**: http://localhost:3000/api-docs
- **API JSON**: http://localhost:3000/swagger.json
- **Frontend**: http://localhost:4200

## Documentazione API

La documentazione completa dell'API è disponibile in formato OpenAPI 3.0 e include:

- **Tutti gli endpoint** documentati con esempi
- **Autenticazione JWT** con cookie HTTP-only
- **Testing interattivo** direttamente dall'interfaccia
- **Responsive design** per mobile e desktop
- **Ricerca e filtri** per trovare endpoint specifici

### Caratteristiche della Documentazione

- **Swagger UI** per esplorazione interattiva
- **Generazione automatica** da codice TypeScript
- **Esempi reali** per ogni endpoint
- **Gestione errori** completa
- **Schemi di validazione** per request/response

## Architettura

Il progetto è basato su microservizi:

- **Gateway** (Port 3000): API Gateway con documentazione Swagger
- **Auth Service** (Port 3001): Autenticazione e autorizzazione
- **Notes Service** (Port 3003): Gestione note e tag
- **Users Service** (Port 3002): Gestione utenti
- **Frontend** (Port 4200): Interfaccia Angular
- **PostgreSQL**: Database relazionale
- **MongoDB**: Database documentale

## Sviluppo

### Prerequisiti
- Node.js 20+
- Docker & Docker Compose
- npm o yarn

### Installazione
```bash
# Clona il repository
git clone <repository-url>
cd notivo

# Installa dipendenze
npm install

# Avvia tutti i servizi
docker-compose -f docker-compose.dev.yml up
```

### Script Disponibili
- `./scripts/dev-up.sh` - Avvia tutti i servizi con documentazione integrata
- `./scripts/dev-down.sh` - Ferma tutti i servizi

## Documentazione Dettagliata

Per informazioni complete sulla documentazione API, consulta:
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Guida completa alla documentazione
- [swagger.yaml](./swagger.yaml) - Specifica OpenAPI completa

## Tecnologie

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, MongoDB
- **Frontend**: Angular 17, Tailwind CSS
- **Documentazione**: OpenAPI 3.0, Swagger UI
- **Containerizzazione**: Docker, Docker Compose
- **Autenticazione**: JWT, HTTP-only cookies

## Licenza

MIT License - vedi [LICENSE](LICENSE) per dettagli.

---

**Sviluppato da**: Giovanni Vidotto  
**Email**: giovanni.vidotto@hotmail.it