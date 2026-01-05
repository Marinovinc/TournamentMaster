# Proposta Sidebar Contestuale - TournamentMaster

**Data:** 2026-01-04
**Versione:** 1.1
**Stato:** Proposta per revisione

---

## PRINCIPIO FONDAMENTALE

```
┌─────────────────────────────────────────────────────────────┐
│  VOCI VISIBILI = Filtro RUOLO  ×  Filtro CONTESTO PAGINA   │
└─────────────────────────────────────────────────────────────┘
```

**Ordine di applicazione:**
1. **STEP 1 - Filtro RUOLO**: L'utente può vedere questa voce? (basato su ruolo)
2. **STEP 2 - Filtro CONTESTO**: La voce è pertinente alla pagina corrente? (espansa/collassata)

**Esempio:**
- PARTICIPANT su `/dashboard/tournaments`:
  - Step 1: Può vedere Tornei ✅, NON può vedere Admin ❌
  - Step 2: Sezione TORNEI espansa, altre collassate
  - Risultato: Vede solo TORNEI espansa con "Tornei" e "Strike Live"

---

## 1. Situazione Attuale

### Voci Sidebar Esistenti

| # | Voce | Icona | Path | Ruoli Autorizzati |
|---|------|-------|------|-------------------|
| 1 | Dashboard | LayoutDashboard | `/dashboard` | Tutti |
| 2 | Gestione Associazioni | Building2 | `/dashboard/super-admin` | SUPER_ADMIN |
| 3 | Admin | Settings | `/dashboard/admin` | SUPER_ADMIN, TENANT_ADMIN, PRESIDENT, ORGANIZER |
| 4 | Catture da Validare | CheckCircle | `/dashboard/judge` | SUPER_ADMIN, TENANT_ADMIN, PRESIDENT, ORGANIZER, JUDGE |
| 5 | Barche/Team | Ship | `/dashboard/teams` | SUPER_ADMIN, TENANT_ADMIN, PRESIDENT, ORGANIZER, JUDGE |
| 6 | Strike Live | Zap | `/dashboard/strikes` | SUPER_ADMIN, TENANT_ADMIN, PRESIDENT, ORGANIZER, JUDGE |
| 7 | Tornei | Trophy | `/dashboard/tournaments` | SUPER_ADMIN, TENANT_ADMIN, PRESIDENT, ORGANIZER |
| 8 | Utenti | Users | `/dashboard/users` | SUPER_ADMIN, TENANT_ADMIN, PRESIDENT |
| 9 | Report | BarChart3 | `/dashboard/reports` | SUPER_ADMIN, TENANT_ADMIN, PRESIDENT, ORGANIZER |
| 10 | Branding | Palette | `/dashboard/admin/branding` | SUPER_ADMIN, TENANT_ADMIN, PRESIDENT |

### Problema

Tutte le voci (filtrate solo per ruolo) sono sempre visibili, creando una sidebar affollata che non guida l'utente nel contesto corrente.

---

## 2. Proposta: Raggruppamento per Sezioni

### Struttura Proposta

```
┌─────────────────────────────────┐
│ 🏠 Dashboard                    │  ← Sempre visibile
├─────────────────────────────────┤
│ 🏆 TORNEI                       │  ← Sezione collassabile
│    ├─ Tornei                    │
│    ├─ Strike Live               │
│    └─ Classifiche (nuovo)       │
├─────────────────────────────────┤
│ 📋 GESTIONE GARE                │  ← Sezione collassabile
│    ├─ Catture da Validare       │
│    ├─ Barche/Team               │
│    └─ Report                    │
├─────────────────────────────────┤
│ ⚙️ AMMINISTRAZIONE              │  ← Sezione collassabile
│    ├─ Impostazioni              │
│    ├─ Utenti                    │
│    ├─ Branding                  │
│    └─ Pagamenti                 │
├─────────────────────────────────┤
│ 🏢 PIATTAFORMA                  │  ← Solo SUPER_ADMIN
│    └─ Gestione Associazioni     │
└─────────────────────────────────┘
```

---

## 3. Mappa Voci per Pagina

