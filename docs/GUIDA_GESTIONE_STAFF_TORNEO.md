# GUIDA - Gestione Staff del Torneo

**Versione:** 1.0.0
**Data:** 2026-01-11
**Autore:** Claude Code (Opus 4.5)

---

## TODO - AZIONI URGENTI

> **ATTENZIONE:** Completare questi task PRIMA di andare in produzione!

### Priorita CRITICA

- [x] **FIX BUG FRONTEND:** ~~Aggiungere le 4 funzioni mancanti nel file `staff/page.tsx`~~ **COMPLETATO 2026-01-11**
  - `toggleJudgeExpanded` (linee 247-257)
  - `openAssistantDialog` (linee 259-264)
  - `handleAssignAssistant` (linee 266-303)
  - `handleRemoveAssistant` (linee 305-325)

- [ ] **TEST MANUALE UI:** Testare in browser tutte le funzionalita:
  - Assegnazione giudice
  - Assegnazione assistente a giudice
  - Espansione/collasso card giudice
  - Rimozione assistente
  - Rimozione giudice (verificare cascade sugli assistenti)

### Priorita ALTA

- [ ] **SCRIVERE TEST:** Unit test per i nuovi metodi `StaffService`:
  - `getJudges()`
  - `getAssistants()`
  - `assignAssistant()`
  - `removeAssistant()`
  - `reassignAssistant()`

- [ ] **VERIFICARE ONDELETE:** Testare cosa succede agli assistenti quando si elimina un giudice

### Priorita MEDIA

- [ ] Validazione: impedire che un utente sia assistente di piu giudici
- [ ] Aggiungere toast notifications piu dettagliate
- [ ] Implementare drag-and-drop per riassegnare assistenti tra giudici

### Priorita BASSA

- [ ] Traduzioni i18n per tutti i testi hardcoded
- [ ] Audit log per modifiche staff
- [ ] Report PDF con lista staff e assistenti

---

## RIFERIMENTI DOCUMENTI

| Documento | Percorso | Descrizione |
|-----------|----------|-------------|
| Handover Sessione | [HANDOVER_SESSIONE_JUDGE_ASSISTANTS_20260111.md](./HANDOVER_SESSIONE_JUDGE_ASSISTANTS_20260111.md) | Riepilogo sessione con errori confessati |
| Documentazione Tecnica | [DOCUMENTAZIONE_TECNICA_ASSISTENTI_GIUDICI_20260111.md](./DOCUMENTAZIONE_TECNICA_ASSISTENTI_GIUDICI_20260111.md) | Riferimenti API, database, metodi |

---

## PANORAMICA MODULO

### Cos'e lo Staff del Torneo?

Lo staff del torneo e composto da:

| Ruolo | Icona | Descrizione |
|-------|-------|-------------|
| **DIRECTOR** | Crown | Direttore di gara - responsabile generale |
| **JUDGE** | Gavel | Giudice di gara - valida le catture |
| **JUDGE_ASSISTANT** | UserCheck | Assistente del giudice (NUOVO) |
| **INSPECTOR** | Shield | Ispettore (assegnato a barca) |
| **SCORER** | Calculator | Addetto punteggi |

### Differenza Staff vs Ispettori di Bordo

- **Staff (questa sezione):** Personale di gara che opera a terra/base
- **Ispettori di Bordo (/judges):** Persone assegnate alle singole barche

---

## GERARCHIA GIUDICE-ASSISTENTE

```
Torneo
  |
  +-- Direttore di Gara (DIRECTOR)
  |
  +-- Giudice 1 (JUDGE)
  |     +-- Assistente A (JUDGE_ASSISTANT)
  |     +-- Assistente B (JUDGE_ASSISTANT)
  |
  +-- Giudice 2 (JUDGE)
  |     +-- Assistente C (JUDGE_ASSISTANT)
  |
  +-- Scorer (SCORER)
```

### Regole di Business

1. Un assistente puo avere **un solo giudice padre**
2. Un giudice puo avere **molti assistenti**
3. Se un giudice viene eliminato, gli assistenti hanno `parentStaffId = NULL` (onDelete: SetNull)
4. Un utente non puo avere lo stesso ruolo due volte nello stesso torneo

---

## COME USARE IL MODULO

### Accesso
```
http://localhost:3000/{locale}/dashboard/tournaments/{tournamentId}/staff
```

### Assegnare un Giudice

1. Clicca "Aggiungi Staff"
2. Seleziona ruolo "Giudice di Gara"
3. Seleziona utente dalla lista
4. (Opzionale) Aggiungi note
5. Clicca "Assegna"

### Assegnare un Assistente a un Giudice

1. Trova il giudice nella sezione "Giudici di Gara"
2. Clicca "Aggiungi" accanto al giudice
3. Seleziona utente dalla lista
4. (Opzionale) Aggiungi note
5. Clicca "Assegna Assistente"

### Visualizzare Assistenti

1. Clicca sulla freccia (ChevronRight) accanto al giudice
2. La card si espande mostrando gli assistenti

### Rimuovere Assistente

1. Espandi la card del giudice
2. Clicca l'icona cestino accanto all'assistente
3. Conferma la rimozione

---

## API QUICK REFERENCE

### Endpoint Principali

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/staff/tournament/:id` | Lista staff torneo |
| POST | `/api/staff/tournament/:id` | Assegna staff |
| DELETE | `/api/staff/:staffId` | Rimuovi staff |
| GET | `/api/staff/tournament/:id/judges` | Lista giudici con assistenti |
| POST | `/api/staff/judge/:judgeId/assistant` | Assegna assistente |
| DELETE | `/api/staff/assistant/:assistantId` | Rimuovi assistente |
| PUT | `/api/staff/assistant/:id/reassign` | Riassegna assistente |

### Autenticazione
Tutti gli endpoint richiedono:
```
Authorization: Bearer {jwt_token}
```

### Ruoli Autorizzati
- SUPER_ADMIN
- TENANT_ADMIN
- ORGANIZER

---

## TROUBLESHOOTING

### Errore "User is already assigned with this role"
- L'utente ha gia quel ruolo nel torneo
- Verifica nella lista staff

### Errore "Parent judge not found"
- Il giudice padre non esiste o non e un JUDGE
- Assicurati di passare un ID di un giudice valido

### Errore "Assistant not found"
- L'ID dell'assistente non esiste o non e un JUDGE_ASSISTANT

### Frontend non mostra assistenti
- Verifica che le funzioni `toggleJudgeExpanded`, `handleAssignAssistant`, etc. siano definite
- Vedi sezione TODO sopra

---

## COMANDI SVILUPPO

```bash
# Avviare backend
cd D:/Dev/TournamentMaster/backend && npm run dev

# Avviare frontend
cd D:/Dev/TournamentMaster/frontend && npm run dev

# Rigenerare Prisma client
cd D:/Dev/TournamentMaster/backend && npx prisma generate

# Sincronizzare schema DB
cd D:/Dev/TournamentMaster/backend && npx prisma db push

# Verificare TypeScript
cd D:/Dev/TournamentMaster/backend && npx tsc --noEmit
```

---

## STORICO MODIFICHE

| Data | Versione | Autore | Descrizione |
|------|----------|--------|-------------|
| 2026-01-11 | 1.0.0 | Claude Code | Creazione iniziale con feature assistenti giudici |

---

**Nota:** Questa guida e stata generata automaticamente. Per dettagli tecnici completi, consultare la [Documentazione Tecnica](./DOCUMENTAZIONE_TECNICA_ASSISTENTI_GIUDICI_20260111.md).
