# DOCUMENTO TECNICO - Deploy Railway e Gestione Database

**Data:** 2026-01-03
**Progetto:** TournamentMaster
**Versione:** 1.0
**Autore:** Claude Code (Opus 4.5)

---

## INDICE

1. [Architettura Sistema](#1-architettura-sistema)
2. [Connessioni Database](#2-connessioni-database)
3. [Credenziali e Accessi](#3-credenziali-e-accessi)
4. [Script di Gestione](#4-script-di-gestione)
5. [Procedure Operative](#5-procedure-operative)
6. [API Endpoints](#6-api-endpoints)
7. [Struttura Database](#7-struttura-database)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. ARCHITETTURA SISTEMA

### 1.1 Componenti Deployati

```
┌─────────────────────────────────────────────────────────────────┐
│                         RAILWAY CLOUD                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │    FRONTEND      │    │     BACKEND      │                   │
│  │   (Next.js)      │───>│  (Express.js)    │                   │
│  │                  │    │                  │                   │
│  │ Port: 443 (HTTPS)│    │ Port: 443 (HTTPS)│                   │
│  └──────────────────┘    └────────┬─────────┘                   │
│                                   │                              │
│                                   v                              │
│                          ┌──────────────────┐                   │
│                          │     MySQL        │                   │
│                          │   (Database)     │                   │
│                          │  Port: 3306      │                   │
│                          └──────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 URL Servizi

| Servizio | URL Pubblico | URL Interno |
|----------|--------------|-------------|
| **Frontend** | https://frontend-production-d957.up.railway.app | - |
| **Backend** | https://backend-production-70dd0.up.railway.app | - |
| **MySQL** | hopper.proxy.rlwy.net:48529 | mysql.railway.internal:3306 |

### 1.3 Tecnologie

| Componente | Stack |
|------------|-------|
| Frontend | Next.js 14, React 18, TailwindCSS |
| Backend | Node.js, Express.js, TypeScript |
| ORM | Prisma 5.22 |
| Database | MySQL 8.0 |
| Auth | JWT (jsonwebtoken), bcryptjs |

---

## 2. CONNESSIONI DATABASE

### 2.1 Database Locale

```javascript
// Connessione database LOCALE (sviluppo)
const DATABASE_URL = "mysql://root@localhost:3306/tournamentmaster"

// Uso con Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root@localhost:3306/tournamentmaster'
    }
  }
});
```

**Caratteristiche:**
- Host: localhost
- Porta: 3306
- Utente: root
- Password: (nessuna)
- Database: tournamentmaster

### 2.2 Database Railway (Produzione)

```javascript
// Connessione database RAILWAY (produzione)
// URL PUBBLICA (per accesso esterno)
const DATABASE_URL = "mysql://root:wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd@hopper.proxy.rlwy.net:48529/railway"

// URL INTERNA (per servizi Railway)
const DATABASE_URL_INTERNAL = "mysql://root:wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd@mysql.railway.internal:3306/railway"

// Uso con Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd@hopper.proxy.rlwy.net:48529/railway'
    }
  }
});
```

**Caratteristiche:**
- Host pubblico: hopper.proxy.rlwy.net
- Porta pubblica: 48529
- Host interno: mysql.railway.internal
- Porta interna: 3306
- Utente: root
- Password: wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd
- Database: railway

### 2.3 Differenze Importanti

| Aspetto | Locale | Railway |
|---------|--------|---------|
| Nome database | tournamentmaster | railway |
| Password root | (vuota) | wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd |
| Porta | 3306 | 48529 (pubblica) |
| Accesso esterno | No | Si (via proxy) |

---

## 3. CREDENZIALI E ACCESSI

### 3.1 Utenti Applicazione

| Email | Password | Ruolo | Tenant |
|-------|----------|-------|--------|
| marino@unitec.it | Gersthofen22 | SUPER_ADMIN | (nessuno) |
| admin@ischiafishing.it | demo123 | SUPER_ADMIN | IschiaFishing |
| admin@marebluclub.it | demo123 | TENANT_ADMIN | Mare Blu Club |
| admin@pescanapolisport.it | demo123 | TENANT_ADMIN | Pesca Sportiva Napoli |
| presidente@ischiafishing.it | demo123 | PRESIDENT | IschiaFishing |
| giudice@ischiafishing.it | demo123 | JUDGE | IschiaFishing |
| *.demo.it | demo123 | PARTICIPANT | IschiaFishing |

### 3.2 Accesso Railway Dashboard

- URL: https://railway.app/dashboard
- Login: via GitHub o email associata al progetto

### 3.3 Railway CLI

```bash
# Login
railway login

