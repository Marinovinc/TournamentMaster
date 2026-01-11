# CLAUDE.md - TournamentMaster Development Guidelines

**Versione:** 1.0.0
**Ultimo aggiornamento:** 2025-12-29
**Progetto:** TournamentMaster - Piattaforma SaaS Tornei di Pesca

---

## REGOLA FONDAMENTALE: SVILUPPO MODULARE

**I file NON devono superare 200 righe di codice.**

Quando un file supera questo limite, deve essere refactorizzato in moduli separati.

---

## STRUTTURA PROGETTO

```
TournamentMaster/
├── frontend/                 # Next.js 16 + React 19
│   ├── src/
│   │   ├── app/[locale]/    # Pagine (max 50 righe, usare componenti)
│   │   ├── components/
│   │   │   ├── common/      # Componenti condivisi
│   │   │   ├── home/        # Componenti homepage
│   │   │   ├── layout/      # Header, Footer, Sidebar
│   │   │   ├── tournament/  # Componenti tornei
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── constants/   # Costanti e configurazioni
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   └── utils/       # Utility functions
│   │   └── i18n/            # Configurazione i18n
│   └── messages/            # 24 file traduzioni
│
├── backend/                  # Express.js + Prisma
│   ├── src/
│   │   ├── routes/
│   │   │   ├── tournament/  # Routes modulari per tornei
│   │   │   ├── catch/       # Routes modulari per catture
│   │   │   └── auth/        # Routes autenticazione
│   │   ├── services/
│   │   │   ├── tournament/  # Services modulari per tornei
│   │   │   ├── catch/       # Services modulari per catture
│   │   │   └── ...
│   │   ├── middleware/      # Middleware Express
│   │   └── types/           # TypeScript types
│   └── prisma/              # Schema database
│
└── CLAUDE.md                # Questo file
```

---

## REGOLE PER NUOVI FILE

### 1. Header Obbligatorio

Ogni nuovo file DEVE iniziare con un header informativo:

```typescript
/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/components/tournament/TournamentCard.tsx
 * Creato: 2025-12-29
 * Descrizione: Card per visualizzazione singolo torneo
 *
 * Dipendenze:
 * - @/lib/constants/tournaments (tipi e costanti)
 * - @/components/ui/card (shadcn)
 *
 * Utilizzato da:
 * - src/app/[locale]/tournaments/page.tsx
 * - src/components/home/FeaturedTournaments.tsx
 * =============================================================================
 */
```

### 2. Quando Creare un Nuovo Modulo

**CREA un nuovo file quando:**
- Un componente supera 100 righe
- Una funzione e' riutilizzata in 2+ posti
- Un file supera 200 righe totali
- La logica e' logicamente separabile (CRUD, lifecycle, validation, etc.)

**NON creare file separati per:**
- Funzioni usate solo localmente (<20 righe)
- Tipi usati solo in un file
- Costanti usate solo in un file

### 3. Naming Conventions

```
Componenti React:     PascalCase.tsx      (TournamentCard.tsx)
Hooks:                useCamelCase.ts     (useTournament.ts)
Services:             kebab-case.ts       (tournament-crud.service.ts)
Routes:               kebab-case.ts       (tournament-crud.routes.ts)
Costanti:             camelCase.ts        (disciplines.ts)
Tipi:                 camelCase.ts        (tournament.types.ts)
```

---

## PATTERN DI REFACTORING

### Frontend: Componenti React

**PRIMA (file troppo grande):**
```tsx
// page.tsx - 300+ righe con tutto inline
export default function Page() {
  // Header inline
  // Hero inline
  // Content inline
  // Footer inline
}
```

**DOPO (modulare):**
```tsx
// page.tsx - ~30 righe
import { Header, Footer } from "@/components/layout";
import { HeroSection, ContentSection } from "@/components/home";

export default function Page() {
  return (
    <>
      <Header />
      <HeroSection />
      <ContentSection />
      <Footer />
    </>
  );
}
```

### Backend: Services

**Pattern di divisione services:**
```
tournament.service.ts (facade)
├── tournament-crud.service.ts      # create, read, update, delete
├── tournament-lifecycle.service.ts # publish, start, complete, cancel
├── tournament-zones.service.ts     # fishing zones management
└── tournament-registration.service.ts # participant registration
```

**Il file facade mantiene backward compatibility:**
```typescript
// tournament.service.ts
export class TournamentService {
  static create = TournamentCrudService.create;
  static publish = TournamentLifecycleService.publish;
  // ... deleghe a servizi specifici
}
```

### Backend: Routes

