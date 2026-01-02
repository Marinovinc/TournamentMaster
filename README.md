# TournamentMaster

Piattaforma completa per la gestione di tornei di pesca sportiva.

**Repository:** https://github.com/Marinovinc/TournamentMaster

---

## Indice

1. [Panoramica](#panoramica)
2. [Requisiti di Sistema](#requisiti-di-sistema)
3. [Installazione](#installazione)
4. [Configurazione](#configurazione)
5. [Avvio del Progetto](#avvio-del-progetto)
6. [Struttura del Progetto](#struttura-del-progetto)
7. [Credenziali di Test](#credenziali-di-test)
8. [Comandi Utili](#comandi-utili)
9. [Risoluzione Problemi](#risoluzione-problemi)

---

## Panoramica

TournamentMaster e una piattaforma SaaS per organizzare e gestire tornei di pesca sportiva. Include:

- **Backend API** - Node.js + Express + TypeScript + Prisma
- **Frontend Web** - Next.js 14 + TypeScript + Tailwind CSS
- **App Mobile** - React Native + Expo (Android APK + iOS)

### Funzionalita Principali

- Gestione tornei (creazione, iscrizioni, ciclo di vita)
- Registrazione catture con foto/video
- Gestione barche/team con equipaggio e ispettori
- Strike live con monitoraggio in tempo reale
- Classifica dinamica
- Sistema multi-tenant (supporto piu societa)
- Ruoli utente: Super Admin, Admin, Presidente, Organizzatore, Giudice, Partecipante

---

## Requisiti di Sistema

### Obbligatori

| Software | Versione Minima | Download |
|----------|-----------------|----------|
| Node.js | 18.x o superiore | https://nodejs.org |
| npm | 9.x o superiore | (incluso con Node.js) |
| MySQL/MariaDB | 8.x | https://mariadb.org |
| Git | 2.x | https://git-scm.com |

### Opzionali (per sviluppo mobile)

| Software | Versione | Download |
|----------|----------|----------|
| Android Studio | Latest | https://developer.android.com/studio |
| Expo CLI | Latest | `npm install -g expo-cli` |

### Verifica Installazione

```bash
node --version    # Deve mostrare v18.x o superiore
npm --version     # Deve mostrare 9.x o superiore
mysql --version   # Deve mostrare 8.x o superiore
git --version     # Deve mostrare 2.x o superiore
```

---

## Installazione

### 1. Clona il Repository

```bash
# Via HTTPS
git clone https://github.com/Marinovinc/TournamentMaster.git

# Via SSH (se hai configurato le chiavi SSH)
git clone git@github.com:Marinovinc/TournamentMaster.git

# Entra nella directory
cd TournamentMaster
```

### 2. Installa le Dipendenze

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Mobile (opzionale)
cd ../mobile
npm install
```

### 3. Configura il Database

Crea un database MySQL:

```sql
CREATE DATABASE tournamentmaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## Configurazione

### Backend (.env)

Crea il file `backend/.env` copiando da `.env.example`:

```bash
cd backend
cp .env.example .env
```

Modifica `backend/.env` con i tuoi valori:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/tournamentmaster"

# JWT Secret (genera una stringa casuale sicura)
JWT_SECRET="la-tua-chiave-segreta-molto-lunga-e-sicura"
JWT_REFRESH_SECRET="altra-chiave-segreta-per-refresh-token"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Cloudinary (per upload media)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend (.env.local)

Crea il file `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Migrazione Database

Dopo aver configurato il `.env`, esegui le migrazioni:

```bash
cd backend

# Genera il client Prisma
npx prisma generate

# Esegui le migrazioni
npx prisma migrate dev

# Popola il database con dati di test
npx prisma db seed
```

---

## Avvio del Progetto

### Sviluppo (Development)

Apri **due terminali** separati:

**Terminale 1 - Backend:**
```bash
cd backend
npm run dev
```
Il server sara disponibile su http://localhost:3001

**Terminale 2 - Frontend:**
```bash
cd frontend
npm run dev
```
L'applicazione sara disponibile su http://localhost:3000

### Produzione (Production)

```bash
# Build Backend
cd backend
npm run build
npm start

# Build Frontend
cd frontend
npm run build
npm start
```

### Mobile (Opzionale)

```bash
cd mobile

# Avvia Expo
npm start

# Oppure per Android direttamente
npm run android
```

---

## Struttura del Progetto

```
TournamentMaster/
├── backend/                    # API Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Schema database
│   │   ├── migrations/         # Migrazioni DB
│   │   └── seed.ts             # Dati di test
│   ├── src/
│   │   ├── app.ts              # Express app setup
│   │   ├── config/             # Configurazioni
│   │   ├── middleware/         # Middleware (auth, etc.)
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic
│   │   └── types/              # TypeScript types
│   ├── .env.example            # Template variabili ambiente
│   └── package.json
│
├── frontend/                   # Web App Next.js
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   └── [locale]/       # Pagine internazionalizzate
│   │   │       ├── dashboard/  # Area utente
│   │   │       │   ├── teams/  # Gestione barche/team
│   │   │       │   ├── strikes/# Strike live
│   │   │       │   └── ...
│   │   │       ├── login/
│   │   │       └── register/
│   │   ├── components/         # Componenti React
│   │   ├── contexts/           # Context providers
│   │   └── lib/                # Utilities
│   ├── public/                 # Assets statici
│   └── package.json
│
├── mobile/                     # App Mobile Expo
│   ├── App.tsx                 # Entry point
│   ├── app.json                # Configurazione Expo
│   └── package.json
│
├── docs/                       # Documentazione
│   └── GUIDA_BARCHE_STRIKE_FEATURES.md
│
├── temp-apk/                   # APK Android pre-compilato
│   └── app-debug.apk
│
├── DOCUMENTAZIONE_COMPLETA_TOURNAMENTMASTER.md
└── README.md                   # Questo file
```

---

## Credenziali di Test

Dopo aver eseguito `npx prisma db seed`, puoi accedere con:

| Ruolo | Email | Password |
|-------|-------|----------|
| Super Admin | marino@unitec.it | Gerstofen22 |
| Admin Societa | admin@ischiafishing.it | demo123 |
| Presidente | presidente@ischiafishing.it | demo123 |
| Partecipante | utente@ischiafishing.it | demo123 |

---

## Comandi Utili

### Backend

```bash
cd backend

npm run dev          # Avvia in modalita sviluppo (con hot-reload)
npm run build        # Compila TypeScript
npm start            # Avvia in produzione
npm test             # Esegue i test

# Prisma
npx prisma studio    # Apre GUI database
npx prisma migrate dev    # Crea nuova migrazione
npx prisma db seed   # Popola database con dati test
npx prisma generate  # Rigenera client Prisma
```

### Frontend

```bash
cd frontend

npm run dev          # Avvia in sviluppo (hot-reload)
npm run build        # Build produzione
npm start            # Avvia build produzione
npm run lint         # Controlla errori linting
```

### Git

```bash
git pull                     # Scarica ultime modifiche
git status                   # Mostra stato file
git add .                    # Aggiungi tutti i file
git commit -m "messaggio"    # Crea commit
git push                     # Carica su GitHub
```

---

## Risoluzione Problemi

### Errore: "Port 3000/3001 is already in use"

```bash
# Windows - trova e termina il processo
netstat -ano | findstr :3000
taskkill /PID <numero_pid> /F

# Mac/Linux
lsof -i :3000
kill -9 <pid>
```

### Errore: "Cannot connect to database"

1. Verifica che MySQL sia in esecuzione
2. Controlla le credenziali in `backend/.env`
3. Verifica che il database esista:
```sql
SHOW DATABASES LIKE 'tournamentmaster';
```

### Errore: "Prisma Client not generated"

```bash
cd backend
npx prisma generate
```

### Errore: "Module not found"

```bash
# Reinstalla le dipendenze
rm -rf node_modules
npm install
```

### Frontend non si connette al Backend

1. Verifica che il backend sia in esecuzione su porta 3001
2. Controlla `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```
3. Verifica CORS nel backend (`backend/src/app.ts`)

### Reset Completo Database

```bash
cd backend
npx prisma migrate reset
# Questo cancella tutti i dati e riapplica migrazioni + seed
```

---

## Contribuire

1. Fai un fork del repository
2. Crea un branch per la tua feature (`git checkout -b feature/nuova-funzionalita`)
3. Committa le modifiche (`git commit -m 'Aggiunge nuova funzionalita'`)
4. Pusha il branch (`git push origin feature/nuova-funzionalita`)
5. Apri una Pull Request

---

## Licenza

Progetto privato - Tutti i diritti riservati.

---

## Contatti

Per supporto o domande, contatta il team di sviluppo.

**Repository:** https://github.com/Marinovinc/TournamentMaster
