# Documento Tecnico - Sistema Branding Associazioni

**Versione:** 2.0.0
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

## 10. Guida Utente - Come Brandizzare la Tua Associazione

Questa sezione fornisce una guida passo-passo completa per personalizzare la pagina pubblica della tua associazione.

### 10.1 Accesso alla Pagina di Branding

**Passo 1:** Accedi al tuo account con ruolo Admin

**Passo 2:** Dal menu laterale, clicca su **"Branding"** (icona tavolozza)

```
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐                                            │
│  │ 🏠 Home     │                                            │
│  ├─────────────┤                                            │
│  │ 🏆 Tornei   │                                            │
│  ├─────────────┤                                            │
│  │ 👥 Utenti   │                                            │
│  ├─────────────┤                                            │
│  │ 🎨 Branding │ ◄── CLICCA QUI                            │
│  ├─────────────┤                                            │
│  │ ⚙️ Settings │                                            │
│  └─────────────┘                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Struttura della Pagina Pubblica

Ecco come appare la pagina pubblica della tua associazione e dove vengono applicati i vari elementi di branding:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                        ║  │
│  ║                    🖼️ BANNER IMAGE                                    ║  │
│  ║                    (1920 x 400 px)                                     ║  │
│  ║                                                                        ║  │
│  ║     ┌──────┐                                                          ║  │
│  ║     │ LOGO │  NOME ASSOCIAZIONE                                       ║  │
│  ║     │      │  [Badge FIPSAS Regione - Codice]                         ║  │
│  ║     └──────┘                                                          ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │                                      │  │                              │  │
│  │  📊 STATISTICHE                      │  │  📧 CONTATTI                 │  │
│  │  ┌────────────┐  ┌────────────┐     │  │                              │  │
│  │  │ 🏆 5       │  │ 👥 12      │     │  │  ✉️ info@associazione.it    │  │
│  │  │ Tornei    │  │ Membri     │     │  │  📞 +39 123 456 7890        │  │
│  │  └────────────┘  └────────────┘     │  │  🌐 www.associazione.it     │  │
│  │                                      │  │  📍 Via Roma 1, 00100 Roma  │  │
│  └─────────────────────────────────────┘  │                              │  │
│                                            └──────────────────────────────┘  │
│  ┌─────────────────────────────────────┐                                    │
│  │                                      │  ┌──────────────────────────────┐  │
│  │  📝 CHI SIAMO                        │  │  🔗 SOCIAL                   │  │
│  │                                      │  │                              │  │
│  │  [Descrizione associazione...]       │  │  [Facebook] [Instagram]     │  │
│  │                                      │  │  [YouTube]                   │  │
│  └─────────────────────────────────────┘  │                              │  │
│                                            └──────────────────────────────┘  │
│  ┌─────────────────────────────────────┐                                    │
│  │                                      │  ┌──────────────────────────────┐  │
│  │  🏆 TORNEI RECENTI                   │  │                              │  │
│  │                                      │  │  🐟 AFFILIAZIONE FIPSAS      │  │
│  │  ┌────────────────────────────────┐ │  │                              │  │
│  │  │ 🖼️ │ Torneo 1    [In Corso]   │ │  │  Codice: 12345              │  │
│  │  │    │ 📅 Data  📍 Luogo        │ │  │  Regione: Campania          │  │
│  │  └────────────────────────────────┘ │  │                              │  │
│  │  ┌────────────────────────────────┐ │  │  [Scopri di piu su FIPSAS]  │  │
│  │  │ 🖼️ │ Torneo 2    [Completato] │ │  │                              │  │
│  │  │    │ 📅 Data  📍 Luogo        │ │  └──────────────────────────────┘  │
│  │  └────────────────────────────────┘ │                                    │
│  │                                      │  ╔══════════════════════════════╗  │
│  └─────────────────────────────────────┘  ║  🎯 VUOI PARTECIPARE?        ║  │
│                                            ║                              ║  │
│                                            ║  Registrati per iscriverti   ║  │
│                                            ║  ai tornei!                  ║  │
│                                            ║                              ║  │
│                                            ║  [REGISTRATI GRATIS]         ║  │
│                                            ╚══════════════════════════════╝  │
│                                            ▲                                 │
│                                            │                                 │
│                                    Usa colori primario/secondario            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Guida Passo-Passo: Configurazione Completa

#### STEP 1: Logo e Banner

```
┌─────────────────────────────────────────────────────────────────┐
│  TAB: BRANDING                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🖼️ LOGO E IMMAGINI                                             │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  URL Logo:                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ https://i.imgur.com/tuologo.png                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Anteprima:  ┌────────┐                                         │
│              │  LOGO  │                                         │
│              │ 200x200│                                         │
│              └────────┘                                         │
│                                                                  │
│  URL Banner:                                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ https://i.imgur.com/tuobanner.jpg                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Anteprima:  ┌──────────────────────────────────────────────┐   │
│              │            BANNER 1920x400                    │   │
│              └──────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Specifiche Logo:**
| Aspetto | Raccomandazione |
|---------|-----------------|
| Formato | PNG (con trasparenza) o SVG |
| Dimensioni | 200x200 px minimo, 500x500 px ideale |
| Aspect ratio | 1:1 (quadrato) |
| Sfondo | Trasparente per migliore integrazione |
| Peso | < 500 KB |

