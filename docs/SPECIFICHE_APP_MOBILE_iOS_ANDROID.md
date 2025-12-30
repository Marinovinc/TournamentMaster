# SPECIFICHE APP MOBILE - TournamentMaster
## iOS & Android Native Apps

**Versione:** 1.0.0
**Data:** 2025-12-30
**Basato su:** Analisi CatchStat, FishDonkey, Fishing Chaos, eTournament, FishChamp, TourneyX Pro

---

## 1. PANORAMICA

### 1.1 Obiettivo
Sviluppare app native iOS e Android per TournamentMaster che permettano ai partecipanti di:
- Seguire tornei in tempo reale
- Sottomettere catture con foto/video verificabili
- Ricevere notifiche push live
- Operare anche offline (modalità barca)

### 1.2 Target Users
| Ruolo | Funzionalità Principali |
|-------|------------------------|
| **Partecipante** | Submit catture, view leaderboard, notifiche |
| **Giudice** | Validare catture, approvare/rifiutare |
| **Organizzatore** | Gestire torneo, broadcast messaggi |
| **Spettatore** | Seguire classifiche live (no login) |

### 1.3 Piattaforme Target
- **iOS**: 15.0+ (iPhone, iPad)
- **Android**: API 26+ (Android 8.0 Oreo)
- **Tecnologia consigliata**: React Native o Flutter (codebase condiviso)

---

## 2. ARCHITETTURA FUNZIONALE

### 2.1 Moduli Principali

```
┌─────────────────────────────────────────────────────────┐
│                    APP TOURNAMENTMASTER                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   AUTH      │  │  TOURNAMENTS│  │   CATCHES   │     │
│  │  Module     │  │   Module    │  │   Module    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ LEADERBOARD │  │   OFFLINE   │  │   PUSH      │     │
│  │   Module    │  │   Sync      │  │ Notifications│     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   CAMERA    │  │    GPS      │  │   MEDIA     │     │
│  │  Capture    │  │ Validation  │  │   Upload    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. FUNZIONALITÀ DETTAGLIATE

### 3.1 Autenticazione (AUTH Module)

#### 3.1.1 Login
- Email + Password
- Biometric (Face ID / Touch ID / Fingerprint)
- "Ricordami" con refresh token sicuro
- Social login (opzionale fase 2): Google, Apple Sign-In

#### 3.1.2 Registrazione
- Form: Nome, Cognome, Email, Password, Telefono
- Numero licenza FIPSAS/MASAF (opzionale)
- Verifica email con OTP
- Accettazione termini e privacy

#### 3.1.3 Sessione
- JWT access token (15 min expiry)
- Refresh token sicuro in Keychain/Keystore
- Auto-refresh trasparente
- Logout da tutti i dispositivi

---

### 3.2 Tornei (TOURNAMENTS Module)

#### 3.2.1 Lista Tornei
```
┌─────────────────────────────────────┐
│ 🏆 Tornei                    [🔍]  │
├─────────────────────────────────────┤
│ [In Corso] [Prossimi] [Conclusi]   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔴 LIVE                         │ │
│ │ Trofeo Mare Adriatico 2025     │ │
│ │ 📍 Rimini | 🎣 Big Game        │ │
│ │ 👥 45/60 partecipanti          │ │
│ │ ⏱️ Termina tra 4h 32m          │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 📅 15 Gen 2025                  │ │
│ │ Campionato Invernale Traina    │ │
│ │ 📍 Pescara | 🎣 Traina Costiera│ │
│ │ 💰 €50 iscrizione              │ │
│ │ [ISCRIVITI]                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 3.2.2 Dettaglio Torneo
- Header con banner immagine
- Info: date, location, disciplina, regolamento
- Mappa zone di pesca (GeoJSON rendered)
- Lista partecipanti iscritti
- Classifica live (se in corso)
- Bottone "Iscriviti" / "Le Mie Catture"
- Sezione premi e payout

