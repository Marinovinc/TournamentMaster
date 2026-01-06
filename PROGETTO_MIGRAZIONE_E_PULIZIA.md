# Progetto: Migrazione e Pulizia TournamentMaster

**Data creazione:** 2026-01-06
**Versione:** 1.1
**Stato:** Da Implementare
**Priorita:** ALTA

---

## INDICE

1. [Obiettivi](#1-obiettivi)
2. [Analisi Situazione Attuale](#2-analisi-situazione-attuale)
3. [File da Archiviare](#3-file-da-archiviare)
4. [Procedura di Migrazione](#4-procedura-di-migrazione)
5. [Dipendenze Esterne - Procedure Adeguamento](#5-dipendenze-esterne---procedure-adeguamento)
6. [Script Automatizzati](#6-script-automatizzati)
7. [Checklist Verifica](#7-checklist-verifica)
8. [Rollback Plan](#8-rollback-plan)
9. [Rischi e Mitigazioni](#9-rischi-e-mitigazioni)

---

## 1. OBIETTIVI

### 1.1 Obiettivo Principale
Spostare il progetto TournamentMaster da:
```
C:\Users\marin\Downloads\TournamentMaster
```
A:
```
D:\Dev\TournamentMaster
```

### 1.2 Benefici Attesi

| Beneficio | Impatto |
|-----------|---------|
| Path piu corto | -30 caratteri = migliore compatibilita Windows |
| Fuori da Downloads | Evita cancellazioni accidentali |
| Organizzazione | Tutti i progetti dev in un'unica location |
| Claude Code stabile | Meno interruzioni silenziose |
| Backup piu semplice | D:\ separato da sistema |

### 1.3 Obiettivi Secondari
- Archiviare file obsoleti (screenshot test, banner, temp)
- Ridurre dimensione progetto da 1.6GB a ~500MB (escluso node_modules)
- Aggiornare tutte le dipendenze esterne con nuovi path
- Documentare tutti gli IP hardcoded da aggiornare

---

## 2. ANALISI SITUAZIONE ATTUALE

### 2.1 Statistiche Progetto

| Metrica | Valore Attuale |
|---------|----------------|
| Path attuale | `C:\Users\marin\Downloads\TournamentMaster` (50 caratteri) |
| File totali | 101,935 |
| Dimensione totale | 1.6 GB |
| File sorgente | ~2,000 |
| node_modules | ~99,000 (da rigenerare) |

### 2.2 Struttura Directory

```
TournamentMaster/                    # ROOT
├── .git/                            # Repository Git (MANTENERE)
├── .github/                         # GitHub Actions (MANTENERE)
│   └── workflows/
│       └── build-mobile.yml         # CI/CD per Android/iOS
├── backend/                         # Server Express (MANTENERE)
│   ├── src/
│   ├── prisma/
│   ├── .env                         # Credenziali (NON COMMITTARE)
│   └── node_modules/               # DA RIGENERARE
├── frontend/                        # Next.js App (MANTENERE)
│   ├── src/
│   ├── public/
│   ├── capacitor.config.json        # Config app native
│   ├── .env.local                   # Environment vars
│   ├── .next/                      # DA RIGENERARE
│   └── node_modules/               # DA RIGENERARE
├── mobile/                          # Expo App (MANTENERE)
│   ├── src/
│   ├── assets/
│   ├── app.json                     # Config Expo
│   ├── eas.json                     # Config EAS Build
│   ├── .env.development             # Env sviluppo
│   ├── .env.production              # Env produzione
│   └── node_modules/               # DA RIGENERARE
├── docs/                            # Documentazione (CONSOLIDARE)
│   ├── HANDOVER_*.md               # ARCHIVIARE
│   └── *.md                        # MANTENERE
├── ios-certificates/                # Certificati iOS (MANTENERE - SENSIBILE)
├── logs/                            # Log vuoti (ELIMINARE)
├── temp-apk/                        # APK debug (ARCHIVIARE)
├── test-results/                    # Playwright (ARCHIVIARE)
├── screenshots/                     # Screenshot (ARCHIVIARE)
├── *.png                            # 40+ screenshot (ARCHIVIARE)
└── *.md                             # Documentazione (VALUTARE)
```

### 2.3 Dipendenze Esterne Identificate

| Servizio | Configurazione | File Config | Stato |
|----------|----------------|-------------|-------|
| **GitHub** | https://github.com/Marinovinc/TournamentMaster.git | `.git/config` | Attivo |
| **GitHub Actions** | Workflow build-mobile.yml | `.github/workflows/` | Attivo |
| **Expo/EAS** | projectId: `0a5f2e21-ef12-4c5a-8f3c-bf8e86ada779` | `mobile/app.json` | Attivo |
| **Railway** | `backend-production-70dd0.up.railway.app` | `mobile/.env.*` | Attivo |
| **Cloudinary** | cloud: `dvbmdexl2` | `backend/.env` | Attivo |
| **Capacitor** | server: `192.168.1.74:3000` | `frontend/capacitor.config.json` | Attivo |
| **MySQL** | `localhost:3306/tournamentmaster` | `backend/.env` | Attivo |

### 2.4 IP Hardcoded da Aggiornare

| File | IP/URL | Uso |
|------|--------|-----|
| `frontend/capacitor.config.json` | `192.168.1.74:3000` | Dev server mobile |
| `frontend/.env.local` | `192.168.1.74:3001` | API backend |
| `.github/workflows/build-mobile.yml` | `192.168.1.74:3001` | Build CI/CD |
| `mobile/.env.development` | `192.168.1.74:3001` | Dev locale (commentato) |

### 2.5 GitHub Actions Secrets Richiesti

Il workflow `.github/workflows/build-mobile.yml` richiede questi secrets:

| Secret | Uso | Obbligatorio |
|--------|-----|--------------|
| `ANDROID_KEYSTORE_PASSWORD` | Firma APK release | Per release |
| `ANDROID_KEY_ALIAS` | Alias chiave Android | Per release |
| `ANDROID_KEY_PASSWORD` | Password chiave | Per release |
| `IOS_CODE_SIGN_IDENTITY` | Firma iOS | Per release |
| `IOS_PROVISIONING_PROFILE` | Profilo iOS | Per release |
| `IOS_CERTIFICATE` | Certificato Apple | Per release |
| `IOS_CERTIFICATE_PASSWORD` | Password certificato | Per release |

---

## 3. FILE DA ARCHIVIARE

### 3.1 Screenshot e Immagini di Test (~10 MB)

```
# Pattern: test_*.png, debug_*.png, railway_*.png
test_homepage.png
test_homepage_check.png
test_homepage_final.png
test_homepage_it.png
test_improvements.png
test_login.png
test_login_filled.png
test_login_page.png
test_login_result.png
test_logo_homepage.png
test_logo_square.png
test_register_filled.png
test_results.png
test_tournament_detail.png
test_tournaments.png
test_tournaments_8.png
test_tournaments_error.png
test_tournaments_final.png
test_tournaments_page.png
test_after_login.png
test_Classifica.png
test_Cookie.png
test_Diventa_Organizzatore.png
test_Funzionalita.png
test_Guida_Installazione.png
test_Prezzi.png
test_Privacy.png
test_Registrazione.png
test_Termini.png
test_Tornei.png
debug_1_tournaments_list.png
debug_2_tournament_detail.png
debug_page.png
railway_*.png (8 file)
after_login.png
login_page.png
dashboard_sidebar.png
filled.png
result.png
pricing_screenshot.png
```

### 3.2 Banner e Asset di Design (~8 MB)

```
Banner_1_Coppa_in_Pietra_e_canne.png  # 1.1 MB
Banner_2_Coppa_in_Pietra_e_canne.png  # 0.9 MB
Banner_3_Coppa_in_Pietra_e_canne.png  # 0.4 MB
Banner_4_Coppa_in_Pietra_e_canne.png  # 0.3 MB
Banner_5_Coppa_in_Pietra_e_canne.png  # 0.5 MB
Coppa_in_Pietra.png                   # 1.3 MB
Coppa_in_Pietra_e_canne.png           # 1.1 MB
TOURNAMENTMASTER.png                  # 1.8 MB
qr_apk.png
qr_apk_dev.png
```

### 3.3 Directory Temporanee

```
temp-apk/           # Contiene app-debug.apk (7.8 MB)
test-results/       # Output Playwright
logs/               # File vuoti
screenshots/        # Screenshot aggiuntivi
```

### 3.4 Documentazione Handover (Root + docs/)

**Root directory:**
```
HANDOVER_SESSIONE_AVVIO_20260103.md
HANDOVER_SESSIONE_BRANDING_20260104.md
HANDOVER_SESSIONE_IOS_BUILD_20260102.md
HANDOVER_SESSIONE_RAILWAY_DEPLOY_20260103.md
DESCRIZIONE_ONESTA_APK_ANDROID_20251230.md
DESCRIZIONE_ONESTA_IOS_EXPO_GO_20260102.md
REPORT_PROBLEMI_WEBSITE_20260102.md
STATO_IOS_BUILD_20260104.md
```

**docs/ directory:**
```
docs/HANDOVER_SESSIONE_CREW_ROLES_20260105.md
docs/HANDOVER_SESSIONE_DELETE_TEAM_20260105.md
docs/SESSIONE_TOURNAMENT_MANAGEMENT_20260105.md
docs/TEST_E2E_DELETE_TEAM_REPORT_20260105.md
```

### 3.5 File da Eliminare (non archiviare)

```
nul                             # File vuoto (errore Windows)
*.log                           # Log vuoti
.next/                          # Cache build (si rigenera)
node_modules/                   # Dipendenze (si rigenera)
mobile/.expo/                   # Cache Expo
frontend/.turbo/                # Cache Turbo
*.BACKUP*                       # File backup temporanei
```

### 3.6 Documentazione - Piano Consolidamento

| File | Azione | Destinazione |
|------|--------|--------------|
| `DOCUMENTAZIONE_COMPLETA_TOURNAMENTMASTER.md` | MANTENERE | Root |
| `PROGETTO_TOURNAMENTMASTER_UNIFIED_PROJECT_DOCUMENT.md` | MANTENERE | Root |
| `README.md` | MANTENERE | Root |
| `INDICE_DOCUMENTI_TOURNAMENTMASTER.md` | MANTENERE | Root |
| `CLAUDE.md` | MANTENERE | Root |
| `GUIDA_*.md` (root, 10 file) | SPOSTARE | docs/guide/ |
| `DOCUMENTO_TECNICO_*.md` (6 file) | SPOSTARE | docs/tecnico/ |
| `PROPOSTA_*.md` | SPOSTARE | docs/proposte/ |
| `docs/GUIDA_*.md` | MANTENERE | docs/ |
| `docs/DOCUMENTAZIONE_*.md` | MANTENERE | docs/ |
| `docs/SPECIFICHE_*.md` | MANTENERE | docs/ |
| `docs/ARCHITETTURA_*.md` | MANTENERE | docs/ |

---

## 4. PROCEDURA DI MIGRAZIONE

### FASE 0: Pre-requisiti (5 minuti)

```powershell
# Verificare che non ci siano processi attivi
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process npm -ErrorAction SilentlyContinue | Stop-Process -Force

# Verificare spazio su D:\
$freeSpace = (Get-PSDrive D).Free / 1GB
if ($freeSpace -lt 3) {
    Write-Host "ERRORE: Spazio insufficiente su D:\ (< 3GB)" -ForegroundColor Red
    exit 1
}
Write-Host "Spazio disponibile: $([math]::Round($freeSpace, 2)) GB" -ForegroundColor Green

# Push eventuali modifiche non committate
cd "C:\Users\marin\Downloads\TournamentMaster"
git status
# Se ci sono modifiche: git add . && git commit -m "Pre-migration backup"
git push origin master
```

### FASE 1: Preparazione (10 minuti)

#### 1.1 Creare struttura destinazione

```powershell
# Creare directory base
$date = Get-Date -Format "yyyyMMdd"
New-Item -ItemType Directory -Path "D:\Dev" -Force
New-Item -ItemType Directory -Path "D:\Dev\_ARCHIVIO" -Force
New-Item -ItemType Directory -Path "D:\Dev\_ARCHIVIO\TournamentMaster_Screenshots_$date" -Force
New-Item -ItemType Directory -Path "D:\Dev\_ARCHIVIO\TournamentMaster_Banners_$date" -Force
New-Item -ItemType Directory -Path "D:\Dev\_ARCHIVIO\TournamentMaster_TempFiles_$date" -Force
New-Item -ItemType Directory -Path "D:\Dev\_ARCHIVIO\TournamentMaster_Handover_$date" -Force
New-Item -ItemType Directory -Path "D:\Dev\_ARCHIVIO\TournamentMaster_DocsHandover_$date" -Force
```

### FASE 2: Archiviazione File Obsoleti (20 minuti)

#### 2.1 Archiviare screenshot di test

```powershell
$source = "C:\Users\marin\Downloads\TournamentMaster"
$date = Get-Date -Format "yyyyMMdd"
$archive = "D:\Dev\_ARCHIVIO\TournamentMaster_Screenshots_$date"

# Spostare screenshot test
$patterns = @("test_*.png", "debug_*.png", "railway_*.png", "mobile_*.png",
              "after_login.png", "login_page.png", "dashboard_sidebar.png",
              "filled.png", "result.png", "pricing_screenshot.png")
foreach ($p in $patterns) {
    Get-ChildItem -Path $source -Filter $p -ErrorAction SilentlyContinue |
        Move-Item -Destination $archive -Force
}
Write-Host "Screenshot archiviati in: $archive" -ForegroundColor Green
```

#### 2.2 Archiviare banner e asset design

```powershell
$archive = "D:\Dev\_ARCHIVIO\TournamentMaster_Banners_$date"

$patterns = @("Banner_*.png", "Coppa_*.png", "TOURNAMENTMASTER.png", "qr_*.png")
foreach ($p in $patterns) {
    Get-ChildItem -Path $source -Filter $p -ErrorAction SilentlyContinue |
        Move-Item -Destination $archive -Force
}
Write-Host "Banner archiviati in: $archive" -ForegroundColor Green
```

#### 2.3 Archiviare file temporanei

```powershell
$archive = "D:\Dev\_ARCHIVIO\TournamentMaster_TempFiles_$date"

# Spostare directory temporanee
$tempDirs = @("temp-apk", "test-results", "logs", "screenshots")
foreach ($dir in $tempDirs) {
    if (Test-Path "$source\$dir") {
        Move-Item -Path "$source\$dir" -Destination "$archive\" -Force
    }
}

# Eliminare file nullo e backup
Remove-Item -Path "$source\nul" -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path "$source" -Filter "*.BACKUP*" -Recurse | Remove-Item -Force

Write-Host "File temporanei archiviati in: $archive" -ForegroundColor Green
```

#### 2.4 Archiviare handover storici (root)

```powershell
$archive = "D:\Dev\_ARCHIVIO\TournamentMaster_Handover_$date"

$patterns = @("HANDOVER_*.md", "DESCRIZIONE_ONESTA_*.md", "REPORT_*.md", "STATO_*.md")
foreach ($p in $patterns) {
    Get-ChildItem -Path $source -Filter $p -ErrorAction SilentlyContinue |
        Move-Item -Destination $archive -Force
}
Write-Host "Handover root archiviati in: $archive" -ForegroundColor Green
```

#### 2.5 Archiviare handover da docs/

```powershell
$archive = "D:\Dev\_ARCHIVIO\TournamentMaster_DocsHandover_$date"

$patterns = @("HANDOVER_*.md", "SESSIONE_*.md", "TEST_E2E_*.md")
foreach ($p in $patterns) {
    Get-ChildItem -Path "$source\docs" -Filter $p -ErrorAction SilentlyContinue |
        Move-Item -Destination $archive -Force
}
Write-Host "Handover docs archiviati in: $archive" -ForegroundColor Green
```

### FASE 3: Pulizia Pre-Migrazione (10 minuti)

#### 3.1 Eliminare cache e node_modules

```powershell
Write-Host "Eliminazione node_modules e cache..." -ForegroundColor Yellow

# node_modules (3 directory)
Remove-Item -Recurse -Force "$source\frontend\node_modules" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$source\backend\node_modules" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$source\mobile\node_modules" -ErrorAction SilentlyContinue

# Cache build
Remove-Item -Recurse -Force "$source\frontend\.next" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$source\frontend\.turbo" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$source\mobile\.expo" -ErrorAction SilentlyContinue

# package-lock (opzionale - si rigenera)
# Remove-Item -Force "$source\frontend\package-lock.json" -ErrorAction SilentlyContinue
# Remove-Item -Force "$source\backend\package-lock.json" -ErrorAction SilentlyContinue
# Remove-Item -Force "$source\mobile\package-lock.json" -ErrorAction SilentlyContinue

Write-Host "Pulizia completata" -ForegroundColor Green
```

### FASE 4: Migrazione (5 minuti)

#### 4.1 Copiare progetto (preserva .git)

```powershell
Write-Host "Copia progetto in corso..." -ForegroundColor Yellow

# Copiare tutto il progetto
Copy-Item -Path "C:\Users\marin\Downloads\TournamentMaster" `
          -Destination "D:\Dev\TournamentMaster" `
          -Recurse -Force

# Verificare copia
$checks = @(
    "D:\Dev\TournamentMaster\.git",
    "D:\Dev\TournamentMaster\frontend\package.json",
    "D:\Dev\TournamentMaster\backend\package.json",
    "D:\Dev\TournamentMaster\mobile\package.json",
    "D:\Dev\TournamentMaster\.claudeignore"
)

$allOk = $true
foreach ($check in $checks) {
    if (Test-Path $check) {
        Write-Host "  OK: $check" -ForegroundColor Green
    } else {
        Write-Host "  MANCANTE: $check" -ForegroundColor Red
        $allOk = $false
    }
}

if ($allOk) {
    Write-Host "Copia completata con successo" -ForegroundColor Green
} else {
    Write-Host "ATTENZIONE: Alcuni file mancanti!" -ForegroundColor Red
}
```

### FASE 5: Rigenerazione Dipendenze (15-20 minuti)

#### 5.1 Frontend

```powershell
Write-Host "Installazione dipendenze Frontend..." -ForegroundColor Yellow
cd D:\Dev\TournamentMaster\frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend OK" -ForegroundColor Green
} else {
    Write-Host "Frontend ERRORE!" -ForegroundColor Red
}
```

#### 5.2 Backend

```powershell
Write-Host "Installazione dipendenze Backend..." -ForegroundColor Yellow
cd D:\Dev\TournamentMaster\backend
npm install
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend OK" -ForegroundColor Green
} else {
    Write-Host "Backend ERRORE!" -ForegroundColor Red
}
```

#### 5.3 Mobile

```powershell
Write-Host "Installazione dipendenze Mobile..." -ForegroundColor Yellow
cd D:\Dev\TournamentMaster\mobile
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Mobile OK" -ForegroundColor Green
} else {
    Write-Host "Mobile ERRORE!" -ForegroundColor Red
}
```

### FASE 6: Verifica Funzionamento (10 minuti)

```powershell
# Aprire 3 terminali separati:

# Terminale 1 - Backend
cd D:\Dev\TournamentMaster\backend
npm run dev
# Atteso: Server running on port 3001

# Terminale 2 - Frontend
cd D:\Dev\TournamentMaster\frontend
npm run dev
# Atteso: Ready on http://localhost:3000

# Terminale 3 - Test
curl http://localhost:3001/api/health
# Atteso: {"status":"ok"}

curl http://localhost:3000
# Atteso: HTML della homepage
```

---

## 5. DIPENDENZE ESTERNE - PROCEDURE ADEGUAMENTO

### 5.1 GitHub Repository

**Stato attuale:** Nessuna modifica richiesta al remote
**Remote:** `https://github.com/Marinovinc/TournamentMaster.git`

```powershell
# Verificare remote dopo migrazione
cd D:\Dev\TournamentMaster
git remote -v

# Output atteso:
# origin  https://github.com/Marinovinc/TournamentMaster.git (fetch)
# origin  https://github.com/Marinovinc/TournamentMaster.git (push)

# Verificare stato
git status
git fetch origin
```

**Procedura se serve cambiare remote:**
```powershell
# Solo se necessario cambiare repository
git remote set-url origin https://github.com/NUOVO_USER/TournamentMaster.git

# Se serve cambiare branch default
git branch -M main
git push -u origin main
```

### 5.2 GitHub Actions (CI/CD)

**Workflow:** `.github/workflows/build-mobile.yml`
**Trigger:** Push su main/master, modifiche in frontend/

**PROBLEMA IDENTIFICATO:** IP `192.168.1.74` hardcoded nel workflow!

**Procedura adeguamento:**
```yaml
# MODIFICARE .github/workflows/build-mobile.yml
# Linea 60 e 127: Cambiare IP se necessario

# DA:
NEXT_PUBLIC_API_URL: 'http://192.168.1.74:3001'

# A (per produzione Railway):
NEXT_PUBLIC_API_URL: 'https://backend-production-70dd0.up.railway.app'

# OPPURE usare secret GitHub:
NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
```

**Secrets GitHub da configurare:**
```
Repository Settings > Secrets and variables > Actions > New repository secret

# Android (per release)
ANDROID_KEYSTORE_PASSWORD = [password keystore]
ANDROID_KEY_ALIAS = [alias chiave]
ANDROID_KEY_PASSWORD = [password chiave]

# iOS (per release)
IOS_CODE_SIGN_IDENTITY = [identity]
IOS_PROVISIONING_PROFILE = [profile]
IOS_CERTIFICATE = [base64 del .p12]
IOS_CERTIFICATE_PASSWORD = [password]

# Environment (opzionale ma consigliato)
API_URL = https://backend-production-70dd0.up.railway.app
```

### 5.3 Railway (Backend Production)

**Configurazione attuale:**
- URL Backend: `https://backend-production-70dd0.up.railway.app`
- WebSocket: `wss://backend-production-70dd0.up.railway.app`
- Frontend URL: `https://tournamentmaster.app` (se configurato)

**File che usano Railway:**
- `mobile/.env.development` (API_BASE_URL)
- `mobile/.env.production`

**Procedura verifica:**
```powershell
# Test connessione Railway
curl https://backend-production-70dd0.up.railway.app/api/health

# Se serve aggiornare deployment:
# 1. Accedere a https://railway.app/dashboard
# 2. Selezionare progetto TournamentMaster
# 3. Verificare variabili environment
# 4. Redeploy se necessario
```

**Variabili Railway da verificare:**
```
DATABASE_URL = [connection string MySQL/PostgreSQL]
JWT_SECRET = [secret sicuro]
CLOUDINARY_CLOUD_NAME = dvbmdexl2
CLOUDINARY_API_KEY = 483656551513767
CLOUDINARY_API_SECRET = [secret]
NODE_ENV = production
PORT = 3001
FRONTEND_URL = https://tournamentmaster.app
```

### 5.4 Expo / EAS Build

**Configurazione attuale:**
- Project ID: `0a5f2e21-ef12-4c5a-8f3c-bf8e86ada779`
- Owner: `marinovinc`
- Bundle ID iOS: `com.tournamentmaster.app`
- Package Android: `com.tournamentmaster.app`

**File da verificare:** `mobile/app.json`, `mobile/eas.json`

**Procedura adeguamento:**
```powershell
cd D:\Dev\TournamentMaster\mobile

# 1. Verificare login EAS
npx eas whoami
# Output atteso: marinovinc

# 2. Se non loggato:
npx eas login

# 3. Verificare collegamento progetto
npx eas project:info

# 4. Test build (solo verifica, non pubblica)
npx eas build --platform android --profile preview --non-interactive --dry-run
```

**Se serve ricollegare a nuovo account:**
```powershell
# Modificare mobile/app.json:
#   "owner": "NUOVO_OWNER"
#   "extra.eas.projectId": "NUOVO_PROJECT_ID"

# Ricollegare progetto
npx eas init --id NUOVO_PROJECT_ID
```

### 5.5 Capacitor (iOS/Android nativo)

**Configurazione attuale:**
- App ID: `app.tournamentmaster.www`
- Server URL: `http://192.168.1.74:3000` (IP locale)

**File da aggiornare:** `frontend/capacitor.config.json`

**ATTENZIONE:** Il server URL punta a IP locale! Per produzione serve cambiare.

**Procedura adeguamento:**
```powershell
cd D:\Dev\TournamentMaster\frontend

# 1. Verificare config attuale
cat capacitor.config.json

# 2. MODIFICARE capacitor.config.json per produzione:
# {
#   "server": {
#     "url": "https://tournamentmaster.app",  // O URL production
#     "cleartext": false  // HTTPS in produzione
#   }
# }

# 3. Sincronizzare progetti nativi (se esistono)
npx cap sync android
npx cap sync ios
```

### 5.6 Cloudinary (Media Upload)

**Configurazione attuale:**
- Cloud Name: `dvbmdexl2`
- API Key: `483656551513767`
- API Secret: `8qAKsd1ayP5NlverEE0UmWbMDDE` (in .env)

**File:** `backend/.env`

**Procedura verifica:**
```powershell
cd D:\Dev\TournamentMaster\backend

# 1. Verificare .env contiene credenziali Cloudinary
cat .env | findstr CLOUDINARY

# 2. Verificare .gitignore esclude .env
cat ..\.gitignore | findstr ".env"

# 3. Test upload (richiede server attivo)
npm run dev
# Poi testare upload da frontend
```

**SICUREZZA:** Non committare MAI il file `.env` con secrets!

### 5.7 Database MySQL

**Configurazione attuale:**
- Host: `localhost:3306`
- Database: `tournamentmaster`
- User: `root` (no password - SOLO SVILUPPO!)

**File:** `backend/.env`

**Procedura adeguamento:**
```powershell
# 1. Verificare MySQL attivo (XAMPP)
# Aprire XAMPP Control Panel > Start MySQL

# 2. Verificare database esiste
D:\xampp\mysql\bin\mysql.exe -u root -e "SHOW DATABASES;" | findstr tournamentmaster

# 3. Se database non esiste:
D:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE tournamentmaster;"

# 4. Eseguire migrazioni Prisma
cd D:\Dev\TournamentMaster\backend
npx prisma migrate dev

# 5. Verificare tabelle create
npx prisma studio
# Apre browser con interfaccia database
```

### 5.8 Frontend Environment

**File:** `frontend/.env.local`

**Configurazione attuale:**
```env
NEXT_PUBLIC_API_URL=http://192.168.1.74:3001
API_URL=http://localhost:3001
```

**Procedura adeguamento:**
```powershell
# Per sviluppo locale (IP potrebbe cambiare):
# Verificare IP attuale:
ipconfig | findstr "IPv4"

# Modificare frontend/.env.local:
# NEXT_PUBLIC_API_URL=http://NUOVO_IP:3001
# API_URL=http://localhost:3001

# Per produzione (Railway):
# NEXT_PUBLIC_API_URL=https://backend-production-70dd0.up.railway.app
# API_URL=https://backend-production-70dd0.up.railway.app
```

### 5.9 Mobile Environment (Expo)

**File:** `mobile/.env.development` e `mobile/.env.production`

**Configurazione attuale (.env.development):**
```env
API_BASE_URL=https://backend-production-70dd0.up.railway.app/api
WS_BASE_URL=wss://backend-production-70dd0.up.railway.app
FRONTEND_URL=https://tournamentmaster.app
```

**Procedura adeguamento:**
```powershell
# Per sviluppo locale:
# Modificare mobile/.env.development:
API_BASE_URL=http://192.168.1.74:3001/api
WS_BASE_URL=ws://192.168.1.74:3001
FRONTEND_URL=http://192.168.1.74:3000

# Per produzione (gia configurato):
# mobile/.env.production punta a Railway
```

---

## 6. SCRIPT AUTOMATIZZATI

### 6.1 Script Completo Migrazione

Salvare come `MIGRA_TOURNAMENTMASTER.ps1` in una posizione accessibile:

```powershell
# MIGRA_TOURNAMENTMASTER.ps1
# Script automatico per migrazione progetto
# Eseguire come: powershell -ExecutionPolicy Bypass -File MIGRA_TOURNAMENTMASTER.ps1

param(
    [switch]$DryRun = $false,
    [switch]$SkipNpmInstall = $false
)

$ErrorActionPreference = "Stop"
$source = "C:\Users\marin\Downloads\TournamentMaster"
$dest = "D:\Dev\TournamentMaster"
$archiveBase = "D:\Dev\_ARCHIVIO"
$date = Get-Date -Format "yyyyMMdd"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  MIGRAZIONE TOURNAMENTMASTER" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Da: $source"
Write-Host "A:  $dest"
Write-Host "Data: $date"
if ($DryRun) { Write-Host "MODALITA DRY-RUN (nessuna modifica)" -ForegroundColor Yellow }
Write-Host ""

# FASE 0: Pre-check
Write-Host "[0/7] Verifica pre-requisiti..." -ForegroundColor Yellow
$freeSpace = [math]::Round((Get-PSDrive D).Free / 1GB, 2)
Write-Host "  Spazio libero su D:\: $freeSpace GB"
if ($freeSpace -lt 3) {
    Write-Host "  ERRORE: Spazio insufficiente!" -ForegroundColor Red
    exit 1
}

# Stop processi Node
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "  Processi Node terminati" -ForegroundColor Green

if ($DryRun) { Write-Host "  [DRY-RUN] Saltata esecuzione reale" -ForegroundColor Yellow; exit 0 }

# FASE 1: Creare struttura
Write-Host "[1/7] Creazione struttura directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "D:\Dev" -Force | Out-Null
New-Item -ItemType Directory -Path "$archiveBase" -Force | Out-Null
@("Screenshots", "Banners", "TempFiles", "Handover", "DocsHandover") | ForEach-Object {
    New-Item -ItemType Directory -Path "$archiveBase\TournamentMaster_${_}_$date" -Force | Out-Null
}
Write-Host "  Directory create" -ForegroundColor Green

# FASE 2: Archiviare file
Write-Host "[2/7] Archiviazione file obsoleti..." -ForegroundColor Yellow

# Screenshots
$screenshotPatterns = @("test_*.png", "debug_*.png", "railway_*.png", "mobile_*.png",
                        "after_login.png", "login_page.png", "dashboard_sidebar.png",
                        "filled.png", "result.png", "pricing_screenshot.png")
$count = 0
foreach ($p in $screenshotPatterns) {
    Get-ChildItem -Path $source -Filter $p -ErrorAction SilentlyContinue | ForEach-Object {
        Move-Item $_.FullName "$archiveBase\TournamentMaster_Screenshots_$date\" -Force
        $count++
    }
}
Write-Host "  Screenshot archiviati: $count" -ForegroundColor Green

# Banners
$bannerPatterns = @("Banner_*.png", "Coppa_*.png", "TOURNAMENTMASTER.png", "qr_*.png")
$count = 0
foreach ($p in $bannerPatterns) {
    Get-ChildItem -Path $source -Filter $p -ErrorAction SilentlyContinue | ForEach-Object {
        Move-Item $_.FullName "$archiveBase\TournamentMaster_Banners_$date\" -Force
        $count++
    }
}
Write-Host "  Banner archiviati: $count" -ForegroundColor Green

# Temp directories
$tempDirs = @("temp-apk", "test-results", "logs", "screenshots")
foreach ($dir in $tempDirs) {
    if (Test-Path "$source\$dir") {
        Move-Item "$source\$dir" "$archiveBase\TournamentMaster_TempFiles_$date\" -Force
    }
}
Write-Host "  Directory temp archiviate" -ForegroundColor Green

# Handover (root)
$handoverPatterns = @("HANDOVER_*.md", "DESCRIZIONE_ONESTA_*.md", "REPORT_*.md", "STATO_*.md")
foreach ($p in $handoverPatterns) {
    Get-ChildItem -Path $source -Filter $p -ErrorAction SilentlyContinue |
        Move-Item -Destination "$archiveBase\TournamentMaster_Handover_$date\" -Force
}

# Handover (docs/)
$docsHandoverPatterns = @("HANDOVER_*.md", "SESSIONE_*.md", "TEST_E2E_*.md")
foreach ($p in $docsHandoverPatterns) {
    Get-ChildItem -Path "$source\docs" -Filter $p -ErrorAction SilentlyContinue |
        Move-Item -Destination "$archiveBase\TournamentMaster_DocsHandover_$date\" -Force
}
Write-Host "  Handover archiviati" -ForegroundColor Green

# FASE 3: Pulizia
Write-Host "[3/7] Pulizia cache e node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "$source\frontend\node_modules" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$source\backend\node_modules" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$source\mobile\node_modules" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$source\frontend\.next" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$source\frontend\.turbo" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$source\mobile\.expo" -ErrorAction SilentlyContinue
Remove-Item -Force "$source\nul" -ErrorAction SilentlyContinue
Get-ChildItem -Path $source -Filter "*.BACKUP*" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "  Pulizia completata" -ForegroundColor Green

# FASE 4: Copia
Write-Host "[4/7] Copia progetto in nuova location..." -ForegroundColor Yellow
Copy-Item -Path $source -Destination $dest -Recurse -Force
Write-Host "  Copia completata" -ForegroundColor Green

# FASE 5: Verifica
Write-Host "[5/7] Verifica integrita..." -ForegroundColor Yellow
$checks = @(
    "$dest\.git",
    "$dest\frontend\package.json",
    "$dest\backend\package.json",
    "$dest\mobile\package.json",
    "$dest\.claudeignore",
    "$dest\backend\.env"
)
$allOk = $true
foreach ($check in $checks) {
    if (Test-Path $check) {
        Write-Host "  OK: $(Split-Path $check -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "  MANCANTE: $check" -ForegroundColor Red
        $allOk = $false
    }
}

# FASE 6: npm install
if (-not $SkipNpmInstall) {
    Write-Host "[6/7] Installazione dipendenze npm..." -ForegroundColor Yellow

    Set-Location "$dest\frontend"
    Write-Host "  Frontend..." -NoNewline
    npm install --silent 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green } else { Write-Host " ERRORE" -ForegroundColor Red }

    Set-Location "$dest\backend"
    Write-Host "  Backend..." -NoNewline
    npm install --silent 2>$null
    npx prisma generate --silent 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green } else { Write-Host " ERRORE" -ForegroundColor Red }

    Set-Location "$dest\mobile"
    Write-Host "  Mobile..." -NoNewline
    npm install --silent 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green } else { Write-Host " ERRORE" -ForegroundColor Red }
} else {
    Write-Host "[6/7] npm install saltato (--SkipNpmInstall)" -ForegroundColor Yellow
}

# FASE 7: Istruzioni finali
Write-Host ""
Write-Host "[7/7] AZIONI MANUALI RICHIESTE:" -ForegroundColor Cyan
Write-Host "  1. Aggiornare Claude Code working directory a: D:\Dev\TournamentMaster" -ForegroundColor White
Write-Host "  2. Verificare funzionamento: npm run dev (frontend e backend)" -ForegroundColor White
Write-Host "  3. Verificare git: git status && git remote -v" -ForegroundColor White
Write-Host "  4. Se tutto OK, eliminare: $source" -ForegroundColor White
Write-Host ""

if ($allOk) {
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  MIGRAZIONE COMPLETATA CON SUCCESSO" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
} else {
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "  MIGRAZIONE COMPLETATA CON AVVISI" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
}

Write-Host ""
Write-Host "Archivio file: $archiveBase\TournamentMaster_*_$date" -ForegroundColor Gray
```

### 6.2 Script Verifica Post-Migrazione

Salvare come `D:\Dev\TournamentMaster\VERIFICA_MIGRAZIONE.ps1`:

```powershell
# VERIFICA_MIGRAZIONE.ps1
# Verifica che la migrazione sia andata a buon fine

$root = "D:\Dev\TournamentMaster"

Write-Host "=== VERIFICA MIGRAZIONE TOURNAMENTMASTER ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verifica struttura
Write-Host "[1/5] Struttura directory..." -ForegroundColor Yellow
$requiredDirs = @("frontend", "backend", "mobile", "docs", ".git", ".github")
foreach ($dir in $requiredDirs) {
    if (Test-Path "$root\$dir") {
        Write-Host "  OK: $dir" -ForegroundColor Green
    } else {
        Write-Host "  MANCANTE: $dir" -ForegroundColor Red
    }
}

# 2. Verifica Git
Write-Host ""
Write-Host "[2/5] Git repository..." -ForegroundColor Yellow
Set-Location $root
$gitStatus = git status --porcelain 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Git funzionante" -ForegroundColor Green
    $remote = git remote get-url origin
    Write-Host "  Remote: $remote" -ForegroundColor Gray
} else {
    Write-Host "  Git NON funzionante!" -ForegroundColor Red
}

# 3. Verifica node_modules
Write-Host ""
Write-Host "[3/5] Dipendenze npm..." -ForegroundColor Yellow
$npmDirs = @("frontend", "backend", "mobile")
foreach ($dir in $npmDirs) {
    if (Test-Path "$root\$dir\node_modules") {
        $count = (Get-ChildItem "$root\$dir\node_modules" -Directory).Count
        Write-Host "  $dir: $count moduli" -ForegroundColor Green
    } else {
        Write-Host "  $dir: node_modules MANCANTE" -ForegroundColor Red
    }
}

# 4. Verifica file config
Write-Host ""
Write-Host "[4/5] File configurazione..." -ForegroundColor Yellow
$configFiles = @(
    "backend\.env",
    "frontend\.env.local",
    "frontend\capacitor.config.json",
    "mobile\app.json",
    "mobile\eas.json",
    ".claudeignore"
)
foreach ($file in $configFiles) {
    if (Test-Path "$root\$file") {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  MANCANTE: $file" -ForegroundColor Yellow
    }
}

# 5. Test avvio (opzionale)
Write-Host ""
Write-Host "[5/5] Test server..." -ForegroundColor Yellow
Write-Host "  Per testare manualmente:" -ForegroundColor Gray
Write-Host "    cd $root\backend && npm run dev" -ForegroundColor Gray
Write-Host "    cd $root\frontend && npm run dev" -ForegroundColor Gray

Write-Host ""
Write-Host "=== VERIFICA COMPLETATA ===" -ForegroundColor Cyan
```

---

## 7. CHECKLIST VERIFICA

### Pre-Migrazione
- [ ] Verificato spazio su D:\ (minimo 3 GB liberi)
- [ ] Chiusi tutti i processi Node.js
- [ ] Chiuso Claude Code sul progetto
- [ ] Chiuso VS Code / altri editor
- [ ] Backup recente su Git (`git push origin master`)
- [ ] Nota l'IP locale attuale (`ipconfig`)

### Post-Migrazione
- [ ] Directory `D:\Dev\TournamentMaster` esiste
- [ ] `.git` presente e funzionante (`git status`)
- [ ] `git remote -v` mostra URL GitHub corretto
- [ ] `frontend/package.json` presente
- [ ] `backend/package.json` presente
- [ ] `mobile/package.json` presente
- [ ] `.claudeignore` presente
- [ ] `backend/.env` presente con credenziali

### Post-Setup Dipendenze
- [ ] Frontend: `npm run dev` avvia su localhost:3000
- [ ] Backend: `npm run dev` avvia su localhost:3001
- [ ] Mobile: `npx expo start` funziona
- [ ] Database MySQL connesso (Prisma Studio apre)
- [ ] API health check: `curl localhost:3001/api/health`

### Dipendenze Esterne
- [ ] GitHub: `git push` funziona
- [ ] Expo: `npx eas whoami` mostra `marinovinc`
- [ ] Railway: `curl https://backend-production-70dd0.up.railway.app/api/health`
- [ ] Cloudinary: test upload immagine funziona

### Pulizia Finale
- [ ] Archivio verificato (tutti i file in `D:\Dev\_ARCHIVIO\`)
- [ ] Claude Code configurato su nuovo path
- [ ] VS Code aperto su nuovo path
- [ ] Vecchia directory `Downloads\TournamentMaster` eliminata

---

## 8. ROLLBACK PLAN

### Se la migrazione fallisce:

```powershell
# 1. La directory originale NON viene eliminata automaticamente
# Puo essere usata direttamente

# 2. Ripristinare file archiviati (se necessario):
$date = "20260106"  # Inserire data corretta
$archiveBase = "D:\Dev\_ARCHIVIO"
$source = "C:\Users\marin\Downloads\TournamentMaster"

# Ripristinare screenshots
Copy-Item -Path "$archiveBase\TournamentMaster_Screenshots_$date\*" -Destination $source -Force

# Ripristinare banners
Copy-Item -Path "$archiveBase\TournamentMaster_Banners_$date\*" -Destination $source -Force

# Ripristinare temp files
Get-ChildItem "$archiveBase\TournamentMaster_TempFiles_$date" |
    Copy-Item -Destination $source -Recurse -Force

# Ripristinare handover
Copy-Item -Path "$archiveBase\TournamentMaster_Handover_$date\*" -Destination $source -Force
Copy-Item -Path "$archiveBase\TournamentMaster_DocsHandover_$date\*" -Destination "$source\docs" -Force

# 3. Rigenerare node_modules in location originale
cd "$source\frontend"; npm install
cd "$source\backend"; npm install; npx prisma generate
cd "$source\mobile"; npm install

# 4. Eliminare tentativo di migrazione fallito
Remove-Item -Recurse -Force "D:\Dev\TournamentMaster" -ErrorAction SilentlyContinue

# 5. Riconfigurare Claude Code su path originale
```

---

## 9. RISCHI E MITIGAZIONI

### 9.1 Rischi Identificati

| ID | Rischio | Probabilita | Impatto | Mitigazione |
|----|---------|-------------|---------|-------------|
| R1 | Spazio disco insufficiente | Bassa | Alto | Pre-check automatico nello script |
| R2 | File in uso durante copia | Media | Medio | Stop processi Node prima di iniziare |
| R3 | Credenziali perse (.env) | Bassa | Critico | Verifica esistenza post-copia |
| R4 | npm install fallisce | Media | Medio | package-lock.json preservato |
| R5 | Git history corrotta | Molto Bassa | Alto | Copia preserva .git intero |
| R6 | IP locale cambiato | Alta | Basso | Documentati tutti i file da aggiornare |
| R7 | Secrets GitHub mancanti | Media | Medio | Checklist secrets documentata |
| R8 | Railway deployment rotto | Bassa | Alto | URL production documentati |

### 9.2 Piano Contingenza

**Se npm install fallisce:**
```powershell
# Eliminare package-lock e riprovare
rm package-lock.json
npm cache clean --force
npm install
```

**Se Git non funziona:**
```powershell
# Re-inizializzare repo mantenendo history
cd D:\Dev\TournamentMaster
git init
git remote add origin https://github.com/Marinovinc/TournamentMaster.git
git fetch origin
git reset --hard origin/master
```

**Se database non si connette:**
```powershell
# Verificare XAMPP MySQL attivo
# Verificare credenziali in backend/.env
# Rigenerare client Prisma
cd D:\Dev\TournamentMaster\backend
npx prisma generate
npx prisma db push  # Se schema cambiato
```

---

## APPENDICE A: Dimensioni Stimate Post-Migrazione

| Componente | Prima | Dopo | Note |
|------------|-------|------|------|
| Root files (*.png, *.md) | ~15 MB | ~3 MB | Screenshot/banner archiviati |
| frontend/src | 500 KB | 500 KB | Invariato |
| backend/src | 200 KB | 200 KB | Invariato |
| mobile/src | 300 KB | 300 KB | Invariato |
| docs/ | 1 MB | 800 KB | Handover archiviati |
| node_modules (totale) | ~1.5 GB | ~1.5 GB | Rigenerato |
| .next | 50 MB | 0 | Rigenerato al primo build |
| **TOTALE (senza node_modules)** | **~65 MB** | **~5 MB** | **-92%** |
| **TOTALE (con node_modules)** | **~1.6 GB** | **~1.5 GB** | **-100 MB** |

---

## APPENDICE B: Comandi Utili Post-Migrazione

```powershell
# Navigazione rapida
cd D:\Dev\TournamentMaster

# Avvio sviluppo (3 terminali)
# Terminal 1: Backend
cd D:\Dev\TournamentMaster\backend && npm run dev

# Terminal 2: Frontend
cd D:\Dev\TournamentMaster\frontend && npm run dev

# Terminal 3: Mobile (opzionale)
cd D:\Dev\TournamentMaster\mobile && npx expo start

# Git operations
git status
git pull origin master
git push origin master

# Database
cd D:\Dev\TournamentMaster\backend
npx prisma studio        # GUI database
npx prisma migrate dev   # Applica migrazioni
npx prisma db push       # Sincronizza schema

# Build produzione
cd D:\Dev\TournamentMaster\frontend && npm run build
cd D:\Dev\TournamentMaster\backend && npm run build

# EAS Build (mobile)
cd D:\Dev\TournamentMaster\mobile
npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
```

---

**Documento creato da:** Claude Code
**Versione:** 1.1
**Ultima modifica:** 2026-01-06 00:45
**Changelog:**
- v1.0: Versione iniziale
- v1.1: Aggiunto Railway, GitHub Actions secrets, IP hardcoded, docs/ handover, script migliorati, sezione rischi