**Pattern di divisione routes:**
```
tournament/
├── index.ts                        # Router composito
├── tournament.validators.ts        # Regole validazione condivise
├── tournament-crud.routes.ts       # GET, POST, PUT, DELETE /
├── tournament-lifecycle.routes.ts  # POST /:id/publish, /start, /complete
├── tournament-zones.routes.ts      # /:id/zones/*
└── tournament-registration.routes.ts # /:id/register, /participants
```

---

## BARREL EXPORTS

Ogni directory con moduli multipli DEVE avere un `index.ts`:

```typescript
// src/components/home/index.ts
export { DisciplineCard } from "./DisciplineCard";
export { HeroSection } from "./HeroSection";
export { SeaFishingSection } from "./SeaFishingSection";
// ...
```

**Import corretto:**
```typescript
// Buono - import da barrel
import { HeroSection, SeaFishingSection } from "@/components/home";

// Evitare - import diretti (accettabile solo se necessario)
import { HeroSection } from "@/components/home/HeroSection";
```

---

## LIMITI DI RIGHE PER TIPO FILE

| Tipo File | Limite Righe | Azione se Superato |
|-----------|--------------|-------------------|
| Pagina (page.tsx) | 50 | Estrarre componenti |
| Componente React | 150 | Dividere in sotto-componenti |
| Service | 200 | Dividere per responsabilita |
| Routes | 200 | Dividere per endpoint group |
| Hook | 100 | Estrarre utility functions |
| Types | 150 | Dividere per dominio |

---

## CHECKLIST PRE-COMMIT

Prima di ogni commit, verificare:

- [ ] Nessun file supera il limite di righe
- [ ] Ogni nuovo file ha header informativo
- [ ] I barrel exports sono aggiornati
- [ ] I tipi sono in file separati se condivisi
- [ ] Le costanti condivise sono in `/lib/constants/`
- [ ] Build frontend: `npm run build` OK
- [ ] Build backend: `npm run build` OK

---

## LOG SESSIONE (OBBLIGATORIO)

Il file `claude_session_Tournament.md` deve essere mantenuto aggiornato in tempo reale.

**REGOLA FONDAMENTALE:**
1. **PRIMA** di ogni operazione: registrare cosa si sta per fare
2. **DOPO** ogni operazione: confermare il risultato (successo/errore)

### Formato Log

```markdown
### [Data] - [Obiettivo Sessione]

#### Operazione N: [Descrizione]
- **Pre:** [Cosa sto per fare]
- **Comandi/File:** [Dettagli tecnici]
- **Post:** [Risultato - OK/ERRORE + dettagli]
```

### Esempio

```markdown
#### Operazione 3: Modifica middleware.ts
- **Pre:** Cambio localePrefix da 'as-needed' a 'always'
- **File:** `frontend/src/middleware.ts` (backup: .BACKUP_20260111)
- **Post:** OK - file modificato, richiede restart frontend

#### Operazione 4: Restart frontend
- **Pre:** Riavvio per applicare modifiche middleware
- **Comando:** `curl -X POST server_manager_api.php?action=restart&service=frontend`
- **Post:** OK - Frontend riavviato (PID 40208 -> nuovo PID)
```

### Quando Aggiornare

- Prima di modificare qualsiasi file
- Dopo ogni modifica (successo o fallimento)
- Prima di ogni riavvio servizio
- Quando si incontra un errore
- Al cambio di obiettivo/task

**Il log serve per:**
- Riprendere lavoro dopo interruzioni
- Debugging
- Tracciare decisioni
- Rollback se necessario

---

## STACK TECNOLOGICO

### Frontend
- **Framework:** Next.js 16.1.1 (App Router)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui
- **i18n:** next-intl (24 lingue EU)
- **Icons:** Lucide React

### Backend
- **Framework:** Express.js 5
- **ORM:** Prisma
- **Database:** MariaDB/MySQL
- **Auth:** JWT + bcrypt

### Shared
- **Language:** TypeScript 5
- **Validation:** express-validator (backend), zod (frontend)

---

## DOCUMENTAZIONE CORRELATA

| File | Contenuto |
|------|-----------|
| `frontend/README.md` | Setup e TODO frontend |
| `frontend/TECHNICAL_REFERENCE_20251229.md` | Riferimento tecnico completo |
| `frontend/HANDOVER_SESSIONE_20251229.md` | Handover ultima sessione |
| `TOURNAMENTMASTER_Technical_Implementation_Spec.md` | Specifica tecnica completa |

---

## COMANDI UTILI

```bash
# Frontend
cd frontend && npm run dev      # Development
cd frontend && npm run build    # Production build

# Backend
cd backend && npm run dev       # Development (nodemon)
cd backend && npm run build     # TypeScript compile

# Database
cd backend && npx prisma studio # GUI database
cd backend && npx prisma migrate dev # Migrazioni
```

---

*Ultimo aggiornamento: 2025-12-29*
