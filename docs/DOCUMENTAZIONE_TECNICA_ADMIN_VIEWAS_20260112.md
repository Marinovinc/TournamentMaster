# Documentazione Tecnica - Admin ViewAs ReadOnly

**Versione:** 1.0.0
**Data:** 2026-01-12
**Progetto:** TournamentMaster
**Autore:** Claude Opus 4.5

---

## Indice

1. [Panoramica Architettura](#1-panoramica-architettura)
2. [Componenti Coinvolti](#2-componenti-coinvolti)
3. [Flusso Dati](#3-flusso-dati)
4. [API Backend](#4-api-backend)
5. [Props e Interfacce](#5-props-e-interfacce)
6. [Riferimenti File e Linee](#6-riferimenti-file-e-linee)
7. [Testing](#7-testing)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Panoramica Architettura

### 1.1 Obiettivo
Permettere agli amministratori di visualizzare il profilo di un utente (barche, attrezzature, media) senza poterlo modificare.

### 1.2 Pattern Implementato
```
URL: /associazioni/{slug}?viewAs={userId}
     ↓
UserDashboardSection rileva viewAs
     ↓
Imposta viewUserId (per API) + readOnly=true (per UI)
     ↓
Componenti figli nascondono pulsanti modifica
```

### 1.3 Configurazione Apache
La piattaforma usa Apache come reverse proxy:
- **BasePath:** `/tm`
- **Frontend:** Next.js su porta 3000
- **Backend:** Express su porta 3001
- **Config:** `D:\xampp\apache\conf\extra\httpd-vhosts.conf`

---

## 2. Componenti Coinvolti

### 2.1 Struttura Directory
```
frontend/src/
├── app/[locale]/
│   └── associazioni/[slug]/
│       └── page.tsx              # Pagina associazione
├── components/
│   ├── association/
│   │   └── UserDashboardSection.tsx  # Contenitore tabs utente
│   └── user/
│       ├── BoatsSection.tsx      # Tab Barche (MODIFICATO)
│       ├── EquipmentSection.tsx  # Tab Attrezzature (MODIFICATO)
│       ├── MediaSection.tsx      # Tab Media (MODIFICATO)
│       └── index.ts              # Exports
```

### 2.2 Gerarchia Componenti
```
AssociationPage (page.tsx)
  └── UserDashboardSection
        ├── BoatsSection (readOnly prop)
        ├── EquipmentSection (readOnly prop)
        ├── MediaSection (readOnly prop)
        ├── TournamentsSection
        ├── CatchesSection
        └── SettingsSection
```

---

## 3. Flusso Dati

### 3.1 Rilevamento viewAs

**File:** `frontend/src/components/association/UserDashboardSection.tsx`

```typescript
// URL params parsing
const searchParams = useSearchParams();
const viewAsParam = searchParams.get('viewAs');

// Logica selezione utente
const viewUserId = viewAsParam || undefined;
const readOnly = !!viewAsParam; // true se admin sta visualizzando altro utente
```

### 3.2 Passaggio Props ai Figli

```typescript
<BoatsSection
  userId={viewUserId || currentUserId}
  readOnly={readOnly}
  // ... altre props
/>

<EquipmentSection
  userId={viewUserId || currentUserId}
  readOnly={readOnly}
  // ... altre props
/>

<MediaSection
  viewUserId={viewUserId}
  readOnly={readOnly}
  // ... altre props
/>
```

### 3.3 Rendering Condizionale

```typescript
// Pattern usato in tutti i componenti
{!readOnly && (
  <Button onClick={handleEdit}>
    <Edit2 className="h-4 w-4 mr-2" />
    Modifica
  </Button>
)}
```

---

## 4. API Backend

### 4.1 Endpoint Barche

**Route:** `GET /api/boats?userId={userId}`
**File:** `backend/src/routes/boat.routes.ts`
**Service:** `backend/src/services/boat.service.ts`

```typescript
// Query Prisma
const boats = await prisma.boat.findMany({
  where: { userId },
  include: { user: true }
});
```

### 4.2 Endpoint Attrezzature

**Route:** `GET /api/equipment?userId={userId}`
**File:** `backend/src/routes/equipment.routes.ts`
**Service:** `backend/src/services/equipment.service.ts`

```typescript
// Query Prisma
const equipment = await prisma.equipment.findMany({
  where: { userId },
  orderBy: { category: 'asc' }
});
```

### 4.3 Endpoint Media

**Route:** `GET /api/user-media?userId={userId}`
**File:** `backend/src/routes/user-media.routes.ts`
**Service:** `backend/src/services/user-media.service.ts`

```typescript
// Query Prisma
const media = await prisma.userMedia.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' }
});
```

---

## 5. Props e Interfacce

### 5.1 BoatsSection Props

**File:** `frontend/src/components/user/BoatsSection.tsx:17-29`

```typescript
interface BoatsSectionProps {
  userId?: string;          // ID utente di cui vedere le barche
  readOnly?: boolean;       // Se true, nasconde pulsanti modifica
  onBoatSelect?: (boatId: string | null) => void;
  selectedBoatId?: string | null;
}
```

### 5.2 EquipmentSection Props

**File:** `frontend/src/components/user/EquipmentSection.tsx:18-30`

```typescript
interface EquipmentSectionProps {
  userId?: string;          // ID utente di cui vedere attrezzature
  readOnly?: boolean;       // Se true, nasconde pulsanti modifica
}
```

### 5.3 MediaSection Props

**File:** `frontend/src/components/user/MediaSection.tsx`

```typescript
interface MediaSectionProps {
  viewUserId?: string;      // Se presente, carica media di altro utente
  readOnly?: boolean;       // Se true, nasconde controlli upload/edit
}
```

---

## 6. Riferimenti File e Linee

### 6.1 BoatsSection.tsx Modifiche

| Linee | Descrizione | Codice |
|-------|-------------|--------|
| 463-468 | Header "Aggiungi Barca" | `{!readOnly && <Button>Aggiungi Barca</Button>}` |
| 477-484 | Empty state condizionale | Messaggio diverso per readOnly |
| 563-583 | Pulsanti Modifica/Elimina | `{!readOnly && <><Button>Modifica</Button><Button>Elimina</Button></>}` |

### 6.2 EquipmentSection.tsx Modifiche

| Linee | Descrizione | Codice |
|-------|-------------|--------|
| 474-479 | Header "Aggiungi" | `{!readOnly && <Button>Aggiungi</Button>}` |
| 510-518 | Empty state condizionale | Messaggio diverso per readOnly |
| 580-600 | Pulsanti Modifica/Elimina | `{!readOnly && <><Button>Modifica</Button><Button>Elimina</Button></>}` |

### 6.3 MediaSection.tsx Modifiche

| Linee | Descrizione | Codice |
|-------|-------------|--------|
| ~50 | API call con userId | `userId=${viewUserId}` se presente |
| ~120 | Image src con basePath | `getMediaUrl(media.filePath)` |
| ~150 | Controlli upload nascosti | `{!readOnly && <UploadControls />}` |

---

## 7. Testing

### 7.1 Test Playwright

**File:** `D:\erp-upgrade\ai\.claude\skills\webapp-testing\test_both_scenarios.py`

**Scenario 1 - Admin ViewAs:**
```python
page.goto('http://localhost/tm/it/associazioni/ischiafishing?viewAs=3914d454-edc9-4c49-9916-bd033fd7176b')
# Atteso: 0 pulsanti "Modifica", 0 pulsanti "Aggiungi Barca"
```

**Scenario 2 - Utente proprio profilo:**
```python
page.goto('http://localhost/tm/it/associazioni/ischiafishing')
# Atteso: >=1 pulsanti "Modifica", 1 pulsante "Aggiungi Barca"
```

### 7.2 Esecuzione Test

```bash
cd D:\erp-upgrade\ai
C:\Python313\python.exe .claude\skills\webapp-testing\test_both_scenarios.py
```

### 7.3 Screenshot di Verifica

- `D:\erp-upgrade\ai\screenshot_scenario1_admin_viewas.png` - Admin senza pulsanti
- `D:\erp-upgrade\ai\screenshot_scenario2_user_own.png` - Utente con pulsanti

---

## 8. Troubleshooting

### 8.1 Modifiche non visibili nel browser

**Causa:** Cache Next.js o server non ricompilato

**Soluzione:**
```bash
# Fermare il server (se in esecuzione)
taskkill /F /IM node.exe /T

# Pulire cache
cd D:\Dev\TournamentMaster\frontend
rmdir /S /Q .next\cache

# Riavviare
npm run dev
```

### 8.2 Pulsanti ancora visibili con viewAs

**Verifica:**
1. Controllare che URL contenga `?viewAs={uuid}`
2. Ispezionare React DevTools per valore `readOnly`
3. Verificare che il componente riceva la prop

**Debug JSX:**
```typescript
console.log('readOnly:', readOnly);
// Aggiungere temporaneamente in BoatsSection/EquipmentSection
```

### 8.3 API non restituisce dati altro utente

**Verifica:**
1. Controllare che `userId` sia passato all'API
2. Verificare permessi admin in backend
3. Ispezionare Network tab per request/response

**Debug API:**
```bash
curl "http://localhost:3001/api/boats?userId=3914d454-edc9-4c49-9916-bd033fd7176b" -H "Authorization: Bearer {token}"
```

---

## Appendice A: Database Schema (Prisma)

### A.1 Modello Boat
```prisma
model Boat {
  id          String   @id @default(uuid())
  userId      String
  name        String
  type        String?
  length      Float?
  engine      String?
  registration String?
  user        User     @relation(fields: [userId], references: [id])
  catches     Catch[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### A.2 Modello Equipment
```prisma
model Equipment {
  id          String   @id @default(uuid())
  userId      String
  category    String
  brand       String?
  model       String?
  description String?
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### A.3 Modello UserMedia
```prisma
model UserMedia {
  id          String   @id @default(uuid())
  userId      String
  type        String   // IMAGE, VIDEO
  filePath    String
  description String?
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
}
```

---

## Appendice B: Helper Functions

### B.1 getMediaUrl

**File:** `frontend/src/lib/utils.ts`

```typescript
export function getMediaUrl(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/tm';
  if (path.startsWith('http')) return path;
  return `${basePath}${path.startsWith('/') ? '' : '/'}${path}`;
}
```

### B.2 useAuth Hook

**File:** `frontend/src/hooks/useAuth.ts`

```typescript
export function useAuth() {
  const { data: session } = useSession();
  return {
    user: session?.user,
    isAdmin: session?.user?.role === 'TENANT_ADMIN' || session?.user?.role === 'SUPER_ADMIN',
    // ...
  };
}
```

---

## Documenti Correlati

- [HANDOVER_SESSIONE_ADMIN_VIEWAS_20260112.md](./HANDOVER_SESSIONE_ADMIN_VIEWAS_20260112.md) - Handover sessione con confessione errori
- [GUIDA_GESTIONE_STAFF_TORNEO.md](./GUIDA_GESTIONE_STAFF_TORNEO.md) - Gestione staff e ruoli
- [ARCHITETTURA_FRONTEND_BACKEND_E_GITHUB.md](./ARCHITETTURA_FRONTEND_BACKEND_E_GITHUB.md) - Architettura generale

---

**Commit:** `fd3b8ff`
**Branch:** `clean-master`
**Repository:** TournamentMaster
