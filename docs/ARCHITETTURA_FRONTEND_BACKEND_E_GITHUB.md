# Architettura Frontend/Backend e Workflow GitHub

**Data:** 2026-01-05
**Progetto:** TournamentMaster

---

## Indice

1. [Perché due porte diverse?](#perché-due-porte-diverse)
2. [Come comunicano Frontend e Backend](#come-comunicano-frontend-e-backend)
3. [Cos'è GitHub e a cosa serve](#cosè-github-e-a-cosa-serve)
4. [Workflow di sviluppo](#workflow-di-sviluppo)
5. [Riepilogo visuale](#riepilogo-visuale)

---

## Perché due porte diverse?

### Il concetto di "porta"

Una **porta** è come un numero di interno telefonico. Il tuo computer (l'indirizzo IP, es. `localhost` o `192.168.1.74`) è il centralino, e ogni applicazione risponde su un interno diverso.

| Applicazione | Porta | URL completo |
|--------------|-------|--------------|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend (Express) | 3001 | http://localhost:3001 |

### Perché non una sola applicazione?

L'architettura **separata** (Frontend + Backend) offre vantaggi importanti:

| Vantaggio | Spiegazione |
|-----------|-------------|
| **Scalabilità** | Puoi avere 10 server backend e 1 frontend, o viceversa |
| **Tecnologie diverse** | Frontend in React/Next.js, Backend in Node/Express (o Python, Go, etc.) |
| **Team separati** | Un team lavora sul design, un altro sulle API |
| **Sicurezza** | Il database è accessibile SOLO dal backend, mai dal browser |
| **Riusabilità** | Lo stesso backend può servire web, app mobile, altri sistemi |

### Esempio pratico TournamentMaster

```
┌─────────────────────────────────────────────────────────────────┐
│                        TUO COMPUTER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐         ┌─────────────────┐               │
│   │    FRONTEND     │         │    BACKEND      │               │
│   │   (Next.js)     │  ────►  │   (Express)     │               │
│   │   Porta 3000    │   API   │   Porta 3001    │               │
│   │                 │  calls  │                 │               │
│   │  - Interfaccia  │         │  - Logica       │               │
│   │  - Pagine HTML  │         │  - Database     │               │
│   │  - Stili CSS    │         │  - Autenticaz.  │               │
│   └─────────────────┘         └────────┬────────┘               │
│                                        │                         │
│                                        ▼                         │
│                               ┌─────────────────┐               │
│                               │    DATABASE     │               │
│                               │    (MySQL)      │               │
│                               │   Porta 3306    │               │
│                               └─────────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Come comunicano Frontend e Backend

### Il flusso di una richiesta

Quando clicchi "Mostra Tornei" nel browser:

```
1. Browser (porta 3000)
   └── Utente clicca "Tornei"

2. Frontend (Next.js)
   └── Esegue: fetch("http://localhost:3001/api/tournaments")

3. Backend (Express, porta 3001)
   └── Riceve richiesta GET /api/tournaments
   └── Verifica token JWT (sei autenticato?)
   └── Query al database MySQL
   └── Restituisce JSON con lista tornei

4. Frontend
   └── Riceve JSON
   └── Renderizza la tabella tornei

5. Browser
   └── Utente vede la lista
```

### Esempio di chiamata API

**Frontend** (`tournaments/page.tsx`):
```typescript
const response = await fetch(`${API_URL}/api/tournaments`, {
  headers: {
    Authorization: `Bearer ${token}`
  },
});
const data = await response.json();
setTournaments(data.data);
```

**Backend** (`tournament.routes.ts`):
```typescript
router.get("/", authenticate, async (req, res) => {
  const tournaments = await prisma.tournament.findMany();
  res.json({ success: true, data: tournaments });
});
```

### Configurazione URL API

Il frontend sa dove trovare il backend tramite variabile d'ambiente:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

In produzione (Railway):
```bash
NEXT_PUBLIC_API_URL=https://backend-production-70dd0.up.railway.app
```

---

## Cos'è GitHub e a cosa serve

### GitHub in parole semplici

**GitHub** è un servizio cloud che:
1. **Salva il codice** in modo sicuro (backup)
2. **Tiene traccia delle modifiche** (chi ha cambiato cosa, quando)
3. **Permette collaborazione** (più persone sullo stesso progetto)
4. **Gestisce versioni** (puoi tornare indietro se qualcosa si rompe)

### Git vs GitHub

| Strumento | Cos'è | Dove gira |
|-----------|-------|-----------|
| **Git** | Software di versioning | Sul tuo computer |
| **GitHub** | Servizio cloud per ospitare repository Git | Su internet (github.com) |

### Repository TournamentMaster

```
https://github.com/Marinovinc/TournamentMaster
```

Contiene:
- `/backend` - Codice server Express + Prisma
- `/frontend` - Codice Next.js React
- `/mobile` - App React Native
- `/docs` - Documentazione

### Comandi Git essenziali

| Comando | Cosa fa | Esempio |
|---------|---------|---------|
| `git status` | Mostra file modificati | `git status` |
| `git add` | Prepara file per il commit | `git add backend/src/routes/team.routes.ts` |
| `git commit` | Salva le modifiche localmente | `git commit -m "feat: add new feature"` |
| `git push` | Carica su GitHub | `git push` |
| `git pull` | Scarica da GitHub | `git pull` |
| `git log` | Mostra storico commit | `git log --oneline -5` |

### Flusso tipico di lavoro

```
1. Scrivi codice
   └── Modifichi team.routes.ts

2. Verifica modifiche
   └── git status
   └── Vedi: "modified: team.routes.ts"

3. Prepara commit
   └── git add backend/src/routes/team.routes.ts

4. Crea commit (salvataggio locale)
   └── git commit -m "feat(teams): add external members endpoint"

5. Carica su GitHub (backup cloud)
   └── git push

6. Vai su github.com
   └── Vedi il commit nella cronologia
```

---

## Workflow di sviluppo

### Sessione tipica di sviluppo

```
┌─────────────────────────────────────────────────────────────────┐
│                     SESSIONE DI SVILUPPO                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. AVVIO                                                        │
│     ├── cd TournamentMaster/backend && npm run dev              │
│     └── cd TournamentMaster/frontend && npm run dev             │
│                                                                  │
│  2. SVILUPPO                                                     │
│     ├── Modifico codice                                          │
│     ├── Salvo file (Ctrl+S)                                      │
│     └── Nodemon/Next.js ricaricano automaticamente              │
│                                                                  │
│  3. TEST                                                         │
│     ├── Apro browser http://localhost:3000                      │
│     └── Verifico che funzioni                                    │
│                                                                  │
│  4. COMMIT                                                       │
│     ├── git add .                                                │
│     ├── git commit -m "descrizione"                              │
│     └── git push                                                 │
│                                                                  │
│  5. DEPLOY (opzionale)                                           │
│     └── Railway rileva push e fa deploy automatico              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Ambienti di esecuzione

| Ambiente | Frontend | Backend | Database | Uso |
|----------|----------|---------|----------|-----|
| **Locale (Dev)** | localhost:3000 | localhost:3001 | localhost:3306 | Sviluppo |
| **Railway (Prod)** | tournamentmaster.app | backend-xxx.railway.app | MySQL Railway | Utenti reali |

---

## Riepilogo visuale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                            SVILUPPATORE                                  │
│                                 │                                        │
│                                 ▼                                        │
│                    ┌───────────────────────┐                            │
│                    │     CODICE LOCALE     │                            │
│                    │  (TournamentMaster/)  │                            │
│                    └───────────┬───────────┘                            │
│                                │                                        │
│              ┌─────────────────┼─────────────────┐                      │
│              │                 │                 │                      │
│              ▼                 ▼                 ▼                      │
│     ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                │
│     │  FRONTEND   │   │   BACKEND   │   │   MOBILE    │                │
│     │  Next.js    │   │   Express   │   │ React Native│                │
│     │  :3000      │   │   :3001     │   │             │                │
│     └─────────────┘   └──────┬──────┘   └─────────────┘                │
│                              │                                          │
│                              ▼                                          │
│                    ┌─────────────────┐                                  │
│                    │    DATABASE     │                                  │
│                    │     MySQL       │                                  │
│                    │     :3306       │                                  │
│                    └─────────────────┘                                  │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                          │
│                           git push                                       │
│                              │                                          │
│                              ▼                                          │
│                    ┌─────────────────┐                                  │
│                    │     GITHUB      │                                  │
│                    │  (Cloud Backup) │                                  │
│                    │                 │                                  │
│                    │ - Cronologia    │                                  │
│                    │ - Collaboraz.   │                                  │
│                    │ - Issues        │                                  │
│                    └────────┬────────┘                                  │
│                              │                                          │
│                              ▼ (webhook)                                │
│                    ┌─────────────────┐                                  │
│                    │    RAILWAY      │                                  │
│                    │  (Produzione)   │                                  │
│                    │                 │                                  │
│                    │ Deploy auto     │                                  │
│                    └─────────────────┘                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Domande frequenti

### Perché il backend non è incluso nel frontend?

**Sicurezza:** Il codice frontend viene scaricato nel browser dell'utente. Se mettessimo la password del database nel frontend, chiunque potrebbe vederla.

### Posso usare una sola porta?

Sì, con un **reverse proxy** (es. Nginx) puoi esporre tutto sulla porta 80:
- `example.com/` → Frontend
- `example.com/api/` → Backend

In sviluppo è più semplice tenerli separati.

### Cosa succede se il backend è spento?

Il frontend si carica (è statico), ma le chiamate API falliscono. Vedrai errori tipo "Network Error" o "Failed to fetch".

### Come faccio a vedere i commit su GitHub?

1. Vai su https://github.com/Marinovinc/TournamentMaster
2. Clicca su "Commits"
3. Vedi la lista di tutti i salvataggi con data, autore e descrizione

---

**Documento creato da:** Claude Code (Opus 4.5)
**Ultima modifica:** 2026-01-05
