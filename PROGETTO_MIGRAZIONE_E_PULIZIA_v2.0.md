# Progetto: Migrazione e Pulizia TournamentMaster

**Data creazione:** 2026-01-06  
**Versione:** 2.0  
**Stato:** Da Implementare  
**Priorità:** ALTA  

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
| Path più corto | -30 caratteri = migliore compatibilità Windows |
| Fuori da Downloads | Evita cancellazioni accidentali |
| Organizzazione | Tutti i progetti dev in un'unica location |
| Claude Code stabile | Meno interruzioni silenziose |
| Backup più semplice | D:\ separato da sistema |

### 1.3 Obiettivi Secondari
- Archiviare file obsoleti (screenshot test, banner, temp, legacy native apps)
- Ridurre dimensione progetto da 1.6GB a ~500MB (escluso node_modules)
- Aggiornare tutte le dipendenze esterne con nuovi path
- Documentare configurazioni legacy da app native (pre-pivot PWA)

### 1.4 Strategia Deployment (IMPORTANTE)

**Decisione Architetturale:** PWA-Only (Dicembre 2025)

| Componente | Stato | Azione Migrazione |
|------------|-------|-------------------|
| **PWA (frontend/)** | ✅ ATTIVO | Mantenere e migrare |
| **Backend API** | ✅ ATTIVO | Mantenere e migrare |
| **Mobile Expo (mobile/)** | ⚠️ LEGACY | Archiviare (non eliminare) |
| **Capacitor Config** | ⚠️ LEGACY | Archiviare (non eliminare) |
| **GitHub Actions build-mobile** | ⚠️ LEGACY | Disabilitare workflow |
| **Certificati iOS** | 📦 ARCHIVIO | Mantenere per riferimento |

**Rationale della Pivot PWA-Only:**
- ❌ Eliminati costi annuali Apple Developer ($124/anno)
- ❌ Eliminata complessità build nativi iOS/Android
- ❌ Eliminate dipendenze da app store approvals
- ❌ Eliminato mantenimento certificati e provisioning profiles
- ✅ Stessa funzionalità (GPS, camera, offline, push notifications)
- ✅ Deploy immediato senza review process
- ✅ Aggiornamenti istantanei senza nuove release

**Componenti Legacy:** Mobile/ e certificati rimangono nel progetto per riferimento storico ma non sono più attivamente sviluppati o deployati.

---

## 2. ANALISI SITUAZIONE ATTUALE

### 2.1 Statistiche Progetto

| Metrica | Valore Attuale |
|---------|----------------|
| Path attuale | `C:\Users\marin\Downloads\TournamentMaster` (50 caratteri) |
| File totali | 101,935 |
| Dimensione totale | 1.6 GB |
| File sorgente attivi | ~1,500 (frontend + backend) |
| File sorgente legacy | ~500 (mobile/ + ios-certificates/) |
| node_modules | ~99,000 (da rigenerare) |

### 2.2 Struttura Directory

```
TournamentMaster/                    # ROOT
├── .git/                            # Repository Git (✅ MANTENERE)
├── .github/                         # GitHub Actions (⚠️ VALUTARE)
│   └── workflows/
│       └── build-mobile.yml         # ⚠️ LEGACY - Disabilitare (non serve più con PWA)
├── backend/                         # ✅ Server Express (ATTIVO)
│   ├── src/
│   ├── prisma/
│   ├── .env                         # Credenziali (NON COMMITTARE)
│   └── node_modules/               # DA RIGENERARE
├── frontend/                        # ✅ Next.js PWA (ATTIVO)
│   ├── src/
│   ├── public/
│   ├── capacitor.config.json        # ⚠️ LEGACY - Archiviare (non serve più)
│   ├── .env.local                   # Environment vars (MANTENERE)
│   ├── .next/                      # DA RIGENERARE
│   └── node_modules/               # DA RIGENERARE
├── mobile/                          # ⚠️ LEGACY - Expo App (ARCHIVIARE)
│   ├── src/
│   ├── assets/
│   ├── app.json                     # Config Expo (legacy)
│   ├── eas.json                     # Config EAS Build (legacy)
│   ├── .env.development             # Env sviluppo (legacy)
│   ├── .env.production              # Env produzione (legacy)
│   └── node_modules/               # DA ELIMINARE
├── docs/                            # ✅ Documentazione (CONSOLIDARE)
│   ├── HANDOVER_*.md               # ARCHIVIARE
│   └── *.md                        # MANTENERE
├── ios-certificates/                # 📦 ARCHIVIO - Certificati iOS (non più usati)
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
| **GitHub** | https://github.com/Marinovinc/TournamentMaster.git | `.git/config` | ✅ Attivo |
| **GitHub Actions** | Workflow build-mobile.yml | `.github/workflows/` | ⚠️ Legacy (disabilitare) |
| **Expo/EAS** | projectId: `0a5f2e21-ef12-4c5a-8f3c-bf8e86ada779` | `mobile/app.json` | ⚠️ Legacy (non più usato) |
| **Railway** | `backend-production-70dd0.up.railway.app` | Backend production | ✅ Attivo |
| **Cloudinary** | cloud: `dvbmdexl2` | `backend/.env` | ✅ Attivo |
| **Capacitor** | server: `192.168.1.74:3000` | `frontend/capacitor.config.json` | ⚠️ Legacy (non più usato) |
| **MySQL** | `localhost:3306/tournamentmaster` | `backend/.env` | ✅ Attivo |

### 2.4 IP Hardcoded da Verificare (Post-Migrazione)

**NOTA:** Con PWA-only, gli IP hardcoded di Capacitor non sono più necessari.

| File | IP/URL | Uso | Stato |
|------|--------|-----|-------|
| `frontend/.env.local` | `192.168.1.74:3001` o `localhost:3001` | API backend PWA | ✅ Verificare |
| ~~`frontend/capacitor.config.json`~~ | ~~`192.168.1.74:3000`~~ | ~~Dev server mobile~~ | ⚠️ Legacy |
| ~~`.github/workflows/build-mobile.yml`~~ | ~~`192.168.1.74:3001`~~ | ~~Build CI/CD~~ | ⚠️ Legacy |
| ~~`mobile/.env.development`~~ | ~~`192.168.1.74:3001`~~ | ~~Dev locale~~ | ⚠️ Legacy |

### 2.5 GitHub Actions Secrets (Legacy)

**NOTA:** Con PWA-only, questi secrets non sono più necessari. Mantenerli solo se si prevede un futuro ritorno alle app native.

| Secret | Uso | Stato |
|--------|-----|-------|
| `ANDROID_KEYSTORE_PASSWORD` | Firma APK release | ⚠️ Non più necessario |
| `ANDROID_KEY_ALIAS` | Alias chiave Android | ⚠️ Non più necessario |
| `ANDROID_KEY_PASSWORD` | Password chiave | ⚠️ Non più necessario |
| `IOS_CODE_SIGN_IDENTITY` | Firma iOS | ⚠️ Non più necessario |
| `IOS_PROVISIONING_PROFILE` | Profilo iOS | ⚠️ Non più necessario |
| `IOS_CERTIFICATE` | Certificato Apple | ⚠️ Non più necessario |
| `IOS_CERTIFICATE_PASSWORD` | Password certificato | ⚠️ Non più necessario |

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
temp-apk/           # Contiene app-debug.apk (7.8 MB) - legacy Android
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

### 3.5 Configurazioni Legacy (PWA Pivot)

**NUOVA SEZIONE - Componenti da archiviare dopo pivot PWA-only:**

```
mobile/                              # Intera directory Expo (~50 MB con node_modules)
├── src/                             # Codice React Native
├── assets/                          # Asset mobile
├── app.json                         # Config Expo
├── eas.json                         # Config EAS Build
├── .env.development                 # Environment vars
├── .env.production                  # Environment vars
└── node_modules/                    # Dipendenze (da eliminare)

