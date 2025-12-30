# Guida Pratica: React Native per TournamentMaster

## Indice
1. [Cos'e React Native](#1-cose-react-native)
2. [Requisiti per Piattaforma](#2-requisiti-per-piattaforma)
3. [Setup Ambiente Windows](#3-setup-ambiente-windows)
4. [Sviluppo iOS da Windows](#4-sviluppo-ios-da-windows-expo)
5. [Struttura Progetto](#5-struttura-progetto)
6. [Comandi Essenziali](#6-comandi-essenziali)
7. [Debug e Testing](#7-debug-e-testing)
8. [Pubblicazione App Store](#8-pubblicazione-app-store)

---

## 1. Cos'e React Native

React Native e' un framework per creare app mobile **native** usando JavaScript/TypeScript.

```
┌─────────────────────────────────────────────────────────┐
│                    CODICE UNICO                         │
│              (JavaScript/TypeScript)                    │
│                                                         │
│    Components, Business Logic, API calls, State        │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
   ┌──────────────┐       ┌──────────────┐
   │   iOS App    │       │ Android App  │
   │   (Swift)    │       │   (Kotlin)   │
   │  App Store   │       │  Play Store  │
   └──────────────┘       └──────────────┘
```

**Vantaggi:**
- Un solo codebase per iOS e Android
- Performance quasi nativa (non e' una WebView)
- Hot Reload durante sviluppo
- Grande community e librerie

**Svantaggi:**
- Serve Mac per compilare iOS
- Alcune funzionalita native richiedono codice specifico
- Bundle size maggiore di app native pure

---

## 2. Requisiti per Piattaforma

### Per sviluppare Android:
| Requisito | Note |
|-----------|------|
| Windows/Mac/Linux | Qualsiasi OS |
| Android Studio | SDK, Emulatore |
| JDK 17 | Java Development Kit |
| Node.js 18+ | Runtime JavaScript |

### Per sviluppare iOS:
| Requisito | Note |
|-----------|------|
| **macOS** | OBBLIGATORIO |
| Xcode 15+ | Da App Store (gratis) |
| CocoaPods | Gestore dipendenze iOS |
| Node.js 18+ | Runtime JavaScript |

### Per pubblicare:
| Store | Requisito | Costo |
|-------|-----------|-------|
| App Store | Apple Developer Account | $99/anno |
| Play Store | Google Developer Account | $25 una tantum |

---

## 3. Setup Ambiente Windows

### 3.1 Prerequisiti Base

```powershell
# 1. Installa Node.js (se non presente)
# Scarica da: https://nodejs.org/

# 2. Verifica installazione
node --version   # Deve essere >= 18
npm --version

# 3. Installa React Native CLI
npm install -g react-native-cli
```

### 3.2 Setup Android (su Windows)

1. **Scarica Android Studio**: https://developer.android.com/studio

2. **Durante installazione, seleziona:**
   - Android SDK
   - Android SDK Platform-Tools
   - Android Virtual Device

3. **Configura variabili ambiente** (PowerShell Admin):
```powershell
# Aggiungi ANDROID_HOME
[Environment]::SetEnvironmentVariable(
    "ANDROID_HOME",
    "$env:LOCALAPPDATA\Android\Sdk",
    "User"
)

# Aggiungi al PATH
$path = [Environment]::GetEnvironmentVariable("Path", "User")
$newPath = "$path;$env:LOCALAPPDATA\Android\Sdk\platform-tools"
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
```

4. **Riavvia terminale e verifica:**
```powershell
adb --version
```

5. **Crea emulatore in Android Studio:**
   - Tools → Device Manager → Create Device
   - Pixel 6 → API 34 → Finish

### 3.3 Avvio App Android

```bash
cd C:\Users\marin\Downloads\TournamentMaster\mobile

# Avvia Metro bundler
npm start

# In altro terminale: avvia app
npm run android
```

---

## 4. Sviluppo iOS da Windows (Expo)

**Non puoi compilare iOS nativamente su Windows.** Ma puoi usare Expo.

### 4.1 Cos'e Expo

Expo e' un layer sopra React Native che:
- Permette di testare su iPhone fisico senza Mac
- Compila app iOS nel cloud
- Semplifica configurazione

```
┌─────────────────────────────────────────────────────────┐
│                    TU (Windows)                         │
│                                                         │
│  Scrivi codice → Expo Go (app sul tuo iPhone)          │
│                  vedi modifiche in tempo reale          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              EXPO EAS BUILD (Cloud)                     │
│                                                         │
│  Quando pronto → Compila .ipa su server Mac Apple      │
│                  Pubblica su App Store                  │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Migrazione a Expo

```bash
cd C:\Users\marin\Downloads\TournamentMaster\mobile

# Installa Expo
npm install expo

# Installa Expo CLI globale
npm install -g eas-cli

# Inizializza Expo nel progetto esistente
npx expo install expo-dev-client

# Crea account Expo (gratis)
eas login
```

### 4.3 Test su iPhone Fisico

1. **Scarica "Expo Go"** dall'App Store sul tuo iPhone

2. **Avvia development server:**
```bash
npx expo start
```

3. **Scansiona QR code** con fotocamera iPhone

4. **L'app si apre in Expo Go** - modifiche live!

### 4.4 Build iOS per App Store

```bash
# Configura progetto
eas build:configure

# Build iOS (richiede Apple Developer Account)
eas build --platform ios

# Submit ad App Store
eas submit --platform ios
```

---

## 5. Struttura Progetto

```
TournamentMaster/mobile/
│
├── App.tsx                 # Entry point principale
├── index.js                # Registrazione app
├── package.json            # Dipendenze
├── tsconfig.json           # Config TypeScript
├── babel.config.js         # Config Babel
├── metro.config.js         # Config Metro bundler
│
├── android/                # Codice nativo Android
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   └── gradle.properties
│
├── ios/                    # Codice nativo iOS (solo su Mac)
│   ├── Podfile
│   └── TournamentMaster/
│
└── src/
    ├── api/                # Chiamate HTTP al backend
    │   ├── client.ts       # Axios instance
    │   ├── auth.ts         # Login/Register
    │   ├── tournaments.ts  # CRUD tornei
    │   └── catches.ts      # Registrazione catture
    │
    ├── components/         # Componenti riutilizzabili
    │   ├── common/         # Button, Input, Card
    │   └── tournaments/    # TournamentCard, etc.
    │
    ├── config/             # Configurazione
    │   ├── environment.ts  # URL API per ambiente
    │   └── theme.ts        # Colori, spacing
    │
    ├── hooks/              # Custom hooks
    │   ├── useAuth.ts      # Stato autenticazione
    │   └── useGPS.ts       # Geolocalizzazione
    │
    ├── navigation/         # React Navigation
    │   ├── AppNavigator.tsx
    │   ├── AuthNavigator.tsx
    │   └── MainTabNavigator.tsx
    │
    ├── screens/            # Schermate app
    │   ├── LoginScreen.tsx
    │   ├── HomeScreen.tsx
    │   ├── TournamentsScreen.tsx
    │   └── ...
    │
    └── types/              # TypeScript types
        └── index.ts
```

---

## 6. Comandi Essenziali

### Sviluppo

```bash
# Avvia Metro bundler
npm start

# Avvia su Android
npm run android

# Avvia su iOS (solo Mac)
npm run ios

# Reset cache Metro
npm start -- --reset-cache

# Pulisci build Android
cd android && ./gradlew clean && cd ..

# Reinstalla pod iOS (solo Mac)
cd ios && pod install && cd ..
```

### Build Produzione

```bash
# Android APK (debug)
cd android && ./gradlew assembleDebug

# Android AAB (release per Play Store)
cd android && ./gradlew bundleRelease

# iOS (solo Mac, da Xcode)
# Product → Archive → Distribute App
```

### Con Expo

```bash
# Avvia development server
npx expo start

# Build Android
eas build --platform android

# Build iOS
eas build --platform ios

# Build entrambi
eas build --platform all
```

---

## 7. Debug e Testing

### 7.1 React Native Debugger

```bash
# Installa (Windows)
choco install react-native-debugger

# Oppure scarica da:
# https://github.com/jhen0409/react-native-debugger/releases
```

Poi nell'app: Shake device → Debug

### 7.2 Flipper (Alternativa)

Scarica da https://fbflipper.com/

### 7.3 Console Log

```bash
# Android
npx react-native log-android

# iOS
npx react-native log-ios

# Oppure in Metro bundler premi 'd' per DevTools
```

### 7.4 Testing

```bash
# Unit test con Jest
npm test

# Test specifico file
npm test -- LoginScreen.test.tsx

# Coverage
npm test -- --coverage
```

---

## 8. Pubblicazione App Store

### 8.1 Preparazione

1. **Icone app** - tutte le dimensioni richieste
2. **Screenshot** - per ogni device supportato
3. **Privacy Policy** - URL obbligatorio
4. **Descrizione** - multilingua se necessario

### 8.2 Apple App Store

**Requisiti:**
- Apple Developer Account ($99/anno)
- Mac con Xcode (o Expo EAS)
- Certificati e Provisioning Profiles

**Processo:**
1. Crea App ID in Apple Developer Portal
2. Genera certificati (Development + Distribution)
3. Crea Provisioning Profile
4. Build con Xcode o `eas build --platform ios`
5. Upload con Transporter o `eas submit`
6. Compila metadata in App Store Connect
7. Submit per review (1-3 giorni)

### 8.3 Google Play Store

**Requisiti:**
- Google Developer Account ($25 una tantum)
- Keystore firmato

**Processo:**
1. Genera keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore tournamentmaster.keystore \
  -alias tournamentmaster -keyalg RSA \
  -keysize 2048 -validity 10000
```

2. Configura `android/app/build.gradle`
3. Build: `./gradlew bundleRelease`
4. Upload AAB su Play Console
5. Compila scheda store
6. Submit per review (ore-giorni)

---

## 9. Checklist Rapida

### Prima di sviluppare:
- [ ] Node.js 18+ installato
- [ ] npm/yarn funzionante
- [ ] Android Studio (per Android)
- [ ] Xcode (per iOS, solo Mac)
- [ ] Account Expo (per build cloud)

### Prima di pubblicare:
- [ ] Apple Developer Account (iOS)
- [ ] Google Developer Account (Android)
- [ ] Icone tutte le dimensioni
- [ ] Screenshot per store
- [ ] Privacy Policy URL
- [ ] Testato su device reali

---

## 10. Risorse Utili

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Play Store Guidelines](https://play.google.com/about/developer-content-policy/)

---

## Per TournamentMaster

La struttura e' gia pronta in:
```
C:\Users\marin\Downloads\TournamentMaster\mobile\
```

**Prossimi passi consigliati:**

1. Installa Expo per testare su iPhone:
   ```bash
   cd mobile
   npm install expo
   npx expo start
   ```

2. Scarica Expo Go sul tuo iPhone

3. Scansiona QR e testa l'app

4. Quando pronto, crea Apple Developer Account e usa EAS per build

