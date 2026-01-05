# TournamentMaster - Guida Completa Gestione Barche e Strike

---

## TODO - Stato Attuale (2026-01-05)

> **Ultimo aggiornamento:** 2026-01-05 22:00 | **Priorita:** MEDIA

### Funzionalita Completate

- [x] **Delete Team** - Eliminazione barca con conferma dialog (commit 456da9d)
- [x] **Create Team con Captain** - Selezione capitano alla creazione
- [x] **REGISTRATION_OPEN status** - Fix crash TournamentCard (commit a61bbd3)
- [x] **Backend Crew Roles** - Validazione ruoli
- [x] **Nuovo endpoint** - POST /teams/:id/members/external per membri esterni
- [x] **Campi representing club** - representingClubName, representingClubCode
- [x] **Frontend getRoleBadge()** - Aggiornato con nuovi ruoli (commit b697823)
- [x] **Frontend TeamMember** - Interfaccia con campi esterni
- [x] **Frontend Dialog membro esterno** - Completo
- [x] **Frontend Associazione Rappresentata** - Campo condizionale per provinciali (commit b697823)

### Blocchi Critici

- [ ] **Sbloccare Prisma Client** - File query_engine-windows.dll.node locked

### Backend da Completare

- [ ] **Migrazione dati** - UPDATE team_members SET role = TEAM_LEADER WHERE role = CAPTAIN
- [ ] **Test E2E Delete** - Verificare cascade delete team_members

---

## Documenti Correlati

| Documento | Descrizione |
|-----------|-------------|
| [HANDOVER_SESSIONE_DELETE_TEAM_20260105.md](./HANDOVER_SESSIONE_DELETE_TEAM_20260105.md) | Handover sessione Delete Team (con errori confessati) |
| [DOCUMENTAZIONE_TECNICA_DELETE_TEAM_20260105.md](./DOCUMENTAZIONE_TECNICA_DELETE_TEAM_20260105.md) | Documentazione tecnica Delete Team + Fix REGISTRATION_OPEN |
| [HANDOVER_SESSIONE_CREW_ROLES_20260105.md](./HANDOVER_SESSIONE_CREW_ROLES_20260105.md) | Handover sessione Crew Roles |
| [DOCUMENTAZIONE_TECNICA_CREW_ROLES_20260105.md](./DOCUMENTAZIONE_TECNICA_CREW_ROLES_20260105.md) | Documentazione tecnica Crew Roles |
| [ARCHITETTURA_FRONTEND_BACKEND_E_GITHUB.md](./ARCHITETTURA_FRONTEND_BACKEND_E_GITHUB.md) | Architettura sistema e workflow GitHub |

---

## Indice

