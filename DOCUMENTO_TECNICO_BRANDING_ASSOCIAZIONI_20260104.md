# DOCUMENTO TECNICO - Branding Associazioni e Pagine Pubbliche

**Data:** 2026-01-04
**Versione:** 1.0.0
**Autore:** Claude Code (Opus 4.5)
**Commit:** 9be6c58

---

## INDICE

1. [Panoramica Architettura](#1-panoramica-architettura)
2. [Schema Database](#2-schema-database)
3. [API Backend](#3-api-backend)
4. [Frontend Pages](#4-frontend-pages)
5. [Flussi Dati](#5-flussi-dati)
6. [Riferimenti File](#6-riferimenti-file)
7. [Configurazioni](#7-configurazioni)
8. [Esempi Codice](#8-esempi-codice)

---

## 1. PANORAMICA ARCHITETTURA

### 1.1 Componenti Coinvolti

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 16)                    │
├─────────────────────────────────────────────────────────────────┤
│  /associazioni/[slug]     │  Pagina pubblica (SSR, cache 60s)   │
│  /dashboard/admin/branding│  Admin gestione branding (CSR)      │
│  /fipsas                  │  Info federazione (SSR)             │
│  /dashboard/layout.tsx    │  Sidebar con link Branding          │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express 5)                         │
├─────────────────────────────────────────────────────────────────┤
│  GET  /api/tenants/public/:slug  │  Dati pubblici + tornei      │
│  GET  /api/tenants/me/branding   │  Branding tenant corrente    │
│  PUT  /api/tenants/me/branding   │  Aggiorna branding           │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Prisma ORM
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (MySQL)                            │
├─────────────────────────────────────────────────────────────────┤
│  tenants (14 nuovi campi branding)                              │
│  tournaments (relazione per tornei recenti)                     │
│  users (count per statistiche membri)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|------------|----------|
| Frontend | Next.js | 16.1.1 |
| UI Components | shadcn/ui | latest |
| Icons | lucide-react | latest |
| Backend | Express | 5.x |
| ORM | Prisma | latest |
| Database | MySQL | 8.x |
| Auth | JWT | - |

---

## 2. SCHEMA DATABASE

### 2.1 Modello Tenant Aggiornato

**File:** `backend/prisma/schema.prisma`
**Righe:** 15-60 (circa)

```prisma
model Tenant {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(255)
  slug        String   @unique @db.VarChar(100)
  domain      String?  @unique @db.VarChar(255)

  // ==========================================
  // CAMPI BRANDING (NUOVI - 2026-01-04)
  // ==========================================

  // Branding Visuale
  logo            String?  @db.VarChar(500)    // URL logo associazione
  bannerImage     String?  @db.VarChar(500)    // URL banner hero
  primaryColor    String?  @db.VarChar(7) @default("#0066CC")   // Colore primario HEX
  secondaryColor  String?  @db.VarChar(7) @default("#004499")   // Colore secondario HEX
  description     String?  @db.Text            // Descrizione "Chi Siamo"

  // Contatti
  contactEmail    String?  @db.VarChar(255)    // Email contatto
  contactPhone    String?  @db.VarChar(30)     // Telefono
  website         String?  @db.VarChar(255)    // Sito web
  address         String?  @db.VarChar(500)    // Indirizzo sede

  // Social Media
  socialFacebook  String?  @db.VarChar(255)    // URL Facebook
  socialInstagram String?  @db.VarChar(255)    // URL Instagram
  socialYoutube   String?  @db.VarChar(255)    // URL YouTube

  // Affiliazione FIPSAS
  fipsasCode      String?  @db.VarChar(50)     // Codice affiliazione
  fipsasRegion    String?  @db.VarChar(100)    // Regione FIPSAS
  // ==========================================

  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relazioni
  users       User[]
  tournaments Tournament[]

  @@map("tenants")
}
```

### 2.2 Migrazione Database

La migrazione e' stata applicata con `npx prisma db push` (schema sync senza migration file).

**Nota:** `prisma generate` ha dato errore EPERM per DLL locked, ma si risolve automaticamente al restart del server.

---

## 3. API BACKEND

### 3.1 File Routes

**File:** `backend/src/routes/tenant.routes.ts`
**Righe totali:** 753

### 3.2 Endpoint: GET /api/tenants/public/:slug

**Scopo:** Recupera dati pubblici di un'associazione per la pagina pubblica

**Autenticazione:** Nessuna (pubblico)

**Path Parameters:**
| Param | Tipo | Descrizione |
|-------|------|-------------|
| slug | string | Slug univoco tenant (es. "ischia-fishing-club") |

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Ischia Fishing Club",
    "slug": "ischia-fishing-club",
    "logo": "https://...",
    "bannerImage": "https://...",
    "primaryColor": "#0066CC",
    "secondaryColor": "#004499",
    "description": "Descrizione associazione...",
    "contactEmail": "info@ischiafishing.it",
    "contactPhone": "+39 081 123456",
    "website": "https://ischiafishing.it",
    "address": "Via Porto, 1 - Ischia (NA)",
    "socialFacebook": "https://facebook.com/ischiafishing",
    "socialInstagram": "https://instagram.com/ischiafishing",
    "socialYoutube": null,
    "fipsasCode": "NA-1234",
    "fipsasRegion": "Campania",
    "_count": {
      "tournaments": 12,
      "users": 156
    },
    "recentTournaments": [
      {
        "id": "uuid",
        "name": "Trofeo Estate 2026",
        "startDate": "2026-07-15",
        "location": "Ischia Porto",
        "discipline": "BIG_GAME",
        "status": "PUBLISHED",
        "bannerImage": "https://..."
      }
    ]
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Associazione non trovata"
}
```

**Implementazione:** Linee 680-750 circa in `tenant.routes.ts`

---

### 3.3 Endpoint: GET /api/tenants/me/branding

**Scopo:** Recupera impostazioni branding del tenant corrente (per admin)

**Autenticazione:** JWT required (ruoli: SUPER_ADMIN, TENANT_ADMIN, PRESIDENT)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "name": "Ischia Fishing Club",
    "slug": "ischia-fishing-club",
    "logo": "https://...",
    "bannerImage": "https://...",
    "primaryColor": "#0066CC",
    "secondaryColor": "#004499",
    "description": "...",
    "contactEmail": "...",
    "contactPhone": "...",
    "website": "...",
    "address": "...",
    "socialFacebook": "...",
    "socialInstagram": "...",
    "socialYoutube": "...",
    "fipsasCode": "...",
    "fipsasRegion": "..."
  }
}
```

---

### 3.4 Endpoint: PUT /api/tenants/me/branding

**Scopo:** Aggiorna impostazioni branding del tenant corrente

**Autenticazione:** JWT required (ruoli: SUPER_ADMIN, TENANT_ADMIN, PRESIDENT)

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body (tutti i campi opzionali):**
```json
{
  "name": "Nuovo Nome Associazione",
  "description": "Nuova descrizione...",
  "logo": "https://url-logo.png",
  "bannerImage": "https://url-banner.jpg",
  "primaryColor": "#FF6600",
  "secondaryColor": "#CC4400",
  "contactEmail": "nuovo@email.it",
  "contactPhone": "+39 081 999999",
  "website": "https://nuovo-sito.it",
  "address": "Nuovo indirizzo",
  "socialFacebook": "https://facebook.com/nuovo",
  "socialInstagram": "https://instagram.com/nuovo",
  "socialYoutube": "https://youtube.com/nuovo",
  "fipsasCode": "NA-9999",
  "fipsasRegion": "Campania"
}
```

**Validazione (express-validator):**

| Campo | Regole |
|-------|--------|
| name | optional, trim, notEmpty |
| description | optional, trim |
| logo | optional, trim |
| bannerImage | optional, trim |
| primaryColor | optional, regex `/^#[0-9A-Fa-f]{6}$/` |
| secondaryColor | optional, regex `/^#[0-9A-Fa-f]{6}$/` |
| contactEmail | optional, isEmail |
| contactPhone | optional, trim |
| website | optional, trim |
| address | optional, trim |
| socialFacebook | optional, trim |
| socialInstagram | optional, trim |
| socialYoutube | optional, trim |
| fipsasCode | optional, trim |
| fipsasRegion | optional, trim |

**Response Success (200):**
```json
{
  "success": true,
  "message": "Branding aggiornato con successo",
  "data": { /* tenant aggiornato */ }
}
```

---

## 4. FRONTEND PAGES

### 4.1 Pagina Admin Branding

**File:** `frontend/src/app/[locale]/dashboard/admin/branding/page.tsx`
**Righe:** 583
**Rendering:** Client-side (CSR) con "use client"

**Struttura UI:**

```
┌────────────────────────────────────────────────────────────┐
│  Header: "Personalizza Associazione"                       │
│  Subtitle: "Configura logo, colori e informazioni"         │
├────────────────────────────────────────────────────────────┤
│  [Tab: Branding] [Tab: Contatti] [Tab: Social] [Tab: FIPSAS]│
├────────────────────────────────────────────────────────────┤
│                                                            │
│  TAB BRANDING:                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Nome Associazione│  │ Slug (readonly)  │               │
│  └──────────────────┘  └──────────────────┘               │
│  ┌─────────────────────────────────────────┐              │
│  │ Descrizione (textarea)                   │              │
│  └─────────────────────────────────────────┘              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ URL Logo         │  │ URL Banner       │               │
│  └──────────────────┘  └──────────────────┘               │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Colore Primario  │  │ Colore Secondario│               │
│  │ [Color Picker]   │  │ [Color Picker]   │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                            │
│  PREVIEW COLORI:                                           │
│  ┌─────────────────────────────────────────┐              │
│  │ [Gradient Box con colori selezionati]   │              │
│  └─────────────────────────────────────────┘              │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  [Salva Modifiche]                                         │
└────────────────────────────────────────────────────────────┘
```

**Componenti shadcn/ui utilizzati:**
- Card, CardContent, CardHeader, CardTitle, CardDescription
- Input
- Label
- Textarea
- Button
- Tabs, TabsContent, TabsList, TabsTrigger

**State Management:**
```typescript
const [formData, setFormData] = useState({
  name: "",
  description: "",
  logo: "",
  bannerImage: "",
  primaryColor: "#0066CC",
  secondaryColor: "#004499",
  contactEmail: "",
  contactPhone: "",
  website: "",
  address: "",
  socialFacebook: "",
  socialInstagram: "",
  socialYoutube: "",
  fipsasCode: "",
  fipsasRegion: "",
});
```

---

### 4.2 Pagina Pubblica Associazione

**File:** `frontend/src/app/[locale]/associazioni/[slug]/page.tsx`
**Righe:** 451
**Rendering:** Server-side (SSR) con cache 60 secondi

**Funzione fetch server-side:**
```typescript
async function getTenantData(slug: string) {
  const response = await fetch(`${API_URL}/api/tenants/public/${slug}`, {
    next: { revalidate: 60 }, // Cache 60 secondi
  });
  // ...
}
```

**Struttura UI:**

```
┌────────────────────────────────────────────────────────────┐
│  HERO BANNER (gradient o immagine banner)                  │
│  ┌────────┐                                                │
│  │ LOGO   │  Nome Associazione                             │
│  │        │  [Badge FIPSAS Regione - Codice]               │
│  └────────┘                                                │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┬──────────────────────────┐
│  COLONNA PRINCIPALE (2/3)       │  SIDEBAR (1/3)           │
├─────────────────────────────────┼──────────────────────────┤
│                                 │                          │
│  [Card Chi Siamo]               │  [Card Contatti]         │
│  Descrizione associazione       │  Email, Tel, Web, Addr   │
│                                 │                          │
│  [Stats Grid 2 colonne]         │  [Card Social]           │
│  - Tornei Organizzati: N        │  Facebook, Instagram,    │
│  - Membri: N                    │  YouTube buttons         │
│                                 │                          │
│  [Card Tornei Recenti]          │  [Card FIPSAS]           │
│  Lista tornei con:              │  Codice, Regione         │
│  - Immagine/placeholder         │  Link "Scopri di piu"    │
│  - Nome, data, location         │                          │
│  - Badge stato                  │  [Card CTA Gradient]     │
│  - Badge disciplina             │  "Vuoi partecipare?"     │
│                                 │  [Registrati Gratis]     │
│                                 │                          │
└─────────────────────────────────┴──────────────────────────┘
```

**Theming Dinamico:**
```typescript
const primaryColor = tenant.primaryColor || "#0066CC";
const secondaryColor = tenant.secondaryColor || "#004499";

// Usato per:
// - Background hero (se no banner image)
// - Icone stats
// - Background icone tornei placeholder
// - Gradient card CTA
```

---

### 4.3 Pagina FIPSAS

**File:** `frontend/src/app/[locale]/fipsas/page.tsx`
**Righe:** 336
**Rendering:** Server-side (SSR)

**Contenuto:**
- Header con logo FIPSAS
- Sezione "Chi e' la FIPSAS" (descrizione federazione)
- Link utili (sito ufficiale, tesseramento, regolamenti, calendario)
- Sistema di punteggio (formula + tabella coefficienti specie)
- Regole tornei (pesatura, orari, equipaggio, peso minimo)
- Integrazione TournamentMaster + FIPSAS
- CTA per associazioni FIPSAS

**Tabella coefficienti (esempio):**

| Specie | Categoria | Coefficiente | Peso Minimo |
|--------|-----------|--------------|-------------|
| Tonno Rosso | Big Game | x2.5 | 30 kg |
| Marlin Blu | Big Game | x3.0 | 50 kg |
| Pesce Spada | Big Game | x2.8 | 40 kg |
| Ricciola | Drifting | x1.8 | 5 kg |
| Dentice | Bolentino | x1.5 | 2 kg |
| Orata | Shore | x1.3 | 1 kg |
| Spigola | Shore | x1.4 | 1 kg |
| Lampuga | Traina | x1.6 | 3 kg |

---

### 4.4 Navigazione Dashboard

**File:** `frontend/src/app/[locale]/dashboard/layout.tsx`
**Modifica:** Linee 34, 131-135

**Import aggiunto:**
```typescript
import {
  // ... altri import ...
  Palette,  // NUOVO
} from "lucide-react";
```

**Nav item aggiunto:**
```typescript
const navItems: NavItem[] = [
  // ... altri items ...
  {
    href: `/${locale}/dashboard/reports`,
    label: "Report",
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"],
  },
  // NUOVO - Branding
  {
    href: `/${locale}/dashboard/admin/branding`,
    label: "Branding",
    icon: <Palette className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT"],
  },
];
```

---

## 5. FLUSSI DATI

### 5.1 Flusso Visualizzazione Pagina Pubblica

```
Browser richiede /it/associazioni/ischia-fishing-club
        │
        ▼
Next.js Server Component
        │
        ▼
getTenantData("ischia-fishing-club")
        │
        ▼
fetch("http://localhost:3001/api/tenants/public/ischia-fishing-club")
        │                    { next: { revalidate: 60 } }
        ▼
Express Backend
        │
        ▼
Prisma: prisma.tenant.findUnique({
  where: { slug, isActive: true },
  include: {
    tournaments: { take: 5, orderBy: { startDate: 'desc' } },
    _count: { select: { tournaments: true, users: true } }
  }
})
        │
        ▼
MySQL Database
        │
        ▼
Response JSON con dati tenant + tornei
        │
        ▼
React Server Component renderizza HTML
        │
        ▼
Browser riceve HTML completo (SEO-friendly)
```

### 5.2 Flusso Salvataggio Branding

```
Admin compila form branding
        │
        ▼
Click "Salva Modifiche"
        │
        ▼
handleSave() - validazione client-side
        │
        ▼
fetch("PUT /api/tenants/me/branding", {
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify(formData)
})
        │
        ▼
Express Backend:
1. JWT middleware verifica token
2. express-validator verifica campi
3. Estrae tenantId da req.user
        │
        ▼
Prisma: prisma.tenant.update({
  where: { id: tenantId },
  data: { ...validatedData }
})
        │
        ▼
MySQL UPDATE tenants SET ... WHERE id = ?
        │
        ▼
Response 200 con tenant aggiornato
        │
        ▼
Toast "Salvato con successo" + aggiorna state
```

---

## 6. RIFERIMENTI FILE

### 6.1 Backend

| File | Path | Descrizione |
|------|------|-------------|
| Schema Prisma | `backend/prisma/schema.prisma` | Modello Tenant con campi branding |
| Routes Tenant | `backend/src/routes/tenant.routes.ts` | Endpoint API branding |
| PDF Service | `backend/src/services/pdf.service.ts` | Generazione PDF leaderboard |

### 6.2 Frontend

| File | Path | Descrizione |
|------|------|-------------|
| Layout Dashboard | `frontend/src/app/[locale]/dashboard/layout.tsx` | Sidebar con link Branding |
| Admin Branding | `frontend/src/app/[locale]/dashboard/admin/branding/page.tsx` | Pagina gestione branding |
| Public Association | `frontend/src/app/[locale]/associazioni/[slug]/page.tsx` | Pagina pubblica |
| FIPSAS | `frontend/src/app/[locale]/fipsas/page.tsx` | Info federazione |

### 6.3 Dipendenze UI

| Componente | Package | Uso |
|------------|---------|-----|
| Card | @/components/ui/card | Container sezioni |
| Input | @/components/ui/input | Campi form |
| Label | @/components/ui/label | Etichette form |
| Textarea | @/components/ui/textarea | Descrizione |
| Button | @/components/ui/button | Azioni |
| Badge | @/components/ui/badge | Status, categorie |
| Tabs | @/components/ui/tabs | Navigazione form |
| Table | @/components/ui/table | Coefficienti FIPSAS |
| Palette | lucide-react | Icona nav branding |

---

## 7. CONFIGURAZIONI

### 7.1 Variabili Ambiente

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend (.env):**
```env
DATABASE_URL="mysql://user:pass@localhost:3306/tournamentmaster"
JWT_SECRET="your-secret-key"
```

### 7.2 Cache Settings

| Risorsa | Cache | Durata |
|---------|-------|--------|
| Pagina pubblica associazione | ISR (revalidate) | 60 secondi |
| API public tenant | No cache server | - |
| Branding admin | No cache | - |

---

## 8. ESEMPI CODICE

### 8.1 Fetch Tenant Pubblico (Server Component)

```typescript
// frontend/src/app/[locale]/associazioni/[slug]/page.tsx

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function getTenantData(slug: string) {
  try {
    const response = await fetch(`${API_URL}/api/tenants/public/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Failed to fetch tenant:", error);
    return null;
  }
}

export default async function AssociationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const tenant = await getTenantData(slug);

  if (!tenant) {
    return <NotFoundComponent />;
  }

  return <AssociationContent tenant={tenant} locale={locale} />;
}
```

### 8.2 Salvataggio Branding (Client Component)

```typescript
// frontend/src/app/[locale]/dashboard/admin/branding/page.tsx

const handleSave = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/api/tenants/me/branding`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      toast.success("Impostazioni salvate con successo");
    } else {
      toast.error(data.message || "Errore durante il salvataggio");
    }
  } catch (error) {
    console.error("Save error:", error);
    toast.error("Errore di connessione");
  } finally {
    setLoading(false);
  }
};
```

### 8.3 Endpoint Backend con Validazione

```typescript
// backend/src/routes/tenant.routes.ts

const updateBrandingValidation = [
  body("name").optional().trim().notEmpty(),
  body("description").optional().trim(),
  body("logo").optional().trim(),
  body("bannerImage").optional().trim(),
  body("primaryColor").optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body("secondaryColor").optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body("contactEmail").optional().isEmail(),
  body("contactPhone").optional().trim(),
  body("website").optional().trim(),
  body("address").optional().trim(),
  body("socialFacebook").optional().trim(),
  body("socialInstagram").optional().trim(),
  body("socialYoutube").optional().trim(),
  body("fipsasCode").optional().trim(),
  body("fipsasRegion").optional().trim(),
];

router.put(
  "/me/branding",
  authenticate,
  authorize(["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT"]),
  updateBrandingValidation,
  async (req, res) => {
    // ... implementazione
  }
);
```

---

## DOCUMENTI CORRELATI

- `HANDOVER_SESSIONE_BRANDING_20260104.md` - Handover sessione con errori
- `DOCUMENTAZIONE_COMPLETA_TOURNAMENTMASTER.md` - Documentazione master
- `backend/prisma/schema.prisma` - Schema database completo

---

*Documento generato il 2026-01-04 da Claude Code (Opus 4.5)*