### Legenda Visibilità

| Simbolo | Significato |
|---------|-------------|
| ✅ | Sempre visibile (in sidebar) |
| 🔵 | Visibile ed evidenziato (pagina corrente) |
| 🔶 | Visibile nella stessa sezione |
| ⚪ | Collassato/nascosto (altra sezione) |
| ❌ | Non visibile (ruolo non autorizzato) |

---

### 3.1 Dashboard Home (`/dashboard`)

**Contesto:** Panoramica generale, punto di partenza

| Voce | Visibilità | Note |
|------|------------|------|
| Dashboard | 🔵 | Pagina corrente |
| **TORNEI** | ✅ | Sezione espansa |
| └─ Tornei | 🔶 | Quick access |
| └─ Strike Live | 🔶 | Quick access |
| **GESTIONE GARE** | ✅ | Sezione espansa |
| └─ Catture da Validare | 🔶 | Con badge count |
| └─ Barche/Team | 🔶 | |
| └─ Report | 🔶 | |
| **AMMINISTRAZIONE** | ⚪ | Sezione collassata |
| **PIATTAFORMA** | ⚪ | Solo header visibile |

**Razionale:** Dalla home l'utente vede le sezioni operative (Tornei, Gestione) espanse, mentre Admin è collassato.

---

### 3.2 Tornei (`/dashboard/tournaments`)

**Contesto:** Gestione tornei dell'associazione

| Voce | Visibilità | Note |
|------|------------|------|
| Dashboard | ✅ | Link home |
| **TORNEI** | ✅ | Sezione espansa |
| └─ Tornei | 🔵 | Pagina corrente |
| └─ Strike Live | 🔶 | Correlato |
| └─ Classifiche | 🔶 | Correlato |
| **GESTIONE GARE** | ⚪ | Collassata |
| **AMMINISTRAZIONE** | ⚪ | Collassata |
| **PIATTAFORMA** | ⚪ | Collassata |

**Razionale:** Focus sui tornei, le altre sezioni sono accessibili ma non in primo piano.

---

### 3.3 Strike Live (`/dashboard/strikes`)

**Contesto:** Monitoraggio catture in tempo reale

| Voce | Visibilità | Note |
|------|------------|------|
| Dashboard | ✅ | Link home |
| **TORNEI** | ✅ | Sezione espansa |
| └─ Tornei | 🔶 | Correlato |
| └─ Strike Live | 🔵 | Pagina corrente |
| └─ Classifiche | 🔶 | Correlato |
| **GESTIONE GARE** | 🔶 | Semi-espansa |
| └─ Catture da Validare | 🔶 | Fortemente correlato |
| **AMMINISTRAZIONE** | ⚪ | Collassata |

**Razionale:** Strike Live è correlato sia a Tornei che a Validazione catture.

---

### 3.4 Catture da Validare (`/dashboard/judge`)

**Contesto:** Validazione catture dei partecipanti

| Voce | Visibilità | Note |
|------|------------|------|
| Dashboard | ✅ | Link home |
| **TORNEI** | 🔶 | Semi-espansa |
| └─ Strike Live | 🔶 | Correlato |
| **GESTIONE GARE** | ✅ | Sezione espansa |
| └─ Catture da Validare | 🔵 | Pagina corrente |
| └─ Barche/Team | 🔶 | Per verificare team |
| └─ Report | 🔶 | Per statistiche |
| **AMMINISTRAZIONE** | ⚪ | Collassata |

**Razionale:** Focus sulla validazione con accesso rapido a team e report correlati.

---

### 3.5 Barche/Team (`/dashboard/teams`)

**Contesto:** Gestione equipaggi e imbarcazioni

| Voce | Visibilità | Note |
|------|------------|------|
| Dashboard | ✅ | Link home |
| **TORNEI** | 🔶 | Per vedere iscrizioni |
| └─ Tornei | 🔶 | |
| **GESTIONE GARE** | ✅ | Sezione espansa |
| └─ Catture da Validare | 🔶 | Catture del team |
| └─ Barche/Team | 🔵 | Pagina corrente |
| └─ Report | 🔶 | Statistiche team |
| **AMMINISTRAZIONE** | ⚪ | Collassata |