#### 3.2.3 Iscrizione Torneo
- Form dati team/barca
- Pagamento integrato (Stripe)
- Conferma con QR code per check-in
- Reminder push pre-torneo

---

### 3.3 Catture (CATCHES Module) ⭐ CORE FEATURE

#### 3.3.1 Flusso Submission Cattura

```
┌──────────────────────────────────────────────────────────┐
│                    SUBMIT CATCH FLOW                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌───────┐│
│  │ CAPTURE │───▶│ MEASURE │───▶│ DETAILS │───▶│SUBMIT ││
│  │ Photo/  │    │  Fish   │    │  Add    │    │ Queue ││
│  │ Video   │    │         │    │  Info   │    │       ││
│  └─────────┘    └─────────┘    └─────────┘    └───────┘│
│       │              │              │              │    │
│       ▼              ▼              ▼              ▼    │
│  [GPS Lock]    [AI Assist]   [Species]    [Offline   │
│  [Timestamp]   [Length Est]  [Weight]      Sync]     │
│  [EXIF Data]                 [Notes]                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 3.3.2 Cattura Foto/Video

**Requisiti Foto:**
- Risoluzione minima: 1920x1080
- Formato: JPEG con qualità 85%+
- EXIF data preservati (timestamp, GPS, device info)
- Watermark automatico: data/ora + coordinate GPS
- Guida posizionamento pesce (overlay metro virtuale)

**Requisiti Video:**
- Durata: 5-30 secondi
- Risoluzione: 1080p minimum
- Formato: MP4 H.264
- Audio opzionale
- Timestamp visibile in overlay

**Anti-Cheating Measures:**
```
┌─────────────────────────────────────────────────┐
│           VALIDAZIONE ANTI-FRODE                │
├─────────────────────────────────────────────────┤
│ ✅ GPS Lock obbligatorio prima dello scatto    │
│ ✅ Timestamp criptato nei metadati             │
│ ✅ Device ID univoco embedded                   │
│ ✅ Hash SHA-256 dell'immagine originale        │
│ ✅ Verifica zona pesca (point-in-polygon)      │
│ ✅ Controllo time window torneo                │
│ ✅ Rilevamento modifica post-scatto            │
│ ✅ Blocco gallery import (solo camera live)    │
└─────────────────────────────────────────────────┘
```

#### 3.3.3 Schermata Cattura

```
┌─────────────────────────────────────┐
│ ← Submit Cattura        [Annulla]  │
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │
│   │      [FOTO PESCE]          │   │
│   │                             │   │
│   │   ───────────────────────   │   │
│   │   GUIDA: Posiziona il pesce │   │
│   │   lungo la linea di misura  │   │
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
│   📍 GPS: 44.0647° N, 12.5736° E   │
│   ✅ Dentro zona "Mare Adriatico"  │
│   🕐 14:32:45 - 30/12/2025         │
│                                     │
│   [📷 Foto] [🎥 Video] [📁 +Media] │
│                                     │
├─────────────────────────────────────┤
│ Specie: [Seleziona...         ▼]   │
│ Peso:   [___] kg  (stima: 4.2 kg)  │
│ Lungh:  [___] cm  (stima: 65 cm)   │
│ Note:   [________________________] │
├─────────────────────────────────────┤
│         [🐟 INVIA CATTURA]          │
└─────────────────────────────────────┘
```

#### 3.3.4 Digital Livewell (Offline Mode)

**Funzionamento:**
1. Check-in torneo mentre online (scarica regole, zone, specie)
2. Modalità offline attiva automaticamente senza connessione
3. Catture salvate localmente con tutti i metadati
4. Sync automatico quando connessione ristabilita
5. Indicatore visivo catture in coda

**Storage Locale:**
```javascript
// Struttura cattura offline
{
  localId: "uuid-v4",
  tournamentId: "...",
  capturedAt: "ISO-8601",
  gps: { lat, lng, accuracy, altitude },
  photos: [{ localPath, hash, exifData }],
  videos: [{ localPath, hash, duration }],
  species: "speciesId",
  weight: 4.5,
  length: 65,
  deviceId: "...",
  syncStatus: "pending|syncing|synced|failed",
  createdAt: "ISO-8601"
}
```

---

### 3.4 Validazione GPS (GPS Module)

#### 3.4.1 Requisiti GPS
- Accuracy minima: 50 metri (configurabile per torneo)
- Timeout acquisizione: 30 secondi
- Fallback: last known location se < 5 minuti
- Altitude tracking (per tornei con limiti batimetrici)

#### 3.4.2 Zone Validation
```
┌─────────────────────────────────────────────────┐
│              POINT-IN-POLYGON CHECK             │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Ricevi coordinate GPS cattura              │
│  2. Carica GeoJSON zone torneo (cached)        │
│  3. Algoritmo ray-casting per ogni zona        │
│  4. Risultato: INSIDE / OUTSIDE / BOUNDARY     │
│  5. Se OUTSIDE: warning + possibilità submit   │
│     (sarà rifiutata dal giudice)              │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 3.4.3 Mappa Zone
- Visualizzazione zone pesca su mappa
- Posizione corrente utente
- Indicatore distanza dal confine zona
- Colori: Verde (dentro), Rosso (fuori), Giallo (confine)