# Verifica sessione
railway whoami

# Logout
railway logout
```

---

## 4. SCRIPT DI GESTIONE

### 4.1 Percorso Script

```
C:\Users\marin\Downloads\TournamentMaster\backend\
├── compare_all_tables.js      # Confronto locale vs Railway
├── list_all_users.js          # Lista utenti con ruoli
├── clean_and_import.js        # Pulizia database Railway
├── import_sql.js              # Import SQL dump
├── seed_railway.js            # Seed dati iniziali
├── verify_sync.js             # Verifica sincronizzazione (da creare)
└── data_export.sql            # Dump dati esportati
```

### 4.2 compare_all_tables.js

**Scopo:** Confronta conteggio record tra database locale e Railway per TUTTE le tabelle.

**Uso:**
```bash
cd C:\Users\marin\Downloads\TournamentMaster\backend
node compare_all_tables.js
```

**Output esempio:**
```
=== CONFRONTO COMPLETO LOCALE vs RAILWAY ===

Tabella                  | LOCALE | RAILWAY | STATUS
-------------------------|--------|---------|--------
user                     | 29     | 29      | OK
tenant                   | 4      | 4       | OK
...
TUTTI I DATI CORRISPONDONO
```

### 4.3 list_all_users.js

**Scopo:** Lista tutti gli utenti nel database Railway raggruppati per ruolo.

**Uso:**
```bash
node list_all_users.js
```

### 4.4 clean_and_import.js

**Scopo:** Svuota TUTTE le tabelle del database Railway (per reimport pulito).

**Uso:**
```bash
node clean_and_import.js
```

**ATTENZIONE:** Questo script CANCELLA tutti i dati!

### 4.5 import_sql.js

**Scopo:** Importa dati da file SQL dump nel database Railway.

**Prerequisito:** File `data_export.sql` nella stessa cartella.

**Uso:**
```bash
# Prima esporta dal locale
d:/xampp/mysql/bin/mysqldump.exe -u root tournamentmaster --skip-add-drop-table --no-create-info --complete-insert > data_export.sql

# Poi importa su Railway
node import_sql.js
```

---

## 5. PROCEDURE OPERATIVE

### 5.1 Aggiornare Dati su Railway

**Procedura completa per sincronizzare dati da locale a Railway:**

```bash
# Step 1: Vai nella cartella backend
cd C:\Users\marin\Downloads\TournamentMaster\backend

# Step 2: Esporta dati dal database locale
d:/xampp/mysql/bin/mysqldump.exe -u root tournamentmaster --skip-add-drop-table --no-create-info --complete-insert > data_export.sql

# Step 3: Pulisci database Railway
node clean_and_import.js

# Step 4: Importa dati su Railway
node import_sql.js

# Step 5: Verifica sincronizzazione
node compare_all_tables.js

# Step 6: Verifica utenti
node list_all_users.js
```

### 5.2 Aggiornare Applicazione Backend su Railway

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

### 5.3 Aggiornare Applicazione Frontend su Railway

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

### 5.4 Verifica Salute Sistema

```bash
# Test backend locale
curl http://localhost:3001/health

# Test backend Railway
curl https://backend-production-70dd0.up.railway.app/health

# Test login locale
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ischiafishing.it","password":"demo123"}'

# Test login Railway
curl -X POST https://backend-production-70dd0.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ischiafishing.it","password":"demo123"}'
```

---

## 6. API ENDPOINTS

### 6.1 Autenticazione

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | /api/auth/login | Login utente |
| POST | /api/auth/register | Registrazione |
| POST | /api/auth/refresh | Refresh token |
| POST | /api/auth/logout | Logout |

**Esempio Login:**
```bash
curl -X POST https://backend-production-70dd0.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"marino@unitec.it","password":"Gersthofen22"}'
```

**Risposta:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "4afe64aa-d009-49b2-ab28-29a814033989",
      "email": "marino@unitec.it",
      "firstName": "Vincenzo",
      "lastName": "Marino",
      "role": "SUPER_ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "975e76b1-b07f-41ae-8054-..."
  }
}
```

### 6.2 Health Check

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | /health | Stato servizio |
| GET | /api/v1/status | Stato API |

### 6.3 Login via Frontend (Browser)

**URL:** https://frontend-production-d957.up.railway.app

**Procedura:**
1. Aprire URL frontend nel browser
2. Cliccare **"Accedi"** nel menu in alto
3. Inserire credenziali (vedi Sezione 3.1)
4. Cliccare bottone **"Accedi"**
5. Redirect automatico a dashboard

