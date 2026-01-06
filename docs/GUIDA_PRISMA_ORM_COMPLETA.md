# Guida Completa a Prisma ORM

**Versione Documento:** 1.0.0
**Data:** 2026-01-05
**Progetto:** TournamentMaster
**Versione Prisma:** 5.22.0 (disponibile 7.2.0)

---

## Indice

1. [Cos'e Prisma](#cose-prisma)
2. [Architettura e Componenti](#architettura-e-componenti)
3. [Installazione e Setup](#installazione-e-setup)
4. [Schema Prisma](#schema-prisma)
5. [Prisma Client - CRUD Operations](#prisma-client---crud-operations)
6. [Query Avanzate](#query-avanzate)
7. [Relazioni](#relazioni)
8. [Migrazioni](#migrazioni)
9. [Prisma Studio](#prisma-studio)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)
12. [Esempi dal Progetto TournamentMaster](#esempi-dal-progetto-tournamentmaster)

---

## Cos'e Prisma

**Prisma** e un **ORM (Object-Relational Mapping)** di nuova generazione per Node.js e TypeScript. A differenza degli ORM tradizionali, Prisma adotta un approccio **schema-first** e genera automaticamente un client tipizzato.

### Vantaggi Principali

| Caratteristica | Descrizione |
|----------------|-------------|
| **Type Safety** | Ogni query e completamente tipizzata in TypeScript |
| **Auto-completion** | IntelliSense completo in VS Code |
| **Query Builder** | API fluente e intuitiva |
| **Migrazioni** | Sistema di migrazioni automatico |
| **Performance** | Query ottimizzate con batching automatico |
| **Multi-database** | Supporta PostgreSQL, MySQL, MariaDB, SQLite, SQL Server, MongoDB |

### Prisma vs ORM Tradizionali

```
+------------------+-------------------+--------------------+
|   Caratteristica |  ORM Tradizionale |       Prisma       |
+------------------+-------------------+--------------------+
| Definizione      | Code-first        | Schema-first       |
| Tipizzazione     | Manuale/Parziale  | 100% automatica    |
| Query Builder    | Method chaining   | Object-based       |
| Relazioni        | Lazy loading      | Explicit include   |
| Migrazioni       | Manuali           | Auto-generate      |
+------------------+-------------------+--------------------+
```

---

## Architettura e Componenti

Prisma e composto da **tre componenti principali**:

```
                    +-------------------+
                    |  schema.prisma    |  <-- Definizione modelli
                    +-------------------+
                            |
                            v
                    +-------------------+
                    | prisma generate   |  <-- Genera client
                    +-------------------+
                            |
                            v
+-------------------+       |       +-------------------+
|  Prisma Client    |<------+------>|  Prisma Migrate   |
|  (Query Engine)   |               |  (Schema Sync)    |
+-------------------+               +-------------------+
        |                                   |
        v                                   v
+-------------------+               +-------------------+
|    Your App       |               |    Database       |
|   (TypeScript)    |               |  (MySQL, etc.)    |
+-------------------+               +-------------------+
```

### 1. Prisma Schema (`schema.prisma`)

File dichiarativo che definisce:
- **Datasource**: Connessione al database
- **Generator**: Configurazione del client
- **Models**: Tabelle e relazioni

### 2. Prisma Client

Libreria auto-generata che fornisce:
- Query tipizzate
- CRUD operations
- Gestione transazioni
- Raw queries

### 3. Prisma Migrate

Sistema di migrazioni che:
- Genera SQL dalle modifiche allo schema
- Applica migrazioni al database
- Mantiene storico versioni

### 4. Prisma Studio

GUI web per:
- Visualizzare dati
- Modificare record
- Esplorare relazioni

---

## Installazione e Setup

### 1. Installazione Pacchetti

```bash
# Prisma CLI (development)
npm install prisma --save-dev

# Prisma Client (runtime)
npm install @prisma/client
```

### 2. Inizializzazione

```bash
# Crea cartella prisma/ e file schema.prisma
npx prisma init
```

Questo crea:
```
project/
  prisma/
    schema.prisma    # Schema del database
  .env               # Variabili ambiente (DATABASE_URL)
```

### 3. Configurazione .env

```env
# MySQL/MariaDB
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"

# PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# SQLite
DATABASE_URL="file:./dev.db"

# SQL Server
DATABASE_URL="sqlserver://HOST:PORT;database=DATABASE;user=USER;password=PASSWORD"
```

### 4. Generazione Client

```bash
# Dopo ogni modifica a schema.prisma
npx prisma generate
```

---

## Schema Prisma

Il file `schema.prisma` usa la **Prisma Schema Language (PSL)**.

### Struttura Base

```prisma
// Configurazione datasource
datasource db {
  provider = "mysql"              // mysql, postgresql, sqlite, sqlserver, mongodb
  url      = env("DATABASE_URL")  // Legge da .env
}

// Configurazione generator
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "windows"]  // Targets di compilazione
}

// Definizione modelli
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())

  @@map("users")  // Nome tabella nel DB
}
```

### Tipi di Campo

| Tipo Prisma | MySQL | PostgreSQL | Descrizione |
|-------------|-------|------------|-------------|
| `String` | VARCHAR(191) | TEXT | Testo |
| `Int` | INT | INTEGER | Intero |
| `BigInt` | BIGINT | BIGINT | Intero grande |
| `Float` | DOUBLE | DOUBLE PRECISION | Decimale |
| `Decimal` | DECIMAL | DECIMAL | Decimale preciso |
| `Boolean` | TINYINT(1) | BOOLEAN | Booleano |
| `DateTime` | DATETIME(3) | TIMESTAMP | Data/ora |
| `Json` | JSON | JSONB | Dati JSON |
| `Bytes` | LONGBLOB | BYTEA | Binario |

### Attributi Campo

```prisma
model Example {
  // Chiave primaria
  id        String   @id @default(uuid())

  // Unique constraint
  email     String   @unique

  // Valore default
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  // Campo opzionale (nullable)
  bio       String?

  // Tipo database specifico
  content   String   @db.Text
  price     Decimal  @db.Decimal(10, 2)

  // Auto-increment
  number    Int      @default(autoincrement())

  // Aggiornamento automatico
  updatedAt DateTime @updatedAt
}
```

### Attributi Modello

```prisma
model Post {
  id       String @id
  authorId String
  title    String

  // Indice singolo
  @@index([authorId])

  // Indice composto
  @@index([authorId, createdAt])

  // Unique composto
  @@unique([authorId, title])

  // Nome tabella
  @@map("blog_posts")
}
```

### Enum

```prisma
enum UserRole {
  ADMIN
  MODERATOR
  USER
}

model User {
  id   String   @id @default(uuid())
  role UserRole @default(USER)
}
```

---

## Prisma Client - CRUD Operations

### Inizializzazione Client

```typescript
import { PrismaClient } from '@prisma/client';

// Singleton pattern (raccomandato)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],  // Logging opzionale
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### CREATE - Inserimento Dati

```typescript
// Inserimento singolo
const user = await prisma.user.create({
  data: {
    email: 'mario@example.com',
    firstName: 'Mario',
    lastName: 'Rossi',
    role: 'PARTICIPANT',
  },
});

// Inserimento con relazione (nested create)
const team = await prisma.team.create({
  data: {
    name: 'Team Ischia',
    boatName: 'Blue Marlin',
    boatNumber: 42,
    captain: {
      connect: { id: 'user-uuid' },  // Collega utente esistente
    },
    tournament: {
      connect: { id: 'tournament-uuid' },
    },
    members: {
      create: [
        { userId: 'member1-uuid', role: 'CREW' },
        { userId: 'member2-uuid', role: 'ANGLER' },
      ],
    },
  },
  include: {
    captain: true,
    members: true,
  },
});

// Inserimento multiplo
const users = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', firstName: 'User', lastName: 'One' },
    { email: 'user2@example.com', firstName: 'User', lastName: 'Two' },
  ],
  skipDuplicates: true,  // Ignora duplicati
});
```

### READ - Lettura Dati

```typescript
// Trova per ID
const user = await prisma.user.findUnique({
  where: { id: 'user-uuid' },
});

// Trova per campo unique
const user = await prisma.user.findUnique({
  where: { email: 'mario@example.com' },
});

// Trova primo match
const team = await prisma.team.findFirst({
  where: {
    tournamentId: 'tournament-uuid',
    boatNumber: 42,
  },
});

// Trova tutti
const teams = await prisma.team.findMany({
  where: {
    tournamentId: 'tournament-uuid',
  },
  orderBy: {
    boatNumber: 'asc',
  },
  skip: 0,      // Offset (pagination)
  take: 20,     // Limit (pagination)
});

// Con relazioni (include)
const team = await prisma.team.findUnique({
  where: { id: 'team-uuid' },
  include: {
    captain: true,
    members: {
      include: {
        user: true,
      },
    },
    tournament: true,
    strikes: true,
  },
});

// Selezione campi specifici (select)
const teams = await prisma.team.findMany({
  select: {
    id: true,
    name: true,
    boatNumber: true,
    captain: {
      select: {
        firstName: true,
        lastName: true,
      },
    },
  },
});

// Conteggio
const count = await prisma.team.count({
  where: { tournamentId: 'tournament-uuid' },
});
```

### UPDATE - Aggiornamento Dati

```typescript
// Aggiorna singolo
const user = await prisma.user.update({
  where: { id: 'user-uuid' },
  data: {
    firstName: 'Mario',
    lastName: 'Rossi Updated',
  },
});

// Aggiorna o crea (upsert)
const user = await prisma.user.upsert({
  where: { email: 'mario@example.com' },
  update: {
    lastLoginAt: new Date(),
  },
  create: {
    email: 'mario@example.com',
    firstName: 'Mario',
    lastName: 'Rossi',
  },
});

// Aggiorna multipli
const result = await prisma.user.updateMany({
  where: {
    tenantId: 'tenant-uuid',
    isActive: false,
  },
  data: {
    isActive: true,
  },
});
console.log(`Updated ${result.count} users`);

// Operazioni numeriche
await prisma.leaderboardEntry.update({
  where: { id: 'entry-uuid' },
  data: {
    catchCount: { increment: 1 },
    totalPoints: { increment: 100 },
    // Altre operazioni: decrement, multiply, divide
  },
});
```

### DELETE - Eliminazione Dati

```typescript
// Elimina singolo
const deletedTeam = await prisma.team.delete({
  where: { id: 'team-uuid' },
});

// Elimina multipli
const result = await prisma.strike.deleteMany({
  where: {
    teamId: 'team-uuid',
  },
});
console.log(`Deleted ${result.count} strikes`);

// Elimina tutti (ATTENZIONE!)
await prisma.auditLog.deleteMany({});
```

---

## Query Avanzate

### Filtri

```typescript
const teams = await prisma.team.findMany({
  where: {
    // Uguaglianza
    tournamentId: 'tournament-uuid',

    // Diverso da
    boatNumber: { not: 0 },

    // Maggiore/minore
    boatNumber: { gt: 10 },      // >
    boatNumber: { gte: 10 },     // >=
    boatNumber: { lt: 100 },     // <
    boatNumber: { lte: 100 },    // <=

    // Contenuto in lista
    id: { in: ['uuid1', 'uuid2', 'uuid3'] },
    id: { notIn: ['excluded-uuid'] },

    // Pattern matching
    name: { contains: 'Ischia' },
    name: { startsWith: 'Team' },
    name: { endsWith: 'Club' },

    // Case insensitive (MySQL default, PostgreSQL needs mode)
    name: { contains: 'ischia', mode: 'insensitive' },

    // NULL check
    inspectorId: null,           // IS NULL
    inspectorId: { not: null },  // IS NOT NULL

    // AND (implicito)
    tournamentId: 'uuid',
    boatNumber: { gt: 0 },

    // AND (esplicito)
    AND: [
      { tournamentId: 'uuid' },
      { boatNumber: { gt: 0 } },
    ],

    // OR
    OR: [
      { name: { contains: 'Ischia' } },
      { name: { contains: 'Napoli' } },
    ],

    // NOT
    NOT: {
      captainId: 'excluded-user',
    },
  },
});
```

### Filtri su Relazioni

```typescript
// Trova team con almeno uno strike
const teamsWithStrikes = await prisma.team.findMany({
  where: {
    strikes: {
      some: {},  // Almeno un record correlato
    },
  },
});

// Trova team senza strike
const teamsWithoutStrikes = await prisma.team.findMany({
  where: {
    strikes: {
      none: {},  // Nessun record correlato
    },
  },
});

// Trova team dove TUTTI gli strike sono CATCH
const teamsAllCatches = await prisma.team.findMany({
  where: {
    strikes: {
      every: {
        result: 'CATCH',
      },
    },
  },
});

// Filtra su campi relazione
const teams = await prisma.team.findMany({
  where: {
    captain: {
      role: 'PARTICIPANT',
      tenantId: 'tenant-uuid',
    },
    tournament: {
      status: 'ONGOING',
    },
  },
});
```

### Ordinamento

```typescript
const teams = await prisma.team.findMany({
  orderBy: [
    { boatNumber: 'asc' },
    { name: 'desc' },
  ],
});

// Ordinamento su relazione
const teams = await prisma.team.findMany({
  orderBy: {
    captain: {
      lastName: 'asc',
    },
  },
});

// Ordinamento per conteggio relazioni
const teams = await prisma.team.findMany({
  orderBy: {
    strikes: {
      _count: 'desc',
    },
  },
});
```

### Aggregazioni

```typescript
// Count, sum, avg, min, max
const stats = await prisma.catch.aggregate({
  where: { tournamentId: 'tournament-uuid' },
  _count: true,
  _sum: { weight: true, points: true },
  _avg: { weight: true },
  _min: { weight: true },
  _max: { weight: true },
});

// Group by
const catchesByStatus = await prisma.catch.groupBy({
  by: ['status'],
  where: { tournamentId: 'tournament-uuid' },
  _count: true,
  _sum: { weight: true },
});
// Risultato: [{ status: 'PENDING', _count: 5, _sum: { weight: 120.5 } }, ...]

// Having (filtro post-aggregazione)
const activeUsers = await prisma.catch.groupBy({
  by: ['userId'],
  _count: { id: true },
  having: {
    id: { _count: { gt: 5 } },  // Solo utenti con >5 catture
  },
});
```

### Raw Queries

```typescript
// Query SQL raw (SELECT)
const users = await prisma.$queryRaw<User[]>`
  SELECT * FROM users WHERE role = ${role}
`;

// Query raw parametrizzata (sicura da SQL injection)
const teams = await prisma.$queryRaw`
  SELECT t.*, COUNT(s.id) as strike_count
  FROM teams t
  LEFT JOIN strikes s ON s.teamId = t.id
  WHERE t.tournamentId = ${tournamentId}
  GROUP BY t.id
  ORDER BY strike_count DESC
`;

// Execute raw (INSERT, UPDATE, DELETE)
const result = await prisma.$executeRaw`
  UPDATE team_members SET role = 'TEAM_LEADER' WHERE role = 'CAPTAIN'
`;
console.log(`Updated ${result} rows`);
```

### Transazioni

```typescript
// Transaction interattiva
const result = await prisma.$transaction(async (tx) => {
  // Tutte le operazioni usano la stessa transazione
  const team = await tx.team.create({
    data: { name: 'New Team', boatName: 'Boat', captainId: 'user-uuid', tournamentId: 'tournament-uuid' },
  });

  await tx.teamMember.create({
    data: { teamId: team.id, userId: 'user-uuid', role: 'TEAM_LEADER' },
  });

  await tx.auditLog.create({
    data: { action: 'CREATE_TEAM', entityType: 'Team', entityId: team.id },
  });

  return team;
});

// Batch transaction (array di operazioni)
const [user, team] = await prisma.$transaction([
  prisma.user.create({ data: { email: 'new@example.com', firstName: 'New', lastName: 'User' } }),
  prisma.team.findFirst({ where: { boatNumber: 1 } }),
]);
```

---

## Relazioni

### Tipi di Relazioni

```prisma
// ONE-TO-MANY: Un User ha molti Post
model User {
  id    String @id @default(uuid())
  posts Post[]
}

model Post {
  id       String @id @default(uuid())
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}

// ONE-TO-ONE: Un User ha un Profile
model User {
  id      String   @id @default(uuid())
  profile Profile?
}

model Profile {
  id     String @id @default(uuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}

// MANY-TO-MANY: Implicita
model Post {
  id         String     @id @default(uuid())
  categories Category[]
}

model Category {
  id    String @id @default(uuid())
  posts Post[]
}

// MANY-TO-MANY: Esplicita (con campi extra)
model Post {
  id       String        @id @default(uuid())
  postTags PostToTag[]
}

model Tag {
  id       String        @id @default(uuid())
  postTags PostToTag[]
}

model PostToTag {
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  tagId     String
  tag       Tag      @relation(fields: [tagId], references: [id])
  createdAt DateTime @default(now())

  @@id([postId, tagId])
}
```

### Self-Relation

```prisma
model Category {
  id       String     @id @default(uuid())
  name     String
  parentId String?
  parent   Category?  @relation("CategoryToCategory", fields: [parentId], references: [id])
  children Category[] @relation("CategoryToCategory")
}
```

### Cascade Delete

```prisma
model Team {
  id      String       @id @default(uuid())
  members TeamMember[]
  strikes Strike[]
}

model TeamMember {
  id     String @id @default(uuid())
  teamId String
  team   Team   @relation(fields: [teamId], references: [id], onDelete: Cascade)
  //                                                        ^^^^^^^^^^^^^^^^
  // Quando il Team viene eliminato, tutti i TeamMember associati vengono eliminati
}
```

---

## Migrazioni

### Workflow Migrazioni

```bash
# 1. Modifica schema.prisma

# 2. Crea migrazione (development)
npx prisma migrate dev --name add_user_avatar

# 3. Applica in produzione
npx prisma migrate deploy
```

### Comandi Migrate

| Comando | Uso | Descrizione |
|---------|-----|-------------|
| `migrate dev` | Development | Crea e applica migrazione, rigenera client |
| `migrate deploy` | Production | Applica migrazioni pendenti |
| `migrate reset` | Development | Reset DB + applica tutte le migrazioni |
| `migrate status` | Entrambi | Mostra stato migrazioni |

### db push (Prototipazione)

```bash
# Sincronizza schema senza creare migrazioni
# Utile per prototipazione rapida
npx prisma db push
```

**Differenza db push vs migrate dev:**
- `db push`: Modifica DB direttamente, nessun file di migrazione
- `migrate dev`: Crea file SQL, tracciabile in git

### Introspection

```bash
# Genera schema.prisma da DB esistente
npx prisma db pull
```

---

## Prisma Studio

```bash
# Avvia GUI web su http://localhost:5555
npx prisma studio
```

Funzionalita:
- Visualizzazione dati tabellare
- Aggiunta/modifica/eliminazione record
- Navigazione relazioni
- Filtri e ordinamento

---

## Best Practices

### 1. Singleton Client

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### 2. Gestione Errori

```typescript
import { Prisma } from '@prisma/client';

try {
  await prisma.user.create({
    data: { email: 'existing@example.com', firstName: 'Test', lastName: 'User' },
  });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      throw new Error('Email already exists');
    }
  }
  throw error;
}
```

### Codici Errore Comuni

| Codice | Descrizione |
|--------|-------------|
| P2002 | Unique constraint failed |
| P2003 | Foreign key constraint failed |
| P2025 | Record not found |
| P2014 | Required relation violation |

### 3. Logging

```typescript
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

### 4. Soft Delete

```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  deletedAt DateTime?

  @@index([deletedAt])
}
```

```typescript
// Middleware per escludere automaticamente record eliminati
prisma.$use(async (params, next) => {
  if (params.model === 'User') {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      };
    }
  }
  return next(params);
});
```

---

## Troubleshooting

### File Locked (Windows)

**Problema:** `query_engine-windows.dll.node` locked

**Soluzione:**
```powershell
# Termina tutti i processi Node.js
taskkill /F /IM node.exe

# Rigenera client
npx prisma generate
```

### Client Non Aggiornato

**Problema:** Tipi non corrispondono allo schema

**Soluzione:**
```bash
npx prisma generate
# Riavvia TypeScript server in VS Code: Ctrl+Shift+P -> "TypeScript: Restart"
```

### Migrazioni Fallite

**Problema:** Migrazione dev fallisce

**Soluzione:**
```bash
# Reset completo (ATTENZIONE: cancella dati!)
npx prisma migrate reset

# Oppure: fix manuale e deploy
npx prisma migrate resolve --applied "nome_migrazione"
```

### Connection Pool Exhausted

**Problema:** "Too many connections"

**Soluzione:**
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=5',
    },
  },
});
```

---

## Esempi dal Progetto TournamentMaster

### Schema Rilevanti

Il progetto TournamentMaster usa questi modelli principali:

| Modello | Descrizione | Relazioni Chiave |
|---------|-------------|------------------|
| `Tenant` | Associazione sportiva | Users, Tournaments |
| `User` | Utente registrato | Teams (captain), TeamMemberships |
| `Tournament` | Torneo di pesca | Teams, Strikes, Staff |
| `Team` | Barca/equipaggio | Captain, Members, Strikes |
| `TeamMember` | Membro equipaggio | Team, User (opzionale) |
| `Strike` | Evento pesca | Team, Tournament |

### Esempio: Creare Team con Equipaggio

```typescript
const team = await prisma.team.create({
  data: {
    name: 'Team Ischia Fishing',
    boatName: 'Blue Marlin',
    boatNumber: 42,
    clubName: 'Ischia Fishing Club',
    captain: { connect: { id: captainUserId } },
    tournament: { connect: { id: tournamentId } },
    members: {
      create: [
        { userId: skipper userId, role: 'SKIPPER' },
        { userId: angler1UserId, role: 'ANGLER' },
        { userId: angler2UserId, role: 'ANGLER' },
        {
          // Membro esterno (non registrato)
          externalName: 'Mario Rossi',
          externalPhone: '+39 333 1234567',
          isExternal: true,
          role: 'GUEST',
        },
      ],
    },
  },
  include: {
    captain: true,
    members: { include: { user: true } },
    tournament: true,
  },
});
```

### Esempio: Eliminare Team (Cascade)

```typescript
// Grazie a onDelete: Cascade nello schema,
// eliminando un Team vengono eliminati automaticamente:
// - Tutti i TeamMember associati
// - Tutti gli Strike associati

const deletedTeam = await prisma.team.delete({
  where: { id: teamId },
});
```

### Esempio: Query Classifica

```typescript
const leaderboard = await prisma.team.findMany({
  where: { tournamentId },
  select: {
    id: true,
    name: true,
    boatNumber: true,
    captain: {
      select: { firstName: true, lastName: true },
    },
    _count: {
      select: { strikes: true },
    },
    strikes: {
      where: { result: 'CATCH' },
      select: { id: true },
    },
  },
  orderBy: {
    strikes: { _count: 'desc' },
  },
});
```

### Esempio: Migrazione CAPTAIN -> TEAM_LEADER

```typescript
// Aggiornamento ruoli esistenti
const result = await prisma.$executeRaw`
  UPDATE team_members SET role = 'TEAM_LEADER' WHERE role = 'CAPTAIN'
`;
console.log(`Migrated ${result} records from CAPTAIN to TEAM_LEADER`);
```

---

## Risorse Utili

- **Documentazione Ufficiale:** https://www.prisma.io/docs
- **Prisma Playground:** https://playground.prisma.io
- **GitHub:** https://github.com/prisma/prisma
- **Discord Community:** https://pris.ly/discord

---

**Documento generato da:** Claude Code (Opus 4.5)
**Data:** 2026-01-05
