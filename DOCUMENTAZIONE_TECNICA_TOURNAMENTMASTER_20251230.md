# TournamentMaster - Documentazione Tecnica Completa

**Versione:** 1.0.1-dev
**Data:** 2025-12-30
**Tipo:** Piattaforma SaaS Multi-tenant per Tornei di Pesca

---

## 1. PANORAMICA DEL PROGETTO

### 1.1 Descrizione

**TournamentMaster** e' una piattaforma SaaS completa per la gestione di tornei di pesca sportiva. Progettata con architettura multi-tenant, consente a federazioni, club e organizzatori di gestire tornei in modo professionale con validazione GPS delle catture, classifica live e supporto mobile nativo.

### 1.2 Target Utenti

| Ruolo | Descrizione |
|-------|-------------|
| **SUPER_ADMIN** | Amministratore della piattaforma |
| **TENANT_ADMIN** | Amministratore di federazione/club |
| **ORGANIZER** | Organizzatore tornei |
| **JUDGE** | Giudice di gara (valida catture) |
| **PARTICIPANT** | Partecipante ai tornei |

### 1.3 Discipline Supportate

- **Big Game** - Pesca d'altura
- **Drifting** - Traina derivante
- **Traina Costiera** - Pesca costiera
- **Bolentino** - Pesca a fondo
- **Eging** - Pesca a cefalopodi
- **Vertical Jigging** - Jigging verticale
- **Shore** - Pesca da riva
- **Social** - Eventi sociali/ricreativi

---

## 2. ARCHITETTURA TECNICA

### 2.1 Stack Tecnologico

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  Next.js 16.1.1 + React 19 + TypeScript 5                   │
│  Tailwind CSS 4 + shadcn/ui + Lucide React                  │
│  next-intl (24 lingue EU)                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND API                             │
│  Express.js 5 + TypeScript                                   │
│  Prisma ORM + JWT Auth + bcrypt                             │
│  Socket.IO (real-time) + Turf.js (geospatial)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│  MariaDB 10.4 / MySQL                                       │
│  Schema multi-tenant con isolamento dati                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      MOBILE APP                              │
│  Capacitor 8 (iOS + Android)                                │
│  Native: Camera, GPS, Filesystem, Network                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Struttura Progetto

```
TournamentMaster/
├── frontend/                 # Next.js 16 + React 19
│   ├── src/
│   │   ├── app/[locale]/    # Pagine con routing i18n
│   │   │   ├── dashboard/   # Dashboard utente
│   │   │   │   ├── admin/   # Pannello admin
│   │   │   │   └── judge/   # Pannello giudice
│   │   │   ├── tournaments/ # Lista e dettaglio tornei
│   │   │   ├── login/       # Autenticazione
│   │   │   └── register/    # Registrazione
│   │   ├── components/
│   │   │   ├── native/      # Componenti Capacitor
│   │   │   ├── tournament/  # Componenti tornei
│   │   │   ├── layout/      # Header, Footer
│   │   │   └── ui/          # shadcn components
│   │   └── contexts/        # React Context (Auth)
│   └── messages/            # 24 file traduzioni EU
│
├── backend/                  # Express.js + Prisma
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   │   ├── auth.routes.ts
│   │   │   ├── tournament/  # CRUD + lifecycle
│   │   │   ├── catch.routes.ts
│   │   │   └── leaderboard.routes.ts
│   │   ├── services/        # Business logic
│   │   │   ├── gps.service.ts      # Validazione GPS
│   │   │   ├── catch.service.ts    # Gestione catture
│   │   │   └── tournament/         # Servizi tornei
│   │   └── middleware/      # Auth, validation
│   └── prisma/              # Schema + migrations
│
└── mobile/                   # React Native / Expo
    ├── src/                  # Sorgenti app mobile
    └── app.json             # Configurazione Expo
```

---

## 3. FUNZIONALITA' PRINCIPALI

### 3.1 Gestione Tornei

| Funzionalita' | Descrizione |
|---------------|-------------|
| **Creazione Torneo** | Wizard multi-step con discipline, date, regolamento |
| **Zone di Pesca** | Definizione aree GeoJSON con validazione automatica |
| **Specie Consentite** | Configurazione specie ammesse con moltiplicatori punti |
| **Lifecycle** | DRAFT → PUBLISHED → ONGOING → COMPLETED/CANCELLED |
| **Iscrizioni** | Gestione partecipanti, team, barche |