---

### 3.5 Classifica Live (LEADERBOARD Module)

#### 3.5.1 Schermata Classifica

```
┌─────────────────────────────────────┐
│ 🏆 Classifica Live      [⟳ 30s]   │
│ Trofeo Mare Adriatico 2025         │
├─────────────────────────────────────┤
│ [Generale] [Per Specie] [Team]     │
├─────────────────────────────────────┤
│ 🥇 1. Marco Rossi                  │
│    Team Pescatori Rimini           │
│    🐟 8 catture | ⚖️ 34.5 kg       │
│    🏆 345 punti                    │
├─────────────────────────────────────┤
│ 🥈 2. Luigi Bianchi                │
│    Team Mare Blu                   │
│    🐟 6 catture | ⚖️ 28.2 kg       │
│    🏆 282 punti                    │
├─────────────────────────────────────┤
│ 🥉 3. Anna Verdi                   │
│    Team Delfino                    │
│    🐟 7 catture | ⚖️ 25.8 kg       │
│    🏆 258 punti                    │
├─────────────────────────────────────┤
│    ...                             │
│ ─────────────────────────────────── │
│ 📍 Tu: #12 | 🐟 3 | ⚖️ 8.4 kg     │
└─────────────────────────────────────┘
```

#### 3.5.2 Aggiornamenti Real-time
- WebSocket connection per update live
- Polling fallback ogni 30 secondi
- Animazione quando posizione cambia
- Notifica push se entri in top 10

#### 3.5.3 Filtri e Viste
- Per specie (pesce più grande per tipo)
- Per team
- Per categoria (se presente)
- Storico movimenti posizione

---

### 3.6 Notifiche Push (NOTIFICATIONS Module)

#### 3.6.1 Tipi di Notifica

| Evento | Titolo | Priorità |
|--------|--------|----------|
| Nuova cattura validata | "🐟 Cattura approvata!" | Alta |
| Cattura rifiutata | "❌ Cattura non valida" | Alta |
| Cambio posizione classifica | "📈 Sei salito al #5!" | Media |
| Torneo sta per iniziare | "🏁 Il torneo inizia tra 1h" | Alta |
| Torneo terminato | "🏆 Torneo concluso!" | Alta |
| Messaggio organizzatore | "📢 [Messaggio]" | Media |
| Nuovo iscritto team | "👋 Mario si è unito" | Bassa |

#### 3.6.2 Preferenze Notifiche
- Toggle per ogni tipo
- Modalità silenziosa durante pesca
- Suoni personalizzati
- Vibrazione patterns

---

### 3.7 Profilo Utente