---

### 3.6 Report (`/dashboard/reports`)

**Contesto:** Analisi e statistiche

| Voce | Visibilità | Note |
|------|------------|------|
| Dashboard | ✅ | Link home |
| **TORNEI** | 🔶 | Dati tornei |
| └─ Tornei | 🔶 | |
| **GESTIONE GARE** | ✅ | Sezione espansa |
| └─ Catture da Validare | 🔶 | Dati catture |
| └─ Barche/Team | 🔶 | Dati team |
| └─ Report | 🔵 | Pagina corrente |
| **AMMINISTRAZIONE** | ⚪ | Collassata |

---

### 3.7 Admin/Impostazioni (`/dashboard/admin`)

**Contesto:** Configurazione associazione

| Voce | Visibilità | Note |
|------|------------|------|
| Dashboard | ✅ | Link home |
| **TORNEI** | ⚪ | Collassata |
| **GESTIONE GARE** | ⚪ | Collassata |
| **AMMINISTRAZIONE** | ✅ | Sezione espansa |
| └─ Impostazioni | 🔵 | Pagina corrente |
| └─ Utenti | 🔶 | Correlato |
| └─ Branding | 🔶 | Correlato |
| └─ Pagamenti | 🔶 | Correlato |
| **PIATTAFORMA** | ⚪ | Collassata |

**Razionale:** In area admin, focus sulle voci amministrative.

---

### 3.8 Utenti (`/dashboard/users`)

**Contesto:** Gestione membri associazione

| Voce | Visibilità | Note |
|------|------------|------|
| Dashboard | ✅ | Link home |
| **TORNEI** | ⚪ | Collassata |
| **GESTIONE GARE** | 🔶 | |
| └─ Barche/Team | 🔶 | Utenti → Team |
| **AMMINISTRAZIONE** | ✅ | Sezione espansa |
| └─ Impostazioni | 🔶 | |
| └─ Utenti | 🔵 | Pagina corrente |
| └─ Branding | ⚪ | Non correlato |
| └─ Pagamenti | 🔶 | Pagamenti utenti |

---

### 3.9 Branding (`/dashboard/admin/branding`)

**Contesto:** Personalizzazione grafica associazione

| Voce | Visibilità | Note |
|------|------------|------|
| Dashboard | ✅ | Link home |
| **TORNEI** | ⚪ | Collassata |
| **GESTIONE GARE** | ⚪ | Collassata |
| **AMMINISTRAZIONE** | ✅ | Sezione espansa |
| └─ Impostazioni | 🔶 | |
| └─ Utenti | ⚪ | Non correlato |
| └─ Branding | 🔵 | Pagina corrente |
| └─ Pagamenti | ⚪ | Non correlato |

**Razionale:** Branding è isolato, non serve vedere utenti/pagamenti.

---

### 3.10 Pagamenti (`/dashboard/admin/payments`)

**Contesto:** Gestione quote e pagamenti

| Voce | Visibilità | Note |
|------|------------|------|
| Dashboard | ✅ | Link home |
| **TORNEI** | 🔶 | Quote tornei |
| └─ Tornei | 🔶 | |
| **GESTIONE GARE** | ⚪ | Collassata |
| **AMMINISTRAZIONE** | ✅ | Sezione espansa |
| └─ Impostazioni | 🔶 | |
| └─ Utenti | 🔶 | Pagamenti utenti |
| └─ Branding | ⚪ | Non correlato |
| └─ Pagamenti | 🔵 | Pagina corrente |

---

### 3.11 Gestione Associazioni (`/dashboard/super-admin`)

**Contesto:** Super Admin - gestione multi-tenant

| Voce | Visibilità | Note |
|------|------------|------|
| Dashboard | ✅ | Link home |
| **TORNEI** | ⚪ | Collassata |
| **GESTIONE GARE** | ⚪ | Collassata |
| **AMMINISTRAZIONE** | ⚪ | Collassata |
| **PIATTAFORMA** | ✅ | Sezione espansa |
| └─ Gestione Associazioni | 🔵 | Pagina corrente |
| └─ Statistiche Globali | 🔶 | Nuovo suggerito |
| └─ Configurazione | 🔶 | Nuovo suggerito |

