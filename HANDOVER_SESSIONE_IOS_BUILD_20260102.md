# HANDOVER SESSIONE - iOS Build TournamentMaster

**Data:** 2026-01-02
**Sessione:** Configurazione iOS Build per TournamentMaster
**Stato:** PARZIALMENTE COMPLETATA - In attesa Apple

---

## OBIETTIVO SESSIONE

Produrre l'app iOS nativa per TournamentMaster, dato che:
- Android APK gia' disponibile su GitHub Releases v1.0.2
- iOS QR code puntava a file inesistente (`/downloads/TournamentMaster-iOS.ipa`)

---

## COSA E' STATO FATTO

### 1. Analisi Situazione Iniziale
- Verificato che esiste `capacitor.config.json` con configurazione iOS
- Verificato che **NON esiste** cartella `ios/` nel progetto
- Verificato che esiste workflow GitHub Actions `.github/workflows/build-mobile.yml`
- Il workflow ha gia' job per iOS con runner `macos-latest`

### 2. Scelta Strategia
- **Problema:** Utente non ha Mac, impossibile build iOS locale
- **Soluzione:** Usare GitHub Actions con runner macOS (gia' configurato)
- **Requisito:** Apple Developer Program ($99/anno) per certificati

### 3. Apple Developer Program
- **Registrazione completata** da utente
- **Pagamento effettuato:** EUR 99.00
- **Ordine:** W1362250013
- **Account:** marino@unitec.it
- **Team ID:** FV9UXZSP65

### 4. Generazione CSR (Certificate Signing Request)
- Generata chiave privata RSA 2048-bit
- Generato file CSR per Apple

**File creati in `ios-certificates/`:**
```
ios_distribution.key              # Chiave privata - NON CONDIVIDERE
CertificateSigningRequest.certSigningRequest  # Da caricare su Apple
```

---

## ERRORI COMMESSI (Onesta' Brutale)

### Errore 1: Path Conversion Git Bash
- **Problema:** OpenSSL falliva con errore `subject name is expected to be in the format /type0=value0...`
- **Causa:** Git Bash convertiva `/CN=...` in `C:/Program Files/Git/CN=...`
- **Fix:** Aggiunto `MSYS_NO_PATHCONV=1` prima del comando
- **Tempo perso:** ~5 minuti

### Errore 2: Nessun Altro Errore Tecnico
- La sessione e' stata relativamente pulita
- Ho seguito il workflow LEGGERE -> VERIFICARE -> PROCEDERE

---

## STATO ATTUALE

| Componente | Stato | Note |
|------------|-------|------|
| Apple Developer | PAGATO | In attesa attivazione |
| CSR generato | COMPLETATO | Pronto per upload |
| Certificato .cer | PENDENTE | Richiede portale Apple |
| App ID | PENDENTE | Richiede portale Apple |
| Provisioning Profile | PENDENTE | Richiede portale Apple |
| GitHub Secrets | PENDENTE | Richiede certificato |
| Build iOS | PENDENTE | Richiede secrets |

---

## BLOCCO ATTUALE

**Apple Developer Portal non ancora attivo**

Errore quando utente prova ad accedere:
```
Unable to find a team with the given Team ID 'FV9UXZSP65'
```

**Causa:** Account appena pagato, Apple deve processare/attivare (tipicamente 24-48h)

**Azione richiesta:** Attendere email di conferma attivazione da Apple

---

## PROSSIMI PASSI (TODO)

Quando Apple attiva l'account:

### Passo 1: Creare Certificato di Distribuzione
1. Accedere a https://developer.apple.com/account
2. Andare su Certificates, Identifiers & Profiles
3. Certificates > + (Nuovo)
4. Selezionare "Apple Distribution"
5. Upload CSR: `ios-certificates/CertificateSigningRequest.certSigningRequest`
6. Download `.cer` e salvare in `ios-certificates/`

### Passo 2: Creare App ID
1. Identifiers > + (Nuovo)
2. Selezionare "App IDs"
3. Platform: iOS
4. Bundle ID: `app.tournamentmaster.www` (esplicito)
5. Descrizione: "TournamentMaster"
6. Capabilities: Camera, Location, Push Notifications

### Passo 3: Creare Provisioning Profile
1. Profiles > + (Nuovo)
2. Tipo: "Ad Hoc" (per testing) o "App Store" (per produzione)
3. Selezionare App ID creato
4. Selezionare certificato creato
5. Download `.mobileprovision`

### Passo 4: Configurare GitHub Secrets
Repository > Settings > Secrets and variables > Actions > New repository secret

| Secret Name | Valore |
|-------------|--------|
| `IOS_CERTIFICATE` | Base64 del file .p12 |
| `IOS_CERTIFICATE_PASSWORD` | Password del .p12 |
| `IOS_CODE_SIGN_IDENTITY` | "Apple Distribution: [Nome]" |
| `IOS_PROVISIONING_PROFILE` | Base64 del .mobileprovision |

### Passo 5: Convertire .cer in .p12
```bash
# Su Windows con OpenSSL
openssl x509 -in ios_distribution.cer -inform DER -out ios_distribution.pem
openssl pkcs12 -export -out ios_distribution.p12 -inkey ios_distribution.key -in ios_distribution.pem
```

### Passo 6: Triggerare Build iOS
1. GitHub > Actions > Build Mobile Apps
2. Run workflow > Platform: ios
3. Attendere completamento (~15-20 minuti)
4. Download artifact `ios-app-debug`

---

## FILE DI RIFERIMENTO

| File | Percorso | Descrizione |
|------|----------|-------------|
| Chiave privata | `ios-certificates/ios_distribution.key` | NON condividere |
| CSR | `ios-certificates/CertificateSigningRequest.certSigningRequest` | Per Apple |
| Workflow CI | `.github/workflows/build-mobile.yml` | Build automatico |
| Capacitor config | `frontend/capacitor.config.json` | Config iOS |
| Documentazione | `DOCUMENTO_TECNICO_IOS_BUILD_20260102.md` | Dettagli tecnici |

---

## CREDENZIALI (Proteggere!)

| Credenziale | Valore | Note |
|-------------|--------|------|
| Apple ID | marino@unitec.it | Account sviluppatore |
| Team ID | FV9UXZSP65 | Per Xcode/signing |
| Bundle ID | app.tournamentmaster.www | Gia' in capacitor.config |

**ATTENZIONE:** `ios_distribution.key` contiene la chiave privata.
NON committare su GitHub. NON condividere.

---

## TEMPO STIMATO COMPLETAMENTO

Quando Apple attiva l'account:
- Creazione certificato: 10 minuti
- Creazione App ID: 5 minuti
- Creazione Provisioning Profile: 5 minuti
- Configurazione GitHub Secrets: 15 minuti
- Build + Test: 30 minuti

**Totale:** ~1 ora di lavoro effettivo

---

## CONTATTO PER CONTINUARE

Per riprendere questa sessione:
1. Verificare che Apple abbia attivato l'account (email o prova login)
2. Seguire i passi nel TODO sopra
3. Riferirsi a `DOCUMENTO_TECNICO_IOS_BUILD_20260102.md` per dettagli

---

*Documento generato il 2026-01-02*
*Sessione: iOS Build Setup per TournamentMaster*