#### 3.7.1 Schermata Profilo
```
┌─────────────────────────────────────┐
│        [AVATAR]                     │
│      Mario Rossi                    │
│   mario.rossi@email.com            │
│   📱 +39 333 1234567               │
│   🎣 FIPSAS: 123456                │
├─────────────────────────────────────┤
│ STATISTICHE                        │
│ 🏆 12 tornei partecipati           │
│ 🐟 87 catture totali               │
│ ⚖️ 234.5 kg totali                 │
│ 🥇 3 vittorie                      │
├─────────────────────────────────────┤
│ DOCUMENTI                          │
│ ✅ Licenza MASAF (val. 31/12/25)   │
│ ✅ Certificato medico              │
│ ⚠️ Patente nautica (scaduta)       │
│ [+ Carica documento]               │
├─────────────────────────────────────┤
│ [⚙️ Impostazioni]                  │
│ [📤 Logout]                        │
└─────────────────────────────────────┘
```

---

## 4. FUNZIONALITÀ GIUDICE

### 4.1 Dashboard Giudice
```
┌─────────────────────────────────────┐
│ 👨‍⚖️ Pannello Giudice              │
│ Trofeo Mare Adriatico 2025         │
├─────────────────────────────────────┤
│ IN ATTESA: 12  |  OGGI: 45         │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ⏳ Mario Rossi - 14:32          │ │
│ │ Tonno rosso | 8.5 kg dichiarati │ │
│ │ [📷 Vedi] [✅ Approva] [❌ Rif.]│ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ⏳ Luigi Bianchi - 14:28        │ │
│ │ Ricciola | 5.2 kg dichiarati    │ │
│ │ [📷 Vedi] [✅ Approva] [❌ Rif.]│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 4.2 Review Cattura
- Foto/video full-screen con zoom
- Metadati: GPS, timestamp, device
- Mappa con posizione cattura
- Verifica automatica zona
- Correzione peso/lunghezza
- Note di rifiuto obbligatorie

---

## 5. REQUISITI TECNICI

### 5.1 Permessi Richiesti

**iOS (Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>Per fotografare le catture durante i tornei</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Per validare la posizione delle catture</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>Per tracking continuo durante il torneo</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Per salvare le foto delle catture</string>
<key>NSMicrophoneUsageDescription</key>
<string>Per registrare video con audio</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/>
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
```

### 5.2 Storage

| Dato | Storage | Encryption |
|------|---------|------------|
| JWT Tokens | Keychain/Keystore | AES-256 |
| User profile | SQLite | No |
| Offline catches | SQLite + FileSystem | AES-256 |
| Cached images | FileSystem | No |
| Settings | UserDefaults/SharedPrefs | No |

### 5.3 Networking

- Base URL: `https://api.tournamentmaster.app/v1`
- WebSocket: `wss://ws.tournamentmaster.app`
- Retry policy: Exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Timeout: 30s per request
- Certificate pinning: Obbligatorio

### 5.4 Offline Capabilities

| Funzionalità | Offline | Sync Required |
|--------------|---------|---------------|
| Login | ❌ | - |
| View tornei cached | ✅ | No |
| View classifica cached | ✅ | No |
| Submit cattura | ✅ | Yes (queue) |
| View proprie catture | ✅ | No |
| Ricevi notifiche | ❌ | - |

---

## 6. UI/UX GUIDELINES

### 6.1 Design System
- Basato su design system TournamentMaster web
- Colori: Primary #0066CC, Secondary #00AA66
- Font: Inter (system fallback)
- Icons: Lucide React Native
- Dark mode supportato

### 6.2 Accessibilità
- VoiceOver/TalkBack support
- Dynamic Type (iOS) / Font scaling (Android)
- Contrasto minimo 4.5:1
- Touch target minimo 44x44 pt

### 6.3 Animazioni
- Transizioni fluide 300ms
- Skeleton loading per liste
- Pull-to-refresh
- Haptic feedback per azioni importanti

---

## 7. SICUREZZA