**Razionale:** Super Admin ha contesto completamente diverso, focus sulla piattaforma.

---

## 4. Matrice Riassuntiva

### Voci per Sezione Corrente

| Pagina Corrente | TORNEI | GESTIONE | ADMIN | PIATTAFORMA |
|-----------------|--------|----------|-------|-------------|
| Dashboard | ✅ Espansa | ✅ Espansa | ⚪ Collassata | ⚪ Collassata |
| Tornei | ✅ Espansa | ⚪ Collassata | ⚪ Collassata | ⚪ Collassata |
| Strike Live | ✅ Espansa | 🔶 Semi | ⚪ Collassata | ⚪ Collassata |
| Catture Validare | 🔶 Semi | ✅ Espansa | ⚪ Collassata | ⚪ Collassata |
| Barche/Team | 🔶 Semi | ✅ Espansa | ⚪ Collassata | ⚪ Collassata |
| Report | 🔶 Semi | ✅ Espansa | ⚪ Collassata | ⚪ Collassata |
| Admin | ⚪ Collassata | ⚪ Collassata | ✅ Espansa | ⚪ Collassata |
| Utenti | ⚪ Collassata | 🔶 Semi | ✅ Espansa | ⚪ Collassata |
| Branding | ⚪ Collassata | ⚪ Collassata | ✅ Espansa | ⚪ Collassata |
| Pagamenti | 🔶 Semi | ⚪ Collassata | ✅ Espansa | ⚪ Collassata |
| Super Admin | ⚪ Collassata | ⚪ Collassata | ⚪ Collassata | ✅ Espansa |

---

## 5. Comportamento Sezioni

### 5.1 Stati Sezione

| Stato | Visualizzazione | Comportamento Click |
|-------|-----------------|---------------------|
| **Espansa** | Header + tutte le voci | Click header → Collassa |
| **Semi-espansa** | Header + voci correlate | Click header → Espande tutto |
| **Collassata** | Solo header | Click header → Espande |

### 5.2 Persistenza Stato

- Lo stato delle sezioni si resetta quando si cambia sezione principale
- Opzionale: salvare preferenza utente in localStorage

### 5.3 Animazioni

```css
/* Transizione espansione/collasso */
.sidebar-section-content {
  transition: max-height 0.2s ease-out, opacity 0.2s ease-out;
}

.sidebar-section-content.collapsed {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

.sidebar-section-content.expanded {
  max-height: 500px;
  opacity: 1;
}
```

---

## 6. Sidebar per Ruolo Utente

### 6.1 Matrice Ruoli vs Voci (Autorizzazioni)

| Voce | SUPER_ADMIN | TENANT_ADMIN | PRESIDENT | ORGANIZER | JUDGE | PARTICIPANT |
|------|-------------|--------------|-----------|-----------|-------|-------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gestione Associazioni | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Admin/Impostazioni | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Catture da Validare | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Barche/Team | ✅ | ✅ | ✅ | ✅ | ✅ | ✅* |
| Strike Live | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tornei | ✅ | ✅ | ✅ | ✅ | ✅ | ✅* |
| Utenti | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Report | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Branding | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Pagamenti | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

*\* PARTICIPANT vede solo i propri team/tornei*

---

### 6.2 Sezioni Visibili per Ruolo

| Ruolo | TORNEI | GESTIONE | ADMIN | PIATTAFORMA |
|-------|--------|----------|-------|-------------|
| SUPER_ADMIN | ✅ Completa | ✅ Completa | ✅ Completa | ✅ Completa |
| TENANT_ADMIN | ✅ Completa | ✅ Completa | ✅ Completa | ❌ Non visibile |
| PRESIDENT | ✅ Completa | ✅ Completa | ✅ Completa | ❌ Non visibile |
| ORGANIZER | ✅ Completa | ✅ Completa | ⚠️ Solo Impostazioni | ❌ Non visibile |
| JUDGE | ✅ Completa | ⚠️ No Report | ❌ Non visibile | ❌ Non visibile |
| PARTICIPANT | ⚠️ Solo propri | ❌ Non visibile | ❌ Non visibile | ❌ Non visibile |

