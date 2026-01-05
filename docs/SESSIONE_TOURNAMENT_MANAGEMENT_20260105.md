# Sessione di Sviluppo - Tournament Management System

**Data:** 5 Gennaio 2026
**Progetto:** TournamentMaster
**Modulo:** Gestione Tornei Dashboard

---

## Sommario Esecutivo

Questa sessione ha implementato un sistema completo di **Tournament Management Mode** che permette agli organizzatori di gestire un torneo specifico con una sidebar contestuale dedicata. Il sistema attiva automaticamente una modalità di gestione quando si entra nella pagina di un torneo, mostrando tutte le operazioni disponibili in base allo stato del torneo.

---

## Problemi Risolti

### 1. Bug "this.canManageTournament is not a function"

**Problema:** Quando un SUPER_ADMIN tentava di aprire le iscrizioni di un torneo, il sistema restituiva l'errore `this.canManageTournament is not a function`.

**Causa:** Nel file `tournament-lifecycle.service.ts`, i metodi statici usavano `this.canManageTournament()` per chiamare un altro metodo statico. Quando i metodi vengono esportati tramite un facade pattern, il contesto `this` non si riferisce più alla classe originale.

**Soluzione:** Modificato tutte le chiamate da:
```typescript
// Prima (broken)
const canManage = await this.canManageTournament(tournament, userId);

// Dopo (fixed)
const canManage = await TournamentLifecycleService.canManageTournament(tournament, userId);
```

**File modificato:** `backend/src/services/tournament/tournament-lifecycle.service.ts`

---

### 2. Script Avvio/Stop Backend

**Richiesta:** L'utente necessitava di script batch per avviare e fermare facilmente il server backend.

**Soluzione:** Creati due script batch:

#### START_BACKEND.bat
```batch
@echo off
title TournamentMaster Backend
cd /d "%~dp0"
echo Starting server on port 3001...
npm run dev
pause
```

#### STOP_BACKEND.bat
```batch
@echo off
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
echo Backend stopped.
```

**File creati:** `backend/START_BACKEND.bat`, `backend/STOP_BACKEND.bat`

---

### 3. Sistema Tournament Management Mode

**Richiesta:** L'utente voleva una sidebar contestuale per gestire i tornei con sezioni per: Partecipanti, Barche ed equipaggi, Ispettori di gara, Strike, etc.

**Soluzione Implementata:**

#### A. Nuova Pagina Gestione Torneo
**File:** `frontend/src/app/[locale]/dashboard/tournaments/[id]/page.tsx`

Caratteristiche:
- Attivazione automatica del Tournament Mode via localStorage
- Statistiche rapide (iscritti, catture, date, quota)
- Azioni rapide con bottoni dedicati
- Preview ultimi iscritti
- Informazioni dettagliate torneo

#### B. Sidebar Dinamica Contestuale
**File:** `frontend/src/app/[locale]/dashboard/layout.tsx`

Sezioni dinamiche basate su `activeTournament`:

| Sezione | Condizione | Contenuto |
|---------|------------|-----------|
| Gestione Torneo | Sempre (se torneo attivo) | Panoramica, Partecipanti, Barche/Equipaggi, Ispettori |
| Operazioni Live | status === "ONGOING" | Strike Live, Catture da Validare |
| Statistiche Torneo | status === "COMPLETED" | Storico Strike, Storico Catture |

#### C. Entry Point nel Menu Tornei
**File:** `frontend/src/app/[locale]/dashboard/tournaments/page.tsx`

- Aggiunta voce "Gestisci" nel dropdown menu
- Naviga a `/dashboard/tournaments/[id]`
- Attiva automaticamente il Tournament Mode

---

## Architettura Implementata