### 3.2 Catture e Validazione GPS

```typescript
// Flusso validazione cattura
1. Partecipante scatta foto con GPS
2. Sistema verifica:
   - Coordinate dentro zona di pesca (Turf.js)
   - Precisione GPS (warning se >50m)
   - Distanza dalla zona piu' vicina
3. Giudice approva/rifiuta cattura
4. Calcolo punti automatico
5. Aggiornamento classifica live
```

**Validazione GPS (gps.service.ts):**
- Verifica punto in poligono GeoJSON
- Calcolo distanza dal confine zona
- Supporto Polygon e MultiPolygon
- Generazione zone circolari
- Calcolo area zone in km²

### 3.3 App Mobile Nativa

| Componente | Funzionalita' |
|------------|---------------|
| **CatchCamera** | Cattura foto con overlay guida, GPS automatico, salvataggio offline |
| **LiveLeaderboard** | Classifica real-time, cache offline, indicatori trend |
| **VideoCapture** | Registrazione video prova cattura |
| **Network Status** | Rilevamento connettivita', sync automatico |

**Capacitor Plugins utilizzati:**
- `@capacitor/camera` - Cattura foto/video
- `@capacitor/geolocation` - Coordinate GPS
- `@capacitor/filesystem` - Storage locale
- `@capacitor/network` - Stato connessione
- `@capacitor/preferences` - Cache dati

### 3.4 Classifica Live

```typescript
interface LeaderboardEntry {
  rank: number;
  previousRank?: number;        // Per indicatore trend
  participantName: string;
  teamName?: string;
  totalCatches: number;
  totalWeight: number;          // kg
  biggestCatch?: number;        // kg
  lastCatchTime?: Date;
}
```

**Caratteristiche:**
- Aggiornamenti real-time (WebSocket/polling 30s)
- Indicatori trend (↑ salita, ↓ discesa, - stabile)
- Funzionamento offline con cache locale
- Evidenziazione partecipante corrente

### 3.5 Internazionalizzazione

**24 lingue EU supportate:**

| Codice | Lingua | Codice | Lingua |
|--------|--------|--------|--------|
| bg | Bulgaro | it | Italiano |
| cs | Ceco | lt | Lituano |
| da | Danese | lv | Lettone |
| de | Tedesco | mt | Maltese |
| el | Greco | nl | Olandese |
| en | Inglese | pl | Polacco |
| es | Spagnolo | pt | Portoghese |
| et | Estone | ro | Romeno |
| fi | Finlandese | sk | Slovacco |
| fr | Francese | sl | Sloveno |
| ga | Irlandese | sv | Svedese |
| hr | Croato | hu | Ungherese |

---

## 4. SCHEMA DATABASE

### 4.1 Entita' Principali

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Tenant    │────<│     User     │────<│   Document   │
│  (Club/Fed)  │     │  (Utenti)    │     │ (Documenti)  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Tournament  │────<│Registration  │────<│    Catch     │
│   (Tornei)   │     │ (Iscrizioni) │     │  (Catture)   │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                         │
       │                                         │
       ▼                                         ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ FishingZone  │     │   Species    │     │ Leaderboard  │
│ (Zone pesca) │     │   (Specie)   │     │ (Classifica) │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 4.2 Tabelle Database

| Tabella | Descrizione | Relazioni |
|---------|-------------|-----------|
| `tenants` | Multi-tenant (club/federazioni) | 1:N users, tournaments |
| `users` | Utenti con ruoli | N:1 tenant, 1:N documents, catches |
| `refresh_tokens` | Token JWT refresh | N:1 user |
| `documents` | Documenti utente (licenze, certificati) | N:1 user |
| `tournaments` | Tornei | N:1 tenant, organizer; 1:N zones, catches |
| `fishing_zones` | Zone di pesca GeoJSON | N:1 tournament |
| `species` | Catalogo specie ittiche | 1:N catches |
| `tournament_species` | Specie ammesse per torneo | N:1 tournament, species |
| `tournament_registrations` | Iscrizioni partecipanti | N:1 user, tournament |
| `catches` | Catture con GPS | N:1 user, tournament, species |
| `leaderboard_entries` | Classifica denormalizzata | N:1 tournament |
| `audit_logs` | Log modifiche | - |

### 4.3 Tipi Enum

