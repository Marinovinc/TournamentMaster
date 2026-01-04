# Guida Deploy Backend su Railway

**Data:** 2026-01-03
**Progetto:** TournamentMaster Backend
**Tecnologia:** Node.js + Express + Prisma + MySQL

---

## TODO - PROSSIME ATTIVITA'

| Priorita' | Task | Stato |
|-----------|------|-------|
| ALTA | Configurare backup automatico database Railway | DA FARE |
| ALTA | Testare tutte le funzionalita' frontend su Railway | DA FARE |
| MEDIA | Configurare CI/CD automatico (GitHub Actions) | DA FARE |
| MEDIA | Configurare dominio personalizzato | DA FARE |
| BASSA | Ottimizzare tempo di deploy | DA FARE |
| BASSA | Documentare procedure disaster recovery | DA FARE |

---

## DOCUMENTI CORRELATI

| Documento | Descrizione | Percorso |
|-----------|-------------|----------|
| **HANDOVER Sessione** | Cronologia lavori, errori, lezioni apprese | `HANDOVER_SESSIONE_RAILWAY_DEPLOY_20260103.md` |
| **Documento Tecnico** | Riferimenti completi: connessioni, credenziali, API, troubleshooting | `DOCUMENTO_TECNICO_RAILWAY_DEPLOY_20260103.md` |
| **Script Verifica Sync** | Confronto completo database locale vs Railway | `backend/verify_sync.js` |
| **Script Confronto Tabelle** | Confronto conteggi record | `backend/compare_all_tables.js` |
| **Script Lista Utenti** | Lista utenti Railway con ruoli | `backend/list_all_users.js` |

---

## INDICE

