# DOCUMENTO TECNICO - TournamentMaster

**Versione:** 1.0.0
**Data:** 2026-01-03
**Scopo:** Riferimento completo per sviluppatori

---

## INDICE

1. [Architettura Generale](#architettura-generale)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Services Backend](#services-backend)
5. [Frontend Structure](#frontend-structure)
6. [Autenticazione](#autenticazione)
7. [Configurazione](#configurazione)
8. [File Chiave](#file-chiave)

---

## ARCHITETTURA GENERALE

```
TournamentMaster/
|
+-- backend/           # Node.js + Express + Prisma
|   +-- src/
|   |   +-- routes/    # API endpoints
|   |   +-- services/  # Business logic
|   |   +-- middleware/# Auth, validation
|   |   +-- lib/       # Prisma client
|   |   +-- config/    # Environment config
|   |   +-- types/     # TypeScript types
|   +-- prisma/
|       +-- schema.prisma  # Database schema
|       +-- migrations/    # DB migrations
|       +-- seed.ts        # Test data
|
+-- frontend/          # Next.js 16 + React + Tailwind
|   +-- src/
|       +-- app/[locale]/  # Pages (i18n routing)
|       +-- components/    # React components
|       +-- contexts/      # Global state (Auth)
|
+-- mobile/            # React Native + Expo (in sviluppo)
```

### Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|------------|----------|
| Backend Runtime | Node.js | 18.x+ |
| Backend Framework | Express | 4.x |
| ORM | Prisma | latest |
| Frontend Framework | Next.js | 16.1.1 |
| UI Library | React | 19.x |
| CSS | Tailwind CSS | 3.x |
| Database | MySQL/MariaDB | 10.4+ |
| Mobile | React Native + Expo | latest |

---

## DATABASE SCHEMA

### Connessione
```
Host: localhost
Port: 3306
Database: tournamentmaster
Driver: mysql (Prisma)
```

**Connection String (backend/.env):**
```
DATABASE_URL="mysql://root:password@localhost:3306/tournamentmaster"
```

### Modelli Prisma (18 totali)

#### 1. Tenant (Multi-tenancy)
```prisma
model Tenant {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(255)
  slug        String   @unique @db.VarChar(100)
  domain      String?  @unique @db.VarChar(255)
  logo        String?  @db.VarChar(500)
  primaryColor String? @db.VarChar(7) @default("#0066CC")
  isActive    Boolean  @default(true)

  // Relations
  users       User[]
  tournaments Tournament[]
}
```
**Tabella MySQL:** `tenants`

#### 2. User
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique @db.VarChar(255)
  passwordHash  String    @db.VarChar(255)
  firstName     String    @db.VarChar(100)
  lastName      String    @db.VarChar(100)
  phone         String?   @db.VarChar(20)
  fipsasNumber  String?   @db.VarChar(50)
  role          UserRole  @default(MEMBER)
  avatar        String?   @db.VarChar(500)
  isActive      Boolean   @default(true)
  isVerified    Boolean   @default(false)
  tenantId      String?
}
```
**Tabella MySQL:** `users`

**Enum UserRole:**
- `SUPER_ADMIN` - Amministratore piattaforma
- `TENANT_ADMIN` - Amministratore associazione
- `PRESIDENT` - Presidente (stessi permessi TENANT_ADMIN)
- `ORGANIZER` - Organizzatore tornei
- `JUDGE` - Giudice
- `PARTICIPANT` - Partecipante
- `MEMBER` - Alias legacy per PARTICIPANT

#### 3. RefreshToken
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique @db.VarChar(500)
  expiresAt DateTime
  userId    String
}
```
**Tabella MySQL:** `refresh_tokens`

#### 4. Document
```prisma
model Document {
  id          String         @id @default(uuid())
  type        DocumentType   // MASAF_LICENSE, MEDICAL_CERTIFICATE, etc.
  status      DocumentStatus // PENDING, APPROVED, REJECTED, EXPIRED
  filePath    String
  fileName    String
  mimeType    String
  fileSize    Int
  expiryDate  DateTime?
  userId      String
}
```
**Tabella MySQL:** `documents`

#### 5. Tournament
```prisma
model Tournament {
  id                  String               @id @default(uuid())
  name                String
  description         String?
  discipline          TournamentDiscipline
  status              TournamentStatus     // DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED
  level               TournamentLevel      // CLUB, PROVINCIAL, REGIONAL, NATIONAL, INTERNATIONAL
  startDate           DateTime
  endDate             DateTime
  registrationOpens   DateTime
  registrationCloses  DateTime
  location            String
  locationLat         Decimal?
  locationLng         Decimal?
  registrationFee     Decimal
  maxParticipants     Int?
  minParticipants     Int?
  minWeight           Decimal?
  maxCatchesPerDay    Int?
  pointsPerKg         Decimal
  bonusPoints         Int
  bannerImage         String?
  tenantId            String
  organizerId         String
}
```
**Tabella MySQL:** `tournaments`

**Enum TournamentDiscipline:**
- `BIG_GAME`
- `DRIFTING`
- `TRAINA_COSTIERA`
- `BOLENTINO`
- `EGING`
- `VERTICAL_JIGGING`
- `SHORE`
- `SOCIAL`

#### 6. FishingZone
```prisma
model FishingZone {
  id           String   @id @default(uuid())
  name         String
  description  String?
  geoJson      String   @db.LongText  // GeoJSON Polygon
  minLat       Decimal?
  maxLat       Decimal?
  minLng       Decimal?
  maxLng       Decimal?
  tournamentId String
}
```
**Tabella MySQL:** `fishing_zones`

#### 7. Species
```prisma
model Species {
  id               String   @id @default(uuid())
  scientificName   String   @unique
  commonNameIt     String
  commonNameEn     String
  minSizeCm        Int?
  pointsMultiplier Decimal
  isProtected      Boolean
  imageUrl         String?
}
```
**Tabella MySQL:** `species`

#### 8. TournamentSpecies
```prisma
model TournamentSpecies {
  id                     String  @id @default(uuid())
  tournamentId           String
  speciesId              String
  customPointsMultiplier Decimal?
}
```
**Tabella MySQL:** `tournament_species`

#### 9. TournamentRegistration
```prisma
model TournamentRegistration {
  id             String             @id @default(uuid())
  status         RegistrationStatus // PENDING_PAYMENT, CONFIRMED, CANCELLED, REFUNDED
  registeredAt   DateTime
  confirmedAt    DateTime?
  teamName       String?
  boatName       String?
  boatLength     Decimal?
  boatNumber     Int?
  inspectorId    String?
  inspectorName  String?
  clubName       String?
  clubCode       String?
  amountPaid     Decimal?
  paymentId      String?
  userId         String
  tournamentId   String
}
```
**Tabella MySQL:** `tournament_registrations`

#### 10. Team
```prisma
model Team {
  id            String   @id @default(uuid())
  name          String   // Nome squadra
  boatName      String   // Nome barca
  boatNumber    Int?
  captainId     String
  clubName      String?
  clubCode      String?
  inspectorId   String?
  inspectorName String?
  tournamentId  String
}
```
**Tabella MySQL:** `teams`

#### 11. TeamMember
```prisma
model TeamMember {
  id        String @id @default(uuid())
  teamId    String
  userId    String
  role      String @default("CREW") // CAPTAIN, CREW, ANGLER
}
```
**Tabella MySQL:** `team_members`

#### 12. TournamentStaff
```prisma
model TournamentStaff {
  id           String              @id @default(uuid())
  role         TournamentStaffRole // DIRECTOR, JUDGE, INSPECTOR, SCORER
  notes        String?
  userId       String
  tournamentId String
}
```
**Tabella MySQL:** `tournament_staff`

#### 13. Strike (Segnalazione durante gare)
```prisma
model Strike {
  id            String   @id @default(uuid())
  strikeAt      DateTime
  rodCount      Int      @default(1)
  notes         String?
  latitude      Decimal?
  longitude     Decimal?
  result        String?  // CATCH, LOST, RELEASED
  tournamentId  String
  teamId        String?
  reportedById  String
}
```
**Tabella MySQL:** `strikes`

#### 14. Catch
```prisma
model Catch {
  id             String      @id @default(uuid())
  status         CatchStatus // PENDING, APPROVED, REJECTED
  weight         Decimal     // kg
  length         Decimal?    // cm
  latitude       Decimal
  longitude      Decimal
  gpsAccuracy    Decimal?
  photoPath      String
  photoExifData  String?
  videoPath      String?
  caughtAt       DateTime
  submittedAt    DateTime
  reviewedAt     DateTime?
  reviewNotes    String?
  reviewerId     String?
  points         Decimal?
  isInsideZone   Boolean?
  validationData String?
  userId         String
  tournamentId   String
  speciesId      String?
}
```
**Tabella MySQL:** `catches`

#### 15. LeaderboardEntry
```prisma
model LeaderboardEntry {
  id              String   @id @default(uuid())
  participantName String
  teamName        String?
  rank            Int
  totalPoints     Decimal
  totalWeight     Decimal
  catchCount      Int
  biggestCatch    Decimal?
  tournamentId    String
  userId          String
}
```
**Tabella MySQL:** `leaderboard_entries`

#### 16. AuditLog
```prisma
model AuditLog {
  id          String   @id @default(uuid())
  action      String
  entityType  String
  entityId    String
  oldData     String?
  newData     String?
  ipAddress   String?
  userAgent   String?
  userId      String?
}
```
**Tabella MySQL:** `audit_logs`

---

## API ENDPOINTS

### Base URL
```
Development: http://localhost:3001
Production: https://[your-domain]/api
```

### Health Check
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/health` | Health check base |
| GET | `/api/health` | Health check con uptime |

### Authentication (`/api/auth`)
**File:** `backend/src/routes/auth.routes.ts`

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registrazione utente | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/refresh` | Refresh token | No |
| POST | `/api/auth/logout` | Logout | Si |
| GET | `/api/auth/me` | Profilo utente corrente | Si |

### Users (`/api/users`)
**File:** `backend/src/routes/user.routes.ts`

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | Lista utenti | Admin |
| GET | `/api/users/:id` | Dettaglio utente | Si |
| PUT | `/api/users/:id` | Aggiorna utente | Si |
| DELETE | `/api/users/:id` | Elimina utente | Admin |

### Tournaments (`/api/tournaments`)
**File:** `backend/src/routes/tournament.routes.ts`
**Sub-routes:** `backend/src/routes/tournament/*.ts`

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/tournaments` | Lista tornei | No |
| GET | `/api/tournaments/:id` | Dettaglio torneo | No |
| POST | `/api/tournaments` | Crea torneo | Organizer+ |
| PUT | `/api/tournaments/:id` | Aggiorna torneo | Organizer+ |
| DELETE | `/api/tournaments/:id` | Elimina torneo | Admin |
| POST | `/api/tournaments/:id/publish` | Pubblica torneo | Organizer+ |
| POST | `/api/tournaments/:id/start` | Avvia torneo | Organizer+ |
| POST | `/api/tournaments/:id/complete` | Completa torneo | Organizer+ |

### Teams (`/api/teams`)
**File:** `backend/src/routes/team.routes.ts`

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/teams` | Lista team (con filtro torneo) | Si |
| GET | `/api/teams/:id` | Dettaglio team | Si |
| POST | `/api/teams` | Crea team | Si |
| PUT | `/api/teams/:id` | Aggiorna team | Captain/Admin |
| DELETE | `/api/teams/:id` | Elimina team | Admin |
| POST | `/api/teams/:id/members` | Aggiungi membro | Captain |
| DELETE | `/api/teams/:id/members/:userId` | Rimuovi membro | Captain |

### Strikes (`/api/strikes`)
**File:** `backend/src/routes/strike.routes.ts`

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/strikes` | Lista strikes (con filtro torneo) | Si |
| POST | `/api/strikes` | Registra strike | Si |
| PUT | `/api/strikes/:id` | Aggiorna strike (esito) | Si |
| DELETE | `/api/strikes/:id` | Elimina strike | Admin |

### Catches (`/api/catches`)
**File:** `backend/src/routes/catch.routes.ts`

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/catches` | Lista catture | Si |
| GET | `/api/catches/:id` | Dettaglio cattura | Si |
| POST | `/api/catches` | Registra cattura | Si |
| PUT | `/api/catches/:id` | Aggiorna cattura | Owner/Judge |
| PUT | `/api/catches/:id/review` | Approva/Rifiuta | Judge |

### Leaderboard (`/api/leaderboard`)
**File:** `backend/src/routes/leaderboard.routes.ts`

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/leaderboard/:tournamentId` | Classifica torneo | No |
| POST | `/api/leaderboard/:tournamentId/recalculate` | Ricalcola | Admin |

### Upload (`/api/upload`)
**File:** `backend/src/routes/upload.routes.ts`

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload/image` | Upload immagine | Si |
| POST | `/api/upload/video` | Upload video | Si |

### Tenants (`/api/tenants`)
**File:** `backend/src/routes/tenant.routes.ts`

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/tenants` | Lista tenant | Super Admin |
| POST | `/api/tenants` | Crea tenant | Super Admin |

### Reports (`/api/reports`)
**File:** `backend/src/routes/reports.routes.ts`

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/reports/tournament/:id` | Report torneo | Organizer+ |
| GET | `/api/reports/tournament/:id/pdf` | Export PDF | Organizer+ |

---

## SERVICES BACKEND

### Posizione
`backend/src/services/`

### Lista Services

| File | Classe/Funzioni | Scopo |
|------|-----------------|-------|
| `auth.service.ts` | AuthService | Login, register, token management |
| `catch.service.ts` | CatchService | CRUD catture, validazione GPS |
| `gps.service.ts` | GPSService | Validazione zone GPS |
| `leaderboard.service.ts` | LeaderboardService | Calcolo classifica |
| `reports.service.ts` | ReportsService | Generazione report |
| `upload.service.ts` | UploadService | Gestione file upload |
| `tournament.service.ts` | (legacy) | Redirect a tournament/ |
| `tournament/index.ts` | TournamentService | Export aggregato |
| `tournament/tournament.service.ts` | TournamentService | CRUD tornei |
| `tournament/tournament-crud.service.ts` | TournamentCRUDService | Operazioni CRUD |
| `tournament/tournament-lifecycle.service.ts` | TournamentLifecycleService | Stati torneo |
| `tournament/tournament-registration.service.ts` | TournamentRegistrationService | Iscrizioni |
| `tournament/tournament-zones.service.ts` | TournamentZonesService | Zone pesca |
| `tournament/tournament.types.ts` | Types | TypeScript interfaces |

---

## FRONTEND STRUCTURE

### Pages (App Router - i18n)
`frontend/src/app/[locale]/`

| Path | File | Descrizione |
|------|------|-------------|
| `/` | `page.tsx` | Homepage |
| `/login` | `login/page.tsx` | Pagina login |
| `/register` | `register/page.tsx` | Registrazione |
| `/tournaments` | `tournaments/page.tsx` | Lista tornei |
| `/tournaments/[id]` | `tournaments/[id]/page.tsx` | Dettaglio torneo |
| `/tournaments/[id]/register` | `tournaments/[id]/register/page.tsx` | Iscrizione torneo |
| `/leaderboard` | `leaderboard/page.tsx` | Classifiche |
| `/leaderboard/[tournamentId]` | `leaderboard/[tournamentId]/page.tsx` | Classifica torneo |
| `/dashboard` | `dashboard/page.tsx` | Dashboard utente |
| `/dashboard/teams` | `dashboard/teams/page.tsx` | Gestione team |
| `/dashboard/strikes` | `dashboard/strikes/page.tsx` | Strike live |
| `/dashboard/tournaments` | `dashboard/tournaments/page.tsx` | I miei tornei |
| `/dashboard/admin` | `dashboard/admin/page.tsx` | Admin panel |
| `/dashboard/super-admin` | `dashboard/super-admin/page.tsx` | Super admin |
| `/dashboard/judge` | `dashboard/judge/page.tsx` | Panel giudice |
| `/dashboard/users` | `dashboard/users/page.tsx` | Gestione utenti |
| `/dashboard/reports` | `dashboard/reports/page.tsx` | Report |
| `/catch/new` | `catch/new/page.tsx` | Nuova cattura |
| `/privacy` | `privacy/page.tsx` | Privacy policy |
| `/terms` | `terms/page.tsx` | Termini servizio |
| `/cookies` | `cookies/page.tsx` | Cookie policy |
| `/features` | `features/page.tsx` | Funzionalita |
| `/pricing` | `pricing/page.tsx` | Prezzi |
| `/organizer/register` | `organizer/register/page.tsx` | Diventa organizzatore |
| `/guida-installazione` | `guida-installazione/page.tsx` | Guida installazione |
| `/payments` | `payments/page.tsx` | Pagamenti |
| `/payments/guide` | `payments/guide/page.tsx` | Guida pagamenti |

### Components
`frontend/src/components/`

| Folder | Contenuto |
|--------|-----------|
| `ui/` | Componenti base (button, card, input, dialog, etc.) |
| `home/` | Sezioni homepage (Hero, Features, Disciplines) |
| `layout/` | Header, Footer |
| `tournament/` | TournamentCard |
| `native/` | Componenti per mobile (VideoCapture, CatchCamera, LiveLeaderboard) |
| `common/` | LanguageSelector |
| `providers/` | Providers wrapper |

### Contexts
`frontend/src/contexts/`

| File | Export | Scopo |
|------|--------|-------|
| `AuthContext.tsx` | `AuthProvider`, `useAuth()` | Gestione autenticazione globale |

---

## AUTENTICAZIONE

### Flow
1. **Login:** POST `/api/auth/login` con email/password
2. **Response:** `{ accessToken, refreshToken, user }`
3. **Storage:** Token in `localStorage`
4. **Requests:** Header `Authorization: Bearer <token>`
5. **Refresh:** POST `/api/auth/refresh` quando access token scade

### AuthContext Methods
```typescript
// File: frontend/src/contexts/AuthContext.tsx

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login(email: string, password: string): Promise<{success: boolean; error?: string}>;
  logout(): void;
  hasRole(...roles: UserRole[]): boolean;
  isAdmin: boolean;      // SUPER_ADMIN | TENANT_ADMIN | PRESIDENT
  isJudge: boolean;      // JUDGE
  isOrganizer: boolean;  // ORGANIZER
  isPresident: boolean;  // PRESIDENT
}
```

### Middleware Backend
```typescript
// File: backend/src/middleware/auth.middleware.ts
// Verifica JWT e popola req.user
```

---

## CONFIGURAZIONE

### Backend (.env)
```env
# Database
DATABASE_URL="mysql://root:@localhost:3306/tournamentmaster"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Server
PORT=3001
NODE_ENV=development

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Stripe (Phase 2)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Config Object (backend/src/config/index.ts)
```typescript
export const config = {
  port: number,
  nodeEnv: string,
  isDev: boolean,
  isProd: boolean,
  databaseUrl: string,
  jwt: {
    secret: string,
    expiresIn: string,
    refreshExpiresIn: string
  },
  frontendUrl: string,
  upload: {
    dir: string,
    maxFileSize: number
  },
  stripe: {
    secretKey: string,
    webhookSecret: string
  },
  cloudinary: {
    cloudName: string,
    apiKey: string,
    apiSecret: string
  }
}
```

---

## FILE CHIAVE

### Entry Points
| File | Scopo |
|------|-------|
| `backend/src/index.ts` | Server startup |
| `backend/src/app.ts` | Express configuration |
| `frontend/src/app/layout.tsx` | Root layout |
| `frontend/src/app/[locale]/layout.tsx` | Locale layout |

### Database
| File | Scopo |
|------|-------|
| `backend/prisma/schema.prisma` | Schema definizione |
| `backend/prisma/seed.ts` | Dati test |
| `backend/src/lib/prisma.ts` | Prisma client instance |

### Auth
| File | Scopo |
|------|-------|
| `backend/src/routes/auth.routes.ts` | API auth |
| `backend/src/services/auth.service.ts` | Auth logic |
| `backend/src/middleware/auth.middleware.ts` | JWT middleware |
| `frontend/src/contexts/AuthContext.tsx` | Frontend auth state |

### Core Business Logic
| File | Scopo |
|------|-------|
| `backend/src/services/tournament/*.ts` | Logica tornei |
| `backend/src/services/catch.service.ts` | Gestione catture |
| `backend/src/services/leaderboard.service.ts` | Classifiche |
| `backend/src/services/gps.service.ts` | Validazione GPS |

---

## COMANDI PRISMA

```bash
cd backend

# Genera client Prisma
npx prisma generate

# Crea/applica migrazione
npx prisma migrate dev --name nome_migrazione

# Reset database + seed
npx prisma migrate reset

# Seed dati test
npx prisma db seed

# GUI database
npx prisma studio

# Push schema senza migrazione
npx prisma db push

# Visualizza schema
npx prisma format
```

---

## PORTE E URL

| Servizio | Porta | URL |
|----------|-------|-----|
| Backend API | 3001 | http://localhost:3001 |
| Frontend | 3000 | http://localhost:3000 |
| Prisma Studio | 5555 | http://localhost:5555 |
| MySQL | 3306 | localhost:3306 |

---

*Documento tecnico generato il 2026-01-03 - TournamentMaster v1.0.0*
