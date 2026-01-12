# Guida all'Amministrazione dei Tornei
## TournamentMaster - Documento di Specifica Funzionale

**Versione:** 1.1.0
**Data:** 2026-01-12
**Autore:** Team TournamentMaster
**Basato su:** Ricerca best practices FIPSAS, IGFA, CatchStat, WeighFish, Web Pro Tournament Manager

---

## TODO URGENTI (Sessione 2026-01-12)

| Priorita | Task | Stato |
|----------|------|-------|
| ALTA | Commit modifiche dialog width + FIPSAS scoring | DA FARE |
| ALTA | Test manuale creazione torneo C&R nel browser | DA FARE |
| MEDIA | Implementare backend scoring C&R (catch.service.ts) | DA FARE |
| MEDIA | Validazione video obbligatorio per C&R | DA FARE |
| BASSA | Migliorare UX selettore taglia (guida visiva) | DA FARE |

## DOCUMENTI SESSIONE

| Documento | Descrizione |
|-----------|-------------|
| [HANDOVER_SESSIONE_CATCH_RELEASE_DIALOG_20260112.md](../HANDOVER_SESSIONE_CATCH_RELEASE_DIALOG_20260112.md) | Riepilogo sessione con errori confessati |
| [DOCUMENTAZIONE_TECNICA_CATCH_RELEASE_20260112.md](../DOCUMENTAZIONE_TECNICA_CATCH_RELEASE_20260112.md) | Architettura tecnica completa sistema C&R |

---

## Indice

