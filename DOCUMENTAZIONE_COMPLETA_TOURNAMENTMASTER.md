# TournamentMaster - Documentazione Completa (Backend + Frontend)

**Versione:** 1.4.0
**Data:** 2026-01-02
**Backend Stack:** Node.js + Express + TypeScript + Prisma + MySQL/MariaDB
**Frontend Stack:** Next.js 14 + TypeScript + Tailwind CSS + Capacitor

---

## Indice

### Parte 1 - Backend
1. [Architettura Generale](#architettura-generale)
2. [Modelli Database (Prisma Schema)](#modelli-database)
3. [Sistema di Autenticazione](#sistema-di-autenticazione)
4. [API Endpoints Implementati](#api-endpoints-implementati)
5. [Cloudinary CDN - Sistema di Storage Media](#cloudinary-cdn---sistema-di-storage-media)
6. [Funzionalità Parzialmente Implementate](#funzionalità-parzialmente-implementate)
7. [Funzionalità Mancanti da Aggiungere](#funzionalità-mancanti-da-aggiungere)
8. [Servizi e Business Logic](#servizi-e-business-logic)
9. [Middleware](#middleware)
10. [Raccomandazioni per lo Sviluppo](#raccomandazioni-per-lo-sviluppo)

### Parte 2 - Frontend
10. [Architettura Frontend](#architettura-frontend)
11. [Pagine Implementate](#pagine-implementate)
12. [Componenti UI](#componenti-ui)
13. [Sistema di Internazionalizzazione (i18n)](#sistema-di-internazionalizzazione)
14. [Componenti Nativi (Capacitor)](#componenti-nativi-capacitor)
15. [Sistema di Autenticazione Frontend](#sistema-di-autenticazione-frontend)
16. [Funzionalità Frontend Mancanti](#funzionalità-frontend-mancanti)
17. [Raccomandazioni Frontend](#raccomandazioni-frontend)

### Parte 3 - App Mobile
18. [Panoramica App Mobile](#panoramica-app-mobile)
19. [Android APK - Specifiche Tecniche](#android-apk---specifiche-tecniche)
20. [iOS Expo Go - Specifiche Tecniche](#ios-expo-go---specifiche-tecniche)
21. [Percorsi File Mobile](#percorsi-file-mobile)
22. [Installazione Android](#installazione-android)
23. [Installazione iOS](#installazione-ios)
24. [Setup Ambiente di Sviluppo Mobile](#setup-ambiente-di-sviluppo-mobile)
25. [Editing e Modifiche App Mobile](#editing-e-modifiche-app-mobile)
26. [Miglioramenti Consigliati App Mobile](#miglioramenti-consigliati-app-mobile)
27. [Troubleshooting App Mobile](#troubleshooting-app-mobile)
28. [Dipendenze Principali Mobile](#dipendenze-principali-mobile)

### Parte 4 - Gestione Barche/Team e Strike Live
29. [Panoramica Barche e Strike](#panoramica-barche-e-strike)
30. [Ruoli Utente e Permessi](#ruoli-utente-e-permessi-barche-strike)
31. [Gestione Barche/Team](#gestione-barcheteam)
32. [Strike Live](#strike-live)
33. [API Reference Barche/Strike](#api-reference-barche-strike)
34. [Credenziali di Test](#credenziali-di-test)
35. [FAQ Barche/Strike](#faq-barche-strike)

---

## Architettura Generale

### Stack Tecnologico

| Componente | Tecnologia | Versione |
|------------|------------|----------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.x |
| Linguaggio | TypeScript | 5.x |
| ORM | Prisma | 5.x |
| Database | MySQL/MariaDB | 8.x |
| Auth | JWT + bcrypt | - |
| Geospatial | Turf.js | 7.x |
| Validation | express-validator | - |
| Media CDN | Cloudinary | 2.x |
| Image Processing | Sharp | 0.34.x |
| File Upload | Multer | 2.x |

### Struttura Directory

```
backend/
├── src/
│   ├── app.ts              # Express app setup
│   ├── server.ts           # Server entry point
│   ├── config/
│   │   └── index.ts        # Configuration management
│   ├── middleware/
│   │   └── auth.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts      # ⚠️ NON IMPLEMENTATO
│   │   ├── catch.routes.ts
│   │   ├── leaderboard.routes.ts
│   │   ├── upload.routes.ts    # ✅ NUOVO - Upload Cloudinary
│   │   └── tournament/
│   │       ├── index.ts
│   │       ├── tournament-crud.routes.ts
│   │       ├── tournament-lifecycle.routes.ts
│   │       ├── tournament-zones.routes.ts
│   │       └── tournament-registration.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── catch.service.ts
│   │   ├── gps.service.ts
│   │   ├── leaderboard.service.ts
│   │   ├── tournament.service.ts
│   │   └── upload.service.ts   # ✅ NUOVO - Cloudinary SDK
│   └── types/
│       └── index.ts
├── prisma/
│   └── schema.prisma
└── uploads/                # File uploads (locale - fallback)
```

### Pattern Architetturali

1. **Multi-Tenant Architecture**: Supporto per organizzazioni multiple (FIPSAS, CIPS, etc.)
2. **Facade Pattern**: TournamentService aggrega operazioni CRUD, lifecycle, zones, registration
3. **Role-Based Access Control (RBAC)**: 5 ruoli gerarchici
4. **JWT Authentication**: Access token (15min) + Refresh token (7 giorni)

---

## Modelli Database

### Schema Entity-Relationship

```
Tenant (1) ─────< (N) User
   │                  │
   │                  ├──< RefreshToken
   │                  ├──< Document
   │                  ├──< TournamentRegistration
   │                  └──< Catch
   │
   └────< Tournament
              │
              ├──< FishingZone (GeoJSON)
              ├──< TournamentSpecies ─── Species
              ├──< TournamentRegistration
              ├──< Catch
              └──< LeaderboardEntry
```

### Dettaglio Modelli (12 totali)

#### 1. Tenant (Organizzazione)
```prisma
model Tenant {
  id           String   @id @default(uuid())
  name         String   // es. "FIPSAS Lombardia"
  slug         String   @unique
  contactEmail String
  settings     Json     @default("{}")
  isActive     Boolean  @default(true)
  createdAt    DateTime
  updatedAt    DateTime
}
```

#### 2. User (Utente)
```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  firstName    String
  lastName     String
  phone        String?
  role         UserRole  @default(PARTICIPANT)
  tenantId     String?
  isActive     Boolean   @default(true)
  emailVerified Boolean  @default(false)
  createdAt    DateTime
  updatedAt    DateTime
}
```

#### 3. Document (Documenti Utente)
```prisma
model Document {
  id           String       @id @default(uuid())
  userId       String
  type         DocumentType // MASAF_LICENSE, MEDICAL_CERTIFICATE, etc.
  fileUrl      String
  isVerified   Boolean      @default(false)
  expiresAt    DateTime?
}
```

#### 4. Tournament (Torneo)
```prisma
model Tournament {
  id                String            @id @default(uuid())
  tenantId          String
  name              String
  description       String?
  discipline        TournamentDiscipline
  status            TournamentStatus  @default(DRAFT)
  startDate         DateTime
  endDate           DateTime
  registrationStart DateTime
  registrationEnd   DateTime
  maxParticipants   Int?
  minWeight         Float?            // Peso minimo cattura (grammi)
  maxCatchesPerDay  Int?              // Limite catture giornaliere
  requiresApproval  Boolean           @default(true)
  entryFee          Float?            // Quota iscrizione
  prizePool         Float?            // Montepremi
  rules             String?           // Regolamento
  location          String?
  coverImage        String?
}
```

#### 5. FishingZone (Zone di Pesca - GeoJSON)
```prisma
model FishingZone {
  id           String  @id @default(uuid())
  tournamentId String
  name         String
  description  String?
  geoJson      String  // GeoJSON Polygon/MultiPolygon
  isActive     Boolean @default(true)
}
```

#### 6. Species (Specie Ittiche)
```prisma
model Species {
  id           String  @id @default(uuid())
  name         String  @unique
  scientificName String?
  minSize      Float?  // Misura minima legale (cm)
  imageUrl     String?
}
```

#### 7. TournamentSpecies (Specie Valide per Torneo)
```prisma
model TournamentSpecies {
  id           String @id @default(uuid())
  tournamentId String
  speciesId    String
  pointsPerKg  Float  @default(1.0)  // Punteggio per kg
  bonusPoints  Float  @default(0)    // Bonus fisso
}
```

#### 8. TournamentRegistration (Iscrizioni)
```prisma
model TournamentRegistration {
  id              String   @id @default(uuid())
  tournamentId    String
  userId          String
  status          String   @default("pending") // pending, confirmed, rejected
  boatName        String?
  boatRegistration String?
  crewMembers     Json?    // Array di membri equipaggio
  paymentStatus   String?  // pending, paid, refunded
  paymentRef      String?  // Riferimento Stripe
  registeredAt    DateTime
  confirmedAt     DateTime?
}
```

#### 9. Catch (Catture)
```prisma
model Catch {
  id           String      @id @default(uuid())
  tournamentId String
  userId       String
  speciesId    String?
  weight       Float       // Peso in grammi
  length       Float?      // Lunghezza in cm
  photoUrl     String
  latitude     Float
  longitude    Float
  status       CatchStatus @default(PENDING)
  notes        String?
  catchTime    DateTime
  createdAt    DateTime
  approvedBy   String?
  approvedAt   DateTime?
  rejectionReason String?
}
```

#### 10. LeaderboardEntry (Classifica)
```prisma
model LeaderboardEntry {
  id            String @id @default(uuid())
  tournamentId  String
  participantId String
  totalWeight   Float  @default(0)
  totalCatches  Int    @default(0)
  totalPoints   Float  @default(0)
  rank          Int?
  lastUpdated   DateTime

  @@unique([tournamentId, participantId])
}
```

#### 11. RefreshToken
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime
}
```

#### 12. AuditLog
```prisma
model AuditLog {
  id        String   @id @default(uuid())
  action    String
  entityType String
  entityId  String
  userId    String?
  details   Json?
  createdAt DateTime
}
```

### Enumerazioni

```typescript
enum UserRole {
  SUPER_ADMIN     // Amministratore piattaforma
  TENANT_ADMIN    // Amministratore organizzazione
  ORGANIZER       // Organizzatore tornei
  JUDGE           // Giudice/Validatore catture
  PARTICIPANT     // Partecipante
}

enum DocumentType {
  MASAF_LICENSE       // Licenza MASAF
  MEDICAL_CERTIFICATE // Certificato medico
  NAUTICAL_LICENSE    // Patente nautica
  IDENTITY_DOCUMENT   // Documento identità
}

enum TournamentStatus {
  DRAFT       // Bozza
  PUBLISHED   // Pubblicato (iscrizioni aperte)
  ONGOING     // In corso
  COMPLETED   // Completato
  CANCELLED   // Annullato
}

enum TournamentDiscipline {
  BIG_GAME          // Big Game
  DRIFTING          // Drifting
  TRAINA_COSTIERA   // Traina Costiera
  BOLENTINO         // Bolentino
  EGING             // Eging
  VERTICAL_JIGGING  // Vertical Jigging
  SHORE             // Da riva
  SOCIAL            // Evento sociale
}

enum CatchStatus {
  PENDING   // In attesa validazione
  APPROVED  // Approvata
  REJECTED  // Rifiutata
}
```

---

## Sistema di Autenticazione

### Flusso Autenticazione

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────>│  /api/auth  │────>│ AuthService │
│  (Mobile)   │<────│   /login    │<────│             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │  Access Token (15min)                 │
       │  Refresh Token (7 giorni)             │
       ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│  Protected  │<── authenticate() ──────│  Database   │
│   Routes    │                         │ RefreshToken│
└─────────────┘                         └─────────────┘
```

### API Auth Endpoints

| Metodo | Endpoint | Descrizione | Stato |
|--------|----------|-------------|-------|
| POST | `/api/auth/register` | Registrazione nuovo utente | ✅ Implementato |
| POST | `/api/auth/login` | Login con email/password | ✅ Implementato |
| POST | `/api/auth/refresh` | Rinnovo access token | ✅ Implementato |
| POST | `/api/auth/logout` | Logout (revoca refresh token) | ✅ Implementato |

### Validazione Input (Register)

```typescript
[
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
  body("firstName").trim().notEmpty(),
  body("lastName").trim().notEmpty(),
  body("phone").optional().isMobilePhone("any"),
]
```

### JWT Payload

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string;
}
```

### Sicurezza Password

- **Hashing**: bcrypt con salt rounds configurabile (default: 12)
- **Refresh Token**: 64 bytes random, hex encoded
- **Access Token**: Scadenza 15 minuti (configurabile)

---

## API Endpoints Implementati

### Auth Routes (`/api/auth`)

| Metodo | Endpoint | Auth | Ruoli | Descrizione |
|--------|----------|------|-------|-------------|
| POST | `/register` | No | - | Registrazione |
| POST | `/login` | No | - | Login |
| POST | `/refresh` | No | - | Refresh token |
| POST | `/logout` | No | - | Logout |

### Tournament Routes (`/api/tournaments`)

#### CRUD

| Metodo | Endpoint | Auth | Ruoli | Descrizione |
|--------|----------|------|-------|-------------|
| GET | `/` | Optional | - | Lista tornei (pubblici se non auth) |
| GET | `/:id` | Optional | - | Dettaglio torneo |
| POST | `/` | Sì | ORGANIZER+ | Crea torneo |
| PUT | `/:id` | Sì | ORGANIZER+ | Modifica torneo |
| DELETE | `/:id` | Sì | ORGANIZER+ | Elimina torneo |

#### Lifecycle

| Metodo | Endpoint | Auth | Ruoli | Descrizione |
|--------|----------|------|-------|-------------|
| POST | `/:id/publish` | Sì | ORGANIZER+ | Pubblica (DRAFT→PUBLISHED) |
| POST | `/:id/start` | Sì | ORGANIZER+ | Avvia (PUBLISHED→ONGOING) |
| POST | `/:id/complete` | Sì | ORGANIZER+ | Completa (ONGOING→COMPLETED) |
| POST | `/:id/cancel` | Sì | ORGANIZER+ | Annulla (any→CANCELLED) |

#### Fishing Zones

| Metodo | Endpoint | Auth | Ruoli | Descrizione |
|--------|----------|------|-------|-------------|
| GET | `/:id/zones` | Optional | - | Lista zone pesca |
| GET | `/:id/zones/:zoneId` | Optional | - | Dettaglio zona |
| POST | `/:id/zones` | Sì | ORGANIZER+ | Crea zona (GeoJSON) |
| PUT | `/:id/zones/:zoneId` | Sì | ORGANIZER+ | Modifica zona |
| DELETE | `/:id/zones/:zoneId` | Sì | ORGANIZER+ | Elimina zona |

#### Registration

| Metodo | Endpoint | Auth | Ruoli | Descrizione |
|--------|----------|------|-------|-------------|
| GET | `/:id/participants` | Sì | ORGANIZER+ | Lista partecipanti |
| POST | `/:id/register` | Sì | PARTICIPANT+ | Iscrizione |
| DELETE | `/:id/register` | Sì | PARTICIPANT+ | Annulla iscrizione |
| POST | `/:id/confirm/:participantId` | Sì | ORGANIZER+ | Conferma iscrizione |

### Catch Routes (`/api/catches`)

| Metodo | Endpoint | Auth | Ruoli | Descrizione |
|--------|----------|------|-------|-------------|
| GET | `/` | Sì | - | Lista catture utente |
| GET | `/:id` | Sì | - | Dettaglio cattura |
| POST | `/` | Sì | PARTICIPANT | Registra cattura |
| PUT | `/:id/approve` | Sì | JUDGE+ | Approva cattura |
| PUT | `/:id/reject` | Sì | JUDGE+ | Rifiuta cattura |
| GET | `/tournament/:id/pending` | Sì | JUDGE+ | Catture in attesa |
| GET | `/tournament/:id/my` | Sì | PARTICIPANT | Mie catture |

### Leaderboard Routes (`/api/leaderboard`)

| Metodo | Endpoint | Auth | Ruoli | Descrizione |
|--------|----------|------|-------|-------------|
| GET | `/:tournamentId` | Optional | - | Classifica completa |
| GET | `/:tournamentId/top/:n` | Optional | - | Top N classificati |
| GET | `/:tournamentId/my` | Sì | PARTICIPANT | Mia posizione |
| GET | `/:tournamentId/stats` | Optional | - | Statistiche torneo |
| POST | `/:tournamentId/initialize` | Sì | ORGANIZER+ | Inizializza classifica |
| POST | `/:tournamentId/recalculate` | Sì | ORGANIZER+ | Ricalcola classifica |

### Upload Routes (`/api/upload`) - **NUOVO**

| Metodo | Endpoint | Auth | Ruoli | Descrizione |
|--------|----------|------|-------|-------------|
| POST | `/catch-photo` | Sì | - | Upload foto cattura su Cloudinary |
| POST | `/catch-video` | Sì | - | Upload video cattura su Cloudinary |
| DELETE | `/file` | Sì | - | Elimina file da Cloudinary |

#### POST /catch-photo

Upload foto cattura con compressione automatica e thumbnail generation.

**Request:**
- `Content-Type: multipart/form-data`
- `photo`: File (JPEG, PNG, HEIC, WebP) - max 10MB
- `tournamentId`: string (opzionale) - per organizzare in folder

**Response:**
```json
{
  "success": true,
  "message": "Foto caricata con successo",
  "data": {
    "url": "https://res.cloudinary.com/.../photo.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../thumb.jpg",
    "publicId": "tournamentmaster/catches/general/1234567890_abc123",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "size": 524288
  }
}
```

#### POST /catch-video

Upload video cattura (max 100MB).

**Request:**
- `Content-Type: multipart/form-data`
- `video`: File (MP4, MOV, AVI, WebM) - max 100MB
- `tournamentId`: string (opzionale)

**Response:** Identico a catch-photo con thumbnail estratto dal video.

#### DELETE /file

Elimina file da Cloudinary.

**Query params:**
- `publicId`: string - ID Cloudinary (URL encoded)
- `type`: "image" | "video" (default: "image")

---

## Cloudinary CDN - Sistema di Storage Media

### Panoramica

TournamentMaster utilizza **Cloudinary** come CDN per la gestione di tutti i media (foto e video delle catture). Cloudinary offre:

- **Upload ottimizzato**: Compressione automatica senza perdita di qualità visibile
- **Thumbnail generation**: Creazione automatica di miniature per preview veloci
- **Trasformazioni on-the-fly**: Ridimensionamento, crop, filtri via URL
- **CDN globale**: Distribuzione veloce in tutto il mondo
- **Storage illimitato**: Piano scalabile in base all'utilizzo

### Credenziali di Accesso

| Parametro | Valore |
|-----------|--------|
| **Cloud Name** | `dvbmdexl2` |
| **API Key** | `483656551513767` |
| **API Secret** | `8qAKsd1ayP5NlverEE0UmWbMDDE` |
| **Console** | https://console.cloudinary.com |
| **Account** | marino@unitec.it |

### Configurazione Backend

**File:** `backend/.env`

```env
# Cloudinary (Media CDN)
CLOUDINARY_CLOUD_NAME=dvbmdexl2
CLOUDINARY_API_KEY=483656551513767
CLOUDINARY_API_SECRET=8qAKsd1ayP5NlverEE0UmWbMDDE
```

### Funzionalità per TournamentMaster

#### 1. Upload Foto Catture

Ogni foto cattura viene:
1. **Compressa**: Da ~5MB a ~500KB mantenendo qualità
2. **Ottimizzata**: Formato WebP/AVIF per browser moderni
3. **Archiviata**: In folder organizzate per torneo

```
tournamentmaster/
├── catches/
│   ├── general/           # Catture senza torneo specifico
│   │   ├── 1703945600000_abc123.jpg
│   │   └── 1703945700000_def456.jpg
│   └── tournament_xyz/    # Catture per torneo specifico
│       ├── 1703946000000_ghi789.jpg
│       └── 1703946100000_jkl012.jpg
└── profiles/              # Foto profilo (futuro)
```

#### 2. Generazione Thumbnail

Per ogni foto caricata, Cloudinary genera automaticamente:
- **Thumbnail 200x200**: Per liste e gallery
- **Preview 800x600**: Per anteprima dettaglio
- **Original**: Mantenuto per download/stampa

**URL Transformation:**
```
// Originale
https://res.cloudinary.com/dvbmdexl2/image/upload/v1/tournamentmaster/catches/abc123.jpg

// Thumbnail 200x200
https://res.cloudinary.com/dvbmdexl2/image/upload/c_thumb,w_200,h_200/tournamentmaster/catches/abc123.jpg

// Preview 800x600
https://res.cloudinary.com/dvbmdexl2/image/upload/c_limit,w_800,h_600/tournamentmaster/catches/abc123.jpg
```

#### 3. Upload Video

Per video delle catture:
- **Formati supportati**: MP4, MOV, AVI, WebM
- **Max dimensione**: 100MB
- **Thumbnail estratto**: Frame automatico dal video
- **Streaming adattivo**: HLS/DASH per riproduzione fluida

#### 4. Trasformazioni Disponibili

| Trasformazione | Parametro URL | Uso |
|----------------|---------------|-----|
| Resize | `w_800,h_600` | Ridimensiona |
| Crop | `c_crop,g_center` | Ritaglia centrato |
| Thumbnail | `c_thumb,w_200,h_200` | Miniatura quadrata |
| Quality | `q_auto` | Qualità automatica |
| Format | `f_auto` | Formato ottimale |
| Watermark | `l_watermark` | Aggiungi logo |

### Integrazione Frontend

**File:** `frontend/src/hooks/useUpload.ts`

```typescript
// Hook per gestire upload con stato
const { isUploading, uploadProgress, uploadPhoto, reset } = useUpload();

// Upload foto
const uploaded = await uploadPhoto(base64DataUrl, tournamentId);
// Ritorna: { url, thumbnailUrl, publicId, width, height, format, size }
```

**File:** `frontend/src/lib/api.ts`

```typescript
// Conversione base64 → Blob → multipart/form-data
export async function uploadCatchPhoto(
  base64DataUrl: string,
  tournamentId?: string
): Promise<ApiResponse<UploadedMedia>>
```

### Flusso Completo Upload

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUSSO UPLOAD FOTO CATTURA                               │
└─────────────────────────────────────────────────────────────────────────────┘

[FRONTEND]                    [BACKEND]                    [CLOUDINARY]
┌──────────┐                  ┌──────────┐                 ┌──────────┐
│ Capacitor│  base64 DataUrl  │ POST     │   SDK Upload    │ Storage  │
│ Camera   │─────────────────>│ /upload/ │────────────────>│ + CDN    │
│          │                  │catch-photo│                │          │
└──────────┘                  └──────────┘                 └──────────┘
     │                             │                            │
     │                             │<───────────────────────────│
     │                             │   { url, publicId, ... }   │
     │<────────────────────────────│                            │
     │   { url, thumbnailUrl }     │                            │
     │                             │                            │
     ▼                             │                            │
┌──────────┐                       │                            │
│ POST     │   photoPath = url     │                            │
│ /catches │──────────────────────>│                            │
│          │                       │                            │
└──────────┘                       ▼                            │
                             ┌──────────┐                       │
                             │ MySQL    │   photoPath URL       │
                             │ Database │<──────────────────────│
                             └──────────┘   (stored as string)  │
```

### Costi e Limiti

**Piano Free (sufficiente per sviluppo):**
- 25 GB storage
- 25 GB bandwidth/mese
- Trasformazioni illimitate

**Piano Production (consigliato):**
- Storage scalabile
- Bandwidth scalabile
- Support prioritario
- ~$89/mese base

### Gestione Errori

Il sistema gestisce automaticamente:
- **Offline mode**: Foto salvate localmente, upload differito
- **Upload fallito**: Retry automatico con backoff esponenziale
- **Timeout**: 30 secondi per foto, 120 secondi per video

---

## Funzionalità Parzialmente Implementate

### ⚠️ User Routes - NON IMPLEMENTATO

**File:** `backend/src/routes/user.routes.ts`

**Stato:** Tutti e 3 gli endpoint restituiscono **HTTP 501 Not Implemented**

```typescript
// GET /api/users/me - Profilo utente corrente
res.status(501).json({
  success: false,
  message: "Get current user not yet implemented",
});

// PUT /api/users/me - Aggiorna profilo
res.status(501).json({
  success: false,
  message: "Update profile not yet implemented",
});

// GET /api/users/:id - Profilo altro utente
res.status(501).json({
  success: false,
  message: "Get user by ID not yet implemented",
});
```

**Impatto:**
- L'app mobile non può mostrare il profilo utente
- Non è possibile modificare nome, telefono, email
- Non è possibile visualizzare profili di altri partecipanti

**Priorità:** 🔴 **CRITICA** - Da implementare immediatamente

---

## Funzionalità Mancanti da Aggiungere

### 1. 🔴 CRITICA - Gestione Utenti (UserService)

**Descrizione:** Completare l'implementazione di user.routes.ts

**Endpoint da implementare:**

```typescript
// GET /api/users/me
async function getCurrentUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      documents: true,
      registrations: { include: { tournament: true } },
    },
  });
}

// PUT /api/users/me
async function updateProfile(userId: string, data: UpdateProfileDTO) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    },
  });
}

// GET /api/users/:id
async function getUserById(userId: string, requesterId: string) {
  // Restituisce profilo pubblico (nome, catture, statistiche)
}
```

**Stima:** 2-3 ore

---

### 2. 🔴 CRITICA - Gestione Documenti (DocumentService)

**Descrizione:** API per upload/verifica documenti utente (licenze MASAF, certificati medici)

**Endpoint necessari:**

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/users/me/documents` | Lista documenti |
| POST | `/api/users/me/documents` | Upload documento |
| DELETE | `/api/users/me/documents/:id` | Elimina documento |
| PUT | `/api/documents/:id/verify` | Verifica documento (ADMIN) |

**Business Logic:**
- Upload file a Cloudinary/S3
- Validazione tipo file (PDF, JPG, PNG)
- Controllo scadenza documenti
- Notifica utente per documenti in scadenza

**Stima:** 4-5 ore

---

### 3. 🔴 CRITICA - Sistema Pagamenti (PaymentService)

**Descrizione:** Integrazione Stripe per quote iscrizione

**Endpoint necessari:**

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/payments/create-intent` | Crea PaymentIntent |
| POST | `/api/payments/webhook` | Webhook Stripe |
| GET | `/api/payments/history` | Storico pagamenti |
| POST | `/api/payments/refund/:id` | Rimborso (ADMIN) |

**Business Logic:**
```typescript
class PaymentService {
  // Crea intent pagamento per iscrizione torneo
  static async createTournamentPayment(
    userId: string,
    tournamentId: string,
    amount: number
  ): Promise<PaymentIntent>;

  // Gestisce webhook da Stripe
  static async handleWebhook(event: Stripe.Event): Promise<void>;

  // Conferma iscrizione dopo pagamento
  static async confirmRegistrationPayment(
    registrationId: string,
    paymentRef: string
  ): Promise<void>;
}
```

**Dipendenze:** `stripe` npm package

**Stima:** 6-8 ore

---

### 4. 🟡 ALTA - Gestione Specie (SpeciesService)

**Descrizione:** CRUD per anagrafica specie ittiche

**Endpoint necessari:**

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| GET | `/api/species` | No | Lista tutte le specie |
| GET | `/api/species/:id` | No | Dettaglio specie |
| POST | `/api/species` | ADMIN | Crea specie |
| PUT | `/api/species/:id` | ADMIN | Modifica specie |
| DELETE | `/api/species/:id` | ADMIN | Elimina specie |

**Dati iniziali da inserire:**
- Tonno rosso (Thunnus thynnus)
- Ricciola (Seriola dumerili)
- Dentice (Dentex dentex)
- Orata (Sparus aurata)
- Spigola (Dicentrarchus labrax)
- Lampuga (Coryphaena hippurus)
- Calamaro (Loligo vulgaris)
- Seppia (Sepia officinalis)
- Etc.

**Stima:** 2-3 ore

---

### 5. 🟡 ALTA - Sistema Notifiche (NotificationService)

**Descrizione:** Notifiche push + email per eventi importanti

**Eventi da notificare:**
- Iscrizione confermata
- Torneo in partenza (24h prima)
- Cattura approvata/rifiutata
- Posizione in classifica cambiata
- Documento in scadenza

**Implementazione:**

```typescript
class NotificationService {
  // Push notification via Firebase/OneSignal
  static async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void>;

  // Email via SendGrid/Mailgun
  static async sendEmail(
    to: string,
    template: EmailTemplate,
    variables: Record<string, any>
  ): Promise<void>;
}
```

**Dipendenze:** `firebase-admin` o `onesignal-node`, `@sendgrid/mail`

**Stima:** 6-8 ore

---

### 6. 🟡 ALTA - Gestione Tenant (TenantService)

**Descrizione:** CRUD per organizzazioni multi-tenant

**Endpoint necessari:**

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| GET | `/api/tenants` | SUPER_ADMIN | Lista tenant |
| GET | `/api/tenants/:id` | TENANT_ADMIN | Dettaglio tenant |
| POST | `/api/tenants` | SUPER_ADMIN | Crea tenant |
| PUT | `/api/tenants/:id` | TENANT_ADMIN | Modifica tenant |
| DELETE | `/api/tenants/:id` | SUPER_ADMIN | Elimina tenant |
| POST | `/api/tenants/:id/invite` | TENANT_ADMIN | Invita utente |

**Stima:** 4-5 ore

---

### 7. 🟢 MEDIA - Statistiche Avanzate (StatsService)

**Descrizione:** Analytics per organizzatori e partecipanti

**Endpoint necessari:**

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/stats/user/:id` | Statistiche personali |
| GET | `/api/stats/tournament/:id` | Statistiche torneo |
| GET | `/api/stats/tenant/:id` | Statistiche organizzazione |
| GET | `/api/stats/global` | Statistiche piattaforma |

**Metriche:**
- Catture totali, peso totale, media per torneo
- Specie più catturate
- Tornei partecipati/vinti
- Trend temporali

**Stima:** 4-5 ore

---

### 8. 🟢 MEDIA - Sistema Audit Log (AuditService)

**Descrizione:** Logging di tutte le azioni critiche

**Azioni da loggare:**
- Login/Logout
- Creazione/Modifica tornei
- Approvazione/Rifiuto catture
- Modifiche profilo
- Pagamenti

**Implementazione:**

```typescript
class AuditService {
  static async log(
    action: string,
    entityType: string,
    entityId: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await prisma.auditLog.create({
      data: { action, entityType, entityId, userId, details },
    });
  }
}
```

**Stima:** 2-3 ore

---

### 9. 🟢 MEDIA - Export Dati (ExportService)

**Descrizione:** Export classifiche e dati in vari formati

**Endpoint necessari:**

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/export/leaderboard/:id` | Export classifica (CSV/PDF) |
| GET | `/api/export/catches/:tournamentId` | Export catture |
| GET | `/api/export/registrations/:tournamentId` | Export iscrizioni |

**Formati:** CSV, Excel, PDF

**Dipendenze:** `exceljs`, `pdfkit`

**Stima:** 4-5 ore

---

### 10. 🟢 BASSA - Gamification (AchievementService)

**Descrizione:** Sistema badge e achievement

**Esempi achievement:**
- "Prima cattura" - Registra la prima cattura
- "Big Fish" - Cattura sopra i 10kg
- "Veterano" - 10 tornei completati
- "Campione" - Vinci un torneo

**Modello:**
```prisma
model Achievement {
  id          String @id @default(uuid())
  code        String @unique
  name        String
  description String
  iconUrl     String?
  points      Int    @default(0)
}

model UserAchievement {
  id            String   @id @default(uuid())
  userId        String
  achievementId String
  earnedAt      DateTime
}
```

**Stima:** 4-6 ore

---

## Servizi e Business Logic

### CatchService - Validazioni

**Validazioni implementate (submit catch):**

1. ✅ Torneo esiste e è ONGOING
2. ✅ Utente registrato al torneo
3. ✅ Orario cattura entro date torneo
4. ✅ Limite catture giornaliere (se configurato)
5. ✅ Peso minimo (se configurato)
6. ✅ **GPS dentro zona di pesca** (validazione geospaziale)

```typescript
// Validazione GPS con Turf.js
const validationResult = GPSService.validateCatchLocation(
  { latitude, longitude },
  fishingZones
);

if (!validationResult.isValid) {
  throw new Error(`Cattura fuori zona: ${validationResult.message}`);
}
```

### GPSService - Funzioni Geospaziali

```typescript
class GPSService {
  // Verifica se coordinate sono dentro una zona GeoJSON
  static validateCatchLocation(
    coordinates: GPSCoordinates,
    fishingZones: FishingZone[]
  ): CatchValidationResult;

  // Calcola distanza tra due punti (km)
  static calculateDistance(
    from: GPSCoordinates,
    to: GPSCoordinates
  ): number;

  // Crea zona circolare da centro e raggio
  static createCircularZone(
    center: GPSCoordinates,
    radiusKm: number
  ): FishingZone;

  // Verifica se coordinate sono dentro buffer
  static isWithinBuffer(
    coordinates: GPSCoordinates,
    geoJson: GeoJSONPolygon,
    bufferMeters: number
  ): boolean;

  // Calcola area zona (km²)
  static calculateZoneArea(geoJson: GeoJSONPolygon): number;
}
```

### LeaderboardService - Ranking

**Logica classifica:**
1. Somma peso catture approvate
2. Conta numero catture
3. Calcola punti (peso * punteggioPerKg + bonus specie)
4. Ordina per punti DESC, peso DESC, numero catture DESC
5. Assegna rank (gestisce pari merito)

---

## Middleware

### authenticate

Verifica JWT access token nell'header `Authorization: Bearer <token>`

```typescript
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Token mancante" });

  const payload = AuthService.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ message: "Token invalido" });

  req.user = payload;
  next();
};
```

### authorize

Verifica ruolo utente

```typescript
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accesso negato" });
    }
    next();
  };
};
```

### optionalAuth

Come authenticate ma non fallisce se token assente

### requireTenant

Verifica che utente appartenga a un tenant

---

## Raccomandazioni per lo Sviluppo

### Priorità Immediate (Sprint 1)

1. **Implementare user.routes.ts** - Blocca funzionalità base app
2. **Implementare document.routes.ts** - Necessario per compliance MASAF
3. **Integrare Stripe** - Necessario per iscrizioni a pagamento

### Priorità Alta (Sprint 2)

4. **Sistema notifiche** - Migliora engagement
5. **Gestione specie** - Anagrafica necessaria
6. **Gestione tenant** - Per multi-organizzazione

### Priorità Media (Sprint 3)

7. **Statistiche avanzate**
8. **Audit log**
9. **Export dati**

### Priorità Bassa (Backlog)

10. **Gamification**
11. **Social features** (commenti, like)
12. **Live tracking** (WebSocket)

### Best Practices

1. **Validazione Input:** Usare `express-validator` per tutti gli endpoint
2. **Error Handling:** Centralizzare gestione errori con middleware
3. **Logging:** Implementare Winston/Pino per logs strutturati
4. **Testing:** Aggiungere test Jest per services critici
5. **Rate Limiting:** Proteggere endpoint da abuse
6. **Caching:** Redis per classifica e dati frequenti

### Configurazione Ambiente

**Variabili richieste per produzione:**

```env
# Server
NODE_ENV=production
PORT=3001
API_URL=https://api.tournamentmaster.it

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
```

---

# PARTE 2 - FRONTEND

---

## Architettura Frontend

### Stack Tecnologico

| Componente | Tecnologia | Versione |
|------------|------------|----------|
| Framework | Next.js | 14.x (App Router) |
| Linguaggio | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui | Latest |
| Mobile | Capacitor | 6.x |
| i18n | next-intl | 3.x |
| State | React Context | 18.x |
| Forms | React Hook Form | - |
| Icons | Lucide React | - |

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
│   │   │   │       └── page.tsx # Dettaglio torneo
│   │   │   ├── catch/
│   │   │   │   └── new/
│   │   │   │       └── page.tsx  # ✅ NUOVO - Wizard registrazione cattura
│   │   │   └── dashboard/
│   │   │       ├── page.tsx    # Dashboard partecipante
│   │   │       ├── judge/
│   │   │       │   └── page.tsx
│   │   │       └── admin/
│   │   │           └── page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── native/             # Componenti Capacitor
│   │   │   ├── CatchCamera.tsx
│   │   │   └── LiveLeaderboard.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── HelpGuide.tsx
│   │   └── LanguageSelector.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx     # Autenticazione
│   ├── i18n/
│   │   ├── config.ts           # 24 lingue EU
│   │   └── request.ts
│   ├── lib/
│   │   └── utils.ts
│   └── messages/               # Traduzioni
│       ├── it.json
│       ├── en.json
│       └── [altre lingue].json
├── public/
├── capacitor.config.ts
└── next.config.mjs
```

### Pattern Architetturali

1. **App Router (Next.js 14)**: File-based routing con Server Components
2. **i18n Routing**: `/[locale]/` prefix per tutte le pagine
3. **Context API**: Gestione stato autenticazione globale
4. **Server/Client Split**: Server Components per SSR, Client per interattività
5. **Progressive Enhancement**: Funziona senza JS, migliora con JS

---

## Pagine Implementate

### 1. Homepage (`/[locale]/page.tsx`)

**Stato:** ✅ Completa

**Caratteristiche:**
- Hero section con titolo e CTA
- Sezione "Tornei in Evidenza"
- Call-to-action per registrazione
- Link a lista tornei

**Routing da homepage:**
- "Esplora Tornei" → `/tournaments`
- "Registrati" → `/register`
- "Accedi" → `/login`

---

### 2. Login (`/[locale]/login/page.tsx`)

**Stato:** ✅ Completa

**Caratteristiche:**
- Form email/password con validazione
- Pulsante "Ricordami" (remember me)
- Link "Password dimenticata" (placeholder)
- Redirect role-based dopo login:
  - SUPER_ADMIN, TENANT_ADMIN → `/dashboard/admin`
  - JUDGE → `/dashboard/judge`
  - PARTICIPANT, ORGANIZER → `/dashboard`
- Credenziali demo visibili in UI

**Demo Credentials:**
```
Admin: admin@tournamentmaster.it / admin123
Judge: judge@tournamentmaster.it / judge123
User:  user@tournamentmaster.it / user123
```

**Validazioni:**
- Email: formato valido
- Password: minimo 6 caratteri

---

### 3. Registrazione (`/[locale]/register/page.tsx`)

**Stato:** ✅ Completa

**Caratteristiche:**
- Form multi-campo (nome, cognome, email, telefono, password)
- Validazione real-time
- Checkbox termini e condizioni
- Redirect a login dopo successo

**Campi:**
| Campo | Tipo | Obbligatorio | Validazione |
|-------|------|--------------|-------------|
| firstName | text | Sì | Non vuoto |
| lastName | text | Sì | Non vuoto |
| email | email | Sì | Formato email |
| phone | tel | No | - |
| password | password | Sì | Min 8 caratteri |
| confirmPassword | password | Sì | = password |

---

### 4. Lista Tornei (`/[locale]/tournaments/page.tsx`)

**Stato:** ✅ Completa (Server Component)

**Caratteristiche:**
- Rendering server-side per SEO
- Filtri per stato: IN CORSO, PROSSIMI, COMPLETATI
- Ricerca per nome (Client Component `TournamentSearch`)
- Card tornei con:
  - Nome, data, luogo
  - Badge stato (colorato)
  - Disciplina
  - Pulsante "Dettagli"

**Fetch dati:**
```typescript
const response = await fetch(`${API_URL}/api/tournaments`);
// Fallback a dati demo se API non disponibile
```

---

### 5. Dettaglio Torneo (`/[locale]/tournaments/[id]/page.tsx`)

**Stato:** ✅ Completa

**Caratteristiche:**
- Header con immagine cover e info principali
- Tab navigation: Informazioni, Partecipanti, Catture
- Sezione regolamento
- Pulsante "Iscriviti" (se PUBLISHED)
- Info organizzatore

**Tab "Informazioni":**
- Date inizio/fine
- Periodo iscrizioni
- Max partecipanti
- Quota iscrizione
- Montepremi
- Regolamento completo

**Tab "Partecipanti":**
- Lista partecipanti iscritti
- Stato iscrizione (confermato, in attesa)
- Nome barca (se presente)

**Tab "Catture":**
- Lista catture approvate
- Foto, peso, specie
- Nome partecipante

---

### 6. Dashboard Partecipante (`/[locale]/dashboard/page.tsx`)

**Stato:** ✅ Completa

**Caratteristiche:**
- Statistiche personali (4 card):
  - Catture totali
  - In attesa di validazione
  - Approvate
  - Tornei attivi
- Quick actions basate su ruolo
- Lista tornei attivi
- Link rapidi

**Quick Actions:**
- TUTTI: Card "Registra Cattura" → `/catch/new` (verde, sempre visibile)
- PARTICIPANT: "Nuova Cattura", "I Miei Tornei"
- ORGANIZER: + "Crea Torneo"
- JUDGE: + "Valida Catture"
- ADMIN: + "Gestione Tornei"

**Nota:** Usa dati demo quando API non disponibile

---

### 7. Dashboard Giudice (`/[locale]/dashboard/judge/page.tsx`)

**Stato:** ✅ Completa (750+ righe)

**Caratteristiche:**
- Lista catture in attesa di validazione
- Filtri: torneo, stato, data
- Preview foto/video cattura
- Dialog approvazione/rifiuto
- Indicatore GPS (in zona / fuori zona)
- Badge stato colorato

**Workflow Validazione:**
1. Seleziona cattura dalla lista
2. Visualizza dettagli (foto, peso, coordinate GPS)
3. Verifica GPS in zona (indicatore visivo)
4. Clicca "Approva" o "Rifiuta"
5. Se rifiuto: inserisci motivazione
6. Conferma azione

**Dati mostrati per cattura:**
- Foto con zoom
- Peso dichiarato
- Specie (se dichiarata)
- Coordinate GPS + distanza da zona
- Data/ora cattura
- Nome partecipante
- Nome torneo

---

### 8. Dashboard Admin (`/[locale]/dashboard/admin/page.tsx`)

**Stato:** ✅ Completa (1150+ righe)

**Caratteristiche:**
- Statistiche dashboard (4 card):
  - Tornei totali
  - Partecipanti totali
  - Catture da validare
  - Tornei attivi
- Lista tornei con filtri
- CRUD completo tornei (Create, Read, Update, Delete)
- Gestione lifecycle tornei

**Lifecycle Tornei:**
```
DRAFT → PUBLISHED → REGISTRATION_OPEN → ONGOING → COMPLETED
                                      ↘ CANCELLED
```

**Actions disponibili:**
| Stato | Azioni |
|-------|--------|
| DRAFT | Pubblica, Modifica, Elimina |
| PUBLISHED | Apri Iscrizioni, Modifica |
| REGISTRATION_OPEN | Chiudi Iscrizioni, Avvia |
| ONGOING | Termina, Annulla |
| COMPLETED | Visualizza Report |

**Dialog Crea/Modifica Torneo:**
- Nome, Descrizione
- Date (inizio, fine, iscrizioni)
- Disciplina (dropdown)
- Location
- Max partecipanti
- Quota iscrizione
- Montepremi
- Regolamento (textarea)

---

## Componenti UI

### Componenti shadcn/ui utilizzati

| Componente | Uso |
|------------|-----|
| Button | Azioni primarie/secondarie |
| Card | Container informazioni |
| Dialog | Modal crea/modifica/conferma |
| Input | Form fields |
| Select | Dropdown selezione |
| Tabs | Navigation intra-pagina |
| Badge | Stato tornei/catture |
| Table | Liste dati |
| Skeleton | Loading states |
| Toast | Notifiche feedback |
| DropdownMenu | Menu contestuali |
| Avatar | Foto profilo |

### Header (`components/Header.tsx`)

**Caratteristiche:**
- Logo e nome app
- Navigation links
- LanguageSelector
- User menu (se autenticato)
- Mobile hamburger menu

### LanguageSelector (`components/LanguageSelector.tsx`)

**Caratteristiche:**
- Dropdown con 24 lingue EU
- Bandiere emoji
- Persiste selezione
- Cambia locale URL

### HelpGuide (`components/HelpGuide.tsx`)

**Caratteristiche:**
- Icona "?" nell'header
- Dialog con guida contestuale
- Contenuto diverso per pagina
- Sezioni: Panoramica, Funzionalità, Tips

**Pagine con guida:**
- home, login, register
- dashboard, admin, judge
- tournaments, tournamentDetail

---

## Sistema di Internazionalizzazione

### Configurazione (`i18n/config.ts`)

**24 Lingue EU Supportate:**

| Codice | Lingua | Priorità |
|--------|--------|----------|
| it | Italiano | Alta |
| en | English | Alta |
| de | Deutsch | Alta |
| fr | Francais | Alta |
| es | Espanol | Alta |
| pt | Portugues | Alta |
| nl | Nederlands | Media |
| pl | Polski | Media |
| ro | Romana | Media |
| el | Ellinika | Media |
| cs | Cestina | Media |
| hu | Magyar | Media |
| sv | Svenska | Media |
| bg | Balgarski | Bassa |
| da | Dansk | Bassa |
| fi | Suomi | Bassa |
| sk | Slovencina | Bassa |
| hr | Hrvatski | Bassa |
| lt | Lietuviu | Bassa |
| lv | Latviesu | Bassa |
| sl | Slovenscina | Bassa |
| et | Eesti | Bassa |
| ga | Gaeilge | Bassa |
| mt | Malti | Bassa |

### Struttura Traduzioni

```json
// messages/it.json
{
  "common": {
    "loading": "Caricamento...",
    "error": "Errore",
    "save": "Salva",
    "cancel": "Annulla"
  },
  "auth": {
    "login": "Accedi",
    "register": "Registrati",
    "logout": "Esci"
  },
  "tournaments": {
    "title": "Tornei",
    "create": "Crea Torneo",
    "status": {
      "draft": "Bozza",
      "published": "Pubblicato",
      "ongoing": "In Corso"
    }
  }
}
```

### Uso nelle pagine

```typescript
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('tournaments');

  return <h1>{t('title')}</h1>;
}
```

---

## Componenti Nativi Capacitor

### CatchCamera (`components/native/CatchCamera.tsx`)

**Scopo:** Cattura foto con GPS per registrazione catture

**Interfaccia:**
```typescript
interface CatchPhoto {
  dataUrl: string;         // Base64 foto
  latitude: number | null;
  longitude: number | null;
  timestamp: Date;
  savedLocally: boolean;   // Per offline mode
}

interface CatchCameraProps {
  onCapture: (photo: CatchPhoto) => void;
  onError: (error: string) => void;
}
```

**Funzionalità:**
1. ✅ Scatta foto con camera nativa
2. ✅ Cattura coordinate GPS automaticamente
3. ✅ Salva localmente se offline (Capacitor Filesystem)
4. ✅ Overlay guida per posizionamento pesce
5. ✅ Fallback a file picker se camera non disponibile

**Plugin Capacitor usati:**
- `@capacitor/camera`
- `@capacitor/geolocation`
- `@capacitor/filesystem`

**Gestione Permessi:**
```typescript
const permissions = await Camera.checkPermissions();
if (permissions.camera !== 'granted') {
  await Camera.requestPermissions();
}

const geoPermissions = await Geolocation.checkPermissions();
if (geoPermissions.location !== 'granted') {
  await Geolocation.requestPermissions();
}
```

---

### LiveLeaderboard (`components/native/LiveLeaderboard.tsx`)

**Scopo:** Classifica real-time con supporto offline

**Interfaccia:**
```typescript
interface LeaderboardEntry {
  rank: number;
  odisplayName: string;
  odisplayName: string;
  odisplayName: string;
  totalWeight: number;
  totalCatches: number;
  totalPoints: number;
  previousRank?: number;  // Per animazione cambio posizione
}

interface LiveLeaderboardProps {
  tournamentId: string;
  refreshInterval?: number;  // Default: 30000ms
  maxEntries?: number;       // Default: 50
}
```

**Funzionalità:**
1. ✅ Polling automatico (ogni 30s)
2. ✅ Cache offline con Capacitor Preferences
3. ✅ Indicatore stato rete
4. ✅ Animazione cambio posizione (frecce su/giu)
5. ✅ Pull-to-refresh
6. ✅ Evidenzia utente corrente

**Plugin Capacitor usati:**
- `@capacitor/preferences` (cache)
- `@capacitor/network` (stato rete)

**Gestione Offline:**
```typescript
// Salva in cache
await Preferences.set({
  key: `leaderboard_${tournamentId}`,
  value: JSON.stringify({
    data: entries,
    timestamp: Date.now()
  })
});

// Carica da cache se offline
const cached = await Preferences.get({ key: `leaderboard_${tournamentId}` });
if (cached.value) {
  const { data, timestamp } = JSON.parse(cached.value);
  // Mostra con badge "Offline - aggiornato X minuti fa"
}
```

---

## Flusso Acquisizione e Salvataggio Foto/Video Catture

### Panoramica del Sistema

Il sistema di acquisizione media per le catture e progettato per funzionare sia online che offline. Di seguito il flusso completo end-to-end.

### Architettura Attuale

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FLUSSO ACQUISIZIONE                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│   Capacitor  │────>│  CatchCamera │────>│   Preview    │────>│   Conferma  │
│    Camera    │     │  Component   │     │   + GPS      │     │   Utente    │
└──────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
       │                    │                    │                    │
       │ Photo              │ Base64             │ Coordinate         │ Salva
       │ quality: 90%       │ dataUrl            │ lat/long           │ locale
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│   Galleria   │     │  Filesystem  │     │  Geolocation │     │   catches/  │
│   Device     │     │   Capacitor  │     │   Capacitor  │     │  [file].jpg │
└──────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
```

### Step 1: Acquisizione Foto (Frontend)

**File:** `frontend/src/components/native/CatchCamera.tsx`

**Processo:**

1. **Richiesta permessi camera e GPS**
```typescript
// Verifica permessi camera
const permissions = await Camera.checkPermissions();
if (permissions.camera !== 'granted') {
  await Camera.requestPermissions();
}

// Verifica permessi GPS
const geoPermissions = await Geolocation.checkPermissions();
if (geoPermissions.location !== 'granted') {
  await Geolocation.requestPermissions();
}
```

2. **Scatto foto con Camera Capacitor**
```typescript
const photo: Photo = await Camera.getPhoto({
  quality: 90,              // Qualita 90% (buon compromesso qualita/dimensione)
  allowEditing: false,      // No editing per mantenere integrita foto
  resultType: CameraResultType.DataUrl,  // Ritorna come Base64
  source: CameraSource.Camera,           // Usa fotocamera (non galleria)
  saveToGallery: true,      // Salva anche in galleria device
  correctOrientation: true, // Corregge orientamento automaticamente
});
```

3. **Acquisizione coordinate GPS**
```typescript
const position = await Geolocation.getCurrentPosition({
  enableHighAccuracy: true,  // Alta precisione (usa GPS hardware)
  timeout: 10000,            // Timeout 10 secondi
});

// Coordinate acquisite
const latitude = position.coords.latitude;   // es. 45.4642
const longitude = position.coords.longitude; // es. 9.1900
```

4. **Creazione oggetto CatchPhoto**
```typescript
const catchPhoto: CatchPhoto = {
  dataUrl: photo.dataUrl,           // "data:image/jpeg;base64,/9j/4AAQ..."
  latitude: position?.coords.latitude ?? null,
  longitude: position?.coords.longitude ?? null,
  timestamp: new Date(),
  savedLocally: false,
};
```

### Step 2: Preview e Conferma (Frontend)

**Visualizzazione:**
- Mostra preview foto scattata
- Overlay con coordinate GPS (se disponibili)
- Pulsanti "Riprova" e "Conferma"

**Validazione visiva:**
- Utente verifica che il pesce sia visibile
- Coordinate GPS mostrate nell'angolo foto
- Possibilita di ripetere lo scatto

### Step 3: Salvataggio Locale (Frontend - Offline Mode)

**File:** Salvataggio su filesystem device per modalita offline

```typescript
const fileName = `catch_${tournamentId}_${Date.now()}.jpg`;

await Filesystem.writeFile({
  path: `catches/${fileName}`,           // Directory: catches/
  data: preview.dataUrl.split(",")[1],   // Rimuove prefix "data:image/jpeg;base64,"
  directory: Directory.Data,             // Directory dati app
  recursive: true,                       // Crea directory se non esiste
});
```

**Struttura file locale:**
```
Device Storage/
└── TournamentMaster/
    └── Data/
        └── catches/
            ├── catch_abc123_1703945600000.jpg
            ├── catch_abc123_1703945700000.jpg
            └── catch_def456_1703946000000.jpg
```

### Step 4: Upload al Server (Backend)

**Stato attuale: PARZIALMENTE IMPLEMENTATO**

Il backend e predisposto per ricevere catture con foto, ma **manca l'endpoint di upload file**.

**Schema Database (Prisma):**
```prisma
model Catch {
  // ... altri campi ...

  // Photo evidence
  photoPath     String      @db.VarChar(500)   // URL/path foto
  photoExifData String?     @db.Text           // Metadati EXIF (JSON)

  // GPS Location
  latitude      Decimal     @db.Decimal(10, 8)
  longitude     Decimal     @db.Decimal(11, 8)
  gpsAccuracy   Decimal?    @db.Decimal(8, 2)
}
```

**Endpoint esistente POST /api/catches:**
```typescript
// Validazione richiesta
const submitCatchValidation = [
  body("tournamentId").isUUID(),
  body("weight").isFloat({ min: 0.001 }),
  body("latitude").isFloat({ min: -90, max: 90 }),
  body("longitude").isFloat({ min: -180, max: 180 }),
  body("photoPath").notEmpty(),  // ⚠️ Richiede URL, non file!
  body("caughtAt").isISO8601(),
];
```

### GAP: Endpoint Upload Mancante

**Problema:** Il backend si aspetta un `photoPath` (URL), ma non c'e un endpoint per caricare la foto.

**Soluzione da implementare:**

```typescript
// POST /api/upload/catch-photo
router.post(
  "/catch-photo",
  authenticate,
  upload.single("photo"),  // multer middleware
  async (req, res) => {
    // 1. Ricevi file multipart/form-data
    // 2. Valida tipo file (jpeg, png, heic)
    // 3. Comprimi se necessario
    // 4. Upload a Cloudinary/S3
    // 5. Ritorna URL pubblico

    res.json({
      success: true,
      photoUrl: "https://res.cloudinary.com/xxx/catch_123.jpg"
    });
  }
);
```

### Flusso Completo (Da Implementare)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUSSO COMPLETO (TARGET)                            │
└─────────────────────────────────────────────────────────────────────────────┘

[1. CATTURA]          [2. UPLOAD]           [3. SUBMIT]          [4. STORAGE]
┌──────────┐         ┌──────────┐          ┌──────────┐         ┌──────────┐
│ Scatta   │  Base64 │ POST     │   URL    │ POST     │  Prisma │ MySQL    │
│ Foto     │────────>│ /upload  │─────────>│ /catches │────────>│ Database │
│ + GPS    │         │ /catch-  │          │          │         │          │
└──────────┘         │ photo    │          └──────────┘         └──────────┘
                     └──────────┘                                     │
                          │                                           │
                          ▼                                           ▼
                     ┌──────────┐                               ┌──────────┐
                     │Cloudinary│                               │ photoPath│
                     │ / S3     │                               │ = URL    │
                     └──────────┘                               └──────────┘
```

### Supporto Video

**Stato: NON IMPLEMENTATO**

Attualmente il sistema supporta solo foto. Per aggiungere supporto video:

**Frontend (da aggiungere):**
```typescript
// Registrazione video con Capacitor
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

const video = await Camera.pickImages({
  quality: 80,
  source: CameraSource.Camera,
  // ... configurazione video
});
```

**Backend (da aggiungere al schema):**
```prisma
model Catch {
  // ... campi esistenti ...

  // Media evidence (esteso per video)
  photoPath     String?     @db.VarChar(500)
  videoPath     String?     @db.VarChar(500)   // NUOVO
  mediaType     MediaType   @default(PHOTO)     // NUOVO: PHOTO | VIDEO
  thumbnailPath String?     @db.VarChar(500)   // NUOVO: thumbnail video
}

enum MediaType {
  PHOTO
  VIDEO
}
```

### Validazione GPS Backend

**File:** `backend/src/services/gps.service.ts`

Quando una cattura viene inviata, il backend valida che le coordinate GPS siano dentro le zone di pesca del torneo:

```typescript
const gpsValidation = GPSService.validateCatchLocation(
  {
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.gpsAccuracy,
  },
  tournament.fishingZones.map((z) => ({
    geoJson: z.geoJson,  // Poligono GeoJSON della zona
    name: z.name,
  }))
);

// Risultato validazione
{
  isInsideZone: true/false,
  gpsAccuracy: "high" | "medium" | "low",
  errors: ["GPS outside zone 'Zona A'"],  // se fuori zona
}
```

### Configurazione Storage

**File:** `backend/src/config/index.ts`

```typescript
upload: {
  dir: process.env.UPLOAD_DIR || "./uploads",  // Directory locale
  maxFileSize: 10485760,  // 10MB max
}
```

**Raccomandazione per produzione:**
- Usare Cloudinary o AWS S3 invece di storage locale
- Configurare CDN per distribuzione veloce
- Implementare compressione immagini lato server

### Riepilogo Stato Implementazione

| Componente | Stato | Note |
|------------|-------|------|
| Scatto foto | ✅ Completo | Capacitor Camera |
| Acquisizione GPS | ✅ Completo | Alta precisione |
| Salvataggio locale | ✅ Completo | Per offline mode |
| Preview foto | ✅ Completo | Con coordinate |
| Endpoint upload | ✅ Completo | POST /api/upload/catch-photo |
| Storage cloud | ✅ Completo | Cloudinary CDN |
| Submit cattura | ✅ Completo | photoPath = URL Cloudinary |
| Validazione GPS | ✅ Completo | Turf.js |
| Supporto video | ✅ Completo | POST /api/upload/catch-video |
| Compressione | ✅ Completo | Sharp + Cloudinary auto |
| Thumbnail generation | ✅ Completo | Cloudinary trasformazioni |
| Offline fallback | ✅ Completo | Capacitor Filesystem |

---

## Sistema di Autenticazione Frontend

### AuthContext (`contexts/AuthContext.tsx`)

**Stato globale:**
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId?: string;
}
```

**Metodi esposti:**
| Metodo | Descrizione |
|--------|-------------|
| `login(email, password)` | Login, salva token, ritorna success/error |
| `logout()` | Cancella token, reindirizza a login |
| `hasRole(...roles)` | Verifica se utente ha uno dei ruoli |
| `isAdmin` | Shortcut per SUPER_ADMIN o TENANT_ADMIN |
| `isJudge` | Shortcut per ruolo JUDGE |
| `isOrganizer` | Shortcut per ruolo ORGANIZER |

**Storage:**
- Access token: `localStorage.accessToken`
- Refresh token: `localStorage.refreshToken`
- User data: `localStorage.user`

**Flusso Login:**
```
1. User inserisce credenziali
2. POST /api/auth/login
3. Backend ritorna { accessToken, refreshToken, user }
4. Frontend salva in localStorage
5. AuthContext aggiorna stato
6. Redirect basato su ruolo
```

**Flusso Refresh:**
```
1. Access token scade (401)
2. Intercept axios error
3. POST /api/auth/refresh con refreshToken
4. Backend ritorna nuovo accessToken
5. Retry richiesta originale
```

**Protezione Route:**
```typescript
// In page.tsx
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { redirect } from 'next/navigation';

export default function ProtectedPage() {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) redirect('/login');
  if (!hasRole('ADMIN', 'ORGANIZER')) redirect('/dashboard');

  return <AdminContent />;
}
```

---

## Funzionalita Frontend Mancanti

### 1. Pagina Profilo Utente (`/profile`)

**Priorita:** Alta

**Funzionalita necessarie:**
- Visualizza dati profilo
- Modifica nome, cognome, telefono
- Cambio password
- Upload foto profilo
- Lista documenti caricati
- Storico tornei partecipati

**Dipendenza Backend:** Richiede implementazione `user.routes.ts`

---

### 2. Pagina Registrazione Cattura (`/catch/new`) ✅ IMPLEMENTATA

**Stato:** ✅ Completa (690 righe)

**File:** `frontend/src/app/[locale]/catch/new/page.tsx`

**Wizard in 4 Step:**

| Step | Nome | Descrizione |
|------|------|-------------|
| 1 | **Torneo** | Selezione torneo attivo (auto-select se unico) |
| 2 | **Foto** | Scatto con CatchCamera + upload Cloudinary + GPS |
| 3 | **Dettagli** | Peso (obbligatorio), lunghezza, specie, note |
| 4 | **Conferma** | Riepilogo dati e invio a backend |

**Funzionalita implementate:**
- ✅ Integrazione completa CatchCamera
- ✅ Upload foto su Cloudinary con progress bar
- ✅ Acquisizione automatica GPS
- ✅ Form peso/lunghezza/specie/note
- ✅ Validazione peso minimo torneo
- ✅ Preview foto con coordinate GPS
- ✅ Selezione torneo attivo
- ✅ Fallback dati demo se API non disponibile
- ✅ Redirect a dashboard dopo successo

**Campi Form:**

| Campo | Tipo | Obbligatorio | Validazione |
|-------|------|--------------|-------------|
| tournamentId | select | Si | Torneo ONGOING |
| photo | CatchCamera | Si | Upload Cloudinary |
| weight | number | Si | > 0, >= minWeight torneo |
| length | number | No | >= 0 |
| speciesId | select | No | Lista specie |
| notes | textarea | No | - |

**Submit payload:**
```typescript
{
  tournamentId: string;
  weight: number;
  length?: number;
  latitude: number | null;
  longitude: number | null;
  speciesId?: string;
  photoPath: string;  // URL Cloudinary
  caughtAt: string;   // ISO8601
  notes?: string;
}
```

**Navigazione:**
- Dashboard → Card "Registra Cattura" → `/catch/new`
- Annulla → Ritorna a dashboard

---

### 3. Pagina Classifica (`/leaderboard/[tournamentId]`)

**Priorita:** Alta

**Funzionalita necessarie:**
- Integrazione LiveLeaderboard component
- Filtri: per giorno, per specie
- Vista completa con tutte le statistiche
- Export PDF/condividi

---

### 4. Pagina Password Dimenticata (`/forgot-password`)

**Priorita:** Media

**Funzionalita necessarie:**
- Form inserimento email
- Invio email con link reset
- Pagina reset password con token

**Dipendenza Backend:** Richiede endpoint `/api/auth/forgot-password`

---

### 5. Pagina Documenti (`/documents`)

**Priorita:** Media

**Funzionalita necessarie:**
- Upload documenti (licenza MASAF, certificato medico)
- Lista documenti con stato verifica
- Notifica documenti in scadenza
- Preview PDF/immagini

**Dipendenza Backend:** Richiede `DocumentService`

---

### 6. Pagina Impostazioni (`/settings`)

**Priorita:** Bassa

**Funzionalita necessarie:**
- Preferenze notifiche
- Tema chiaro/scuro
- Lingua preferita
- Privacy settings
- Elimina account

---

### 7. Pagina Statistiche (`/stats`)

**Priorita:** Bassa

**Funzionalita necessarie:**
- Grafici performance personale
- Confronto con altri partecipanti
- Trend temporali
- Achievement/badge

---

### 8. Gestione Zone Pesca (Admin)

**Priorita:** Media

**Funzionalita necessarie:**
- Mappa interattiva (Leaflet/Mapbox)
- Disegno poligoni zone
- Import/Export GeoJSON
- Validazione area

---

### 9. Gestione Specie (Admin)

**Priorita:** Media

**Funzionalita necessarie:**
- CRUD specie
- Upload immagini specie
- Assegnazione a tornei

---

### 10. Sistema Notifiche (UI)

**Priorita:** Alta

**Funzionalita necessarie:**
- Badge notifiche non lette
- Dropdown lista notifiche
- Mark as read
- Push notification banner

---

## Raccomandazioni Frontend

### Priorita Immediate (Sprint 1)

1. **Pagina Profilo** - Blocca utilizzo base
2. ~~**Pagina Cattura**~~ ✅ COMPLETATA (`/catch/new`)
3. **Pagina Classifica** - Engagement utenti

### Priorita Alta (Sprint 2)

4. **Password Dimenticata** - Necessario per produzione
5. **Gestione Documenti** - Compliance MASAF
6. **Notifiche UI** - Miglora UX

### Priorita Media (Sprint 3)

7. **Mappa Zone** - Migliora esperienza organizzatori
8. **Gestione Specie** - Completa admin
9. **Impostazioni** - Quality of life

### Best Practices Consigliate

1. **Loading States:** Usare Skeleton components ovunque
2. **Error Boundaries:** Implementare error boundaries per recovery
3. **Optimistic Updates:** Per azioni frequenti (like, approve)
4. **Code Splitting:** Lazy load pagine pesanti
5. **Image Optimization:** Usare next/image per tutte le immagini
6. **Form Validation:** Zod per schema validation
7. **Testing:** Playwright per E2E, Vitest per unit

### Performance

```typescript
// next.config.mjs
module.exports = {
  images: {
    domains: ['api.tournamentmaster.it', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
  },
};
```

### SEO

```typescript
// app/[locale]/layout.tsx
export const metadata = {
  title: 'TournamentMaster - Gestione Tornei di Pesca',
  description: 'Piattaforma SaaS per organizzare e gestire tornei di pesca sportiva',
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: 'https://tournamentmaster.it',
    siteName: 'TournamentMaster',
  },
};
```

---

## Panoramica Barche e Strike

TournamentMaster supporta la gestione completa di tornei di pesca sportiva con barche, equipaggi e registrazione degli strike in tempo reale. Le funzionalita sono progettate per tornei multi-societa con tracciamento del club di origine.

### Flusso Tipico di un Torneo

```
1. Creazione Torneo (Admin/Presidente)
         ↓
2. Registrazione Barche/Team (Admin/Organizzatore)
         ↓
3. Assegnazione Ispettori (Admin/Organizzatore)
         ↓
4. Avvio Torneo
         ↓
5. Registrazione Strike Live (Giudici/Ispettori)
         ↓
6. Validazione Catture (Giudici)
         ↓
7. Classifica Finale
```

---

## Ruoli Utente e Permessi (Barche/Strike)

### Gerarchia Ruoli

| Ruolo | Descrizione | Accesso Teams | Accesso Strike | Gestione |
|-------|-------------|---------------|----------------|----------|
| **SUPER_ADMIN** | Amministratore piattaforma | Completo | Completo | Tutto |
| **TENANT_ADMIN** | Amministratore societa | Completo | Completo | Propria societa |
| **PRESIDENT** | Presidente societa | Completo | Completo | Propria societa |
| **ORGANIZER** | Organizzatore tornei | Lettura/Modifica | Lettura/Registra | Tornei assegnati |
| **JUDGE** | Giudice di gara | Lettura | Registra/Valida | Catture |
| **PARTICIPANT** | Partecipante | Solo propri | Solo propri | Nessuna |

### Dettaglio Permessi

#### Super Admin
- Visualizza tutti i team di tutte le societa
- Puo creare/modificare/eliminare qualsiasi team
- Accesso completo a tutti gli strike
- Gestione utenti globale

#### Amministratore Societa
- Gestione completa team della propria societa
- Assegnazione ispettori ai team
- Visualizzazione strike dei tornei della societa
- Creazione tornei per la societa

#### Presidente
- **Stessi permessi di Amministratore Societa**
- Ruolo di secondo amministratore
- Puo sostituire l'admin in sua assenza

#### Partecipante
- Visualizza solo il proprio team
- Visualizza solo i propri strike
- Nessuna capacita di modifica

---

## Gestione Barche/Team

### Accesso alla Pagina

**URL:** `/[locale]/dashboard/teams`

**Navigazione:** Sidebar → "Barche/Team" (icona nave)

### Creazione Nuovo Team

1. Cliccare **"+ Nuovo Team"** in alto a destra
2. Compilare i campi obbligatori:

| Campo | Descrizione | Obbligatorio |
|-------|-------------|--------------|
| Nome Team | Nome identificativo del team | Si |
| Numero Barca | Numero di gara assegnato | Si |
| Nome Barca | Nome dell'imbarcazione | No |
| Torneo | Torneo di appartenenza | Si |
| Capitano | Seleziona utente capitano | Si |

3. Cliccare **"Crea Team"**

### Gestione Equipaggio

Dopo aver creato il team:

1. Cliccare sull'icona **"Gestisci Equipaggio"** (icona utenti)
2. Aggiungere membri dell'equipaggio:
   - Selezionare utente dalla lista
   - Assegnare ruolo (Membro/Marinaio)
3. Rimuovere membri se necessario

### Assegnazione Ispettore

L'ispettore di bordo puo essere assegnato a qualsiasi tipo di torneo, inclusi quelli societari.

1. Cliccare icona **"Assegna Ispettore"** (icona occhio)
2. Selezionare ispettore dalla lista dei giudici disponibili
3. **Per tornei multi-societa** (Provinciale, Regionale, Nazionale, Internazionale): l'ispettore DEVE provenire da un club diverso dal team per garantire imparzialita
4. **Per tornei societari** (Sociale/Club): l'ispettore puo essere dello stesso club, ma si consiglia comunque di evitare conflitti di interesse

### Modifica Team

1. Cliccare icona **"Modifica"** (icona matita)
2. Modificare i campi desiderati
3. Salvare le modifiche

### Eliminazione Team

1. Cliccare icona **"Elimina"** (icona cestino)
2. Confermare l'eliminazione nel dialog

**Attenzione:** L'eliminazione e irreversibile e rimuovera anche tutti gli strike associati.

### Filtri e Ricerca

- **Filtro Torneo:** Seleziona un torneo specifico
- **Ricerca:** Cerca per nome team o barca
- **Ordinamento:** Per nome, numero barca, strike count

---

## Strike Live

### Accesso alla Pagina

**URL:** `/[locale]/dashboard/strikes`

**Navigazione:** Sidebar → "Strike Live" (icona fulmine)

### Cos'e uno Strike?

Uno **strike** e la registrazione di un evento di pesca durante un torneo:
- Momento in cui un pesce abbocca all'amo
- Puo risultare in: Cattura, Pesce Perso, Rilascio

### Dashboard Strike Live

La pagina mostra:

#### 1. Selezione Torneo
- Dropdown per selezionare il torneo attivo
- Solo tornei con stato "IN_PROGRESS" sono disponibili

#### 2. Griglia Team
- Card per ogni team iscritto al torneo
- Mostra:
  - Nome team e numero barca
  - Capitano
  - Conteggio strike
  - Pulsante "Registra Strike"

#### 3. Tabella Strike
- Lista cronologica degli strike registrati
- Auto-refresh ogni 30 secondi
- Colonne:
  - Timestamp
  - Team
  - Numero canna
  - Risultato (badge colorato)
  - Note

### Registrazione Strike

1. Selezionare il torneo dal dropdown
2. Cliccare **"Registra Strike"** sul team corrispondente
3. Compilare il form:

| Campo | Descrizione | Valori |
|-------|-------------|--------|
| Numero Canna | Quale canna ha avuto lo strike | 1-6 |
| Risultato | Esito dello strike | CATCH/LOST/RELEASED |
| Note | Note opzionali | Testo libero |

4. Cliccare **"Registra"**

### Risultati Strike

| Risultato | Badge | Descrizione | Punti* |
|-----------|-------|-------------|--------|
| **CATCH** | Verde | Pesce catturato e portato a bordo | Varia per specie/peso |
| **LOST** | Rosso | Pesce perso durante il combattimento | 0 |
| **RELEASED** | Blu | Pesce rilasciato (catch & release) | Bonus rilascio |

*I punti variano in base al regolamento del torneo

### Auto-Refresh

- La pagina si aggiorna automaticamente ogni **30 secondi**
- Indicatore visivo mostra il countdown
- Pulsante **"Aggiorna Ora"** per refresh manuale

---

## API Reference Barche/Strike

### Endpoints Team

#### GET /api/teams
Lista tutti i team accessibili all'utente.

**Query Parameters:**
- `tournamentId` (optional): Filtra per torneo
- `page` (default: 1): Pagina
- `limit` (default: 20): Risultati per pagina

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Team Ischia Fishing",
      "boatNumber": "42",
      "boatName": "Blue Marlin",
      "captainId": "uuid",
      "captain": { "firstName": "Mario", "lastName": "Rossi" },
      "inspectorId": "uuid",
      "inspector": { "firstName": "Luigi", "lastName": "Verdi" },
      "clubId": "uuid",
      "club": { "name": "Ischia Fishing Club" },
      "tournamentId": "uuid",
      "tournament": { "name": "Gran Premio Estate 2025", "level": "REGIONAL" },
      "crew": [...],
      "strikes": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

#### POST /api/teams
Crea un nuovo team.

**Body:**
```json
{
  "name": "Team Ischia Fishing",
  "boatNumber": "42",
  "boatName": "Blue Marlin",
  "captainId": "uuid",
  "tournamentId": "uuid"
}
```

#### PUT /api/teams/:id
Aggiorna un team esistente.

#### DELETE /api/teams/:id
Elimina un team.

#### POST /api/teams/:id/inspector
Assegna ispettore a un team.

**Body:**
```json
{
  "inspectorId": "uuid"
}
```

#### POST /api/teams/:id/crew
Gestisce l'equipaggio.

**Body:**
```json
{
  "action": "add | remove",
  "userId": "uuid",
  "role": "CREW | SAILOR"
}
```

### Endpoints Strike

#### GET /api/strikes
Lista tutti gli strike accessibili.

**Query Parameters:**
- `tournamentId` (optional): Filtra per torneo
- `teamId` (optional): Filtra per team
- `page` (default: 1): Pagina
- `limit` (default: 50): Risultati per pagina

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "teamId": "uuid",
      "team": { "name": "Team Ischia", "boatNumber": "42" },
      "rodNumber": 3,
      "result": "CATCH",
      "notes": "Tonno rosso 85kg",
      "timestamp": "2025-01-02T10:30:00Z",
      "recordedBy": "uuid",
      "recorder": { "firstName": "Luigi", "lastName": "Verdi" }
    }
  ],
  "pagination": {...}
}
```

#### POST /api/strikes
Registra un nuovo strike.

**Body:**
```json
{
  "teamId": "uuid",
  "rodNumber": 3,
  "result": "CATCH",
  "notes": "Tonno rosso stimato 80kg"
}
```

#### GET /api/strikes/team/:teamId/stats
Statistiche strike per team.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "catches": 8,
    "lost": 5,
    "released": 2,
    "catchRate": 53.33
  }
}
```

---

## Credenziali di Test

### Ambiente Development

| Ruolo | Email | Password |
|-------|-------|----------|
| Super Admin | marino@unitec.it | Gerstofen22 |
| Admin Societa | admin@ischiafishing.it | demo123 |
| Presidente | presidente@ischiafishing.it | demo123 |
| Partecipante | utente@ischiafishing.it | demo123 |

### URL Applicazione

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health

---

## FAQ Barche/Strike

### Come creo un torneo multi-societa?

1. Vai a Dashboard → Admin
2. Crea nuovo torneo
3. Imposta il livello su PROVINCIAL, REGIONAL, NATIONAL o INTERNATIONAL
4. I tornei di questo livello richiedono ispettori da club diversi

### Posso modificare uno strike gia registrato?

No, gli strike sono immutabili per garantire l'integrita dei dati. In caso di errore, contattare un amministratore.

### Come funziona l'auto-refresh della pagina Strike?

La pagina Strike Live si aggiorna automaticamente ogni 30 secondi. Un indicatore visivo mostra il countdown. Puoi anche cliccare "Aggiorna Ora" per un refresh immediato.

### Cosa succede se elimino un team?

L'eliminazione di un team e irreversibile e comporta:
- Rimozione del team dal torneo
- Eliminazione di tutti gli strike associati
- I membri dell'equipaggio non vengono eliminati (solo l'associazione)

---

## Changelog

| Data | Versione | Modifiche |
|------|----------|-----------|
| 2025-12-30 | 1.0.0 | Documentazione iniziale backend |
| 2025-12-30 | 1.0.1 | Aggiunta sezione frontend completa |
| 2025-12-30 | 1.0.2 | Aggiunta sezione dettagliata flusso acquisizione foto/video |
| 2025-12-30 | 1.1.0 | **Cloudinary Integration**: Aggiunta sezione completa Cloudinary CDN con credenziali, funzionalità, flusso upload, trasformazioni URL. Aggiornato stato implementazione (tutti i componenti media ora completi). |
| 2025-12-30 | 1.2.0 | **Pagina Registrazione Cattura**: Implementata `/catch/new` con wizard 4 step (Torneo → Foto → Dettagli → Conferma). Integrazione CatchCamera + Cloudinary. Aggiunto link dalla dashboard. Aggiornata struttura directory. |
| 2026-01-02 | 1.3.0 | **Documentazione App Mobile**: Aggiunta PARTE 3 completa con specifiche APK Android, iOS Expo Go, installazione, editing, miglioramenti consigliati e troubleshooting. |
| 2026-01-02 | 1.4.0 | **Gestione Barche/Team e Strike Live**: Aggiunta PARTE 4 completa con gestione team, equipaggio, ispettori, strike live con auto-refresh, API reference completa, credenziali test e FAQ. |

---

# PARTE 3 - APP MOBILE

---

## Panoramica App Mobile

**TournamentMaster** e' disponibile su piattaforma mobile attraverso due distribuzioni:

| Piattaforma | Metodo | Tipo |
|-------------|--------|------|
| **Android** | APK installabile | WebView Capacitor |
| **iOS** | QR Code via Expo Go | Bundle React Native |

### Stack Tecnologico Mobile

| Componente | Tecnologia |
|------------|------------|
| **Mobile (Expo)** | React Native 0.81.5 + Expo SDK 54 |
| **Mobile (APK)** | Capacitor WebView |
| **Database** | MySQL via Prisma ORM |
| **Media** | Cloudinary CDN |
| **Autenticazione** | JWT (access + refresh tokens) |

---

## Android APK - Specifiche Tecniche

### Informazioni File

| Proprieta' | Valore |
|------------|--------|
| **Nome File** | TournamentMaster.apk |
| **Dimensione** | 7.82 MB (7,821,762 bytes) |
| **Percorso** | `D:\erp-upgrade\ai\downloads\TournamentMaster.apk` |
| **Tipo** | Debug build |
| **Package** | com.tournamentmaster.app |
| **Min SDK** | Android 5.0+ (API 21) |

### Architettura APK

**IMPORTANTE:** L'APK **NON e' un'app nativa**. E' una **WebView Capacitor** che carica un sito web remoto.

```
+---------------------------------------+
|        APK Android (7.82 MB)          |
|  +--------------------------------+   |
|  |      Capacitor WebView         |   |
|  |  +-------------------------+   |   |
|  |  |  Carica URL remoto:     |   |   |
|  |  |  http://192.168.1.74    |   |   |
|  |  +-------------------------+   |   |
|  +--------------------------------+   |
+---------------------------------------+
```

### Limitazioni Critiche APK

| Limitazione | Descrizione |
|-------------|-------------|
| **Server Required** | Richiede server locale attivo (192.168.1.74) |
| **IP Hardcoded** | Non funziona su altre reti |
| **No Offline** | Nessun funzionamento senza connessione |
| **Development Only** | Non distribuibile pubblicamente |

### Permessi Android

```xml
INTERNET              - Connessione al server
CAMERA                - Foto catture
ACCESS_FINE_LOCATION  - GPS alta precisione
ACCESS_COARSE_LOCATION- GPS approssimativo
READ_EXTERNAL_STORAGE - Lettura galleria
WRITE_EXTERNAL_STORAGE- Salvataggio foto
```

### Plugin Capacitor Configurati

| Plugin | Configurazione |
|--------|---------------|
| Camera | quality: 90, allowEditing: true |
| Geolocation | enableHighAccuracy: true, timeout: 10000 |
| CapacitorHttp | Abilitato |
| SplashScreen | launchShowDuration: 2000, backgroundColor: #0ea5e9 |

> **Analisi Dettagliata:** Per limitazioni complete e analisi onesta dell'APK, vedi:
> `DESCRIZIONE_ONESTA_APK_ANDROID_20251230.md`

---

## iOS Expo Go - Specifiche Tecniche

### Informazioni Distribuzione

| Proprieta' | Valore |
|------------|--------|
| **Metodo** | QR Code via Expo Go |
| **SDK** | Expo SDK 54 |
| **File QR** | `D:\erp-upgrade\ai\downloads\TournamentMaster-iOS-ExpoGo.html` |
| **URL Tunnel** | exp://qat7r9i-anonymous-8099.exp.direct |
| **Porta** | 8099 |

### Come Funziona Expo Go

Expo Go **non genera un file IPA**. L'app viene caricata dinamicamente:

```
1. Utente installa "Expo Go" dall'App Store
2. Utente scansiona QR code
3. Expo Go scarica il bundle JavaScript
4. App esegue all'interno di Expo Go
```

### Credenziali Demo iOS

| Campo | Valore |
|-------|--------|
| Email | admin@ischiafishing.it |
| Password | demo123 |

### Bundle Identifier iOS

```
com.tournamentmaster.app
```

### Permessi iOS (Info.plist)

| Permesso | Descrizione |
|----------|-------------|
| NSCameraUsageDescription | Per fotografare le catture durante i tornei |
| NSLocationWhenInUseUsageDescription | Per validare la posizione delle catture |
| NSLocationAlwaysUsageDescription | Per tracking continuo durante il torneo |
| NSPhotoLibraryUsageDescription | Per salvare le foto delle catture |
| NSMicrophoneUsageDescription | Per registrare video con audio |

> **Analisi Dettagliata:** Per limitazioni complete e analisi onesta di Expo Go, vedi:
> `DESCRIZIONE_ONESTA_IOS_EXPO_GO_20260102.md`

---

## Percorsi File Mobile

### File Distribuibili

| File | Percorso | Descrizione |
|------|----------|-------------|
| APK Android | `D:\erp-upgrade\ai\downloads\TournamentMaster.apk` | Build debug installabile |
| QR iOS | `D:\erp-upgrade\ai\downloads\TournamentMaster-iOS-ExpoGo.html` | Pagina QR per Expo Go |
| Doc Mobile | `D:\erp-upgrade\ai\downloads\DOCUMENTAZIONE_TOURNAMENTMASTER_APP_COMPLETA.md` | Documentazione app mobile |

### Documentazione Dettagliata

| Documento | Percorso | Descrizione |
|-----------|----------|-------------|
| Analisi Android | `DESCRIZIONE_ONESTA_APK_ANDROID_20251230.md` | Limitazioni e architettura APK |
| Analisi iOS | `DESCRIZIONE_ONESTA_IOS_EXPO_GO_20260102.md` | Limitazioni e architettura Expo Go |

### Struttura Progetto Mobile

```
C:\Users\marin\Downloads\TournamentMaster\
|
+-- mobile\                     # App React Native/Expo
|   +-- src\
|   |   +-- api\               # Client API
|   |   +-- components\        # Componenti mobile
|   |   +-- screens\           # Schermate app
|   |   +-- hooks\             # useAuth, useGPS
|   |   +-- navigation\        # React Navigation
|   |   +-- types\             # TypeScript types
|   +-- app.json               # Config Expo
|   +-- package.json           # Dipendenze mobile
|
+-- temp-apk\                   # Build APK
|   +-- app-debug.apk          # APK originale (7.82 MB)
|
+-- DESCRIZIONE_ONESTA_APK_ANDROID_20251230.md   # Limitazioni APK Android
+-- DESCRIZIONE_ONESTA_IOS_EXPO_GO_20260102.md   # Limitazioni iOS Expo Go
```

---

## Installazione Android

### Prerequisiti

- Dispositivo Android 5.0+ (API 21)
- Server backend/frontend attivo sulla rete locale
- Stesso WiFi del server

### Metodo 1: Trasferimento Diretto

```bash
# 1. Copia APK sul dispositivo via USB
adb install D:\erp-upgrade\ai\downloads\TournamentMaster.apk

# 2. Oppure copia manualmente e apri da File Manager
```

### Metodo 2: Download da Browser

1. Carica APK su server web o cloud storage
2. Apri link dal browser Android
3. Consenti installazione da sorgenti sconosciute
4. Installa

### Configurazione Rete

**Prima di usare l'app:**

1. Assicurati che il PC abbia IP `192.168.1.74` (o modifica capacitor.config.json)
2. Avvia backend: `cd backend && npm run dev`
3. Avvia frontend: `cd frontend && npm run dev`
4. Connetti Android alla stessa rete WiFi

### Test Connessione

Dal dispositivo Android, apri Chrome e visita:
```
http://192.168.1.74:3000
```
Se il sito web carica correttamente, l'app funzionera'.

---

## Installazione iOS

### Prerequisiti

- iPhone con iOS 13+
- App "Expo Go" installata dall'App Store
- Server Expo tunnel attivo (porta 8099)

### Procedura

1. **Installa Expo Go** dall'App Store (gratuito)

2. **Apri il file QR:**
   ```
   D:\erp-upgrade\ai\downloads\TournamentMaster-iOS-ExpoGo.html
   ```
   (Doppio click per aprire nel browser)

3. **Scansiona il QR Code:**
   - Apri la fotocamera iPhone
   - Inquadra il QR code
   - Tocca il banner che appare

4. **L'app si carica in Expo Go**

5. **Login con credenziali demo:**
   - Email: admin@ischiafishing.it
   - Password: demo123

### Avviare il Server Expo (se tunnel non attivo)

```bash
cd C:\Users\marin\Downloads\TournamentMaster\mobile
npm install
npx expo start --tunnel
```

Verra' generato un nuovo QR code nel terminale.

---

## Setup Ambiente di Sviluppo Mobile

### Requisiti Sistema

| Requisito | Versione |
|-----------|----------|
| Node.js | >= 18.x |
| npm | >= 9.x |
| Git | >= 2.x |
| VS Code | Raccomandato |

### Setup Mobile Expo

```bash
cd C:\Users\marin\Downloads\TournamentMaster\mobile

# Installa dipendenze
npm install

# Avvia Expo
npx expo start

# Per tunnel pubblico (iOS remoto)
npx expo start --tunnel
```

### Variabili Ambiente Mobile

**Mobile (.env.development):**
```env
API_BASE_URL=http://10.0.2.2:3001/api/v1
WS_BASE_URL=ws://10.0.2.2:3001
ENV=development
```

---

## Editing e Modifiche App Mobile

### Modificare l'APK Android

#### 1. Cambiare IP Server

```bash
# File: frontend/capacitor.config.json
{
  "server": {
    "url": "http://NUOVO_IP:3000",  # <-- Modifica qui
    "cleartext": true
  }
}
```

#### 2. Rebuild APK

```bash
cd C:\Users\marin\Downloads\TournamentMaster\frontend

# Build Next.js
npm run build

# Sync con Capacitor
npx cap sync android

# Apri Android Studio
npx cap open android

# In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
```

### Modificare App iOS/Expo

#### 1. Cambiare Backend URL

```typescript
// File: mobile/src/config/environment.ts
export const config = {
  API_BASE_URL: 'http://NUOVO_IP:3001/api/v1',
  WS_BASE_URL: 'ws://NUOVO_IP:3001'
};
```

#### 2. Aggiungere Nuove Schermate

```typescript
// 1. Crea file: mobile/src/screens/NuovaSchermata.tsx
import React from 'react';
import { View, Text } from 'react-native';

export const NuovaSchermata: React.FC = () => {
  return (
    <View>
      <Text>Nuova Schermata</Text>
    </View>
  );
};

// 2. Aggiungi a navigation/index.ts
import { NuovaSchermata } from '../screens/NuovaSchermata';

// Dentro Stack.Navigator:
<Stack.Screen name="NuovaSchermata" component={NuovaSchermata} />
```

#### 3. Modificare API Client

```typescript
// File: mobile/src/api/client.ts
// Aggiungi nuovi endpoint qui

export const nuovoEndpoint = async (params: any) => {
  const response = await api.post('/nuovo-endpoint', params);
  return response.data;
};
```

---

## Miglioramenti Consigliati App Mobile

### Priorita' ALTA - Produzione

| # | Miglioramento | Descrizione | Effort |
|---|---------------|-------------|--------|
| 1 | **Deploy Backend Cloud** | Spostare backend su Railway/Render/AWS | 4h |
| 2 | **Rimuovere IP Hardcoded** | Usare URL dinamico configurabile | 2h |
| 3 | **Build APK Release** | Firmare APK per distribuzione | 3h |
| 4 | **Generare IPA** | Build iOS standalone con EAS | 4h |

### Priorita' MEDIA - Funzionalita'

| # | Miglioramento | Descrizione | Effort |
|---|---------------|-------------|--------|
| 5 | **Offline Mode** | Service Worker + IndexedDB | 8h |
| 6 | **Push Notifications** | Firebase Cloud Messaging | 6h |
| 7 | **WebSocket Live** | Classifica real-time | 4h |
| 8 | **Cache Immagini** | React Query + cache persistente | 3h |

### Priorita' BASSA - UX

| # | Miglioramento | Descrizione | Effort |
|---|---------------|-------------|--------|
| 9 | **Dark Mode** | Tema scuro completo | 4h |
| 10 | **Animazioni** | Transizioni fluide | 3h |
| 11 | **Onboarding** | Tutorial primo utilizzo | 4h |
| 12 | **Multi-lingua** | i18n per EN/DE | 6h |

### Comandi per Deploy Cloud (Railway)

```bash
# 1. Installa Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy backend
cd backend
railway init
railway up

# 4. Ottieni URL pubblico
railway domain
# Output: tournamentmaster-backend.up.railway.app

# 5. Aggiorna frontend con nuovo URL
# frontend/.env.production:
NEXT_PUBLIC_API_URL=https://tournamentmaster-backend.up.railway.app/api/v1
```

### Build APK Release Firmato

```bash
# 1. Genera keystore (una volta sola)
keytool -genkey -v -keystore tournamentmaster.keystore -alias tm -keyalg RSA -keysize 2048 -validity 10000

# 2. Configura gradle
# android/app/build.gradle:
signingConfigs {
    release {
        storeFile file('tournamentmaster.keystore')
        storePassword 'your-password'
        keyAlias 'tm'
        keyPassword 'your-password'
    }
}

# 3. Build release
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Build iOS con EAS

```bash
# 1. Installa EAS CLI
npm install -g eas-cli

# 2. Login Expo
eas login

# 3. Configura build
eas build:configure

# 4. Build iOS
eas build --platform ios --profile production

# 5. Submit to App Store
eas submit --platform ios
```

---

## Troubleshooting App Mobile

### Android: Schermata Bianca

**Causa:** Server non raggiungibile

```bash
# Verifica connessione
ping 192.168.1.74

# Verifica server attivo
curl http://192.168.1.74:3000

# Se IP diverso, modifica capacitor.config.json e rebuild
```

### Android: net::ERR_CONNECTION_REFUSED

**Causa:** Backend/Frontend non avviato

```bash
# Avvia entrambi i server
cd backend && npm run dev &
cd frontend && npm run dev &
```

### iOS: QR Code Non Funziona

**Causa:** Tunnel Expo scaduto

```bash
# Riavvia Expo con nuovo tunnel
cd mobile
npx expo start --tunnel --clear
# Usa il nuovo QR code generato
```

### iOS: "Unable to resolve host"

**Causa:** Tunnel non attivo o bloccato da firewall

```bash
# Prova con LAN invece di tunnel
npx expo start --lan

# Assicurati che iPhone e PC siano sulla stessa rete
```

### Build APK Fallisce

**Causa:** Java/Gradle non configurato

```bash
# Verifica JAVA_HOME
echo %JAVA_HOME%
# Deve puntare a JDK 17

# Pulisci e riprova
cd android
./gradlew clean
./gradlew assembleDebug
```

---

## Dipendenze Principali Mobile

### Mobile (package.json)

| Dipendenza | Versione | Uso |
|------------|----------|-----|
| expo | 54.0.0 | Framework |
| react-native | 0.81.5 | UI nativa |
| react | 19.1.0 | Core |
| @react-navigation/* | 6.x | Navigazione |
| expo-camera | 17.0.10 | Fotocamera |
| expo-location | 19.0.8 | GPS |
| expo-image-picker | 17.0.10 | Galleria |
| zustand | 4.4.7 | State management |
| axios | 1.6.5 | HTTP client |
| react-native-maps | 1.20.1 | Mappe |

---

*Documento generato da Claude Code - 2026-01-02*
