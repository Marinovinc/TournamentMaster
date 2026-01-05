# Documentazione Tecnica - Delete Team Feature

**Data:** 2026-01-05
**Versione:** 1.0.0
**Autore:** Claude Code (Opus 4.5)
**Progetto:** TournamentMaster

---

## Indice

1. [Panoramica Feature](#panoramica-feature)
2. [Architettura](#architettura)
3. [Database Schema](#database-schema)
4. [Backend API](#backend-api)
5. [Frontend Components](#frontend-components)
6. [Flusso Completo](#flusso-completo)
7. [File di Riferimento](#file-di-riferimento)
8. [Testing](#testing)
9. [Fix REGISTRATION_OPEN](#fix-registration_open)

---

## Panoramica Feature

La feature "Delete Team" permette agli utenti autorizzati (Admin, Organizer) di eliminare una barca/team da un torneo.

### Comportamento Atteso

1. Utente clicca dropdown menu sulla riga team
2. Seleziona "Elimina Barca"
3. Appare dialog di conferma
4. Conferma elimina team + membri equipaggio (cascade)
5. Toast di conferma + refresh lista

---

## Architettura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DELETE TEAM FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         FRONTEND (Next.js)                           │   │
│  │                         Porta: 3000                                  │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │ teams/page.tsx                                               │    │   │
│  │  │                                                               │    │   │
│  │  │  State:                                                       │    │   │
│  │  │  - deleteDialogOpen: boolean                                  │    │   │
│  │  │  - teamToDelete: string | null                                │    │   │
│  │  │  - isDeleting: boolean                                        │    │   │
│  │  │                                                               │    │   │
│  │  │  Methods:                                                     │    │   │
│  │  │  - handleDeleteTeam(teamId: string)                          │    │   │
│  │  │                                                               │    │   │
│  │  │  Components:                                                  │    │   │
│  │  │  - DropdownMenuItem "Elimina Barca"                          │    │   │
│  │  │  - AlertDialog (conferma eliminazione)                        │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                              │                                        │   │
│  │                              │ DELETE /api/teams/:id                  │   │
│  │                              ▼                                        │   │
│  └──────────────────────────────┼────────────────────────────────────────┘   │
│                                 │                                            │
│  ┌──────────────────────────────┼────────────────────────────────────────┐   │
│  │                         BACKEND (Express)                             │   │
│  │                         Porta: 3001                                   │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │ team.routes.ts                                               │    │   │
│  │  │                                                               │    │   │
│  │  │  DELETE /teams/:id                                            │    │   │
│  │  │  - Middleware: authenticate                                   │    │   │
│  │  │  - Verifica permessi utente                                   │    │   │
│  │  │  - Chiama TeamService.deleteTeam()                           │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                              │                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │ team.service.ts                                              │    │   │
│  │  │                                                               │    │   │
│  │  │  deleteTeam(teamId: string)                                  │    │   │
│  │  │  - prisma.team.delete({ where: { id } })                     │    │   │
│  │  │  - Cascade: elimina TeamMembers automaticamente              │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                              │                                        │   │
│  └──────────────────────────────┼────────────────────────────────────────┘   │
│                                 │                                            │
│  ┌──────────────────────────────┼────────────────────────────────────────┐   │
│  │                         DATABASE (MySQL)                              │   │
│  │                         Porta: 3306                                   │   │
│  │                                                                       │   │
│  │  Team ──────────< TeamMember                                         │   │
│  │    │                  │                                               │   │
│  │    │  onDelete:       │  onDelete:                                   │   │
│  │    │  Cascade         │  Cascade                                     │   │
│  │    ▼                  ▼                                               │   │
│  │  [DELETED]        [DELETED]                                          │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tabella: Team

```prisma
// backend/prisma/schema.prisma

model Team {
  id                    String       @id @default(uuid())
  name                  String
  boatNumber            String?
  boatName              String?

  // Relazioni
  tournamentId          String
  tournament            Tournament   @relation(fields: [tournamentId], references: [id])

  captainId             String?
  captain               User?        @relation("TeamCaptain", fields: [captainId], references: [id])

  inspectorId           String?
  inspector             User?        @relation("TeamInspector", fields: [inspectorId], references: [id])

  clubId                String?
  club                  Club?        @relation(fields: [clubId], references: [id])

  // Membri equipaggio (CASCADE DELETE)
  members               TeamMember[]

  // Representing club (v1.1.0)
  representingClubName  String?
  representingClubCode  String?

  // Timestamps
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  @@map("teams")
}
```

### Tabella: TeamMember

```prisma
model TeamMember {
  id            String    @id @default(uuid())

  teamId        String
  team          Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)

  userId        String?
  user          User?     @relation(fields: [userId], references: [id])

  role          CrewRole  @default(CREW)

  // Campi per membri esterni (v1.1.0)
  isExternal    Boolean   @default(false)
  externalName  String?
  externalPhone String?
  externalEmail String?

  createdAt     DateTime  @default(now())

  @@unique([teamId, userId])
  @@map("team_members")
}
```

### Enum: CrewRole

```prisma
enum CrewRole {
  SKIPPER      // Conduttore barca (puo essere esterno)
  TEAM_LEADER  // Capoequipaggio
  CREW         // Membro equipaggio
  ANGLER       // Pescatore
  GUEST        // Ospite (puo essere esterno)
}
```

---

## Backend API

### Endpoint: DELETE /api/teams/:id

**File:** `backend/src/routes/tournament/team.routes.ts`

**Linea:** ~180-210

```typescript
// DELETE /teams/:id - Elimina team
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // 1. Verifica che il team esista
    const team = await prisma.team.findUnique({
      where: { id },
      include: { tournament: true }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Team non trovato"
      });
    }

    // 2. Verifica permessi (solo admin/organizer del torneo)
    const hasPermission = await checkTeamPermission(userId, team.tournamentId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: "Non autorizzato a eliminare questo team"
      });
    }

    // 3. Elimina team (cascade elimina TeamMembers)
    await prisma.team.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: "Team eliminato con successo"
    });

  } catch (error) {
    console.error("Errore eliminazione team:", error);
    return res.status(500).json({
      success: false,
      error: "Errore durante l'eliminazione del team"
    });
  }
});
```

### Autenticazione

**File:** `backend/src/middleware/auth.middleware.ts`

Il middleware `authenticate` verifica:
1. Presenza header `Authorization: Bearer <token>`
2. Validita token JWT
3. Aggiunge `req.user` con `userId`, `tenantId`, `roles`

---

## Frontend Components

### Page: teams/page.tsx

**File:** `frontend/src/app/[locale]/dashboard/tournaments/[id]/teams/page.tsx`

#### State Variables

```typescript
// Linee ~50-60
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
const [isDeleting, setIsDeleting] = useState(false);
```

#### Handler: handleDeleteTeam

```typescript
// Linee ~150-180
const handleDeleteTeam = async (teamId: string) => {
  if (!teamId) return;

  setIsDeleting(true);
  try {
    const response = await fetch(`${API_URL}/api/teams/${teamId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Errore durante l'eliminazione");
    }

    toast({
      title: "Team eliminato",
      description: "Il team e stato eliminato con successo",
    });

    // Refresh lista team
    fetchTeams();

  } catch (error) {
    toast({
      title: "Errore",
      description: "Impossibile eliminare il team",
      variant: "destructive",
    });
  } finally {
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setTeamToDelete(null);
  }
};
```

#### DropdownMenuItem "Elimina Barca"

```tsx
// Nel rendering della tabella, colonna actions
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    {/* ... altri menu items ... */}
    <DropdownMenuSeparator />
    <DropdownMenuItem
      className="text-red-600 focus:text-red-600"
      onClick={() => {
        setTeamToDelete(team.id);
        setDeleteDialogOpen(true);
      }}
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Elimina Barca
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### AlertDialog Conferma

```tsx
// Fine del componente, prima di </div> finale
<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
      <AlertDialogDescription>
        Questa azione eliminera definitivamente il team e tutti i membri
        dell'equipaggio associati. L'operazione non puo essere annullata.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annulla</AlertDialogCancel>
      <AlertDialogAction
        className="bg-red-600 hover:bg-red-700"
        onClick={() => teamToDelete && handleDeleteTeam(teamToDelete)}
        disabled={isDeleting}
      >
        {isDeleting ? "Eliminazione..." : "Elimina"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Flusso Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SEQUENZA DELETE TEAM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. UTENTE                                                                   │
│     └── Clicca "..." sul team nella tabella                                 │
│                                                                              │
│  2. FRONTEND (teams/page.tsx)                                               │
│     └── Mostra DropdownMenu                                                 │
│     └── Utente clicca "Elimina Barca"                                       │
│     └── setTeamToDelete(team.id)                                            │
│     └── setDeleteDialogOpen(true)                                           │
│                                                                              │
│  3. FRONTEND (AlertDialog)                                                  │
│     └── Mostra dialog conferma                                              │
│     └── Utente clicca "Elimina"                                             │
│     └── handleDeleteTeam(teamToDelete)                                      │
│                                                                              │
│  4. FRONTEND -> BACKEND                                                     │
│     └── fetch DELETE http://localhost:3001/api/teams/{id}                   │
│     └── Headers: Authorization: Bearer {token}                              │
│                                                                              │
│  5. BACKEND (team.routes.ts)                                                │
│     └── authenticate middleware verifica token                              │
│     └── Verifica team esiste                                                │
│     └── Verifica permessi utente                                            │
│     └── prisma.team.delete({ where: { id } })                               │
│                                                                              │
│  6. DATABASE (Prisma + MySQL)                                               │
│     └── DELETE FROM teams WHERE id = ?                                      │
│     └── CASCADE: DELETE FROM team_members WHERE teamId = ?                  │
│                                                                              │
│  7. BACKEND -> FRONTEND                                                     │
│     └── Response: { success: true, message: "Team eliminato" }              │
│                                                                              │
│  8. FRONTEND                                                                │
│     └── toast({ title: "Team eliminato" })                                  │
│     └── fetchTeams() - refresh lista                                        │
│     └── setDeleteDialogOpen(false)                                          │
│                                                                              │
│  9. UTENTE                                                                  │
│     └── Vede toast conferma                                                 │
│     └── Team scompare dalla lista                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File di Riferimento

| File | Percorso | Descrizione |
|------|----------|-------------|
| **teams page** | `frontend/src/app/[locale]/dashboard/tournaments/[id]/teams/page.tsx` | Pagina gestione team con delete |
| **team routes** | `backend/src/routes/tournament/team.routes.ts` | API REST team |
| **team service** | `backend/src/services/tournament/team.service.ts` | Business logic team |
| **prisma schema** | `backend/prisma/schema.prisma` | Schema database |
| **TournamentCard** | `frontend/src/components/tournament/TournamentCard.tsx` | Card torneo (fix REGISTRATION_OPEN) |

---

## Testing

### Test Manuale Delete Team

1. Avviare backend: `cd backend && npm run dev`
2. Avviare frontend: `cd frontend && npm run dev`
3. Login come admin
4. Navigare a `/it/dashboard/tournaments/{id}/teams`
5. Cliccare "..." su un team
6. Cliccare "Elimina Barca"
7. Confermare nel dialog
8. Verificare toast "Team eliminato"
9. Verificare team rimosso dalla lista

### Test Playwright (Automatico)

```python
# test_delete_team.py
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Login
    page.goto("http://localhost:3000/it/login")
    page.fill("input[name='email']", "marino@unitec.it")
    page.fill("input[name='password']", "Gerstofen22")
    page.click("button[type='submit']")
    page.wait_for_url("**/dashboard**")

    # Naviga a teams
    page.goto("http://localhost:3000/it/dashboard/tournaments/{id}/teams")
    page.wait_for_load_state("networkidle")

    # Apri dropdown
    page.click("button:has-text('...')")

    # Verifica "Elimina Barca" presente
    assert page.locator("text=Elimina Barca").is_visible()

    # Screenshot
    page.screenshot(path="delete_team_dropdown.png")

    browser.close()
```

---

## Fix REGISTRATION_OPEN

### Problema

TournamentCard.tsx crashava con:
```
Cannot read properties of undefined (reading 'variant')
```

### Causa Root

Il database conteneva tornei con status `REGISTRATION_OPEN`, ma `statusConfig` nel frontend non lo mappava.

**Status presenti nel database:**
- `DRAFT`
- `PUBLISHED`
- `REGISTRATION_OPEN` <- MANCANTE nel frontend
- `ONGOING`
- `COMPLETED`
- `CANCELLED`

### Fix Applicato

**File:** `frontend/src/components/tournament/TournamentCard.tsx`

**Linea 44 - Type definition:**
```typescript
status: "DRAFT" | "PUBLISHED" | "REGISTRATION_OPEN" | "ONGOING" | "COMPLETED" | "CANCELLED";
```

**Linea 75 - statusConfig:**
```typescript
REGISTRATION_OPEN: { label: "Iscrizioni Aperte", variant: "default" },
```

**Linea 93 - Fallback safety:**
```typescript
const status = statusConfig[tournament.status] || {
  label: tournament.status || "N/A",
  variant: "secondary" as const
};
```

---

## Dipendenze

### Frontend

| Package | Versione | Uso |
|---------|----------|-----|
| next | 16.1.1 | Framework React |
| @radix-ui/react-alert-dialog | latest | Dialog conferma |
| @radix-ui/react-dropdown-menu | latest | Menu azioni |
| lucide-react | latest | Icone (Trash2, MoreHorizontal) |
| sonner | latest | Toast notifications |

### Backend

| Package | Versione | Uso |
|---------|----------|-----|
| express | 4.x | Web server |
| @prisma/client | 5.x | ORM database |
| jsonwebtoken | latest | Autenticazione |

---

## URL di Riferimento

| Risorsa | URL |
|---------|-----|
| Frontend locale | http://localhost:3000 |
| Backend locale | http://localhost:3001 |
| API Teams | http://localhost:3001/api/teams |
| GitHub | https://github.com/Marinovinc/TournamentMaster |
| Teams page | http://localhost:3000/it/dashboard/tournaments/{id}/teams |

---

## Commit Correlati

| Hash | Messaggio | Data |
|------|-----------|------|
| `456da9d` | feat(teams): Add delete team, create team with captain selection | 2026-01-05 |
| `a61bbd3` | fix(tournaments): Add REGISTRATION_OPEN status to TournamentCard | 2026-01-05 |

---

**Documento generato da:** Claude Code (Opus 4.5)
**Timestamp:** 2026-01-05T18:35:00+01:00
