# DOCUMENTAZIONE TECNICA - Gestione Assistenti Giudici di Gara

**Data:** 2026-01-11
**Versione:** 1.0.0
**Progetto:** TournamentMaster
**Feature:** Gerarchia Giudice-Assistente per Tournament Staff

---

## INDICE

1. [Panoramica Architetturale](#panoramica-architetturale)
2. [Schema Database](#schema-database)
3. [API Endpoints](#api-endpoints)
4. [Service Layer](#service-layer)
5. [Frontend Components](#frontend-components)
6. [Bug Noti e Debito Tecnico](#bug-noti-e-debito-tecnico)
7. [Esempi di Utilizzo](#esempi-di-utilizzo)

---

## PANORAMICA ARCHITETTURALE

### Obiettivo
Implementare una gerarchia tra giudici di gara e loro assistenti, dove ogni giudice (JUDGE) puo avere uno o piu assistenti (JUDGE_ASSISTANT) assegnati.

### Stack Tecnologico
- **Backend:** Express.js + TypeScript
- **ORM:** Prisma 5.x
- **Database:** MariaDB 10.4
- **Frontend:** Next.js 16 + React + shadcn/ui
- **Autenticazione:** JWT Bearer Token

### Relazione Gerarchica
```
TournamentStaff (JUDGE)
    |
    +-- TournamentStaff (JUDGE_ASSISTANT) [parentStaffId -> JUDGE.id]
    +-- TournamentStaff (JUDGE_ASSISTANT) [parentStaffId -> JUDGE.id]
    ...
```

---

## SCHEMA DATABASE

### File: `backend/prisma/schema.prisma`

#### Enum TournamentStaffRole (linee 76-82)
```prisma
enum TournamentStaffRole {
  DIRECTOR         // Direttore di gara
  JUDGE            // Giudice di gara
  JUDGE_ASSISTANT  // Assistente del giudice di gara (NUOVO)
  INSPECTOR        // Ispettore (assegnato a barca)
  SCORER           // Addetto punteggi
}
```

#### Model TournamentStaff (linee 569-594)
```prisma
model TournamentStaff {
  id            String              @id @default(uuid())
  role          TournamentStaffRole
  notes         String?             @db.VarChar(500)

  // Utente assegnato
  userId        String
  user          User                @relation(fields: [userId], references: [id])

  // Torneo di riferimento
  tournamentId  String
  tournament    Tournament          @relation(fields: [tournamentId], references: [id], onDelete: Cascade)

  // NUOVO: Gerarchia per JUDGE_ASSISTANT
  parentStaffId String?
  parentStaff   TournamentStaff?    @relation("StaffHierarchy", fields: [parentStaffId], references: [id], onDelete: SetNull)
  assistants    TournamentStaff[]   @relation("StaffHierarchy")

  createdAt     DateTime            @default(now())

  @@unique([tournamentId, userId, role])
  @@index([tournamentId])
  @@index([userId])
  @@index([parentStaffId])
  @@map("tournament_staff")
}
```

#### Relazione User.reviewedCatches (linea 130)
```prisma
// Nel model User:
reviewedCatches     Catch[] @relation("CatchReviewer")
```
**Nota:** Questa relazione era mancante e causava errori di compilazione. E stata aggiunta durante questa sessione.

### Campi Database Nuovi
| Campo | Tipo | Nullable | Descrizione |
|-------|------|----------|-------------|
| `parentStaffId` | VARCHAR(36) | SI | FK a `tournament_staff.id` del giudice padre |

### Indici
- `@@index([parentStaffId])` - Per query veloci sugli assistenti di un giudice

---

## API ENDPOINTS

### File: `backend/src/routes/staff.routes.ts`

### Endpoint Esistenti (Modificati)

#### GET /api/staff/tournament/:tournamentId
- **Linee:** 45-89
- **Modifica:** Ora include `judgeAssistants` nel raggruppamento
- **Response:**
```json
{
  "success": true,
  "data": {
    "staff": [...],
    "grouped": {
      "directors": [...],
      "judges": [...],
      "judgeAssistants": [...],  // NUOVO
      "inspectors": [...],
      "scorers": [...]
    },
    "total": 10
  }
}
```

#### POST /api/staff/tournament/:tournamentId
- **Linee:** 146-196
- **Modifica:** Accetta `parentStaffId` opzionale per JUDGE_ASSISTANT
- **Body:**
```json
{
  "userId": "uuid",
  "role": "JUDGE_ASSISTANT",
  "notes": "opzionale",
  "parentStaffId": "uuid-del-giudice"  // NUOVO
}
```

### Nuovi Endpoint

#### GET /api/staff/tournament/:tournamentId/judges
- **Linee:** 394-424
- **Descrizione:** Ritorna tutti i giudici con i loro assistenti
- **Authorization:** SUPER_ADMIN, TENANT_ADMIN, ORGANIZER
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "judge-staff-id",
      "role": "JUDGE",
      "user": { "id": "...", "firstName": "...", "lastName": "...", "avatar": "..." },
      "assistants": [
        { "id": "...", "user": { "id": "...", "firstName": "...", "lastName": "...", "avatar": "..." } }
      ]
    }
  ]
}
```

#### POST /api/staff/judge/:judgeStaffId/assistant
- **Linee:** 427-490
- **Descrizione:** Assegna un assistente a un giudice
- **Authorization:** SUPER_ADMIN, TENANT_ADMIN, ORGANIZER
- **Body:**
```json
{
  "userId": "uuid-utente",
  "notes": "opzionale"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Assistant assigned to judge",
  "data": {
    "id": "new-assistant-staff-id",
    "user": {...},
    "parentStaff": {...}
  }
}
```

#### GET /api/staff/judge/:judgeStaffId/assistants
- **Linee:** 492-522
- **Descrizione:** Lista assistenti di un giudice specifico
- **Authorization:** Authenticated user

#### DELETE /api/staff/assistant/:assistantStaffId
- **Linee:** 524-563
- **Descrizione:** Rimuove un assistente
- **Authorization:** SUPER_ADMIN, TENANT_ADMIN, ORGANIZER

#### PUT /api/staff/assistant/:assistantStaffId/reassign
- **Linee:** 565-613
- **Descrizione:** Riassegna un assistente a un altro giudice
- **Authorization:** SUPER_ADMIN, TENANT_ADMIN, ORGANIZER
- **Body:**
```json
{
  "newJudgeStaffId": "uuid-nuovo-giudice"
}
```

---

## SERVICE LAYER

### File: `backend/src/services/staff.service.ts`

### Metodi Esistenti (Modificati)

#### StaffService.assign() - Linee 35-112
- **Modifica:** Gestisce `parentStaffId` per JUDGE_ASSISTANT
- **Validazione aggiunta (linee 69-81):**
```typescript
if (data.role === 'JUDGE_ASSISTANT' && data.parentStaffId) {
  const parentStaff = await prisma.tournamentStaff.findFirst({
    where: {
      id: data.parentStaffId,
      tournamentId: data.tournamentId,
      role: 'JUDGE',
    },
  });
  if (!parentStaff) {
    throw new Error('Parent judge not found or is not a judge for this tournament');
  }
}
```

#### StaffService.getByTournament() - Linee 136-180
- **Modifica:** Include `parentStaff` e `assistants` nelle relazioni

### Nuovi Metodi

#### StaffService.getJudges() - Linee 302-334
```typescript
static async getJudges(tournamentId: string) {
  const judges = await prisma.tournamentStaff.findMany({
    where: { tournamentId, role: 'JUDGE' },
    include: {
      user: { select: { id, firstName, lastName, avatar } },
      assistants: {
        include: { user: { select: { id, firstName, lastName, avatar } } }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
  return judges;
}
```

#### StaffService.getAssistants() - Linee 339-360
```typescript
static async getAssistants(judgeStaffId: string) {
  return prisma.tournamentStaff.findMany({
    where: { parentStaffId: judgeStaffId, role: 'JUDGE_ASSISTANT' },
    include: { user: { select: { id, email, firstName, lastName, avatar } } },
    orderBy: { createdAt: 'asc' }
  });
}
```

#### StaffService.assignAssistant() - Linee 365-417
```typescript
static async assignAssistant(
  tournamentId: string,
  judgeStaffId: string,
  assistantUserId: string,
  notes?: string
) {
  // Verifica giudice esiste
  // Crea assignment come JUDGE_ASSISTANT con parentStaffId
}
```

#### StaffService.removeAssistant() - Linee 422-439
```typescript
static async removeAssistant(assistantStaffId: string) {
  // Verifica sia JUDGE_ASSISTANT
  // Elimina record
}
```

#### StaffService.reassignAssistant() - Linee 444-500
```typescript
static async reassignAssistant(assistantStaffId: string, newJudgeStaffId: string) {
  // Verifica assistente esiste
  // Verifica nuovo giudice esiste nello stesso torneo
  // Aggiorna parentStaffId
}
```

---

## FRONTEND COMPONENTS

### File: `frontend/src/app/[locale]/dashboard/tournaments/[id]/staff/page.tsx`

### Interface StaffMember (linee 67-97)
```typescript
interface StaffMember {
  id: string;
  role: "DIRECTOR" | "JUDGE" | "JUDGE_ASSISTANT" | "INSPECTOR" | "SCORER";
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar: string | null;
  };
  // NUOVO: Relazione gerarchica
  parentStaff?: {
    id: string;
    user: { id: string; firstName: string; lastName: string; };
  } | null;
  assistants?: {
    id: string;
    user: { id: string; firstName: string; lastName: string; avatar: string | null; };
  }[];
}
```

### Role Labels (linee 114-120)
```typescript
const roleLabels = {
  // ...existing roles...
  JUDGE_ASSISTANT: {
    label: "Assistente Giudice",
    icon: UserCheck,
    color: "bg-cyan-100 text-cyan-700 border-cyan-200"
  },
};
```

### State Variables (linee 137-139)
```typescript
const [assistantDialogOpen, setAssistantDialogOpen] = useState(false);
const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null);
const [expandedJudges, setExpandedJudges] = useState<Set<string>>(new Set());
```

### UI Components
- **Judges Section (linee 483-628):** Card espandibili con lista assistenti
- **Assistant Dialog (linee 630-688):** Dialog per assegnare nuovi assistenti

---

## BUG NOTI E DEBITO TECNICO

### BUG CRITICI

#### 1. Funzioni Frontend Non Definite - RISOLTO
**File:** `frontend/src/app/[locale]/dashboard/tournaments/[id]/staff/page.tsx`
**Severita:** ~~CRITICA~~ **RISOLTO** (2026-01-11)

Le seguenti funzioni sono **chiamate ma NON definite**:

| Funzione | Chiamata a Linea | Descrizione |
|----------|------------------|-------------|
| `toggleJudgeExpanded` | 528 | Toggle espansione card giudice |
| `openAssistantDialog` | 552, 614 | Apri dialog assegnazione assistente |
| `handleAssignAssistant` | 681 | Handler submit assegnazione assistente |
| `handleRemoveAssistant` | 594 | Handler rimozione assistente |

**FIX RICHIESTO:** Aggiungere le implementazioni:

```typescript
// Da aggiungere dopo la funzione handleRemove (linea ~245)

const toggleJudgeExpanded = (judgeId: string) => {
  setExpandedJudges(prev => {
    const newSet = new Set(prev);
    if (newSet.has(judgeId)) {
      newSet.delete(judgeId);
    } else {
      newSet.add(judgeId);
    }
    return newSet;
  });
};

const openAssistantDialog = (judgeId: string) => {
  setSelectedJudgeId(judgeId);
  setSelectedUserId("");
  setNotes("");
  setAssistantDialogOpen(true);
};

const handleAssignAssistant = async () => {
  if (!selectedUserId || !selectedJudgeId) {
    toast.error("Seleziona un utente");
    return;
  }

  setAssigning(true);
  try {
    const res = await fetch(`${API_URL}/api/staff/judge/${selectedJudgeId}/assistant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: selectedUserId,
        notes,
      }),
    });

    const data = await res.json();

    if (data.success) {
      toast.success("Assistente assegnato con successo");
      setAssistantDialogOpen(false);
      setSelectedUserId("");
      setSelectedJudgeId(null);
      setNotes("");
      fetchData();
    } else {
      toast.error(data.message || "Errore nell'assegnazione");
    }
  } catch (error) {
    toast.error("Errore nell'assegnazione");
  } finally {
    setAssigning(false);
  }
};

const handleRemoveAssistant = async (assistantId: string, assistantName: string) => {
  if (!confirm(`Rimuovere ${assistantName} come assistente?`)) return;

  try {
    const res = await fetch(`${API_URL}/api/staff/assistant/${assistantId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (data.success) {
      toast.success("Assistente rimosso");
      fetchData();
    } else {
      toast.error(data.message || "Errore nella rimozione");
    }
  } catch (error) {
    toast.error("Errore nella rimozione");
  }
};
```

### DEBITO TECNICO

| Issue | Priorita | Descrizione |
|-------|----------|-------------|
| Test mancanti | ALTA | Nessun test unitario per StaffService |
| Test E2E mancanti | ALTA | Nessun test E2E per API assistenti |
| Validazione frontend | MEDIA | Non verifica se utente e gia assistente di altro giudice |
| Traduzioni i18n | BASSA | Testi hardcoded in italiano |
| Cascade delete | MEDIA | Verificare comportamento quando si elimina giudice con assistenti |

---

## ESEMPI DI UTILIZZO

### Assegnare un Assistente via API
```bash
curl -X POST "http://localhost:3001/api/staff/judge/{judgeStaffId}/assistant" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"userId": "{assistantUserId}", "notes": "Assistente per zona A"}'
```

### Query Prisma per Ottenere Gerarchia
```typescript
const judgesWithAssistants = await prisma.tournamentStaff.findMany({
  where: { tournamentId, role: 'JUDGE' },
  include: {
    user: true,
    assistants: {
      where: { role: 'JUDGE_ASSISTANT' },
      include: { user: true }
    }
  }
});
```

### Migrazione Database
```bash
cd D:/Dev/TournamentMaster/backend
npx prisma generate
npx prisma db push
```

---

## RIFERIMENTI FILE

| File | Tipo | Linee Chiave |
|------|------|--------------|
| `backend/prisma/schema.prisma` | Schema | 76-82 (enum), 569-594 (model), 130 (User relation) |
| `backend/src/services/staff.service.ts` | Service | 302-500 (nuovi metodi) |
| `backend/src/routes/staff.routes.ts` | Routes | 389-613 (nuovi endpoint) |
| `frontend/.../staff/page.tsx` | Component | 67-97 (interface), 483-688 (UI) |

---

**Firma:** Claude Code Session 2026-01-11
**Prossima Revisione:** Prima del deploy in produzione
