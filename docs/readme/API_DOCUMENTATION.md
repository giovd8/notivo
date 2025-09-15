# Documentazione API Notivo

Questa guida spiega come accedere e utilizzare la documentazione API di Notivo.

## Accesso alla Documentazione

### Swagger UI (Interfaccia Web)
La documentazione interattiva è disponibile all'indirizzo:
```
http://localhost:3000/api-docs
```

### API JSON
La specifica OpenAPI in formato JSON è disponibile all'indirizzo:
```
http://localhost:3000/swagger.json
```

## Come Avviare la Documentazione

### Opzione 1: Con Script (Raccomandato)
```bash
# Avvia tutti i servizi inclusa la documentazione
./scripts/dev-up.sh
```

### Opzione 2: Con Docker Compose
```bash
# Avvia tutti i servizi inclusa la documentazione
docker-compose -f docker-compose.dev.yml up
```

### Opzione 3: Sviluppo Locale
```bash
cd gateway
npm run dev
```

2. **Apri il browser** e vai su `http://localhost:3000/api-docs`

## Funzionalità della Documentazione

### Cosa Puoi Fare
- **Esplorare tutti gli endpoint** dell'API
- **Testare le chiamate** direttamente dall'interfaccia
- **Visualizzare gli schemi** di request/response
- **Gestire l'autenticazione** tramite cookie
- **Filtrare e cercare** endpoint specifici
- **Visualizzare esempi** per ogni endpoint

### Autenticazione
La documentazione supporta l'autenticazione tramite cookie HTTP-only:
1. Effettua il login tramite `/auth/login`
2. I cookie vengono automaticamente inclusi nelle richieste successive
3. Puoi testare tutti gli endpoint protetti direttamente dall'interfaccia

### Endpoint Disponibili

#### Autenticazione
- `POST /auth/register` - Registrazione utente
- `POST /auth/register/test-users` - Registrazione utenti di test (pubblico)
- `POST /auth/login` - Login utente  
- `POST /auth/refresh` - Rinnovo token
- `POST /auth/logout` - Logout utente

#### Note
- `GET /notes` - Lista note (con filtri)
- `POST /notes` - Crea nota
- `PUT /notes/{id}` - Aggiorna nota
- `DELETE /notes/{id}` - Elimina nota
- `POST /notes/test-notes` - Crea note di test in massa (pubblico)

#### Tag
- `GET /notes/tags` - Lista tag
- `POST /notes/tags` - Crea tag (pubblico)

#### Utenti
- `GET /users` - Lista utenti
- `POST /users` - Crea utente
- `GET /users/{id}` - Dettagli utente

## Integrazione con Client

### Postman
1. Importa la collection da `http://localhost:3000/swagger.json`
2. Configura l'autenticazione per utilizzare i cookie

### Insomnia
1. Importa l'API da `http://localhost:3000/swagger.json`
2. Abilita la gestione automatica dei cookie

### Generazione Client
Puoi generare client SDK per diversi linguaggi utilizzando:
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Swagger Codegen](https://swagger.io/tools/swagger-codegen/)

## Configurazione Avanzata

### Personalizzazione Swagger UI
Modifica il file `gateway/src/configs/swagger.ts` per personalizzare:
- Stili CSS
- Opzioni di visualizzazione
- Comportamento dell'interfaccia

### Aggiunta di Nuovi Endpoint
1. Aggiorna `swagger.yaml` con i nuovi endpoint
2. Riavvia il gateway
3. La documentazione si aggiorna automaticamente

## Mobile e Testing

### Test su Dispositivi Mobili
La documentazione è responsive e funziona su:
- Smartphone
- Tablet
- Desktop

### Testing API
Utilizza la sezione "Try it out" per:
- Testare endpoint specifici
- Verificare la validazione dei dati
- Controllare i codici di risposta
- Debug delle richieste

## Troubleshooting

### Problemi Comuni

**Documentazione non si carica**:
- Verifica che il gateway sia in esecuzione
- Controlla che la porta 3000 sia libera
- Verifica i log del gateway per errori

**Errori di autenticazione**:
- Assicurati di aver effettuato il login
- Controlla che i cookie siano abilitati
- Verifica che il token non sia scaduto

**Endpoint non funzionanti**:
- Verifica che i microservizi siano in esecuzione
- Controlla la configurazione del proxy
- Verifica i log per errori specifici

## Supporto

Per problemi o domande:
- Controlla i log del gateway
- Verifica la configurazione dei servizi
- Consulta la documentazione OpenAPI completa

---

**Nota**: Questa documentazione è generata automaticamente dal file `swagger.yaml` e si aggiorna in tempo reale con le modifiche al codice.