---

### 6.3 Mockup Sidebar per Ogni Ruolo

#### SUPER_ADMIN - Dashboard Home

```
┌──────────────────────────────────┐
│ 🐟 TournamentMaster              │
├──────────────────────────────────┤
│ 🏠 Dashboard              ← ●    │
│                                  │
│ ▼ 🏆 TORNEI                      │
│    ├─ Tornei                     │
│    └─ Strike Live                │
│                                  │
│ ▼ 📋 GESTIONE GARE               │
│    ├─ Catture da Validare  (3)   │
│    ├─ Barche/Team                │
│    └─ Report                     │
│                                  │
│ ▶ ⚙️ AMMINISTRAZIONE             │
│    (Impostazioni, Utenti,        │
│     Branding, Pagamenti)         │
│                                  │
│ ▶ 🏢 PIATTAFORMA                 │
│    (Gestione Associazioni)       │
├──────────────────────────────────┤
│ 👤 Nome Cognome                  │
│    SUPER ADMIN                   │
└──────────────────────────────────┘
```

#### TENANT_ADMIN / PRESIDENT - Dashboard Home

```
┌──────────────────────────────────┐
│ 🐟 TournamentMaster              │
├──────────────────────────────────┤
│ 🏠 Dashboard              ← ●    │
│                                  │
│ ▼ 🏆 TORNEI                      │
│    ├─ Tornei                     │
│    └─ Strike Live                │
│                                  │
│ ▼ 📋 GESTIONE GARE               │
│    ├─ Catture da Validare  (3)   │
│    ├─ Barche/Team                │
│    └─ Report                     │
│                                  │
│ ▶ ⚙️ AMMINISTRAZIONE             │
│    (Impostazioni, Utenti,        │
│     Branding, Pagamenti)         │
│                                  │
│    ❌ PIATTAFORMA: non visibile  │
├──────────────────────────────────┤
│ 👤 Nome Cognome                  │
│    PRESIDENT                     │
└──────────────────────────────────┘
```

#### ORGANIZER - Dashboard Home

```
┌──────────────────────────────────┐
│ 🐟 TournamentMaster              │
├──────────────────────────────────┤
│ 🏠 Dashboard              ← ●    │
│                                  │
│ ▼ 🏆 TORNEI                      │
│    ├─ Tornei                     │
│    └─ Strike Live                │
│                                  │
│ ▼ 📋 GESTIONE GARE               │
│    ├─ Catture da Validare  (3)   │
│    ├─ Barche/Team                │
│    └─ Report                     │
│                                  │
│ ▶ ⚙️ AMMINISTRAZIONE             │
│    └─ Impostazioni               │
│    ❌ (Utenti, Branding,         │
│        Pagamenti: non visibili)  │
├──────────────────────────────────┤
│ 👤 Nome Cognome                  │
│    ORGANIZER                     │
└──────────────────────────────────┘
```

#### JUDGE - Dashboard Home

```
┌──────────────────────────────────┐
│ 🐟 TournamentMaster              │
├──────────────────────────────────┤
│ 🏠 Dashboard              ← ●    │
│                                  │
│ ▼ 🏆 TORNEI                      │
│    ├─ Tornei                     │
│    └─ Strike Live                │
│                                  │
│ ▼ 📋 GESTIONE GARE               │
│    ├─ Catture da Validare  (5)   │
│    └─ Barche/Team                │
│    ❌ (Report: non visibile)     │
│                                  │
│    ❌ AMMINISTRAZIONE: non vis.  │
├──────────────────────────────────┤
│ 👤 Nome Cognome                  │
│    JUDGE                         │
└──────────────────────────────────┘
```

#### PARTICIPANT - Dashboard Home

