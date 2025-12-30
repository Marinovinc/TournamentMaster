# TournamentMaster APK - Descrizione Onesta

**Versione:** 1.0.1-dev
**Data analisi:** 2025-12-30
**Dimensione:** ~7.5 MB

---

## COSA E' REALMENTE L'APK

### Architettura

L'APK **NON e' un'app nativa Android**. E' una **WebView Capacitor** che carica il sito web Next.js.

```
┌─────────────────────────────────────────┐
│           APK Android (7.5 MB)          │
│  ┌───────────────────────────────────┐  │
│  │        Capacitor WebView          │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   Carica URL remoto:        │  │  │
│  │  │   http://192.168.1.74:3000  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Configurazione Attuale (capacitor.config.json)

```json
{
  "server": {
    "url": "http://192.168.1.74:3000",  // ← Server LOCALE richiesto!
    "cleartext": true
  }
}
```

---

## LIMITAZIONI CRITICHE

### 1. RICHIEDE SERVER LOCALE ATTIVO

**L'app NON funziona offline o standalone.**

Per usare l'app devi:
1. Avere il PC acceso con indirizzo `192.168.1.74`
2. Avviare il backend: `cd backend && npm run dev` (porta 3001)
3. Avviare il frontend: `cd frontend && npm run dev` (porta 3000)
4. Essere sulla stessa rete WiFi

**Senza server → schermata bianca o errore `net::ERR_CONNECTION_REFUSED`**

### 2. IP HARDCODED

L'indirizzo `192.168.1.74` e' hardcoded in:
- `capacitor.config.json` → server.url
- `frontend/.env.local` → NEXT_PUBLIC_API_URL
- GitHub Actions workflow → NEXT_PUBLIC_API_URL

Se cambi rete WiFi o IP del PC, l'app smette di funzionare.

### 3. NON E' UN'APP STANDALONE

| Caratteristica | Stato |
|----------------|-------|
| Funziona offline | ❌ NO |
| Funziona senza PC | ❌ NO |
| Dati salvati localmente | ❌ NO |
| Notifiche push | ❌ NO |
| Sincronizzazione background | ❌ NO |

---

## COSA FA EFFETTIVAMENTE

### Funzionalita' che FUNZIONANO (con server attivo)

| Funzionalita' | Descrizione |
|---------------|-------------|
| Visualizzazione tornei | Lista tornei dal backend |
| Dettaglio torneo | Informazioni complete |
| Login/Registrazione | Autenticazione JWT |
| Navigazione | Tutte le pagine del sito web |
| UI Responsive | Layout adattato per mobile |

### Funzionalita' DICHIARATE ma NON TESTATE/INCOMPLETE

| Funzionalita' | Stato Reale |
|---------------|-------------|
| Cattura foto con GPS | Plugin configurato, UI presente, **non testato end-to-end** |
| Validazione zona GPS | Backend implementato, **frontend non integrato completamente** |
| Classifica live | Componente presente, **polling non WebSocket** |
| Funzionamento offline | **NON implementato** (nessun Service Worker attivo) |

### Codice Mobile NON Utilizzato

Esiste una cartella `mobile/` con un progetto **React Native/Expo separato** che:
- Ha navigazione, screens, hooks
- **NON e' collegata all'APK**
- E' un progetto abbandonato/parallelo
- L'APK usa solo `frontend/` con Capacitor

---

## DETTAGLI TECNICI

### Build Process

```bash
# GitHub Actions esegue:
1. npm ci                    # Installa dipendenze
2. npm run build             # Build Next.js (crea cartella out/)
3. npx cap add android       # Aggiunge piattaforma
4. npx cap sync android      # Sincronizza assets
5. ./gradlew assembleDebug   # Build APK
```

### Plugins Capacitor Configurati

| Plugin | Stato |
|--------|-------|
| Camera | Configurato, quality 90 |
| Geolocation | Configurato, high accuracy |
| CapacitorHttp | Abilitato |
| SplashScreen | 2s, colore #0ea5e9 |

**Nota:** I plugin sono configurati ma l'app carica un URL remoto, quindi le funzionalita' native dipendono dal codice web.

### Permessi Android Richiesti

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

---

## CONFRONTO: ATTESO vs REALE

| Aspetto | Cosa ci si aspetterebbe | Cosa fa realmente |
|---------|-------------------------|-------------------|
| **Tipo app** | App nativa o ibrida standalone | WebView che carica sito remoto |
| **Offline** | Funziona senza internet | Non funziona senza server locale |
| **Dati** | Salvati sul dispositivo | Nessun storage locale |
| **Performance** | Nativa o near-native | Performance web (dipende da rete) |
| **Distribuzione** | Installabile ovunque | Solo su rete locale specifica |

---

## PER RENDERE L'APP REALMENTE FUNZIONALE

### Opzione A: Static Export (Consigliato)

Rimuovere `server.url` da capacitor.config.json per usare il build statico:

```json
{
  "webDir": "out",
  // RIMUOVERE: "server": { "url": "..." }
}
```

Poi configurare l'API URL come variabile dinamica.

### Opzione B: Backend Cloud

Deployare backend su un server pubblico (es. Railway, Render, AWS):
1. Deploy backend su `https://api.tournamentmaster.app`
2. Aggiornare NEXT_PUBLIC_API_URL
3. Rebuild APK

### Opzione C: PWA

Convertire in Progressive Web App con:
- Service Worker per offline
- Cache delle risorse
- Sync background

---

## RIEPILOGO ONESTO

| Domanda | Risposta |
|---------|----------|
| L'app funziona? | **Solo con server locale attivo** |
| E' distribuibile? | **No, IP hardcoded** |
| E' un'app nativa? | **No, e' una WebView** |
| Funziona offline? | **No** |
| Le feature native funzionano? | **Parzialmente, non testate** |
| E' pronta per produzione? | **No, e' un prototipo di sviluppo** |

---

## CONCLUSIONE

**L'APK attuale e' un tool di sviluppo/debug**, non un'applicazione distribuibile. Serve per testare l'interfaccia web su dispositivo fisico durante lo sviluppo, ma richiede l'infrastruttura locale attiva.

Per un'app realmente funzionale serve:
1. Backend deployato su cloud
2. Rimozione dipendenza da IP locale
3. Implementazione storage offline
4. Test completo delle funzionalita' native

---

*Documento generato il 2025-12-30 - Analisi onesta del codice sorgente*
