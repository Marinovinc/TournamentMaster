# Guida Migrazione a Server Pubblico

## TournamentMaster - Da Rete Locale a Internet

Questa guida descrive le modifiche necessarie per passare dalla configurazione locale (192.168.1.74) a un server pubblico accessibile da Internet.

---

## Situazione Attuale (Rete Locale)

```
┌─────────────────────────────────────────────────────────┐
│                    RETE LOCALE                          │
│                                                         │
│  Telefono ──WiFi──► PC (192.168.1.74)                  │
│                     ├── Frontend :3000                  │
│                     └── Backend  :3001                  │
└─────────────────────────────────────────────────────────┘
```

**Limitazioni:**
- Funziona solo sulla stessa rete WiFi
- Richiede PC sempre acceso
- IP deve rimanere 192.168.1.74

---

## Situazione Futura (Server Pubblico)

```
┌─────────────────────────────────────────────────────────┐
│                      INTERNET                           │
│                                                         │
│  Telefono ──4G/WiFi──► Cloud Server                    │
│                        ├── Frontend (Vercel/Netlify)   │
│                        └── Backend  (Railway/Render)   │
└─────────────────────────────────────────────────────────┘
```

**Vantaggi:**
- Accessibile da qualsiasi rete
- Server sempre online (99.9% uptime)
- Nessuna configurazione router necessaria

---

## Struttura del Progetto

```
TournamentMaster/
│
├── backend/                      # ⬆️ DA DEPLOYARE (Railway/Render)
│   ├── src/
│   │   ├── app.ts                # Entry point Express
│   │   ├── index.ts              # Avvio server
│   │   ├── config/               # Configurazioni
│   │   ├── controllers/          # Business logic
│   │   ├── routes/               # API endpoints
│   │   ├── services/             # Servizi (auth, tournaments, etc.)
│   │   ├── middleware/           # Auth, validation, error handling
│   │   ├── models/               # Modelli dati
│   │   ├── lib/                  # Prisma client
│   │   ├── types/                # TypeScript types
│   │   └── utils/                # Utilities
│   ├── prisma/
│   │   ├── schema.prisma         # Schema database
│   │   ├── migrations/           # Migrazioni DB
│   │   └── seed.ts               # Dati iniziali
│   ├── dist/                     # Build compilato (auto-generato)
│   ├── node_modules/             # Dipendenze (auto-generato)
│   ├── package.json              # Dipendenze Node.js
│   ├── package-lock.json         # Lock dipendenze
│   ├── tsconfig.json             # Config TypeScript
│   ├── Dockerfile                # Container Docker
│   ├── railway.json              # Config Railway
│   ├── .env                      # ⚠️ SEGRETI - NON COMMITTARE
│   └── .env.example              # Template variabili
│
├── frontend/                     # ⬆️ DA DEPLOYARE (Vercel/Netlify)
│   ├── src/
│   │   ├── app/                  # App Router Next.js (pagine)
│   │   ├── components/           # Componenti React
│   │   ├── contexts/             # React Context (auth, theme)
│   │   ├── i18n/                 # Internazionalizzazione
│   │   ├── lib/                  # Utilities (api client, utils)
│   │   ├── types/                # TypeScript types
│   │   └── middleware.ts         # Middleware Next.js
│   ├── public/
│   │   ├── icons/                # Icone app
│   │   ├── demo/                 # Immagini demo
│   │   ├── downloads/            # File scaricabili
│   │   └── manifest.json         # PWA manifest
│   ├── messages/                 # File traduzioni (it.json, en.json)
│   ├── android/                  # 📱 Progetto Android (auto-generato)
│   ├── .next/                    # Build Next.js (auto-generato)
│   ├── node_modules/             # Dipendenze (auto-generato)
│   ├── capacitor.config.json     # ⚙️ DA MODIFICARE (server.url)
│   ├── next.config.ts            # Config Next.js
│   ├── package.json              # Dipendenze Node.js
│   ├── package-lock.json         # Lock dipendenze
│   ├── tsconfig.json             # Config TypeScript
│   ├── components.json           # Config shadcn/ui
│   ├── Dockerfile                # Container Docker
│   ├── .env.production           # ⚙️ DA MODIFICARE (API URL)
│   └── .env.local                # Config locale (dev)
│
├── .github/
│   └── workflows/
│       └── build-mobile.yml      # ⚙️ DA MODIFICARE - Build APK automatico
│
├── mobile/                       # App Expo React Native (alternativa)
│   ├── src/                      # Codice sorgente
│   ├── app.json                  # Config Expo
│   ├── package.json              # Dipendenze
│   └── ...
│
├── docs/                         # Documentazione tecnica
├── temp-apk/                     # APK scaricati (solo locale)
│
├── AVVIA_SERVER.bat              # 🏠 Avvio server locale (Windows)
├── START_DEV.bat                 # 🏠 Avvio sviluppo locale (Windows)
├── docker-compose.yml            # Deploy Docker (alternativo)
├── QR_DOWNLOAD_APK.html          # Pagina QR download APK
│
├── GUIDA_*.md                    # Guide varie
├── DOCUMENTAZIONE_*.md           # Documentazione
└── *.png                         # Screenshot test (ignorabili)
```