ios-certificates/                    # Certificati Apple (~2 MB)
├── *.p12                            # Certificati
├── *.mobileprovision                # Provisioning profiles
└── README_CERTIFICATES.md           # Documentazione

frontend/capacitor.config.json       # Config wrapper nativo (~2 KB)

.github/workflows/build-mobile.yml   # CI/CD build native (~5 KB)
```

**Destinazione archivio:**
```
D:\Dev\_ARCHIVIO\TournamentMaster_Legacy_Native_Apps_20260106\
├── mobile/                          # Expo completo (senza node_modules)
├── ios-certificates/                # Certificati Apple
├── capacitor.config.json            # Config Capacitor
├── build-mobile.yml                 # GitHub Actions workflow
└── README_LEGACY.md                 # Spiegazione archivio
```

**Contenuto README_LEGACY.md:**
```markdown
# TournamentMaster - Archivio Componenti Legacy

**Data archiviazione:** 2026-01-06
**Motivo:** Pivot strategico da app native (iOS/Android) a PWA-only

## Componenti Archiviati

- **mobile/**: App Expo/React Native completa
- **ios-certificates/**: Certificati Apple Developer
- **capacitor.config.json**: Configurazione Capacitor
- **build-mobile.yml**: GitHub Actions workflow per build native

## Perché PWA-Only?

1. ✅ Costi zero (vs €124/anno Apple + Google Play)
2. ✅ Deploy immediato (vs giorni/settimane review app store)
3. ✅ Aggiornamenti istantanei (vs nuove release)
4. ✅ Stessa funzionalità (GPS, camera, offline, push)
5. ✅ Nessuna dipendenza da terze parti (app store, EAS)

## Se Serve Ripristinare

1. Copiare mobile/ in TournamentMaster/
2. npm install in mobile/
3. Configurare EAS: npx eas login
4. Build: npx eas build --platform all --profile production

## Riferimenti Storici

- Ultimo build Android: 04/01/2026 (v1.0.2)
- Ultimo tentativo iOS: 04/01/2026 (build fallito - certificati)
- Expo Project ID: 0a5f2e21-ef12-4c5a-8f3c-bf8e86ada779
```

### 3.6 File da Eliminare (non archiviare)

```
nul                             # File vuoto (errore Windows)
*.log                           # Log vuoti
.next/                          # Cache build (si rigenera)
node_modules/                   # Dipendenze (si rigenera)
frontend/.next/                 # Build cache Next.js
backend/dist/                   # Build backend (si rigenera)
mobile/node_modules/            # Dipendenze Expo (legacy)
```

---

## 4. PROCEDURA DI MIGRAZIONE

### 4.1 Pre-Requisiti (Da Verificare PRIMA di Iniziare)

```powershell
# 1. Chiudere tutti i processi
# - Claude Code
# - VS Code
# - Browser su localhost:3000/3001
# - Node.js processes (Task Manager)

# 2. Verificare spazio disco D:\
Get-PSDrive D | Select-Object @{Name="Free GB";Expression={[math]::Round($_.Free/1GB,2)}}
# Richiesto: minimo 3 GB liberi

# 3. Backup Git
cd C:\Users\marin\Downloads\TournamentMaster
git status                      # Verificare nessun pending
git add .
git commit -m "Pre-migration backup"
git push origin master

# 4. Annotare IP locale attuale
ipconfig | Select-String "IPv4"
# Tipicamente: 192.168.1.74
```

### 4.2 Fase 1: Creazione Archivi

**NUOVO: Include archiviazione componenti legacy PWA**

```powershell
# Creare directory base archivio
$date = Get-Date -Format "yyyyMMdd"  # Es: 20260106
$archiveBase = "D:\Dev\_ARCHIVIO"
New-Item -ItemType Directory -Path $archiveBase -Force

# Percorsi
$source = "C:\Users\marin\Downloads\TournamentMaster"

# 1. Screenshots (40+ file PNG root)
Write-Host "Archiviando screenshots..." -ForegroundColor Yellow
$screenshotDest = "$archiveBase\TournamentMaster_Screenshots_$date"
New-Item -ItemType Directory -Path $screenshotDest -Force
Get-ChildItem $source -Filter "*.png" | 
    Where-Object { $_.Name -match "^(test_|debug_|railway_|after_|login_|dashboard_|filled|result|pricing)" } |
    Copy-Item -Destination $screenshotDest
Write-Host "  Archiviati: $(Get-ChildItem $screenshotDest | Measure-Object).Count file" -ForegroundColor Green

# 2. Banners (10 file PNG banner/coppa)
Write-Host "Archiviando banners..." -ForegroundColor Yellow
$bannerDest = "$archiveBase\TournamentMaster_Banners_$date"
New-Item -ItemType Directory -Path $bannerDest -Force
Get-ChildItem $source -Filter "*.png" |
    Where-Object { $_.Name -match "^(Banner_|Coppa_|TOURNAMENT|qr_apk)" } |
    Copy-Item -Destination $bannerDest
Write-Host "  Archiviati: $(Get-ChildItem $bannerDest | Measure-Object).Count file" -ForegroundColor Green

# 3. Temp files (temp-apk, logs, test-results, screenshots/)
Write-Host "Archiviando temp files..." -ForegroundColor Yellow
$tempDest = "$archiveBase\TournamentMaster_TempFiles_$date"
New-Item -ItemType Directory -Path $tempDest -Force
@("temp-apk", "logs", "test-results", "screenshots") | ForEach-Object {
    if (Test-Path "$source\$_") {
        Copy-Item -Path "$source\$_" -Destination $tempDest -Recurse -Force
        Write-Host "  Archiviato: $_" -ForegroundColor Green
    }
}

# 4. Handover docs (root)
Write-Host "Archiviando handover root..." -ForegroundColor Yellow
$handoverDest = "$archiveBase\TournamentMaster_Handover_$date"
New-Item -ItemType Directory -Path $handoverDest -Force
Get-ChildItem $source -Filter "*.md" |
    Where-Object { $_.Name -match "^(HANDOVER_|DESCRIZIONE_|REPORT_|STATO_)" } |
    Copy-Item -Destination $handoverDest
Write-Host "  Archiviati: $(Get-ChildItem $handoverDest | Measure-Object).Count file" -ForegroundColor Green

# 5. Handover docs (docs/)
Write-Host "Archiviando handover docs/..." -ForegroundColor Yellow
$docsHandoverDest = "$archiveBase\TournamentMaster_DocsHandover_$date"
New-Item -ItemType Directory -Path $docsHandoverDest -Force
if (Test-Path "$source\docs") {
    Get-ChildItem "$source\docs" -Filter "*.md" |
        Where-Object { $_.Name -match "^(HANDOVER_|SESSIONE_|TEST_)" } |
        Copy-Item -Destination $docsHandoverDest
    Write-Host "  Archiviati: $(Get-ChildItem $docsHandoverDest | Measure-Object).Count file" -ForegroundColor Green
}

# 6. NUOVO: Legacy Native Apps (mobile/, ios-certificates/, capacitor.config.json)
Write-Host "Archiviando componenti legacy native apps..." -ForegroundColor Cyan
$legacyDest = "$archiveBase\TournamentMaster_Legacy_Native_Apps_$date"
New-Item -ItemType Directory -Path $legacyDest -Force

# 6a. Directory mobile/ (SENZA node_modules)
if (Test-Path "$source\mobile") {
    Write-Host "  Copiando mobile/ (escludendo node_modules)..." -ForegroundColor Gray
    robocopy "$source\mobile" "$legacyDest\mobile" /E /XD node_modules .expo /NP /NFL /NDL
    Write-Host "    mobile/ archiviato" -ForegroundColor Green
}

# 6b. Certificati iOS
if (Test-Path "$source\ios-certificates") {
    Copy-Item -Path "$source\ios-certificates" -Destination $legacyDest -Recurse -Force
    Write-Host "    ios-certificates/ archiviato" -ForegroundColor Green
}

# 6c. Capacitor config
if (Test-Path "$source\frontend\capacitor.config.json") {
    Copy-Item -Path "$source\frontend\capacitor.config.json" -Destination $legacyDest -Force
    Write-Host "    capacitor.config.json archiviato" -ForegroundColor Green
}

# 6d. GitHub Actions workflow
if (Test-Path "$source\.github\workflows\build-mobile.yml") {
    Copy-Item -Path "$source\.github\workflows\build-mobile.yml" -Destination $legacyDest -Force
    Write-Host "    build-mobile.yml archiviato" -ForegroundColor Green
}

# 6e. Creare README_LEGACY.md
$readmeContent = @"
# TournamentMaster - Archivio Componenti Legacy

**Data archiviazione:** $date
**Motivo:** Pivot strategico da app native (iOS/Android) a PWA-only

## Componenti Archiviati

- **mobile/**: App Expo/React Native completa (senza node_modules)
- **ios-certificates/**: Certificati Apple Developer
- **capacitor.config.json**: Configurazione Capacitor per wrapper nativo
- **build-mobile.yml**: GitHub Actions workflow per build Android/iOS

## Perché PWA-Only?

1. ✅ Costi zero (vs €124/anno Apple + Google Play)
2. ✅ Deploy immediato (vs giorni/settimane review app store)
3. ✅ Aggiornamenti istantanei (vs nuove release con review)
4. ✅ Stessa funzionalità (GPS, camera, offline mode, push notifications)
5. ✅ Nessuna dipendenza da terze parti (app store policies, EAS build servers)
6. ✅ Supporto multi-piattaforma identico (iOS, Android, Desktop)

## Funzionalità Mantenute in PWA

- 📍 Geolocalizzazione GPS (navigator.geolocation)
- 📷 Accesso camera (getUserMedia API)
- 💾 Storage offline (Service Workers + IndexedDB)
- 🔔 Push notifications (Web Push API)
- 📱 Installabile su home screen (Add to Home Screen)
- 🌐 Modalità offline completa (Service Worker caching)

## Se Serve Ripristinare

1. Copiare mobile/ in TournamentMaster/
2. npm install in mobile/
3. Configurare EAS: npx eas login
4. Build Android: npx eas build --platform android --profile production
5. Build iOS: npx eas build --platform ios --profile production

## Riferimenti Storici

- Ultimo build Android: 04/01/2026 (v1.0.2 - debug APK)
- Ultimo tentativo iOS: 04/01/2026 (build fallito - certificati mancanti)
- Expo Project ID: 0a5f2e21-ef12-4c5a-8f3c-bf8e86ada779
- EAS Account: marinovinc

## Dipendenze Native (Legacy)

- Expo SDK: 50.0.0
- React Native: 0.73.0
- Capacitor: 5.0.0 (frontend wrapper)
- EAS Build: ultima versione al 04/01/2026

## Note Tecniche

- Mobile/ usa React Native con Expo managed workflow
- Frontend usa Capacitor per wrapping (ora disabilitato)
- GitHub Actions workflow automatizzava build su push master
- Certificati iOS in ios-certificates/ (SENSIBILI - non condividere)

---

**Documento generato automaticamente durante migrazione TournamentMaster**
"@

Set-Content -Path "$legacyDest\README_LEGACY.md" -Value $readmeContent -Encoding UTF8
Write-Host "    README_LEGACY.md creato" -ForegroundColor Green

Write-Host ""
Write-Host "Riepilogo Archiviazione Completata:" -ForegroundColor Cyan
Write-Host "  Screenshots:      $screenshotDest" -ForegroundColor Gray
Write-Host "  Banners:          $bannerDest" -ForegroundColor Gray
Write-Host "  Temp files:       $tempDest" -ForegroundColor Gray
Write-Host "  Handover root:    $handoverDest" -ForegroundColor Gray
Write-Host "  Handover docs:    $docsHandoverDest" -ForegroundColor Gray
Write-Host "  Legacy apps:      $legacyDest" -ForegroundColor Magenta
```

### 4.3 Fase 2: Copia Progetto

```powershell
# Destinazione
$dest = "D:\Dev\TournamentMaster"

Write-Host ""
Write-Host "Iniziando copia progetto..." -ForegroundColor Cyan
Write-Host "  Da: $source" -ForegroundColor Gray
Write-Host "  A:  $dest" -ForegroundColor Gray

# Creare directory destinazione
New-Item -ItemType Directory -Path $dest -Force

# Copia con robocopy (esclude node_modules, .next, build cache)
robocopy $source $dest /E /XD node_modules .next .expo dist build `
    temp-apk logs test-results screenshots `
    mobile ios-certificates `
    /XF nul *.log `
    /NP /NFL /NDL /R:3 /W:5

if ($LASTEXITCODE -lt 8) {
    Write-Host "  Copia completata con successo" -ForegroundColor Green
} else {
    Write-Host "  ERRORE durante la copia! Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

# Dimensione post-copia
$size = (Get-ChildItem $dest -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "  Dimensione progetto copiato: $([math]::Round($size, 2)) MB" -ForegroundColor Green
```

### 4.4 Fase 3: Pulizia File Obsoleti

```powershell
Write-Host ""
Write-Host "Pulizia file obsoleti in nuovo path..." -ForegroundColor Yellow

# Eliminare file archiviati
$toDelete = @(
    "temp-apk",
    "logs",
    "test-results",
    "screenshots",
    "nul",
    "mobile",  # NUOVO: mobile/ archiviato
    "ios-certificates",  # NUOVO: certificati archiviati
    "frontend\capacitor.config.json",  # NUOVO: capacitor non più usato
    ".github\workflows\build-mobile.yml"  # NUOVO: workflow legacy
)

# Screenshots
Get-ChildItem $dest -Filter "*.png" |
    Where-Object { $_.Name -match "^(test_|debug_|railway_|after_|login_|dashboard_|filled|result|pricing)" } |
    Remove-Item -Force

# Banners
Get-ChildItem $dest -Filter "*.png" |
    Where-Object { $_.Name -match "^(Banner_|Coppa_|TOURNAMENT|qr_apk)" } |
    Remove-Item -Force

# Handover root
Get-ChildItem $dest -Filter "*.md" |
    Where-Object { $_.Name -match "^(HANDOVER_|DESCRIZIONE_|REPORT_|STATO_)" } |
    Remove-Item -Force

# Handover docs/
if (Test-Path "$dest\docs") {
    Get-ChildItem "$dest\docs" -Filter "*.md" |
        Where-Object { $_.Name -match "^(HANDOVER_|SESSIONE_|TEST_)" } |
        Remove-Item -Force
}

# Directory temporanee e legacy
foreach ($item in $toDelete) {
    $fullPath = "$dest\$item"
    if (Test-Path $fullPath) {
        Remove-Item -Recurse -Force $fullPath
        Write-Host "  Eliminato: $item" -ForegroundColor Green
    }
}

# File log
Get-ChildItem $dest -Filter "*.log" -Recurse | Remove-Item -Force

Write-Host "  Pulizia completata" -ForegroundColor Green
```

### 4.5 Fase 4: Rigenerazione node_modules

```powershell
Write-Host ""
Write-Host "Rigenerazione dipendenze..." -ForegroundColor Cyan

# Backend
Write-Host "[1/2] Backend..." -ForegroundColor Yellow
cd "$dest\backend"
if (Test-Path "package.json") {
    npm install
    npx prisma generate  # Genera client Prisma
    Write-Host "  Backend: dipendenze installate" -ForegroundColor Green
} else {
    Write-Host "  ERRORE: backend/package.json non trovato!" -ForegroundColor Red
}

# Frontend
Write-Host "[2/2] Frontend..." -ForegroundColor Yellow
cd "$dest\frontend"
if (Test-Path "package.json") {
    npm install
    Write-Host "  Frontend: dipendenze installate" -ForegroundColor Green
} else {
    Write-Host "  ERRORE: frontend/package.json non trovato!" -ForegroundColor Red
}

# NOTA: Mobile/ non più necessario (archiviato)
Write-Host ""
Write-Host "  Mobile/ NON rigenerato (componente legacy archiviato)" -ForegroundColor Magenta
```

### 4.6 Fase 5: Verifica e Aggiornamento Configurazioni

```powershell
Write-Host ""
Write-Host "Verifica configurazioni..." -ForegroundColor Cyan

# 1. Verificare .env files
Write-Host "[1/4] File .env..." -ForegroundColor Yellow
$envFiles = @(
    "$dest\backend\.env",
    "$dest\frontend\.env.local"
)
foreach ($env in $envFiles) {
    if (Test-Path $env) {
        Write-Host "  OK: $(Split-Path $env -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "  MANCANTE: $(Split-Path $env -Leaf)" -ForegroundColor Red
    }
}

# 2. Annotare IP locale per verifica manuale
Write-Host ""
Write-Host "[2/4] IP locale (verificare in .env.local):" -ForegroundColor Yellow
$ip = (ipconfig | Select-String "IPv4.*: (\d+\.\d+\.\d+\.\d+)").Matches[0].Groups[1].Value
Write-Host "  IP rilevato: $ip" -ForegroundColor Cyan
Write-Host "  Verificare che frontend/.env.local usi questo IP o localhost" -ForegroundColor Gray

# 3. Git remote
Write-Host ""
Write-Host "[3/4] Git repository..." -ForegroundColor Yellow
cd $dest
git remote -v
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Git remote configurato correttamente" -ForegroundColor Green
} else {
    Write-Host "  ERRORE: Git non configurato!" -ForegroundColor Red
}

# 4. NUOVO: Verificare rimozione config legacy
Write-Host ""
Write-Host "[4/4] Verifica rimozione componenti legacy..." -ForegroundColor Yellow
$legacyCheck = @(
    "$dest\mobile",
    "$dest\ios-certificates",
    "$dest\frontend\capacitor.config.json",
    "$dest\.github\workflows\build-mobile.yml"
)
$legacyRemoved = $true
foreach ($item in $legacyCheck) {
    if (Test-Path $item) {
        Write-Host "  ATTENZIONE: $item ancora presente" -ForegroundColor Red
        $legacyRemoved = $false
    }
}
if ($legacyRemoved) {
    Write-Host "  Tutti i componenti legacy rimossi correttamente" -ForegroundColor Green
}
```

### 4.7 Fase 6: Disabilitazione GitHub Actions (Opzionale)

**NUOVO: Disabilitare il workflow build-mobile.yml se presente**

```powershell
Write-Host ""
Write-Host "Disabilitazione workflow GitHub Actions legacy..." -ForegroundColor Cyan

$workflowPath = "$dest\.github\workflows\build-mobile.yml"
if (Test-Path $workflowPath) {
    # Rinominare per disabilitare
    Move-Item $workflowPath "$dest\.github\workflows\build-mobile.yml.disabled" -Force
    Write-Host "  Workflow rinominato in .disabled" -ForegroundColor Green
    Write-Host "  Per riabilitare: rinominare in .yml" -ForegroundColor Gray
} else {
    Write-Host "  Workflow già rimosso durante pulizia" -ForegroundColor Green
}

# Opzionale: commit cambio
cd $dest
git add .github/workflows/
git status
Write-Host ""
Write-Host "  Eseguire manualmente se si vuole committare:" -ForegroundColor Yellow
Write-Host "    git commit -m 'Disable legacy build-mobile workflow (PWA-only)'" -ForegroundColor Gray
Write-Host "    git push origin master" -ForegroundColor Gray
```

---

## 5. DIPENDENZE ESTERNE - PROCEDURE ADEGUAMENTO

### 5.1 GitHub Repository

**Nessun cambio necessario** - Git usa path relativi.

```powershell
# Verifica (già nel progetto migrato)
cd D:\Dev\TournamentMaster
git status
git remote -v  # Deve mostrare: https://github.com/Marinovinc/TournamentMaster.git

# Test push
git add .
git commit -m "Post-migration test"
git push origin master
```

### 5.2 GitHub Actions (LEGACY - Da Disabilitare)

**Status:** ⚠️ Workflow legacy per build mobile - non più necessario con PWA-only

**Azione:** Disabilitare o rimuovere `.github/workflows/build-mobile.yml`

**Opzione 1 - Disabilitare (consigliato):**
```yaml
# Aggiungere all'inizio di build-mobile.yml:
on:
  workflow_dispatch:  # Solo manuale
  # push:             # Disabilitato
  #   branches: [ master ]
```

**Opzione 2 - Rimuovere completamente:**
```powershell
cd D:\Dev\TournamentMaster
Remove-Item .github\workflows\build-mobile.yml -Force
git add .github/workflows/
git commit -m "Remove legacy mobile build workflow (PWA-only pivot)"
git push origin master
```

**Nota:** I secrets GitHub (Android keystore, iOS certificates) possono essere mantenuti per riferimento futuro o eliminati se certi di non tornare alle app native.

### 5.3 Railway (Backend Production)

**Nessun cambio necessario** - Railway è configurato per deploy automatico da GitHub.

```powershell
# Verifica URL production
curl https://backend-production-70dd0.up.railway.app/api/health

# Se risponde con 200 OK: { "status": "ok", "timestamp": "..." }
# Railway è operativo correttamente
```

**Se serve re-deploy:**
1. Accedere a [Railway Dashboard](https://railway.app)
2. Progetto: TournamentMaster Backend
3. Settings → Deploy → Trigger Deploy

### 5.4 Cloudinary (Media Storage)

**Nessun cambio necessario** - Credenziali in `backend/.env`.

```env
# backend/.env (verificare presenti)
CLOUDINARY_CLOUD_NAME=dvbmdexl2
CLOUDINARY_API_KEY=***
CLOUDINARY_API_SECRET=***
```

**Test:**
```javascript
// Test rapido in backend
const cloudinary = require('cloudinary').v2;
cloudinary.api.ping().then(() => console.log('Cloudinary OK'));
```

### 5.5 MySQL Database (Localhost)

**Verifica connessione** dopo migrazione:

```powershell
# 1. XAMPP MySQL deve essere attivo
# Control Panel → MySQL → Start

# 2. Verificare credenziali in backend/.env
cd D:\Dev\TournamentMaster\backend
cat .env | Select-String "DATABASE_URL"
# Deve essere: mysql://root@localhost:3306/tournamentmaster

# 3. Test connessione Prisma
npx prisma studio  # Apre GUI database su localhost:5555

# 4. Se schema cambiato
npx prisma generate
npx prisma db push
```

### 5.6 Expo/EAS (LEGACY - Non Più Necessario)

**Status:** ⚠️ Servizio legacy - mobile/ archiviato, non più attivamente usato

**Account:** marinovinc  
**Project ID:** 0a5f2e21-ef12-4c5a-8f3c-bf8e86ada779

**Azione:** Nessuna. EAS rimane configurato nell'archivio ma non viene più usato.

**Se serve ripristinare in futuro:**
```powershell
# 1. Ripristinare mobile/ dall'archivio
Copy-Item "D:\Dev\_ARCHIVIO\TournamentMaster_Legacy_Native_Apps_20260106\mobile" `
    -Destination "D:\Dev\TournamentMaster\mobile" -Recurse

# 2. Reinstallare dipendenze
cd D:\Dev\TournamentMaster\mobile
npm install

# 3. Login EAS
npx eas login
# Username: marinovinc

# 4. Verificare config
npx eas whoami
npx eas build:configure
```

### 5.7 Capacitor (LEGACY - Non Più Necessario)

**Status:** ⚠️ Wrapper nativo legacy - archiviato, PWA non ne ha bisogno

**Configurazione originale:** `frontend/capacitor.config.json` (ora in archivio)

**Azione:** Nessuna. Capacitor non è più usato con PWA-only.

**Nota tecnica:** PWA accede direttamente a GPS, camera, storage senza bisogno di wrapper nativo Capacitor.

---

## 6. SCRIPT AUTOMATIZZATI

### 6.1 Script Migrazione Completa

**File:** `migrate-project.ps1`

```powershell
# migrate-project.ps1
# TournamentMaster - Script Migrazione Automatizzata
# Versione: 2.0 (PWA-Only)

param(
    [switch]$DryRun = $false  # Se true, simula senza copiare
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TournamentMaster - Migrazione Progetto" -ForegroundColor Cyan
Write-Host "Versione: 2.0 (PWA-Only)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurazione
$source = "C:\Users\marin\Downloads\TournamentMaster"
$dest = "D:\Dev\TournamentMaster"
$archiveBase = "D:\Dev\_ARCHIVIO"
$date = Get-Date -Format "yyyyMMdd"

# Pre-check
Write-Host "[PRE-CHECK] Verifica prerequisiti..." -ForegroundColor Yellow

# 1. Spazio disco
$drive = Get-PSDrive D
$freeGB = [math]::Round($drive.Free / 1GB, 2)
if ($freeGB -lt 3) {
    Write-Host "ERRORE: Spazio insufficiente su D:\ ($freeGB GB liberi, richiesti 3 GB)" -ForegroundColor Red
    exit 1
}
Write-Host "  Spazio D:\: $freeGB GB liberi" -ForegroundColor Green

# 2. Source esiste
if (-not (Test-Path $source)) {
    Write-Host "ERRORE: Directory source non trovata: $source" -ForegroundColor Red
    exit 1
}
Write-Host "  Source trovato: $source" -ForegroundColor Green

# 3. Destination NON esiste già
if (Test-Path $dest) {
    Write-Host "ATTENZIONE: $dest esiste già!" -ForegroundColor Red
    $confirm = Read-Host "Sovrascrivere? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Operazione annullata." -ForegroundColor Yellow
        exit 0
    }
    Remove-Item -Recurse -Force $dest
}

# 4. Node processes
$nodeProcs = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcs) {
    Write-Host "ATTENZIONE: Processi Node.js attivi!" -ForegroundColor Yellow
    Write-Host "  Chiudere tutti i server prima di continuare." -ForegroundColor Yellow
    $confirm = Read-Host "Continuare comunque? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Operazione annullata." -ForegroundColor Yellow
        exit 0
    }
}

if ($DryRun) {
    Write-Host ""
    Write-Host "[DRY RUN MODE] Nessun file sarà copiato/modificato" -ForegroundColor Magenta
    Write-Host ""
}

# FASE 1: Archiviazione
Write-Host ""
Write-Host "[FASE 1/6] Archiviazione file obsoleti..." -ForegroundColor Cyan

# Screenshots
$screenshotDest = "$archiveBase\TournamentMaster_Screenshots_$date"
if (-not $DryRun) { New-Item -ItemType Directory -Path $screenshotDest -Force | Out-Null }
$screenshots = Get-ChildItem $source -Filter "*.png" | 
    Where-Object { $_.Name -match "^(test_|debug_|railway_|after_|login_|dashboard_|filled|result|pricing)" }
if (-not $DryRun) { $screenshots | Copy-Item -Destination $screenshotDest }
Write-Host "  Screenshots: $($screenshots.Count) file → $screenshotDest" -ForegroundColor Green

# Banners
$bannerDest = "$archiveBase\TournamentMaster_Banners_$date"
if (-not $DryRun) { New-Item -ItemType Directory -Path $bannerDest -Force | Out-Null }
$banners = Get-ChildItem $source -Filter "*.png" |
    Where-Object { $_.Name -match "^(Banner_|Coppa_|TOURNAMENT|qr_apk)" }
if (-not $DryRun) { $banners | Copy-Item -Destination $bannerDest }
Write-Host "  Banners: $($banners.Count) file → $bannerDest" -ForegroundColor Green

# Temp files
$tempDest = "$archiveBase\TournamentMaster_TempFiles_$date"
if (-not $DryRun) { New-Item -ItemType Directory -Path $tempDest -Force | Out-Null }
@("temp-apk", "logs", "test-results", "screenshots") | ForEach-Object {
    if (Test-Path "$source\$_") {
        if (-not $DryRun) { Copy-Item -Path "$source\$_" -Destination $tempDest -Recurse -Force }
        Write-Host "  Temp: $_ → $tempDest" -ForegroundColor Green
    }
}

# Handover docs
$handoverDest = "$archiveBase\TournamentMaster_Handover_$date"
if (-not $DryRun) { New-Item -ItemType Directory -Path $handoverDest -Force | Out-Null }
$handovers = Get-ChildItem $source -Filter "*.md" |
    Where-Object { $_.Name -match "^(HANDOVER_|DESCRIZIONE_|REPORT_|STATO_)" }
if (-not $DryRun) { $handovers | Copy-Item -Destination $handoverDest }
Write-Host "  Handover root: $($handovers.Count) file → $handoverDest" -ForegroundColor Green

# Handover docs/
$docsHandoverDest = "$archiveBase\TournamentMaster_DocsHandover_$date"
if (-not $DryRun) { New-Item -ItemType Directory -Path $docsHandoverDest -Force | Out-Null }
if (Test-Path "$source\docs") {
    $docsHandovers = Get-ChildItem "$source\docs" -Filter "*.md" |
        Where-Object { $_.Name -match "^(HANDOVER_|SESSIONE_|TEST_)" }
    if (-not $DryRun) { $docsHandovers | Copy-Item -Destination $docsHandoverDest }
    Write-Host "  Handover docs/: $($docsHandovers.Count) file → $docsHandoverDest" -ForegroundColor Green
}

# NUOVO: Legacy Native Apps
$legacyDest = "$archiveBase\TournamentMaster_Legacy_Native_Apps_$date"
if (-not $DryRun) { New-Item -ItemType Directory -Path $legacyDest -Force | Out-Null }

# mobile/ (senza node_modules)
if (Test-Path "$source\mobile") {
    Write-Host "  Legacy: mobile/ → $legacyDest" -ForegroundColor Magenta
    if (-not $DryRun) {
        robocopy "$source\mobile" "$legacyDest\mobile" /E /XD node_modules .expo /NP /NFL /NDL | Out-Null
    }
}

# ios-certificates/
if (Test-Path "$source\ios-certificates") {
    Write-Host "  Legacy: ios-certificates/ → $legacyDest" -ForegroundColor Magenta
    if (-not $DryRun) {
        Copy-Item -Path "$source\ios-certificates" -Destination $legacyDest -Recurse -Force
    }
}

# capacitor.config.json
if (Test-Path "$source\frontend\capacitor.config.json") {
    Write-Host "  Legacy: capacitor.config.json → $legacyDest" -ForegroundColor Magenta
    if (-not $DryRun) {
        Copy-Item -Path "$source\frontend\capacitor.config.json" -Destination $legacyDest -Force
    }
}

# build-mobile.yml
if (Test-Path "$source\.github\workflows\build-mobile.yml") {
    Write-Host "  Legacy: build-mobile.yml → $legacyDest" -ForegroundColor Magenta
    if (-not $DryRun) {
        Copy-Item -Path "$source\.github\workflows\build-mobile.yml" -Destination $legacyDest -Force
    }
}

# README_LEGACY.md
$readmeContent = @"
# TournamentMaster - Archivio Componenti Legacy

**Data archiviazione:** $date
**Motivo:** Pivot strategico da app native (iOS/Android) a PWA-only

## Componenti Archiviati
- mobile/: App Expo/React Native completa
- ios-certificates/: Certificati Apple Developer
- capacitor.config.json: Config Capacitor
- build-mobile.yml: GitHub Actions workflow

## Perché PWA-Only?
1. Costi zero vs €124/anno Apple
2. Deploy immediato vs review app store
3. Aggiornamenti istantanei
4. Stessa funzionalità (GPS, camera, offline, push)

## Ripristino
1. Copy mobile/ in TournamentMaster/
2. npm install in mobile/
3. npx eas login
4. npx eas build --platform all
"@

if (-not $DryRun) {
    Set-Content -Path "$legacyDest\README_LEGACY.md" -Value $readmeContent -Encoding UTF8
}
Write-Host "  Legacy: README_LEGACY.md creato" -ForegroundColor Magenta

# FASE 2: Copia progetto
Write-Host ""
Write-Host "[FASE 2/6] Copia progetto..." -ForegroundColor Cyan
Write-Host "  Da: $source" -ForegroundColor Gray
Write-Host "  A:  $dest" -ForegroundColor Gray

if (-not $DryRun) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    
    robocopy $source $dest /E `
        /XD node_modules .next .expo dist build temp-apk logs test-results screenshots mobile ios-certificates `
        /XF nul *.log `
        /NP /R:3 /W:5 | Out-Null
    
    if ($LASTEXITCODE -lt 8) {
        $size = (Get-ChildItem $dest -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "  Copia completata: $([math]::Round($size, 2)) MB" -ForegroundColor Green
    } else {
        Write-Host "  ERRORE copia! Exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [SIMULATO] robocopy $source $dest" -ForegroundColor Gray
}

# FASE 3: Pulizia file obsoleti
Write-Host ""
Write-Host "[FASE 3/6] Pulizia file obsoleti..." -ForegroundColor Cyan

$deleted = 0

# Screenshots
if (-not $DryRun) {
    $screenshots | ForEach-Object {
        $fullPath = "$dest\$($_.Name)"
        if (Test-Path $fullPath) { Remove-Item $fullPath -Force; $deleted++ }
    }
}
Write-Host "  Screenshot eliminati: $($screenshots.Count)" -ForegroundColor Green

# Banners
if (-not $DryRun) {
    $banners | ForEach-Object {
        $fullPath = "$dest\$($_.Name)"
        if (Test-Path $fullPath) { Remove-Item $fullPath -Force; $deleted++ }
    }
}
Write-Host "  Banner eliminati: $($banners.Count)" -ForegroundColor Green

# Handover
if (-not $DryRun) {
    $handovers | ForEach-Object {
        $fullPath = "$dest\$($_.Name)"
        if (Test-Path $fullPath) { Remove-Item $fullPath -Force; $deleted++ }
    }
    
    if (Test-Path "$dest\docs") {
        Get-ChildItem "$dest\docs" -Filter "*.md" |
            Where-Object { $_.Name -match "^(HANDOVER_|SESSIONE_|TEST_)" } |
            Remove-Item -Force
    }
}
Write-Host "  Handover eliminati: $($handovers.Count)" -ForegroundColor Green

# Directory temporanee e legacy
$toDelete = @("temp-apk", "logs", "test-results", "screenshots", "mobile", "ios-certificates")
foreach ($item in $toDelete) {
    $fullPath = "$dest\$item"
    if (Test-Path $fullPath) {
        if (-not $DryRun) { Remove-Item -Recurse -Force $fullPath }
        Write-Host "  Eliminato: $item" -ForegroundColor Green
        $deleted++
    }
}

# Capacitor config
$capacitorPath = "$dest\frontend\capacitor.config.json"
if (Test-Path $capacitorPath) {
    if (-not $DryRun) { Remove-Item $capacitorPath -Force }
    Write-Host "  Eliminato: capacitor.config.json (legacy)" -ForegroundColor Green
    $deleted++
}

# FASE 4: Rigenerazione node_modules
Write-Host ""
Write-Host "[FASE 4/6] Rigenerazione dipendenze..." -ForegroundColor Cyan

if (-not $DryRun) {
    # Backend
    Write-Host "  [1/2] Backend..." -ForegroundColor Yellow
    Push-Location "$dest\backend"
    npm install 2>&1 | Out-Null
    npx prisma generate 2>&1 | Out-Null
    Pop-Location
    Write-Host "    Backend: OK" -ForegroundColor Green
    
    # Frontend
    Write-Host "  [2/2] Frontend..." -ForegroundColor Yellow
    Push-Location "$dest\frontend"
    npm install 2>&1 | Out-Null
    Pop-Location
    Write-Host "    Frontend: OK" -ForegroundColor Green
    
    Write-Host "    Mobile: SKIPPED (legacy archiviato)" -ForegroundColor Magenta
} else {
    Write-Host "  [SIMULATO] npm install in backend/ e frontend/" -ForegroundColor Gray
}

# FASE 5: Verifica configurazioni
Write-Host ""
Write-Host "[FASE 5/6] Verifica configurazioni..." -ForegroundColor Cyan

# .env files
$envOk = $true
$envFiles = @("$dest\backend\.env", "$dest\frontend\.env.local")
foreach ($env in $envFiles) {
    if (Test-Path $env) {
        Write-Host "  OK: $(Split-Path $env -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "  MANCANTE: $(Split-Path $env -Leaf)" -ForegroundColor Red
        $envOk = $false
    }
}

# IP locale
$ip = (ipconfig | Select-String "IPv4.*: (\d+\.\d+\.\d+\.\d+)").Matches[0].Groups[1].Value
Write-Host "  IP locale: $ip" -ForegroundColor Cyan
Write-Host "    Verificare in frontend/.env.local: NEXT_PUBLIC_API_URL" -ForegroundColor Gray

# Git remote
if (-not $DryRun) {
    Push-Location $dest
    $gitRemote = git remote get-url origin 2>&1
    Pop-Location
    if ($gitRemote -match "TournamentMaster.git") {
        Write-Host "  Git remote: OK" -ForegroundColor Green
    } else {
        Write-Host "  Git remote: ERRORE" -ForegroundColor Red
    }
}

# FASE 6: Disabilitazione workflow legacy
Write-Host ""
Write-Host "[FASE 6/6] Disabilitazione workflow legacy..." -ForegroundColor Cyan

$workflowPath = "$dest\.github\workflows\build-mobile.yml"
if (Test-Path $workflowPath) {
    if (-not $DryRun) {
        Move-Item $workflowPath "$workflowPath.disabled" -Force
    }
    Write-Host "  Workflow rinominato: build-mobile.yml.disabled" -ForegroundColor Green
} else {
    Write-Host "  Workflow già rimosso" -ForegroundColor Green
}

# RIEPILOGO
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MIGRAZIONE COMPLETATA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nuovo path progetto:" -ForegroundColor Yellow
Write-Host "  $dest" -ForegroundColor White
Write-Host ""
Write-Host "Archivi creati:" -ForegroundColor Yellow
Write-Host "  Screenshots:    $archiveBase\TournamentMaster_Screenshots_$date" -ForegroundColor Gray
Write-Host "  Banners:        $archiveBase\TournamentMaster_Banners_$date" -ForegroundColor Gray
Write-Host "  Temp files:     $archiveBase\TournamentMaster_TempFiles_$date" -ForegroundColor Gray
Write-Host "  Handover:       $archiveBase\TournamentMaster_Handover_$date" -ForegroundColor Gray
Write-Host "  Docs Handover:  $archiveBase\TournamentMaster_DocsHandover_$date" -ForegroundColor Gray
Write-Host "  Legacy Apps:    $archiveBase\TournamentMaster_Legacy_Native_Apps_$date" -ForegroundColor Magenta
Write-Host ""
Write-Host "Prossimi passi:" -ForegroundColor Yellow
Write-Host "  1. Verificare frontend/.env.local (IP o localhost)" -ForegroundColor White
Write-Host "  2. Testare: cd $dest\backend && npm run dev" -ForegroundColor White
Write-Host "  3. Testare: cd $dest\frontend && npm run dev" -ForegroundColor White
Write-Host "  4. Configurare Claude Code su nuovo path" -ForegroundColor White
Write-Host "  5. (Opzionale) Eliminare C:\Users\marin\Downloads\TournamentMaster" -ForegroundColor White
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN] Nessuna modifica effettuata" -ForegroundColor Magenta
}
```

**Utilizzo:**

```powershell
# Test senza modifiche
.\migrate-project.ps1 -DryRun

# Esecuzione reale
.\migrate-project.ps1
```

### 6.2 Script Verifica Post-Migrazione

**File:** `verify-migration.ps1`

```powershell
# verify-migration.ps1
# TournamentMaster - Verifica Post-Migrazione
# Versione: 2.0 (PWA-Only)

$root = "D:\Dev\TournamentMaster"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TournamentMaster - Verifica Migrazione" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Directory esistente
Write-Host "[1/6] Directory progetto..." -ForegroundColor Yellow
if (Test-Path $root) {
    $size = (Get-ChildItem $root -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  Progetto trovato: $([math]::Round($size, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "  ERRORE: Directory non trovata!" -ForegroundColor Red
    exit 1
}

# 2. Git repository
Write-Host ""
Write-Host "[2/6] Git repository..." -ForegroundColor Yellow
Push-Location $root
git status 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Git funzionante" -ForegroundColor Green
    $remote = git remote get-url origin
    Write-Host "  Remote: $remote" -ForegroundColor Gray
} else {
    Write-Host "  Git NON funzionante!" -ForegroundColor Red
}
Pop-Location

# 3. node_modules
Write-Host ""
Write-Host "[3/6] Dipendenze npm..." -ForegroundColor Yellow
$npmDirs = @("frontend", "backend")
foreach ($dir in $npmDirs) {
    if (Test-Path "$root\$dir\node_modules") {
        $count = (Get-ChildItem "$root\$dir\node_modules" -Directory).Count
        Write-Host "  $dir`: $count moduli" -ForegroundColor Green
    } else {
        Write-Host "  $dir`: node_modules MANCANTE" -ForegroundColor Red
    }
}
Write-Host "  mobile: SKIPPED (legacy archiviato)" -ForegroundColor Magenta

# 4. File config
Write-Host ""
Write-Host "[4/6] File configurazione..." -ForegroundColor Yellow
$configFiles = @(
    "backend\.env",
    "frontend\.env.local",
    ".claudeignore"
)
foreach ($file in $configFiles) {
    if (Test-Path "$root\$file") {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  MANCANTE: $file" -ForegroundColor Yellow
    }
}

# 5. Verifica rimozione legacy
Write-Host ""
Write-Host "[5/6] Verifica rimozione componenti legacy..." -ForegroundColor Yellow
$legacyCheck = @(
    "mobile",
    "ios-certificates",
    "frontend\capacitor.config.json",
    ".github\workflows\build-mobile.yml"
)
$legacyClean = $true
foreach ($item in $legacyCheck) {
    $fullPath = "$root\$item"
    if (Test-Path $fullPath) {
        Write-Host "  ATTENZIONE: $item ancora presente" -ForegroundColor Red
        $legacyClean = $false
    } else {
        Write-Host "  OK: $item rimosso" -ForegroundColor Green
    }
}
if ($legacyClean) {
    Write-Host "  Tutti i componenti legacy rimossi" -ForegroundColor Green
}

# 6. Test server (manuale)
Write-Host ""
Write-Host "[6/6] Test server..." -ForegroundColor Yellow
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
- [ ] `.claudeignore` presente
- [ ] `backend/.env` presente con credenziali
- [ ] **NUOVO:** `mobile/` rimosso (archiviato)
- [ ] **NUOVO:** `ios-certificates/` rimosso (archiviato)
- [ ] **NUOVO:** `frontend/capacitor.config.json` rimosso (archiviato)

### Post-Setup Dipendenze
- [ ] Frontend PWA: `npm run dev` avvia su localhost:3000
- [ ] Backend: `npm run dev` avvia su localhost:3001
- [ ] ~~Mobile: `npx expo start` funziona~~ (LEGACY - non più necessario)
- [ ] Database MySQL connesso (Prisma Studio apre)
- [ ] API health check: `curl localhost:3001/api/health`

### Dipendenze Esterne
- [ ] GitHub: `git push` funziona
- [ ] ~~Expo: `npx eas whoami` mostra `marinovinc`~~ (LEGACY - opzionale)
- [ ] Railway: `curl https://backend-production-70dd0.up.railway.app/api/health`
- [ ] Cloudinary: test upload immagine funziona

### Pulizia Finale
- [ ] Archivio verificato (tutti i file in `D:\Dev\_ARCHIVIO\`)
- [ ] **NUOVO:** Archivio legacy apps verificato (`D:\Dev\_ARCHIVIO\TournamentMaster_Legacy_Native_Apps_*`)
- [ ] **NUOVO:** GitHub Actions workflow disabilitato o rimosso
- [ ] Claude Code configurato su nuovo path
- [ ] VS Code aperto su nuovo path
- [ ] Vecchia directory `Downloads\TournamentMaster` eliminata

---

## 8. ROLLBACK PLAN

### Se la migrazione fallisce:

```powershell
# 1. La directory originale NON viene eliminata automaticamente
# Può essere usata direttamente
$source = "C:\Users\marin\Downloads\TournamentMaster"

# 2. Ripristinare file archiviati (se necessario):
$date = "20260106"  # Inserire data corretta
$archiveBase = "D:\Dev\_ARCHIVIO"

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

# Ripristinare legacy apps (opzionale)
$legacyArchive = "$archiveBase\TournamentMaster_Legacy_Native_Apps_$date"
Copy-Item -Path "$legacyArchive\mobile" -Destination $source -Recurse -Force
Copy-Item -Path "$legacyArchive\ios-certificates" -Destination $source -Recurse -Force
Copy-Item -Path "$legacyArchive\capacitor.config.json" -Destination "$source\frontend" -Force
Copy-Item -Path "$legacyArchive\build-mobile.yml" -Destination "$source\.github\workflows" -Force

# 3. Rigenerare node_modules in location originale
cd "$source\frontend"; npm install
cd "$source\backend"; npm install; npx prisma generate
# Mobile opzionale se ripristinato
cd "$source\mobile"; npm install

# 4. Eliminare tentativo di migrazione fallito
Remove-Item -Recurse -Force "D:\Dev\TournamentMaster" -ErrorAction SilentlyContinue

# 5. Riconfigurare Claude Code su path originale
```

---

## 9. RISCHI E MITIGAZIONI

### 9.1 Rischi Identificati

| ID | Rischio | Probabilità | Impatto | Mitigazione |
|----|---------|-------------|---------|-------------|
| R1 | Spazio disco insufficiente | Bassa | Alto | Pre-check automatico nello script |
| R2 | File in uso durante copia | Media | Medio | Stop processi Node prima di iniziare |
| R3 | Credenziali perse (.env) | Bassa | Critico | Verifica esistenza post-copia |
| R4 | npm install fallisce | Media | Medio | package-lock.json preservato |
| R5 | Git history corrotta | Molto Bassa | Alto | Copia preserva .git intero |
| R6 | IP locale cambiato | Alta | Basso | Documentati file da aggiornare |
| R7 | ~~Secrets GitHub mancanti~~ | ~~Media~~ | ~~Medio~~ | **NON PIÙ RILEVANTE (PWA-only)** |
| R8 | Railway deployment rotto | Bassa | Alto | URL production documentati |
| R9 | **NUOVO:** Confusione su componenti legacy | Media | Basso | Documentazione chiara in README_LEGACY |
| R10 | **NUOVO:** Workflow GitHub Actions attivo | Bassa | Basso | Disabilitare workflow automaticamente |

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

**NUOVO - Se servono componenti legacy:**
```powershell
# Ripristinare mobile/ dall'archivio
$legacyArchive = "D:\Dev\_ARCHIVIO\TournamentMaster_Legacy_Native_Apps_20260106"
Copy-Item "$legacyArchive\mobile" -Destination "D:\Dev\TournamentMaster" -Recurse -Force
cd D:\Dev\TournamentMaster\mobile
npm install
```

---

## APPENDICE A: Dimensioni Stimate Post-Migrazione

| Componente | Prima | Dopo | Note |
|------------|-------|------|------|
| Root files (*.png, *.md) | ~15 MB | ~2 MB | Screenshot/banner archiviati |
| frontend/src | 500 KB | 500 KB | Invariato |
| backend/src | 200 KB | 200 KB | Invariato |
| **mobile/src** | **300 KB** | **0** | **Archiviato (legacy)** |
| **ios-certificates/** | **2 MB** | **0** | **Archiviato (legacy)** |
| docs/ | 1 MB | 600 KB | Handover archiviati |
| node_modules (backend + frontend) | ~1.5 GB | ~1.0 GB | Mobile rimosso (-500MB) |
| .next | 50 MB | 0 | Rigenerato al primo build |
| **TOTALE (senza node_modules)** | **~65 MB** | **~3 MB** | **-95%** |
| **TOTALE (con node_modules)** | **~1.6 GB** | **~1.0 GB** | **-600 MB** |

---

## APPENDICE B: Comandi Utili Post-Migrazione

```powershell
# Navigazione rapida
cd D:\Dev\TournamentMaster

# Avvio sviluppo PWA (2 terminali - mobile non più necessario)
# Terminal 1: Backend
cd D:\Dev\TournamentMaster\backend && npm run dev

# Terminal 2: Frontend PWA
cd D:\Dev\TournamentMaster\frontend && npm run dev

# Git operations
git status
git pull origin master
git push origin master

# Database
cd D:\Dev\TournamentMaster\backend
npx prisma studio        # GUI database
npx prisma migrate dev   # Applica migrazioni
npx prisma db push       # Sincronizza schema

# Build produzione PWA
cd D:\Dev\TournamentMaster\frontend && npm run build
cd D:\Dev\TournamentMaster\backend && npm run build

# LEGACY: EAS Build (solo se ripristinato mobile/)
# cd D:\Dev\TournamentMaster\mobile
# npx eas build --platform android --profile preview
# npx eas build --platform ios --profile preview
```

---

## APPENDICE C: Verifica Strategia PWA-Only

### Funzionalità Mantenute in PWA

| Funzionalità | App Nativa | PWA | API Usata |
|--------------|-----------|-----|-----------|
| **GPS/Geolocalizzazione** | ✅ | ✅ | `navigator.geolocation` |
| **Camera** | ✅ | ✅ | `navigator.mediaDevices.getUserMedia()` |
| **Offline Mode** | ✅ | ✅ | Service Workers + Cache API |
| **Push Notifications** | ✅ | ✅ | Web Push API + Service Workers |
| **Installazione Home** | ✅ | ✅ | Web App Manifest |
| **Background Sync** | ✅ | ✅ | Background Sync API |
| **File Upload** | ✅ | ✅ | `<input type="file">` |
| **Local Storage** | ✅ | ✅ | IndexedDB / localStorage |

### Funzionalità Non Disponibili (Accettate)

| Funzionalità | Motivo Accettabile |
|--------------|-------------------|
| App Store Presence | Non necessario - distribuzione via web |
| Native UI Components | Bootstrap/Tailwind sufficiente |
| Background GPS (iOS) | Limitazione iOS web - accettabile per tornei |
| Apple Pay / Google Pay | Stripe Payment Links sufficiente |

### Vantaggi Economici

| Costo | App Native | PWA | Risparmio |
|-------|-----------|-----|-----------|
| Apple Developer | €124/anno | €0 | €124/anno |
| Google Play | €30/anno | €0 | €30/anno |
| EAS Build | €0-€299/mese | €0 | €0-€299/mese |
| Code Signing | €99/anno (iOS) | €0 | €99/anno |
| **TOTALE ANNUALE** | **€253-€629** | **€0** | **€253-€629** |

---

**Documento creato da:** Claude Code  
**Versione:** 2.0 (PWA-Only Aligned)  
**Ultima modifica:** 2026-01-06 01:30  
**Changelog:**
- v1.0: Versione iniziale
- v1.1: Aggiunto Railway, GitHub Actions secrets, IP hardcoded, docs/ handover, script migliorati, sezione rischi
- **v2.0: Allineamento strategia PWA-only - archiviazione mobile/, ios-certificates/, capacitor config, disabilitazione workflow GitHub Actions, aggiornamento checklist e procedure**