```typescript
// Ruoli utente
enum UserRole {
  SUPER_ADMIN, TENANT_ADMIN, ORGANIZER, JUDGE, PARTICIPANT
}

// Stato torneo
enum TournamentStatus {
  DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED
}

// Stato cattura
enum CatchStatus {
  PENDING, APPROVED, REJECTED
}

// Tipi documento
enum DocumentType {
  MASAF_LICENSE, MEDICAL_CERTIFICATE, NAUTICAL_LICENSE, IDENTITY_DOCUMENT
}
```

---

## 5. API ENDPOINTS

### 5.1 Autenticazione

| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrazione utente |
| POST | `/api/auth/login` | Login (JWT) |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |

### 5.2 Tornei

| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/tournaments` | Lista tornei |
| GET | `/api/tournaments/:id` | Dettaglio torneo |
| POST | `/api/tournaments` | Crea torneo |
| PUT | `/api/tournaments/:id` | Modifica torneo |
| DELETE | `/api/tournaments/:id` | Elimina torneo |
| POST | `/api/tournaments/:id/publish` | Pubblica torneo |
| POST | `/api/tournaments/:id/start` | Avvia torneo |
| POST | `/api/tournaments/:id/complete` | Completa torneo |
| POST | `/api/tournaments/:id/register` | Iscrivi partecipante |

### 5.3 Zone di Pesca

| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/tournaments/:id/zones` | Lista zone |
| POST | `/api/tournaments/:id/zones` | Crea zona (GeoJSON) |
| PUT | `/api/tournaments/:id/zones/:zoneId` | Modifica zona |
| DELETE | `/api/tournaments/:id/zones/:zoneId` | Elimina zona |

### 5.4 Catture

| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/catches` | Lista catture utente |
| POST | `/api/catches` | Invia cattura (foto + GPS) |
| PATCH | `/api/catches/:id/approve` | Approva cattura (giudice) |
| PATCH | `/api/catches/:id/reject` | Rifiuta cattura (giudice) |

### 5.5 Classifica

| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/leaderboard/:tournamentId` | Classifica torneo |

---

## 6. SICUREZZA

### 6.1 Autenticazione JWT

```typescript
// Struttura token
{
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  iat: number;
  exp: number;
}
```

### 6.2 Middleware Sicurezza

- **Helmet** - Headers sicurezza HTTP
- **CORS** - Controllo origini
- **bcrypt** - Hash password (cost 12)
- **express-validator** - Validazione input

### 6.3 Multi-tenant Isolation

Ogni query include filtro `tenantId` per isolare i dati tra organizzazioni.

---

## 7. CONFIGURAZIONE

### 7.1 Variabili d'Ambiente

**Backend (.env):**
```env
DATABASE_URL="mysql://user:pass@localhost:3306/tournamentmaster"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
PORT=3001
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://192.168.1.74:3001
```

### 7.2 CORS Configurazione

```typescript
const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.1.74:3000",
  "capacitor://localhost",
  "http://localhost"
];
```

---

## 8. DEPLOYMENT

### 8.1 Requisiti

- Node.js 18+
- MariaDB 10.4+ / MySQL 8+
- 2GB RAM minimo

### 8.2 Comandi Avvio

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# Mobile (development)
cd mobile
npm install
npx expo start
```

### 8.3 Build Produzione

```bash
# Backend
npm run build
npm start

# Frontend
npm run build
npm start

# Mobile APK
cd frontend && npm run build
npx cap sync android
# Build via Android Studio
```

---

## 9. TESTING

### 9.1 Test Manuali

```bash
# Sintassi TypeScript
npx tsc --noEmit

# Build frontend
npm run build

# Prisma schema
npx prisma validate
```

### 9.2 URLs di Test

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Prisma Studio: `npx prisma studio`

---

## 10. ROADMAP FUTURA

| Priorita' | Feature | Stato |
|-----------|---------|-------|
| Alta | Pagamenti Stripe | Pianificato |
| Alta | Push notifications | Pianificato |
| Media | WebSocket real-time | In sviluppo |
| Media | Export PDF classifiche | Pianificato |
| Bassa | PWA offline completa | Pianificato |
| Bassa | Analytics dashboard | Pianificato |

---

## 11. CONTATTI E SUPPORTO

**Repository:** https://github.com/Marinovinc/TournamentMaster

**Release APK:** https://github.com/Marinovinc/TournamentMaster/releases

---

*Documento generato il 2025-12-30*