**Specifiche Banner:**
| Aspetto | Raccomandazione |
|---------|-----------------|
| Formato | JPG (per foto) o PNG |
| Dimensioni | 1920x400 px ideale |
| Aspect ratio | ~5:1 (panoramico) |
| Contenuto | Evitare testo importante ai bordi |
| Peso | < 1 MB |

**Come ottenere URL immagini:**

```
METODO 1: Imgur (Consigliato)
────────────────────────────────────────────
1. Vai su https://imgur.com
2. Clicca "New post"
3. Carica la tua immagine
4. Click destro sull'immagine → "Copia indirizzo immagine"
5. Incolla l'URL (es: https://i.imgur.com/abc123.png)

METODO 2: Google Drive
────────────────────────────────────────────
1. Carica immagine su Google Drive
2. Click destro → "Condividi" → "Chiunque con il link"
3. Copia l'ID del file dall'URL
4. Usa formato: https://drive.google.com/uc?id=FILE_ID

METODO 3: Hosting proprio
────────────────────────────────────────────
1. Carica su tuo server/CDN
2. Usa URL diretto al file
```

#### STEP 2: Colori

```
┌─────────────────────────────────────────────────────────────────┐
│  🎨 COLORI                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Colore Primario:                                                │
│  ┌────┐ ┌───────────────────────────────────────────────────┐   │
│  │████│ │ #059669                                            │   │
│  └────┘ └───────────────────────────────────────────────────┘   │
│    ▲                                                             │
│    └── Color picker (clicca per scegliere)                      │
│                                                                  │
│  Colore Secondario:                                              │
│  ┌────┐ ┌───────────────────────────────────────────────────┐   │
│  │████│ │ #047857                                            │   │
│  └────┘ └───────────────────────────────────────────────────┘   │
│                                                                  │
│  Anteprima:                                                      │
│  ┌────────────┐  ┌────────────┐                                 │
│  │  Primario  │  │ Secondario │                                 │
│  │  #059669   │  │  #047857   │                                 │
│  └────────────┘  └────────────┘                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Dove vengono usati i colori:**

```
COLORE PRIMARIO (#059669 nell'esempio)
═══════════════════════════════════════
• Header/Banner della pagina
• Icone nelle card statistiche
• Badge e pulsanti
• Link hover
• Bordo card CTA

COLORE SECONDARIO (#047857 nell'esempio)
═══════════════════════════════════════
• Gradient del banner (da primario a secondario)
• Card CTA "Vuoi partecipare?"
• Elementi di accento
```

**Palette colori consigliate per associazioni di pesca:**

```
TEMA BLU OCEANO                    TEMA VERDE NATURA
─────────────────────              ─────────────────────
Primario:   #0066CC                Primario:   #059669
Secondario: #004499                Secondario: #047857

TEMA ARANCIO TRAMONTO              TEMA BLU NOTTE
─────────────────────              ─────────────────────
Primario:   #EA580C                Primario:   #1E40AF
Secondario: #C2410C                Secondario: #1E3A8A

TEMA TURCHESE MARE                 TEMA ROSSO CORALLO
─────────────────────              ─────────────────────
Primario:   #0891B2                Primario:   #DC2626
Secondario: #0E7490                Secondario: #B91C1C
```

#### STEP 3: Descrizione

```
┌─────────────────────────────────────────────────────────────────┐
│  📝 DESCRIZIONE ASSOCIAZIONE                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Nome Associazione:                                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Pesca Sportiva Napoli                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Descrizione:                                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ L'Associazione Pesca Sportiva Napoli nasce nel 1985 con    ││
│  │ l'obiettivo di promuovere la pesca sportiva nel Golfo di   ││
│  │ Napoli.                                                      ││
│  │                                                              ││
│  │ Organizziamo tornei durante tutto l'anno, dalle competizioni││
│  │ di traina costiera alle gare di bolentino, passando per     ││
│  │ l'eging e il vertical jigging.                              ││
│  │                                                              ││
│  │ La nostra sede si trova nel Porto di Napoli, dove i soci   ││
│  │ possono usufruire di servizi dedicati e partecipare agli   ││
│  │ eventi sociali.                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Suggerimento: Scrivi 3-5 paragrafi che descrivano storia,      │
│  attivita e valori della tua associazione.                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### STEP 4: Contatti (Tab Contatti)

```
┌─────────────────────────────────────────────────────────────────┐
│  TAB: CONTATTI                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📧 INFORMAZIONI DI CONTATTO                                     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Email:                              Telefono:                   │
│  ┌─────────────────────────┐        ┌─────────────────────────┐ │
│  │ ✉️ info@pescnapoli.it  │        │ 📞 +39 081 123 4567    │ │
│  └─────────────────────────┘        └─────────────────────────┘ │
│                                                                  │
│  Sito Web:                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🌐 https://www.pescasportivanapolisport.it                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Indirizzo Sede:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📍 Molo Beverello, Porto di Napoli                          ││
│  │    80133 Napoli (NA)                                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### STEP 5: Social Media (Tab Social)

```
┌─────────────────────────────────────────────────────────────────┐
│  TAB: SOCIAL                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔗 SOCIAL MEDIA                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Facebook:                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📘 https://facebook.com/pescasportivanapolisport            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Instagram:                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📸 https://instagram.com/pescanapolisport                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  YouTube:                                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🎬 https://youtube.com/@pescanapolisport                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ℹ️ I link appariranno come pulsanti nella sidebar             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### STEP 6: FIPSAS (Tab FIPSAS)

```
┌─────────────────────────────────────────────────────────────────┐
│  TAB: FIPSAS                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🐟 AFFILIAZIONE FIPSAS                                          │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Codice FIPSAS:                      Regione FIPSAS:            │
│  ┌─────────────────────────┐        ┌─────────────────────────┐ │
│  │ NA-0123                 │        │ Campania                │ │
│  └─────────────────────────┘        └─────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ℹ️ NOTA: I dati FIPSAS verranno mostrati sulla pagina      ││
│  │    pubblica dell'associazione e nei PDF delle classifiche  ││
│  │    ufficiali.                                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.4 Esempio Completo di Configurazione

Ecco un esempio completo di configurazione branding per un'associazione:

```json
{
  "name": "Pesca Sportiva Napoli",
  "slug": "pescanapolisport",
  "logo": "https://i.imgur.com/abc123logo.png",
  "bannerImage": "https://i.imgur.com/xyz789banner.jpg",
  "primaryColor": "#059669",
  "secondaryColor": "#047857",
  "description": "L'Associazione Pesca Sportiva Napoli nasce nel 1985...",
  "contactEmail": "info@pescasportivanapolisport.it",
  "contactPhone": "+39 081 123 4567",
  "website": "https://www.pescasportivanapolisport.it",
  "address": "Molo Beverello, Porto di Napoli\n80133 Napoli (NA)",
  "socialFacebook": "https://facebook.com/pescasportivanapolisport",
  "socialInstagram": "https://instagram.com/pescanapolisport",
  "socialYoutube": "https://youtube.com/@pescanapolisport",
  "fipsasCode": "NA-0123",
  "fipsasRegion": "Campania"
}
```

### 10.5 Risultato Finale

Dopo aver configurato tutti i campi, la tua pagina pubblica apparira cosi:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ URL: https://tournamentmaster.app/it/associazioni/pescanapolisport          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║  │
│  ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ BANNER PERSONALIZZATO ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║  │
│  ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (foto mare/barca/pesca) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║  │
│  ║                                                                        ║  │
│  ║     ┌────────┐                                                        ║  │
│  ║     │  🐟    │  Pesca Sportiva Napoli                                 ║  │
│  ║     │  LOGO  │  ┌────────────────────────────────┐                    ║  │
│  ║     └────────┘  │ FIPSAS Campania - NA-0123     │                    ║  │
│  ║                 └────────────────────────────────┘                    ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  🏠 Torna alla Home                                                         │
│                                                                              │
│  ┌───────────────────────────────────────┐  ┌────────────────────────────┐  │
│  │ ┌─────────────┐  ┌─────────────┐     │  │ 📧 Contatti               │  │
│  │ │ 🏆 5        │  │ 👥 12       │     │  │                            │  │
│  │ │ Tornei     │  │ Membri      │     │  │ ✉️ info@pescasportiva...  │  │
│  │ │ Organizzati│  │             │     │  │ 📞 +39 081 123 4567       │  │
│  │ └─────────────┘  └─────────────┘     │  │ 🌐 www.pescasportiva...   │  │
│  └───────────────────────────────────────┘  │ 📍 Molo Beverello...      │  │
│                                              └────────────────────────────┘  │
│  ┌───────────────────────────────────────┐                                  │
│  │ 👥 Chi Siamo                          │  ┌────────────────────────────┐  │
│  │                                        │  │ 🔗 Social                 │  │
│  │ L'Associazione Pesca Sportiva Napoli  │  │                            │  │
│  │ nasce nel 1985 con l'obiettivo di     │  │ [📘 Facebook]             │  │
│  │ promuovere la pesca sportiva nel      │  │ [📸 Instagram]            │  │
│  │ Golfo di Napoli...                    │  │ [🎬 YouTube]              │  │
│  │                                        │  │                            │  │
│  └───────────────────────────────────────┘  └────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────┐  ┌────────────────────────────┐  │
│  │ 🏆 Tornei                              │  │ 🐟 Affiliazione FIPSAS    │  │
│  │ Gli ultimi tornei organizzati         │  │                            │  │
│  │                                        │  │ Codice: NA-0123           │  │
│  │ ┌──────────────────────────────────┐  │  │ Regione: Campania         │  │
│  │ │🖼️│ Winter Cup Napoli    In Corso │  │  │                            │  │
│  │ │  │ 📅 2 gen 2026 📍 Marina...   │  │  │ [Scopri di piu su FIPSAS] │  │
│  │ │  │ [Eging]                       │  │  │                            │  │
│  │ └──────────────────────────────────┘  │  └────────────────────────────┘  │
│  │ ┌──────────────────────────────────┐  │                                  │
│  │ │🖼️│ Trofeo Primavera  In Programma│  │  ╔════════════════════════════╗  │
│  │ │  │ 📅 5 apr 2025 📍 Porto...    │  │  ║ 🎯 Vuoi partecipare?      ║  │
│  │ │  │ [Big Game]                    │  │  ║                            ║  │
│  │ └──────────────────────────────────┘  │  ║ Registrati su Tournament   ║  │
│  │                                        │  ║ Master per iscriverti ai   ║  │
│  └───────────────────────────────────────┘  ║ tornei di questa associaz. ║  │
│                                              ║                            ║  │
│                                              ║ [═══ REGISTRATI GRATIS ══] ║  │
│                                              ╚════════════════════════════╝  │
│                                              ▲                               │
│                                              │ Colori: #059669 → #047857    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.6 Checklist Finale

Prima di salvare, verifica di aver completato:

```
BRANDING
─────────────────────────────────────────────
☑️ Logo caricato (URL funzionante)
☑️ Banner caricato (URL funzionante)
☑️ Colore primario scelto
☑️ Colore secondario scelto
☑️ Nome associazione corretto
☑️ Descrizione scritta

CONTATTI
─────────────────────────────────────────────
☑️ Email di contatto
☑️ Numero telefono (opzionale)
☑️ Sito web (opzionale)
☑️ Indirizzo sede (opzionale)

SOCIAL
─────────────────────────────────────────────
☑️ Link Facebook (opzionale)
☑️ Link Instagram (opzionale)
☑️ Link YouTube (opzionale)

FIPSAS
─────────────────────────────────────────────
☑️ Codice affiliazione
☑️ Regione

AZIONI FINALI
─────────────────────────────────────────────
☑️ Clicca "Anteprima" per verificare
☑️ Clicca "Salva Modifiche"
☑️ Condividi il link pubblico!
```

### 10.7 Best Practices

**Logo:**
- Usa un logo quadrato per migliore resa
- PNG con trasparenza funziona meglio
- Evita loghi troppo dettagliati (si vedranno piccoli)

**Banner:**
- Scegli foto ad alta risoluzione
- Evita testo sovrapposto (potrebbe essere coperto)
- Preferisci immagini orizzontali panoramiche
- Il soggetto principale deve essere al centro

**Colori:**
- Scegli colori che rispecchiano l'identita dell'associazione
- Assicurati che ci sia abbastanza contrasto
- Il colore secondario dovrebbe essere piu scuro del primario
- Evita colori troppo chiari (scarsa leggibilita)

**Descrizione:**
- Scrivi in prima persona plurale ("Noi siamo...")
- Includi la storia dell'associazione
- Menziona le attivita principali
- Mantieni un tono professionale ma accogliente

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
