# TOURNAMENTMASTER - DOCUMENTO PROGETTO UNIFICATO

**Versione Documento:** 2.0.0
**Data:** 2026-01-02
**Origine:** Unificazione di 3 documenti sorgente
**Autore:** Team TournamentMaster

---

## CRONOLOGIA DOCUMENTI SORGENTE

| # | Documento | Versione | Data | Focus Principale |
|---|-----------|----------|------|------------------|
| 1 | TOURNAMENTMASTER_Technical_Implementation_Spec.md | 1.0 | 29 Dicembre 2025 | Specifiche tecniche, business model, 17 discipline |
| 2 | DOCUMENTAZIONE_TOURNAMENTMASTER_APP_COMPLETA.md | 1.2.0 | 2 Gennaio 2026 | Mobile App (APK/iOS Expo) |
| 3 | DOCUMENTAZIONE_COMPLETA_TOURNAMENTMASTER.md | 1.4.0 | 2 Gennaio 2026 | Backend + Frontend completo |

---

## INDICE

1. [Overview del Progetto](#1-overview-del-progetto)
2. [Stack Tecnologico Completo](#2-stack-tecnologico-completo)
3. [Architettura del Sistema](#3-architettura-del-sistema)
4. [Database Schema](#4-database-schema)
5. [Backend - API Endpoints](#5-backend---api-endpoints)
6. [Frontend Web](#6-frontend-web)
7. [Mobile App](#7-mobile-app)
8. [Sistema Autenticazione](#8-sistema-autenticazione)
9. [17 Discipline di Pesca](#9-17-discipline-di-pesca)
10. [Sistema Tornei](#10-sistema-tornei)
11. [Gestione Catture](#11-gestione-catture)
12. [Classifiche Real-Time](#12-classifiche-real-time)
13. [Teams e Equipaggi](#13-teams-e-equipaggi)
14. [Documenti e Verifica](#14-documenti-e-verifica)
15. [Sistema Pagamenti](#15-sistema-pagamenti)
16. [Notifiche](#16-notifiche)
17. [Analytics e Reporting](#17-analytics-e-reporting)
18. [Sponsor Management](#18-sponsor-management)
19. [Internazionalizzazione](#19-internazionalizzazione)
20. [PWA e Offline Mode](#20-pwa-e-offline-mode)
21. [Business Model](#21-business-model)
22. [Sicurezza](#22-sicurezza)
23. [Gamification](#23-gamification)
24. [Feature Roadmap](#24-feature-roadmap)
25. [Funzioni Dettagliate Backend e Frontend](#25-funzioni-dettagliate-backend-e-frontend)

---

## 1. OVERVIEW DEL PROGETTO

### Descrizione
TournamentMaster è una piattaforma SaaS multi-tenant per la gestione completa di tornei di pesca sportiva. Supporta 17 discipline di pesca (9 mare, 8 acqua dolce, 1 speciale), gestione catture con validazione GPS, classifiche in tempo reale, e sistema di pagamenti integrato.

### Target Users
- **Organizzatori di Tornei:** Federazioni, associazioni, club di pesca
- **Partecipanti:** Pescatori sportivi individuali e team
- **Giudici:** Validatori di catture
- **Sponsor:** Aziende del settore pesca

### Obiettivi Chiave
1. Digitalizzazione completa gestione tornei
2. Validazione catture con GPS e foto
3. Classifiche real-time accessibili da mobile
4. Multi-tenancy per diverse organizzazioni
5. Supporto 24 lingue europee

---

## 2. STACK TECNOLOGICO COMPLETO

### Backend

| Componente | Tecnologia | Versione |
|------------|------------|----------|
| Runtime | Node.js | 20.x LTS |
| Framework | Express.js | 4.x |
| Linguaggio | TypeScript | 5.x |
| ORM | Prisma | 5.x |
| Database Principale | MySQL/MariaDB | 8.x / 10.x |
| Database Alternativo | PostgreSQL (con RLS) | 15.x |
| Cache | Redis | 7.x |
| Media Storage | Cloudinary CDN | - |
| Real-time | Socket.io | 4.x |
| Task Queue | Bull | 4.x |
| Logging | Winston/Pino | - |

### Frontend Web

| Componente | Tecnologia | Versione |
|------------|------------|----------|
| Framework | Next.js | 14.x (App Router) |
| Linguaggio | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui | Latest |
| State Management | React Context | 18.x |
| Forms | React Hook Form | - |
| Icons | Lucide React | - |
| i18n | next-intl | 3.x |
| Maps | Leaflet / react-leaflet | - |
| Charts | Recharts | - |

### Mobile

| Componente | Tecnologia | Versione |
|------------|------------|----------|
| Wrapper Android | Capacitor | 6.x |
| iOS Development | Expo Go | SDK 51 |
| WebView | Capacitor WebView | - |
| Geolocation | @capacitor/geolocation | - |
| Camera | @capacitor/camera | - |
| Storage | @capacitor/preferences | - |

### DevOps

| Componente | Tecnologia |
|------------|------------|
| Containerization | Docker |
| CI/CD | GitHub Actions |
| Hosting | Vercel (Frontend), Railway/Render (Backend) |
| Monitoring | Sentry |
| APM | PM2 |

---

## 3. ARCHITETTURA DEL SISTEMA

### Multi-Tenant Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 API GATEWAY                                 │
│  - Rate Limiting    - Request Validation                    │
│  - Tenant Resolution - JWT Verification                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              APPLICATION LAYER (Express.js)                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Auth      │ │ Tournament  │ │   Catch     │           │
│  │  Service    │ │  Service    │ │  Service    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  Payment    │ │ Leaderboard │ │  Document   │           │
│  │  Service    │ │  Service    │ │  Service    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   DATA LAYER                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   MySQL/    │ │    Redis    │ │  Cloudinary │           │
│  │  PostgreSQL │ │   (Cache)   │ │    (CDN)    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Row-Level Security (PostgreSQL)

```sql
-- Esempio RLS Policy per multi-tenancy
CREATE POLICY tenant_isolation ON tournaments
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

---

## 4. DATABASE SCHEMA

### Modelli Prisma (12 Tabelle Core)

```prisma
// Tenant (Multi-tenancy)
model Tenant {
  id            String   @id @default(uuid())
  name          String
  slug          String   @unique
  domain        String?  @unique
  settings      Json?
  subscriptionPlan String @default("starter")
  subscriptionStatus String @default("active")
  createdAt     DateTime @default(now())

  users         User[]
  tournaments   Tournament[]
}

// User
model User {
  id            String   @id @default(uuid())
  tenantId      String
  email         String
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  role          Role     @default(PARTICIPANT)
  avatar        String?
  isActive      Boolean  @default(true)
  emailVerified Boolean  @default(false)

  tenant        Tenant   @relation(...)
  documents     Document[]
  catches       Catch[]
  teamMembers   TeamMember[]
  registrations TournamentRegistration[]

  @@unique([tenantId, email])
}

enum Role {
  SUPER_ADMIN
  TENANT_ADMIN
  ORGANIZER
  JUDGE
  PARTICIPANT
}

// Tournament
model Tournament {
  id                String   @id @default(uuid())
  tenantId          String
  name              String
  description       String?  @db.Text
  rules             String?  @db.Text
  discipline        FishingDiscipline
  status            TournamentStatus @default(DRAFT)

  // Dates
  startDate         DateTime
  endDate           DateTime
  registrationStart DateTime
  registrationEnd   DateTime

  // Settings
  maxParticipants   Int?
  registrationFee   Decimal? @db.Decimal(10,2)
  prizePool         Decimal? @db.Decimal(10,2)

  // Location
  location          String?
  coordinates       Json?    // { lat, lng }
  fishingZoneId     String?

  // Media
  coverImage        String?

  tenant            Tenant   @relation(...)
  fishingZone       FishingZone? @relation(...)
  species           TournamentSpecies[]
  registrations     TournamentRegistration[]
  catches           Catch[]
  leaderboard       LeaderboardEntry[]
}

enum TournamentStatus {
  DRAFT
  PUBLISHED
  REGISTRATION_OPEN
  ONGOING
  COMPLETED
  CANCELLED
}

enum FishingDiscipline {
  // Mare (9)
  BOLENTINO_COSTIERO
  BOLENTINO_ALTURA
  PESCA_A_FONDO
  TRAINA_COSTIERA
  TRAINA_ALTURA
  DRIFTING
  SURFCASTING
  SPINNING_MARE
  PESCA_DALLA_BARCA

  // Acqua Dolce (8)
  SPINNING_ACQUA_DOLCE
  LEDGERING
  FEEDER
  CARPFISHING
  PESCA_AL_COLPO
  PESCA_ALLA_MOSCA
  PESCA_ALLA_TROTA
  PESCA_IN_TORRENTE

  // Speciale (1)
  STRIKE
}

// Fishing Zone
model FishingZone {
  id            String   @id @default(uuid())
  name          String
  description   String?
  polygon       Json     // GeoJSON polygon
  centerPoint   Json     // { lat, lng }
  radiusKm      Float?

  tournaments   Tournament[]
}

// Species
model Species {
  id            String   @id @default(uuid())
  name          String
  scientificName String?
  category      String   // mare, acqua_dolce
  minSize       Float?   // cm
  maxSize       Float?   // cm
  pointsMultiplier Float @default(1.0)
  image         String?

  tournamentSpecies TournamentSpecies[]
  catches       Catch[]
}

// Tournament-Species (Many-to-Many con regole)
model TournamentSpecies {
  id            String   @id @default(uuid())
  tournamentId  String
  speciesId     String
  minSize       Float?
  pointsPerKg   Float    @default(1.0)
  bonusPoints   Float?

  tournament    Tournament @relation(...)
  species       Species    @relation(...)

  @@unique([tournamentId, speciesId])
}

// Tournament Registration
model TournamentRegistration {
  id            String   @id @default(uuid())
  tournamentId  String
  userId        String
  teamId        String?
  status        RegistrationStatus @default(PENDING)
  role          String   @default("fisherman") // skipper, fisherman
  boatName      String?
  boatRegistration String?
  paymentStatus String   @default("pending")
  registeredAt  DateTime @default(now())

  tournament    Tournament @relation(...)
  user          User       @relation(...)
  team          Team?      @relation(...)
}

enum RegistrationStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

// Catch
model Catch {
  id            String   @id @default(uuid())
  tournamentId  String
  userId        String
  speciesId     String?

  // Measurements
  weight        Float
  length        Float?

  // Location
  latitude      Float
  longitude     Float
  locationAccuracy Float?
  inZone        Boolean  @default(true)

  // Media
  photos        Json     // Array of URLs
  video         String?

  // Validation
  status        CatchStatus @default(PENDING)
  validatedBy   String?
  validatedAt   DateTime?
  rejectionReason String?
  points        Float?

  // Metadata
  catchMethod   String?
  caughtAt      DateTime
  notes         String?

  tournament    Tournament @relation(...)
  user          User       @relation(...)
  species       Species?   @relation(...)
}

enum CatchStatus {
  PENDING
  APPROVED
  REJECTED
  CONTESTED
}

// Leaderboard Entry
model LeaderboardEntry {
  id            String   @id @default(uuid())
  tournamentId  String
  userId        String
  teamId        String?

  totalPoints   Float    @default(0)
  totalCatches  Int      @default(0)
  totalWeight   Float    @default(0)
  rank          Int?

  lastUpdated   DateTime @default(now())

  tournament    Tournament @relation(...)

  @@unique([tournamentId, userId])
}

// Team
model Team {
  id            String   @id @default(uuid())
  name          String
  description   String?
  logo          String?
  boatName      String?
  boatRegistration String?
  profilePageActive Boolean @default(false)
  profilePageSlug String?  @unique

  createdAt     DateTime @default(now())

  members       TeamMember[]
  registrations TournamentRegistration[]
  sponsors      TeamSponsor[]
}

model TeamMember {
  id            String   @id @default(uuid())
  teamId        String
  userId        String
  role          String   @default("member") // captain, skipper, member
  joinedAt      DateTime @default(now())

  team          Team     @relation(...)
  user          User     @relation(...)

  @@unique([teamId, userId])
}

// Document
model Document {
  id            String   @id @default(uuid())
  userId        String
  type          DocumentType
  fileUrl       String
  status        DocumentStatus @default(PENDING)
  expiresAt     DateTime?
  verifiedBy    String?
  verifiedAt    DateTime?
  rejectionReason String?

  user          User     @relation(...)
}

enum DocumentType {
  FISHING_LICENSE
  BOAT_LICENSE
  INSURANCE
  MEDICAL_CERTIFICATE
  ID_DOCUMENT
}

enum DocumentStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

// Sponsor
model Sponsor {
  id            String   @id @default(uuid())
  companyName   String
  logo          String
  websiteUrl    String?
  description   String?
  packageType   String
  packagePrice  Decimal  @db.Decimal(10,2)
  activeFrom    DateTime
  activeUntil   DateTime
  placements    Json     // { banner: true, leaderboard: true, ... }
  impressions   Int      @default(0)
  clicks        Int      @default(0)

  tournaments   TournamentSponsor[]
  teams         TeamSponsor[]
}

// Refresh Token
model RefreshToken {
  id            String   @id @default(uuid())
  userId        String
  token         String   @unique
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  revokedAt     DateTime?
}

// Audit Log
model AuditLog {
  id            String   @id @default(uuid())
  tenantId      String
  userId        String?
  action        String
  entityType    String
  entityId      String?
  oldValues     Json?
  newValues     Json?
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime @default(now())
}

// Transaction
model Transaction {
  id            String   @id @default(uuid())
  tenantId      String
  userId        String
  type          String   // registration, team_profile, sponsor, report
  amount        Decimal  @db.Decimal(10,2)
  currency      String   @default("EUR")
  status        String   // pending, completed, failed, refunded
  stripePaymentId String?
  metadata      Json?
  createdAt     DateTime @default(now())
}

// Notification
model Notification {
  id            String   @id @default(uuid())
  userId        String
  type          String
  title         String
  message       String
  data          Json?
  read          Boolean  @default(false)
  createdAt     DateTime @default(now())
}
```

---

## 5. BACKEND - API ENDPOINTS

### 5.1 Authentication

```
POST   /api/v1/auth/register       - Registrazione utente
POST   /api/v1/auth/login          - Login (email/password)
POST   /api/v1/auth/logout         - Logout (revoke token)
POST   /api/v1/auth/refresh        - Refresh access token
POST   /api/v1/auth/forgot-password - Richiesta reset password
POST   /api/v1/auth/reset-password  - Reset password con token
GET    /api/v1/auth/me             - Profilo utente corrente
PATCH  /api/v1/auth/me             - Aggiorna profilo
POST   /api/v1/auth/change-password - Cambio password
POST   /api/v1/auth/verify-email   - Verifica email
```

### 5.2 Tournaments

```
GET    /api/v1/tournaments         - Lista tornei (filtri: status, discipline, date)
GET    /api/v1/tournaments/:id     - Dettaglio torneo
POST   /api/v1/tournaments         - Crea torneo (Admin)
PATCH  /api/v1/tournaments/:id     - Modifica torneo (Admin)
DELETE /api/v1/tournaments/:id     - Elimina torneo (Admin)
PATCH  /api/v1/tournaments/:id/status - Cambia stato (Admin)
GET    /api/v1/tournaments/:id/leaderboard - Classifica
GET    /api/v1/tournaments/:id/catches - Lista catture
GET    /api/v1/tournaments/:id/registrations - Lista iscritti
POST   /api/v1/tournaments/:id/register - Iscrizione
```

### 5.3 Catches

```
POST   /api/v1/catches             - Registra cattura (FormData)
GET    /api/v1/catches/:id         - Dettaglio cattura
PATCH  /api/v1/catches/:id         - Modifica cattura (prima validazione)
DELETE /api/v1/catches/:id         - Elimina cattura (prima validazione)
POST   /api/v1/catches/:id/approve - Approva cattura (Judge/Admin)
POST   /api/v1/catches/:id/reject  - Rifiuta cattura (Judge/Admin)
POST   /api/v1/catches/:id/request-review - Contesta rifiuto
```

### 5.4 Registrations

```
POST   /api/v1/registrations       - Iscrizione a torneo
GET    /api/v1/registrations/:id   - Dettaglio iscrizione
PATCH  /api/v1/registrations/:id/approve - Approva (Admin)
PATCH  /api/v1/registrations/:id/reject  - Rifiuta (Admin)
DELETE /api/v1/registrations/:id   - Cancella iscrizione
POST   /api/v1/registrations/:id/payment-confirm - Conferma pagamento
```

### 5.5 Teams

```
GET    /api/v1/teams               - Lista team
GET    /api/v1/teams/:id           - Dettaglio team
POST   /api/v1/teams               - Crea team
PATCH  /api/v1/teams/:id           - Modifica team (Captain)
DELETE /api/v1/teams/:id           - Elimina team (Captain)
POST   /api/v1/teams/:id/members   - Aggiungi membro (Captain)
DELETE /api/v1/teams/:id/members/:userId - Rimuovi membro (Captain)
GET    /api/v1/teams/:id/profile-page - Pagina profilo pubblico
POST   /api/v1/teams/:id/profile-page/activate - Attiva pagina (a pagamento)
```

### 5.6 Documents

```
POST   /api/v1/documents           - Upload documento
GET    /api/v1/documents           - I miei documenti
GET    /api/v1/documents/pending   - Documenti da validare (Admin)
PATCH  /api/v1/documents/:id/approve - Approva documento (Admin)
PATCH  /api/v1/documents/:id/reject  - Rifiuta documento (Admin)
```

### 5.7 Sponsors

```
GET    /api/v1/sponsors            - Lista sponsor
POST   /api/v1/sponsors            - Crea sponsor (Admin)
PATCH  /api/v1/sponsors/:id        - Modifica sponsor (Admin)
DELETE /api/v1/sponsors/:id        - Elimina sponsor (Admin)
POST   /api/v1/sponsors/:id/track-impression - Traccia visualizzazione
POST   /api/v1/sponsors/:id/track-click      - Traccia click
```

### 5.8 Payments

```
POST   /api/v1/payments/create-intent - Crea PaymentIntent Stripe
POST   /api/v1/payments/webhook       - Webhook Stripe
GET    /api/v1/payments/history       - Storico pagamenti
GET    /api/v1/payments/balance       - Saldo (Admin)
```

### 5.9 Analytics

```
GET    /api/v1/analytics/dashboard    - Dashboard stats (Admin)
GET    /api/v1/analytics/revenue      - Revenue breakdown
GET    /api/v1/analytics/tournaments/:id - Stats torneo
```

### 5.10 Notifications

```
GET    /api/v1/notifications       - Lista notifiche
PATCH  /api/v1/notifications/:id/read - Segna come letta
POST   /api/v1/notifications/read-all - Segna tutte come lette
```

### 5.11 WebSocket Events (Socket.io)

```javascript
// Client → Server
socket.emit('join_tournament', { tournamentId })
socket.emit('leave_tournament', { tournamentId })
socket.emit('catch_submitted', { catchId })

// Server → Client
socket.on('catch_approved', { catch, leaderboard })
socket.on('catch_rejected', { catch, reason })
socket.on('leaderboard_updated', { leaderboard })
socket.on('tournament_started', { tournament })
socket.on('tournament_ended', { tournament, finalLeaderboard })
socket.on('new_catch', { catch }) // For admins/judges
```

---

## 6. FRONTEND WEB

### Struttura Directory

```
frontend/
├── src/
│   ├── app/
│   │   ├── [locale]/           # Routing i18n
│   │   │   ├── layout.tsx      # Layout principale
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── tournaments/
│   │   │   │   ├── page.tsx    # Lista tornei
│   │   │   │   └── [id]/
│   │   │   ├── catch/new/      # Wizard registrazione cattura
│   │   │   ├── leaderboard/
│   │   │   ├── features/
│   │   │   ├── pricing/
│   │   │   ├── privacy/
│   │   │   ├── terms/
│   │   │   ├── cookies/
│   │   │   ├── guida-installazione/
│   │   │   ├── organizer/register/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx    # Dashboard partecipante
│   │   │       ├── judge/
│   │   │       └── admin/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── native/             # Componenti Capacitor
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── HelpGuide.tsx
│   │   └── LanguageSelector.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── i18n/
│   │   ├── config.ts           # 24 lingue EU
│   │   └── request.ts
│   ├── lib/
│   │   └── utils.ts
│   └── messages/               # Traduzioni
│       ├── it.json
│       ├── en.json
│       └── [altre 22 lingue].json
├── capacitor.config.ts
└── next.config.mjs
```

### Pagine Implementate

| Pagina | Path | Stato |
|--------|------|-------|
| Homepage | `/[locale]` | ✅ Completa |
| Login | `/[locale]/login` | ✅ Completa |
| Register | `/[locale]/register` | ✅ Completa |
| Lista Tornei | `/[locale]/tournaments` | ✅ Completa |
| Dettaglio Torneo | `/[locale]/tournaments/[id]` | ✅ Completa |
| Dashboard Partecipante | `/[locale]/dashboard` | ✅ Completa |
| Dashboard Giudice | `/[locale]/dashboard/judge` | ✅ Completa |
| Dashboard Admin | `/[locale]/dashboard/admin` | ✅ Completa |
| Registra Cattura | `/[locale]/catch/new` | ✅ Completa |
| Leaderboard | `/[locale]/leaderboard` | ✅ Completa |
| Features | `/[locale]/features` | ✅ Completa |
| Pricing | `/[locale]/pricing` | ✅ Completa |
| Privacy | `/[locale]/privacy` | ✅ Completa |
| Terms | `/[locale]/terms` | ✅ Completa |
| Cookies | `/[locale]/cookies` | ✅ Completa |
| Guida Installazione | `/[locale]/guida-installazione` | ✅ Completa |
| Registrazione Organizzatore | `/[locale]/organizer/register` | ✅ Completa |

### Componenti shadcn/ui Utilizzati

- Button, Card, Dialog, Input, Select, Tabs
- Badge, Table, Skeleton, Toast
- DropdownMenu, Avatar, Checkbox, Alert

---

## 7. MOBILE APP

### Android APK (Capacitor)

| Proprietà | Valore |
|-----------|--------|
| Package | `com.tournamentmaster.app` |
| Dimensione | 7.82 MB |
| Target API | Android 13+ (API 33) |
| Min SDK | Android 7.0 (API 24) |
| Tecnologia | Capacitor 6 WebView |
| Build | Android Studio + Gradle |

**Installazione:**
1. Scaricare APK
2. Abilitare "Origini sconosciute"
3. Installare
4. Richiede connessione internet (carica URL remoto)

### iOS (Expo Go)

| Proprietà | Valore |
|-----------|--------|
| SDK | Expo SDK 51 |
| Target | iOS 13+ |
| Installazione | App Store (Expo Go) |

**Flusso:**
1. Installare Expo Go da App Store
2. Scansionare QR code o aprire link
3. L'app carica in Expo Go

### Capacitor Plugins Utilizzati

```json
{
  "@capacitor/core": "^6.0.0",
  "@capacitor/android": "^6.0.0",
  "@capacitor/ios": "^6.0.0",
  "@capacitor/geolocation": "^6.0.0",
  "@capacitor/camera": "^6.0.0",
  "@capacitor/preferences": "^6.0.0",
  "@capacitor/network": "^6.0.0",
  "@capacitor/splash-screen": "^6.0.0"
}
```

---

## 8. SISTEMA AUTENTICAZIONE

### JWT Token Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │ ──1──►  │   Server    │ ──2──►  │  Database   │
│             │ login   │             │ verify  │             │
│             │ ◄──3──  │             │ ◄──4──  │             │
│             │ tokens  │             │ user    │             │
└─────────────┘         └─────────────┘         └─────────────┘

1. POST /auth/login { email, password }
2. Verifica credenziali
3. Ritorna { accessToken (15min), refreshToken (7d) }
4. Dati utente per token
```

### Token Configuration

```javascript
JWT_SECRET=<random-256-bit>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Ruoli Utente

| Ruolo | Permessi |
|-------|----------|
| SUPER_ADMIN | Tutto, gestione tenant |
| TENANT_ADMIN | Tutto nel proprio tenant |
| ORGANIZER | Crea/gestisce tornei propri |
| JUDGE | Valida catture |
| PARTICIPANT | Partecipa, registra catture |

### Role-Based Redirect

```javascript
// Dopo login
SUPER_ADMIN, TENANT_ADMIN → /dashboard/admin
JUDGE → /dashboard/judge
PARTICIPANT, ORGANIZER → /dashboard
```

---

## 9. 17 DISCIPLINE DI PESCA

### Mare (9 Discipline)

| ID | Nome | Descrizione |
|----|------|-------------|
| 1 | Bolentino Costiero | Pesca con canna da fermo, entro 3 miglia |
| 2 | Bolentino d'Altura | Pesca con canna da fermo, oltre 3 miglia |
| 3 | Pesca a Fondo | Pesca con piombo, esca sul fondo |
| 4 | Traina Costiera | Pesca trainando esche, entro 6 miglia |
| 5 | Traina d'Altura | Pesca trainando esche, oltre 6 miglia |
| 6 | Drifting | Pesca alla deriva per grandi pelagici |
| 7 | Surfcasting | Pesca dalla spiaggia con lancio lungo |
| 8 | Spinning Mare | Pesca con esche artificiali in mare |
| 9 | Pesca dalla Barca | Pesca generica da imbarcazione |

### Acqua Dolce (8 Discipline)

| ID | Nome | Descrizione |
|----|------|-------------|
| 10 | Spinning Acqua Dolce | Esche artificiali in laghi/fiumi |
| 11 | Ledgering | Pesca a fondo con piombo scorrevole |
| 12 | Feeder | Pesca con pasturatore |
| 13 | Carpfishing | Pesca specializzata alla carpa |
| 14 | Pesca al Colpo | Pesca con canna fissa o bolognese |
| 15 | Pesca alla Mosca | Pesca con mosche artificiali |
| 16 | Pesca alla Trota | Pesca specifica per trote |
| 17 | Pesca in Torrente | Pesca in acque veloci |

### Speciale (1 Disciplina)

| ID | Nome | Descrizione |
|----|------|-------------|
| 18 | Strike | Cattura singola più grande, competizione speed |

---

## 10. SISTEMA TORNEI

### Lifecycle Torneo

```
DRAFT → PUBLISHED → REGISTRATION_OPEN → ONGOING → COMPLETED
                                      ↘ CANCELLED
```

### Configurazione Torneo

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| name | String | Nome torneo |
| description | Text | Descrizione estesa |
| rules | Text | Regolamento |
| discipline | Enum | Una delle 17 discipline |
| startDate | DateTime | Inizio competizione |
| endDate | DateTime | Fine competizione |
| registrationStart | DateTime | Apertura iscrizioni |
| registrationEnd | DateTime | Chiusura iscrizioni |
| maxParticipants | Int | Limite partecipanti |
| registrationFee | Decimal | Quota iscrizione (€) |
| prizePool | Decimal | Montepremi (€) |
| location | String | Luogo |
| fishingZoneId | UUID | Zona pesca (validazione GPS) |
| coverImage | URL | Immagine copertina |

### Azioni per Stato

| Stato | Azioni Disponibili |
|-------|-------------------|
| DRAFT | Pubblica, Modifica, Elimina |
| PUBLISHED | Apri Iscrizioni, Modifica |
| REGISTRATION_OPEN | Chiudi Iscrizioni, Avvia |
| ONGOING | Termina, Annulla |
| COMPLETED | Visualizza Report |

---

## 11. GESTIONE CATTURE

### Wizard Registrazione Cattura

**Step 1: Scatta Foto**
- Fotocamera nativa (Capacitor Camera)
- Massimo 5 foto
- Compressione automatica

**Step 2: Inserisci Dati**
- Peso (kg, 2 decimali)
- Lunghezza (cm, opzionale)
- Specie (dropdown)
- Metodo cattura
- Note

**Step 3: Validazione GPS**
- Coordinate automatiche (Geolocation API)
- Verifica in zona (Turf.js)
- Precisione in metri
- Warning se fuori zona

**Step 4: Conferma e Invio**
- Riepilogo dati
- Upload foto a Cloudinary
- Invio a backend

### Validazione Cattura (Giudice)

1. Visualizza foto con zoom
2. Verifica peso dichiarato
3. Controlla coordinate GPS
4. Verifica in zona (badge visivo)
5. Approva → assegna punti
6. Rifiuta → inserisce motivazione

### GPS Validation con Turf.js

```javascript
import * as turf from '@turf/turf';

function validateCatchLocation(catchPoint, fishingZone) {
  const point = turf.point([catchPoint.lng, catchPoint.lat]);
  const polygon = turf.polygon(fishingZone.coordinates);
  const isInside = turf.booleanPointInPolygon(point, polygon);

  const center = turf.center(polygon);
  const distance = turf.distance(point, center, { units: 'kilometers' });

  return { isInside, distanceFromCenter: distance };
}
```

---

## 12. CLASSIFICHE REAL-TIME

### Aggiornamento Classifica

```javascript
// Trigger su approvazione cattura
async function updateLeaderboard(catchId) {
  const catch = await prisma.catch.findUnique({ where: { id: catchId } });

  // Calcola punti
  const points = calculatePoints(catch);

  // Upsert leaderboard entry
  await prisma.leaderboardEntry.upsert({
    where: { tournamentId_userId: { tournamentId, userId } },
    update: {
      totalPoints: { increment: points },
      totalCatches: { increment: 1 },
      totalWeight: { increment: catch.weight }
    },
    create: { ... }
  });

  // Ricalcola rank
  await recalculateRanks(tournamentId);

  // Notifica WebSocket
  io.to(`tournament:${tournamentId}`).emit('leaderboard_updated', leaderboard);
}
```

### Visualizzazione

- Classifica live con posizione
- Punti totali, catture, peso
- Foto ultima cattura
- Badge medaglia (1°, 2°, 3°)
- Refresh automatico via WebSocket

---

## 13. TEAMS E EQUIPAGGI

### Struttura Team

```
Team
├── Captain (1)
├── Skipper (0-1)
└── Members (N)
```

### Pagina Profilo Team (a pagamento)

| Tipo | Durata | Prezzo |
|------|--------|--------|
| Singola | 1 evento | €29 |
| Stagionale | 1 anno | €99 |
| Permanente | Illimitata | €249 |

**Contenuti pagina:**
- Logo e info team
- Statistiche storiche
- Tornei partecipati
- Galleria foto
- Sponsor team
- Link social

---

## 14. DOCUMENTI E VERIFICA

### Tipi Documento

| Tipo | Descrizione | Scadenza |
|------|-------------|----------|
| FISHING_LICENSE | Licenza di pesca | Annuale |
| BOAT_LICENSE | Patente nautica | Variabile |
| INSURANCE | Assicurazione | Annuale |
| MEDICAL_CERTIFICATE | Certificato medico | Annuale |
| ID_DOCUMENT | Documento identità | Variabile |

### Workflow Verifica

```
UPLOAD → PENDING → APPROVED/REJECTED
                      ↓
                   EXPIRED (automatico)
```

---

## 15. SISTEMA PAGAMENTI

### Stripe Integration

```javascript
// Configurazione
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Tipi Pagamento

| Tipo | Descrizione | Destinatario |
|------|-------------|--------------|
| registration | Quota iscrizione torneo | Organizzatore (Stripe Connect) |
| team_profile | Pagina profilo team | Piattaforma |
| sponsor | Pacchetto sponsorizzazione | Piattaforma |
| report | Report statistico | Piattaforma |
| certificate | Certificato partecipazione | Piattaforma |

### Stripe Connect Flow

```
Partecipante → Stripe → Piattaforma (10% fee) → Organizzatore (90%)
```

---

## 16. NOTIFICHE

### Canali

| Canale | Tecnologia | Use Case |
|--------|------------|----------|
| In-App | WebSocket/SSE | Tempo reale |
| Push | Firebase Cloud Messaging | Mobile |
| Email | SendGrid | Transazionali |
| SMS | Twilio (opzionale) | Critiche |

### Tipi Notifica

- Cattura approvata/rifiutata
- Iscrizione confermata
- Torneo iniziato/terminato
- Classifica aggiornata
- Documento scaduto
- Pagamento ricevuto

---

## 17. ANALYTICS E REPORTING

### Dashboard Admin

**4 Card Principali:**
- Tornei totali
- Partecipanti totali
- Catture da validare
- Tornei attivi

### Metriche Disponibili

| Metrica | Descrizione |
|---------|-------------|
| totalTournaments | Numero tornei |
| totalRegistrations | Iscrizioni totali |
| totalRevenue | Ricavi totali (€) |
| avgFishermenPerTournament | Media partecipanti |
| catchStats | Catture per stato |
| topSpecies | Specie più catturate |
| revenueBreakdown | Ricavi per fonte |

### Export Funzionalità

- CSV classifica
- PDF certificati
- PDF report torneo
- Excel statistiche

---

## 18. SPONSOR MANAGEMENT

### Pacchetti Sponsorizzazione

| Pacchetto | Placements | Prezzo Indicativo |
|-----------|------------|-------------------|
| Bronze | Banner footer | €500/evento |
| Silver | + Sidebar | €1.000/evento |
| Gold | + Classifica | €2.500/evento |
| Platinum | + Personalizzazioni | €5.000/evento |

### Tracking

- Impressioni banner
- Click su logo/link
- CTR per sponsor
- Report per sponsor

---

## 19. INTERNAZIONALIZZAZIONE

### 24 Lingue EU Supportate

```
🇮🇹 Italiano | 🇬🇧 English | 🇩🇪 Deutsch | 🇫🇷 Français
🇪🇸 Español | 🇵🇹 Português | 🇳🇱 Nederlands | 🇵🇱 Polski
🇷🇴 Română | 🇭🇺 Magyar | 🇨🇿 Čeština | 🇸🇰 Slovenčina
🇧🇬 Български | 🇭🇷 Hrvatski | 🇸🇮 Slovenščina | 🇱🇹 Lietuvių
🇱🇻 Latviešu | 🇪🇪 Eesti | 🇫🇮 Suomi | 🇸🇪 Svenska
🇩🇰 Dansk | 🇬🇷 Ελληνικά | 🇮🇪 Gaeilge | 🇲🇹 Malti
```

### Implementazione (next-intl)

```typescript
// i18n/config.ts
export const locales = ['it', 'en', 'de', 'fr', 'es', ...];
export const defaultLocale = 'it';

// Routing: /[locale]/page
// Esempio: /it/tournaments, /en/tournaments
```

---

## 20. PWA E OFFLINE MODE

### Service Worker (Workbox)

```javascript
// Caching strategies
- NetworkFirst: API calls
- CacheFirst: Static assets
- StaleWhileRevalidate: Images
```

### Offline Capabilities

| Funzionalità | Offline |
|--------------|---------|
| Visualizza tornei (cache) | ✅ |
| Visualizza classifica (cache) | ✅ |
| Registra cattura (queue) | ✅ |
| Upload foto (background sync) | ✅ |
| Login | ❌ |
| Pagamenti | ❌ |

### IndexedDB Storage

- Tornei preferiti
- Catture in coda
- Profilo utente
- Impostazioni app

---

## 21. BUSINESS MODEL

### Piano Abbonamento SaaS

| Piano | Prezzo/Mese | Tornei/Anno | Partecipanti | Storage |
|-------|-------------|-------------|--------------|---------|
| Starter | €299 | 12 | 500 | 10 GB |
| Professional | €499 | 50 | 2.000 | 50 GB |
| Enterprise | €799 | Illimitati | Illimitati | 200 GB |

### Revenue Streams

1. **Abbonamenti** - Fee mensile organizzatori
2. **Commissioni** - 10% su quote iscrizione
3. **Team Profiles** - Pagine profilo team
4. **Sponsor** - Pacchetti pubblicitari
5. **Report Premium** - Statistiche avanzate
6. **Certificati** - PDF personalizzati

---

## 22. SICUREZZA

### Misure Implementate

| Area | Implementazione |
|------|-----------------|
| Authentication | JWT + Refresh Token |
| Password | bcrypt (cost 12) |
| API | Rate limiting (express-rate-limit) |
| Input | Validation (express-validator) |
| SQL | Prisma ORM (query parametrizzate) |
| XSS | React escape automatico |
| CORS | Whitelist domini |
| HTTPS | Obbligatorio in produzione |
| Secrets | Environment variables |

### Row-Level Security (PostgreSQL)

```sql
-- Ogni utente vede solo dati del proprio tenant
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_policy ON tournaments
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

---

## 23. GAMIFICATION

### Achievements (Da Implementare)

| Achievement | Condizione |
|-------------|------------|
| Prima Cattura | Registra prima cattura |
| Pescatore Esperto | 50 catture approvate |
| Campione | Vinci un torneo |
| Costante | Partecipa 10 tornei |
| Re del Mare | 100 kg totali |

### Badge Classifica

- 🥇 1° posto
- 🥈 2° posto
- 🥉 3° posto

---

## 24. FEATURE ROADMAP

### Priorità Alta (Da Implementare)

| # | Feature | Descrizione |
|---|---------|-------------|
| 1 | UserService | CRUD utenti completo |
| 2 | PaymentService | Integrazione Stripe completa |
| 3 | NotificationService | Push + Email |
| 4 | DocumentService | Upload + Verifica |
| 5 | GPS Validation | Turf.js integration |

### Priorità Media

| # | Feature | Descrizione |
|---|---------|-------------|
| 6 | SpeciesService | Database specie |
| 7 | TenantService | Multi-tenancy completo |
| 8 | StatsService | Analytics avanzate |
| 9 | AuditService | Logging azioni |
| 10 | ExportService | CSV, PDF, Excel |

### Priorità Bassa (Backlog)

| # | Feature | Descrizione |
|---|---------|-------------|
| 11 | AchievementService | Gamification |
| 12 | Social Features | Commenti, like |
| 13 | Live Tracking | WebSocket real-time |
| 14 | iOS Native | Build nativo (non Expo) |
| 15 | Offline Full | PWA completa |

---

## 25. FUNZIONI DETTAGLIATE BACKEND E FRONTEND

### 25.1 Backend Routes - Implementazione Dettagliata

#### Auth Routes (`backend/src/routes/auth.routes.ts`)

| Endpoint | Metodo | Descrizione | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | Registrazione nuovo utente | No |
| `/api/auth/login` | POST | Autenticazione email/password | No |
| `/api/auth/refresh` | POST | Rinnovo access token | No |
| `/api/auth/logout` | POST | Invalidazione refresh token | Sì |

**Processo Autenticazione:**
1. Verifica credenziali con bcrypt
2. Genera JWT access token (15 min) + refresh token (7 giorni)
3. Salva refresh token nel database
4. Restituisce tokens + dati utente

---

#### Tenant Routes (`backend/src/routes/tenant.routes.ts`)

**Accesso**: Solo `SUPER_ADMIN`

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/tenants` | GET | Lista tutte le associazioni (paginata) |
| `/api/tenants/:id` | GET | Dettaglio singola associazione |
| `/api/tenants` | POST | Crea nuova associazione con admin |
| `/api/tenants/:id` | PUT | Aggiorna dati associazione |
| `/api/tenants/:id/confirm` | PATCH | Conferma registrazione (attiva tenant) |
| `/api/tenants/:id/freeze` | PATCH | Congela/scongela associazione |
| `/api/tenants/:id/impersonate` | POST | Entra in modalità amministrazione tenant |
| `/api/tenants/exit-impersonation` | POST | Esci da modalità impersonazione |
| `/api/tenants/:id/stats` | GET | Statistiche associazione |

**Funzionalità chiave:**
- **Creazione tenant**: Transazione atomica (tenant + admin user)
- **Impersonation**: Super admin genera token speciale per amministrare qualsiasi tenant
- **Freeze/Unfreeze**: Blocco temporaneo associazioni

---

#### User Routes (`backend/src/routes/user.routes.ts`)

| Endpoint | Metodo | Descrizione | Permessi |
|----------|--------|-------------|----------|
| `/api/users` | GET | Lista utenti (filtri: search, role, isActive) | Admin |
| `/api/users/me` | GET | Profilo utente corrente | Autenticato |
| `/api/users/me` | PUT | Aggiorna proprio profilo | Autenticato |
| `/api/users/:id` | GET | Dettaglio utente specifico | Admin |
| `/api/users/:id` | PUT | Aggiorna utente (anche ruolo) | Admin |
| `/api/users/:id/status` | PATCH | Attiva/disattiva utente | Admin |
| `/api/users/:id` | DELETE | Elimina utente (soft delete) | Super Admin |

**Controlli sicurezza:**
- Non-super admin vedono solo utenti del proprio tenant
- Impossibile auto-disattivarsi
- Solo super admin può assegnare ruolo `SUPER_ADMIN`

---

#### Team Routes (`backend/src/routes/team.routes.ts`)

| Endpoint | Metodo | Descrizione | Permessi |
|----------|--------|-------------|----------|
| `/api/teams` | GET | Lista team (filtro per torneo) | Autenticato |
| `/api/teams/:id` | GET | Dettaglio team con membri e strike | Autenticato |
| `/api/teams` | POST | Crea nuovo team/barca | Autenticato |
| `/api/teams/:id` | PUT | Aggiorna team | Admin/Capitano |
| `/api/teams/:id` | DELETE | Elimina team | Admin |
| `/api/teams/:id/members` | POST | Aggiungi membro equipaggio | Admin/Capitano |
| `/api/teams/:id/members/:userId` | DELETE | Rimuovi membro | Admin/Capitano |
| `/api/teams/:id/inspector` | PUT | Assegna ispettore di bordo | Admin |
| `/api/teams/tournament/:tournamentId` | GET | Team di un torneo specifico | Autenticato |

**Dati Team:**
- `name`: Nome team
- `boatName`: Nome barca
- `boatNumber`: Numero assegnato (solo admin)
- `clubName`, `clubCode`: Dati circolo affiliazione
- `inspectorId`, `inspectorName`, `inspectorClub`: Ispettore di bordo

---

#### Strike Routes (`backend/src/routes/strike.routes.ts`)

**Strike = Abboccata durante la gara**

| Endpoint | Metodo | Descrizione | Permessi |
|----------|--------|-------------|----------|
| `/api/strikes` | GET | Lista strike (filtri: torneo, team) | Autenticato |
| `/api/strikes/:id` | GET | Dettaglio strike | Autenticato |
| `/api/strikes` | POST | Registra nuovo strike | Membro team/Ispettore/Admin |
| `/api/strikes/:id` | PUT | Aggiorna strike | Reporter/Capitano/Ispettore/Admin |
| `/api/strikes/:id` | DELETE | Elimina strike | Admin/Judge |
| `/api/strikes/team/:teamId` | GET | Strike di un team + statistiche | Autenticato |
| `/api/strikes/tournament/:tournamentId/live` | GET | Feed live strike torneo | Autenticato |
| `/api/strikes/:id/result` | POST | Aggiorna risultato (CATCH/LOST/RELEASED) | Autorizzato |

**Dati Strike:**
- `rodCount`: Numero canne (1-10)
- `strikeAt`: Timestamp abboccata
- `latitude`, `longitude`: Coordinate GPS (opzionali)
- `result`: CATCH, LOST, RELEASED
- `notes`: Note aggiuntive

**Validazioni:**
- Torneo deve essere in stato `ONGOING`
- Team deve essere iscritto al torneo
- Solo membri team, ispettori o admin possono registrare

---

#### Catch Routes (`backend/src/routes/catch.routes.ts`)

| Endpoint | Metodo | Descrizione | Permessi |
|----------|--------|-------------|----------|
| `/api/catches` | GET | Lista catture (filtri multipli) | Autenticato |
| `/api/catches/:id` | GET | Dettaglio cattura con validazioni | Autenticato |
| `/api/catches` | POST | Registra nuova cattura | Partecipante |
| `/api/catches/:id` | PUT | Aggiorna cattura (solo pending) | Owner |
| `/api/catches/:id` | DELETE | Elimina cattura | Owner (pending) / Admin |
| `/api/catches/:id/approve` | POST | Approva cattura | Judge/Admin |
| `/api/catches/:id/reject` | POST | Rifiuta cattura con motivo | Judge/Admin |
| `/api/catches/user/:userId` | GET | Catture di un utente | Autenticato |

**Dati Cattura:**
- `weight`: Peso in grammi (obbligatorio)
- `length`: Lunghezza cm (opzionale)
- `photoUrl`, `videoUrl`: Media cattura (Cloudinary)
- `latitude`, `longitude`: GPS obbligatorio
- `speciesId`: Specie ittica (opzionale)
- `status`: PENDING → APPROVED / REJECTED

**Validazione GPS:**
- Coordinate verificate all'interno delle zone di pesca del torneo
- Libreria Turf.js per calcoli geospaziali

---

#### Leaderboard Routes (`backend/src/routes/leaderboard.routes.ts`)

| Endpoint | Metodo | Descrizione | Auth |
|----------|--------|-------------|------|
| `/api/leaderboard/tournament/:tournamentId` | GET | Classifica completa torneo | No |
| `/api/leaderboard/tournament/:tournamentId/top/:n` | GET | Top N partecipanti | No |
| `/api/leaderboard/tournament/:tournamentId/user/:userId` | GET | Posizione specifico utente | No |
| `/api/leaderboard/tournament/:tournamentId/stats` | GET | Statistiche aggregate | No |

**Statistiche disponibili:**
- Totale catture, peso totale, media peso
- Distribuzione per specie
- Partecipanti attivi

---

#### Upload Routes (`backend/src/routes/upload.routes.ts`)

**Storage**: Cloudinary CDN

| Endpoint | Metodo | Descrizione | Limiti |
|----------|--------|-------------|--------|
| `/api/upload/catch-photo` | POST | Upload foto cattura | Max 10MB, JPG/PNG |
| `/api/upload/catch-video` | POST | Upload video cattura | Max 100MB, MP4/MOV |
| `/api/upload/file` | DELETE | Elimina file da Cloudinary | - |

**Trasformazioni automatiche:**
- Foto: resize max 1920px, qualità 80%
- Thumbnail: 400x400px automatico
- Video: streaming ottimizzato

---

### 25.2 Frontend - Pagine e Componenti

#### AuthContext (`frontend/src/contexts/AuthContext.tsx`)

**State Management globale autenticazione:**

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email, password) => Promise<void>;
  logout: () => void;
  register: (data) => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

**Helper functions per ruoli:**
- `isAdmin()`: SUPER_ADMIN o TENANT_ADMIN
- `isJudge()`: Ruolo JUDGE
- `isOrganizer()`: Ruolo ORGANIZER
- `isPresident()`: Ruolo PRESIDENT
- `isSuperAdmin()`: Solo SUPER_ADMIN

---

#### Pagine Dashboard

| Pagina | Path | Accesso | Funzionalità |
|--------|------|---------|--------------|
| Admin | `/dashboard/admin` | SUPER_ADMIN, TENANT_ADMIN | Statistiche, gestione tornei, link admin |
| Judge | `/dashboard/judge` | JUDGE | Catture da approvare, workflow validazione |
| Reports | `/dashboard/reports` | Admin | Report aggregati, export CSV/PDF |
| Strikes | `/dashboard/strikes` | Autenticato | Monitoraggio strike live, statistiche team |
| Super Admin | `/dashboard/super-admin` | SUPER_ADMIN | Gestione multi-tenant, creazione associazioni |
| Teams | `/dashboard/teams` | Autenticato | Lista team, creazione/modifica, equipaggio |
| Tournaments | `/dashboard/tournaments` | Admin | CRUD tornei, gestione lifecycle |
| Users | `/dashboard/users` | Admin | Lista utenti, modifica ruoli, attivazione |

---

#### Componenti UI Principali

| Componente | File | Funzione |
|------------|------|----------|
| CatchCamera | `components/native/CatchCamera.tsx` | Acquisizione foto/video con GPS |
| LiveLeaderboard | `components/native/LiveLeaderboard.tsx` | Classifica real-time con auto-refresh |
| Header | `components/layout/Header.tsx` | Navigazione principale |
| Footer | `components/layout/Footer.tsx` | Footer con link e info |
| HeroSection | `components/home/HeroSection.tsx` | Hero homepage con CTA |
| LanguageSelector | `components/LanguageSelector.tsx` | Cambio lingua (it/en/de/es/fr) |

---

### 25.3 Matrice Ruoli e Permessi

| Ruolo | Tenant | Tornei | Team | Strike | Catture | Utenti |
|-------|--------|--------|------|--------|---------|--------|
| SUPER_ADMIN | CRUD | CRUD | CRUD | CRUD | Approva | CRUD |
| TENANT_ADMIN | View own | CRUD | CRUD | CRUD | Approva | CRUD tenant |
| PRESIDENT | View own | CRUD | CRUD | CRUD | Approva | View |
| ORGANIZER | - | Manage | View | View | View | - |
| JUDGE | - | View | View | View | Approva | - |
| PARTICIPANT | - | Iscriviti | Own team | Registra | Registra | Own profile |

---

### 25.4 Flusso Operativo Completo

#### Setup Iniziale (Super Admin)
1. Crea tenant (associazione)
2. Assegna admin del tenant
3. Configura impostazioni globali

#### Preparazione Torneo (Admin/President)
1. Crea torneo (stato DRAFT)
2. Definisce zone di pesca (GeoJSON)
3. Configura specie e punteggi
4. Apre iscrizioni (stato REGISTRATION)

#### Iscrizione (Partecipante)
1. Registrazione account
2. Upload documenti (licenza MASAF, certificato medico)
3. Iscrizione torneo con pagamento
4. Creazione team/barca
5. Aggiunta membri equipaggio

#### Durante Gara (ONGOING)
1. Check-in partecipanti
2. Registrazione strike (abboccate)
3. Registrazione catture con foto + GPS
4. Validazione catture da giudici
5. Classifica live aggiornata

#### Chiusura (COMPLETED)
1. Validazione finale catture pendenti
2. Calcolo classifica definitiva
3. Generazione report e certificati
4. Archiviazione dati

---

## APPENDICE A: ENVIRONMENT VARIABLES

```env
# Server
NODE_ENV=production
PORT=3001
API_URL=https://api.tournamentmaster.it
FRONTEND_URL=https://tournamentmaster.it

# Database
DATABASE_URL=mysql://user:pass@host:3306/tournamentmaster

# JWT
JWT_SECRET=<random-256-bit>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Storage
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Payments
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Notifications
SENDGRID_API_KEY=SG.xxx
FIREBASE_SERVICE_ACCOUNT=<json-encoded>

# Redis
REDIS_URL=redis://localhost:6379
```

---

## APPENDICE B: COMANDI UTILI

```bash
# Backend
npm run dev              # Sviluppo
npm run build            # Build
npm run start            # Produzione
npm run prisma:migrate   # Migrazioni DB
npm run prisma:studio    # GUI Database

# Frontend
npm run dev              # Sviluppo (localhost:3000)
npm run build            # Build produzione
npm run start            # Serve build

# Mobile
npx cap add android      # Aggiungi Android
npx cap sync             # Sincronizza
npx cap open android     # Apri Android Studio
npx cap run android      # Build e run
```

---

## APPENDICE C: CREDENZIALI DEMO

```
Admin:  admin@tournamentmaster.it / admin123
Judge:  judge@tournamentmaster.it / judge123
User:   user@tournamentmaster.it / user123
```

---

**Fine Documento Unificato**

*Generato il 2026-01-02 unificando 3 documenti sorgente*