1. [Panoramica](#panoramica)
2. [Ruoli Utente e Permessi](#ruoli-utente-e-permessi)
3. [Gestione Barche/Team](#gestione-barcheteam)
4. [Strike Live](#strike-live)
5. [API Reference](#api-reference)
6. [Credenziali di Test](#credenziali-di-test)
7. [Ruoli Equipaggio Drifting](#ruoli-equipaggio-drifting-v110) ← **NUOVO**
8. [Changelog](#changelog)

---

## Panoramica

TournamentMaster supporta la gestione completa di tornei di pesca sportiva con barche, equipaggi e registrazione degli strike in tempo reale. Le funzionalità sono progettate per tornei multi-società con tracciamento del club di origine.

### Flusso Tipico di un Torneo

```
1. Creazione Torneo (Admin/Presidente)
         ↓
2. Registrazione Barche/Team (Admin/Organizzatore)
         ↓
3. Assegnazione Ispettori (Admin/Organizzatore)
         ↓
4. Avvio Torneo
         ↓
5. Registrazione Strike Live (Giudici/Ispettori)
         ↓
6. Validazione Catture (Giudici)
         ↓
7. Classifica Finale
```

---

## Ruoli Utente e Permessi

### Gerarchia Ruoli

| Ruolo | Descrizione | Accesso Teams | Accesso Strike | Gestione |
|-------|-------------|---------------|----------------|----------|
| **SUPER_ADMIN** | Amministratore piattaforma | Completo | Completo | Tutto |
| **TENANT_ADMIN** | Amministratore società | Completo | Completo | Propria società |
| **PRESIDENT** | Presidente società | Completo | Completo | Propria società |
| **ORGANIZER** | Organizzatore tornei | Lettura/Modifica | Lettura/Registra | Tornei assegnati |
| **JUDGE** | Giudice di gara | Lettura | Registra/Valida | Catture |
| **PARTICIPANT** | Partecipante | Solo propri | Solo propri | Nessuna |

### Dettaglio Permessi

#### Super Admin (Vincenzo Marino)
- Visualizza tutti i team di tutte le società
- Può creare/modificare/eliminare qualsiasi team
- Accesso completo a tutti gli strike
- Gestione utenti globale

#### Amministratore Società (Crescenzo Mendella)
- Gestione completa team della propria società
- Assegnazione ispettori ai team
- Visualizzazione strike dei tornei della società
- Creazione tornei per la società

#### Presidente (Massimo Bottiglieri)
- **Stessi permessi di Amministratore Società**
- Ruolo di secondo amministratore
- Può sostituire l'admin in sua assenza

#### Partecipante (Gennaro Colicchio)
- Visualizza solo il proprio team
- Visualizza solo i propri strike
- Nessuna capacità di modifica

---

## Gestione Barche/Team

### Accesso alla Pagina

**URL:** `/[locale]/dashboard/teams`

**Navigazione:** Sidebar → "Barche/Team" (icona nave)

### Creazione Nuovo Team

1. Cliccare **"+ Nuovo Team"** in alto a destra
2. Compilare i campi obbligatori:

| Campo | Descrizione | Obbligatorio |
|-------|-------------|--------------|
| Nome Team | Nome identificativo del team | ✅ |
| Numero Barca | Numero di gara assegnato | ✅ |
| Nome Barca | Nome dell'imbarcazione | ❌ |
| Torneo | Torneo di appartenenza | ✅ |
| Capitano | Seleziona utente capitano | ✅ |

3. Cliccare **"Crea Team"**

### Gestione Equipaggio

Dopo aver creato il team:

1. Cliccare sull'icona **"Gestisci Equipaggio"** (icona utenti)
2. Aggiungere membri dell'equipaggio:
   - Selezionare utente dalla lista
   - Assegnare ruolo (Membro/Marinaio)
3. Rimuovere membri se necessario

### Assegnazione Ispettore

L'ispettore di bordo può essere assegnato a qualsiasi tipo di torneo, inclusi quelli societari.

1. Cliccare icona **"Assegna Ispettore"** (icona occhio)
2. Selezionare ispettore dalla lista dei giudici disponibili
3. **Per tornei multi-società** (Provinciale, Regionale, Nazionale, Internazionale): l'ispettore DEVE provenire da un club diverso dal team per garantire imparzialità
4. **Per tornei societari** (Sociale/Club): l'ispettore può essere dello stesso club, ma si consiglia comunque di evitare conflitti di interesse

### Modifica Team

1. Cliccare icona **"Modifica"** (icona matita)
2. Modificare i campi desiderati
3. Salvare le modifiche

### Eliminazione Team

1. Cliccare icona **"Elimina"** (icona cestino)
2. Confermare l'eliminazione nel dialog

⚠️ **Attenzione:** L'eliminazione è irreversibile e rimuoverà anche tutti gli strike associati.

### Filtri e Ricerca

- **Filtro Torneo:** Seleziona un torneo specifico
- **Ricerca:** Cerca per nome team o barca
- **Ordinamento:** Per nome, numero barca, strike count

---

## Strike Live

### Accesso alla Pagina

**URL:** `/[locale]/dashboard/strikes`

**Navigazione:** Sidebar → "Strike Live" (icona fulmine)

### Cos'è uno Strike?

Uno **strike** è la registrazione di un evento di pesca durante un torneo:
- Momento in cui un pesce abbocca all'amo
- Può risultare in: Cattura, Pesce Perso, Rilascio

### Dashboard Strike Live

La pagina mostra:

#### 1. Selezione Torneo
- Dropdown per selezionare il torneo attivo
- Solo tornei con stato "IN_PROGRESS" sono disponibili

#### 2. Griglia Team
- Card per ogni team iscritto al torneo
- Mostra:
  - Nome team e numero barca
  - Capitano
  - Conteggio strike
  - Pulsante "Registra Strike"

#### 3. Tabella Strike
- Lista cronologica degli strike registrati
- Auto-refresh ogni 30 secondi
- Colonne:
  - Timestamp
  - Team
  - Numero canna
  - Risultato (badge colorato)
  - Note

### Registrazione Strike

1. Selezionare il torneo dal dropdown
2. Cliccare **"Registra Strike"** sul team corrispondente
3. Compilare il form:

| Campo | Descrizione | Valori |
|-------|-------------|--------|
| Numero Canna | Quale canna ha avuto lo strike | 1-6 |
| Risultato | Esito dello strike | CATCH/LOST/RELEASED |
| Note | Note opzionali | Testo libero |

4. Cliccare **"Registra"**

### Risultati Strike

| Risultato | Badge | Descrizione | Punti* |
|-----------|-------|-------------|--------|
| **CATCH** | 🟢 Verde | Pesce catturato e portato a bordo | Varia per specie/peso |
| **LOST** | 🔴 Rosso | Pesce perso durante il combattimento | 0 |
| **RELEASED** | 🔵 Blu | Pesce rilasciato (catch & release) | Bonus rilascio |

*I punti variano in base al regolamento del torneo

### Auto-Refresh

- La pagina si aggiorna automaticamente ogni **30 secondi**
- Indicatore visivo mostra il countdown
- Pulsante **"Aggiorna Ora"** per refresh manuale

---

## API Reference

### Endpoints Team

#### GET /api/teams
Lista tutti i team accessibili all'utente.

**Query Parameters:**
- `tournamentId` (optional): Filtra per torneo
- `page` (default: 1): Pagina
- `limit` (default: 20): Risultati per pagina

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Team Ischia Fishing",
      "boatNumber": "42",
      "boatName": "Blue Marlin",
      "captainId": "uuid",
      "captain": { "firstName": "Mario", "lastName": "Rossi" },
      "inspectorId": "uuid",
      "inspector": { "firstName": "Luigi", "lastName": "Verdi" },
      "clubId": "uuid",
      "club": { "name": "Ischia Fishing Club" },
      "tournamentId": "uuid",
      "tournament": { "name": "Gran Premio Estate 2025", "level": "REGIONAL" },
      "crew": [...],
      "strikes": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

#### POST /api/teams
Crea un nuovo team.

**Body:**
```json
{
  "name": "Team Ischia Fishing",
  "boatNumber": "42",
  "boatName": "Blue Marlin",
  "captainId": "uuid",
  "tournamentId": "uuid"
}
```

#### PUT /api/teams/:id
Aggiorna un team esistente.

#### DELETE /api/teams/:id
Elimina un team.

#### POST /api/teams/:id/inspector
Assegna ispettore a un team.

**Body:**
```json
{
  "inspectorId": "uuid"
}
```

#### POST /api/teams/:id/crew
Gestisce l'equipaggio.

**Body:**
```json
{
  "action": "add" | "remove",
  "userId": "uuid",
  "role": "CREW" | "SAILOR"
}
```

### Endpoints Strike

#### GET /api/strikes
Lista tutti gli strike accessibili.

**Query Parameters:**
- `tournamentId` (optional): Filtra per torneo
- `teamId` (optional): Filtra per team
- `page` (default: 1): Pagina
- `limit` (default: 50): Risultati per pagina

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "teamId": "uuid",
      "team": { "name": "Team Ischia", "boatNumber": "42" },
      "rodNumber": 3,
      "result": "CATCH",
      "notes": "Tonno rosso 85kg",
      "timestamp": "2025-01-02T10:30:00Z",
      "recordedBy": "uuid",
      "recorder": { "firstName": "Luigi", "lastName": "Verdi" }
    }
  ],
  "pagination": {...}
}
```

#### POST /api/strikes
Registra un nuovo strike.

**Body:**
```json
{
  "teamId": "uuid",
  "rodNumber": 3,
  "result": "CATCH",
  "notes": "Tonno rosso stimato 80kg"
}
```

#### GET /api/strikes/team/:teamId/stats
Statistiche strike per team.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "catches": 8,
    "lost": 5,
    "released": 2,
    "catchRate": 53.33
  }
}
```

---

## Credenziali di Test

### Ambiente Development

| Ruolo | Email | Password |
|-------|-------|----------|
| Super Admin | marino@unitec.it | Gerstofen22 |
| Admin Società | admin@ischiafishing.it | demo123 |
| Presidente | presidente@ischiafishing.it | demo123 |
| Partecipante | utente@ischiafishing.it | demo123 |

### URL Applicazione

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health

---

## FAQ

### Come creo un torneo multi-società?

1. Vai a Dashboard → Admin
2. Crea nuovo torneo
3. Imposta il livello su PROVINCIAL, REGIONAL, NATIONAL o INTERNATIONAL
4. I tornei di questo livello richiedono ispettori da club diversi

### Posso modificare uno strike già registrato?

No, gli strike sono immutabili per garantire l'integrità dei dati. In caso di errore, contattare un amministratore.

### Come funziona l'auto-refresh della pagina Strike?

La pagina Strike Live si aggiorna automaticamente ogni 30 secondi. Un indicatore visivo mostra il countdown. Puoi anche cliccare "Aggiorna Ora" per un refresh immediato.

### Cosa succede se elimino un team?

L'eliminazione di un team è irreversibile e comporta:
- Rimozione del team dal torneo
- Eliminazione di tutti gli strike associati
- I membri dell'equipaggio non vengono eliminati (solo l'associazione)

---

---

## Ruoli Equipaggio Drifting (v1.1.0)

### Nuovo Enum CrewRole

La versione 1.1.0 introduce un sistema di ruoli specifico per le discipline drifting:

| Ruolo | Enum | Può essere Esterno | Descrizione |
|-------|------|-------------------|-------------|
| **Skipper** | `SKIPPER` | ✅ Sì | Conduttore barca, può essere non iscritto |
| **Capoequipaggio** | `TEAM_LEADER` | ❌ No | Responsabile team, deve essere registrato |
| **Equipaggio** | `CREW` | ❌ No | Membro equipaggio (2-3 membri) |
| **Pescatore** | `ANGLER` | ❌ No | Pescatore registrato |
| **Ospite** | `GUEST` | ✅ Sì | Ospite a bordo, può essere non iscritto |

### Membri Esterni

Per tornei interni (SOCIAL), skipper e ospiti possono essere persone non registrate:

```typescript
interface ExternalMember {
  externalName: string;      // Nome completo
  externalPhone?: string;    // Telefono opzionale
  externalEmail?: string;    // Email opzionale
  isExternal: true;
  role: "SKIPPER" | "GUEST";
}
```

### Associazione Rappresentata

Per tornei provinciali/nazionali, i team possono rappresentare un'associazione diversa:

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `representingClubName` | String? | Nome associazione rappresentata |
| `representingClubCode` | String? | Codice associazione (es. FIPs) |

---

## Changelog

### v1.1.1 (2026-01-05) - Delete Team & REGISTRATION_OPEN
- **Feature:** Delete Team con conferma dialog (commit 456da9d)
- **Feature:** Create Team con selezione Captain
- **Fix:** TournamentCard crash su status REGISTRATION_OPEN (commit a61bbd3)
- **Frontend:** Aggiunto status REGISTRATION_OPEN a statusConfig
- **Backend:** Validazione ruoli crew completata

### v1.1.0 (2026-01-05) - Crew Roles Drifting
- **Schema:** Aggiunto enum `CrewRole` (SKIPPER, TEAM_LEADER, CREW, ANGLER, GUEST)
- **Schema:** Aggiunti campi esterni per TeamMember (externalName, externalPhone, externalEmail, isExternal)
- **Schema:** Aggiunti campi Team per associazione rappresentata (representingClubName, representingClubCode)
- **Database:** Migrazione completata con `db push`
- **⚠️ BLOCCATO:** Prisma client non rigenerato (file locked)
- **TODO:** Aggiornamento UI teams/page.tsx

### v1.0.0 (2025-01-02)
- Implementazione iniziale gestione Team/Barche
- Implementazione Strike Live con auto-refresh
- Supporto ruolo PRESIDENT
- API REST complete per Team e Strike
- Guide contestuali integrate