```
┌─────────────────────────────────────────────────────────────────┐
│                      TOURNAMENTS LIST                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Dropdown Menu:                                          │    │
│  │  - Visualizza (pagina pubblica)                          │    │
│  │  - Gestisci ← NUOVO (entra in management mode)           │    │
│  │  - Operazioni Live/Statistiche                           │    │
│  │  - Modifica, Elimina, etc.                               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Click "Gestisci"
┌─────────────────────────────────────────────────────────────────┐
│            TOURNAMENT MANAGEMENT PAGE                            │
│  /dashboard/tournaments/[id]                                     │
│                                                                  │
│  useEffect:                                                      │
│    localStorage.setItem("activeTournament", {...})               │
│    window.dispatchEvent(new Event("tournamentChanged"))          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Event dispatched
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD LAYOUT                              │
│                                                                  │
│  useEffect: listens to "tournamentChanged"                       │
│    → updates activeTournament state                              │
│    → renders tournamentSections in sidebar                       │
│                                                                  │
│  ┌──────────────┐  ┌─────────────────────────────────────────┐  │
│  │   SIDEBAR    │  │              MAIN CONTENT               │  │
│  │              │  │                                         │  │
│  │ [Banner]     │  │  Tournament Management Page             │  │
│  │ Torneo Attivo│  │  - Stats, Actions, Participants        │  │
│  │              │  │                                         │  │
│  │ ─────────────│  │                                         │  │
│  │ Gestione     │  │                                         │  │
│  │ - Panoramica │  │                                         │  │
│  │ - Partecip.  │  │                                         │  │
│  │ - Barche     │  │                                         │  │
│  │ - Ispettori  │  │                                         │  │
│  │              │  │                                         │  │
│  │ Ops Live     │  │                                         │  │
│  │ - Strike     │  │                                         │  │
│  │ - Catture    │  │                                         │  │
│  └──────────────┘  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Machine Tornei

```
     ┌──────────┐
     │  DRAFT   │
     └────┬─────┘
          │ publish()
          ▼
     ┌──────────┐
     │PUBLISHED │
     └────┬─────┘
          │ openRegistration()
          ▼
┌─────────────────────┐
│ REGISTRATION_OPEN   │
└─────────┬───────────┘
          │ closeRegistration()
          ▼
┌─────────────────────┐
│ REGISTRATION_CLOSED │
└─────────┬───────────┘
          │ start()
          ▼
     ┌──────────┐
     │ ONGOING  │ ←── Operazioni Live (Strike, Catture)
     └────┬─────┘
          │ complete()
          ▼
     ┌──────────┐
     │COMPLETED │ ←── Statistiche (Storico)
     └──────────┘

     Da qualsiasi stato (eccetto COMPLETED):
          │ cancel()
          ▼
     ┌──────────┐
     │CANCELLED │
     └──────────┘