1. [Prerequisiti](#1-prerequisiti)
2. [Installazione Railway CLI](#2-installazione-railway-cli)
3. [Deploy Automatico con Script](#3-deploy-automatico-con-script)
4. [Deploy Manuale Step-by-Step](#4-deploy-manuale-step-by-step)
5. [Configurazione Database MySQL](#5-configurazione-database-mysql)
6. [Variabili d'Ambiente](#6-variabili-dambiente)
7. [Verifica Deploy](#7-verifica-deploy)
8. [Sincronizzazione Dati Locale-Railway](#8-sincronizzazione-dati-locale-railway)
9. [Aggiornamento Applicazione](#9-aggiornamento-applicazione)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. PREREQUISITI

- [x] Account Railway (gratuito su https://railway.app)
- [x] Node.js installato
- [x] Railway CLI installato (`npm install -g @railway/cli`)
- [x] Progetto backend pronto (`backend/` folder)

### Verifica Railway CLI

```bash
railway --version
# Output atteso: @railway/cli/4.x.x
```

---

## 2. INSTALLAZIONE RAILWAY CLI

Se non ancora installato:

```bash
npm install -g @railway/cli
```

### Login

```bash
railway login
```

Si aprira' il browser per autenticarsi con GitHub o email.

---

## 3. DEPLOY AUTOMATICO CON SCRIPT

Abbiamo creato uno script batch per semplificare il deploy:

```bash
# Dalla cartella TournamentMaster
DEPLOY_RAILWAY.bat
```

Lo script esegue automaticamente:
1. Login su Railway
2. Navigazione alla cartella backend
3. Creazione progetto Railway
4. Guida per aggiungere MySQL
5. Configurazione variabili d'ambiente
6. Avvio deploy

---

## 4. DEPLOY MANUALE STEP-BY-STEP

### Step 1: Login

```bash
railway login
```

### Step 2: Vai nella cartella backend

```bash
cd C:\Users\marin\Downloads\TournamentMaster\backend
```

### Step 3: Inizializza progetto

```bash
# Crea nuovo progetto
railway init

# Oppure collega a progetto esistente
railway link
```

### Step 4: Aggiungi MySQL (dalla Dashboard)

1. Vai su https://railway.app/dashboard
2. Apri il progetto appena creato
3. Clicca **"+ New"** in alto a destra
4. Seleziona **"Database"** > **"MySQL"**
5. Attendi 1-2 minuti per la creazione

### Step 5: Collega MySQL al Backend

1. Dashboard Railway > progetto
2. Clicca sul servizio backend
3. Tab **"Variables"**
4. Clicca **"Add Reference"**
5. Seleziona **MySQL** > **DATABASE_URL**

### Step 6: Configura Variabili

```bash
railway variables set JWT_SECRET="tournamentmaster-production-secret-key-2026"
railway variables set JWT_EXPIRES_IN="7d"
railway variables set JWT_REFRESH_EXPIRES_IN="30d"
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="https://tournamentmaster.app"
```

### Step 7: Deploy

```bash
railway up --detach
```

---

## 5. CONFIGURAZIONE DATABASE MYSQL

### Variabili Automatiche

Quando colleghi MySQL al servizio, Railway imposta automaticamente:

| Variabile | Descrizione |
|-----------|-------------|
| `DATABASE_URL` | Connection string completa |
| `MYSQL_HOST` | Host del database |
| `MYSQL_PORT` | Porta (default 3306) |
| `MYSQL_USER` | Username |
| `MYSQL_PASSWORD` | Password |
| `MYSQL_DATABASE` | Nome database |

### Prisma Migrate

Il deploy esegue automaticamente (da `railway.json`):

```bash
npx prisma migrate deploy && node dist/index.js
```

Questo applica tutte le migrazioni Prisma al database.

---

## 6. VARIABILI D'AMBIENTE

### Variabili Obbligatorie

| Variabile | Valore | Note |
|-----------|--------|------|
| `DATABASE_URL` | (auto da MySQL) | Collegata automaticamente |
| `JWT_SECRET` | stringa sicura | Per firma token |
| `JWT_EXPIRES_IN` | `7d` | Durata token |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Durata refresh token |
| `NODE_ENV` | `production` | Ambiente |
| `PORT` | (auto) | Railway imposta automaticamente |

### Variabili Opzionali

| Variabile | Valore | Note |
|-----------|--------|------|
| `FRONTEND_URL` | URL frontend | Per CORS |
| `CLOUDINARY_URL` | URL Cloudinary | Per upload immagini |

### Impostare da CLI

```bash
railway variables set NOME_VARIABILE="valore"
```

### Impostare da Dashboard

1. Railway Dashboard > Progetto > Servizio
2. Tab "Variables"
3. Aggiungi variabile

---

## 7. VERIFICA DEPLOY

### Controlla Stato Deploy

```bash
railway status
```

### Vedi Log

```bash
railway logs
```

### URL Pubblico

Dopo il deploy, il backend sara' disponibile su:
```
https://[nome-progetto].up.railway.app
```

### Test Endpoint

```bash
# Health check
curl https://[nome-progetto].up.railway.app/health

# Oppure
curl https://[nome-progetto].up.railway.app/api/v1/status
```

---

## 8. SINCRONIZZAZIONE DATI LOCALE-RAILWAY

Questa sezione spiega come mantenere sincronizzati i dati tra il database locale e Railway.

### 8.1 Verifica Stato Sincronizzazione

**Script consigliato:** `verify_sync.js`

```bash
cd C:\Users\marin\Downloads\TournamentMaster\backend
node verify_sync.js
```

**Output:** Report dettagliato con:
- Conteggio record per tutte le 16 tabelle
- Verifica hash password utenti
- Stato tenant e tornei
- File JSON di report salvato automaticamente

### 8.2 Procedura Completa di Sincronizzazione

**Quando usarla:** Dopo modifiche significative al database locale.

```bash
# Step 1: Vai nella cartella backend
cd C:\Users\marin\Downloads\TournamentMaster\backend

# Step 2: Esporta dati dal database locale
d:/xampp/mysql/bin/mysqldump.exe -u root tournamentmaster --skip-add-drop-table --no-create-info --complete-insert > data_export.sql

# Step 3: Pulisci database Railway (ATTENZIONE: cancella tutti i dati!)
node clean_and_import.js

# Step 4: Importa dati su Railway
node import_sql.js

# Step 5: Verifica sincronizzazione
node verify_sync.js

# Step 6: (Opzionale) Verifica lista utenti
node list_all_users.js
```

### 8.3 Sincronizzazione Schema Prisma

Se hai modificato `schema.prisma`:

```bash
# Imposta DATABASE_URL per Railway
set DATABASE_URL=mysql://root:wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd@hopper.proxy.rlwy.net:48529/railway

# Sincronizza schema (aggiunge colonne mancanti)
npx prisma db push --skip-generate

# Verifica
npx prisma db pull
```

### 8.4 Confronto Rapido Conteggi

Per un confronto veloce solo dei conteggi:

```bash
node compare_all_tables.js
```

**Output esempio:**
```
Tabella                  | LOCALE | RAILWAY | STATUS
-------------------------|--------|---------|--------
user                     | 29     | 29      | OK
tenant                   | 4      | 4       | OK
tournament               | 16     | 16      | OK
...
TUTTI I DATI CORRISPONDONO
```

### 8.5 Connessioni Database

| Database | Connection String |
|----------|-------------------|
| **Locale** | `mysql://root@localhost:3306/tournamentmaster` |
| **Railway** | `mysql://root:wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd@hopper.proxy.rlwy.net:48529/railway` |

**Nota:** La password Railway e': `wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd`

---

## 9. AGGIORNAMENTO APPLICAZIONE

### 9.1 Aggiornare Backend

```bash
cd C:\Users\marin\Downloads\TournamentMaster\backend

# Verifica modifiche
git status

# Commit modifiche
git add .
git commit -m "Descrizione modifiche"

# Deploy su Railway
railway up --detach

# Verifica log
railway logs -f
```

### 9.2 Aggiornare Frontend

```bash
cd C:\Users\marin\Downloads\TournamentMaster\frontend

# Verifica modifiche
git status

# Commit modifiche
git add .
git commit -m "Descrizione modifiche"

# Deploy su Railway
railway up --detach

# Verifica log
railway logs -f
```

### 9.3 Verifica Dopo Aggiornamento

```bash
# Test health check
curl https://backend-production-70dd0.up.railway.app/health

# Test login
curl -X POST https://backend-production-70dd0.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ischiafishing.it","password":"demo123"}'
```

### 9.4 URL Servizi Attuali

| Servizio | URL |
|----------|-----|
| **Frontend** | https://frontend-production-d957.up.railway.app |
| **Backend** | https://backend-production-70dd0.up.railway.app |
| **MySQL (pubblico)** | hopper.proxy.rlwy.net:48529 |

---

## 10. TROUBLESHOOTING

### Errore: "Cannot login in non-interactive mode"

**Causa:** Railway CLI richiede browser per login.

**Soluzione:** Esegui `railway login` in un terminale interattivo (non da script).

### Errore: "Project not found"

**Causa:** Non sei nella cartella corretta o progetto non inizializzato.

**Soluzione:**
```bash
cd C:\Users\marin\Downloads\TournamentMaster\backend
railway link
```

### Errore: "Database connection failed"

**Causa:** DATABASE_URL non collegata.

**Soluzione:**
1. Dashboard > Progetto > Servizio backend
2. Variables > Add Reference
3. Seleziona MySQL > DATABASE_URL

### Errore: "Prisma migrate failed"

**Causa:** Schema Prisma non sincronizzato.

**Soluzione:**
```bash
# Localmente
npx prisma generate
npx prisma migrate dev

# Poi rideploya
railway up
```

### Build fallita

**Verifica log:**
```bash
railway logs --build
```

**Cause comuni:**
- `package.json` mancante
- Dipendenze non installate
- TypeScript errors

---

## COMANDI UTILI

```bash
# Login
railway login

# Stato progetto
railway status

# Log in tempo reale
railway logs -f

# Variabili
railway variables
railway variables set KEY="value"

# Deploy
railway up
railway up --detach  # Non blocca terminale

# Apri dashboard
railway open

# Disconnetti progetto
railway unlink
```

---

## DOPO IL DEPLOY

### 1. Aggiorna Frontend

Modifica `mobile/.env.production`:
```
API_BASE_URL=https://[nome-progetto].up.railway.app/v1
```

### 2. Configura Dominio Personalizzato (Opzionale)

1. Dashboard > Progetto > Servizio
2. Tab "Settings"
3. "Custom Domain"
4. Aggiungi `api.tournamentmaster.app`
5. Configura DNS del tuo dominio

### 3. Verifica Funzionamento

```bash
# Test registrazione
curl -X POST https://[url]/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!","name":"Test"}'
```

---

## COSTI RAILWAY

| Piano | Costo | Risorse |
|-------|-------|---------|
| **Hobby** | $5/mese | 512MB RAM, 1 vCPU |
| **Pro** | $20/mese | Risorse scalabili |
| **Trial** | Gratuito | $5 credito iniziale |

Il backend TournamentMaster funziona bene con il piano Hobby.

---

## PROSSIMI PASSI

### Deploy Iniziale (Completato)

1. [x] Installa Railway CLI
2. [x] Esegui `DEPLOY_RAILWAY.bat`
3. [x] Aggiungi MySQL dalla dashboard
4. [x] Verifica deploy con `railway logs`
5. [x] Copia URL pubblico
6. [x] Migra dati da locale a Railway
7. [x] Verifica sincronizzazione con `verify_sync.js`

### Prossime Attivita'

1. [ ] Testare tutte le funzionalita' frontend su Railway
2. [ ] Aggiorna `mobile/.env.production` con URL Railway
3. [ ] Procedi con build iOS (`eas build`)
4. [ ] Configurare backup automatico database
5. [ ] Configurare CI/CD con GitHub Actions

---

## CREDENZIALI UTENTI

| Email | Password | Ruolo |
|-------|----------|-------|
| marino@unitec.it | Gersthofen22 | SUPER_ADMIN |
| admin@ischiafishing.it | demo123 | SUPER_ADMIN |
| admin@marebluclub.it | demo123 | TENANT_ADMIN |
| admin@pescanapolisport.it | demo123 | TENANT_ADMIN |
| presidente@ischiafishing.it | demo123 | PRESIDENT |
| giudice@ischiafishing.it | demo123 | JUDGE |
| *.demo.it | demo123 | PARTICIPANT |

---

## PROCEDURA LOGIN FRONTEND

### Via Browser

1. Aprire: https://frontend-production-d957.up.railway.app
2. Cliccare **"Accedi"** nel menu
3. Inserire email e password dalla tabella sopra
4. Cliccare **"Accedi"**
5. Redirect automatico a `/dashboard/admin` (per SUPER_ADMIN)

### Via API (curl)

```bash
# Login
curl -X POST https://backend-production-70dd0.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"marino@unitec.it","password":"Gersthofen22"}'

# Risposta: accessToken e refreshToken per chiamate successive
```

### Test Automatico (Playwright)

```bash
cd C:\Users\marin\Downloads\TournamentMaster
python test_railway_login_v3.py
```

**Output atteso:** URL finale `https://frontend-production-d957.up.railway.app/dashboard/admin`

---

*Guida creata il 2026-01-03 per deploy TournamentMaster su Railway*
*Ultimo aggiornamento: 2026-01-03 - Aggiunta sincronizzazione dati e ToDo*
