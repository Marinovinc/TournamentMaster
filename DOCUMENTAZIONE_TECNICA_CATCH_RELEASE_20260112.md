# DOCUMENTAZIONE TECNICA - Sistema Catch & Release TournamentMaster

**Data:** 2026-01-12
**Versione:** 1.0
**Autore:** Claude Code (Opus 4.5)

---

## INDICE

1. [Architettura Sistema](#architettura-sistema)
2. [Schema Database](#schema-database)
3. [Componenti Frontend](#componenti-frontend)
4. [Componenti Backend](#componenti-backend)
5. [API Endpoints](#api-endpoints)
6. [Flusso Dati](#flusso-dati)
7. [Configurazione FIPSAS](#configurazione-fipsas)
8. [Troubleshooting](#troubleshooting)

---

## ARCHITETTURA SISTEMA

### Stack Tecnologico
```
Frontend: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
Backend:  Express.js + Prisma ORM
Database: PostgreSQL (via Prisma)
Testing:  Playwright (E2E), Jest (unit)
```

### Directory Structure
```
D:\Dev\TournamentMaster\
├── frontend\
│   ├── src\
│   │   ├── app\[locale]\dashboard\tournaments\
│   │   │   └── page.tsx              # Pagina gestione tornei
│   │   ├── components\
│   │   │   ├── SpeciesScoringConfig.tsx  # Config punti C&R
│   │   │   └── ui\
│   │   │       └── dialog.tsx        # Componente Dialog shadcn/ui
│   │   └── lib\
│   │       └── utils.ts              # Funzione cn() per merge classi
├── backend\
│   ├── prisma\
│   │   └── schema.prisma             # Schema database
│   └── src\
│       ├── services\
│       │   └── catch.service.ts      # Logica scoring
│       └── routes\
│           └── catch.routes.ts       # API catture
└── public\
    └── documents\regulations\fipsas\ # PDF regolamenti
```

---

## SCHEMA DATABASE

### Enum GameMode
```prisma
enum GameMode {
  TRADITIONAL      // Punteggio basato sul peso
  CATCH_RELEASE    // Punteggio per specie + taglia
}
```

### Enum SizeCategory
```prisma
enum SizeCategory {
  SMALL        // S - Taglia piccola
  MEDIUM       // M - Taglia media
  LARGE        // L - Taglia grande
  EXTRA_LARGE  // XL - Taglia extra large
}
```

### Model Tournament (modifiche)
```prisma
model Tournament {
  id                String     @id @default(uuid())
  name              String
  // ... altri campi esistenti ...

  // NUOVI CAMPI C&R
  gameMode          GameMode   @default(TRADITIONAL)
  followsFipsasRules Boolean   @default(false)
  speciesScoring    SpeciesScoring[]

  @@map("tournaments")
}
```

### Model Catch (modifiche)
```prisma
model Catch {
  id            String         @id @default(uuid())
  // ... campi esistenti ...

  weight        Decimal?       @db.Decimal(8, 3)  // Ora opzionale per C&R
  sizeCategory  SizeCategory?  // Nuovo: per C&R mode

  @@map("catches")
}
```

### Model SpeciesScoring (NUOVO)
```prisma
model SpeciesScoring {
  id              String     @id @default(uuid())
  tournamentId    String
  tournament      Tournament @relation(fields: [tournamentId], references: [id])
  speciesId       String
  species         Species    @relation(fields: [speciesId], references: [id])

  pointsSmall     Int        @default(100)
  pointsMedium    Int        @default(200)
  pointsLarge     Int        @default(400)
  pointsExtraLarge Int       @default(800)

  thresholdSmallCm  Int?     // Soglia cm per taglia S
  thresholdMediumCm Int?     // Soglia cm per taglia M
  thresholdLargeCm  Int?     // Soglia cm per taglia L

  catchReleaseBonus Decimal  @default(1.5)  // Moltiplicatore rilascio

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@unique([tournamentId, speciesId])
  @@map("species_scoring")
}
```

---

## COMPONENTI FRONTEND

### 1. SpeciesScoringConfig.tsx

**Path:** `frontend/src/components/SpeciesScoringConfig.tsx`

**Interfacce:**
```typescript
interface SpeciesScoring {
  speciesId: string;
  speciesName: string;
  pointsSmall: number;
  pointsMedium: number;
  pointsLarge: number;
  pointsExtraLarge: number;
  thresholdSmallCm?: number;
  thresholdMediumCm?: number;
  thresholdLargeCm?: number;
  catchReleaseBonus: number;
  isCustom?: boolean;
}

interface Props {
  discipline?: string;
  initialScoring?: SpeciesScoring[];
  onChange?: (scoring: SpeciesScoring[]) => void;
  readOnly?: boolean;
}
```

**Funzioni Chiave:**

```typescript
// Genera scoring pre-compilato per discipline
function generatePrefilledScoring(discipline: string): SpeciesScoring[]

// Componente principale
export function SpeciesScoringConfig({
  discipline = "default",
  initialScoring,
  onChange,
  readOnly = false
}: Props)
```

**Costanti:**
```typescript
// Mappa discipline → specie con punti FIPSAS
const SPECIES_BY_DISCIPLINE: Record<string, SpeciesInfo[]>

// Discipline supportate:
// - BIG_GAME, BOLENTINO, TRAINA_COSTIERA, SURF_CASTING
// - SHORE, EGING, VERTICAL_JIGGING, DRIFTING, default
```

**Pattern Auto-Prefill:**
```typescript
const [scoring, setScoring] = useState<SpeciesScoring[]>(() => {
  if (initialScoring && initialScoring.length > 0) {
    return initialScoring;
  }
  return generatePrefilledScoring(discipline);
});

const prevDisciplineRef = useRef(discipline);

useEffect(() => {
  if (discipline !== prevDisciplineRef.current) {
    prevDisciplineRef.current = discipline;
    if (!initialScoring || initialScoring.length === 0) {
      const newScoring = generatePrefilledScoring(discipline);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScoring(newScoring);
      onChange?.(newScoring);
    }
  }
}, [discipline, initialScoring, onChange]);
```

### 2. tournaments/page.tsx

**Path:** `frontend/src/app/[locale]/dashboard/tournaments/page.tsx`

**Dialog Create/Edit:**
```typescript
// Linea 979 - Create Dialog
<DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">

// Linea 1232 - Edit Dialog
<DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
```

**Form State:**
```typescript
const [formData, setFormData] = useState({
  name: "",
  description: "",
  discipline: "BIG_GAME",
  gameMode: "TRADITIONAL",      // TRADITIONAL | CATCH_RELEASE
  followsFipsasRules: false,
  speciesScoring: [],           // Array SpeciesScoring
  // ... altri campi
});
```

### 3. dialog.tsx (shadcn/ui)

**Path:** `frontend/src/components/ui/dialog.tsx`

**Problema Identificato (linea 63):**
```typescript
className={cn(
  "... sm:max-w-lg",  // 512px hardcoded
  className           // Override deve usare sm: prefix
)}
```

**Soluzione:**
Per sovrascrivere la larghezza, usare SEMPRE `sm:max-w-*`:
```typescript
// NON FUNZIONA:
<DialogContent className="max-w-6xl">

// FUNZIONA:
<DialogContent className="sm:max-w-6xl">
```

---

## COMPONENTI BACKEND

### 1. catch.service.ts

**Path:** `backend/src/services/catch.service.ts`

**Metodo Scoring (da implementare):**
```typescript
async calculateScore(catchData: CatchInput, tournament: Tournament): Promise<number> {
  if (tournament.gameMode === 'CATCH_RELEASE') {
    // Lookup nella tabella species_scoring
    const scoring = await prisma.speciesScoring.findUnique({
      where: {
        tournamentId_speciesId: {
          tournamentId: tournament.id,
          speciesId: catchData.speciesId
        }
      }
    });

    if (!scoring) return 0;

    // Mappa sizeCategory → punti
    const pointsMap = {
      SMALL: scoring.pointsSmall,
      MEDIUM: scoring.pointsMedium,
      LARGE: scoring.pointsLarge,
      EXTRA_LARGE: scoring.pointsExtraLarge
    };

    let points = pointsMap[catchData.sizeCategory] || 0;

    // Applica bonus rilascio se video presente
    if (catchData.videoPath) {
      points *= Number(scoring.catchReleaseBonus);
    }

    return Math.round(points);
  }

  // TRADITIONAL mode - calcolo peso esistente
  return catchData.weight * tournament.pointsPerKg;
}
```

### 2. catch.routes.ts

**Path:** `backend/src/routes/catch.routes.ts`

**Validazione C&R:**
```typescript
// POST /api/catches
if (tournament.gameMode === 'CATCH_RELEASE') {
  // Video OBBLIGATORIO
  if (!req.body.videoPath) {
    return res.status(400).json({
      error: 'Video obbligatorio per Catch & Release'
    });
  }

  // SizeCategory OBBLIGATORIA
  if (!req.body.sizeCategory) {
    return res.status(400).json({
      error: 'Taglia (S/M/L/XL) obbligatoria per Catch & Release'
    });
  }

  // Weight diventa opzionale
  // (non validare peso per C&R)
}
```

---

## API ENDPOINTS

### Tornei

| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/tournaments` | Lista tornei |
| POST | `/api/tournaments` | Crea torneo (include gameMode) |
| PUT | `/api/tournaments/:id` | Modifica torneo |
| GET | `/api/tournaments/:id/scoring` | Config scoring C&R |
| PUT | `/api/tournaments/:id/scoring` | Salva scoring C&R |

### Catture

| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/catches` | Nuova cattura |
| GET | `/api/catches/:id` | Dettaglio cattura |
| PUT | `/api/catches/:id` | Modifica cattura |

**Body POST /api/catches (C&R mode):**
```json
{
  "tournamentId": "uuid",
  "speciesId": "uuid",
  "sizeCategory": "LARGE",     // REQUIRED per C&R
  "videoPath": "/uploads/...", // REQUIRED per C&R
  "weight": null,              // Opzionale per C&R
  "photoPath": "/uploads/...", // Opzionale
  "notes": "Rilasciato vivo"
}
```

---

## FLUSSO DATI

### Creazione Torneo C&R
```
1. Utente seleziona gameMode = CATCH_RELEASE
2. Frontend mostra SpeciesScoringConfig
3. Auto-prefill specie dalla discipline selezionata
4. Utente può modificare punti o aggiungere specie custom
5. Submit → POST /api/tournaments con speciesScoring array
6. Backend crea Tournament + SpeciesScoring records
```

### Registrazione Cattura C&R
```
1. Giudice seleziona specie e taglia (S/M/L/XL)
2. Upload video OBBLIGATORIO
3. Submit → POST /api/catches
4. Backend:
   - Valida video presente
   - Valida sizeCategory presente
   - Lookup SpeciesScoring per calcolo punti
   - Applica catchReleaseBonus se applicabile
   - Salva Catch con punti calcolati
```

---

## CONFIGURAZIONE FIPSAS

### Punteggi per Disciplina

#### BIG_GAME
| Specie | S | M | L | XL |
|--------|---|---|---|-----|
| Tonno Rosso | 8500 | 18500 | 42000 | 85000 |
| Pesce Spada | 6200 | 14800 | 32000 | 65000 |
| Aguglia Imperiale | 4800 | 12000 | 28000 | 55000 |
| Alalunga | 2800 | 6500 | 14000 | 28000 |
| Lampuga | 1200 | 2800 | 6200 | 12000 |

#### BOLENTINO
| Specie | S | M | L | XL |
|--------|---|---|---|-----|
| Cernia | 2126 | 4890 | 9330 | 15000 |
| Dentice | 580 | 1530 | 3200 | 5500 |
| Pagello | 118 | 316 | 680 | 1200 |
| Sarago | 138 | 376 | 820 | 1400 |
| Tanuta | 96 | 258 | 560 | 950 |
| Orata | 206 | 548 | 1180 | 2000 |

### File Regolamenti
**Path:** `frontend/public/documents/regulations/fipsas/`

| File | Disciplina |
|------|------------|
| circolare_normativa_2025_big_game.pdf | Big Game |
| circolare_normativa_2025_bolentino.pdf | Bolentino |
| circolare_normativa_2025_surf_casting.pdf | Surf Casting |
| tabella_punteggio_cm_peso_a4.pdf | Tabella conversione |

---

## TROUBLESHOOTING

### Dialog non si allarga

**Problema:** Modifiche a `max-w-*` non hanno effetto

**Causa:** `dialog.tsx` ha `sm:max-w-lg` hardcoded

**Soluzione:** Usare SEMPRE prefisso `sm:`:
```typescript
// Corretto
<DialogContent className="sm:max-w-6xl">
```

### ESLint error react-hooks/set-state-in-effect

**Problema:** Chiamare `setState` in useEffect genera warning

**Soluzione:** Usare `eslint-disable` per casi legittimi di derived state:
```typescript
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setScoring(newValue);
}, [dependency]);
```

### Auto-prefill non funziona

**Verifica:**
1. La `discipline` prop viene passata correttamente?
2. `initialScoring` è vuoto (altrimenti non fa prefill)?
3. `SPECIES_BY_DISCIPLINE[discipline]` esiste?

### Punti non calcolati correttamente

**Verifica:**
1. Record `SpeciesScoring` esiste per tournament + species?
2. `sizeCategory` è valido (SMALL/MEDIUM/LARGE/EXTRA_LARGE)?
3. `gameMode` del torneo è CATCH_RELEASE?

---

## FILE MODIFICATI IN QUESTA SESSIONE

| File | Modifiche |
|------|-----------|
| `frontend/src/components/SpeciesScoringConfig.tsx` | Punteggi FIPSAS + auto-prefill |
| `frontend/src/app/[locale]/dashboard/tournaments/page.tsx` | Dialog width sm:max-w-6xl |

---

## RIFERIMENTI

- [Piano C&R](groovy-foraging-mist.md) - Piano originale implementazione
- [FIPSAS](https://www.fipsas.it) - Regolamenti ufficiali
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog) - Documentazione componente
- [Tailwind CSS Max-Width](https://tailwindcss.com/docs/max-width) - Classi larghezza