### 7.1 Autenticazione
- JWT con refresh token rotation
- Biometric authentication opzionale
- Session timeout configurabile
- Device binding (opzionale)

### 7.2 Anti-Tampering
- Jailbreak/Root detection
- SSL Certificate pinning
- Code obfuscation (ProGuard/R8)
- Integrity check immagini

### 7.3 Data Protection
- Encryption at rest per dati sensibili
- No sensitive data in logs
- Secure clipboard handling
- Screenshot prevention (schermate sensibili)

---

## 8. ANALYTICS & MONITORING

### 8.1 Eventi Tracciati
- App open/close
- Screen views
- Catch submission (success/failure)
- GPS accuracy issues
- Offline sync events
- Crash reports

### 8.2 Tools Consigliati
- Firebase Analytics + Crashlytics
- Sentry per error tracking
- Custom backend analytics

---

## 9. ROADMAP SVILUPPO

### Fase 1: MVP (8-10 settimane)
- [ ] Auth (login, register, logout)
- [ ] Lista tornei
- [ ] Dettaglio torneo
- [ ] Classifica live (view only)
- [ ] Push notifications base

### Fase 2: Core Features (6-8 settimane)
- [ ] Catch submission con foto
- [ ] GPS validation
- [ ] Offline mode base
- [ ] Profilo utente

### Fase 3: Advanced (6-8 settimane)
- [ ] Video submission
- [ ] Digital Livewell completo
- [ ] Giudice dashboard
- [ ] Anti-cheating avanzato

### Fase 4: Polish (4 settimane)
- [ ] Performance optimization
- [ ] UI/UX refinement
- [ ] Beta testing
- [ ] Store submission

---

## 10. APPENDICE

### 10.1 API Endpoints Richiesti

```
POST   /auth/login
POST   /auth/register
POST   /auth/refresh
POST   /auth/logout

GET    /tournaments
GET    /tournaments/:id
GET    /tournaments/:id/leaderboard
GET    /tournaments/:id/zones
POST   /tournaments/:id/register

POST   /catches
GET    /catches/my
GET    /catches/:id
PUT    /catches/:id (judge only)

GET    /users/me
PUT    /users/me
POST   /users/me/documents

WS     /ws/tournament/:id/leaderboard
```

### 10.2 Riferimenti Competitor

