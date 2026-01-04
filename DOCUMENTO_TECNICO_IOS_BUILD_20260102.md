# DOCUMENTO TECNICO - iOS Build TournamentMaster

**Data:** 2026-01-02
**Versione:** 1.0.0
**Progetto:** TournamentMaster iOS Native Build

---

## INDICE

1. [Architettura Build iOS](#architettura-build-ios)
2. [File e Percorsi Critici](#file-e-percorsi-critici)
3. [GitHub Actions Workflow](#github-actions-workflow)
4. [Certificati e Signing](#certificati-e-signing)
5. [Capacitor Configuration](#capacitor-configuration)
6. [Comandi di Riferimento](#comandi-di-riferimento)
7. [Troubleshooting](#troubleshooting)

---

## ARCHITETTURA BUILD iOS

### Flusso di Build

```
+------------------+     +-------------------+     +------------------+
|  Frontend Web    | --> |  Capacitor Sync   | --> |  Xcode Project   |
|  (Next.js)       |     |  npx cap sync     |     |  (ios/)          |
+------------------+     +-------------------+     +------------------+
                                                           |
                                                           v
+------------------+     +-------------------+     +------------------+
|  IPA File        | <-- |  xcodebuild       | <-- |  Code Signing    |
|  Installable     |     |  (macOS runner)   |     |  (Certificates)  |
+------------------+     +-------------------+     +------------------+
```

### Componenti Coinvolti

| Componente | Tecnologia | Ruolo |
|------------|------------|-------|
| Frontend | Next.js 14 | Genera HTML/JS/CSS |
| Bridge | Capacitor 6.x | Wrap web in WebView nativa |
| Build | Xcode 15+ | Compila app iOS |
| CI/CD | GitHub Actions | Build automatizzato |
| Signing | Apple Certificates | Firma per distribuzione |

---

## FILE E PERCORSI CRITICI

### Progetto Principale

```
C:\Users\marin\Downloads\TournamentMaster\
|
+-- frontend\
|   +-- capacitor.config.json       # Configurazione Capacitor
|   +-- package.json                # Dipendenze frontend
|   +-- next.config.mjs             # Config Next.js
|   +-- out\                        # Build output (dopo npm run build)
|
+-- ios-certificates\               # CREATO IN QUESTA SESSIONE
|   +-- ios_distribution.key        # Chiave privata RSA 2048-bit
|   +-- CertificateSigningRequest.certSigningRequest  # CSR per Apple
|   +-- ios_distribution.cer        # [DA CREARE] Certificato Apple
|   +-- ios_distribution.pem        # [DA CREARE] Certificato PEM
|   +-- ios_distribution.p12        # [DA CREARE] Bundle PKCS12
|
+-- .github\
|   +-- workflows\
|       +-- build-mobile.yml        # Workflow CI/CD
|
+-- ios\                            # [NON ESISTE ANCORA]
    +-- App\                        # Verra' creato da cap add ios
        +-- App.xcworkspace         # Workspace Xcode
        +-- App.xcodeproj           # Progetto Xcode
```

### File di Configurazione Dettagliati

#### capacitor.config.json (frontend/)

```json
{
  "appId": "app.tournamentmaster.www",
  "appName": "TournamentMaster",
  "webDir": "out",
  "server": {
    "url": "http://192.168.1.74:3000",
    "cleartext": true
  },
  "ios": {
    "contentInset": "automatic",
    "preferredContentMode": "mobile"
  }
}
```

**Campi critici:**
- `appId`: Bundle ID Apple (deve corrispondere a App ID creato)
- `webDir`: Directory output Next.js
- `ios.contentInset`: Gestione safe areas

---

## GITHUB ACTIONS WORKFLOW

### File: `.github/workflows/build-mobile.yml`

**Job iOS (estratto rilevante):**

```yaml
build-ios:
  runs-on: macos-latest
  if: ${{ github.event.inputs.platform != 'android' }}

  steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Install dependencies
      run: |
        cd frontend
        npm ci

    - name: Build Frontend
      run: |
        cd frontend
        npm run build

    - name: Setup Capacitor iOS
      run: |
        cd frontend
        npx cap add ios || true
        npx cap sync ios

    - name: Setup Xcode
      uses: maxim-lobanov/setup-xcode@v1
      with:
        xcode-version: 'latest-stable'

    - name: Install CocoaPods
      run: |
        cd frontend/ios/App
        pod install

    - name: Build iOS (Debug - No Signing)
      run: |
        cd frontend/ios/App
        xcodebuild -workspace App.xcworkspace \
          -scheme App \
          -configuration Debug \
          -destination 'generic/platform=iOS Simulator' \
          CODE_SIGNING_ALLOWED=NO
```

### Secrets Richiesti per Build Release

| Secret | Descrizione | Come Ottenere |
|--------|-------------|---------------|
| `IOS_CERTIFICATE` | Base64 del .p12 | `base64 -i ios_distribution.p12` |
| `IOS_CERTIFICATE_PASSWORD` | Password .p12 | Scelto durante export |
| `IOS_CODE_SIGN_IDENTITY` | Identity signing | "Apple Distribution: [Nome]" |
| `IOS_PROVISIONING_PROFILE` | Base64 .mobileprovision | `base64 -i profile.mobileprovision` |

### Come Configurare Secrets

```bash
# 1. Converti in Base64 (su Mac/Linux)
base64 -i ios_distribution.p12 | tr -d '\n' > cert_base64.txt
base64 -i TournamentMaster.mobileprovision | tr -d '\n' > profile_base64.txt

# 2. Su GitHub
# Repository > Settings > Secrets and variables > Actions > New repository secret
# Incolla contenuto file .txt come valore
```

---

## CERTIFICATI E SIGNING

### Tipi di Certificato Apple

| Tipo | Uso | Distribuzione |
|------|-----|---------------|
| Development | Testing locale | Solo dispositivi registrati |
| Ad Hoc | Testing esterno | Max 100 dispositivi UDID |
| App Store | Produzione | Pubblico via App Store |
| Enterprise | Aziendale | Solo uso interno aziendale |

### Flusso Creazione Certificato

```
1. Genera chiave privata (FATTO)
   openssl genrsa -out ios_distribution.key 2048

2. Genera CSR (FATTO)
   openssl req -new -key ios_distribution.key -out CSR.certSigningRequest

3. Upload CSR su Apple Developer Portal (TODO)
   Certificates > + > Apple Distribution > Upload CSR

4. Download .cer da Apple (TODO)
   Download ios_distribution.cer

5. Converti in PEM (TODO)
   openssl x509 -in ios_distribution.cer -inform DER -out ios_distribution.pem

6. Crea bundle P12 (TODO)
   openssl pkcs12 -export -out ios_distribution.p12 \
     -inkey ios_distribution.key \
     -in ios_distribution.pem \
     -password pass:TUA_PASSWORD

7. Converti P12 in Base64 per GitHub (TODO)
   base64 -i ios_distribution.p12 | tr -d '\n'
```

### CSR Generato (Dettagli)

```
Subject:
  CN = TournamentMaster Distribution
  emailAddress = developer@tournamentmaster.app
  C = IT

Key Algorithm: RSA 2048-bit
Hash Algorithm: SHA-256
```

---

## CAPACITOR CONFIGURATION

### Struttura ios/ (Dopo `cap add ios`)

```
ios/
+-- App/
|   +-- App/
|   |   +-- AppDelegate.swift       # Entry point iOS
|   |   +-- Info.plist              # Configurazione app
|   |   +-- Assets.xcassets/        # Icone e assets
|   |   +-- Base.lproj/             # Storyboards
|   +-- App.xcodeproj/              # Progetto Xcode
|   +-- App.xcworkspace/            # Workspace (con CocoaPods)
|   +-- Podfile                     # Dipendenze CocoaPods
+-- capacitor-cordova-ios-plugins/  # Plugin bridge
```

### Capacitor CLI Commands

```bash
# Aggiungere piattaforma iOS
npx cap add ios

# Sincronizzare web assets
npx cap sync ios

# Aggiornare configurazione
npx cap update ios

# Aprire in Xcode
npx cap open ios

# Copiare solo assets (senza update plugins)
npx cap copy ios
```

### Info.plist Permissions

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

---

## COMANDI DI RIFERIMENTO

### OpenSSL (Windows con Git Bash)

```bash
# IMPORTANTE: Git Bash converte i path, usare MSYS_NO_PATHCONV=1

# Generare chiave privata
openssl genrsa -out ios_distribution.key 2048

# Generare CSR
MSYS_NO_PATHCONV=1 openssl req -new \
  -key ios_distribution.key \
  -out CertificateSigningRequest.certSigningRequest \
  -subj "/CN=TournamentMaster Distribution/emailAddress=developer@tournamentmaster.app/C=IT"

# Verificare CSR
openssl req -text -noout -verify -in CertificateSigningRequest.certSigningRequest

# Convertire DER in PEM
openssl x509 -in ios_distribution.cer -inform DER -out ios_distribution.pem

# Creare P12
openssl pkcs12 -export \
  -out ios_distribution.p12 \
  -inkey ios_distribution.key \
  -in ios_distribution.pem \
  -password pass:TUA_PASSWORD
```

### Build Locale (Richiede Mac)

```bash
cd frontend

# Build Next.js
npm run build

# Sync Capacitor
npx cap sync ios

# Apri Xcode
npx cap open ios

# Oppure build da terminale
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive

# Esporta IPA
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build/ipa \
  -exportOptionsPlist ExportOptions.plist
```

### GitHub Actions Trigger

```bash
# Triggera workflow manualmente via CLI
gh workflow run build-mobile.yml \
  -f platform=ios \
  -f build_type=release
```

---

## TROUBLESHOOTING

### Errore: MSYS_NO_PATHCONV

**Problema:** OpenSSL fallisce con `subject name is expected to be in the format /type0=value0...`

**Causa:** Git Bash converte `/CN=` in path Windows

**Soluzione:**
```bash
MSYS_NO_PATHCONV=1 openssl req ...
```

### Errore: Team ID Not Found

**Problema:** `Unable to find a team with the given Team ID`

**Causa:** Account Apple Developer appena creato, non ancora attivato

**Soluzione:** Attendere 24-48h per attivazione Apple

### Errore: Code Signing Required

**Problema:** Build fallisce con `Code signing is required for product type 'Application'`

**Causa:** Build Release richiede certificati validi

**Soluzione:**
- Per testing: usare `CODE_SIGNING_ALLOWED=NO` con destinazione Simulator
- Per distribuzione: configurare certificati e secrets

### Errore: Provisioning Profile Mismatch

**Problema:** `Provisioning profile doesn't match bundle identifier`

**Causa:** Bundle ID in Xcode diverso da quello nel profile

**Soluzione:**
- Verificare `appId` in capacitor.config.json
- Verificare Bundle ID in App ID su Apple Developer
- Ricreare Provisioning Profile se necessario

### Errore: Pod Install Failed

**Problema:** `CocoaPods could not find compatible versions`

**Causa:** Versioni plugin incompatibili

**Soluzione:**
```bash
cd ios/App
rm -rf Pods Podfile.lock
pod repo update
pod install
```

---

## RIFERIMENTI ESTERNI

| Risorsa | URL |
|---------|-----|
| Apple Developer Portal | https://developer.apple.com/account |
| Certificates, IDs & Profiles | https://developer.apple.com/account/resources/certificates/list |
| Capacitor iOS Docs | https://capacitorjs.com/docs/ios |
| GitHub Actions iOS | https://docs.github.com/en/actions/deployment/deploying-xcode-applications |
| Xcode Build Settings | https://developer.apple.com/documentation/xcode/build-settings-reference |

---

## CREDENZIALI PROGETTO

| Credenziale | Valore |
|-------------|--------|
| Apple ID | marino@unitec.it |
| Team ID | FV9UXZSP65 |
| Bundle ID | app.tournamentmaster.www |
| App Name | TournamentMaster |

---

## CHECKLIST COMPLETAMENTO

- [x] Registrazione Apple Developer
- [x] Pagamento $99/anno
- [x] Generazione chiave privata
- [x] Generazione CSR
- [ ] Attivazione account Apple (in attesa)
- [ ] Upload CSR su portale
- [ ] Download certificato .cer
- [ ] Conversione in .p12
- [ ] Creazione App ID
- [ ] Creazione Provisioning Profile
- [ ] Configurazione GitHub Secrets
- [ ] Test build Debug
- [ ] Test build Release
- [ ] Upload IPA su TestFlight

---

*Documento Tecnico generato il 2026-01-02*
*Progetto: TournamentMaster - iOS Native Build*