1. [Panoramica Sistema](#1-panoramica-sistema)
2. [Ruoli e Permessi](#2-ruoli-e-permessi)
3. [Ciclo di Vita del Torneo](#3-ciclo-di-vita-del-torneo)
4. [Funzionalità per Fase](#4-funzionalità-per-fase)
5. [Gestione Iscrizioni](#5-gestione-iscrizioni)
6. [Gestione Staff e Giudici](#6-gestione-staff-e-giudici)
7. [Scoring e Classifiche](#7-scoring-e-classifiche)
8. [Comunicazioni](#8-comunicazioni)
9. [Report e Documenti](#9-report-e-documenti)
10. [Omologazione FIPSAS](#10-omologazione-fipsas)
11. [Gap Analysis vs Sistema Attuale](#11-gap-analysis-vs-sistema-attuale)
12. [Roadmap Implementazione](#12-roadmap-implementazione)

---

## 1. Panoramica Sistema

### 1.1 Obiettivo
Fornire agli amministratori di associazione (TENANT_ADMIN) un sistema completo per:
- Creare e gestire tornei di pesca sportiva
- Gestire iscrizioni, pagamenti, staff
- Monitorare l'andamento delle gare in tempo reale
- Generare classifiche e report conformi FIPSAS
- Comunicare con partecipanti e giudici

### 1.2 Riferimenti di Mercato

| Piattaforma | Punti di Forza | Da Implementare |
|-------------|----------------|-----------------|
| [CatchStat](https://www.catchstat.com/) | Live leaderboard, app mobile, push notifications | Sistema notifiche real-time |
| [WeighFish](https://www.weighfish.com/) | Offline capability, auto-payouts, series management | Gestione serie tornei |
| [Web Pro Tournament Manager](https://webprotournamentmanager.com/) | Integrazione bilance IGFA, real-time scoring | Integrazione hardware |
| [Fishing Chaos](https://www.fishingchaos.com/) | App mobile, registrazione eventi | UX mobile-first |

### 1.3 Conformità Normativa
- **FIPSAS**: Regolamenti gare pesca sportiva italiane
- **IGFA**: Standard internazionali per record e pesature
- **CONI/CIPS**: Normative federali italiane

---

## 2. Ruoli e Permessi

### 2.1 Ruoli Permanenti (a livello Associazione)

| Ruolo | Descrizione | Permessi Tornei |
|-------|-------------|-----------------|
| `SUPER_ADMIN` | Admin piattaforma | Tutti i tornei, tutte le associazioni |
| `TENANT_ADMIN` | Admin associazione | CRUD completo tornei propria associazione |
| `PRESIDENT` | Presidente | Stesso di TENANT_ADMIN |
| `ORGANIZER` | Organizzatore | Crea e gestisce propri tornei |
| `JUDGE` | Giudice | Solo visualizzazione + funzioni giudice |
| `PARTICIPANT` | Partecipante | Solo iscrizione e visualizzazione |

### 2.2 Ruoli Temporanei (per singolo Torneo)

| Ruolo | Descrizione | Permessi nel Torneo |
|-------|-------------|---------------------|
| `DIRECTOR` | Direttore di gara | Gestione completa torneo, decisioni finali |
| `JUDGE` | Giudice di gara | Validazione catture, controlli |
| `INSPECTOR` | Ispettore di bordo | Registrazione strike, catture, rilasci |
| `SCORER` | Addetto punteggi | Input pesature, calcolo classifiche |

### 2.3 Matrice Permessi Dettagliata

```
Azione                      | TENANT_ADMIN | DIRECTOR | JUDGE | INSPECTOR | SCORER
----------------------------|--------------|----------|-------|-----------|-------
Creare torneo               | ✓            | -        | -     | -         | -
Modificare torneo           | ✓            | ✓        | -     | -         | -
Eliminare torneo            | ✓            | -        | -     | -         | -
Gestire iscrizioni          | ✓            | ✓        | -     | -         | -
Approvare/rifiutare iscritti| ✓            | ✓        | -     | -         | -
Assegnare staff             | ✓            | ✓        | -     | -         | -
Avviare/concludere torneo   | ✓            | ✓        | -     | -         | -
Registrare catture          | ✓            | ✓        | ✓     | ✓         | -
Validare catture            | ✓            | ✓        | ✓     | -         | -
Registrare pesature         | ✓            | ✓        | -     | -         | ✓
Modificare classifiche      | ✓            | ✓        | -     | -         | -
Generare PDF/Report         | ✓            | ✓        | ✓     | -         | -
Inviare comunicazioni       | ✓            | ✓        | -     | -         | -
Omologare risultati         | ✓            | ✓        | -     | -         | -
```

---

## 3. Ciclo di Vita del Torneo

### 3.1 State Machine

```
                    ┌─────────────┐
                    │    DRAFT    │ ← Creazione iniziale
                    └──────┬──────┘
                           │ publish()
                           ▼
                    ┌─────────────┐
                    │  PUBLISHED  │ ← Visibile, non iscrivibile
                    └──────┬──────┘
                           │ openRegistration()
                           ▼
              ┌────────────────────────┐
              │   REGISTRATION_OPEN    │ ← Iscrizioni aperte
              └────────────┬───────────┘
                           │ closeRegistration()
                           ▼
              ┌────────────────────────┐
              │  REGISTRATION_CLOSED   │ ← Preparazione gara
              └────────────┬───────────┘
                           │ start()
                           ▼
                    ┌─────────────┐
                    │   ONGOING   │ ← Gara in corso
                    └──────┬──────┘
                           │ complete()
                           ▼
                    ┌─────────────┐
                    │  COMPLETED  │ ← Gara conclusa
                    └─────────────┘

    [Da qualsiasi stato tranne COMPLETED]
                           │ cancel()
                           ▼
                    ┌─────────────┐
                    │  CANCELLED  │
                    └─────────────┘
```

### 3.2 Transizioni e Validazioni

| Transizione | Condizioni Richieste |
|-------------|---------------------|
| DRAFT → PUBLISHED | Almeno 1 zona di pesca definita |
| PUBLISHED → REGISTRATION_OPEN | Data apertura iscrizioni raggiunta (opzionale) |
| REGISTRATION_OPEN → REGISTRATION_CLOSED | Manuale o automatico a data chiusura |
| REGISTRATION_CLOSED → ONGOING | Min partecipanti raggiunto, staff assegnato |
| ONGOING → COMPLETED | Manuale (direttore decide fine gara) |
| * → CANCELLED | Possibile da qualsiasi stato eccetto COMPLETED |

### 3.3 Transizioni Automatiche (da implementare)

```typescript
// Schedulatore per transizioni automatiche
interface AutoTransition {
  tournamentId: string;
  targetStatus: TournamentStatus;
  scheduledAt: Date;
  executed: boolean;
}

// Esempi:
// - Apertura automatica iscrizioni a registrationOpens
// - Chiusura automatica iscrizioni a registrationCloses
// - Reminder automatici N giorni prima
```

---

## 4. Funzionalità per Fase

### 4.1 Fase DRAFT - Configurazione

**Dashboard Admin deve mostrare:**
- [ ] Checklist completamento (zone, specie, quote, date)
- [ ] Preview pagina pubblica torneo
- [ ] Pulsante "Pubblica" (con validazione)

**Funzionalità:**
- Modifica tutti i campi torneo
- Definizione zone di pesca (mappa GeoJSON)
- Selezione specie ammesse con moltiplicatori punti
- Configurazione regole (peso minimo, max catture/giorno)
- Upload banner/immagini
- Impostazione quote iscrizione

### 4.2 Fase PUBLISHED - Promozione

**Dashboard Admin deve mostrare:**
- [ ] Link condivisibile pagina torneo
- [ ] Statistiche visualizzazioni
- [ ] Countdown apertura iscrizioni
- [ ] Pulsante "Apri Iscrizioni"

**Funzionalità:**
- Modifica limitata (non date critiche)
- Condivisione social
- Embedding widget su siti esterni
- Preview modulo iscrizione

### 4.3 Fase REGISTRATION_OPEN - Raccolta Iscrizioni

**Dashboard Admin deve mostrare:**
- [ ] Contatore iscritti (attuali/max)
- [ ] Lista iscrizioni con stato pagamento
- [ ] Grafico iscrizioni nel tempo
- [ ] Alert capacità (80%, 90%, 100%)
- [ ] Pulsante "Chiudi Iscrizioni"

**Funzionalità:**
- Approvazione/rifiuto iscrizioni manuali
- Gestione waitlist se max raggiunto
- Rimborsi per cancellazioni
- Export lista iscritti (CSV, PDF)
- Invio conferme email
- Assegnazione numeri barca

### 4.4 Fase REGISTRATION_CLOSED - Preparazione Gara

**Dashboard Admin deve mostrare:**
- [ ] Lista definitiva partecipanti
- [ ] Assegnazione ispettori (matrice barca-ispettore)
- [ ] Checklist pre-gara
- [ ] Briefing template

**Funzionalità:**
- Assegnazione staff (direttore, giudici, ispettori, scorer)
- Generazione PDF assegnazioni ispettori
- Sorteggio zone/postazioni (se applicabile)
- Comunicazione briefing a tutti
- Stampa materiali (badge, numeri barca)

### 4.5 Fase ONGOING - Gara in Corso

**Dashboard Admin deve mostrare:**
- [ ] **Live Dashboard** con:
  - Classifica real-time
  - Mappa GPS barche (se disponibile)
  - Feed attività (strike, catture, rilasci)
  - Meteo attuale
- [ ] Contatori: catture totali, peso totale, rilasci
- [ ] Pulsante "Concludi Torneo"

**Funzionalità:**
- Registrazione catture (da ispettore o admin)
- Validazione catture (foto, peso, specie)
- Registrazione strike e rilasci
- Gestione penalità/squalifiche
- Comunicazioni broadcast ai partecipanti
- Pause/resume gara (per emergenze)

### 4.6 Fase COMPLETED - Post-Gara

**Dashboard Admin deve mostrare:**
- [ ] Classifica finale ufficiale
- [ ] Statistiche complete gara
- [ ] Premi da assegnare
- [ ] Pulsante "Omologa Risultati"

**Funzionalità:**
- Revisione e correzione classifiche
- Generazione certificati/attestati
- Generazione report FIPSAS
- Archiviazione documenti
- Invio risultati a partecipanti
- Pubblicazione su sito/social

---

## 5. Gestione Iscrizioni

### 5.1 Workflow Iscrizione

```
Utente compila form → Pagamento → Pending → Admin Approva → Confermato
                                    ↓
                              Admin Rifiuta → Rifiutato + Rimborso
```

### 5.2 Tipologie Iscrizione

| Tipo | Descrizione | Campi Specifici |
|------|-------------|-----------------|
| Individuale | Singolo partecipante | Nome, tessera, documenti |
| Team | Equipaggio completo | Nome team, barca, membri (2-6), capitano |
| Barca | Per discipline drifting | Nome barca, lunghezza, skipper, equipaggio |

### 5.3 Validazioni Iscrizione

```typescript
interface RegistrationValidation {
  // Documenti obbligatori
  requiredDocuments: DocumentType[];

  // Validità tessere
  fipsasNumberRequired: boolean;
  fipsasNumberMustBeValid: boolean;

  // Limiti
  maxTeamSize: number;
  minTeamSize: number;

  // Pagamento
  paymentRequired: boolean;
  paymentDeadlineDays: number;
}
```

### 5.4 Gestione Waitlist (da implementare)

```typescript
interface WaitlistEntry {
  id: string;
  registrationId: string;
  position: number;
  notifiedAt?: Date;
  expiresAt?: Date; // Tempo per confermare se posto libero
}
```

---

## 6. Gestione Staff e Giudici

### 6.1 Assegnazione Staff

**Per ogni torneo servono:**
- 1 Direttore di Gara (obbligatorio)
- N Giudici di Gara (opzionale, dipende da livello)
- 1 Ispettore per ogni barca (obbligatorio per drifting)
- M Scorer per pesatura (opzionale)

### 6.2 Pool Giudici Associazione

```typescript
// Giudici disponibili per l'associazione
interface JudgePool {
  tenantId: string;
  judges: {
    userId: string;
    qualifications: string[]; // Es: "FIPSAS_JUDGE_LEVEL_2"
    availability: DateRange[];
    preferredDisciplines: TournamentDiscipline[];
  }[];
}
```

### 6.3 Assegnazione Ispettori

**Regole FIPSAS:**
- Ispettore NON può essere della stessa società della barca ispezionata
- Rotazione tra prove (se torneo multi-giornata)
- Tracciamento società di provenienza ispettore

**UI necessaria:**
- Matrice drag-drop: Barche × Ispettori disponibili
- Validazione automatica vincoli
- Generazione automatica (algoritmo round-robin)

---

## 7. Scoring e Classifiche

### 7.1 Sistemi di Punteggio

| Sistema | Formula | Uso Tipico |
|---------|---------|------------|
| Peso Semplice | peso_kg × 100 | Bolentino, shore |
| Peso + Moltiplicatore | peso_kg × species_multiplier × 100 | Big Game, Drifting |
| Release Points | release_count × points_per_release | Catch & Release |
| Combo | peso + release_bonus + biggest_catch_bonus | Tornei misti |

### 7.2 Validazione Catture

```typescript
enum CatchValidationStatus {
  PENDING,      // In attesa validazione
  APPROVED,     // Approvata da giudice
  REJECTED,     // Rifiutata (motivazione obbligatoria)
  UNDER_REVIEW  // In revisione (contestata)
}

interface CatchValidation {
  catchId: string;
  validatedBy: string; // userId giudice
  status: CatchValidationStatus;
  rejectionReason?: string;
  evidencePhotos: string[];
  validatedAt: Date;
}
```

### 7.3 Gestione Penalità

```typescript
interface Penalty {
  id: string;
  tournamentId: string;
  teamId?: string;
  userId?: string;
  type: PenaltyType;
  points: number; // Punti da sottrarre
  reason: string;
  issuedBy: string;
  issuedAt: Date;
  appealed: boolean;
  appealDecision?: 'UPHELD' | 'OVERTURNED';
}

enum PenaltyType {
  LATE_ARRIVAL,       // Ritardo partenza
  ZONE_VIOLATION,     // Fuori zona
  EQUIPMENT_VIOLATION,// Attrezzatura non conforme
  UNSPORTSMANLIKE,    // Comportamento antisportivo
  CATCH_VIOLATION,    // Cattura non conforme
  DISQUALIFICATION    // Squalifica
}
```

### 7.4 Tie-Breaking

Ordine di spareggio (configurabile):
1. Punteggio totale
2. Peso totale
3. Cattura più grande
4. Numero catture
5. Prima cattura (tempo)

### 7.5 Modalita Catch & Release (NUOVA - 2026-01-12)

**Implementato in:** `frontend/src/components/SpeciesScoringConfig.tsx`

#### Concetto
In modalita Catch & Release, il punteggio si basa su:
- **Specie catturata**
- **Fascia taglia** (S/M/L/XL) stimata visivamente
- **Video obbligatorio** che mostra il rilascio

#### Configurazione Punti
```
| Taglia | Descrizione | Esempio Tonno Rosso |
|--------|-------------|---------------------|
| S      | Small       | 8.500 punti         |
| M      | Medium      | 18.500 punti        |
| L      | Large       | 42.000 punti        |
| XL     | Extra Large | 85.000 punti        |
```

#### Punteggi FIPSAS Pre-compilati
Il sistema pre-compila automaticamente i punteggi basandosi sulla **disciplina** selezionata:

| Disciplina | Specie Incluse |
|------------|----------------|
| BIG_GAME | Tonno Rosso, Pesce Spada, Aguglia Imperiale, Alalunga, Lampuga |
| BOLENTINO | Cernia, Dentice, Pagello, Sarago, Tanuta, Orata |
| TRAINA_COSTIERA | Dentice, Ricciola, Lampuga, Tonnetto, Palamita |
| DRIFTING | Pesce Spada, Tonno Rosso, Alalunga, Verdesca, Squalo Mako |
| SURF_CASTING | Orata, Spigola, Sarago, Mormore, Ombrina |
| SHORE | Spigola, Orata, Leccia Amia, Serra, Barracuda |
| EGING | Seppia, Calamaro, Totano, Polpo |
| VERTICAL_JIGGING | Dentice, Ricciola, Cernia, Tonno, Palamita |

#### Specie Custom
L'admin puo aggiungere specie personalizzate tramite il pulsante "Specie Custom" nel form di creazione torneo.

#### Bonus Rilascio
Moltiplicatore x1.5 applicato quando il video mostra chiaramente il rilascio del pesce vivo.

#### UI Creazione Torneo
1. Selezionare **Modalita di Gioco: Catch & Release**
2. La tabella punteggi appare automaticamente pre-compilata
3. Modificare i punti se necessario
4. Aggiungere specie custom se necessario

**Nota tecnica:** Il dialog usa `sm:max-w-6xl` per avere spazio sufficiente per la tabella.

---

## 8. Comunicazioni

### 8.1 Canali di Comunicazione

| Canale | Uso | Implementazione |
|--------|-----|-----------------|
| Email | Conferme, risultati | SMTP/SendGrid |
| Push Notification | Alert real-time | Firebase/OneSignal |
| SMS | Emergenze | Twilio (opzionale) |
| In-App | Messaggi, annunci | WebSocket |

### 8.2 Template Messaggi

```typescript
interface MessageTemplate {
  id: string;
  name: string;
  channel: 'EMAIL' | 'PUSH' | 'SMS' | 'IN_APP';
  subject?: string;
  body: string; // Con placeholder {{variabile}}
  variables: string[];
  triggerEvent?: TournamentEvent;
}

// Eventi che attivano messaggi automatici
enum TournamentEvent {
  REGISTRATION_CONFIRMED,
  REGISTRATION_CANCELLED,
  TOURNAMENT_STARTING_SOON,  // N giorni prima
  TOURNAMENT_STARTED,
  CATCH_VALIDATED,
  TOURNAMENT_COMPLETED,
  RESULTS_PUBLISHED
}
```

### 8.3 Broadcast ai Partecipanti

**UI necessaria:**
- Composer messaggio con variabili
- Selezione destinatari (tutti, team specifici, staff)
- Programmazione invio
- Storico messaggi inviati

---

## 9. Report e Documenti

### 9.1 Documenti Generabili

| Documento | Quando | Formato |
|-----------|--------|---------|
| Lista Iscritti | REGISTRATION_CLOSED | PDF, CSV, Excel |
| Assegnazioni Ispettori | REGISTRATION_CLOSED | PDF |
| Classifica Provvisoria | ONGOING | PDF, Live Web |
| Classifica Finale | COMPLETED | PDF |
| Verbale di Gara | COMPLETED | PDF |
| Certificati Partecipazione | COMPLETED | PDF |
| Report FIPSAS | COMPLETED | PDF (formato federale) |

### 9.2 Struttura Report FIPSAS

```
┌─────────────────────────────────────────────────────────────────┐
│ FEDERAZIONE ITALIANA PESCA SPORTIVA E ATTIVITÀ SUBACQUEE       │
│ VERBALE DI GARA                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Manifestazione: [Nome Torneo]                                   │
│ Disciplina: [Drifting/Big Game/etc]                             │
│ Livello: [Provinciale/Regionale/Nazionale]                      │
│ Data: [DD/MM/YYYY]                                              │
│ Località: [Location]                                            │
│ Organizzatore: [Nome Associazione]                              │
├─────────────────────────────────────────────────────────────────┤
│ CLASSIFICA UFFICIALE                                            │
│ ┌─────┬──────────────┬───────────┬─────────┬─────────┐         │
│ │ Pos │ Concorrente  │ Società   │ Peso    │ Punti   │         │
│ ├─────┼──────────────┼───────────┼─────────┼─────────┤         │
│ │ 1   │ ...          │ ...       │ ...     │ ...     │         │
│ └─────┴──────────────┴───────────┴─────────┴─────────┘         │
├─────────────────────────────────────────────────────────────────┤
│ Direttore di Gara: _______________  Firma: _______________      │
│ Data Omologazione: [DD/MM/YYYY]                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Omologazione FIPSAS

### 10.1 Processo di Omologazione

```
Gara Conclusa → Verbale Compilato → Invio a Comitato Settore → Omologazione
                                            ↓
                                    Richiesta Correzioni
                                            ↓
                                    Correzioni Applicate → Omologazione
```

### 10.2 Requisiti per Omologazione

- [ ] Regolamento conforme a livello torneo (Club/Provinciale/Regionale/Nazionale)
- [ ] Numero minimo partecipanti raggiunto
- [ ] Giudici qualificati presenti
- [ ] Documentazione completa (verbale, classifiche, foto)
- [ ] Nessun reclamo pendente

### 10.3 Tracciamento Stato Omologazione (da implementare)

```typescript
enum HomologationStatus {
  NOT_REQUIRED,    // Torneo non FIPSAS
  PENDING,         // In attesa invio
  SUBMITTED,       // Inviato a comitato
  UNDER_REVIEW,    // In revisione
  CORRECTIONS_NEEDED, // Richieste correzioni
  HOMOLOGATED,     // Omologato
  REJECTED         // Rifiutato
}

interface TournamentHomologation {
  tournamentId: string;
  status: HomologationStatus;
  submittedAt?: Date;
  homologatedAt?: Date;
  homologationNumber?: string;
  reviewerNotes?: string;
  documents: string[]; // URLs documenti inviati
}
```

---

## 11. Gap Analysis vs Sistema Attuale

### 11.1 Funzionalità Esistenti ✓

| Funzionalità | File | Stato |
|--------------|------|-------|
| CRUD Torneo | `tournament-crud.service.ts` | ✓ Completo |
| Lifecycle base | `tournament-lifecycle.service.ts` | ✓ Completo |
| Iscrizioni | `tournament-registration.service.ts` | ✓ Base |
| Zone pesca | `tournament-zones.service.ts` | ✓ Completo |
| Staff assignment | `TournamentStaff` model | ✓ Base |
| Catture | `Catch` model + routes | ✓ Base |
| PDF Classifica | `pdf.service.ts` | ✓ Completo |
| PDF Assegnazioni | `pdf.service.ts` | ✓ Completo |

### 11.2 Funzionalità Mancanti ✗

| Funzionalità | Priorità | Complessità |
|--------------|----------|-------------|
| Dashboard Admin real-time | Alta | Media |
| Transizioni automatiche | Alta | Bassa |
| Gestione waitlist | Media | Bassa |
| Sistema penalità | Media | Media |
| Validazione catture workflow | Alta | Media |
| Comunicazioni broadcast | Media | Media |
| Template messaggi | Bassa | Bassa |
| Omologazione FIPSAS | Bassa | Media |
| Export multi-formato | Media | Bassa |
| Gestione serie tornei | Bassa | Alta |

### 11.3 Miglioramenti UI Necessari

| Pagina | Miglioramenti |
|--------|---------------|
| `/dashboard/tournaments` | Filtri per stato, vista kanban |
| `/dashboard/tournaments/[id]` | Dashboard con metriche, checklist |
| `/dashboard/tournaments/[id]/participants` | Stato pagamento, bulk actions |
| `/dashboard/tournaments/[id]/judges` | Drag-drop assegnazioni |
| `/dashboard/tournaments/[id]/settings` | Sezione penalità, omologazione |
| **NUOVA** `/dashboard/tournaments/[id]/live` | Dashboard real-time durante gara |
| **NUOVA** `/dashboard/tournaments/[id]/communications` | Centro messaggi |

---

## 12. Roadmap Implementazione

### Fase 1: Fondamenta (Priorità Alta)

1. **Dashboard Admin Migliorata**
   - Checklist per fase torneo
   - Metriche e contatori
   - Azioni rapide contestuali

2. **Transizioni Automatiche**
   - Scheduler apertura/chiusura iscrizioni
   - Notifiche reminder

3. **Workflow Validazione Catture**
   - Stati: PENDING → APPROVED/REJECTED
   - UI per giudici
   - Motivazione rifiuto obbligatoria

### Fase 2: Esperienza Gara (Priorità Alta)

4. **Live Dashboard**
   - Classifica real-time (WebSocket)
   - Feed attività
   - Statistiche live

5. **Assegnazione Ispettori Migliorata**
   - Drag-drop matrice
   - Validazione vincoli
   - Generazione automatica

### Fase 3: Comunicazioni (Priorità Media)

6. **Sistema Notifiche**
   - Push notifications
   - Email template
   - Broadcast a gruppi

7. **Centro Messaggi**
   - Storico comunicazioni
   - Template riutilizzabili

### Fase 4: Compliance (Priorità Media)

8. **Sistema Penalità**
   - Gestione penalità/squalifiche
   - Impatto su classifiche
   - Storico decisioni

9. **Omologazione FIPSAS**
   - Tracciamento stato
   - Export formato federale
   - Checklist conformità

### Fase 5: Avanzato (Priorità Bassa)

10. **Serie Tornei**
    - Classifiche aggregate
    - Gestione scarti
    - Qualificazioni

11. **Integrazioni Esterne**
    - Bilance certificate
    - GPS tracking barche
    - Meteo real-time

---

## Fonti e Riferimenti

- [CatchStat - Tournament Software](https://www.catchstat.com/)
- [WeighFish - Tournament Management](https://www.weighfish.com/)
- [Web Pro Tournament Manager](https://webprotournamentmanager.com/features/)
- [FIPSAS - Regolamenti](https://www.fipsas.it/regolamenti-nazionali)
- [IGFA - Tournament Rules](https://igfa.org/tournaments/)
- [Playbook365 - Tournament Software](https://www.playbook365.com/tournament-software)
- [Battlefy - Registration Management](https://help.battlefy.com/)

---

*Documento generato per TournamentMaster - Sistema di gestione tornei di pesca sportiva*