```

---

## File Modificati/Creati

| File | Tipo | Descrizione |
|------|------|-------------|
| `backend/src/services/tournament/tournament-lifecycle.service.ts` | Modificato | Fix riferimento `this` nei metodi statici |
| `backend/START_BACKEND.bat` | Creato | Script avvio server |
| `backend/STOP_BACKEND.bat` | Creato | Script stop server |
| `frontend/src/app/[locale]/dashboard/tournaments/[id]/page.tsx` | Creato | Pagina gestione torneo |
| `frontend/src/app/[locale]/dashboard/tournaments/page.tsx` | Modificato | Aggiunta voce "Gestisci" |
| `frontend/src/app/[locale]/dashboard/layout.tsx` | Modificato | Sezioni sidebar dinamiche |

---

## Proposte di Miglioramento

### 1. Pagine Mancanti (Priorita Alta)

Le seguenti pagine sono referenziate ma non ancora implementate:

| Pagina | Path | Descrizione |
|--------|------|-------------|
| Partecipanti | `/dashboard/tournaments/[id]/participants` | Lista e gestione iscritti |
| Teams | `/dashboard/tournaments/[id]/teams` | Gestione barche/equipaggi |
| Ispettori | `/dashboard/tournaments/[id]/judges` | Assegnazione giudici |
| Zone di Pesca | `/dashboard/tournaments/[id]/zones` | Configurazione zone |
| Impostazioni | `/dashboard/tournaments/[id]/settings` | Configurazione torneo |
| Edit | `/dashboard/tournaments/[id]/edit` | Modifica dati torneo |

**Raccomandazione:** Implementare almeno Partecipanti e Teams come priorita.

### 2. Persistenza Tournament Mode (Priorita Media)

**Problema attuale:** Il Tournament Mode si resetta se l'utente ricarica la pagina su una pagina diversa dalla gestione torneo.

**Soluzione proposta:**
```typescript
// Nel layout, verificare se siamo in una sotto-pagina del torneo
useEffect(() => {
  const tournamentMatch = pathname.match(/\/dashboard\/tournaments\/([^\/]+)/);
  if (tournamentMatch && !activeTournament) {
    // Fetch tournament data and activate mode
    fetchTournamentAndActivate(tournamentMatch[1]);
  }
}, [pathname]);
```

### 3. Breadcrumb Navigation (Priorita Media)

Aggiungere breadcrumb per navigazione contestuale:

```
Dashboard > Tornei > Drifting Cup Capri > Partecipanti
```

### 4. Real-time Updates (Priorita Bassa)

Per tornei ONGOING, implementare WebSocket per:
- Notifiche nuovi strike
- Aggiornamento classifica live
- Alert catture da validare

### 5. Quick Actions Contestuali (Priorita Bassa)

Nella header della dashboard, mostrare azioni rapide quando un torneo e attivo:

```tsx
{activeTournament && (
  <div className="flex gap-2">
    <Button size="sm" variant="outline">
      <Zap className="h-4 w-4 mr-1" />
      Nuovo Strike
    </Button>
    <Button size="sm" variant="outline">
      <Fish className="h-4 w-4 mr-1" />
      Registra Cattura
    </Button>
  </div>
)}
```

### 6. Shortcuts da Tastiera (Priorita Bassa)

| Shortcut | Azione |
|----------|--------|
| `Ctrl+T` | Torna a lista tornei |
| `Ctrl+S` | Nuovo Strike (se ONGOING) |
| `Ctrl+P` | Vai a Partecipanti |
| `Esc` | Esci da Tournament Mode |

### 7. Dashboard Torneo Migliorata (Priorita Media)

Aggiungere alla pagina panoramica:
- Grafico andamento iscrizioni nel tempo
- Mappa zone di pesca (se disponibili coordinate)
- Timeline eventi torneo
- Widget meteo per location

### 8. Export e Reporting (Priorita Alta)

Dalla pagina gestione torneo, permettere:
- Export PDF lista partecipanti
- Export Excel con tutti i dati
- Generazione attestati partecipazione
- Report finale torneo

### 9. Notifiche Push (Priorita Bassa)

Sistema di notifiche per:
- Nuove iscrizioni
- Pagamenti ricevuti
- Strike segnalati
- Catture da validare

### 10. Ruoli e Permessi Granulari (Priorita Media)

Attualmente i permessi sono per ruolo. Migliorare con:
- Permessi per singolo torneo
- Co-organizzatori con permessi limitati
- Giudici assegnati a zone specifiche

---

## Testing Raccomandato

### Test Manuali da Eseguire

1. **Flow Completo Tournament Mode:**
   - [ ] Creare nuovo torneo
   - [ ] Pubblicare torneo
   - [ ] Cliccare "Gestisci" dal menu
   - [ ] Verificare sidebar con sezioni corrette
   - [ ] Navigare tra le pagine
   - [ ] Cliccare "Chiudi torneo"
   - [ ] Verificare ritorno a lista tornei

2. **Permessi per Ruolo:**
   - [ ] SUPER_ADMIN vede tutte le sezioni
   - [ ] ORGANIZER vede sezioni appropriate
   - [ ] JUDGE vede solo operazioni live
   - [ ] PARTICIPANT non vede gestione

3. **Stati Torneo:**
   - [ ] DRAFT: no sezioni live
   - [ ] ONGOING: sezione "Operazioni Live"
   - [ ] COMPLETED: sezione "Statistiche Torneo"

---

## Conclusioni

La sessione ha implementato con successo il sistema di Tournament Management Mode, fornendo una base solida per la gestione contestuale dei tornei. I miglioramenti proposti possono essere implementati in sessioni successive seguendo l'ordine di priorita indicato.

**Prossimi passi consigliati:**
1. Implementare pagina Partecipanti
2. Implementare pagina Teams/Barche
3. Aggiungere persistenza Tournament Mode
4. Implementare sistema export/reporting
