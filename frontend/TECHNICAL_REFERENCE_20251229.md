# TECHNICAL REFERENCE - TournamentMaster
**Data creazione:** 2025-12-29
**Scopo:** Riferimento tecnico completo per continuare lo sviluppo

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
9. [Connessioni e Configurazioni](#9-connessioni-e-configurazioni)
10. [Comandi Utili](#10-comandi-utili)

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

---

## 2. STACK TECNOLOGICO

### Frontend
| Tecnologia | Versione | Uso |
|------------|----------|-----|
| Next.js | 16.1.1 | Framework React con App Router |
| React | 19.2.3 | UI Library |
| TypeScript | 5.x | Type Safety |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | latest | Component Library |
| next-intl | 4.6.1 | Internationalization |
| Lucide React | 0.562.0 | Icons |
| React Hook Form | 7.69.0 | Form Management |
| Zod | 4.2.1 | Schema Validation |
| @turf/turf | 7.3.1 | GeoJSON/GPS Utilities |

### Backend
| Tecnologia | Versione | Uso |
|------------|----------|-----|
| Express.js | latest | Web Server |
| TypeScript | 5.x | Type Safety |
| Prisma | latest | ORM |
| express-validator | latest | Request Validation |
| JWT | - | Authentication |
| bcrypt | - | Password Hashing |

### Database
| Tecnologia | Versione | Uso |
|------------|----------|-----|
| MariaDB | 10.4 | Primary Database |
| Prisma | latest | Schema Management & Queries |

---

## 3. STRUTTURA DIRECTORY

```
C:\Users\marin\Downloads\TournamentMaster\
├── frontend/                          # Next.js Frontend
│   ├── messages/                      # i18n translation files (24 files)
│   │   ├── it.json                    # Italian (primary)
│   │   ├── en.json                    # English (primary)
│   │   ├── de.json                    # German
│   │   ├── fr.json                    # French
│   │   ├── es.json                    # Spanish
│   │   └── ... (19 more languages)
│   ├── public/                        # Static assets
│   ├── src/
│   │   ├── app/
│   │   │   ├── [locale]/              # Localized pages
│   │   │   │   ├── page.tsx           # Homepage (311 lines)
│   │   │   │   └── layout.tsx         # Layout with IntlProvider
│   │   │   ├── globals.css            # Ocean theme (183 lines)
│   │   │   └── layout.tsx             # Root layout
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── LanguageSelector.tsx
│   │   │   └── ui/                    # shadcn components
│   │   ├── i18n/
│   │   │   └── config.ts              # Locale configuration
│   │   ├── lib/
│   │   │   └── utils.ts               # Utility functions
│   │   └── middleware.ts              # i18n routing middleware
│   ├── package.json
│   └── next.config.ts
│
├── backend/                           # Express.js Backend
│   ├── prisma/
│   │   └── schema.prisma              # Database schema (441 lines)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts         # Auth endpoints (172 lines)
│   │   │   ├── tournament.routes.ts   # Tournament CRUD (594 lines)
│   │   │   ├── catch.routes.ts        # Catch submission
│   │   │   ├── leaderboard.routes.ts  # Leaderboard
│   │   │   └── user.routes.ts         # User management
│   │   ├── services/
│   │   │   ├── auth.service.ts        # Authentication logic
│   │   │   └── tournament.service.ts  # Tournament business logic
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts     # JWT verification
│   │   └── types/
│   │       └── index.ts               # TypeScript types
│   └── package.json
│
└── DOCUMENTATION/
    ├── TOURNAMENTMASTER_Technical_Implementation_Spec.md
    ├── CHATBOT_LINGUE_EUROPEE_CONFIG.md
    ├── HANDOVER_SESSIONE_20251229.md
    └── TECHNICAL_REFERENCE_20251229.md (this file)
```

---

## 4. DATABASE SCHEMA

### Tabelle (14 totali)

| Tabella | Descrizione | Righe Schema |
|---------|-------------|--------------|
| `tenants` | Multi-tenant associations | 18-34 |
| `users` | User accounts | 48-78 |
| `refresh_tokens` | JWT refresh tokens | 80-92 |
| `documents` | User document uploads | 112-133 |
| `tournaments` | Tournament definitions | 158-211 |
| `fishing_zones` | GeoJSON fishing zones | 217-241 |
| `species` | Fish species catalog | 247-263 |
| `tournament_species` | Tournament-species relation | 265-277 |
| `tournament_registrations` | Participant registrations | 290-319 |
| `catches` | Catch submissions | 331-385 |
| `leaderboard_entries` | Denormalized leaderboard | 391-417 |
| `audit_logs` | Audit trail | 423-440 |

### Enum Types

```prisma
enum UserRole {
  SUPER_ADMIN
  TENANT_ADMIN
  ORGANIZER
  JUDGE
  PARTICIPANT
}

enum TournamentStatus {
  DRAFT
  PUBLISHED
  ONGOING
  COMPLETED
  CANCELLED
}

enum TournamentDiscipline {
  BIG_GAME
  DRIFTING
  TRAINA_COSTIERA
  BOLENTINO
  EGING
  VERTICAL_JIGGING
  SHORE
  SOCIAL
}

enum DocumentType {
  MASAF_LICENSE
  MEDICAL_CERTIFICATE
  NAUTICAL_LICENSE
  IDENTITY_DOCUMENT
}

enum DocumentStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

enum RegistrationStatus {
  PENDING_PAYMENT
  CONFIRMED
  CANCELLED
  REFUNDED
}

enum CatchStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### Relazioni Chiave

```
User 1──∞ TournamentRegistration ∞──1 Tournament
User 1──∞ Catch ∞──1 Tournament
User 1──∞ Document
Tournament 1──∞ FishingZone
Tournament 1──∞ LeaderboardEntry
Tournament ∞──∞ Species (via TournamentSpecies)
Catch ∞──1 Species
Tenant 1──∞ User
Tenant 1──∞ Tournament
```

---

## 5. API ENDPOINTS

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/register` | No | `{email, password, firstName, lastName, phone?, fipsasNumber?}` | `{user, accessToken, refreshToken}` |
| POST | `/login` | No | `{email, password}` | `{user, accessToken, refreshToken}` |
| POST | `/refresh` | No | `{refreshToken}` | `{accessToken}` |
| POST | `/logout` | No | `{refreshToken?}` | `{success: true}` |

### Tournaments (`/api/tournaments`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | Optional | Any | List tournaments (paginated) |
| GET | `/:id` | Optional | Any | Get tournament details |
| POST | `/` | Yes | ORGANIZER+ | Create tournament |
| PUT | `/:id` | Yes | ORGANIZER+ | Update tournament |
| DELETE | `/:id` | Yes | ORGANIZER+ | Delete/cancel tournament |
| POST | `/:id/publish` | Yes | ORGANIZER+ | Publish tournament |
| POST | `/:id/start` | Yes | ORGANIZER+ | Start tournament |
| POST | `/:id/complete` | Yes | ORGANIZER+ | Complete tournament |
| POST | `/:id/zones` | Yes | ORGANIZER+ | Add fishing zone |
| POST | `/:id/register` | Yes | PARTICIPANT+ | Register for tournament |
| GET | `/:id/participants` | Optional | Any | Get participants list |

### Catches (`/api/catches`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/` | Yes | PARTICIPANT | Submit catch |
| GET | `/:tournamentId` | Yes | Any | Get catches for tournament |
| PUT | `/:id/approve` | Yes | JUDGE+ | Approve catch |
| PUT | `/:id/reject` | Yes | JUDGE+ | Reject catch |

### Leaderboard (`/api/leaderboard`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:tournamentId` | Optional | Get leaderboard |
| GET | `/:tournamentId/live` | Optional | Get live updates (WebSocket ready) |

---

## 6. FRONTEND COMPONENTS

### Page Components

| File | Descrizione | Linee |
|------|-------------|-------|
| `src/app/[locale]/page.tsx` | Homepage con discipline | 311 |
| `src/app/[locale]/layout.tsx` | Layout con IntlProvider | ~30 |

### Key Componenti in `page.tsx`

```typescript
// Icon mapping per discipline (linee 29-48)
const disciplineIcons: Record<string, React.ElementType> = {
  big_game: Ship,
  drifting: Waves,
  traina_costiera: Anchor,
  vertical_jigging: Target,
  bolentino: Compass,
  eging: Fish,
  spinning_mare: Target,
  surfcasting: Waves,
  shore: Anchor,
  fly_fishing: Sparkles,
  spinning_fiume: Target,
  carpfishing: Fish,
  feeder: Droplets,
  trota_lago: Mountain,
  trota_torrente: TreePine,
  bass_fishing: Fish,
  colpo: Award,
  social: Users,
};

// Discipline arrays (linee 51-73)
const seaDisciplines = [
  "big_game", "drifting", "traina_costiera", "vertical_jigging",
  "bolentino", "eging", "spinning_mare", "surfcasting", "shore"
];

const freshwaterDisciplines = [
  "fly_fishing", "spinning_fiume", "carpfishing", "feeder",
  "trota_lago", "trota_torrente", "bass_fishing", "colpo"
];
```

### UI Components (shadcn)

| Component | Import |
|-----------|--------|
| Button | `@/components/ui/button` |
| Card, CardContent, CardHeader, CardTitle, CardDescription | `@/components/ui/card` |
| Badge | `@/components/ui/badge` |
| Select, SelectContent, SelectItem, SelectTrigger, SelectValue | `@/components/ui/select` |
| Dialog | `@/components/ui/dialog` |
| DropdownMenu | `@/components/ui/dropdown-menu` |

### Custom Components

| Component | File | Descrizione |
|-----------|------|-------------|
| LanguageSelector | `src/components/common/LanguageSelector.tsx` | Dropdown selezione lingua |
| DisciplineCard | `src/app/[locale]/page.tsx:81-112` | Card per singola disciplina |

---

## 7. INTERNAZIONALIZZAZIONE

### Configurazione

```typescript
// src/i18n/config.ts
export const locales = [
  'it', 'en', 'de', 'fr', 'es', 'pt', 'nl', 'pl', 'ro', 'el',
  'cs', 'hu', 'sv', 'da', 'fi', 'hr', 'sl', 'sk', 'bg', 'lt',
  'lv', 'et', 'mt', 'ga'
] as const;

export const defaultLocale: Locale = 'it';
export const priorityLocales: Locale[] = ['it', 'en', 'de', 'fr', 'es', 'pt'];
```

### Middleware

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // Nasconde locale default da URL
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

### Struttura File Traduzioni

```json
// messages/{locale}.json
{
  "home": {
    "badge": "...",
    "heroDescription": "...",
    "disciplinesTitle": "...",
    "seaFishingTitle": "...",
    "freshwaterFishingTitle": "...",
    "allRightsReserved": "...",
    "disciplines": {
      "big_game": { "subtitle": "...", "description": "..." },
      // ... altre 16 discipline
    }
  },
  "common": { "appName": "...", "loading": "...", ... },
  "nav": { "home": "...", "tournaments": "...", ... },
  "auth": { "login": "...", "register": "...", ... },
  "tournament": { "title": "...", "disciplines": { ... }, ... },
  "catch": { ... },
  "leaderboard": { ... },
  "profile": { ... },
  "documents": { ... },
  "errors": { ... }
}
```

### Uso nei Componenti

```typescript
import { useTranslations } from "next-intl";

function Component() {
  const t = useTranslations();

  return (
    <div>
      <h1>{t("home.seaFishingTitle")}</h1>
      <p>{t("home.disciplines.big_game.description")}</p>
      <span>{t("tournament.disciplines.big_game")}</span>
    </div>
  );
}
```

---

## 8. DISCIPLINE PESCA

### Mare (9 discipline)

| Key | Nome IT | Nome EN | Specie Target |
|-----|---------|---------|---------------|
| `big_game` | Traina d'Altura | Big Game | tonno rosso, pescespada, alalunga, lampuga |
| `drifting` | Pesca in Deriva | Drifting | tonno rosso, grandi pelagici |
| `traina_costiera` | Piccola Traina | Coastal Trolling | spigole, palamite, serra |
| `vertical_jigging` | Jigging Verticale | Vertical Jigging | dentici, ricciole, cernie |
| `bolentino` | Pesca a Fondo | Bottom Fishing | occhioni, naselli, cernie |
| `eging` | Pesca ai Cefalopodi | Eging | calamari, seppie, totani |
| `spinning_mare` | Spinning in Mare | Sea Spinning | predatori marini |
| `surfcasting` | Surfcasting | Surfcasting | orate, spigole, mormore |
| `shore` | Pesca da Riva | Shore Fishing | tecniche miste costa |

### Acque Interne (8 discipline)

| Key | Nome IT | Nome EN | Specie Target |
|-----|---------|---------|---------------|
| `fly_fishing` | Pesca a Mosca | Fly Fishing | trote, temoli |
| `spinning_fiume` | Spinning Fiume | River Spinning | lucci, persici, aspi, siluri |
| `carpfishing` | Carpfishing | Carp Fishing | carpe |
| `feeder` | Feeder Fishing | Feeder Fishing | ciprinidi |
| `trota_lago` | Trota Lago | Lake Trout | trote in lago |
| `trota_torrente` | Trota Torrente | Stream Trout | trote in torrente |
| `bass_fishing` | Black Bass | Bass Fishing | persico trota |
| `colpo` | Pesca al Colpo | Match Fishing | ciprinidi competitivo |

### Altro

| Key | Nome IT | Nome EN |
|-----|---------|---------|
| `social` | Evento Sociale | Social Event |

---

## 9. CONNESSIONI E CONFIGURAZIONI

### Frontend Environment

```env
# .env.local (da creare se non esiste)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Backend Environment

```env
# .env
DATABASE_URL="mysql://root:@localhost:3306/tournamentmaster"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
```

### CSS Custom Properties (globals.css)

```css
:root {
  /* Ocean Theme - Primary */
  --primary: oklch(0.5 0.15 240);        /* Deep Ocean Blue */
  --secondary: oklch(0.85 0.08 175);     /* Seafoam Green */
  --accent: oklch(0.7 0.12 190);         /* Teal Accent */

  /* Custom Gradients */
  --sea-gradient-start: oklch(0.45 0.15 230);
  --sea-gradient-end: oklch(0.6 0.12 200);
  --freshwater-gradient-start: oklch(0.5 0.12 150);
  --freshwater-gradient-end: oklch(0.65 0.1 130);
}

.dark {
  /* Dark mode variants */
  --primary: oklch(0.65 0.18 220);
  --secondary: oklch(0.35 0.08 180);
  /* ... */
}
```

### Utility Classes Personalizzate

| Classe | Uso |
|--------|-----|
| `.bg-sea-gradient` | Sfondo gradiente mare |
| `.bg-freshwater-gradient` | Sfondo gradiente acque interne |
| `.bg-wave-pattern` | Pattern onde decorativo |
| `.text-gradient-sea` | Testo gradiente oceano |
| `.card-hover-sea` | Hover effect card mare |
| `.card-hover-freshwater` | Hover effect card freshwater |

---

## 10. COMANDI UTILI

### Frontend

```bash
cd C:\Users\marin\Downloads\TournamentMaster\frontend

# Sviluppo
npm run dev          # Avvia dev server (porta 3000)

# Build
npm run build        # Build produzione

# Start produzione
npm run start        # Avvia server produzione

# Lint
npm run lint         # ESLint check
```

### Backend

```bash
cd C:\Users\marin\Downloads\TournamentMaster\backend

# Sviluppo
npm run dev          # Avvia con nodemon

# Prisma
npx prisma generate  # Genera client
npx prisma migrate dev  # Applica migrazioni
npx prisma studio    # GUI database
```

### Fix Lock File (se dev server bloccato)

```bash
# Terminare tutti i processi Node.js
taskkill /F /IM node.exe

# Eliminare lock file
del "C:\Users\marin\Downloads\TournamentMaster\frontend\.next\dev\lock"

# Riavviare
npm run dev
```

### Aggiungere Componente shadcn

```bash
npx shadcn@latest add [component-name]
# Esempio: npx shadcn@latest add dialog
```

---

## RIFERIMENTI FILE CRITICI

| Scopo | File | Path Completo |
|-------|------|---------------|
| Homepage | page.tsx | `frontend/src/app/[locale]/page.tsx` |
| Tema CSS | globals.css | `frontend/src/app/globals.css` |
| Config i18n | config.ts | `frontend/src/i18n/config.ts` |
| Middleware | middleware.ts | `frontend/src/middleware.ts` |
| DB Schema | schema.prisma | `backend/prisma/schema.prisma` |
| Auth Routes | auth.routes.ts | `backend/src/routes/auth.routes.ts` |
| Tournament Routes | tournament.routes.ts | `backend/src/routes/tournament.routes.ts` |
| IT Translations | it.json | `frontend/messages/it.json` |
| EN Translations | en.json | `frontend/messages/en.json` |

---

*Documento tecnico generato: 2025-12-29*
*Per continuazione sviluppo, iniziare da sezione "Prossimi Task Prioritari" in HANDOVER*