**Dashboard per ruolo:**
| Ruolo | URL dopo login |
|-------|----------------|
| SUPER_ADMIN | /dashboard/admin |
| TENANT_ADMIN | /dashboard |
| Altri | /dashboard |

**Test automatico:**
```bash
cd C:\Users\marin\Downloads\TournamentMaster
python test_railway_login_v3.py
```

---

## 7. STRUTTURA DATABASE

### 7.1 Tabelle Prisma

| Tabella | Modello Prisma | Descrizione |
|---------|----------------|-------------|
| users | User | Utenti sistema |
| tenants | Tenant | Organizzazioni/Club |
| tournaments | Tournament | Tornei |
| species | Species | Specie pesci |
| teams | Team | Squadre |
| team_members | TeamMember | Membri squadre |
| catches | Catch | Catture registrate |
| fishing_zones | FishingZone | Zone di pesca |
| tournament_registrations | TournamentRegistration | Iscrizioni tornei |
| tournament_species | TournamentSpecies | Specie per torneo |
| tournament_staff | TournamentStaff | Staff torneo |
| leaderboard_entries | LeaderboardEntry | Classifica |
| strikes | Strike | Penalita' |
| documents | Document | Documenti |
| audit_logs | AuditLog | Log audit |
| refresh_tokens | RefreshToken | Token refresh |

### 7.2 Schema Prisma (Estratto)

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  fipsasNumber  String?
  role          UserRole
  avatar        String?
  isActive      Boolean  @default(true)
  isVerified    Boolean  @default(false)
  lastLoginAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  tenantId      String?
  tenant        Tenant?  @relation(fields: [tenantId], references: [id])
}

enum UserRole {
  SUPER_ADMIN
  TENANT_ADMIN
  PRESIDENT
  JUDGE
  PARTICIPANT
}
```

### 7.3 Conteggio Record Attuali

| Tabella | Record |
|---------|--------|
| users | 29 |
| tenants | 4 |
| tournaments | 16 |
| species | 5 |
| teams | 7 |
| teamMembers | 0 |
| catches | 108 |
| fishingZones | 16 |
| tournamentRegistrations | 50 |
| tournamentSpecies | 80 |
| tournamentStaff | 0 |
| leaderboardEntries | 11 |
| strikes | 46 |
| documents | 0 |
| auditLogs | 0 |
| refreshTokens | 21 |

---

## 8. TROUBLESHOOTING

### 8.1 Login Fallisce su Railway

**Sintomo:** "Invalid credentials" anche con password corretta

**Diagnosi:**
```bash
# Verifica password hash
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient({
  datasources: { db: { url: 'mysql://root:wwIdFgNPfUOEyycFytcEDLjpvxCTmFZd@hopper.proxy.rlwy.net:48529/railway' }}
});
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'EMAIL_UTENTE' },
    select: { passwordHash: true }
  });
  console.log('Match:', await bcrypt.compare('PASSWORD', user.passwordHash));
}
main();
"
```

**Soluzione:** Aggiornare password con script dedicato.

### 8.2 Dati Non Sincronizzati

**Sintomo:** Conteggi diversi tra locale e Railway

**Diagnosi:**
```bash
node compare_all_tables.js
```

**Soluzione:** Eseguire procedura completa di sync (Sezione 5.1)

### 8.3 Deploy Fallisce

**Sintomo:** `railway up` restituisce errore

**Diagnosi:**
```bash
railway logs --build
```

**Soluzioni comuni:**
- Verificare `package.json` presente
- Verificare TypeScript compila senza errori
- Verificare variabili d'ambiente configurate

### 8.4 Database Connection Refused

**Sintomo:** Prisma non riesce a connettersi

**Verifica:**
```bash
# Test connessione diretta
mysql -h hopper.proxy.rlwy.net -P 48529 -u root -pwwIdFgNPfUOEyycFytcEDLjpvxCTmFZd railway -e "SELECT 1"
```

**Soluzioni:**
- Verificare URL database corretta
- Verificare servizio MySQL attivo su Railway
- Verificare firewall non blocchi porta

---

## RIFERIMENTI

| Documento | Percorso |
|-----------|----------|
| HANDOVER Sessione | HANDOVER_SESSIONE_RAILWAY_DEPLOY_20260103.md |
| Guida Deploy Railway | GUIDA_DEPLOY_RAILWAY.md |
| Documentazione Completa | DOCUMENTAZIONE_COMPLETA_TOURNAMENTMASTER.md |
| Schema Prisma | backend/prisma/schema.prisma |

---

*Documento generato il 2026-01-03*
*Per continuare il lavoro, seguire le procedure in Sezione 5*
