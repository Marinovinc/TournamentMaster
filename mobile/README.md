# TournamentMaster Mobile App

App mobile React Native per iOS e Android - Gestione tornei di pesca sportiva.

## Requisiti

### Sviluppo
- Node.js >= 18
- npm o yarn
- React Native CLI
- Xcode 15+ (per iOS, solo macOS)
- Android Studio (per Android)
- JDK 17

### Account (per pubblicazione)
- Apple Developer Account ($99/anno) per App Store
- Google Play Developer Account ($25 una tantum) per Play Store

## Setup Ambiente

### 1. Installazione dipendenze

```bash
cd mobile
npm install
```

### 2. iOS Setup (solo macOS)

```bash
cd ios
pod install
cd ..
```

### 3. Android Setup

Assicurati che `ANDROID_HOME` sia configurato:

```bash
# Windows (PowerShell)
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# macOS/Linux
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## Avvio App

### Backend (deve essere attivo)

```bash
# Dalla root del progetto TournamentMaster
cd backend
npm run dev
# Backend disponibile su http://localhost:3001
```

### iOS Simulator

```bash
npm run ios
# oppure
npx react-native run-ios
```

### Android Emulator

```bash
npm run android
# oppure
npx react-native run-android
```

## Configurazione Ambiente

### Sviluppo Locale

Il file `.env.development` e' gia configurato per:
- Android Emulator: usa `10.0.2.2` per raggiungere localhost
- iOS Simulator: usa `localhost` direttamente

```env
API_BASE_URL=http://10.0.2.2:3001/api/v1
WS_BASE_URL=ws://10.0.2.2:3001
ENV=development
```

### Produzione

Crea `.env.production` con gli URL del server di produzione:

```env
API_BASE_URL=https://api.tournamentmaster.com/api/v1
WS_BASE_URL=wss://api.tournamentmaster.com
ENV=production
```

## Struttura Progetto

```
mobile/
├── src/
│   ├── api/              # Client API (auth, tournaments, catches)
│   ├── components/       # Componenti riutilizzabili
│   │   ├── common/       # Button, Input, Card, etc.
│   │   └── tournaments/  # TournamentCard, etc.
│   ├── config/           # Configurazione ambiente
│   ├── hooks/            # Custom hooks (useAuth, useGPS)
│   ├── navigation/       # React Navigation setup
│   ├── screens/          # Schermate app
│   └── types/            # TypeScript types
├── App.tsx               # Entry point app
├── index.js              # Registrazione app
├── package.json
├── tsconfig.json
├── babel.config.js
└── app.json
```

## Funzionalita Principali

### Autenticazione
- Login/Registrazione
- JWT con refresh token
- Persistenza sessione (AsyncStorage)

### Tornei
- Lista tornei disponibili
- Dettaglio torneo con regolamento
- Iscrizione a tornei
- Classifica live

### Catture
- Registrazione cattura con foto
- Validazione GPS (verifica zona pesca)
- Selezione specie e peso
- Cronologia catture personali

### Profilo
- Statistiche pescatore
- Storico tornei
- Impostazioni account

## Permessi Richiesti

### iOS (Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Serve per validare la zona di pesca delle catture</string>
<key>NSCameraUsageDescription</key>
<string>Serve per fotografare le catture</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Serve per selezionare foto delle catture</string>
```

### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

## Debug

### React Native Debugger

```bash
# Installa debugger
brew install --cask react-native-debugger

# Avvia prima di lanciare l'app
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

### Log Metro

```bash
npx react-native log-ios
npx react-native log-android
```

### Flipper (alternativa)

Scarica da https://fbflipper.com/ per debugging avanzato.

## Build Produzione

### iOS

```bash
# Genera archivio per App Store
npx react-native build-ios --mode=Release

# Oppure da Xcode:
# Product > Archive
```

### Android

```bash
# Genera APK
cd android
./gradlew assembleRelease

# Genera AAB per Play Store
./gradlew bundleRelease
```

Gli artefatti si trovano in:
- APK: `android/app/build/outputs/apk/release/`
- AAB: `android/app/build/outputs/bundle/release/`

## Troubleshooting

### Metro Bundler non parte

```bash
npx react-native start --reset-cache
```

### Pod install fallisce (iOS)

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Build Android fallisce

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Errore "Unable to load script"

Assicurati che Metro sia attivo e che l'emulatore possa raggiungere localhost:8081.

Per Android:
```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3001 tcp:3001
```

## Risorse

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Zustand State Management](https://docs.pmnd.rs/zustand/getting-started/introduction)