---

## File e Cartelle per il Deploy

### Backend (Railway/Render)

**Cartella da deployare:** `backend/`

| File/Cartella | Deployare? | Note |
|---------------|------------|------|
| `src/` | ✅ Sì | Codice sorgente (app.ts, routes/, controllers/, etc.) |
| `prisma/schema.prisma` | ✅ Sì | Schema database |
| `prisma/migrations/` | ✅ Sì | Migrazioni database |
| `prisma/seed.ts` | ✅ Sì | Dati iniziali (opzionale) |
| `package.json` | ✅ Sì | Dipendenze Node.js |
| `package-lock.json` | ✅ Sì | Lock dipendenze |
| `tsconfig.json` | ✅ Sì | Config TypeScript |
| `Dockerfile` | ✅ Sì | Per container Docker |
| `railway.json` | ✅ Sì | Config Railway |
| `.env` | ❌ No | Segreti locali - configurare su hosting |
| `.env.example` | ✅ Sì | Template variabili (riferimento) |
| `node_modules/` | ❌ No | Auto-generato da `npm install` |
| `dist/` | ❌ No | Auto-generato dal build |

**Variabili d'ambiente da configurare sull'hosting:**
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=una-stringa-segreta-lunga-32-caratteri
NODE_ENV=production
PORT=3001
```

---

### Frontend (Vercel/Netlify)

**Cartella da deployare:** `frontend/`

| File/Cartella | Deployare? | Note |
|---------------|------------|------|
| `src/app/` | ✅ Sì | Pagine Next.js App Router |
| `src/components/` | ✅ Sì | Componenti React |
| `src/contexts/` | ✅ Sì | React Context (auth, theme) |
| `src/i18n/` | ✅ Sì | Config internazionalizzazione |
| `src/lib/` | ✅ Sì | API client, utilities |
| `src/types/` | ✅ Sì | TypeScript types |
| `src/middleware.ts` | ✅ Sì | Middleware Next.js |
| `public/` | ✅ Sì | Asset statici (icons, manifest.json) |
| `messages/` | ✅ Sì | File traduzioni (it.json, en.json) |
| `package.json` | ✅ Sì | Dipendenze Node.js |
| `package-lock.json` | ✅ Sì | Lock dipendenze |
| `next.config.ts` | ✅ Sì | Config Next.js |
| `tsconfig.json` | ✅ Sì | Config TypeScript |
| `components.json` | ✅ Sì | Config shadcn/ui |
| `capacitor.config.json` | ✅ Sì | Config mobile (⚙️ DA MODIFICARE) |
| `Dockerfile` | ✅ Sì | Per container Docker |
| `.env.production` | ✅ Sì | URL API (⚙️ DA MODIFICARE) |
| `.env.local` | ❌ No | Solo sviluppo locale |
| `android/` | ❌ No | Auto-generato da Capacitor |
| `node_modules/` | ❌ No | Auto-generato da `npm install` |
| `.next/` | ❌ No | Auto-generato dal build |
| `*.md` (HANDOVER, etc.) | ❌ No | Documentazione sessioni |

**Variabili d'ambiente da configurare sull'hosting:**
```env
NEXT_PUBLIC_API_URL=https://tuo-backend.railway.app
```

---

### GitHub Actions (Build APK)

**File:** `.github/workflows/build-mobile.yml`

Questo file rimane su GitHub e viene eseguito automaticamente ad ogni push.

**Modifiche richieste:**
- Riga 60 e 127: `NEXT_PUBLIC_API_URL: 'https://tuo-backend.railway.app'`

---

### File da NON Spostare (Solo Uso Locale)

Questi file restano sul tuo PC e NON vanno deployati:

| File/Cartella | Motivo |
|---------------|--------|
| `AVVIA_SERVER.bat` | Script Windows per avvio locale |
| `START_DEV.bat` | Script Windows per sviluppo |
| `temp-apk/` | APK scaricati da GitHub Actions |
| `QR_DOWNLOAD_APK.html` | Pagina QR per download locale |
| `mobile/` | App Expo alternativa (non usata per APK) |
| `docs/` | Documentazione (opzionale) |
| `*.png` | Screenshot di test |
| `docker-compose.yml` | Solo se usi Docker locale |

---

### Cartella `mobile/` (Expo - Non Usata)

La cartella `mobile/` contiene un'app Expo React Native alternativa.
**NON è usata** per generare l'APK attuale (che usa Capacitor).

Se in futuro vuoi usare Expo invece di Capacitor:
- Devi configurare EAS Build su expo.dev
- Modifica `mobile/app.json` con i tuoi dati
- L'APK viene generato da Expo, non da GitHub Actions

---

## Modifiche Richieste

### File 1: `frontend/.env.production`

**Posizione:** `frontend/.env.production`

**Prima (locale):**
```env
NEXT_PUBLIC_API_URL=http://192.168.1.74:3001
```

**Dopo (server pubblico):**
```env
NEXT_PUBLIC_API_URL=https://tuo-backend.railway.app
```

> Sostituisci `tuo-backend.railway.app` con l'URL reale del tuo backend deployato.

---

### File 2: `frontend/capacitor.config.json`

**Posizione:** `frontend/capacitor.config.json`

**Prima (locale):**
```json
{
  "server": {
    "url": "http://192.168.1.74:3000",
    "cleartext": true
  }
}
```

**Dopo (server pubblico):**
```json
{
  "server": {
    "url": "https://tuo-frontend.vercel.app",
    "cleartext": false
  }
}
```

> **Nota:** `cleartext: false` perché HTTPS non richiede traffico in chiaro.

---

### File 3: `.github/workflows/build-mobile.yml`

**Posizione:** `.github/workflows/build-mobile.yml`

**Prima (locale):**
```yaml
env:
  NEXT_PUBLIC_API_URL: 'http://192.168.1.74:3001'
