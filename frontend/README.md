# TournamentMaster Frontend

**Piattaforma SaaS White-Label per Tornei di Pesca**

---

## TODO - PROSSIMI TASK PRIORITARI

### Alta Priorita
- [ ] **Tournament Creation Wizard** - UI completa per creazione torneo (multi-step form)
- [ ] **Catch Submission Form** - Form con upload foto, GPS, selezione specie
- [ ] **Socket.io Real-time** - Leaderboard aggiornamenti live
- [ ] **Stripe Integration** - Pagamenti registrazione tornei

### Media Priorita
- [ ] **Document Upload** - Gestione licenze MASAF, certificati medici
- [ ] **Team Profile Pages** - Pagine profilo squadre con statistiche
- [x] ~~**Admin Dashboard**~~ - Pannello gestione tornei (COMPLETATO 2025-12-29)
- [x] ~~**Catch Approval Workflow**~~ - Approvazione catture per giudici (COMPLETATO 2025-12-29)

### Bassa Priorita
- [ ] **PWA Setup** - Service worker, offline mode
- [ ] **Push Notifications** - Notifiche real-time
- [ ] **Email System** - Conferme, reminder
- [ ] **Chatbot AI** - Integrazione Claude API

### Fix Necessari
- [ ] **Dev Server Lock** - Risolvere conflitto lock file .next/dev/lock
- [ ] **Traduzioni Native** - Tradurre 22 lingue secondarie (attualmente EN placeholder)

### Completato Sessione 2025-12-29
- [x] Homepage redesign con 17 discipline (9 mare + 8 acque interne)
- [x] Ocean theme con palette OKLCH
- [x] Dashboard role-based (SUPER_ADMIN, TENANT_ADMIN, ORGANIZER, JUDGE, PARTICIPANT)
- [x] Admin dashboard con gestione tornei
- [x] Judge dashboard per validazione catture
- [x] Supporto video HTML5 nativo
- [x] Demo photos reali da archivio locale
- [x] Fix status PUBLISHED e ONGOING nel frontend

---

## DOCUMENTAZIONE

| Documento | Descrizione | Data |
|-----------|-------------|------|
| [HANDOVER_SESSIONE_COMPLETO_20251229.md](./HANDOVER_SESSIONE_COMPLETO_20251229.md) | Handover completo con 7 errori confessati | 2025-12-29 |
| [TECHNICAL_REFERENCE_COMPLETE_20251229.md](./TECHNICAL_REFERENCE_COMPLETE_20251229.md) | Riferimento tecnico dettagliato (13 sezioni) | 2025-12-29 |
| [TOURNAMENTMASTER_Technical_Implementation_Spec.md](../../TOURNAMENTMASTER_Technical_Implementation_Spec.md) | Specifica implementazione completa | 2025-12-29 |

### Documenti Precedenti (Archivio)
| Documento | Descrizione |
|-----------|-------------|
| [HANDOVER_SESSIONE_20251229.md](./HANDOVER_SESSIONE_20251229.md) | Prima versione handover |
| [TECHNICAL_REFERENCE_20251229.md](./TECHNICAL_REFERENCE_20251229.md) | Prima versione riferimento tecnico |

---

## Stato Implementazione

```
Frontend Infrastructure:     [####################] 100%
Backend Infrastructure:      [################----]  80%
Database Schema:             [####################] 100%
Authentication:              [####################] 100%
Internationalization (24):   [####################] 100%
UI/UX Ocean Theme:           [####################] 100%
Dashboard System:            [####################] 100%  <- NUOVO
Tournament Management:       [############--------]  60%
Catch Submission:            [############--------]  60%  <- Aggiornato
Leaderboard:                 [########------------]  40%
Payment Integration:         [--------------------]   0%
PWA/Offline:                 [--------------------]   0%
```

---

## Dashboard System (Nuovo)

### Ruoli Supportati
| Ruolo | Dashboard | Funzionalita |
|-------|-----------|--------------|
| SUPER_ADMIN | `/dashboard` | Accesso completo, gestione tenant |
| TENANT_ADMIN | `/dashboard` | Gestione tornei proprio tenant |
| ORGANIZER | `/dashboard` | Creazione/gestione tornei |
| JUDGE | `/dashboard/judge` | Validazione catture |
| PARTICIPANT | `/dashboard` | Iscrizioni, storico catture |

