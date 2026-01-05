# TournamentMaster - Documento Tecnico Completo

**Versione:** 1.0.0
**Data:** 4 Gennaio 2026
**Repository:** https://github.com/Marinovinc/TournamentMaster

---

## Indice

1. [Panoramica del Progetto](#1-panoramica-del-progetto)
2. [Architettura del Sistema](#2-architettura-del-sistema)
3. [Stack Tecnologico](#3-stack-tecnologico)
4. [Applicazioni Sviluppate](#4-applicazioni-sviluppate)
5. [Sorgenti e Repository](#5-sorgenti-e-repository)
6. [Ambienti di Sviluppo](#6-ambienti-di-sviluppo)
7. [Deploy e Hosting](#7-deploy-e-hosting)
8. [Download e Installazione App](#8-download-e-installazione-app)
9. [Credenziali di Test](#9-credenziali-di-test)
10. [Guide Utente](#10-guide-utente)

---

## 1. Panoramica del Progetto

**TournamentMaster** e una piattaforma SaaS completa per la gestione di tornei di pesca sportiva. Il sistema e progettato per supportare:

- **Organizzatori**: Creazione e gestione tornei, iscrizioni, regolamenti
- **Partecipanti**: Registrazione catture con foto/video geolocalizzate
- **Giudici**: Validazione catture e gestione controversie
- **Societa di pesca**: Gestione multi-tenant con branding personalizzato

### Funzionalita Principali

| Funzionalita | Descrizione |
|--------------|-------------|
| Gestione Tornei | Creazione, configurazione, ciclo di vita completo |
| Registrazione Catture | Foto/video con metadati GPS e timestamp |
| Classifica Live | Aggiornamento in tempo reale via WebSocket |
| Gestione Barche | Equipaggio, ispettori, zone di pesca |
| Multi-tenant | Supporto piu societa con branding separato |
| Ruoli Utente | Super Admin, Admin, Presidente, Organizzatore, Giudice, Partecipante |

---

## 2. Architettura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Web App       │  │   Mobile iOS    │  │  Mobile Android │  │
│  │   (Next.js)     │  │   (Expo Go)     │  │     (APK)       │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼─────────────────────┼─────────────────────┼─────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Express)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ REST API     │  │ WebSocket    │  │ File Upload          │   │
│  │ /api/v1/*    │  │ Socket.io    │  │ Cloudinary           │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    MySQL/MariaDB                          │   │
│  │                    (via Prisma ORM)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Stack Tecnologico

### 3.1 Backend

| Tecnologia | Versione | Scopo |
|------------|----------|-------|
| Node.js | 18.x+ | Runtime JavaScript |
| Express | 5.2.1 | Framework web |
| TypeScript | 5.x | Tipizzazione statica |
| Prisma | 5.22.0 | ORM per database |
| Socket.io | 4.8.3 | WebSocket real-time |
| JWT | 9.0.3 | Autenticazione token |
| Cloudinary | 2.8.0 | Storage media cloud |
| Sharp | 0.34.5 | Elaborazione immagini |
| PDFKit | 0.17.2 | Generazione PDF |

### 3.2 Frontend Web

| Tecnologia | Versione | Scopo |
|------------|----------|-------|
| Next.js | 16.1.1 | Framework React SSR |
| React | 19.2.3 | UI Library |
| TypeScript | 5.x | Tipizzazione |
| Tailwind CSS | 4.x | Styling utility-first |
| Radix UI | Latest | Componenti accessibili |
| next-intl | 4.6.1 | Internazionalizzazione |
| Recharts | 3.6.0 | Grafici e statistiche |
| Zod | 4.2.1 | Validazione schema |

### 3.3 Mobile App

| Tecnologia | Versione | Scopo |
|------------|----------|-------|
| React Native | 0.81.5 | Framework mobile |
| Expo | SDK 54 | Build e distribuzione |
| React Navigation | 6.x | Navigazione |
| Zustand | 4.4.7 | State management |
| Axios | 1.6.5 | HTTP client |
| expo-camera | 17.0.10 | Accesso fotocamera |
| expo-location | 19.0.8 | Geolocalizzazione |

### 3.4 Database

| Tecnologia | Versione | Scopo |
|------------|----------|-------|
| MySQL | 8.x | Database principale |
| Prisma | 5.22.0 | ORM e migrazioni |

### 3.5 Infrastruttura

| Servizio | Scopo |
|----------|-------|
| Railway | Hosting backend + database |
| Vercel | Hosting frontend (opzionale) |
| Cloudinary | Storage immagini/video |
| Expo EAS | Build app mobile |
| GitHub | Version control |

---

## 4. Applicazioni Sviluppate

### 4.1 Web Application

| Caratteristica | Dettaglio |
|----------------|-----------|
| **URL Produzione** | https://tournamentmaster.app |
| **Framework** | Next.js 16 con App Router |
| **Rendering** | SSR + Client Components |
| **Lingue** | Italiano, Inglese, Tedesco |
| **PWA** | Supporto installazione |
| **Responsive** | Mobile-first design |

### 4.2 Mobile App Android

| Caratteristica | Dettaglio |
|----------------|-----------|
| **Package** | com.tournamentmaster.app |
| **Versione** | 1.0.0 (versionCode 1) |
| **Min SDK** | Android 7.0 (API 24) |
| **Target SDK** | Android 14 (API 36) |
| **Distribuzione** | APK diretto |
| **Dimensione** | ~50 MB |

**Permessi richiesti:**
- Camera (foto catture)
- Posizione (GPS catture)
- Storage (salvataggio foto)
- Audio (registrazione video)

### 4.3 Mobile App iOS

| Caratteristica | Dettaglio |
|----------------|-----------|
| **Bundle ID** | com.tournamentmaster.app |
| **Versione** | 1.0.0 |
| **Min iOS** | 13.0 |
| **Distribuzione** | Expo Go (sviluppo) |

---

## 5. Sorgenti e Repository

### 5.1 Repository GitHub

```
https://github.com/Marinovinc/TournamentMaster
```

### 5.2 Struttura Directory

```
TournamentMaster/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── controllers/     # Logic controllers
│   │   ├── middleware/      # Auth, validation
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   └── index.ts         # Entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Seed data
│   └── package.json
│
├── frontend/                # Next.js Web App
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── contexts/        # Auth, theme contexts
│   │   ├── lib/             # Utilities
│   │   └── messages/        # i18n translations
│   └── package.json
│
├── mobile/                  # React Native + Expo
│   ├── src/
│   │   ├── screens/         # App screens
│   │   ├── components/      # UI components
│   │   ├── navigation/      # React Navigation
│   │   ├── services/        # API calls
│   │   └── stores/          # Zustand stores
│   ├── assets/              # Icons, splash
│   ├── app.json             # Expo config
│   ├── eas.json             # EAS Build config
│   └── package.json
│
├── docs/                    # Documentazione
├── screenshots/             # Screenshot app
└── README.md
```

### 5.3 Branch Strategy

| Branch | Scopo |
|--------|-------|
| `master` | Produzione stabile |
| `develop` | Sviluppo attivo |
| `feature/*` | Nuove funzionalita |
| `fix/*` | Bug fix |

---

## 6. Ambienti di Sviluppo

### 6.1 Requisiti Sistema

| Software | Versione | Download |
|----------|----------|----------|
| Node.js | 18.x+ | https://nodejs.org |
| npm | 9.x+ | (incluso con Node.js) |
| Git | 2.x+ | https://git-scm.com |
| MySQL | 8.x | https://mysql.com |
| VS Code | Latest | https://code.visualstudio.com |

### 6.2 Strumenti Sviluppo Mobile

| Strumento | Scopo | Download |
|-----------|-------|----------|
| Expo CLI | Build e test | `npm install -g expo-cli` |
| EAS CLI | Build cloud | `npm install -g eas-cli` |
| Android Studio | Emulatore Android | https://developer.android.com/studio |
| Xcode | Build iOS (Mac only) | App Store |
| Expo Go | Test su device | Play Store / App Store |

### 6.3 IDE e Estensioni Consigliate

**VS Code Extensions:**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- React Native Tools
- Thunder Client (API testing)

### 6.4 Setup Sviluppo Locale

```bash
# 1. Clone repository
git clone https://github.com/Marinovinc/TournamentMaster.git
cd TournamentMaster

# 2. Setup Backend
cd backend
npm install
cp .env.example .env
# Configura DATABASE_URL in .env
npx prisma generate
npx prisma db push
npm run dev

# 3. Setup Frontend (nuovo terminale)
cd frontend
npm install
npm run dev

# 4. Setup Mobile (nuovo terminale)
cd mobile
npm install
npx expo start
```

---

## 7. Deploy e Hosting

### 7.1 Backend - Railway

| Parametro | Valore |
|-----------|--------|
| **URL API** | https://backend-production-70dd0.up.railway.app |
| **Database** | MySQL su Railway |
| **Deploy** | Automatico da GitHub |

### 7.2 Frontend - Railway/Vercel

| Parametro | Valore |
|-----------|--------|
| **URL** | https://tournamentmaster.app |
| **Build** | `npm run build` |
| **Framework** | Next.js |

### 7.3 Mobile - Expo EAS

| Parametro | Valore |
|-----------|--------|
| **Account** | marinovinc |
| **Project ID** | 0a5f2e21-ef12-4c5a-8f3c-bf8e86ada779 |
| **Build Profile** | preview (APK), production (AAB) |

---

## 8. Download e Installazione App

### 8.1 Android APK

**Link Download Diretto:**
```
https://expo.dev/artifacts/eas/gc1YShEvTAqQq4C27sSGx4.apk
```

**Pagina Build EAS:**
```
https://expo.dev/accounts/marinovinc/projects/tournamentmaster/builds/7b02dd98-2f8d-43c2-9a1e-099e8722f919
```

**QR Code per Download:**

Scansiona il QR code nella pagina: `mobile/apk_qrcode.html`

### 8.2 iOS (Expo Go)

1. Installa **Expo Go** dall'App Store
2. Scansiona il QR code da `npx expo start`
3. L'app si carica automaticamente

### 8.3 Web Application

**URL Produzione:**
```
https://tournamentmaster.app
```

---

## 9. Credenziali di Test

### 9.1 Account Demo

| Ruolo | Email | Password |
|-------|-------|----------|
| Super Admin | admin@tournamentmaster.com | Admin123! |
| Organizzatore | organizer@test.com | Test123! |
| Partecipante | user@test.com | Test123! |

### 9.2 Database Locale

```
Host: localhost
Port: 3306
Database: tournamentmaster
User: root
Password: (vuota o configurata)
```

---

## 10. Guide Utente

### 10.1 Guida Mobile

**File:** `docs/GUIDA_UTENTE_MOBILE.html`

Contenuti:
- Download e installazione APK
- Primo accesso e registrazione
- Partecipazione a tornei
- Registrazione catture
- Visualizzazione classifica

### 10.2 Guida Web

**File:** `docs/GUIDA_UTENTE_WEB.html`

Contenuti:
- Accesso alla piattaforma
- Dashboard organizzatore
- Creazione tornei
- Gestione partecipanti
- Report e statistiche

---

## Appendice A - API Endpoints Principali

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | /api/v1/auth/login | Login utente |
| POST | /api/v1/auth/register | Registrazione |
| GET | /api/v1/tournaments | Lista tornei |
| POST | /api/v1/tournaments | Crea torneo |
| GET | /api/v1/catches | Lista catture |
| POST | /api/v1/catches | Registra cattura |
| GET | /api/v1/leaderboard/:id | Classifica torneo |

---

## Appendice B - Contatti e Supporto

| Canale | Contatto |
|--------|----------|
| Repository | https://github.com/Marinovinc/TournamentMaster |
| Issues | https://github.com/Marinovinc/TournamentMaster/issues |

---

*Documento generato automaticamente - TournamentMaster v1.0.0*