```
┌──────────────────────────────────┐
│ 🐟 TournamentMaster              │
├──────────────────────────────────┤
│ 🏠 Dashboard              ← ●    │
│                                  │
│ ▼ 🏆 I MIEI TORNEI               │
│    ├─ Tornei Iscritto            │
│    ├─ Strike Live                │
│    └─ Classifiche                │
│                                  │
│ ▼ 🚤 LA MIA BARCA                │
│    ├─ Il Mio Team                │
│    └─ Le Mie Catture             │
│                                  │
│    ❌ GESTIONE: non visibile     │
│    ❌ ADMIN: non visibile        │
├──────────────────────────────────┤
│ 👤 Nome Cognome                  │
│    PARTICIPANT                   │
└──────────────────────────────────┘
```

---

### 6.4 Voci Specifiche per PARTICIPANT

Il PARTICIPANT ha una sidebar semplificata con voci personalizzate:

| Sezione | Voce | Path | Descrizione |
|---------|------|------|-------------|
| I MIEI TORNEI | Tornei Iscritto | `/dashboard/my-tournaments` | Tornei a cui è iscritto |
| I MIEI TORNEI | Strike Live | `/dashboard/strikes` | Visualizzazione catture live |
| I MIEI TORNEI | Classifiche | `/dashboard/leaderboards` | Classifiche tornei |
| LA MIA BARCA | Il Mio Team | `/dashboard/my-team` | Dettagli equipaggio |
| LA MIA BARCA | Le Mie Catture | `/dashboard/my-catches` | Storico catture personali |

---

### 6.5 Tabella Completa: Ruolo × Pagina × Sezioni Espanse

| Ruolo | Pagina Corrente | TORNEI | GESTIONE | ADMIN | PIATTAFORMA |
|-------|-----------------|--------|----------|-------|-------------|
| **SUPER_ADMIN** | Dashboard | ▼ | ▼ | ▶ | ▶ |
| | Tornei | ▼ | ▶ | ▶ | ▶ |
| | Catture Validare | ▶ | ▼ | ▶ | ▶ |
| | Admin | ▶ | ▶ | ▼ | ▶ |
| | Super Admin | ▶ | ▶ | ▶ | ▼ |
| **TENANT_ADMIN** | Dashboard | ▼ | ▼ | ▶ | ❌ |
| | Tornei | ▼ | ▶ | ▶ | ❌ |
| | Admin | ▶ | ▶ | ▼ | ❌ |
| **PRESIDENT** | Dashboard | ▼ | ▼ | ▶ | ❌ |
| | Tornei | ▼ | ▶ | ▶ | ❌ |
| | Admin | ▶ | ▶ | ▼ | ❌ |
| **ORGANIZER** | Dashboard | ▼ | ▼ | ▶ | ❌ |
| | Tornei | ▼ | ▶ | ▶ | ❌ |
| | Admin | ▶ | ▶ | ▼* | ❌ |
| **JUDGE** | Dashboard | ▼ | ▼* | ❌ | ❌ |
| | Catture Validare | ▶ | ▼* | ❌ | ❌ |
| | Strike Live | ▼ | ▼* | ❌ | ❌ |
| **PARTICIPANT** | Dashboard | ▼** | ▼** | ❌ | ❌ |
| | I Miei Tornei | ▼** | ▶ | ❌ | ❌ |
| | La Mia Barca | ▶ | ▼** | ❌ | ❌ |

**Legenda:**
- ▼ = Sezione espansa
- ▶ = Sezione collassata
- ❌ = Sezione non visibile (ruolo non autorizzato)
- \* = Sezione parziale (alcune voci non visibili)
- \*\* = Sezione personalizzata per PARTICIPANT

---

## 7. Implementazione Suggerita

### 7.1 Struttura Dati

