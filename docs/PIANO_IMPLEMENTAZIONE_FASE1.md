# Piano Implementazione Fase 1 - Amministrazione Tornei

## Analisi Sistema Esistente

### Cosa GIA' ESISTE (non toccare!)

| Funzionalita | File | Stato |
|--------------|------|-------|
| Dashboard lista tornei | `frontend/.../tournaments/page.tsx` | Completo |
| Dettaglio torneo | `frontend/.../tournaments/[id]/page.tsx` | Completo |
| Cambio stato torneo | `tournament-lifecycle.routes.ts` | Completo |
| Validazione catture UI | `frontend/.../judge/page.tsx` | Completo |
| Approvazione/Rifiuto | `catch.service.ts` + `catch.routes.ts` | Completo |
| Assegnazione ispettori | `frontend/.../judges/page.tsx` | Completo |
| Export PDF classifica | `pdf.service.ts` | Completo |
| Export PDF assegnazioni | `pdf.service.ts` | Completo |
| Export CSV | `report.routes.ts` | Completo |
| Gestione zone pesca | `frontend/.../zones/page.tsx` | Completo |
| Settings torneo | `frontend/.../settings/page.tsx` | Completo |

### Cosa MANCA nella Fase 1

1. **Checklist guidata per fase** - Guida step-by-step per ogni stato del torneo
2. **Metriche real-time** - Statistiche avanzate (catture/ora, trend, comparazioni)
3. **Transizioni automatiche** - Scheduler per date apertura/chiusura iscrizioni
4. **Notifiche cambio stato** - Alert quando torneo cambia fase

---

## Implementazioni Fase 1

### 1. Checklist Guidata per Fase (Frontend)

**Obiettivo**: Aggiungere una sezione "Checklist" nella pagina dettaglio torneo che mostra cosa fare in ogni fase.

**File da modificare**: `frontend/src/app/[locale]/dashboard/tournaments/[id]/page.tsx`

**Implementazione**:

```typescript
// Aggiungere dopo le statistiche rapide
const phaseChecklist: Record<string, ChecklistItem[]> = {
  DRAFT: [
    { id: "basic-info", label: "Informazioni base compilate", check: () => !!tournament.name && !!tournament.startDate },
    { id: "zones", label: "Zone di pesca definite", check: () => tournament._count?.zones > 0 },
    { id: "rules", label: "Regolamento caricato", check: () => !!tournament.rules },
    { id: "fee", label: "Quota iscrizione impostata", check: () => tournament.registrationFee !== null },
  ],
  PUBLISHED: [
    { id: "announcement", label: "Annuncio pubblicato", check: () => true },
    { id: "registration-dates", label: "Date iscrizione configurate", check: () => !!tournament.registrationOpenDate },
  ],
  REGISTRATION_OPEN: [
    { id: "min-participants", label: "Minimo partecipanti raggiunto", check: () => tournament._count?.registrations >= (tournament.minParticipants || 0) },
    { id: "inspectors", label: "Ispettori assegnati", check: () => true }, // Da verificare
  ],
  ONGOING: [
    { id: "catches-pending", label: "Catture da validare", check: () => true, warning: pendingCatches > 0 },
    { id: "leaderboard", label: "Classifica aggiornata", check: () => true },
  ],
  COMPLETED: [
    { id: "all-validated", label: "Tutte le catture validate", check: () => pendingCatches === 0 },
    { id: "final-ranking", label: "Classifica finale generata", check: () => true },
  ],
};
```

**UI**: Card con checklist items, progress bar, e azioni suggerite.

**Tempo stimato**: ~2-3 ore

---

### 2. Metriche Real-time (Frontend + Backend)

**Obiettivo**: Dashboard con statistiche avanzate per tornei in corso.

**Nuovi endpoint backend**:

```typescript
// GET /api/tournaments/:id/stats
// Ritorna:
{
  totalCatches: number;
  pendingCatches: number;
  approvedCatches: number;
  rejectedCatches: number;
  catchesPerHour: number;
  totalWeight: number;
  averageWeight: number;
  topCatcher: { name: string; catches: number; weight: number };
  recentActivity: Activity[];
}
```

**File da creare**: `backend/src/services/tournament-stats.service.ts`

**File da modificare**:
- `backend/src/routes/tournament/tournament-crud.routes.ts` (aggiungere endpoint)
- `frontend/src/app/[locale]/dashboard/tournaments/[id]/page.tsx` (mostrare stats)

**Tempo stimato**: ~3-4 ore

---

### 3. Transizioni Automatiche (Backend)

**Obiettivo**: Scheduler che controlla le date e cambia automaticamente lo stato.

**Campi database gia' esistenti**:
- `registrationOpenDate` - Data apertura iscrizioni
- `registrationCloseDate` - Data chiusura iscrizioni
- `startDate` - Data inizio torneo
- `endDate` - Data fine torneo

**Logica**:
```
Ogni 5 minuti controlla:
1. Se PUBLISHED e now >= registrationOpenDate -> REGISTRATION_OPEN
2. Se REGISTRATION_OPEN e now >= registrationCloseDate -> REGISTRATION_CLOSED
3. Se REGISTRATION_CLOSED e now >= startDate -> ONGOING
4. Se ONGOING e now >= endDate -> COMPLETED (solo se tutte catture validate)
```

**File da creare**: `backend/src/services/tournament-scheduler.service.ts`

**File da modificare**: `backend/src/app.ts` (avviare scheduler)

**Tempo stimato**: ~2-3 ore

---

### 4. Notifiche Cambio Stato (Frontend)

**Obiettivo**: Mostrare alert/toast quando lo stato cambia.

**Implementazione**:
- Usare `sonner` (gia' installato) per toast
- Aggiungere sezione "Attivita Recente" con timeline cambi stato

**File da modificare**: `frontend/src/app/[locale]/dashboard/tournaments/[id]/page.tsx`

**Tempo stimato**: ~1 ora

---

## Ordine di Implementazione Consigliato

1. **Checklist Guidata** - Valore immediato, solo frontend
2. **Notifiche** - Veloce, migliora UX
3. **Metriche Real-time** - Richiede backend + frontend
4. **Transizioni Automatiche** - Piu complesso, richiede testing

---

## File Critici da NON Modificare

| File | Motivo |
|------|--------|
| `catch.service.ts` | Logica validazione catture funzionante |
| `tournament-lifecycle.service.ts` | State machine funzionante |
| `pdf.service.ts` | Export funzionanti |
| `judge/page.tsx` | UI validazione funzionante |

---

## Rischi e Mitigazioni

| Rischio | Mitigazione |
|---------|-------------|
| Scheduler interfere con stato manuale | Aggiungere flag `autoTransition: boolean` su torneo |
| Checklist non copre tutti i casi | Rendere configurabile per tipo torneo |
| Performance metriche real-time | Caching con Redis o in-memory con TTL |

---

## Testing Richiesto

1. **Checklist**: Verificare tutti gli stati del torneo
2. **Metriche**: Test con torneo con molte catture
3. **Scheduler**: Test date nel passato/futuro
4. **Integrazione**: Ciclo completo torneo DRAFT -> COMPLETED

---

## Prossimi Passi

Conferma quale componente vuoi implementare per primo:

- [ ] **A) Checklist guidata** - Solo frontend, veloce
- [ ] **B) Metriche real-time** - Backend + frontend
- [ ] **C) Scheduler automatico** - Solo backend
- [ ] **D) Tutti in sequenza** - Ordine consigliato