```

**Dopo (server pubblico):**
```yaml
env:
  NEXT_PUBLIC_API_URL: 'https://tuo-backend.railway.app'
```

---

## Procedura Completa di Migrazione

### Step 1: Deploy Backend

1. Crea account su [Railway](https://railway.app) o [Render](https://render.com)
2. Collega il repository GitHub
3. Configura le variabili d'ambiente:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=tuo-secret-sicuro
   NODE_ENV=production
   ```
4. Deploya e ottieni l'URL (es. `https://tournamentmaster-api.railway.app`)

### Step 2: Deploy Frontend

1. Crea account su [Vercel](https://vercel.com) o [Netlify](https://netlify.com)
2. Collega il repository GitHub (cartella `frontend`)
3. Configura la variabile d'ambiente:
   ```
   NEXT_PUBLIC_API_URL=https://tournamentmaster-api.railway.app
   ```
4. Deploya e ottieni l'URL (es. `https://tournamentmaster.vercel.app`)

### Step 3: Aggiorna i File

Modifica i 3 file come descritto sopra con gli URL ottenuti.

### Step 4: Commit e Push

```bash
git add -A
git commit -m "chore: migrate to production servers"
git push origin master
```

### Step 5: Scarica Nuovo APK

1. Attendi che GitHub Actions completi il build (~6 minuti)
2. Vai su: https://github.com/Marinovinc/TournamentMaster/releases
3. Scarica il nuovo `app-debug.apk`
4. Installa sul telefono (sostituisce la versione precedente)

---

## Checklist Migrazione

- [ ] Backend deployato e funzionante
- [ ] Frontend deployato e funzionante
- [ ] `frontend/.env.production` aggiornato
- [ ] `frontend/capacitor.config.json` aggiornato
- [ ] `.github/workflows/build-mobile.yml` aggiornato
- [ ] Commit e push effettuato
- [ ] GitHub Actions build completato
- [ ] Nuovo APK scaricato e installato
- [ ] Test app da rete mobile (non WiFi) funzionante

---

## Hosting Consigliati

### Backend (Node.js + Prisma)

| Servizio | Piano Gratuito | Note |
|----------|----------------|------|
| [Railway](https://railway.app) | $5 credito/mese | Facile, PostgreSQL incluso |
| [Render](https://render.com) | 750 ore/mese | Ottimo per hobby |
| [Fly.io](https://fly.io) | 3 VM gratuite | Più tecnico |

### Frontend (Next.js)

| Servizio | Piano Gratuito | Note |
|----------|----------------|------|
| [Vercel](https://vercel.com) | Illimitato hobby | Creatori di Next.js |
| [Netlify](https://netlify.com) | 100GB banda/mese | Alternativa valida |
| [Cloudflare Pages](https://pages.cloudflare.com) | Illimitato | Molto veloce |

### Database (PostgreSQL)

| Servizio | Piano Gratuito | Note |
|----------|----------------|------|
| [Supabase](https://supabase.com) | 500MB | PostgreSQL + Auth |
| [Neon](https://neon.tech) | 512MB | Serverless PostgreSQL |
| [Railway](https://railway.app) | Incluso nel piano | Stesso provider del backend |

---

## Esempio URL Finali

Dopo la migrazione, i tuoi URL potrebbero essere:

```
Frontend: https://tournamentmaster.vercel.app
Backend:  https://tournamentmaster-api.railway.app
Database: postgresql://user:pass@db.railway.app:5432/tournamentmaster
```

---

## Rollback (Tornare a Locale)

Se vuoi tornare alla configurazione locale:

1. Ripristina i 3 file con i valori originali (192.168.1.74)
2. Commit e push
3. Scarica nuovo APK
4. Usa `AVVIA_SERVER.bat` sul PC

---

## Domande Frequenti

### Devo pagare per l'hosting?
No, tutti i servizi consigliati hanno piani gratuiti sufficienti per un'app piccola/media.

### L'APK cambia?
Sì, devi scaricare e reinstallare l'APK dopo la migrazione.

### Posso avere entrambe le versioni?
Sì, puoi creare due APK diversi (uno locale, uno pubblico) con `appId` diversi.

### Il database locale viene migrato?
No, devi esportare i dati con `mysqldump` e importarli sul nuovo server MySQL/PostgreSQL (vedi sezione "Database MySQL/MariaDB").

---

## Database MySQL/MariaDB

### Configurazione Attuale

- **Database:** MySQL/MariaDB 10.4
- **ORM:** Prisma
- **Schema:** `backend/prisma/schema.prisma`

**Connessione (da `.env`):**
```env
DATABASE_URL="mysql://user:password@localhost:3306/tournamentmaster"
```

---

### Tabelle del Database (13 totali)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐         │
│  │   tenants   │──────│    users    │──────│  documents  │         │
│  │  (tenant)   │      │   (utenti)  │      │ (documenti) │         │
│  └─────────────┘      └──────┬──────┘      └─────────────┘         │
│         │                    │                                      │
│         │              ┌─────┴─────┐                                │
│         │              │           │                                │
│         ▼              ▼           ▼                                │
│  ┌─────────────┐  ┌─────────┐  ┌──────────────────┐                │
│  │ tournaments │  │ catches │  │ tournament_      │                │
│  │  (tornei)   │  │ (catture)│  │ registrations   │                │
│  └──────┬──────┘  └─────────┘  │ (iscrizioni)    │                │
│         │                      └──────────────────┘                │
│    ┌────┼────┬────────────┐                                        │
│    ▼    ▼    ▼            ▼                                        │
│ ┌──────┐ ┌────────────┐ ┌─────────────────┐ ┌────────────────┐    │
│ │zones │ │tournament_ │ │leaderboard_     │ │ refresh_tokens │    │
│ │(zone)│ │species     │ │entries          │ │ (sessioni)     │    │
│ └──────┘ └────────────┘ │(classifiche)    │ └────────────────┘    │
│              │          └─────────────────┘                        │
│              ▼                                                      │
│        ┌──────────┐         ┌─────────────┐                        │
│        │ species  │         │ audit_logs  │                        │
│        │ (pesci)  │         │ (log audit) │                        │
│        └──────────┘         └─────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Descrizione Tabelle

#### 1. `tenants` - Multi-Tenant
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID | Chiave primaria |
| name | VARCHAR(255) | Nome organizzazione |
| slug | VARCHAR(100) | URL slug univoco |
| domain | VARCHAR(255) | Dominio personalizzato |
| logo | VARCHAR(500) | URL logo |
| primaryColor | VARCHAR(7) | Colore tema (#hex) |
| isActive | BOOLEAN | Tenant attivo |

**Scopo:** Supporto multi-tenant - ogni organizzazione ha i suoi tornei.

---

#### 2. `users` - Utenti
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID | Chiave primaria |
| email | VARCHAR(255) | Email (unique) |
| passwordHash | VARCHAR(255) | Password hash bcrypt |
| firstName | VARCHAR(100) | Nome |
| lastName | VARCHAR(100) | Cognome |
| phone | VARCHAR(20) | Telefono |
| fipsasNumber | VARCHAR(50) | Numero tessera FIPSAS |
| role | ENUM | SUPER_ADMIN, TENANT_ADMIN, ORGANIZER, JUDGE, PARTICIPANT |
| tenantId | UUID | FK → tenants |

**Scopo:** Autenticazione e gestione utenti con ruoli.

---

#### 3. `refresh_tokens` - Sessioni JWT
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID | Chiave primaria |
| token | VARCHAR(500) | Refresh token |
| expiresAt | DATETIME | Scadenza |
| userId | UUID | FK → users |

**Scopo:** Gestione sessioni JWT per login persistente.

---

#### 4. `documents` - Documenti Utente
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID | Chiave primaria |
| type | ENUM | MASAF_LICENSE, MEDICAL_CERTIFICATE, NAUTICAL_LICENSE, IDENTITY_DOCUMENT |
| status | ENUM | PENDING, APPROVED, REJECTED, EXPIRED |
| filePath | VARCHAR(500) | Percorso file |
| expiryDate | DATETIME | Data scadenza |
| userId | UUID | FK → users |

**Scopo:** Upload e validazione documenti (licenze, certificati medici).

---

#### 5. `tournaments` - Tornei
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID | Chiave primaria |
| name | VARCHAR(255) | Nome torneo |
| description | TEXT | Descrizione |
| discipline | ENUM | BIG_GAME, DRIFTING, TRAINA_COSTIERA, BOLENTINO, EGING, VERTICAL_JIGGING, SHORE, SOCIAL |
| status | ENUM | DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED |
| startDate | DATETIME | Data inizio |
| endDate | DATETIME | Data fine |
| location | VARCHAR(255) | Luogo |
| locationLat/Lng | DECIMAL | Coordinate GPS |
| registrationFee | DECIMAL | Quota iscrizione |
| maxParticipants | INT | Max partecipanti |
| minWeight | DECIMAL | Peso minimo cattura (kg) |
| pointsPerKg | DECIMAL | Punti per kg |
| tenantId | UUID | FK → tenants |
| organizerId | UUID | FK → users |

**Scopo:** Definizione tornei con regole, date, location.

---

#### 6. `fishing_zones` - Zone di Pesca
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID | Chiave primaria |
| name | VARCHAR(255) | Nome zona |
| geoJson | LONGTEXT | Poligono GeoJSON |
| minLat/maxLat/minLng/maxLng | DECIMAL | Bounding box |
| tournamentId | UUID | FK → tournaments |

**Scopo:** Zone geografiche valide per le catture (validazione GPS).

---

#### 7. `species` - Specie Ittiche
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID | Chiave primaria |
| scientificName | VARCHAR(255) | Nome scientifico |
| commonNameIt | VARCHAR(255) | Nome italiano |
| commonNameEn | VARCHAR(255) | Nome inglese |
| minSizeCm | INT | Taglia minima legale |
| pointsMultiplier | DECIMAL | Moltiplicatore punti |
| isProtected | BOOLEAN | Specie protetta |

**Scopo:** Catalogo specie con regole (taglie minime, punti).

---

#### 8. `tournament_species` - Specie per Torneo
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| tournamentId | UUID | FK → tournaments |
| speciesId | UUID | FK → species |
| customPointsMultiplier | DECIMAL | Override punti |

**Scopo:** Associa specie ammesse a ogni torneo.

---

#### 9. `tournament_registrations` - Iscrizioni
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID | Chiave primaria |
| status | ENUM | PENDING_PAYMENT, CONFIRMED, CANCELLED, REFUNDED |
| teamName | VARCHAR(255) | Nome squadra |
| boatName | VARCHAR(255) | Nome barca |
| amountPaid | DECIMAL | Importo pagato |
| paymentId | VARCHAR(255) | ID Stripe |
| userId | UUID | FK → users |
| tournamentId | UUID | FK → tournaments |

**Scopo:** Gestione iscrizioni con pagamenti.

---

#### 10. `catches` - Catture
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID | Chiave primaria |
| status | ENUM | PENDING, APPROVED, REJECTED |
| weight | DECIMAL(8,3) | Peso in kg |
| length | DECIMAL(6,2) | Lunghezza in cm |
| latitude/longitude | DECIMAL | Coordinate GPS cattura |
| gpsAccuracy | DECIMAL | Precisione GPS (metri) |
| photoPath | VARCHAR(500) | Foto prova |
| photoExifData | TEXT | Metadati EXIF (JSON) |
| caughtAt | DATETIME | Ora cattura |
| points | DECIMAL | Punti calcolati |
| isInsideZone | BOOLEAN | Validazione zona |
| userId | UUID | FK → users |
| tournamentId | UUID | FK → tournaments |
| speciesId | UUID | FK → species |

**Scopo:** Registrazione catture con validazione GPS e foto.

---

#### 11. `leaderboard_entries` - Classifica
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID | Chiave primaria |
| participantName | VARCHAR(255) | Nome (denormalizzato) |
| rank | INT | Posizione |
| totalPoints | DECIMAL | Punti totali |
| totalWeight | DECIMAL | Peso totale |
| catchCount | INT | Numero catture |
| biggestCatch | DECIMAL | Cattura più grande |
| tournamentId | UUID | FK → tournaments |
| userId | VARCHAR(36) | ID utente |

**Scopo:** Classifica denormalizzata per performance.

---

#### 12. `audit_logs` - Log Audit
| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID | Chiave primaria |
| action | VARCHAR(100) | Azione (CREATE, UPDATE, DELETE) |
| entityType | VARCHAR(100) | Tipo entità |
| entityId | VARCHAR(36) | ID entità |
| oldData | LONGTEXT | Dati precedenti (JSON) |
| newData | LONGTEXT | Nuovi dati (JSON) |
| ipAddress | VARCHAR(45) | IP utente |
| userId | VARCHAR(36) | ID utente |

**Scopo:** Tracciamento modifiche per audit trail.

---

### Migrazione Database - Guida Completa

La migrazione del database richiede 4 fasi:
1. **Backup** del database locale
2. **Creazione** database su cloud
3. **Importazione** dati
4. **Aggiornamento** configurazione backend

---

#### FASE 1: Backup Database Locale

**Su Windows (XAMPP):**

```bash
# Apri terminale nella cartella XAMPP
cd C:\xampp\mysql\bin

# Esporta tutto il database
mysqldump -u root -p tournamentmaster > C:\backup_tournamentmaster.sql

# Se hai password vuota (default XAMPP):
mysqldump -u root tournamentmaster > C:\backup_tournamentmaster.sql
```

**Verifica il backup:**
```bash
# Controlla che il file esista e abbia contenuto
dir C:\backup_tournamentmaster.sql

# Dovrebbe essere almeno qualche KB se hai dati
```

**Contenuto del file backup.sql:**
```sql
-- Il file contiene:
-- 1. CREATE TABLE statements (struttura)
-- 2. INSERT statements (dati)
-- Esempio:
CREATE TABLE `users` (...);
INSERT INTO `users` VALUES (...);
```

---

#### FASE 2: Creazione Database su Cloud

##### Opzione A: Railway MySQL (Consigliato - Stesso provider del backend)

1. Vai su [railway.app](https://railway.app)
2. Dashboard → **New** → **Database** → **MySQL**
3. Attendi creazione (~30 secondi)
4. Click sul database → **Variables**
5. Copia `MYSQL_URL` (formato: `mysql://user:pass@host:port/dbname`)

##### Opzione B: PlanetScale (MySQL Serverless)

1. Vai su [planetscale.com](https://planetscale.com)
2. Crea account → **New Database**
3. Nome: `tournamentmaster`
4. Regione: `eu-west` (più vicina all'Italia)
5. **Settings** → **Passwords** → **New Password**
6. Copia connection string

##### Opzione C: Supabase (PostgreSQL - Richiede modifiche)

1. Vai su [supabase.com](https://supabase.com)
2. **New Project** → Scegli regione EU
3. **Settings** → **Database** → **Connection string**
4. ⚠️ Richiede modifica `schema.prisma` (vedi sotto)

---

#### FASE 3: Importazione Dati

##### Per MySQL (Railway/PlanetScale)

**Metodo 1: Via CLI (se hai mysql client)**

```bash
# Sostituisci con i tuoi dati
mysql -h containers-us-west-XXX.railway.app \
      -P 6547 \
      -u root \
      -p \
      railway < C:\backup_tournamentmaster.sql
```

**Metodo 2: Via Prisma (database vuoto + migrazioni)**

Se preferisci partire con database vuoto:

```bash
cd backend

# Aggiorna DATABASE_URL nel .env con l'URL cloud
# Poi esegui:
npx prisma migrate deploy
npx prisma db seed  # Se hai dati seed
```

**Metodo 3: Via phpMyAdmin/Adminer**

1. Railway: Dashboard → MySQL → **Connect** → Adminer
2. Login con credenziali
3. **Import** → Seleziona `backup_tournamentmaster.sql` → **Go**

##### Per PostgreSQL (Supabase/Neon)

⚠️ **MySQL e PostgreSQL NON sono compatibili direttamente!**

**Step 1: Modifica schema.prisma**
```prisma
datasource db {
  provider = "postgresql"  // Cambia da "mysql"
  url      = env("DATABASE_URL")
}
```

**Step 2: Rigenera migrazioni**
```bash
cd backend

# Elimina vecchie migrazioni MySQL
rm -rf prisma/migrations

# Crea nuove migrazioni PostgreSQL
npx prisma migrate dev --name init

# Deploy su cloud
npx prisma migrate deploy
```

**Step 3: Migra i dati manualmente**

I dati vanno convertiti. Opzioni:
- **Ricomincia da zero** (consigliato se pochi dati)
- **Usa tool di conversione** (pgloader, AWS DMS)
- **Script manuale** (esporta CSV, importa in PostgreSQL)

---

#### FASE 4: Aggiornamento Configurazione Backend

**File: `backend/.env`**

```env
# PRIMA (locale)
DATABASE_URL="mysql://root:@localhost:3306/tournamentmaster"

# DOPO (cloud - esempio Railway)
DATABASE_URL="mysql://root:AbCdEf123@containers-us-west-123.railway.app:6547/railway"
```

**Verifica connessione:**

```bash
cd backend

# Test connessione
npx prisma db pull

# Se funziona, vedrai "Introspecting database..."
# Se fallisce, controlla URL e firewall
```

**Deploy backend con nuova configurazione:**

Su Railway/Render, aggiungi la variabile `DATABASE_URL` nelle Environment Variables del servizio backend.

---

### Riepilogo Comandi Migrazione

```bash
# ===== SUL PC LOCALE =====

# 1. Backup database
cd C:\xampp\mysql\bin
mysqldump -u root tournamentmaster > C:\backup_tm.sql

# 2. Aggiorna .env con nuovo URL
notepad backend\.env
# Cambia DATABASE_URL con URL cloud

# 3. Test connessione
cd backend
npx prisma db pull

# 4. Se database vuoto, applica migrazioni
npx prisma migrate deploy

# 5. Se vuoi dati seed di test
npx prisma db seed

# ===== SE IMPORTI BACKUP =====

# Via mysql CLI
mysql -h HOST -P PORT -u USER -p DBNAME < C:\backup_tm.sql

# Oppure via Adminer/phpMyAdmin web interface
```

---

### Troubleshooting Migrazione

#### "Access denied for user"
- Verifica username/password nell'URL
- Verifica che l'IP sia autorizzato (alcuni hosting richiedono whitelist)

#### "Unknown database"
- Il database non esiste ancora
- Crea il database prima: `CREATE DATABASE tournamentmaster;`

#### "Connection refused"
- Verifica host e porta
- Verifica che il servizio database sia attivo
- Controlla firewall

#### "Table already exists"
- Il database ha già le tabelle
- Usa `prisma migrate deploy` invece di `migrate dev`
- Oppure drop delle tabelle prima dell'import

#### "Syntax error" durante import
- Il backup è MySQL ma stai importando in PostgreSQL
- Devi convertire il backup o usare Prisma migrations

---

### Checklist Migrazione Database

- [ ] Backup database locale eseguito (`backup_tournamentmaster.sql`)
- [ ] Database cloud creato (Railway/PlanetScale/Supabase)
- [ ] Connection string copiata
- [ ] `backend/.env` aggiornato con nuovo `DATABASE_URL`
- [ ] Test connessione con `npx prisma db pull`
- [ ] Migrazioni applicate (`npx prisma migrate deploy`)
- [ ] Dati importati (se necessario)
- [ ] Backend deployato con nuova configurazione
- [ ] Test API funzionante

---

## Riepilogo Comandi Deploy

### Backend (Railway)

```bash
# Railway CLI
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
```

### Frontend (Vercel)

```bash
# Vercel CLI
npm install -g vercel
cd frontend
vercel
```

### Build APK (automatico)

```bash
# Push su GitHub triggera automaticamente il build
git add -A
git commit -m "deploy: production config"
git push origin master
# Attendi ~6 minuti, poi scarica APK da GitHub Releases
```

---

---

## ⚠️ PROBLEMA CRITICO: File Upload su Cloud

### Il Problema

Attualmente le foto delle catture vengono salvate in `./uploads` sul filesystem locale:

```typescript
// backend/src/config/index.ts
upload: {
  dir: process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads"),
}
```

**Su hosting serverless (Railway, Render, Vercel) il filesystem è EFFIMERO!**
- I file vengono cancellati ad ogni deploy
- I file non sono condivisi tra istanze
- Railway/Render ricreano il container ad ogni restart

### Soluzioni

#### Opzione A: Cloudinary (Consigliato - Facile)

**1. Crea account gratuito su [cloudinary.com](https://cloudinary.com)**

**2. Installa SDK:**
```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

**3. Aggiungi variabili ambiente:**
```env
CLOUDINARY_CLOUD_NAME=tuo-cloud-name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abcdefghijk
```

**4. Crea nuovo middleware upload:**
```typescript
// backend/src/middleware/cloudinary.middleware.ts
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tournamentmaster/catches',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
  } as any,
});

export const uploadPhoto = multer({ storage });
```

**5. Modifica route catches:**
```typescript
// backend/src/routes/catch.routes.ts
import { uploadPhoto } from '../middleware/cloudinary.middleware';

// Prima di submitCatchValidation, aggiungi middleware upload
router.post(
  "/",
  authenticate,
  uploadPhoto.single('photo'),  // Aggiunto
  submitCatchValidation,
  // ... resto del codice
```

**Vantaggi Cloudinary:**
- 25GB storage gratuito
- CDN globale (foto veloci ovunque)
- Trasformazioni automatiche (resize, crop)
- Nessuna modifica infrastrutturale

---

#### Opzione B: AWS S3 (Più controllo)

**1. Crea bucket S3:**
- AWS Console → S3 → Create Bucket
- Nome: `tournamentmaster-uploads`
- Regione: `eu-south-1` (Milano)

**2. Installa SDK:**
```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer-s3
```

**3. Variabili ambiente:**
```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=eu-south-1
AWS_S3_BUCKET=tournamentmaster-uploads
```

**4. Configura multer-s3** (simile a Cloudinary)

---

#### Opzione C: Supabase Storage (Se usi Supabase per DB)

Se hai scelto Supabase per il database, puoi usare anche il loro storage:

```bash
npm install @supabase/supabase-js
```

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
```

---

### Riepilogo Scelte Storage

| Servizio | Piano Gratuito | Pro | Contro |
|----------|----------------|-----|--------|
| **Cloudinary** | 25GB + 25GB bandwidth | Facile, CDN incluso | Vendor lock-in |
| **AWS S3** | 5GB (12 mesi) | Standard industria | Più complesso |
| **Supabase Storage** | 1GB | Integrato con DB | Solo se usi Supabase |
| **Railway Volume** | 5GB | Semplice | Non CDN, più lento |

**Raccomandazione:** Cloudinary per iniziare (5 minuti setup), S3 se cresci.

---

## Configurazione Prisma per Cloud Linux

### Il Problema

Il file `schema.prisma` attuale ha:
```prisma
binaryTargets = ["native", "windows"]
```

Su Railway/Render (Linux) serve il target corretto.

### Soluzione

**Modifica `backend/prisma/schema.prisma`:**

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x", "debian-openssl-3.0.x"]
}
```

**Oppure (più sicuro - genera per tutti):**
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x", "debian-openssl-3.0.x", "windows"]
}
```

**Dopo la modifica:**
```bash
cd backend
npx prisma generate
```

---

## Variabili Ambiente Complete

### Backend (Railway/Render)

```env
# === DATABASE ===
DATABASE_URL="mysql://user:password@host:port/dbname"

# === AUTENTICAZIONE ===
JWT_SECRET="genera-con: openssl rand -base64 32"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# === SERVER ===
PORT=3001
NODE_ENV=production

# === CORS (opzionale se origin: true) ===
FRONTEND_URL="https://tuo-frontend.vercel.app"

# === FILE STORAGE (scegli uno) ===
# Cloudinary
CLOUDINARY_CLOUD_NAME="tuo-cloud"
CLOUDINARY_API_KEY="123456789"
CLOUDINARY_API_SECRET="abcdefg"

# Oppure AWS S3
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="xxx"
AWS_REGION="eu-south-1"
AWS_S3_BUCKET="tournamentmaster-uploads"

# === STRIPE (Phase 2) ===
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
```

### Frontend (Vercel/Netlify)

```env
NEXT_PUBLIC_API_URL="https://tuo-backend.railway.app"
```

**IMPORTANTE:** Su Vercel/Netlify, imposta le variabili nel **dashboard**, non nel file `.env.production`.

---

## GitHub Secrets per Build APK

### Perché servono

Il file `.github/workflows/build-mobile.yml` contiene URL hardcoded:
```yaml
env:
  NEXT_PUBLIC_API_URL: 'http://192.168.1.74:3001'
```

Per production, è meglio usare GitHub Secrets.

### Setup

**1. Vai su GitHub → Repository → Settings → Secrets → Actions**

**2. Aggiungi questi secrets:**

| Nome | Valore |
|------|--------|
| `PRODUCTION_API_URL` | `https://tuo-backend.railway.app` |
| `PRODUCTION_FRONTEND_URL` | `https://tuo-frontend.vercel.app` |

**3. Modifica `.github/workflows/build-mobile.yml`:**

```yaml
# Prima
env:
  NEXT_PUBLIC_API_URL: 'http://192.168.1.74:3001'

# Dopo
env:
  NEXT_PUBLIC_API_URL: ${{ secrets.PRODUCTION_API_URL }}
```

**4. Per mantenere compatibilità locale/production:**

```yaml
env:
  NEXT_PUBLIC_API_URL: ${{ secrets.PRODUCTION_API_URL || 'http://192.168.1.74:3001' }}
```

Questo usa il secret se esiste, altrimenti fallback a localhost.

---

## Ordine Corretto di Deploy

**IMPORTANTE: L'ordine conta!**

```
1. DATABASE    → Crea DB cloud, ottieni URL
      ↓
2. BACKEND     → Deploy con DATABASE_URL, ottieni URL backend
      ↓
3. FRONTEND    → Deploy con NEXT_PUBLIC_API_URL del backend
      ↓
4. GITHUB      → Aggiungi secrets con URL definitivi
      ↓
5. APK         → Push per triggerare build con nuovi URL
      ↓
6. TEST        → Verifica tutto funzioni
```

Se fai in ordine sbagliato, avrai URL circolari o mancanti.

---

## Checklist Migrazione Completa

### Fase 1: Preparazione
- [ ] Backup database locale (`mysqldump`)
- [ ] Backup cartella `uploads/` (foto locali)
- [ ] Scegli hosting (Railway + Vercel consigliati)
- [ ] Scegli storage foto (Cloudinary consigliato)

### Fase 2: Cloud Setup
- [ ] Crea account Railway/Render
- [ ] Crea database MySQL su cloud
- [ ] Crea account Cloudinary (o S3)
- [ ] Crea account Vercel/Netlify

### Fase 3: Modifiche Codice
- [ ] Aggiorna `binaryTargets` in `schema.prisma`
- [ ] (Se Cloudinary) Aggiungi middleware upload
- [ ] Aggiorna `capacitor.config.json` con URL frontend
- [ ] Aggiorna `.env.production` con URL backend

### Fase 4: Deploy
- [ ] Deploy backend su Railway
- [ ] Configura variabili ambiente backend
- [ ] `npx prisma migrate deploy` su cloud
- [ ] Deploy frontend su Vercel
- [ ] Configura variabili ambiente frontend
- [ ] Aggiungi GitHub Secrets

### Fase 5: Build APK
- [ ] Modifica `.github/workflows/build-mobile.yml` (secrets o URL)
- [ ] Commit e push
- [ ] Attendi build GitHub Actions (~6 min)
- [ ] Scarica APK da Releases

### Fase 6: Test Finale
- [ ] Test API health: `curl https://backend.railway.app/api/health`
- [ ] Test frontend da browser
- [ ] Test APK da rete mobile (4G, non WiFi)
- [ ] Test upload foto cattura
- [ ] Test login/registrazione

---

## Timeline Realistica

| Fase | Tempo Stimato | Note |
|------|---------------|------|
| Setup account (Railway, Vercel, Cloudinary) | 15-30 min | Una tantum |
| Modifiche codice | 30-60 min | Schema + storage |
| Deploy backend | 10-15 min | Railway auto-deploy |
| Deploy frontend | 5-10 min | Vercel auto-deploy |
| Migrazione DB | 15-30 min | Dipende da quantità dati |
| Build APK | 6 min | Automatico |
| Testing | 30-60 min | Fondamentale! |
| **TOTALE** | **2-4 ore** | Prima volta |

Le migrazioni successive (aggiornamenti) saranno automatiche con git push.

---

*Documento creato il 2025-12-30*
*Aggiornato con dettagli cloud storage e Prisma*
*TournamentMaster v1.0.2*
