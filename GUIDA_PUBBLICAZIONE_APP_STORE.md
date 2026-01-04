# Guida Completa: Pubblicazione TournamentMaster su App Store

**Data:** 2026-01-03
**Apple ID:** marino@unitec.it
**Bundle ID:** com.tournamentmaster.app

---

## INDICE

1. [Prerequisiti](#1-prerequisiti)
2. [Creare l'App su App Store Connect](#2-creare-lapp-su-app-store-connect)
3. [Ottenere i Dati Apple Necessari](#3-ottenere-i-dati-apple-necessari)
4. [Configurare EAS](#4-configurare-eas)
5. [Preparare Screenshots](#5-preparare-screenshots)
6. [Build iOS con EAS](#6-build-ios-con-eas)
7. [Submit su App Store](#7-submit-su-app-store)
8. [Gestire la Review Apple](#8-gestire-la-review-apple)

---

## 1. PREREQUISITI

### Verifica di avere:

- [x] Apple Developer Account attivo ($99/anno)
- [x] Apple ID: marino@unitec.it
- [ ] Xcode installato (per certificati, se necessario)
- [x] Node.js e npm installati
- [x] EAS CLI installato (`npm install -g eas-cli`)
- [x] Progetto Expo configurato

### Verifica EAS CLI

```bash
# Verifica installazione
eas --version

# Se non installato
npm install -g eas-cli

# Login con account Expo
eas login
```

---

## 2. CREARE L'APP SU APP STORE CONNECT

### Passo 2.1: Accedi a App Store Connect

1. Vai su https://appstoreconnect.apple.com
2. Login con **marino@unitec.it**
3. Clicca su **"My Apps"**

### Passo 2.2: Crea Nuova App

1. Clicca il pulsante **"+"** in alto a sinistra
2. Seleziona **"New App"**

### Passo 2.3: Compila i Dati Base

| Campo | Valore |
|-------|--------|
| **Platforms** | iOS |
| **Name** | TournamentMaster |
| **Primary Language** | Italian |
| **Bundle ID** | com.tournamentmaster.app |
| **SKU** | TOURNAMENTMASTER001 |
| **User Access** | Full Access |

4. Clicca **"Create"**

### Passo 2.4: Annota l'Apple ID dell'App

Dopo la creazione:
1. Vai su **App Information** nel menu laterale
2. Trova **"Apple ID"** (numero tipo: 1234567890)
3. **ANNOTALO** - serve per eas.json

---

## 3. OTTENERE I DATI APPLE NECESSARI

### 3.1: Apple ID (email)
```
marino@unitec.it
```

### 3.2: ASC App ID (Apple Store Connect App ID)

1. App Store Connect > My Apps > TournamentMaster
2. App Information > Apple ID
3. Numero tipo: **1234567890**

### 3.3: Apple Team ID

1. Vai su https://developer.apple.com/account
2. Membership > Team ID
3. Codice tipo: **ABC123XYZ**

**OPPURE** da terminale:
```bash
# EAS puo' trovarlo automaticamente
eas credentials --platform ios
```

---

## 4. CONFIGURARE EAS

### 4.1: Aggiorna eas.json

Modifica il file `mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "resourceClass": "m1-medium"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "marino@unitec.it",
        "ascAppId": "IL_TUO_ASC_APP_ID",
        "appleTeamId": "IL_TUO_TEAM_ID"
      }
    }
  }
}
```

### 4.2: Verifica app.json

Il file `mobile/app.json` deve avere:

```json
{
  "expo": {
    "name": "TournamentMaster",
    "slug": "tournamentmaster",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.tournamentmaster.app",
      "buildNumber": "1"
    }
  }
}
```

---

## 5. PREPARARE SCREENSHOTS

### Dimensioni Richieste

| Device | Dimensioni (px) | Obbligatorio |
|--------|-----------------|--------------|
| iPhone 6.9" (15 Pro Max) | 1320 x 2868 | Si |
| iPhone 6.7" (14 Plus) | 1290 x 2796 | Si |
| iPhone 6.5" (11 Pro Max) | 1242 x 2688 | No |
| iPad Pro 12.9" | 2048 x 2732 | Se supporti tablet |

### Schermate Consigliate (6 max)

1. **Dashboard** - Prima impressione dell'app
2. **Lista Tornei** - Mostra i tornei disponibili
3. **Strike Live** - Feature principale
4. **Classifica** - Risultati in tempo reale
5. **Gestione Barca** - Per organizzatori
6. **Profilo** - Area utente

### Generare Screenshots

```bash
# Avvia l'app in simulatore
cd mobile
npx expo start --ios

# Usa Cmd+S nel simulatore per salvare screenshot
# Oppure usa strumenti come Fastlane Snapshot
```

---

## 6. BUILD iOS CON EAS

### 6.1: Build di Produzione

```bash
cd C:\Users\marin\Downloads\TournamentMaster\mobile

# Build iOS per App Store
eas build --platform ios --profile production
```

### 6.2: Cosa Succede Durante la Build

1. EAS chiede le credenziali Apple (se non salvate)
2. Genera/usa certificati di distribuzione
3. Compila l'app sui server Expo
4. Genera file IPA firmato
5. Tempo stimato: 15-30 minuti

### 6.3: Monitorare la Build

```bash
# Vedi stato build
eas build:list

# Vedi dettagli build specifica
eas build:view
```

### 6.4: Output

Al termine avrai:
- Link per scaricare il file .ipa
- Build pronta per submission

---

## 7. SUBMIT SU APP STORE

### Metodo A: Submit Automatico con EAS

```bash
# Submit diretto dopo build
eas submit --platform ios --latest

# Oppure specifica una build
eas submit --platform ios --id BUILD_ID
```

### Metodo B: Submit Manuale via Transporter

1. Scarica il file .ipa dalla build EAS
2. Apri **Transporter** (app Apple, gratuita su Mac App Store)
3. Trascina il file .ipa
4. Clicca **"Deliver"**

### Metodo C: Submit da App Store Connect

1. Vai su App Store Connect
2. My Apps > TournamentMaster
3. iOS App > Build
4. La build apparira' dopo upload

---

## 8. GESTIRE LA REVIEW APPLE

### 8.1: Compila i Metadati su App Store Connect

Prima di inviare per review:

1. **Version Information**
   - Screenshots (carica per ogni dimensione)
   - Description (copia da APP_STORE_METADATA.md)
   - Keywords
   - Support URL
   - Marketing URL

2. **App Review Information**
   - Contact info
   - Demo account credentials
   - Notes for reviewer

3. **Pricing and Availability**
   - Price: Free
   - Availability: All countries (o seleziona)

4. **App Privacy**
   - Privacy Policy URL
   - Data collection questionnaire

### 8.2: Submit for Review

1. Verifica tutti i campi compilati
2. Clicca **"Add for Review"**
3. Poi **"Submit to App Review"**

### 8.3: Tempi di Review

| Tipo | Tempo Medio |
|------|-------------|
| Prima submission | 24-48 ore |
| Update | 24 ore |
| Expedited Review | 12-24 ore (richiesta speciale) |

### 8.4: Possibili Esiti

| Esito | Azione |
|-------|--------|
| **Approved** | App pubblicata automaticamente |
| **Rejected** | Leggi motivo, correggi, ri-submit |
| **In Review** | Attendi |
| **Metadata Rejected** | Correggi solo metadati, no rebuild |

---

## COMANDI RAPIDI

```bash
# Setup iniziale
cd C:\Users\marin\Downloads\TournamentMaster\mobile
eas login

# Build iOS
eas build --platform ios --profile production

# Submit dopo build
eas submit --platform ios --latest

# Vedi stato
eas build:list
eas submit:list

# Credenziali
eas credentials --platform ios
```

---

## TROUBLESHOOTING

### "Missing provisioning profile"

```bash
# Rigenera credenziali
eas credentials --platform ios
# Seleziona "Build Credentials" > "Create new"
```

### "Bundle ID already in use"

Il bundle ID `com.tournamentmaster.app` e' gia' registrato da qualcun altro.
Soluzione: Usa un bundle ID diverso, es: `com.marinovinc.tournamentmaster`

### "Invalid binary"

Verifica:
1. Version e buildNumber in app.json
2. Bundle ID corrisponde a App Store Connect
3. Certificati validi

### Build fallita

```bash
# Vedi log completo
eas build:view --platform ios

# Riprova con cache pulita
eas build --platform ios --clear-cache
```

---

## CHECKLIST FINALE

### Prima della Build
- [ ] Apple Developer Account attivo
- [ ] App creata su App Store Connect
- [ ] ASC App ID e Team ID in eas.json
- [ ] app.json con version e buildNumber corretti
- [ ] Backend deployato su server pubblico (non localhost!)

### Prima del Submit
- [ ] Screenshots per tutte le dimensioni
- [ ] Descrizione compilata
- [ ] Keywords inserite
- [ ] Privacy Policy URL funzionante
- [ ] Account demo per reviewer
- [ ] Age Rating compilato

### Prima della Review
- [ ] Test completo su device reale
- [ ] Tutti i link funzionanti
- [ ] Nessun placeholder o "Lorem ipsum"
- [ ] App funziona senza crash

---

## PROSSIMI PASSI IMMEDIATI

1. **Accedi a App Store Connect** e crea l'app
2. **Annota ASC App ID e Team ID**
3. **Aggiorna eas.json** con i dati
4. **Prepara screenshots**
5. **Esegui build**: `eas build --platform ios --profile production`
6. **Submit**: `eas submit --platform ios --latest`

---

*Guida creata il 2026-01-03 per pubblicazione TournamentMaster su Apple App Store*
