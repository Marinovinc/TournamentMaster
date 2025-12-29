# TECHNICAL REFERENCE COMPLETE - TournamentMaster

**Data:** 2025-12-29
**Versione:** 1.0
**Scopo:** Riferimento tecnico dettagliato per continuare lo sviluppo

---

## INDICE

1. [Architettura Sistema](#1-architettura-sistema)
2. [Stack Tecnologico](#2-stack-tecnologico)
3. [Struttura Directory](#3-struttura-directory)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [Frontend Components](#6-frontend-components)
7. [Internazionalizzazione](#7-internazionalizzazione)
8. [Discipline Pesca](#8-discipline-pesca)
9. [Autenticazione](#9-autenticazione)
10. [Dashboard System](#10-dashboard-system)
11. [Demo Assets](#11-demo-assets)
12. [Comandi Utili](#12-comandi-utili)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. ARCHITETTURA SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Next.js 16.1.1 + React 19 + TypeScript + Tailwind CSS 4        │
│  Porta: 3000 (o 3002 se occupata)                               │
│  URL: http://localhost:3000                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  Express.js + TypeScript + Prisma ORM                           │
│  Porta: 3001                                                    │
│  URL: http://localhost:3001/api                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Prisma Client
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                 │
│  MariaDB 10.4 (MySQL compatibile)                               │
│  Porta: 3306                                                    │
│  Database: tournamentmaster                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Porte Utilizzate
| Servizio | Porta | URL |
|----------|-------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 3001 | http://localhost:3001/api |
| MariaDB | 3306 | localhost:3306 |

---

## 2. STACK TECNOLOGICO

### Frontend
| Tecnologia | Versione | File Config |
|------------|----------|-------------|
| Next.js | 16.1.1 | `next.config.ts` |
| React | 19.2.3 | `package.json` |
| TypeScript | 5.x | `tsconfig.json` |
| Tailwind CSS | 4.x | `postcss.config.mjs` |
| shadcn/ui | latest | `components.json` |
| next-intl | 4.6.1 | `src/i18n/*` |
| Lucide React | 0.562.0 | icons import |
| React Hook Form | 7.69.0 | forms |
| Zod | 4.2.1 | validation |
| @turf/turf | 7.3.1 | GPS/GeoJSON |
| sonner | - | toast notifications |

### Backend
| Tecnologia | Versione | File |
|------------|----------|------|
| Express.js | latest | `src/app.ts` |
| TypeScript | 5.x | `tsconfig.json` |
| Prisma | latest | `prisma/schema.prisma` |
| JWT | - | `services/auth.service.ts` |
| bcrypt | - | password hashing |

### Database (MariaDB/MySQL)
| Tabella | Descrizione |
|---------|-------------|
| tenants | Multi-tenant (associazioni) |
| users | Utenti con ruoli |
| refresh_tokens | JWT refresh tokens |
| documents | Documenti utente (licenze, certificati) |
| tournaments | Definizione tornei |
| fishing_zones | Zone pesca (GeoJSON) |
| species | Catalogo specie ittiche |
| tournament_species | Specie ammesse per torneo |
| tournament_registrations | Iscrizioni |
| catches | Catture registrate |
| leaderboard_entries | Classifica |

---

## 3. STRUTTURA DIRECTORY

```
C:\Users\marin\Downloads\TournamentMaster\
├── frontend/
│   ├── messages/                      # i18n (24 file JSON)
│   │   ├── it.json                    # Italiano (completo)
│   │   ├── en.json                    # Inglese (completo)
│   │   └── [22 altre lingue].json     # Placeholder EN
│   ├── public/
│   │   └── demo/                      # Demo assets
│   │       ├── catch1.jpg             # Aguglia Imperiale
│   │       ├── catch2.jpg             # Tonno
│   │       ├── catch3.jpg             # Totano
│   │       ├── catch4.jpg             # Cattura
│   │       ├── catch4_video.mp4       # Video 22MB
│   │       └── catch5.jpg             # Cattura
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css            # Tema Ocean OKLCH
│   │   │   └── [locale]/              # Pagine localizzate
│   │   │       ├── page.tsx           # Homepage
│   │   │       ├── login/page.tsx     # Login
│   │   │       ├── register/page.tsx  # Registrazione
│   │   │       ├── tournaments/       # Lista tornei
│   │   │       ├── leaderboard/       # Classifica
│   │   │       └── dashboard/         # Dashboard area
│   │   │           ├── page.tsx       # Dashboard home
│   │   │           ├── layout.tsx     # Layout con sidebar
│   │   │           ├── admin/page.tsx # Admin panel
│   │   │           ├── judge/page.tsx # Validazione catture
│   │   │           └── (participant)/ # Area partecipante
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── layout/                # Header, Footer, etc.
│   │   │   └── LanguageSelector.tsx   # Selettore lingua
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx        # Stato autenticazione
│   │   ├── lib/
│   │   │   └── utils.ts               # Utility functions
│   │   └── i18n/
│   │       └── request.ts             # next-intl config
│   ├── HANDOVER_SESSIONE_COMPLETO_20251229.md
│   ├── TECHNICAL_REFERENCE_COMPLETE_20251229.md
│   └── README.md
│
└── backend/
    ├── prisma/
    │   └── schema.prisma              # Database schema
    ├── src/
    │   ├── app.ts                     # Express app
    │   ├── index.ts                   # Entry point
    │   ├── config/                    # Configurazione
    │   ├── middleware/
    │   │   └── auth.middleware.ts     # JWT middleware
    │   ├── routes/
    │   │   ├── auth.routes.ts         # Auth endpoints
    │   │   ├── catch.routes.ts        # Catch endpoints
    │   │   ├── leaderboard.routes.ts  # Leaderboard
    │   │   ├── tournament.routes.ts   # Tournament
    │   │   └── user.routes.ts         # User
    │   └── services/
    │       ├── auth.service.ts        # Auth logic
    │       ├── catch.service.ts       # Catch logic
    │       ├── gps.service.ts         # GPS validation
    │       ├── leaderboard.service.ts # Classifica
    │       └── tournament/            # Tournament services
    └── dist/                          # Compiled JS
```

---

## 4. DATABASE SCHEMA

### Tabelle Principali

#### users
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  passwordHash VARCHAR(255),
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  phone VARCHAR(20),
  fipsasNumber VARCHAR(50),
  role ENUM('SUPER_ADMIN','TENANT_ADMIN','ORGANIZER','JUDGE','PARTICIPANT'),
  avatar VARCHAR(500),
  isActive BOOLEAN DEFAULT true,
  isVerified BOOLEAN DEFAULT false,
  lastLoginAt DATETIME,
  tenantId VARCHAR(36),
  createdAt DATETIME,
  updatedAt DATETIME
);
```

#### tournaments
```sql
CREATE TABLE tournaments (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  discipline ENUM('BIG_GAME','DRIFTING','TRAINA_COSTIERA',...),
  status ENUM('DRAFT','PUBLISHED','ONGOING','COMPLETED','CANCELLED'),
  startDate DATETIME,
  endDate DATETIME,
  registrationOpens DATETIME,
  registrationCloses DATETIME,
  location VARCHAR(255),
  locationLat DECIMAL(10,8),
  locationLng DECIMAL(11,8),
  registrationFee DECIMAL(10,2),
  maxParticipants INT,
  minParticipants INT,
  minWeight DECIMAL(8,3),
  maxCatchesPerDay INT,
  pointsPerKg DECIMAL(6,2),
  bonusPoints INT,
  bannerImage VARCHAR(500),
  tenantId VARCHAR(36),
  organizerId VARCHAR(36),
  createdAt DATETIME,
  updatedAt DATETIME
);
```

#### catches
```sql
CREATE TABLE catches (
  id VARCHAR(36) PRIMARY KEY,
  weight DECIMAL(8,3),
  length DECIMAL(6,2),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  gpsAccuracy DECIMAL(6,2),
  photoPath VARCHAR(500),
  photoExifData JSON,
  isInsideZone BOOLEAN DEFAULT false,
  notes TEXT,
  reviewNotes TEXT,
  reviewedAt DATETIME,
  points DECIMAL(10,2),
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  caughtAt DATETIME,
  createdAt DATETIME,
  tournamentId VARCHAR(36),
  userId VARCHAR(36),
  speciesId VARCHAR(36),
  reviewedById VARCHAR(36)
);
```

### Enum Values

#### UserRole
- SUPER_ADMIN
- TENANT_ADMIN
- ORGANIZER
- JUDGE
- PARTICIPANT

#### TournamentStatus
- DRAFT
- PUBLISHED
- ONGOING
- COMPLETED
- CANCELLED

#### TournamentDiscipline
- BIG_GAME
- DRIFTING
- TRAINA_COSTIERA
- BOLENTINO
- EGING
- VERTICAL_JIGGING
- SHORE
- SOCIAL

#### CatchStatus
- PENDING
- APPROVED
- REJECTED

---

## 5. API ENDPOINTS

### Authentication (`/api/auth`)
| Method | Endpoint | Descrizione | Body |
|--------|----------|-------------|------|
| POST | /register | Registrazione | `{email, password, firstName, lastName}` |
| POST | /login | Login | `{email, password}` |
| POST | /refresh | Refresh token | `{refreshToken}` |
| POST | /logout | Logout | - |
| GET | /me | Utente corrente | - (Bearer token) |

### Tournaments (`/api/tournaments`)
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | / | Lista tornei |
| POST | / | Crea torneo (Admin) |
| GET | /:id | Dettaglio torneo |
| PUT | /:id | Modifica torneo (Admin) |
| POST | /:id/register | Iscrizione |

### Catches (`/api/catches`)
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | / | Registra cattura |
| GET | /:tournamentId | Lista catture torneo |
| PUT | /:id/approve | Approva (Judge) |
| PUT | /:id/reject | Rifiuta (Judge) |

### Leaderboard (`/api/leaderboard`)
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | /:tournamentId | Classifica torneo |

---

## 6. FRONTEND COMPONENTS

### UI Components (shadcn/ui)
Percorso: `src/components/ui/`

| Componente | File | Uso |
|------------|------|-----|
| Button | button.tsx | Pulsanti |
| Card | card.tsx | Contenitori |
| Badge | badge.tsx | Etichette stato |
| Dialog | dialog.tsx | Modal |
| Input | input.tsx | Campi input |
| Select | select.tsx | Dropdown |
| Table | table.tsx | Tabelle dati |
| Tabs | tabs.tsx | Tab navigation |
| Textarea | textarea.tsx | Testo multiriga |
| Toast | sonner | Notifiche |

### Custom Components
| Componente | File | Uso |
|------------|------|-----|
| LanguageSelector | components/LanguageSelector.tsx | Cambio lingua |
| Header | components/layout/Header.tsx | Navigazione |
| Footer | components/layout/Footer.tsx | Footer |

### Contexts
| Context | File | Uso |
|---------|------|-----|
| AuthContext | contexts/AuthContext.tsx | Autenticazione globale |

---

## 7. INTERNAZIONALIZZAZIONE

### Configurazione
- **Libreria:** next-intl 4.6.1
- **Middleware:** `src/middleware.ts`
- **Request config:** `src/i18n/request.ts`
- **Traduzioni:** `messages/*.json`

### Lingue Supportate (24)
```typescript
const locales = [
  'it', 'en', 'de', 'fr', 'es', 'pt', 'nl', 'pl',
  'el', 'hr', 'sl', 'ro', 'cs', 'sk', 'hu', 'bg',
  'sv', 'da', 'fi', 'no', 'et', 'lv', 'lt', 'mt', 'ga'
];
```

### Struttura Traduzioni
```json
{
  "common": {
    "appName": "TournamentMaster",
    "login": "Accedi",
    "register": "Registrati"
  },
  "home": {
    "title": "...",
    "seaFishingTitle": "Pesca in Mare",
    "freshwaterFishingTitle": "Pesca in Acque Interne",
    "disciplines": {
      "big_game": {
        "title": "Big Game",
        "subtitle": "Traina d'Altura",
        "description": "..."
      }
    }
  }
}
```

### Uso nei Componenti
```typescript
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('home');
  return <h1>{t('title')}</h1>;
}
```

---

## 8. DISCIPLINE PESCA

### Mare (9 discipline)
| Key | Nome IT | Nome EN | Specie Target |
|-----|---------|---------|---------------|
| big_game | Big Game | Big Game Fishing | tonno rosso, pescespada, alalunga, lampuga |
| drifting | Pesca in Deriva | Drifting | tonno rosso, pelagici |
| traina_costiera | Traina Costiera | Coastal Trolling | spigole, palamite, serra, ricciole |
| vertical_jigging | Vertical Jigging | Vertical Jigging | dentici, ricciole, cernie |
| bolentino | Bolentino | Deep Sea Fishing | occhioni, naselli, cernie |
| eging | Eging | Squid Fishing | calamari, seppie, totani |
| spinning_mare | Spinning Mare | Shore Spinning | predatori marini |
| surfcasting | Surfcasting | Surfcasting | orate, spigole, mormore |
| shore_fishing | Pesca da Riva | Shore Fishing | varie |

### Acque Interne (8 discipline)
| Key | Nome IT | Nome EN | Specie Target |
|-----|---------|---------|---------------|
| fly_fishing | Pesca a Mosca | Fly Fishing | trote, temoli |
| spinning_fiume | Spinning Fiume | River Spinning | lucci, persici, aspi, siluri |
| carpfishing | Carpfishing | Carp Fishing | carpe |
| feeder_fishing | Feeder Fishing | Feeder Fishing | ciprinidi |
| trota_lago | Trota Lago | Lake Trout | trote |
| trota_torrente | Trota Torrente | Stream Trout | trote |
| bass_fishing | Bass Fishing | Bass Fishing | persico trota |
| colpo | Pesca al Colpo | Match Fishing | ciprinidi |

### Social
| Key | Nome IT | Nome EN |
|-----|---------|---------|
| social | Eventi Sociali | Social Events |

---

## 9. AUTENTICAZIONE

### AuthContext (`src/contexts/AuthContext.tsx`)

#### State
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

#### User Type
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId?: string;
  tenantName?: string;
}

type UserRole =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "ORGANIZER"
  | "JUDGE"
  | "PARTICIPANT";
```

#### Methods
```typescript
login(email: string, password: string): Promise<{success, error?}>
logout(): void
hasRole(...roles: UserRole[]): boolean
isAdmin: boolean  // SUPER_ADMIN || TENANT_ADMIN
isJudge: boolean  // JUDGE
isOrganizer: boolean  // ORGANIZER
```

#### Storage
- Token: `localStorage.getItem("token")`
- User: `localStorage.getItem("user")`

---

## 10. DASHBOARD SYSTEM

### Struttura Dashboard
```
/[locale]/dashboard/
├── page.tsx           # Home dashboard (role-based)
├── layout.tsx         # Sidebar + Header
├── admin/page.tsx     # Pannello admin
├── judge/page.tsx     # Validazione catture
└── (participant)/     # Area partecipante
    └── my-catches/
    └── my-tournaments/
```

### Dashboard Home (`page.tsx`)
Mostra contenuti diversi in base al ruolo:
- **Stats cards:** Catture totali, pendenti, approvate, tornei attivi
- **Quick actions:**
  - Admin/Judge: Link a validazione
  - Admin: Link a gestione tornei
  - Tutti: Link a lista tornei

### Admin Dashboard (`admin/page.tsx`)
- Lista tornei con filtri stato
- Pulsanti azioni (edit, delete)
- Status badges: DRAFT, REGISTRATION_OPEN, PUBLISHED, ONGOING, COMPLETED, CANCELLED

### Judge Dashboard (`judge/page.tsx`)
- Tab: Pending / Approved / Rejected
- Tabella catture con:
  - Pescatore (nome, email)
  - Torneo
  - Peso/Lunghezza
  - Specie
  - Stato GPS (verde/rosso)
  - Data cattura
  - Azioni (view, approve, reject)
- Modal dettaglio con:
  - Photo viewer + zoom controls
  - Video player (HTML5 native)
  - Toggle foto/video
  - Form rifiuto con motivazione

---

## 11. DEMO ASSETS

### Percorso
`frontend/public/demo/`

### File
| Nome | Contenuto | Dimensione |
|------|-----------|------------|
| catch1.jpg | Aguglia Imperiale | 4.9 MB |
| catch2.jpg | Tonno | 1.2 MB |
| catch3.jpg | Totano | 2.6 MB |
| catch4.jpg | Cattura | 4.9 MB |
| catch4_video.mp4 | Video cattura | 22 MB |
| catch5.jpg | Cattura | 3.1 MB |

### Origine
Foto reali dall'archivio personale utente:
`F:\FOTO\P10 mate plus\Foto su sim esterna\pesci\`

### Uso nel Codice
```typescript
const getDemoCatches = (): Catch[] => [
  {
    id: "catch-1",
    photoPath: "/demo/catch1.jpg",
    // ...
  },
  {
    id: "catch-4",
    photoPath: "/demo/catch4.jpg",
    videoPath: "/demo/catch4_video.mp4",
    // ...
  }
];
```

### Video Player
```tsx
<video
  src={selectedCatch.videoPath}
  className="w-full h-full object-contain"
  controls
  autoPlay
  title="Video cattura"
/>
```

---

## 12. COMANDI UTILI

### Frontend
```bash
cd C:\Users\marin\Downloads\TournamentMaster\frontend

# Sviluppo
npm run dev          # Start dev server (porta 3000)

# Build
npm run build        # Build production
npm run start        # Start production server

# Linting
npm run lint         # ESLint check
```

### Backend
```bash
cd C:\Users\marin\Downloads\TournamentMaster\backend

# Sviluppo
npm run dev          # Start con nodemon

# Database
npx prisma generate  # Genera Prisma Client
npx prisma db push   # Sync schema
npx prisma studio    # GUI database

# Build
npm run build        # Compila TypeScript
npm start            # Start production
```

### Database
```bash
# MariaDB CLI
mysql -u root -p tournamentmaster

# Prisma Studio (GUI)
cd backend && npx prisma studio
```

---

## 13. TROUBLESHOOTING

### Lock File Dev Server
**Errore:** "Unable to acquire lock at .next/dev/lock"
**Soluzione:**
```bash
taskkill /F /IM node.exe
cd frontend && npm run dev
```

### Porta 3000 Occupata
**Errore:** "Port 3000 is in use"
**Soluzione:** Dev server partira su 3001/3002 automaticamente

### Turbopack Warning
**Warning:** "Experimental features are not covered by semver"
**Soluzione:** Ignorabile, non impatta funzionalita

### Build Error Tipizzazione
**Errore:** TypeScript type mismatch
**Soluzione:** Verificare che types frontend matchino API backend

### CORS Issues
**Errore:** CORS policy block
**Soluzione:** Verificare che backend abbia CORS configurato per localhost:3000

---

## RIFERIMENTI DOCUMENTAZIONE

| Documento | Percorso |
|-----------|----------|
| Spec Tecnica Principale | `C:\Users\marin\Downloads\TOURNAMENTMASTER_Technical_Implementation_Spec.md` |
| Handover Sessione | `frontend/HANDOVER_SESSIONE_COMPLETO_20251229.md` |
| Technical Reference | `frontend/TECHNICAL_REFERENCE_COMPLETE_20251229.md` |
| README | `frontend/README.md` |

---

*Documento generato: 2025-12-29*
*Prossimo aggiornamento: Al completamento prossima fase sviluppo*
