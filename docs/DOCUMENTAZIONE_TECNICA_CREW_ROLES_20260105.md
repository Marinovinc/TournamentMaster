# Documentazione Tecnica - Sistema Ruoli Equipaggio Drifting
**Versione:** 1.0.0
**Data:** 2026-01-05
**Stato:** Schema implementato, API/UI da completare

---

## INDICE

1. [Architettura Sistema](#architettura-sistema)
2. [Schema Database](#schema-database)
3. [Enum e Tipi](#enum-e-tipi)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Flusso Dati](#flusso-dati)
7. [Logica di Business](#logica-di-business)
8. [TODO Implementazione](#todo-implementazione)

---

## ARCHITETTURA SISTEMA

### Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|------------|----------|
| Frontend | Next.js + React | 16.1.1 |
| Styling | Tailwind CSS + shadcn/ui | Latest |
| Backend | Node.js + Express | 20.x |
| ORM | Prisma | 6.x |
| Database | MariaDB | 10.4 |
| Auth | JWT | Custom |

### Struttura Directory

```
TournamentMaster/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Schema database
│   ├── src/
│   │   ├── routes/
│   │   │   └── team.routes.ts     # API teams
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript types
│   │   └── lib/
│   │       └── prisma.ts          # Client Prisma
│   └── package.json
├── frontend/
│   └── src/
│       ├── app/[locale]/dashboard/
│       │   └── tournaments/[id]/teams/
│       │       └── page.tsx       # UI pagina teams
│       └── components/ui/
│           └── collapsible.tsx    # Componente espandibile
└── docs/
    ├── GUIDA_BARCHE_STRIKE_FEATURES.md
    ├── HANDOVER_SESSIONE_CREW_ROLES_20260105.md
    └── DOCUMENTAZIONE_TECNICA_CREW_ROLES_20260105.md
```

---

## SCHEMA DATABASE

### Tabella: teams

```sql
CREATE TABLE teams (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  boatName VARCHAR(255) NOT NULL,
  boatNumber INT NULL,

  -- Capitano (responsabile iscrizione)
  captainId VARCHAR(36) NOT NULL,

  -- Società di appartenenza
  clubName VARCHAR(255) NULL,
  clubCode VARCHAR(50) NULL,

  -- Associazione RAPPRESENTATA (NUOVO - per tornei provinciali)
  representingClubName VARCHAR(255) NULL,
  representingClubCode VARCHAR(50) NULL,

  -- Ispettore di bordo
  inspectorId VARCHAR(36) NULL,
  inspectorName VARCHAR(255) NULL,
  inspectorClub VARCHAR(255) NULL,

  tournamentId VARCHAR(36) NOT NULL,
  createdAt DATETIME DEFAULT NOW(),
  updatedAt DATETIME ON UPDATE NOW(),

  FOREIGN KEY (captainId) REFERENCES users(id),
  FOREIGN KEY (tournamentId) REFERENCES tournaments(id) ON DELETE CASCADE,
  UNIQUE KEY (tournamentId, boatNumber)
);
```

### Tabella: team_members

```sql
CREATE TABLE team_members (
  id VARCHAR(36) PRIMARY KEY,
  teamId VARCHAR(36) NOT NULL,

  -- Utente registrato (OPZIONALE per esterni)
  userId VARCHAR(36) NULL,

  -- Dati per membri esterni (NUOVO)
  externalName VARCHAR(255) NULL,
  externalPhone VARCHAR(30) NULL,
  externalEmail VARCHAR(255) NULL,
  isExternal BOOLEAN DEFAULT FALSE,

  -- Ruolo equipaggio (NUOVO enum)
  role ENUM('SKIPPER', 'TEAM_LEADER', 'CREW', 'ANGLER', 'GUEST') DEFAULT 'CREW',

  createdAt DATETIME DEFAULT NOW(),

  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE KEY (teamId, userId)
);
```

### Indici

```sql
CREATE INDEX idx_team_members_team ON team_members(teamId);
CREATE INDEX idx_team_members_user ON team_members(userId);
CREATE INDEX idx_teams_tournament ON teams(tournamentId);
CREATE INDEX idx_teams_captain ON teams(captainId);
```

---

## ENUM E TIPI

### CrewRole (Prisma)

```prisma
enum CrewRole {
  SKIPPER       // Skipper/Conduttore barca (può essere esterno)
  TEAM_LEADER   // Capoequipaggio (responsabile team)
  CREW          // Membro equipaggio standard
  ANGLER        // Pescatore dedicato
  GUEST         // Ospite (può essere esterno)
}
```

### TypeScript Interfaces

```typescript
// File: backend/src/types/index.ts

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string | null;

  // Dati utente registrato
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    fipsasNumber?: string;
  } | null;

  // Dati membro esterno
  externalName: string | null;
  externalPhone: string | null;
  externalEmail: string | null;
  isExternal: boolean;

  role: CrewRole;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  boatName: string;
  boatNumber: number | null;

  captainId: string;
  captain: User;

  // Società appartenenza
  clubName: string | null;
  clubCode: string | null;

  // Società rappresentata (tornei provinciali)
  representingClubName: string | null;
  representingClubCode: string | null;

  // Ispettore
  inspectorId: string | null;
  inspectorName: string | null;
  inspectorClub: string | null;

  tournamentId: string;
  tournament: Tournament;
  members: TeamMember[];

  createdAt: Date;
  updatedAt: Date;
}

export enum CrewRole {
  SKIPPER = 'SKIPPER',
  TEAM_LEADER = 'TEAM_LEADER',
  CREW = 'CREW',
  ANGLER = 'ANGLER',
  GUEST = 'GUEST'
}
```

---

## API ENDPOINTS

### Base URL
```
http://localhost:3001/api
```

### Endpoints Team

| Metodo | Endpoint | Descrizione | Permessi |
|--------|----------|-------------|----------|
| GET | `/teams` | Lista tutti i team | Autenticato |
| GET | `/teams/:id` | Dettaglio team | Autenticato |
| POST | `/teams` | Crea nuovo team | Admin/Captain |
| PUT | `/teams/:id` | Aggiorna team | Admin/Captain |
| DELETE | `/teams/:id` | Elimina team | Admin |
| GET | `/teams/tournament/:tournamentId` | Team per torneo | Autenticato |
| PUT | `/teams/:id/inspector` | Assegna ispettore | Admin |
| POST | `/teams/:id/members` | Aggiungi membro | Admin/Captain |
| DELETE | `/teams/:id/members/:userId` | Rimuovi membro | Admin/Captain |

### Endpoint da implementare (TODO)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/teams/:id/members/external` | Aggiungi membro esterno |
| PUT | `/teams/:id/members/:memberId` | Modifica ruolo membro |
| PUT | `/teams/:id/representing-club` | Imposta club rappresentato |

### Request/Response Examples

#### POST /teams/:id/members (esistente - da aggiornare)

**Request:**
```json
{
  "userId": "uuid-utente",
  "role": "CREW"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member added successfully",
  "data": {
    "id": "uuid-member",
    "teamId": "uuid-team",
    "userId": "uuid-utente",
    "role": "CREW",
    "isExternal": false,
    "user": {
      "id": "uuid-utente",
      "firstName": "Mario",
      "lastName": "Rossi",
      "email": "mario@example.com"
    }
  }
}
```

#### POST /teams/:id/members/external (DA IMPLEMENTARE)

**Request:**
```json
{
  "name": "Giuseppe Verdi",
  "role": "SKIPPER",
  "phone": "+39 333 1234567",
  "email": "giuseppe@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "External member added successfully",
  "data": {
    "id": "uuid-member",
    "teamId": "uuid-team",
    "userId": null,
    "externalName": "Giuseppe Verdi",
    "externalPhone": "+39 333 1234567",
    "externalEmail": "giuseppe@example.com",
    "isExternal": true,
    "role": "SKIPPER"
  }
}
```

---

## FRONTEND COMPONENTS

### Pagina Teams

**File:** `frontend/src/app/[locale]/dashboard/tournaments/[id]/teams/page.tsx`

#### Componenti Utilizzati (shadcn/ui)

| Componente | Import | Uso |
|------------|--------|-----|
| Card | `@/components/ui/card` | Container team info |
| Button | `@/components/ui/button` | Azioni |
| Badge | `@/components/ui/badge` | Ruoli, stati |
| Input | `@/components/ui/input` | Form fields |
| Dialog | `@/components/ui/dialog` | Modali |
| DropdownMenu | `@/components/ui/dropdown-menu` | Menu azioni |
| Collapsible | `@/components/ui/collapsible` | Card espandibili |
| Table | `@/components/ui/table` | Liste |

#### Icone (Lucide React)

```typescript
import {
  Ship,           // Barca
  Users,          // Equipaggio
  User,           // Singolo membro
  UserCheck,      // Membro verificato
  Award,          // Ispettore
  Hash,           // Numero barca
  Anchor,         // Skipper
  Plus,           // Aggiungi
  Edit,           // Modifica
  Trash2,         // Elimina
  ChevronDown,    // Espandi
  ChevronRight,   // Comprimi
  Building2,      // Club/Associazione
  Phone,          // Telefono
  Mail,           // Email
} from "lucide-react";
```

#### Funzione getRoleBadge (DA AGGIORNARE)

```typescript
const getRoleBadge = (role: string, isExternal: boolean = false) => {
  const config: Record<string, {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon?: React.ReactNode;
  }> = {
    SKIPPER: {
      label: "Skipper",
      variant: "default",
      icon: <Anchor className="h-3 w-3 mr-1" />
    },
    TEAM_LEADER: {
      label: "Capoequipaggio",
      variant: "default"
    },
    CREW: {
      label: "Equipaggio",
      variant: "secondary"
    },
    ANGLER: {
      label: "Pescatore",
      variant: "outline"
    },
    GUEST: {
      label: "Ospite",
      variant: "outline"
    },
  };

  const { label, variant, icon } = config[role] || { label: role, variant: "outline" };

  return (
    <div className="flex items-center gap-1">
      <Badge variant={variant}>
        {icon}
        {label}
      </Badge>
      {isExternal && (
        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
          Esterno
        </Badge>
      )}
    </div>
  );
};
```

---

## FLUSSO DATI

### Creazione Team con Equipaggio

```
┌─────────────────┐
│  UI: Form Team  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  POST /api/teams                        │
│  {                                      │
│    name: "Team Capri",                  │
│    boatName: "Blue Marlin",             │
│    tournamentId: "uuid",                │
│    clubName: "Circolo Nautico Capri",   │
│    clubCode: "CNC001"                   │
│  }                                      │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Backend: team.routes.ts                │
│  1. Valida dati                         │
│  2. Verifica permessi                   │
│  3. prisma.team.create()                │
│  4. Auto-aggiunge captain come membro   │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Database: teams + team_members         │
└─────────────────────────────────────────┘
```

### Aggiunta Membro Esterno (DA IMPLEMENTARE)

```
┌─────────────────────────────────────────┐
│  UI: Dialog "Aggiungi Membro Esterno"   │
│  - Nome (obbligatorio)                  │
│  - Ruolo: SKIPPER o GUEST               │
│  - Telefono (opzionale)                 │
│  - Email (opzionale)                    │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  POST /api/teams/:id/members/external   │
│  {                                      │
│    name: "Giuseppe Verdi",              │
│    role: "SKIPPER",                     │
│    phone: "+39 333 1234567"             │
│  }                                      │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Backend: team.routes.ts                │
│  1. Valida: role deve essere SKIPPER    │
│     o GUEST per esterni                 │
│  2. prisma.teamMember.create({          │
│       teamId,                           │
│       userId: null,                     │
│       externalName: name,               │
│       externalPhone: phone,             │
│       isExternal: true,                 │
│       role                              │
│     })                                  │
└─────────────────────────────────────────┘
```

---

## LOGICA DI BUSINESS

### Regole Ruoli per Tipo Torneo

| Torneo | Skipper | Ospiti | Membri |
|--------|---------|--------|--------|
| CLUB (Interno) | Può essere esterno | Possono essere esterni | Devono essere iscritti |
| PROVINCIAL | Deve essere tesserato | Devono essere tesserati | Devono essere tesserati |
| REGIONAL | Deve essere tesserato | Devono essere tesserati | Devono essere tesserati |
| NATIONAL | Deve essere tesserato FIPSAS | Devono essere tesserati | Devono essere tesserati |

### Validazione Backend

```typescript
// File: backend/src/routes/team.routes.ts

const validateExternalMember = async (
  tournamentLevel: TournamentLevel,
  role: CrewRole
): Promise<boolean> => {
  // Solo SKIPPER e GUEST possono essere esterni
  if (role !== 'SKIPPER' && role !== 'GUEST') {
    return false;
  }

  // Per tornei non-CLUB, non sono ammessi esterni
  if (tournamentLevel !== 'CLUB') {
    return false;
  }

  return true;
};
```

### Rappresentazione Club (Tornei Provinciali)

```typescript
// Per tornei PROVINCIAL, REGIONAL, NATIONAL, INTERNATIONAL
// il team può rappresentare un'associazione diversa

interface TeamRepresentation {
  // Club di appartenenza (dove sono tesserati)
  clubName: string;
  clubCode: string;

  // Club rappresentato nel torneo (può essere diverso)
  representingClubName: string;
  representingClubCode: string;
}

// Esempio: Mario è tesserato al "Circolo Nautico Ischia"
// ma nel torneo provinciale rappresenta "Lega Navale Napoli"
```

---

## TODO IMPLEMENTAZIONE

### Backend (team.routes.ts)

- [ ] Aggiornare validazione ruoli da `["CAPTAIN", "CREW", "ANGLER"]` a `["SKIPPER", "TEAM_LEADER", "CREW", "ANGLER", "GUEST"]`
- [ ] Aggiungere endpoint `POST /teams/:id/members/external`
- [ ] Aggiungere endpoint `PUT /teams/:id/representing-club`
- [ ] Aggiungere validazione: esterni solo per tornei CLUB
- [ ] Aggiungere validazione: solo SKIPPER e GUEST possono essere esterni

### Frontend (teams/page.tsx)

- [ ] Aggiornare interfaccia TypeScript `TeamMember` con campi esterni
- [ ] Aggiornare funzione `getRoleBadge()` con nuovi ruoli
- [ ] Aggiungere dialog "Aggiungi Membro Esterno"
- [ ] Mostrare badge "Esterno" per membri con `isExternal=true`
- [ ] Aggiungere campo "Associazione Rappresentata" per tornei provinciali+
- [ ] Aggiungere dropdown selezione ruolo con icone

### Database

- [x] Enum CrewRole creato
- [x] Campi esterni aggiunti a team_members
- [x] Campi representingClub aggiunti a teams
- [ ] Migrare dati esistenti: `CAPTAIN` → `TEAM_LEADER`

### Testing

- [ ] Test creazione membro esterno
- [ ] Test validazione ruoli per tipo torneo
- [ ] Test rappresentazione club diverso
- [ ] Test UI nuovi componenti

---

## RIFERIMENTI

| Documento | Percorso |
|-----------|----------|
| Schema Prisma | `backend/prisma/schema.prisma` |
| API Teams | `backend/src/routes/team.routes.ts` |
| UI Teams | `frontend/src/app/[locale]/dashboard/tournaments/[id]/teams/page.tsx` |
| Guida Utente | `docs/GUIDA_BARCHE_STRIKE_FEATURES.md` |
| Handover | `docs/HANDOVER_SESSIONE_CREW_ROLES_20260105.md` |

---

**Ultimo aggiornamento:** 2026-01-05
**Autore:** Claude Code (Opus 4.5)
