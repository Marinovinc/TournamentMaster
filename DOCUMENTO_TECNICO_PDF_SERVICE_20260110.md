# DOCUMENTO TECNICO - PDF Service TournamentMaster

**Data:** 2026-01-10
**Versione:** 1.0.0
**Autore:** Claude Code (Opus 4.5)

---

## INDICE

1. [Architettura PDF Service](#1-architettura-pdf-service)
2. [Database Schema Rilevante](#2-database-schema-rilevante)
3. [Metodi Principali](#3-metodi-principali)
4. [Flusso Dati Dettagliato](#4-flusso-dati-dettagliato)
5. [Interfacce TypeScript](#5-interfacce-typescript)
6. [Query Prisma](#6-query-prisma)
7. [Mapping Dati](#7-mapping-dati)
8. [Endpoint API](#8-endpoint-api)
9. [Dipendenze](#9-dipendenze)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. ARCHITETTURA PDF SERVICE

### File Principale
```
D:\Dev\TournamentMaster\backend\src\services\pdf.service.ts
```

### Struttura Classe
```typescript
export class PDFService {
  // Helper privati
  private static async fetchImageBuffer(url: string): Promise<Buffer | null>

  // PDF Assegnazioni Giudici
  static async generateJudgeAssignmentsPDF(tournamentId: string, _tenantId?: string): Promise<Buffer>
  static async generatePublicJudgeAssignmentsPDF(tournamentId: string): Promise<Buffer>
  private static buildJudgeAssignmentsPDF(...): Promise<Buffer>
  private static drawHeader(doc, tournament, primaryColor, logoBuffer): void
  private static drawAssignmentsTable(doc, assignments, primaryColor): void
  private static drawFooter(doc, organizerName, tournament): void

  // PDF Leaderboard/Classifica
  static async generateLeaderboardPDF(tournamentId: string, _tenantId?: string): Promise<Buffer>
  static async generatePublicLeaderboardPDF(tournamentId: string): Promise<Buffer>  // <-- FOCUS SESSIONE
  private static buildLeaderboardPDF(...): Promise<Buffer>
  private static drawLeaderboardHeader(doc, tournament, primaryColor, title, logoBuffer): void
  private static drawLeaderboardTable(doc, leaderboard, catchDetails, primaryColor): void
  private static drawCatchesTable(doc, catches, primaryColor): void
  private static drawLeaderboardFooter(doc, organizerName, tournament): void

  // Test
  static async generateTestPDF(): Promise<Buffer>
}
```

---

## 2. DATABASE SCHEMA RILEVANTE

### 2.1 Tabella: tournaments
```prisma
model Tournament {
  id            String   @id @default(uuid())
  name          String
  status        TournamentStatus  // DRAFT, REGISTRATION_OPEN, REGISTRATION_CLOSED, IN_PROGRESS, COMPLETED, CANCELLED
  discipline    String
  location      String
  startDate     DateTime
  endDate       DateTime
  tenantId      String
  organizerId   String
  // ... altri campi
}
```
**File:** `backend/prisma/schema.prisma:150-220`

### 2.2 Tabella: teams
```prisma
model Team {
  id            String   @id @default(uuid())
  name          String           // Nome squadra (es. "FischinDream")
  boatName      String           // Nome barca (es. "Dream Catcher")
  boatNumber    Int?             // Numero barca
  clubName      String?          // Societa di appartenenza
  captainId     String           // FK -> User (capitano)
  tournamentId  String           // FK -> Tournament
  inspectorId   String?          // FK -> User (giudice assegnato)
  inspectorName String?
  inspectorClub String?
  // Relazioni
  captain       User     @relation("TeamCaptain", fields: [captainId], references: [id])
  members       TeamMember[]
  strikes       Strike[]
  catches       Catch[]
}
```
**File:** `backend/prisma/schema.prisma:280-320`

### 2.3 Tabella: team_members
```prisma
model TeamMember {
  id         String   @id @default(uuid())
  teamId     String           // FK -> Team
  userId     String?          // FK -> User (null se esterno)
  role       TeamRole         // CAPTAIN, ANGLER, CREW
  isExternal Boolean @default(false)
  // Relazioni
  team       Team     @relation(fields: [teamId], references: [id])
  user       User?    @relation(fields: [userId], references: [id])
}
```
**File:** `backend/prisma/schema.prisma:322-340`

### 2.4 Tabella: catches
```prisma
model Catch {
  id            String   @id @default(uuid())
  tournamentId  String
  teamId        String?
  userId        String           // Chi ha pescato
  weight        Decimal  @db.Decimal(8, 3)   // Peso in kg
  length        Decimal? @db.Decimal(6, 2)   // Lunghezza in cm
  rodNumber     Int?             // Numero canna (1-6) <-- AGGIUNTO SESSIONE PRECEDENTE
  caughtAt      DateTime
  status        CatchStatus      // PENDING, APPROVED, REJECTED
  speciesId     String?
  // Relazioni
  tournament    Tournament @relation(fields: [tournamentId], references: [id])
  user          User       @relation(fields: [userId], references: [id])
  species       Species?   @relation(fields: [speciesId], references: [id])
}
```
**File:** `backend/prisma/schema.prisma:400-440`

### 2.5 Tabella: leaderboard_entries
```prisma
model LeaderboardEntry {
  id              String   @id @default(uuid())
  tournamentId    String
  rank            Int
  participantName String?
  teamName        String?
  catchCount      Int      @default(0)
  totalWeight     Decimal  @db.Decimal(10, 3)
  biggestCatch    Decimal? @db.Decimal(8, 3)
  totalPoints     Decimal  @db.Decimal(12, 2)
  // Relazioni
  tournament      Tournament @relation(fields: [tournamentId], references: [id])
}
```
**File:** `backend/prisma/schema.prisma:500-520`

---

## 3. METODI PRINCIPALI

### 3.1 generatePublicLeaderboardPDF (FOCUS SESSIONE)

**Posizione:** `pdf.service.ts:1153-1282`

**Scopo:** Genera PDF classifica per tornei COMPLETED accessibile pubblicamente (no auth).

**Flusso decisionale:**
```
1. Recupera tournament con tenant e organizer
2. Verifica status === "COMPLETED"
3. Recupera leaderboardEntries
4. SE leaderboardEntries.length > 0:
   -> Usa percorso LeaderboardEntry (linee 1183-1275)
   ALTRIMENTI:
   -> Fallback a generateLeaderboardPDF (linea 1281)
```

**IMPORTANTE:** La maggior parte dei tornei COMPLETED avra LeaderboardEntry, quindi il percorso principale e quello con LeaderboardEntry.

### 3.2 generateLeaderboardPDF

**Posizione:** `pdf.service.ts:632-853`

**Scopo:** Genera PDF classifica usando Team/TeamMember/Catch direttamente.

**Usato quando:**
- Accesso autenticato con tenantId
- Fallback per tornei senza LeaderboardEntry

### 3.3 buildLeaderboardPDF

**Posizione:** `pdf.service.ts:858-899`

**Scopo:** Costruisce il documento PDF usando PDFKit.

**Struttura PDF:**
1. Pagina 1: Classifica squadre
2. Pagina 2+: Dettaglio catture (se presenti)

### 3.4 drawCatchesTable

**Posizione:** `pdf.service.ts:1065-1137`

**Scopo:** Disegna la tabella "DETTAGLIO CATTURE"

**Colonne (dopo fix):**
| Header | Width | Campo |
|--------|-------|-------|
| Pos | 28px | rank (index + 1) |
| Squadra | 100px | teamName |
| Barca | 85px | boatName |
| Angler | 95px | anglerName |
| Canna | 38px | rodNumber |
| Specie | 80px | speciesName |
| Peso | 45px | weight |
| Lung. | 42px | length |
| Ora | 42px | caughtAt (HH:mm) |
| Punti | 50px | points |

---

## 4. FLUSSO DATI DETTAGLIATO

### 4.1 Endpoint chiamato
```
GET /api/reports/public/pdf/leaderboard/:tournamentId
```

### 4.2 Route Handler
**File:** `backend/src/routes/report.routes.ts` (presumibilmente)
```typescript
router.get('/public/pdf/leaderboard/:tournamentId', async (req, res) => {
  const pdf = await PDFService.generatePublicLeaderboardPDF(req.params.tournamentId);
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});
```

### 4.3 Flusso in generatePublicLeaderboardPDF

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Query Tournament                                              │
│    prisma.tournament.findUnique({                               │
│      where: { id: tournamentId },                               │
│      include: { tenant, organizer }                             │
│    })                                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Verifica status === "COMPLETED"                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Query LeaderboardEntry                                        │
│    prisma.leaderboardEntry.findMany({                           │
│      where: { tournamentId },                                   │
│      orderBy: { rank: "asc" }                                   │
│    })                                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ leaderboardEntries.length > 0 │
              └───────────────────────────────┘
                    │               │
                   YES              NO
                    │               │
                    ▼               ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│ Percorso LeaderboardEntry│  │ Fallback Teams          │
│ (linee 1183-1275)       │  │ generateLeaderboardPDF()│
└─────────────────────────┘  └─────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Query Catches (con rodNumber)                                │
│    prisma.catch.findMany({                                      │
│      where: { tournamentId, status: "APPROVED" },               │
│      select: { id, weight, length, rodNumber, caughtAt,         │
│               userId, species, user }                           │
│    })                                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Query Teams                                                   │
│    prisma.team.findMany({                                       │
│      where: { tournamentId },                                   │
│      select: { id, name, boatName, captainId }                  │
│    })                                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Query TeamMembers                                             │
│    prisma.teamMember.findMany({                                 │
│      where: { team: { tournamentId } },                         │
│      select: { userId, teamId }                                 │
│    })                                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Costruzione Mappe                                            │
│    userToTeamMap: userId -> teamId                              │
│    teamIdToName: teamId -> teamName                             │
│    teamIdToBoatName: teamId -> boatName                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Costruzione catchDetails[]                                    │
│    Per ogni catch:                                              │
│    - teamId = userToTeamMap.get(catch.userId)                   │
│    - teamName = teamIdToName.get(teamId)                        │
│    - boatName = teamIdToBoatName.get(teamId)                    │
│    - anglerName = user.firstName + user.lastName                │
│    - rodNumber = catch.rodNumber                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. buildLeaderboardPDF()                                        │
│    -> drawLeaderboardHeader()                                   │
│    -> drawLeaderboardTable()                                    │
│    -> drawCatchesTable()  <-- Qui vengono usati i catchDetails  │
│    -> drawLeaderboardFooter()                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. INTERFACCE TYPESCRIPT

### 5.1 CatchDetail (locale in generateLeaderboardPDF)
```typescript
interface CatchDetail {
  rank: number;
  teamName: string;
  boatName: string;      // Nome barca
  anglerName: string;    // Nome pescatore
  rodNumber: number | null;  // Numero canna
  speciesName: string;
  weight: number;
  length: number | null;
  caughtAt: Date;
  points: number;
}
```
**Posizione:** `pdf.service.ts:733-745`

### 5.2 LeaderboardRow (locale)
```typescript
interface LeaderboardRow {
  rank: number;
  teamName: string;
  boatName: string;
  boatNumber: number | null;
  captainName: string;
  clubName: string | null;
  catchCount: number;
  releasedCount: number;
  lostCount: number;
  totalWeight: number;
  biggestCatch: number | null;
  totalPoints: number;
}
```
**Posizione:** `pdf.service.ts:718-731`

### 5.3 JudgeAssignment (export)
```typescript
export interface JudgeAssignment {
  judgeName: string;
  judgePhone: string | null;
  judgeClub: string | null;
  teamName: string;
  boatName: string;
  boatNumber: number | null;
  captainName: string;
  captainPhone: string | null;
  teamClub: string | null;
}
```
**Posizione:** `pdf.service.ts:19-29`

### 5.4 TournamentPDFData (export)
```typescript
export interface TournamentPDFData {
  id: string;
  name: string;
  discipline: string;
  location: string;
  startDate: Date;
  endDate: Date;
  tenantName: string;
  tenantLogo: string | null;
}
```
**Posizione:** `pdf.service.ts:31-40`

---

## 6. QUERY PRISMA

### 6.1 Query Catches con rodNumber
```typescript
const catches = await prisma.catch.findMany({
  where: { tournamentId, status: "APPROVED" },
  select: {
    id: true,
    weight: true,
    length: true,
    rodNumber: true,  // Campo aggiunto
    caughtAt: true,
    userId: true,
    species: { select: { commonNameIt: true, pointsMultiplier: true } },
    user: { select: { id: true, firstName: true, lastName: true } },
  },
  orderBy: { weight: "desc" },
});
```
**Posizione:** `pdf.service.ts:1199-1212`

### 6.2 Query Teams
```typescript
const teams = await prisma.team.findMany({
  where: { tournamentId },
  select: { id: true, name: true, boatName: true, captainId: true },
});
```
**Posizione:** `pdf.service.ts:1215-1218`

### 6.3 Query TeamMembers
```typescript
const teamMembers = await prisma.teamMember.findMany({
  where: { team: { tournamentId } },
  select: { userId: true, teamId: true },
});
```
**Posizione:** `pdf.service.ts:1220-1223`

---

## 7. MAPPING DATI

### 7.1 userToTeamMap
**Scopo:** Mappa userId -> teamId

**Costruzione:**
```typescript
const userToTeamMap = new Map<string, string>();

// 1. Aggiungi membri team (non capitani)
teamMembers.forEach((m) => {
  if (m.userId) userToTeamMap.set(m.userId, m.teamId);
});

// 2. Aggiungi capitani (sovrascrive se gia presente)
teams.forEach((t) => userToTeamMap.set(t.captainId, t.id));
```
**Posizione:** `pdf.service.ts:1226-1230`

**NOTA:** I capitani vengono aggiunti dopo i membri per garantire che il captainId sia sempre mappato correttamente al suo team.

### 7.2 teamIdToName
**Scopo:** Mappa teamId -> nome squadra

```typescript
const teamIdToName = new Map<string, string>();
teams.forEach((t) => {
  teamIdToName.set(t.id, t.name);
});
```
**Posizione:** `pdf.service.ts:1232-1235`

### 7.3 teamIdToBoatName
**Scopo:** Mappa teamId -> nome barca

```typescript
const teamIdToBoatName = new Map<string, string>();
teams.forEach((t) => {
  if (t.boatName) teamIdToBoatName.set(t.id, t.boatName);
});
```
**Posizione:** `pdf.service.ts:1233, 1236-1237`

---

## 8. ENDPOINT API

### 8.1 PDF Leaderboard Pubblico
```
GET /api/reports/public/pdf/leaderboard/:tournamentId
```
- **Auth:** Nessuna (pubblico)
- **Requisiti:** Tournament deve essere COMPLETED
- **Response:** application/pdf
- **Metodo:** `PDFService.generatePublicLeaderboardPDF()`

### 8.2 PDF Leaderboard Autenticato
```
GET /api/reports/pdf/leaderboard/:tournamentId
```
- **Auth:** JWT required
- **Requisiti:** Utente deve avere accesso al tenant
- **Response:** application/pdf
- **Metodo:** `PDFService.generateLeaderboardPDF()`

### 8.3 PDF Assegnazioni Giudici Pubblico
```
GET /api/reports/public/pdf/judge-assignments/:tournamentId
```
- **Auth:** Nessuna
- **Response:** application/pdf
- **Metodo:** `PDFService.generatePublicJudgeAssignmentsPDF()`

---

## 9. DIPENDENZE

### 9.1 NPM Packages
```json
{
  "pdfkit": "^0.13.0",        // Generazione PDF
  "@prisma/client": "^5.x",   // ORM Database
}
```

### 9.2 Import nel file
```typescript
import PDFDocument from "pdfkit";
import prisma from "../lib/prisma";
import { TournamentStaffRole } from "@prisma/client";
```

### 9.3 File Correlati
| File | Relazione |
|------|-----------|
| `backend/prisma/schema.prisma` | Schema database |
| `backend/src/lib/prisma.ts` | Client Prisma singleton |
| `backend/src/routes/report.routes.ts` | Route definitions |
| `backend/src/services/homologation.service.ts` | Servizio correlato (fix enum) |

---

## 10. TROUBLESHOOTING

### 10.1 Problema: Nome angler invece di nome team
**Causa:** Usando percorso LeaderboardEntry senza mapping teams
**Soluzione:** Aggiungere query teams/teamMembers e costruire mappe

### 10.2 Problema: Colonne mancanti (Barca, Canna)
**Causa:** Interface CatchDetail incompleta
**Soluzione:** Aggiungere campi boatName, rodNumber a CatchDetail e mapping

### 10.3 Problema: Backend non compila (enum errors)
**Causa:** Valori enum obsoleti in homologation.service.ts
**Soluzione:** Aggiornare ai valori corretti dello schema Prisma

### 10.4 Problema: rodNumber sempre null
**Causa:** Campo non incluso nella select Prisma
**Soluzione:** Aggiungere `rodNumber: true` alla select della query catches

### 10.5 Problema: Backend porta gia in uso (EADDRINUSE)
**Causa:** Processo precedente non terminato
**Soluzione:**
```powershell
# Trova PID
netstat -ano | findstr ":3001"
# Termina processo
Stop-Process -Id <PID> -Force
```

---

## APPENDICE: Codice Completo Fix

### generatePublicLeaderboardPDF (sezione catchDetails)
```typescript
// pdf.service.ts:1198-1260

// Recupera catture per dettaglio
const catches = await prisma.catch.findMany({
  where: { tournamentId, status: "APPROVED" },
  select: {
    id: true,
    weight: true,
    length: true,
    rodNumber: true,
    caughtAt: true,
    userId: true,
    species: { select: { commonNameIt: true, pointsMultiplier: true } },
    user: { select: { id: true, firstName: true, lastName: true } },
  },
  orderBy: { weight: "desc" },
});

// Recupera teams e membri per mappatura corretta
const teams = await prisma.team.findMany({
  where: { tournamentId },
  select: { id: true, name: true, boatName: true, captainId: true },
});

const teamMembers = await prisma.teamMember.findMany({
  where: { team: { tournamentId } },
  select: { userId: true, teamId: true },
});

// Costruisci mappe userId -> teamId e teamId -> nome/barca
const userToTeamMap = new Map<string, string>();
teamMembers.forEach((m) => {
  if (m.userId) userToTeamMap.set(m.userId, m.teamId);
});
teams.forEach((t) => userToTeamMap.set(t.captainId, t.id));

const teamIdToName = new Map<string, string>();
const teamIdToBoatName = new Map<string, string>();
teams.forEach((t) => {
  teamIdToName.set(t.id, t.name);
  if (t.boatName) teamIdToBoatName.set(t.id, t.boatName);
});

const catchDetails = catches.map((c, index) => {
  const teamId = userToTeamMap.get(c.userId);
  const userName = `${c.user.firstName} ${c.user.lastName}`;
  let teamName = userName;
  let boatName = "-";
  if (teamId && teamIdToName.has(teamId)) {
    teamName = teamIdToName.get(teamId)!;
    boatName = teamIdToBoatName.get(teamId) || "-";
  }
  return {
    rank: index + 1,
    teamName,
    boatName,
    anglerName: userName,
    rodNumber: c.rodNumber,
    speciesName: c.species?.commonNameIt || "Sconosciuta",
    weight: Number(c.weight),
    length: c.length ? Number(c.length) : null,
    caughtAt: c.caughtAt,
    points: Number(c.weight) * (c.species?.pointsMultiplier ? Number(c.species.pointsMultiplier) : 1) * 100,
  };
});
```

---

*Documento generato il 2026-01-10 da Claude Code (Opus 4.5)*