### Pagine Dashboard
- `/[locale]/dashboard` - Home dashboard role-based
- `/[locale]/dashboard/admin` - Gestione tornei (admin)
- `/[locale]/dashboard/judge` - Validazione catture (giudici)

---

## Demo Assets

Foto demo reali per testing UI (da archivio locale utente):

| File | Contenuto | Dimensione |
|------|-----------|------------|
| `/public/demo/catch1.jpg` | Aguglia Imperiale | 4.9 MB |
| `/public/demo/catch2.jpg` | Tonno | 1.2 MB |
| `/public/demo/catch3.jpg` | Totano | 2.6 MB |
| `/public/demo/catch4.jpg` | Foto cattura | 4.9 MB |
| `/public/demo/catch4_video.mp4` | Video cattura | 22 MB |
| `/public/demo/catch5.jpg` | Foto cattura | 3.1 MB |

---

## Quick Start

### Prerequisiti
- Node.js 18+
- Backend running su porta 3001
- MariaDB/MySQL con database tournamentmaster

### Installazione

```bash
# Clona e installa dipendenze
cd frontend
npm install

# Avvia development server
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

### Fix Lock Error

Se appare errore "Unable to acquire lock":

```bash
# Windows
taskkill /F /IM node.exe
del ".next\dev\lock"
npm run dev
```

---

## Struttura Progetto

```
frontend/
├── messages/           # 24 file traduzioni (it, en, de, fr, ...)
├── public/
│   └── demo/           # Foto demo catture (catch1-5.jpg + video)
├── src/
│   ├── app/
│   │   ├── [locale]/   # Pagine localizzate
│   │   │   ├── page.tsx           # Homepage (17 discipline)
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx       # Dashboard home
│   │   │   │   ├── admin/page.tsx # Admin dashboard
│   │   │   │   └── judge/page.tsx # Judge dashboard
│   │   │   └── layout.tsx         # Layout con IntlProvider
│   │   └── globals.css            # Ocean Theme OKLCH
│   ├── components/
│   │   ├── common/     # LanguageSelector, etc.
│   │   ├── home/       # Hero, Discipline sections
│   │   ├── layout/     # Header, Footer, Navigation
│   │   └── ui/         # shadcn components
│   ├── lib/
│   │   └── AuthContext.tsx  # Auth + ruoli
│   ├── i18n/
│   │   └── config.ts   # 24 lingue EU
│   └── middleware.ts   # i18n routing
├── HANDOVER_SESSIONE_COMPLETO_20251229.md
├── TECHNICAL_REFERENCE_COMPLETE_20251229.md
└── package.json
```

---

## Stack Tecnologico

| Tecnologia | Versione | Uso |
|------------|----------|-----|
| Next.js | 16.1.1 | Framework React |
| React | 19.2.3 | UI Library |
| TypeScript | 5.x | Type Safety |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | latest | Components |
| next-intl | 4.6.1 | i18n (24 lingue) |
| Lucide React | 0.562.0 | Icons |

---

## Discipline Pesca Supportate

### Mare (9)
- Big Game, Drifting, Traina Costiera, Vertical Jigging
- Bolentino, Eging, Spinning Mare, Surfcasting, Shore

### Acque Interne (8)
- Fly Fishing, Spinning Fiume, Carpfishing, Feeder
- Trota Lago, Trota Torrente, Bass Fishing, Colpo

### Altro
- Social Events

---

## Lingue Supportate (24)

IT, EN, DE, FR, ES, PT, NL, PL, RO, EL, CS, HU, SV, DA, FI, HR, SL, SK, BG, LT, LV, ET, MT, GA

**Nota:** Solo IT e EN hanno traduzioni native complete. Le altre 22 lingue usano placeholder inglesi.

---

## Comandi Disponibili

```bash
npm run dev      # Development server
npm run build    # Build produzione (27 pagine)
npm run start    # Start produzione
npm run lint     # ESLint check
```

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [next-intl](https://next-intl-docs.vercel.app)

---

*Ultimo aggiornamento: 2025-12-29 22:30*
*Sessione: Redesign Homepage + Discipline + i18n + Dashboard Judge + Demo Photos*
