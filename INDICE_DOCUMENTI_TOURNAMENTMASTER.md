# TournamentMaster - Indice Completo Documenti e File

**Data creazione:** 2026-01-02
**Ultimo aggiornamento:** 2026-01-10
**Versione progetto:** 1.5.1
**Percorso principale:** `D:\Dev\TournamentMaster\`

---

## TODO - PROSSIMA SESSIONE

### Priorita CRITICA (PDF Fix - 2026-01-10)
- [ ] **VERIFICARE VISIVAMENTE** PDF `test_pdf_v2.pdf` mostra correttamente: Squadra, Barca, Angler, Canna
- [ ] Testare PDF con altri tornei COMPLETED
- [ ] Verificare percorso fallback (senza LeaderboardEntry) funzioni ancora
- [ ] Aggiungere unit test per `generatePublicLeaderboardPDF`

### Priorita Alta
- [ ] Testare API `/api/tenants/public/:slug` con tenant reale
- [ ] Testare salvataggio branding da pagina admin
- [ ] Verificare rendering pagina pubblica con dati reali
- [ ] Eseguire `prisma db push` per applicare nuovi campi Tenant

### Priorita Media
- [ ] Refactoring: evitare duplicazione logica mapping tra percorsi PDF
- [ ] Aggiungere upload immagini invece di URL manuali (logo, banner)
- [ ] Aggiungere preview live nella pagina admin branding
- [ ] Aggiungere validazione colori HEX nel frontend
- [ ] Aggiungere link "Visita pagina pubblica" in admin branding

### Priorita Bassa
- [ ] Documentare nuovi endpoint nella documentazione completa
- [ ] Aggiungere sezione branding nella guida utente
- [ ] Testare cache 60s pagina pubblica funzioni correttamente
- [ ] Verificare comportamento con campi null/undefined
- [ ] Ottimizzare query PDF (potenzialmente join invece di query separate)

---

## RIEPILOGO

| Categoria | Quantita |
|-----------|----------|
| Documentazione (.md) | 28 file |
| Manuali utente (.html/.pdf) | 2 file |
| File sorgente chiave | 11 file |
| Migrazioni database | 3 cartelle |
| File distribuzione | 3 file (APK, HTML, batch) |
| Screenshot documentazione | 12 file |
| **TOTALE** | **~59 file rilevanti** |

---

## 1. DOCUMENTAZIONE PRINCIPALE (Root)

### 1.1 DOCUMENTAZIONE_COMPLETA_TOURNAMENTMASTER.md
- **Dimensione:** 96 KB
- **Versione:** 1.4.0
- **Descrizione:** Documentazione master del progetto. Contiene architettura completa backend (Node.js/Express/Prisma) e frontend (Next.js 14). Include tutti gli endpoint API, modelli database, sistema autenticazione JWT, gestione tornei, catture, classifiche, e funzionalita mobile. Divisa in 4 parti: Backend, Frontend, App Mobile, Gestione Barche/Strike.

### 1.2 DOCUMENTAZIONE_TECNICA_TOURNAMENTMASTER_20251230.md
- **Dimensione:** 16 KB
- **Descrizione:** Documentazione tecnica sintetica. Panoramica SaaS multi-tenant per tornei pesca. Stack tecnologico (Next.js 16, Express 5, Prisma, MySQL), ruoli utente (SUPER_ADMIN, TENANT_ADMIN, PRESIDENT, ORGANIZER, JUDGE, PARTICIPANT), discipline supportate (Big Game, Drifting, Traina, Bolentino, Eging, Jigging, Shore, Social).

### 1.3 CLAUDE.md
- **Dimensione:** 8 KB
- **Descrizione:** Linee guida sviluppo per Claude AI. Regola fondamentale: file max 200 righe. Struttura progetto frontend/backend, regole header obbligatorio per nuovi file, pattern di documentazione dipendenze, convenzioni naming.

### 1.4 AVVIO_MANUALE.md
- **Dimensione:** 2 KB
- **Descrizione:** Quick start per avvio senza Docker. Comandi per backend (`npx ts-node src/index.ts` porta 3001) e frontend (`npm run dev` porta 3000). Credenziali demo: admin@ischiafishing.it / demo123.

### 1.5 HANDOVER_SESSIONE_BRANDING_20260104.md (NUOVO)
- **Dimensione:** 10 KB
- **Data:** 2026-01-04
- **Descrizione:** Handover sessione implementazione branding associazioni. Include obiettivi completati (14 campi schema, 3 API, 3 pagine frontend), cronologia lavori, CONFESSIONE ERRORI (Edit tool fallimenti, import dimenticato, PowerShell incompatibile), todo per prossima sessione.

### 1.6 DOCUMENTO_TECNICO_BRANDING_ASSOCIAZIONI_20260104.md (NUOVO)
- **Dimensione:** 25 KB
- **Data:** 2026-01-04
- **Descrizione:** Documentazione tecnica dettagliata feature branding. Schema Prisma esteso (14 campi), API REST (GET/PUT branding, GET public tenant), componenti frontend (admin 4 tabs, pagina pubblica SSR), codice completo con snippet, riferimenti file:linea per ogni implementazione.

### 1.7 HANDOVER_SESSIONE_RAILWAY_DEPLOY_20260103.md
- **Dimensione:** 7 KB
- **Data:** 2026-01-03
- **Descrizione:** Handover deploy Railway. URL backend/frontend deployati, 16 tabelle migrate, utenti configurati, CONFESSIONE ERRORI (password assunta, modifica DB senza autorizzazione), lezioni apprese.

### 1.8 HANDOVER_SESSIONE_PDF_FIX_20260110.md (NUOVO)
- **Dimensione:** 8 KB
- **Data:** 2026-01-10
- **Descrizione:** Handover fix PDF Leaderboard DETTAGLIO CATTURE. Fix colonne Squadra (mostrava nome angler), Barca, Canna mancanti. CONFESSIONE ERRORI: lavoro a tentativi iniziale, non verificato quale percorso codice eseguito, errori pre-esistenti in homologation.service.ts. Root cause: due percorsi in generatePublicLeaderboardPDF (LeaderboardEntry vs Teams).

### 1.9 DOCUMENTO_TECNICO_PDF_SERVICE_20260110.md (NUOVO)
- **Dimensione:** 18 KB
- **Data:** 2026-01-10
- **Descrizione:** Documentazione tecnica completa PDF Service. Architettura classe, database schema (teams, team_members, catches, leaderboard_entries), metodi principali, flusso dati dettagliato con diagramma, interfacce TypeScript (CatchDetail, LeaderboardRow), query Prisma, mapping dati (userToTeamMap, teamIdToName, teamIdToBoatName), endpoint API, troubleshooting.

---

## 2. GUIDE INSTALLAZIONE E DEPLOY

### 2.1 GUIDA_INSTALLAZIONE_DOCKER.md
- **Dimensione:** 19 KB
- **Descrizione:** Guida completa deploy con Docker. Requisiti hardware (4GB RAM min, 20GB SSD), porte necessarie (22, 80, 443, 3000, 3001, 3306), installazione Docker su Ubuntu/Debian/CentOS, configurazione docker-compose.yml, SSL con Let's Encrypt, backup e manutenzione.

### 2.2 GUIDA_AVVIO_E_GESTIONE_TOURNAMENTMASTER_SENZA_DOCKER.md
- **Dimensione:** 10 KB
- **Descrizione:** Guida avvio in ambiente Windows 10/11 con XAMPP. Architettura 3-tier (Browser → Frontend:3000 → Backend:3001 → MySQL:3306). Procedura avvio passo-passo, verifica funzionamento, arresto servizi, risoluzione problemi comuni.

### 2.3 GUIDA_DEPLOY_RAILWAY.md
- **Dimensione:** 2.5 KB
- **Descrizione:** Deploy rapido su Railway (PaaS). 6 passi: crea account, nuovo progetto da GitHub, aggiungi MySQL, configura variabili ambiente (DATABASE_URL, JWT_SECRET), deploy automatico, verifica endpoint.

### 2.4 GUIDA_MIGRAZIONE_DA_RETE_LOCALE_A_HOSTING_CLOUD_TOURNAMENTMASTER.md
- **Dimensione:** 41 KB
- **Descrizione:** Guida dettagliata migrazione da sviluppo locale (192.168.1.74) a produzione cloud. Confronto situazione attuale vs futura, modifiche file .env, configurazione Vercel/Netlify per frontend, Railway/Render per backend, aggiornamento Capacitor per app mobile.

### 2.5 GUIDA_MIGRAZIONE_SERVER_PUBBLICO.md
- **Dimensione:** 7 KB
- **Descrizione:** Versione sintetica migrazione a server pubblico. Diagrammi rete locale vs Internet, lista file da modificare (.env.production, capacitor.config.json), vantaggi hosting cloud (accessibilita ovunque, 99.9% uptime).

### 2.6 GUIDA_IP_STATICO_ROUTER.md
- **Dimensione:** 2.5 KB
- **Descrizione:** Configurazione IP statico per ambiente locale. Due metodi: prenotazione DHCP nel router (consigliato) o IP statico manuale su Windows. Necessario perche app mobile cerca server su IP hardcoded 192.168.1.74.

---

## 3. DOCUMENTAZIONE APP MOBILE

### 3.1 DESCRIZIONE_ONESTA_APK_ANDROID_20251230.md
- **Dimensione:** 7 KB
- **Descrizione:** Analisi onesta dell'APK Android. **IMPORTANTE:** L'APK NON e' app nativa ma WebView Capacitor che carica URL remoto (http://192.168.1.74:3000). Limitazioni critiche: richiede server locale attivo, IP hardcoded, nessun supporto offline. Roadmap per trasformarla in app standalone.

### 3.2 DESCRIZIONE_ONESTA_IOS_EXPO_GO_20260102.md
- **Dimensione:** 8 KB
- **Descrizione:** Analisi onesta distribuzione iOS via Expo Go. **IMPORTANTE:** NON e' app standalone ma bundle JavaScript eseguito dentro Expo Go (app terze parti). Richiede tunnel Expo attivo (`npx expo start --tunnel`). Nessuna icona dedicata su Home Screen, non distribuibile su App Store.

### 3.3 docs/SPECIFICHE_APP_MOBILE_iOS_ANDROID.md
- **Dimensione:** 30 KB
- **Descrizione:** Specifiche complete per future app native iOS/Android. Basato su analisi competitor (CatchStat, FishDonkey, Fishing Chaos, eTournament, FishChamp, TourneyX Pro). Moduli: Auth, Tournaments, Catches, Leaderboard, Offline Sync, Push Notifications, Camera, GPS, Media Upload. Target: iOS 15+, Android API 26+.

### 3.4 docs/GUIDA_PRATICA_REACT_NATIVE.md
- **Dimensione:** 13 KB
- **Descrizione:** Guida introduttiva React Native per principianti. Spiega vantaggi (un codebase per iOS/Android) e svantaggi (serve Mac per iOS). Requisiti per piattaforma, setup ambiente Windows, sviluppo iOS tramite Expo, struttura progetto, comandi essenziali, debug, pubblicazione App Store/Play Store.

---

## 4. DOCUMENTAZIONE BARCHE E STRIKE

### 4.1 docs/GUIDA_BARCHE_STRIKE_FEATURES.md
- **Dimensione:** 11 KB
- **Descrizione:** Guida completa gestione barche/team e strike live. Flusso tipico torneo (7 step), gerarchia ruoli con permessi dettagliati, gestione equipaggio, assegnazione ispettori, registrazione strike in tempo reale, validazione catture, API reference per endpoint /api/teams e /api/strikes.

---

## 5. MANUALE AMMINISTRATORE ASSOCIAZIONE (NUOVO)

### 5.1 docs/MANUALE_AMMINISTRATORE_ASSOCIAZIONE.md
- **Dimensione:** 15 KB
- **Data creazione:** 2026-01-10
- **Descrizione:** Manuale operativo completo per amministratori associazioni di pesca. 12 sezioni: Primo Accesso, Dashboard, Gestione Tornei, Partecipanti, Giudici/Staff, Validazione Catture, Classifiche, Import/Export, Archivio, Impostazioni, Risoluzione Problemi, FAQ. Include glossario e contatti supporto.

### 5.2 docs/MANUALE_AMMINISTRATORE_ASSOCIAZIONE.html
- **Dimensione:** 45 KB
- **Data creazione:** 2026-01-10
- **Descrizione:** Versione HTML con CSS professionale. Header blu, tabelle formattate, checklist interattive, box problema/soluzione colorati, sezione FAQ espandibile. Include 12 screenshot embedded. Responsive per tablet/mobile. Supporto stampa ottimizzato.

### 5.3 docs/MANUALE_AMMINISTRATORE_ASSOCIAZIONE.pdf
- **Dimensione:** 1 MB (17 pagine)
- **Data creazione:** 2026-01-10
- **Descrizione:** Versione PDF professionale generata con reportlab. Header/footer su ogni pagina, tabelle con alternanza colori, immagini embedded, numerazione pagine, indice, glossario. Pronto per stampa o distribuzione.

### 5.4 docs/screenshots/ (12 file PNG)
- **Dimensione totale:** ~1.1 MB
- **Data creazione:** 2026-01-10
- **Descrizione:** Screenshot catturati automaticamente con Playwright. Coprono tutte le sezioni principali:
  - `01_login.png` - Pagina di login
  - `02_dashboard.png` - Dashboard amministratore
  - `03_tournaments.png` - Lista tornei
  - `04_tournament_detail.png` - Dettaglio torneo
  - `05_participants.png` - Gestione partecipanti
  - `06_judges.png` - Assegnazione giudici/ispettori
  - `07_catches.png` - Live Dashboard catture
  - `08_leaderboard.png` - Classifica pubblica
  - `09_users.png` - Gestione utenti
  - `10_archive.png` - Archivio storico
  - `11_messages.png` - Sistema messaggi
  - `12_association_public.png` - Pagina pubblica associazione

### 5.5 docs/capture-screenshots.js
- **Dimensione:** 6 KB
- **Descrizione:** Script Playwright per cattura automatica screenshot. Naviga tutte le pagine principali, effettua login, attende caricamento, salva PNG 1400x900. Configurabile per URL, credenziali, locale.

### 5.6 docs/generate_pdf_manual.py
- **Dimensione:** 25 KB
- **Descrizione:** Script Python per generazione PDF con reportlab. Stili personalizzati (header blu, tabelle), embedding immagini, header/footer automatici, indice, glossario. Verifica presenza screenshot prima di generare.

---

## 6. DOCUMENTAZIONE FRONTEND

### 5.1 frontend/README.md
- **Descrizione:** README standard Next.js con istruzioni base npm run dev/build/start.

### 5.2 frontend/HANDOVER_SESSIONE_20251229.md
- **Descrizione:** Handover sessione sviluppo. Riepilogo modifiche effettuate, stato build.

### 5.3 frontend/HANDOVER_SESSIONE_COMPLETO_20251229.md
- **Descrizione:** Handover completo con CONFESSIONE ERRORI. Include 5 errori ammessi: specie ittiche Big Game (ricciola, marlin), lock file dev server, traduzioni non native per 22 lingue, URL foto demo non verificati. Lezioni apprese documentate.

### 5.4 frontend/TECHNICAL_REFERENCE_20251229.md
- **Descrizione:** Riferimento tecnico sintetico.

### 5.5 frontend/TECHNICAL_REFERENCE_COMPLETE_20251229.md
- **Descrizione:** Riferimento tecnico completo. Architettura sistema (Frontend:3000, Backend:3001, DB:3306), stack tecnologico, struttura directory, database schema, API endpoints, componenti frontend, internazionalizzazione 24 lingue, discipline pesca, autenticazione, dashboard system, demo assets, comandi utili, troubleshooting.

---

## 6. DOCUMENTAZIONE MOBILE

### 6.1 mobile/README.md
- **Descrizione:** README progetto React Native/Expo con istruzioni avvio.

### 6.2 mobile/.expo/README.md
- **Descrizione:** README autogenerato Expo sulla cartella .expo.

---

## 7. FILE SORGENTE CHIAVE

### 7.1 backend/prisma/schema.prisma
- **Dimensione:** 16 KB
- **Descrizione:** Schema database Prisma completo. Modelli: Tenant (multi-tenant), User (con ruoli SUPER_ADMIN/TENANT_ADMIN/PRESIDENT/ORGANIZER/JUDGE/PARTICIPANT), Tournament, Registration, Catch, Team, TeamMember, Strike, Zone, Document, RefreshToken. Relazioni e indici ottimizzati.

### 7.2 backend/src/routes/team.routes.ts
- **Dimensione:** 19 KB
- **Descrizione:** API REST gestione barche/team. Endpoint CRUD team, gestione equipaggio (membri), assegnazione ispettori, iscrizione tornei. Validazione con express-validator, autenticazione JWT, autorizzazione per ruolo.

### 7.3 backend/src/routes/strike.routes.ts
- **Dimensione:** 15 KB
- **Descrizione:** API REST registrazione strike durante gare. Endpoint per registrare abboccate (timestamp + numero canne + coordinate GPS), validazione ispettore, statistiche strike per team. Risultati: CATCH, LOST, RELEASED.

### 7.4 frontend/src/app/[locale]/dashboard/teams/page.tsx
- **Dimensione:** 30 KB
- **Descrizione:** Pagina gestione barche/equipaggio. Interfaccia tabellare con filtri, dialog creazione/modifica team, assegnazione membri, ricerca, paginazione. Usa shadcn/ui components (Card, Dialog, Table, DropdownMenu).

### 7.5 frontend/src/app/[locale]/dashboard/strikes/page.tsx
- **Dimensione:** 22 KB
- **Descrizione:** Pagina monitoraggio strike live. Dashboard real-time durante gare, lista strike con stato (pending/validated), dialog registrazione nuovo strike, filtri per torneo/team, statistiche aggregate.

### 7.6 frontend/src/components/HelpGuide.tsx
- **Dimensione:** 15 KB
- **Descrizione:** Componente guide contestuali. Mostra help per ogni pagina (home, login, dashboard, tournaments, catches, leaderboard, teams, strikes). Contenuto strutturato con sezioni e tips. Integra Dialog shadcn/ui.

### 7.7 backend/src/routes/tenant.routes.ts (NUOVO)
- **Dimensione:** 25 KB (753 righe)
- **Data creazione:** 2026-01-04
- **Descrizione:** API REST gestione tenant e branding. Endpoint: GET /api/tenants/public/:slug (pagina pubblica, no auth, include tornei recenti), GET /api/tenants/me/branding (legge branding corrente), PUT /api/tenants/me/branding (aggiorna branding, richiede TENANT_ADMIN+). Validazione con express-validator.

### 7.8 backend/src/services/pdf.service.ts (NUOVO)
- **Dimensione:** 28 KB (836 righe)
- **Data creazione:** 2026-01-04
- **Descrizione:** Servizio generazione PDF. Genera classifiche tornei in formato PDF conforme regolamento FIPSAS. Usa pdfkit. Include header con logo, tabella classifica con punteggi, footer con timestamp.

### 7.9 frontend/src/app/[locale]/dashboard/admin/branding/page.tsx (NUOVO)
- **Dimensione:** 20 KB (583 righe)
- **Data creazione:** 2026-01-04
- **Descrizione:** Pagina admin gestione branding associazione. 4 tabs: Branding (logo, colori, banner), Contatti (email, telefono, indirizzo, sito), Social (Facebook, Instagram, YouTube), FIPSAS (codice affiliazione, regione). Form con salvataggio API.

### 7.10 frontend/src/app/[locale]/associazioni/[slug]/page.tsx (NUOVO)
- **Dimensione:** 15 KB (451 righe)
- **Data creazione:** 2026-01-04
- **Descrizione:** Pagina pubblica associazione con branding dinamico. Server-side rendering con cache 60s. Hero banner con logo, statistiche (tornei, membri), lista tornei recenti, contatti, social links, card affiliazione FIPSAS. Theming CSS dinamico con colori tenant.

### 7.11 frontend/src/app/[locale]/fipsas/page.tsx (NUOVO)
- **Dimensione:** 11 KB (336 righe)
- **Data creazione:** 2026-01-04
- **Descrizione:** Pagina informativa FIPSAS. Spiega cos'e la federazione, sistema punteggio tornei (tabella 1o-10o posto), regolamento generale, discipline supportate. Link a sito ufficiale FIPSAS.

---

## 8. MIGRAZIONI DATABASE

### 8.1 backend/prisma/migrations/20251229163124_init/
- **Descrizione:** Migrazione iniziale. Crea tutte le tabelle base: tenants, users, tournaments, catches, leaderboard entries, zones, documents, refresh_tokens.

### 8.2 backend/prisma/migrations/20251230205547_add_video_path/
- **Descrizione:** Aggiunge campo videoPath per supporto video nelle catture.

### 8.3 backend/prisma/migrations/20260102135910_add_president_role/
- **Descrizione:** Aggiunge ruolo PRESIDENT (secondo admin societa, stessi permessi TENANT_ADMIN).

---

## 9. FILE DISTRIBUZIONE

### 9.1 TournamentMaster.apk
- **Dimensione:** 7.82 MB
- **Percorso:** Root progetto + `D:\erp-upgrade\ai\downloads\`
- **Descrizione:** App Android (WebView Capacitor). Richiede server locale attivo su 192.168.1.74.

### 9.2 TournamentMaster-iOS-ExpoGo.html
- **Dimensione:** 2.4 KB
- **Descrizione:** Pagina HTML con QR code per aprire app in Expo Go su iOS.

### 9.3 Script avvio (.bat)
- `start.bat` - Avvio completo con Docker
- `AVVIA_SERVER.bat` - Avvio server manuale
- `START_DEV.bat` - Avvio ambiente sviluppo

---

## 10. COPIA IN ERP

### 10.1 D:\erp-upgrade\ai\downloads\DOCUMENTAZIONE_TOURNAMENTMASTER_APP_COMPLETA.md
- **Dimensione:** 18 KB
- **Descrizione:** Documentazione mobile unificata. Combina info APK Android e iOS Expo Go, percorsi file, procedure installazione, ambiente sviluppo, troubleshooting. Versione 1.1.0 aggiornata 2026-01-02.

---

## COME USARE QUESTA DOCUMENTAZIONE

### Per iniziare sviluppo:
1. Leggere `CLAUDE.md` (regole sviluppo)
2. Leggere `DOCUMENTAZIONE_COMPLETA_TOURNAMENTMASTER.md` (architettura)
3. Consultare `AVVIO_MANUALE.md` (quick start)

### Per deploy:
1. **Locale:** `GUIDA_AVVIO_E_GESTIONE_TOURNAMENTMASTER_SENZA_DOCKER.md`
2. **Docker:** `GUIDA_INSTALLAZIONE_DOCKER.md`
3. **Cloud:** `GUIDA_DEPLOY_RAILWAY.md` + `GUIDA_MIGRAZIONE_SERVER_PUBBLICO.md`

### Per app mobile:
1. Leggere `DESCRIZIONE_ONESTA_APK_ANDROID_20251230.md` (limitazioni attuali)
2. Leggere `DESCRIZIONE_ONESTA_IOS_EXPO_GO_20260102.md` (limitazioni attuali)
3. Consultare `docs/SPECIFICHE_APP_MOBILE_iOS_ANDROID.md` (roadmap app native)

### Per funzionalita Teams/Strike:
1. Leggere `docs/GUIDA_BARCHE_STRIKE_FEATURES.md`
2. Consultare `backend/src/routes/team.routes.ts` e `strike.routes.ts`

### Per funzionalita Branding Associazioni:
1. Leggere `DOCUMENTO_TECNICO_BRANDING_ASSOCIAZIONI_20260104.md` (architettura completa)
2. Consultare `HANDOVER_SESSIONE_BRANDING_20260104.md` (stato implementazione)
3. File chiave:
   - Schema: `backend/prisma/schema.prisma` (14 campi branding su Tenant)
   - API: `backend/src/routes/tenant.routes.ts`
   - Admin: `frontend/src/app/[locale]/dashboard/admin/branding/page.tsx`
   - Pubblico: `frontend/src/app/[locale]/associazioni/[slug]/page.tsx`

### Per sessioni precedenti:
1. `HANDOVER_SESSIONE_RAILWAY_DEPLOY_20260103.md` - Deploy Railway
2. `HANDOVER_SESSIONE_BRANDING_20260104.md` - Branding associazioni
3. `HANDOVER_SESSIONE_PDF_FIX_20260110.md` - Fix PDF Leaderboard (Squadra, Barca, Canna)

### Per PDF Service:
1. Leggere `DOCUMENTO_TECNICO_PDF_SERVICE_20260110.md` (architettura completa)
2. Consultare `HANDOVER_SESSIONE_PDF_FIX_20260110.md` (errori e lezioni)
3. File chiave:
   - Service: `backend/src/services/pdf.service.ts`
   - Schema: `backend/prisma/schema.prisma` (Team, TeamMember, Catch, LeaderboardEntry)
   - Endpoint: `GET /api/reports/public/pdf/leaderboard/:tournamentId`

---

*Documento aggiornato il 2026-01-10*