```typescript
interface SidebarSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  defaultExpanded?: boolean;
  roles?: string[];
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: number; // Per notifiche
  relatedPaths?: string[]; // Path correlati
}

const sidebarSections: SidebarSection[] = [
  {
    id: 'tornei',
    label: 'Tornei',
    icon: <Trophy />,
    items: [
      { href: '/dashboard/tournaments', label: 'Tornei', icon: <Trophy /> },
      { href: '/dashboard/strikes', label: 'Strike Live', icon: <Zap /> },
    ],
  },
  {
    id: 'gestione',
    label: 'Gestione Gare',
    icon: <ClipboardList />,
    items: [
      { href: '/dashboard/judge', label: 'Catture da Validare', icon: <CheckCircle />, badge: 3 },
      { href: '/dashboard/teams', label: 'Barche/Team', icon: <Ship /> },
      { href: '/dashboard/reports', label: 'Report', icon: <BarChart3 /> },
    ],
  },
  // ... altre sezioni
];
```

### 7.2 Logica Espansione Contestuale

```typescript
function getExpandedSections(pathname: string): string[] {
  const sectionMap: Record<string, string[]> = {
    '/dashboard': ['tornei', 'gestione'],
    '/dashboard/tournaments': ['tornei'],
    '/dashboard/strikes': ['tornei', 'gestione'],
    '/dashboard/judge': ['gestione', 'tornei'],
    '/dashboard/teams': ['gestione'],
    '/dashboard/reports': ['gestione'],
    '/dashboard/admin': ['admin'],
    '/dashboard/users': ['admin', 'gestione'],
    '/dashboard/admin/branding': ['admin'],
    '/dashboard/admin/payments': ['admin', 'tornei'],
    '/dashboard/super-admin': ['piattaforma'],
  };

  return sectionMap[pathname] || ['tornei', 'gestione'];
}
```

---

## 8. Mockup Visivo

### Dashboard Home (Super Admin)

```
┌──────────────────────────────────┐
│ 🐟 TournamentMaster              │
├──────────────────────────────────┤
│                                  │
│ 🏠 Dashboard              ← ●    │
│                                  │
│ ▼ 🏆 TORNEI                      │
│    ├─ Tornei                     │
│    └─ Strike Live                │
│                                  │
│ ▼ 📋 GESTIONE GARE               │
│    ├─ Catture da Validare  (3)   │
│    ├─ Barche/Team                │
│    └─ Report                     │
│                                  │
│ ▶ ⚙️ AMMINISTRAZIONE             │
│                                  │
│ ▶ 🏢 PIATTAFORMA                 │
│                                  │
├──────────────────────────────────┤
│ 👤 Crescenzo M.                  │
│    SUPER ADMIN                   │
│ [Logout]                         │
└──────────────────────────────────┘
```

### Pagina Admin (stessa utente)

```
┌──────────────────────────────────┐
│ 🐟 TournamentMaster              │
├──────────────────────────────────┤
│                                  │
│ 🏠 Dashboard                     │
│                                  │
│ ▶ 🏆 TORNEI                      │
│                                  │
│ ▶ 📋 GESTIONE GARE               │
│                                  │
│ ▼ ⚙️ AMMINISTRAZIONE             │
│    ├─ Impostazioni         ← ●   │
│    ├─ Utenti                     │
│    ├─ Branding                   │
│    └─ Pagamenti                  │
│                                  │
│ ▶ 🏢 PIATTAFORMA                 │
│                                  │
├──────────────────────────────────┤
│ 👤 Crescenzo M.                  │
│    SUPER ADMIN                   │
│ [Logout]                         │
└──────────────────────────────────┘
```

---

## 9. Prossimi Passi

1. **Approvazione** - Conferma struttura proposta
2. **Implementazione** - Modifica `dashboard/layout.tsx`
3. **Testing** - Verifica con tutti i ruoli
4. **Feedback** - Raccolta feedback utenti

---

## 10. Note Aggiuntive

### Considerazioni UX

- **Mobile**: Su mobile la sidebar è già a scomparsa, le sezioni collassabili migliorano la navigazione
- **Accessibilità**: Usare `aria-expanded` per indicare stato sezioni
- **Performance**: Lazy loading delle icone non visibili

### Possibili Evoluzioni Future

- **Preferiti**: Permettere all'utente di "pinnare" voci frequenti in cima
- **Ricerca**: Aggiungere campo ricerca rapida nella sidebar
- **Shortcuts**: Tasti rapidi per navigare (es. `T` per Tornei, `R` per Report)