- [CatchStat iOS](https://apps.apple.com/us/app/catchstat/id1470488683)
- [CatchStat Android](https://play.google.com/store/apps/details?id=com.catchstat.catchstat)
- [FishDonkey](https://www.fishdonkey.com/)
- [Fishing Chaos](https://www.fishingchaos.com/)
- [eTournament Fishing](https://apps.apple.com/us/app/etournament-fishing/id1623026868)
- [FishChamp](https://apps.apple.com/us/app/fishchamp-fishing-challenges/id1189323589)
- [TourneyX Pro](https://play.google.com/store/apps/details?id=com.tourneyx.pro)

---

*Documento generato il 2025-12-30*
*TournamentMaster - Piattaforma SaaS Tornei di Pesca*

## 11. CONFIGURAZIONE SVILUPPO LOCALE

### 11.1 Architettura Servizi

```
+-------------------------------------------------------------------+
|                    AMBIENTE SVILUPPO LOCALE                        |
+-------------------------------------------------------------------+
|                                                                    |
|  +------------------+     +------------------+                     |
|  |   FRONTEND       |     |   BACKEND API    |                     |
|  |   Next.js 16     |---->|   Express.js 5   |                     |
|  |                  |     |                  |                     |
|  | localhost:3000   |     | localhost:3001   |                     |
|  +------------------+     +--------+---------+                     |
|                                    |                               |
|                           +--------v---------+                     |
|                           |    DATABASE      |                     |
|                           |   MySQL/MariaDB  |                     |
|                           |                  |                     |
|                           | localhost:3306   |                     |
|                           | db: tournamentmaster                   |
|                           +------------------+                     |
|                                                                    |
+-------------------------------------------------------------------+
```

### 11.2 URL Base per Ambiente

**Configurazione app mobile (config.ts o .env):**

```typescript
// src/config/environment.ts

interface Environment {
  apiBaseUrl: string;
  wsBaseUrl: string;
  frontendUrl: string;
}

const environments: Record<string, Environment> = {
  // Sviluppo locale (emulatore/simulatore)
  development: {
    apiBaseUrl: "http://10.0.2.2:3001/api/v1",    // Android Emulator
    // apiBaseUrl: "http://localhost:3001/api/v1", // iOS Simulator
    wsBaseUrl: "ws://10.0.2.2:3001",
    frontendUrl: "http://10.0.2.2:3000",
  },

  // Sviluppo con device fisico (usa IP della macchina)
  development_device: {
    apiBaseUrl: "http://192.168.1.XXX:3001/api/v1",  // Sostituisci con IP locale
    wsBaseUrl: "ws://192.168.1.XXX:3001",
    frontendUrl: "http://192.168.1.XXX:3000",
  },

  // Staging
  staging: {
    apiBaseUrl: "https://api-staging.tournamentmaster.app/v1",
    wsBaseUrl: "wss://ws-staging.tournamentmaster.app",
    frontendUrl: "https://staging.tournamentmaster.app",
  },

  // Produzione
  production: {
    apiBaseUrl: "https://api.tournamentmaster.app/v1",
    wsBaseUrl: "wss://ws.tournamentmaster.app",
    frontendUrl: "https://tournamentmaster.app",
  },
};

export const config = environments[process.env.NODE_ENV || "development"];
```

### 11.3 Nota Speciale: Android Emulator

**IMPORTANTE:** L'emulatore Android usa `10.0.2.2` per riferirsi al `localhost` della macchina host.

| Piattaforma | localhost della macchina |
|-------------|-------------------------|
| iOS Simulator | `localhost` o `127.0.0.1` |
| Android Emulator | `10.0.2.2` |
| Device Fisico | IP LAN (es. `192.168.1.100`) |

### 11.4 Avvio Servizi Sviluppo

```bash
# Terminal 1: Backend API
cd backend
npm run dev
# Output: Server running on http://localhost:3001

# Terminal 2: Frontend Web (per test/debug)
cd frontend
npm run dev
# Output: Server running on http://localhost:3000

# Terminal 3: Database (se non gia attivo)
# XAMPP/MAMP o:
mysql.server start  # macOS
net start mysql     # Windows
```

### 11.5 Test Connessione da App Mobile

**Verifica che il backend sia raggiungibile:**

```bash
# Da terminale macchina host
curl http://localhost:3001/api/v1/health

# Da ADB shell (Android emulator)
adb shell curl http://10.0.2.2:3001/api/v1/health
```

**Endpoint health check consigliato nel backend:**

```typescript
// backend/src/routes/health.routes.ts
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0"
  });
});
```

### 11.6 CORS Configuration (Backend)

Il backend deve accettare richieste dall'app mobile:

```typescript
// backend/src/app.ts
import cors from "cors";

app.use(cors({
  origin: [
    "http://localhost:3000",      // Frontend web dev
    "http://10.0.2.2:3000",       // Android emulator
    "capacitor://localhost",      // Capacitor iOS
    "ionic://localhost",          // Ionic
    // In produzione: URL specifiche dell'app
  ],
  credentials: true,
}));
```

### 11.7 Variabili Ambiente Backend (.env)

```env
# Database
DATABASE_URL="mysql://root:@localhost:3306/tournamentmaster"

# JWT
JWT_SECRET="dev-secret-key-change-in-production-12345"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Server
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### 11.8 Debug Network (React Native / Flutter)

**React Native - Flipper:**
```bash
# Installa Flipper desktop app
# Abilita in app:
# android/app/src/debug/java/.../ReactNativeFlipper.java
```

**Flutter - DevTools:**
```bash
flutter pub global activate devtools
flutter pub global run devtools
```

---
