# TournamentMaster - Documentazione Completa (Backend + Frontend)

**Versione:** 2.0.0
**Data:** 2026-01-09
**Backend Stack:** Node.js + Express + TypeScript + Prisma + MySQL/MariaDB
**Frontend Stack:** Next.js 14 + TypeScript + Tailwind CSS + Capacitor

---

## Changelog v2.0.0

### Nuove Funzionalita (Gennaio 2026)
- **Sistema Messaggistica Interna** - Messaggi diretti e broadcast tra admin e iscritti
- **UserMedia System** - Gestione foto/video personali per barche, attrezzature, tornei
- **Gestione Barche Personali** - CRUD barche con galleria media integrata
- **Gestione Attrezzature** - CRUD attrezzature con galleria media
- **Profilo Skipper** - Gestione patenti nautiche e disponibilita
- **Gestione Tessere** - Membership associative con scadenze
- **Admin View Mode** - Admin puo visualizzare profili iscritti in modalita read-only
- **Media Library Enhanced** - Supporto video, thumbnail automatici, multi-tenant
- **CMS Dinamico** - Features, FAQ, Discipline, Pricing Plans
- **Team Enhanced** - Campi "Representing Club" per tornei provinciali/nazionali

---

## Indice

### Parte 1 - Architettura
1. [Stack Tecnologico](#stack-tecnologico)
2. [Struttura Directory](#struttura-directory)
3. [Pattern Architetturali](#pattern-architetturali)

### Parte 2 - Database
4. [Schema Prisma](#schema-prisma)
5. [Modelli Principali](#modelli-principali)
6. [Enumerazioni](#enumerazioni)

### Parte 3 - Backend API
7. [Auth Routes](#auth-routes)
8. [User Routes](#user-routes)
9. [Tournament Routes](#tournament-routes)
10. [Boat Routes](#boat-routes)
11. [Equipment Routes](#equipment-routes)
12. [Skipper Routes](#skipper-routes)
13. [Membership Routes](#membership-routes)
14. [Message Routes](#message-routes)
15. [UserMedia Routes](#usermedia-routes)
16. [Media Library Routes](#media-library-routes)
17. [Team Routes](#team-routes)
18. [Catch Routes](#catch-routes)
19. [Strike Routes](#strike-routes)
20. [CMS Routes](#cms-routes)
21. [Reports Routes](#reports-routes)

### Parte 4 - Frontend
22. [Architettura Frontend](#architettura-frontend)
23. [Pagine Dashboard](#pagine-dashboard)
24. [Componenti User](#componenti-user)
25. [Sistema Autenticazione](#sistema-autenticazione-frontend)

### Parte 5 - Deploy
26. [Configurazione Ambiente](#configurazione-ambiente)
27. [Avvio Sviluppo](#avvio-sviluppo)

---

## Stack Tecnologico

| Componente | Tecnologia | Versione |
|------------|------------|----------|
| Runtime | Node.js | 18+ |
| Framework Backend | Express.js | 4.x |
| Framework Frontend | Next.js | 14.x |
| Linguaggio | TypeScript | 5.x |
| ORM | Prisma | 5.x |
| Database | MySQL/MariaDB | 8.x / 10.4 |
| UI Components | shadcn/ui | latest |
| Styling | Tailwind CSS | 3.x |
| Auth | JWT + bcrypt | - |
| File Upload | Multer | 2.x |
| Image Processing | Sharp | 0.34.x |
| Geospatial | Turf.js | 7.x |
| Mobile | Capacitor | 6.x |

---

## Struttura Directory

```
TournamentMaster/
├── backend/
│   ├── src/
│   │   ├── app.ts                    # Express app setup
│   │   ├── index.ts                  # Server entry point
│   │   ├── config/
│   │   │   └── index.ts              # Configuration
│   │   ├── lib/
│   │   │   └── prisma.ts             # Prisma client
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts    # JWT auth, role checks
│   │   ├── routes/
│   │   │   ├── auth.routes.ts        # Login, register, refresh
│   │   │   ├── user.routes.ts        # User profile, list users
│   │   │   ├── boat.routes.ts        # Personal boats CRUD
│   │   │   ├── equipment.routes.ts   # Equipment CRUD
│   │   │   ├── skipper.routes.ts     # Skipper profile
│   │   │   ├── membership.routes.ts  # Association memberships
│   │   │   ├── message.routes.ts     # Internal messaging
│   │   │   ├── user-media.routes.ts  # User photos/videos
│   │   │   ├── media.routes.ts       # Media library
│   │   │   ├── team.routes.ts        # Tournament teams
│   │   │   ├── catch.routes.ts       # Catch submissions
│   │   │   ├── strike.routes.ts      # Strike reporting
│   │   │   ├── cms.routes.ts         # CMS content
│   │   │   ├── tenant.routes.ts      # Multi-tenant management
│   │   │   ├── reports.routes.ts     # PDF reports
│   │   │   ├── leaderboard.routes.ts # Rankings
│   │   │   ├── upload.routes.ts      # File uploads
│   │   │   ├── health.routes.ts      # Health check
│   │   │   └── tournament/           # Tournament module
│   │   │       ├── index.ts
│   │   │       ├── tournament-crud.routes.ts
│   │   │       ├── tournament-lifecycle.routes.ts
│   │   │       ├── tournament-registration.routes.ts
│   │   │       └── tournament-zones.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── message.service.ts    # Messaging logic
│   │   │   ├── catch.service.ts
│   │   │   ├── leaderboard.service.ts
│   │   │   ├── reports.service.ts
│   │   │   ├── pdf.service.ts
│   │   │   ├── thumbnail.service.ts  # Video thumbnails
│   │   │   ├── upload.service.ts
│   │   │   ├── gps.service.ts
│   │   │   └── tournament/
│   │   └── types/
│   │       └── index.ts
│   ├── prisma/
│   │   └── schema.prisma             # Database schema
│   └── uploads/                      # Local file storage
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── [locale]/
│   │   │       ├── page.tsx          # Homepage
│   │   │       ├── login/
│   │   │       ├── dashboard/
│   │   │       │   ├── page.tsx      # User dashboard
│   │   │       │   ├── admin/        # Admin dashboard
│   │   │       │   ├── super-admin/  # SuperAdmin dashboard
│   │   │       │   ├── messages/     # Messaging
│   │   │       │   ├── teams/        # Team management
│   │   │       │   ├── tournaments/  # Tournament management
│   │   │       │   ├── users/        # User management (admin)
│   │   │       │   │   └── [userId]/ # User detail (admin view)
│   │   │       │   ├── strikes/      # Strike reporting
│   │   │       │   ├── reports/      # Reports
│   │   │       │   └── settings/     # Settings
│   │   │       ├── associazioni/
│   │   │       │   └── [slug]/       # Association public page
│   │   │       └── leaderboard/
│   │   ├── components/
│   │   │   ├── user/                 # User section components
│   │   │   │   ├── BoatsSection.tsx
│   │   │   │   ├── EquipmentSection.tsx
│   │   │   │   ├── MediaSection.tsx
│   │   │   │   ├── MessagesSection.tsx
│   │   │   │   ├── SkipperSection.tsx
│   │   │   │   └── SettingsSection.tsx
│   │   │   ├── association/
│   │   │   │   └── UserDashboardSection.tsx
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── layout/
│   │   │   ├── tournament/
│   │   │   └── common/
│   │   ├── lib/
│   │   │   ├── api.ts                # API client
│   │   │   ├── auth.ts               # Auth utilities
│   │   │   └── messages.ts           # Messaging utilities
│   │   └── hooks/
│   └── public/
│       ├── images/
│       │   ├── banners/              # Banner images/videos
│       │   ├── tenants/              # Tenant logos
│       │   └── thumbnails/           # Video thumbnails
│       └── locales/                  # i18n translations
│
└── docs/                             # Documentation
```

---

## Schema Prisma

### Modelli Database (24 totali)

```
Core:
├── Tenant              # Multi-tenant (associazioni)
├── User                # Utenti con ruoli
├── RefreshToken        # JWT refresh tokens
└── Document            # Documenti utente (licenze, certificati)

Tournament:
├── Tournament          # Tornei
├── FishingZone         # Zone pesca (GeoJSON)
├── Species             # Specie ittiche
├── TournamentSpecies   # Specie per torneo
├── TournamentRegistration # Iscrizioni
├── TournamentStaff     # Staff temporaneo torneo
├── Team                # Squadre/Equipaggi
├── TeamMember          # Membri equipaggio
├── Strike              # Segnalazioni strike
├── Catch               # Catture
└── LeaderboardEntry    # Classifica

User Assets:
├── Boat                # Barche personali
├── Equipment           # Attrezzature
├── SkipperProfile      # Profilo skipper
├── Membership          # Tessere associative
└── UserMedia           # Foto/video utente

Messaging:
├── Message             # Messaggi
└── MessageReadReceipt  # Ricevute lettura broadcast

CMS:
├── Feature             # Features homepage
├── PricingPlan         # Piani tariffari
├── PlanFeature         # Feature dei piani
├── Faq                 # FAQ
├── DisciplineInfo      # Info discipline
└── BannerImage         # Media library

System:
└── AuditLog            # Audit trail
```

---

## Modelli Principali

### User
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  fipsasNumber  String?
  role          UserRole  @default(MEMBER)
  avatar        String?
  isActive      Boolean   @default(true)
  isVerified    Boolean   @default(false)
  tenantId      String?

  // Relations
  boats         Boat[]
  equipment     Equipment[]
  skipperProfile SkipperProfile?
  memberships   Membership[]
  media         UserMedia[]
  sentMessages  Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
}
```

### Boat
```prisma
model Boat {
  id              String     @id @default(uuid())
  name            String
  type            BoatType   @default(OTHER)
  lengthMeters    Decimal
  beamMeters      Decimal?
  photo           String?
  homePort        String?
  seats           Int?       @default(4)
  year            Int?
  make            String?
  model           String?
  engineType      EngineType @default(OUTBOARD)
  enginePower     Int?
  registrationNumber String?
  isAvailableForRaces Boolean @default(true)

  userId          String
  userMedia       UserMedia[]
}
```

### Message
```prisma
model Message {
  id            String          @id @default(uuid())
  type          MessageType     @default(DIRECT)  // DIRECT, BROADCAST, SYSTEM
  priority      MessagePriority @default(NORMAL)  // LOW, NORMAL, HIGH, URGENT
  subject       String
  body          String          @db.Text
  senderId      String
  recipientId   String?         // null = broadcast
  tenantId      String
  isRead        Boolean         @default(false)
  readAt        DateTime?
  parentId      String?         // for replies (thread)
  isArchivedBySender    Boolean @default(false)
  isArchivedByRecipient Boolean @default(false)
  isDeleted             Boolean @default(false)

  readReceipts  MessageReadReceipt[]  // for broadcast
}
```

### UserMedia
```prisma
model UserMedia {
  id              String            @id @default(uuid())
  type            UserMediaType     // PHOTO, VIDEO
  category        UserMediaCategory // BOAT, EQUIPMENT, TOURNAMENT, etc.
  filename        String
  path            String
  mimeType        String
  fileSize        Int
  title           String?
  description     String?
  width           Int?
  height          Int?
  duration        Int?              // video duration
  thumbnailPath   String?
  isPublic        Boolean           @default(false)

  userId          String
  boatId          String?
  equipmentId     String?
  tournamentId    String?
}
```

---

## Enumerazioni

```typescript
// Ruoli utente permanenti
enum UserRole {
  SUPER_ADMIN     // Amministratore piattaforma
  TENANT_ADMIN    // Amministratore associazione
  PRESIDENT       // Presidente associazione
  ORGANIZER       // Organizzatore tornei
  JUDGE           // Giudice
  PARTICIPANT     // Partecipante
  MEMBER          // Alias PARTICIPANT
}

// Ruoli temporanei per torneo
enum TournamentStaffRole {
  DIRECTOR        // Direttore gara
  JUDGE           // Giudice gara
  INSPECTOR       // Ispettore
  SCORER          // Addetto punteggi
}

// Ruoli equipaggio
enum CrewRole {
  SKIPPER         // Conduttore
  TEAM_LEADER     // Capoequipaggio
  CREW            // Membro
  ANGLER          // Pescatore
  GUEST           // Ospite
}

// Tipi barca
enum BoatType {
  FISHING_BOAT, SAILING_YACHT, MOTOR_YACHT, RIB,
  CENTER_CONSOLE, CABIN_CRUISER, SPORT_FISHING, OTHER
}

// Tipi attrezzatura
enum EquipmentType {
  ROD, REEL, TACKLE_BOX, FISHING_LINE, LURE,
  HOOK, NET, GAFF, ELECTRONICS, SAFETY_GEAR, CLOTHING, OTHER
}

// Tipi messaggio
enum MessageType {
  DIRECT          // Messaggio diretto a un utente
  BROADCAST       // Messaggio a tutti gli iscritti
  SYSTEM          // Notifica di sistema
}

// Priorita messaggio
enum MessagePriority {
  LOW, NORMAL, HIGH, URGENT
}
```

---

## Auth Routes

**Base:** `/api/auth`

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| POST | `/register` | No | Registrazione nuovo utente |
| POST | `/login` | No | Login con email/password |
| POST | `/refresh` | No | Rinnovo access token |
| POST | `/logout` | No | Logout (revoca refresh token) |

---

## User Routes

**Base:** `/api/users`

| Metodo | Endpoint | Auth | Ruoli | Descrizione |
|--------|----------|------|-------|-------------|
| GET | `/me` | Si | * | Profilo utente corrente |
| PUT | `/me` | Si | * | Aggiorna profilo |
| GET | `/` | Si | ADMIN+ | Lista utenti tenant |
| GET | `/:id` | Si | ADMIN+ | Dettaglio utente |

---

## Boat Routes

**Base:** `/api/boats`

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| GET | `/` | Si | Lista barche utente (o `?userId=` per admin) |
| GET | `/:id` | Si | Dettaglio barca |
| POST | `/` | Si | Crea nuova barca |
| PUT | `/:id` | Si | Modifica barca |
| DELETE | `/:id` | Si | Elimina barca |

**Query Parameters:**
- `userId` - (Admin) Visualizza barche di altro utente

---

## Equipment Routes

**Base:** `/api/equipment`

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| GET | `/` | Si | Lista attrezzature (o `?userId=` per admin) |
| GET | `/:id` | Si | Dettaglio attrezzatura |
| POST | `/` | Si | Crea attrezzatura |
| PUT | `/:id` | Si | Modifica attrezzatura |
| DELETE | `/:id` | Si | Elimina attrezzatura |

---

## Skipper Routes

**Base:** `/api/skipper`

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| GET | `/me` | Si | Profilo skipper corrente |
| PUT | `/me` | Si | Aggiorna profilo skipper |
| GET | `/available` | Si | Lista skipper disponibili |
| GET | `/:id` | Si | Profilo skipper pubblico |

---

## Membership Routes

**Base:** `/api/memberships`

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| GET | `/` | Si | Tessere utente corrente |
| GET | `/:id` | Si | Dettaglio tessera |
| POST | `/` | Si | Crea tessera (admin) |
| PUT | `/:id` | Si | Modifica tessera |

---

## Message Routes

**Base:** `/api/messages`

| Metodo | Endpoint | Auth | Ruoli | Descrizione |
|--------|----------|------|-------|-------------|
| GET | `/inbox` | Si | * | Messaggi ricevuti |
| GET | `/sent` | Si | * | Messaggi inviati |
| GET | `/unread-count` | Si | * | Conteggio non letti |
| GET | `/tenant-admin` | Si | * | Admin del tenant (per utenti) |
| GET | `/recipients` | Si | ADMIN+ | Lista destinatari disponibili |
| GET | `/users-with-unread` | Si | ADMIN+ | Utenti con messaggi non letti |
| GET | `/:messageId` | Si | * | Dettaglio messaggio + thread |
| POST | `/send` | Si | * | Invia messaggio diretto |
| POST | `/broadcast` | Si | ADMIN+ | Invia broadcast a tutti |
| POST | `/:messageId/reply` | Si | * | Rispondi a messaggio |
| PUT | `/:messageId/read` | Si | * | Segna come letto |
| PUT | `/:messageId/archive` | Si | * | Archivia messaggio |
| DELETE | `/:messageId` | Si | * | Elimina messaggio (soft) |

---

## UserMedia Routes

**Base:** `/api/user-media`

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| GET | `/` | Si | Lista media utente (filtri: boatId, equipmentId, category) |
| GET | `/:id` | Si | Dettaglio media |
| POST | `/upload` | Si | Upload foto/video |
| PUT | `/:id` | Si | Modifica metadati |
| DELETE | `/:id` | Si | Elimina media |

**Query Parameters:**
- `boatId` - Filtra per barca
- `equipmentId` - Filtra per attrezzatura
- `category` - BOAT, EQUIPMENT, TOURNAMENT, etc.
- `limit` - Numero massimo risultati

---

## Media Library Routes

**Base:** `/api/media`

| Metodo | Endpoint | Auth | Ruoli | Descrizione |
|--------|----------|------|-------|-------------|
| GET | `/` | Si | * | Lista media library |
| GET | `/:id` | Si | * | Dettaglio media |
| POST | `/upload` | Si | ADMIN+ | Upload media |
| PUT | `/:id` | Si | ADMIN+ | Modifica media |
| DELETE | `/:id` | Si | ADMIN+ | Elimina media |

**Query Parameters:**
- `category` - tournament, boat, catch, etc.
- `tenantId` - (SuperAdmin) Filtra per tenant
- `type` - image, video

---

## Team Routes

**Base:** `/api/teams`

| Metodo | Endpoint | Auth | Ruoli | Descrizione |
|--------|----------|------|-------|-------------|
| GET | `/tournament/:tournamentId` | Si | * | Lista team torneo |
| GET | `/:id` | Si | * | Dettaglio team con membri |
| POST | `/` | Si | * | Crea team |
| PUT | `/:id` | Si | Captain/Admin | Modifica team |
| DELETE | `/:id` | Si | Captain/Admin | Elimina team |
| POST | `/:id/members` | Si | Captain | Aggiungi membro |
| PUT | `/:id/members/:memberId` | Si | Captain | Modifica membro |
| DELETE | `/:id/members/:memberId` | Si | Captain | Rimuovi membro |

**Team Fields:**
- `name` - Nome squadra
- `boatName` - Nome barca
- `boatNumber` - Numero assegnato
- `clubName`, `clubCode` - Societa di appartenenza
- `representingClubName`, `representingClubCode` - Societa rappresentata (tornei provinciali)
- `inspectorId`, `inspectorName`, `inspectorClub` - Ispettore di bordo

---

## CMS Routes

**Base:** `/api/cms`

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| GET | `/features` | No | Lista features homepage |
| GET | `/pricing` | No | Piani tariffari |
| GET | `/faq` | No | FAQ |
| GET | `/disciplines` | No | Info discipline |
| PUT | `/features/:id` | ADMIN | Modifica feature |
| PUT | `/pricing/:id` | ADMIN | Modifica piano |

---

## Architettura Frontend

### Pagine Dashboard

| Route | Ruoli | Descrizione |
|-------|-------|-------------|
| `/dashboard` | MEMBER+ | Dashboard utente con tabs |
| `/dashboard/admin` | ADMIN+ | Dashboard amministratore |
| `/dashboard/super-admin` | SUPER_ADMIN | Dashboard SuperAdmin |
| `/dashboard/messages` | * | Messaggistica |
| `/dashboard/teams` | * | Gestione team |
| `/dashboard/tournaments` | * | Lista tornei |
| `/dashboard/tournaments/[id]` | * | Dettaglio torneo |
| `/dashboard/users` | ADMIN+ | Lista iscritti |
| `/dashboard/users/[userId]` | ADMIN+ | Dettaglio iscritto (view mode) |
| `/dashboard/strikes` | * | Segnalazione strike |
| `/dashboard/reports` | ADMIN+ | Report e PDF |
| `/dashboard/settings` | * | Impostazioni |

### Componenti User

| Componente | Descrizione |
|------------|-------------|
| `BoatsSection` | Gestione barche personali con galleria media |
| `EquipmentSection` | Gestione attrezzature con galleria media |
| `MediaSection` | Galleria foto/video personali |
| `MessagesSection` | Inbox/Sent messages, nuovo messaggio |
| `SkipperSection` | Profilo skipper e patenti |
| `SettingsSection` | Impostazioni profilo |

### Admin View Mode

Gli admin possono visualizzare i profili degli iscritti in modalita read-only:

```typescript
// Route: /dashboard/users/[userId]
// Props passate ai componenti:
<BoatsSection viewUserId={userId} readOnly={true} />
<EquipmentSection viewUserId={userId} readOnly={true} />
<MediaSection viewUserId={userId} readOnly={true} />
```

---

## Configurazione Ambiente

### Backend (.env)
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/tournamentmaster"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=104857600
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Avvio Sviluppo

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
# Server: http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:3000
```

---

## Credenziali Test

| Ruolo | Email | Password |
|-------|-------|----------|
| Super Admin | admin@tournamentmaster.it | Admin123! |
| Tenant Admin | presidente@ischiafishing.it | Test123! |
| Member | socio@ischiafishing.it | Test123! |

---

## API Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operation completed",
  "pagination": {  // if applicable
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// Error
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]  // validation errors if applicable
}
```

---

## Prossime Implementazioni

### Priorita Alta
- [ ] Sistema notifiche push (Firebase)
- [ ] Integrazione pagamenti (Stripe)
- [ ] Sistema documenti con scadenze
- [ ] Export dati (Excel, PDF)

### Priorita Media
- [ ] Chat real-time (WebSocket)
- [ ] Statistiche avanzate
- [ ] Sistema badge/achievements
- [ ] Integrazione meteo

### Priorita Bassa
- [ ] App nativa iOS/Android
- [ ] Integrazione social media
- [ ] Sistema sponsor

---

*Ultimo aggiornamento: 2026-01-09*
