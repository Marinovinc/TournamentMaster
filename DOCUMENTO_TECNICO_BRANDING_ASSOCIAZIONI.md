# Documento Tecnico - Sistema Branding Associazioni

**Versione:** 1.0.0
**Data:** 2026-01-04
**Autore:** Claude Code (Opus 4.5)
**Stato:** Production Ready

---

## Indice

1. [Panoramica](#1-panoramica)
2. [Architettura Sistema](#2-architettura-sistema)
3. [Schema Database](#3-schema-database)
4. [API Endpoints](#4-api-endpoints)
5. [Componenti Frontend](#5-componenti-frontend)
6. [Flusso Dati](#6-flusso-dati)
7. [Sicurezza e Autorizzazioni](#7-sicurezza-e-autorizzazioni)
8. [Considerazioni Tecniche](#8-considerazioni-tecniche)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Panoramica

### 1.1 Obiettivo

Il sistema di branding consente alle associazioni di personalizzare la propria pagina pubblica con:
- Logo e immagine banner
- Colori personalizzati (primario e secondario)
- Descrizione associazione
- Informazioni di contatto
- Link ai social media
- Dati affiliazione FIPSAS

### 1.2 Componenti Principali

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA BRANDING                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │    │   Backend    │    │   Database   │      │
│  │              │◄──►│              │◄──►│              │      │
│  │ - Admin Page │    │ - REST API   │    │ - Tenant     │      │
│  │ - Public Page│    │ - Auth       │    │   Model      │      │
│  │ - Guide      │    │ - Validation │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Architettura Sistema

### 2.1 Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|------------|----------|
| Frontend | Next.js | 14.x |
| UI Components | shadcn/ui | Latest |
| Styling | Tailwind CSS | 3.x |
| Backend | Node.js/Express | 18.x |
| ORM | Prisma | 5.x |
| Database | MySQL | 8.x |
| Auth | JWT | - |

### 2.2 Struttura File

```
TournamentMaster/
├── frontend/
│   └── src/app/[locale]/
│       ├── associazioni/
│       │   └── [slug]/
│       │       └── page.tsx          # Pagina pubblica associazione
│       ├── dashboard/admin/
│       │   └── branding/
│       │       └── page.tsx          # Admin gestione branding
│       └── fipsas/
│           └── page.tsx              # Pagina info FIPSAS
├── backend/
│   ├── prisma/
│   │   └── schema.prisma             # Schema database
│   └── src/routes/
│       └── tenant.routes.ts          # API endpoints
└── DOCUMENTO_TECNICO_BRANDING_ASSOCIAZIONI.md
```

---

## 3. Schema Database

### 3.1 Modello Tenant (Prisma)

```prisma
model Tenant {
  id              String       @id @default(uuid())
  name            String       @db.VarChar(255)
  slug            String       @unique @db.VarChar(100)
  domain          String?      @unique @db.VarChar(255)

  // Branding visivo
  logo            String?      @db.VarChar(500)
  bannerImage     String?      @db.VarChar(500)
  primaryColor    String?      @default("#0066CC") @db.VarChar(7)
  secondaryColor  String?      @default("#004499") @db.VarChar(7)

  // Informazioni
  description     String?      @db.Text

  // Contatti
  contactEmail    String?      @db.VarChar(255)
  contactPhone    String?      @db.VarChar(50)
  website         String?      @db.VarChar(500)
  address         String?      @db.Text

  // Social Media
  socialFacebook  String?      @db.VarChar(500)
  socialInstagram String?      @db.VarChar(500)
  socialYoutube   String?      @db.VarChar(500)

  // FIPSAS
  fipsasCode      String?      @db.VarChar(50)
  fipsasRegion    String?      @db.VarChar(100)

  // Sistema
  isActive        Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  // Relazioni
  users           User[]
  tournaments     Tournament[]
}
```

### 3.2 Campi Branding

| Campo | Tipo | Descrizione | Validazione |
|-------|------|-------------|-------------|
| `logo` | VARCHAR(500) | URL immagine logo | URL valido, nullable |
| `bannerImage` | VARCHAR(500) | URL immagine banner | URL valido, nullable |
| `primaryColor` | VARCHAR(7) | Colore primario HEX | Formato #RRGGBB |
| `secondaryColor` | VARCHAR(7) | Colore secondario HEX | Formato #RRGGBB |
| `description` | TEXT | Descrizione associazione | Max 5000 caratteri |
| `contactEmail` | VARCHAR(255) | Email contatto | Email valida |
| `contactPhone` | VARCHAR(50) | Telefono contatto | Testo libero |
| `website` | VARCHAR(500) | URL sito web | URL valido |
| `address` | TEXT | Indirizzo sede | Testo libero |
| `socialFacebook` | VARCHAR(500) | URL Facebook | URL valido |
| `socialInstagram` | VARCHAR(500) | URL Instagram | URL valido |
| `socialYoutube` | VARCHAR(500) | URL YouTube | URL valido |
| `fipsasCode` | VARCHAR(50) | Codice affiliazione | Testo libero |
| `fipsasRegion` | VARCHAR(100) | Regione FIPSAS | Testo libero |

---

## 4. API Endpoints

### 4.1 Endpoint Pubblico

#### GET `/api/tenants/public/:slug`

Recupera i dati pubblici di un'associazione tramite slug.

**Autenticazione:** Nessuna (pubblico)

**Parametri:**
- `slug` (path): Slug univoco dell'associazione

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Nome Associazione",
    "slug": "nome-associazione",
    "logo": "https://...",
    "bannerImage": "https://...",
    "primaryColor": "#0066CC",
    "secondaryColor": "#004499",
    "description": "Descrizione...",
    "contactEmail": "info@...",
    "contactPhone": "+39...",
    "website": "https://...",
    "address": "Via...",
    "socialFacebook": "https://...",
    "socialInstagram": "https://...",
    "socialYoutube": "https://...",
    "fipsasCode": "12345",
    "fipsasRegion": "Campania",
    "_count": {
      "tournaments": 5,
      "users": 12
    },
    "recentTournaments": [...]
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

### 4.2 Endpoint Admin - Lettura

#### GET `/api/tenants/me/branding`

Recupera i dati branding del tenant corrente o di uno specifico (per SUPER_ADMIN).

**Autenticazione:** Bearer JWT (Admin)

**Query Parameters:**
- `tenantId` (optional): ID tenant specifico (solo per SUPER_ADMIN)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Nome Associazione",
    "slug": "nome-associazione",
    "logo": "https://...",
    // ... tutti i campi branding
  }
}
```

### 4.3 Endpoint Admin - Aggiornamento

#### PUT `/api/tenants/me/branding`

Aggiorna i dati branding del tenant.

**Autenticazione:** Bearer JWT (TENANT_ADMIN, PRESIDENT, SUPER_ADMIN)

**Query Parameters:**
- `tenantId` (optional): ID tenant specifico (solo per SUPER_ADMIN)

**Request Body:**
```json
{
  "name": "Nome Associazione",
  "logo": "https://...",
  "bannerImage": "https://...",
  "primaryColor": "#0066CC",
  "secondaryColor": "#004499",
  "description": "Descrizione...",
  "contactEmail": "info@...",
  "contactPhone": "+39...",
  "website": "https://...",
  "address": "Via...",
  "socialFacebook": "https://...",
  "socialInstagram": "https://...",
  "socialYoutube": "https://...",
  "fipsasCode": "12345",
  "fipsasRegion": "Campania"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Branding aggiornato con successo",
  "data": { ... }
}
```

---

## 5. Componenti Frontend

### 5.1 Pagina Admin Branding

**Path:** `/[locale]/dashboard/admin/branding/page.tsx`

**Funzionalita:**
- Selezione tenant per SUPER_ADMIN
- 4 tab organizzati: Branding, Contatti, Social, FIPSAS
- Preview colori in tempo reale
- Preview immagini con fallback
- Guida integrata collapsible
- Bottoni "Anteprima" e "Salva"

**Struttura Componente:**
```tsx
export default function BrandingPage() {
  // Stati
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]); // Per SUPER_ADMIN
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Effetti
  useEffect(() => { /* Fetch tenants list */ }, []);
  useEffect(() => { /* Fetch branding data */ }, [selectedTenantId]);

  // Handlers
  const handleSave = async () => { /* PUT API call */ };
  const updateField = (field, value) => { /* Update local state */ };

  return (
    <>
      {/* Header con bottoni Anteprima/Salva */}
      {/* Guida collapsible */}
      {/* Tabs: Branding, Contatti, Social, FIPSAS */}
    </>
  );
}
```

### 5.2 Pagina Pubblica Associazione

**Path:** `/[locale]/associazioni/[slug]/page.tsx`

**Tipo:** Server Component (SSR)

**Funzionalita:**
- Fetch server-side dei dati tenant
- Theming dinamico con colori tenant
- Hero banner con logo e nome
- Statistiche (tornei, membri)
- Lista tornei recenti
- Sidebar con contatti e social
- CTA registrazione

**SSR Fetch Pattern:**
```tsx
// Usa localhost per server-side, public URL per client-side
const getApiUrl = () => {
  if (typeof window === "undefined") {
    return process.env.API_URL || "http://localhost:3001";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
};

async function getTenantData(slug: string) {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/tenants/public/${slug}`, {
    next: { revalidate: 60 }, // Cache 60 secondi
  });
  // ...
}
```

### 5.3 Guida Integrata

La guida e implementata come card collapsible nella pagina admin con:
- Istruzioni per ogni sezione (Logo, Colori, Contatti, FIPSAS)
- Tips e suggerimenti
- Quick actions (link pagina pubblica, info FIPSAS)

---

## 6. Flusso Dati

### 6.1 Flusso Lettura Branding (Admin)

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────►│ Frontend│────►│ Backend │────►│Database │
│ (Admin) │     │  (GET)  │     │  (API)  │     │ (Query) │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                    │                               │
                    │◄──────────────────────────────┘
                    │         Response JSON
                    ▼
              ┌──────────┐
              │ setState │
              │ (React)  │
              └──────────┘
```

### 6.2 Flusso Salvataggio Branding

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────►│ Frontend│────►│ Backend │────►│Database │
│ (Click) │     │  (PUT)  │     │(Validate)│    │ (UPDATE)│
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                    │                               │
                    │◄──────────────────────────────┘
                    │         Success/Error
                    ▼
              ┌──────────┐
              │ Toast/   │
              │ Feedback │
              └──────────┘
```

### 6.3 Flusso Pagina Pubblica (SSR)

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Visitor │────►│ Next.js │────►│ Backend │────►│Database │
│ (URL)   │     │  (SSR)  │     │ (API)   │     │ (Query) │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                    │                               │
                    │◄──────────────────────────────┘
                    │         Tenant Data
                    ▼
              ┌──────────┐
              │  Render  │
              │   HTML   │──────► Browser
              └──────────┘
```

---

## 7. Sicurezza e Autorizzazioni

### 7.1 Matrice Permessi

| Endpoint | VISITOR | USER | TENANT_ADMIN | PRESIDENT | SUPER_ADMIN |
|----------|---------|------|--------------|-----------|-------------|
| GET /public/:slug | OK | OK | OK | OK | OK |
| GET /me/branding | - | - | Own Tenant | Own Tenant | Any Tenant |
| PUT /me/branding | - | - | Own Tenant | Own Tenant | Any Tenant |

### 7.2 Validazione Input

```typescript
// Backend validation (esempio)
const brandingSchema = {
  name: { type: 'string', maxLength: 255, required: true },
  logo: { type: 'url', maxLength: 500, nullable: true },
  bannerImage: { type: 'url', maxLength: 500, nullable: true },
  primaryColor: { type: 'string', pattern: /^#[0-9A-Fa-f]{6}$/, nullable: true },
  secondaryColor: { type: 'string', pattern: /^#[0-9A-Fa-f]{6}$/, nullable: true },
  contactEmail: { type: 'email', maxLength: 255, nullable: true },
  // ...
};
```

### 7.3 Protezione SUPER_ADMIN

Per SUPER_ADMIN, il parametro `tenantId` permette di gestire qualsiasi associazione:

```typescript
// Backend logic
if (user.role === 'SUPER_ADMIN' && req.query.tenantId) {
  tenantId = req.query.tenantId as string;
} else {
  tenantId = user.tenantId; // Dal JWT token
}
```

---

## 8. Considerazioni Tecniche

### 8.1 Caching

La pagina pubblica usa cache di 60 secondi:
```tsx
const response = await fetch(url, {
  next: { revalidate: 60 },
  cache: "force-cache",
});
```

### 8.2 Environment Variables

```env
# .env.local (Frontend)
NEXT_PUBLIC_API_URL=http://192.168.1.74:3001  # Client-side (public IP)
API_URL=http://localhost:3001                   # Server-side (SSR)
```

### 8.3 Immagini

Le immagini sono gestite tramite URL esterni. Raccomandazioni:
- **Logo:** PNG trasparente, 200x200px minimo
- **Banner:** JPG, 1920x400px consigliato
- **Hosting:** Imgur, Google Drive (link diretto), CDN proprio

### 8.4 Colori

I colori sono salvati in formato HEX (#RRGGBB) e applicati dinamicamente:
```tsx
<div style={{ backgroundColor: tenant.primaryColor }}>
  ...
</div>
```

---

## 9. Troubleshooting

### 9.1 "Associazione non trovata" sulla pagina pubblica

**Causa:** Server-side fetch usa URL non raggiungibile (es. IP di rete locale)

**Soluzione:**
1. Verificare `.env.local` contenga `API_URL=http://localhost:3001`
2. Riavviare il server Next.js

### 9.2 SUPER_ADMIN non vede lista associazioni

**Causa:** Token JWT non contiene ruolo corretto

**Soluzione:**
1. Verificare che l'utente abbia ruolo SUPER_ADMIN nel database
2. Effettuare logout/login per rigenerare il token

### 9.3 Immagini non caricate

**Causa:** URL non valido o CORS blocking

**Soluzione:**
1. Verificare che l'URL sia accessibile pubblicamente
2. Usare servizi che supportano hotlinking (Imgur, CDN)
3. Per Google Drive, usare formato: `https://drive.google.com/uc?id=FILE_ID`

### 9.4 Colori non applicati

**Causa:** Formato colore non valido

**Soluzione:**
1. Usare formato HEX completo: `#RRGGBB`
2. Non usare formati abbreviati (`#RGB`) o nomi colore

---

## Appendice A - Comandi Utili

```bash
# Rebuild database schema
cd backend && npx prisma db push

# Generare client Prisma
cd backend && npx prisma generate

# Build frontend
cd frontend && npm run build

# Test API endpoint
curl http://localhost:3001/api/tenants/public/slug-associazione
```

---

## Appendice B - Changelog

| Versione | Data | Modifiche |
|----------|------|-----------|
| 1.0.0 | 2026-01-04 | Prima release documentazione |

---

*Documento generato il 2026-01-04 da Claude Code (Opus 4.5)*
