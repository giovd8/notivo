# Notivo

Sistema di gestione note condivise basato su microservizi con documentazione API completa e deployment in produzione.

## Demo Live

**Applicazione in produzione**: [notivo.giovannividotto.it](https://notivo.giovannividotto.it)

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

## Architettura

Il progetto è basato su microservizi con architettura moderna:

### Servizi Backend
- **Gateway** (Port 3000): API Gateway con documentazione Swagger integrata
- **Auth Service** (Port 3001): Autenticazione JWT e gestione sessioni
- **Notes Service** (Port 3003): CRUD note, tag e condivisioni
- **Users Service** (Port 3002): Gestione anagrafica utenti

### Frontend
- **Angular 20** (Port 4200): SPA moderna con Signal Store e Tailwind CSS

### Database
- **PostgreSQL**: Database relazionale per dati strutturati (utenti, note, tag)
- **MongoDB**: Cache denormalizzate per performance ottimali

## Caratteristiche Principali

### Sicurezza Avanzata
- **Autenticazione JWT** con refresh token automatico
- **Cookie HTTP-only** per protezione XSS
- **Rate limiting** e validazione input completa
- **CORS** configurato per ambienti multipli

### Documentazione API Completa
- **Swagger UI** integrata nel gateway
- **Testing interattivo** direttamente dall'interfaccia
- **Generazione automatica** da codice TypeScript
- **Design responsive** per mobile e desktop

### Frontend Moderno
- **Angular 20** con architettura standalone
- **@ngrx/signals** per gestione stato reattiva
- **Tailwind CSS v4** per styling utility-first
- **Editor rich text** con Quill 2
- **Accessibilità** conforme alle best practices

### Performance e Scalabilità
- **Cache intelligenti** in MongoDB per ridurre query
- **Lazy loading** dei componenti Angular
- **Hot reload** in sviluppo
- **Containerizzazione** completa con Docker

## Requisiti Opzionali Implementati

Per il progetto sono stati sviluppati diversi requisiti opzionali/bonus:

### Deployment su Cloud
L'applicazione è stata deployata su **Azure** utilizzando una singola VM nel piano gratuito offerto dal provider. Sebbene l'utilizzo di Kubernetes sarebbe stato più indicato per la gestione di container e scalabilità, le limitazioni del free tier hanno reso più pratico l'impiego di una singola macchina virtuale.

### Accessibilità Lato Frontend
Il frontend web è stato sviluppato seguendo le **best practices per l'accessibilità**, garantendo una fruizione corretta anche a utenti con disabilità visive o motorie. Implementate semantic HTML, ARIA labels, navigazione da tastiera e contrasti appropriati.

### Buone Pratiche di Sicurezza
Sono state adottate ulteriori misure di sicurezza, tra cui:
- **Rate limiting** per prevenire attacchi DDoS
- **Validazione completa degli input** con Zod
- **Gestione sicura delle credenziali** con bcrypt
- **Header di sicurezza** tramite Helmet.js
- **Gestione errori centralizzata** per evitare information disclosure

## Sviluppo

### Prerequisiti
- Node.js 20+
- Docker & Docker Compose
- npm o yarn

### Installazione
```bash
# Clona il repository
git clone https://github.com/giovd8/notivo.git
cd notivo

# Installa dipendenze per ogni servizio con
npm install

# Avvia tutti i servizi
docker-compose -f docker-compose.dev.yml up
```

### Script Disponibili
- `./scripts/dev-up.sh` - Avvia tutti i servizi con documentazione integrata
- `./scripts/dev-down.sh` - Ferma tutti i servizi

## Tecnologie

### Backend
- **Node.js 20** con Express 5
- **TypeScript** per type safety
- **PostgreSQL** per dati relazionali
- **MongoDB** per cache e sessioni

### Frontend
- **Angular 20** con architettura standalone
- **@ngrx/signals** per state management
- **Tailwind CSS v4** per styling
- **Quill 2** per editor rich text

### DevOps
- **Docker & Docker Compose** per containerizzazione
- **Nginx** per reverse proxy
- **Azure** per deployment in produzione

## Documentazione Dettagliata

Per maggiori dettagli consultare i file markdown contenuti in `/docs/readme`:

- **Servizi**: Documentazione tecnica dettagliata per ogni microservizio
- **Database**: Schema e relazioni per PostgreSQL e MongoDB
- **API**: Guida completa alla documentazione OpenAPI
- **Docker**: Configurazione e setup dell'ambiente containerizzato
- **Quick Start**: Guida rapida per l'avvio del progetto


**Sviluppato da**: Giovanni Vidotto  
**Email**: giovanni.vidotto@hotmail.it  
**Demo Live**: [notivo.giovannividotto.it](https://notivo.giovannividotto.it)