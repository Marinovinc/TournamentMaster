# TournamentMaster iOS - Da Expo Go a App Store

**Versione:** 1.0.0
**Data:** 2026-01-03 (aggiornato)
**Stato:** Pronto per Build App Store

---

## STATO ATTUALE vs OBIETTIVO

| Aspetto | Stato Attuale (Expo Go) | Obiettivo (App Store) |
|---------|-------------------------|----------------------|
| **Distribuzione** | QR Code + Expo Go | Download da App Store |
| **Icona** | Icona Expo Go | Icona TournamentMaster |
| **Disponibilita'** | Solo con tunnel attivo | Sempre disponibile |
| **Backend** | localhost:3001 | api.tournamentmaster.app |
| **Utenti** | Solo sviluppatori | Pubblico globale |

---

## DOCUMENTI CREATI PER PUBBLICAZIONE

| Documento | Descrizione |
|-----------|-------------|
| [APP_STORE_METADATA.md](./APP_STORE_METADATA.md) | Tutti i metadati per App Store (descrizione, keywords, screenshots) |
| [GUIDA_PUBBLICAZIONE_APP_STORE.md](./GUIDA_PUBBLICAZIONE_APP_STORE.md) | Guida passo-passo completa |

---

## PREREQUISITI PER PUBBLICAZIONE

### 1. Account e Configurazioni
- [x] Apple Developer Account attivo ($99/anno)
- [x] Apple ID: marino@unitec.it
- [x] EAS CLI configurato
- [x] Progetto Expo pronto
- [ ] App creata su App Store Connect
- [ ] ASC App ID e Team ID ottenuti

### 2. Backend in Produzione
- [ ] Backend deployato su server pubblico
- [ ] Dominio `api.tournamentmaster.app` configurato
- [ ] SSL/HTTPS attivo
- [ ] Database MySQL in cloud

### 3. Assets Grafici
- [x] Icona app (1024x1024)
- [x] Splash screen
- [ ] Screenshots per App Store (6 schermate)
- [ ] App Preview video (opzionale)

---

## PASSI PER PUBBLICAZIONE

### FASE 1: Preparazione Backend (CRITICO)

L'app mobile punta a:
```
API_BASE_URL=https://api.tournamentmaster.app/v1
```

**Il backend DEVE essere online prima di pubblicare l'app!**

Opzioni di hosting:
| Provider | Costo | Difficolta' |
|----------|-------|-------------|
| Railway | ~$5/mese | Facile |
| Render | ~$7/mese | Facile |
| DigitalOcean | ~$12/mese | Media |
| AWS | Variabile | Avanzata |

### FASE 2: Creare App su App Store Connect

1. Vai su https://appstoreconnect.apple.com
2. My Apps > "+" > New App
3. Compila:
   - Name: TournamentMaster
   - Bundle ID: com.tournamentmaster.app
   - SKU: TOURNAMENTMASTER001
4. **Annota l'Apple ID** (numero)

### FASE 3: Configurare eas.json

Aggiorna `mobile/eas.json` con i tuoi dati:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "marino@unitec.it",
        "ascAppId": "TUO_ASC_APP_ID",
        "appleTeamId": "TUO_TEAM_ID"
      }
    }
  }
}
```

### FASE 4: Build iOS

```bash
cd C:\Users\marin\Downloads\TournamentMaster\mobile

# Build per App Store
eas build --platform ios --profile production
```

Tempo: 15-30 minuti

### FASE 5: Upload e Submit

```bash
# Submit automatico
eas submit --platform ios --latest
```

### FASE 6: Compilare Metadati su App Store Connect

Usa i contenuti da `APP_STORE_METADATA.md`:
- Descrizione
- Keywords
- Screenshots
- Privacy Policy URL
- Account demo per reviewer

### FASE 7: Submit for Review

1. App Store Connect > TournamentMaster
2. Verifica tutto compilato
3. "Add for Review" > "Submit to App Review"

---

## CONFIGURAZIONE ATTUALE

### app.json
```json
{
  "expo": {
    "name": "TournamentMaster",
    "slug": "tournamentmaster",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.tournamentmaster.app",
      "buildNumber": "1",
      "supportsTablet": true
    },
    "extra": {
      "eas": {
        "projectId": "0a5f2e21-ef12-4c5a-8f3c-bf8e86ada779"
      }
    },
    "owner": "marinovinc"
  }
}
```

### Permessi iOS Configurati
```
NSCameraUsageDescription        - Foto catture
NSLocationWhenInUseUsageDescription - GPS validazione
NSLocationAlwaysUsageDescription    - Tracking torneo
NSPhotoLibraryUsageDescription      - Salvataggio foto
NSMicrophoneUsageDescription        - Video con audio
```

### Dipendenze Chiave
| Pacchetto | Versione |
|-----------|----------|
| expo | 54.0.0 |
| react-native | 0.81.5 |
| expo-camera | 17.0.10 |
| expo-location | 19.0.8 |
| expo-image-picker | 17.0.10 |
| react-native-maps | 1.20.1 |

---

## FUNZIONALITA' APP

### Funzionanti
| Feature | Stato |
|---------|-------|
| Login/Registrazione | OK |
| Lista tornei | OK |
| Dettaglio torneo | OK |
| Dashboard utente | OK |
| Profilo e logout | OK |
| Navigazione tab | OK |

### Da Testare in Produzione
| Feature | Note |
|---------|------|
| Fotocamera catture | Richiede permessi runtime |
| GPS validazione | Richiede permessi |
| Upload foto | Richiede Cloudinary |
| Notifiche push | Non implementate |

---

## TEMPI STIMATI

| Fase | Tempo |
|------|-------|
| Creare app su App Store Connect | 15 min |
| Preparare screenshots | 1-2 ore |
| Build EAS | 15-30 min |
| Compilare metadati | 30 min |
| Review Apple | 24-48 ore |
| **TOTALE** | **2-3 giorni** |

---

## COSTI

| Voce | Costo |
|------|-------|
| Apple Developer Account | $99/anno |
| Hosting backend (es. Railway) | ~$5-20/mese |
| Dominio tournamentmaster.app | ~$15/anno |
| **Build EAS** | **Gratuito** (piano free) |

---

## COMANDI RAPIDI

```bash
# Vai alla cartella mobile
cd C:\Users\marin\Downloads\TournamentMaster\mobile

# Login EAS (se necessario)
eas login

# Verifica credenziali
eas credentials --platform ios

# Build produzione
eas build --platform ios --profile production

# Submit
eas submit --platform ios --latest

# Stato build
eas build:list
```

---

## PROSSIMI PASSI IMMEDIATI

1. **Deploy backend** su server pubblico (Railway/Render)
2. **Configura dominio** api.tournamentmaster.app
3. **Crea app** su App Store Connect
4. **Annota** ASC App ID e Team ID
5. **Aggiorna** eas.json con i dati
6. **Prepara** 6 screenshots
7. **Esegui build**: `eas build --platform ios --profile production`
8. **Submit**: `eas submit --platform ios --latest`
9. **Compila** metadati su App Store Connect
10. **Invia** per review

---

## SUPPORTO

Per problemi:
- Documentazione EAS: https://docs.expo.dev/build/introduction/
- App Store Connect Help: https://developer.apple.com/help/app-store-connect/
- Email: support@tournamentmaster.it

---

*Documento aggiornato il 2026-01-03 - Pronto per pubblicazione App Store*
