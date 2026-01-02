# Guida Completa: Installazione e Uso del Repository TournamentMaster

**Repository GitHub:** https://github.com/Marinovinc/TournamentMaster
**Data:** 2026-01-02
**Versione:** 1.0.0

---

## Indice

1. [Cos'e Questo Repository](#cose-questo-repository)
2. [Cosa Serve Prima di Iniziare](#cosa-serve-prima-di-iniziare)
3. [Come Scaricare il Progetto](#come-scaricare-il-progetto)
4. [Come Installare le Dipendenze](#come-installare-le-dipendenze)
5. [Come Configurare il Database](#come-configurare-il-database)
6. [Come Configurare i File di Ambiente](#come-configurare-i-file-di-ambiente)
7. [Come Avviare l'Applicazione](#come-avviare-lapplicazione)
8. [Come Accedere all'Applicazione](#come-accedere-allapplicazione)
9. [Struttura delle Cartelle](#struttura-delle-cartelle)
10. [Comandi Principali](#comandi-principali)
11. [Problemi Comuni e Soluzioni](#problemi-comuni-e-soluzioni)
12. [Come Aggiornare il Progetto](#come-aggiornare-il-progetto)
13. [Come Contribuire al Progetto](#come-contribuire-al-progetto)

---

## Cos'e Questo Repository

TournamentMaster e una piattaforma web per gestire tornei di pesca sportiva. Il repository contiene:

| Componente | Tecnologia | Descrizione |
|------------|------------|-------------|
| **Backend** | Node.js + Express | Server API che gestisce dati e logica |
| **Frontend** | Next.js + React | Interfaccia web che vedono gli utenti |
| **Mobile** | React Native + Expo | App per smartphone Android/iOS |
| **Database** | MySQL + Prisma | Dove vengono salvati tutti i dati |

### Funzionalita dell'Applicazione

- Creare e gestire tornei di pesca
- Registrare barche e team con equipaggio
- Monitorare catture in tempo reale (Strike Live)
- Gestire classifiche automatiche
- Caricare foto e video delle catture
- Supporto multi-lingua (italiano, inglese, tedesco, ecc.)

---

## Cosa Serve Prima di Iniziare

### Software da Installare

Prima di scaricare il progetto, installa questi programmi:

#### 1. Node.js (Obbligatorio)

Node.js e il motore che fa funzionare il server.

- **Scarica da:** https://nodejs.org
- **Versione:** 18.x o superiore (scegli la versione LTS)
- **Verifica installazione:**
```bash
node --version
# Deve mostrare: v18.x.x o superiore
```

#### 2. Git (Obbligatorio)

Git serve per scaricare e gestire il codice.

- **Scarica da:** https://git-scm.com
- **Verifica installazione:**
```bash
git --version
# Deve mostrare: git version 2.x.x
```

#### 3. MySQL o MariaDB (Obbligatorio)

Il database dove vengono salvati i dati.

- **MySQL:** https://dev.mysql.com/downloads/
- **MariaDB (alternativa):** https://mariadb.org/download/
- **XAMPP (include MySQL):** https://www.apachefriends.org

#### 4. Editor di Codice (Consigliato)

- **VS Code:** https://code.visualstudio.com (gratuito, consigliato)
- **WebStorm:** https://www.jetbrains.com/webstorm/ (a pagamento)

---

## Come Scaricare il Progetto

### Metodo 1: Tramite Git (Consigliato)

Apri il terminale (Prompt dei Comandi su Windows, Terminal su Mac) e digita:

```bash
# Vai nella cartella dove vuoi salvare il progetto
cd C:\Users\TuoNome\Progetti

# Scarica il repository
git clone https://github.com/Marinovinc/TournamentMaster.git

# Entra nella cartella del progetto
cd TournamentMaster
```

### Metodo 2: Download ZIP

1. Vai su https://github.com/Marinovinc/TournamentMaster
2. Clicca il pulsante verde **"Code"**
3. Clicca **"Download ZIP"**
4. Estrai il file ZIP nella cartella desiderata

---

## Come Installare le Dipendenze

Le "dipendenze" sono librerie esterne che il progetto usa. Vanno installate separatamente per backend e frontend.

### Passo 1: Installa dipendenze Backend

```bash
# Entra nella cartella backend
cd backend

# Installa le dipendenze (ci vogliono 1-2 minuti)
npm install
```

### Passo 2: Installa dipendenze Frontend

```bash
# Torna alla cartella principale e vai nel frontend
cd ../frontend

# Installa le dipendenze (ci vogliono 2-3 minuti)
npm install
```

### Passo 3: (Opzionale) Installa dipendenze Mobile

```bash
# Solo se vuoi sviluppare l'app mobile
cd ../mobile
npm install
```

---

## Come Configurare il Database

### Passo 1: Avvia MySQL

Se usi XAMPP:
1. Apri XAMPP Control Panel
2. Clicca "Start" accanto a MySQL

Se usi MySQL standalone:
```bash
# Windows (come servizio)
net start mysql

# Mac
brew services start mysql
```

### Passo 2: Crea il Database

Apri un client MySQL (phpMyAdmin, MySQL Workbench, o terminale) e esegui:

```sql
CREATE DATABASE tournamentmaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Oppure da terminale:

```bash
mysql -u root -p -e "CREATE DATABASE tournamentmaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

## Come Configurare i File di Ambiente

I file `.env` contengono le configurazioni private (password, chiavi, ecc.).

### Passo 1: Configura il Backend

```bash
cd backend

# Copia il file di esempio
cp .env.example .env
```

Apri `backend/.env` con un editor di testo e modifica:

```env
# Connessione Database
# Sostituisci 'username' e 'password' con i tuoi dati MySQL
DATABASE_URL="mysql://root:password@localhost:3306/tournamentmaster"

# Chiavi Segrete JWT (inventa due stringhe lunghe e casuali)
JWT_SECRET="una-stringa-molto-lunga-e-casuale-per-sicurezza-12345"
JWT_REFRESH_SECRET="altra-stringa-lunga-diversa-dalla-prima-67890"

# Porta del Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Passo 2: Configura il Frontend

Crea il file `frontend/.env.local`:

```bash
cd ../frontend
```

Crea un nuovo file chiamato `.env.local` con questo contenuto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Passo 3: Applica le Migrazioni Database

Questo crea le tabelle nel database:

```bash
cd ../backend

# Genera il client Prisma
npx prisma generate

# Crea le tabelle
npx prisma migrate dev

# Inserisci dati di test
npx prisma db seed
```

---

## Come Avviare l'Applicazione

Devi avviare **due server separati**: backend e frontend.

### Metodo Semplice: Due Terminali

**Terminale 1 - Backend:**
```bash
cd backend
npm run dev
```
Vedrai: `Server running on port 3001`

**Terminale 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Vedrai: `Ready on http://localhost:3000`

### Verifica che Funzioni

1. Apri il browser
2. Vai su http://localhost:3000
3. Dovresti vedere la pagina di login di TournamentMaster

---

## Come Accedere all'Applicazione

Dopo aver eseguito il seed del database, puoi accedere con questi utenti di test:

### Utenti Disponibili

| Ruolo | Email | Password | Cosa puo fare |
|-------|-------|----------|---------------|
| **Super Admin** | marino@unitec.it | Gerstofen22 | Tutto, gestisce l'intera piattaforma |
| **Admin Societa** | admin@ischiafishing.it | demo123 | Gestisce la propria societa |
| **Presidente** | presidente@ischiafishing.it | demo123 | Come Admin, secondo responsabile |
| **Partecipante** | utente@ischiafishing.it | demo123 | Vede i propri tornei e catture |

### Come Fare Login

1. Vai su http://localhost:3000/it/login
2. Inserisci email e password dalla tabella sopra
3. Clicca "Accedi"

---

## Struttura delle Cartelle

```
TournamentMaster/
│
├── backend/                      # SERVER API
│   ├── prisma/
│   │   ├── schema.prisma         # Definizione tabelle database
│   │   ├── migrations/           # Storico modifiche database
│   │   └── seed.ts               # Dati di test iniziali
│   ├── src/
│   │   ├── routes/               # Endpoint API (/api/teams, /api/strikes, ecc.)
│   │   ├── services/             # Logica di business
│   │   ├── middleware/           # Autenticazione, validazione
│   │   └── app.ts                # Configurazione Express
│   ├── .env                      # Configurazioni private (da creare)
│   └── package.json              # Dipendenze backend
│
├── frontend/                     # SITO WEB
│   ├── src/
│   │   ├── app/[locale]/         # Pagine del sito
│   │   │   ├── dashboard/        # Area utente loggato
│   │   │   │   ├── teams/        # Pagina gestione barche
│   │   │   │   ├── strikes/      # Pagina strike live
│   │   │   │   └── admin/        # Pagina amministrazione
│   │   │   ├── login/            # Pagina login
│   │   │   └── register/         # Pagina registrazione
│   │   ├── components/           # Componenti riutilizzabili
│   │   └── contexts/             # Gestione stato globale
│   ├── .env.local                # Configurazioni frontend (da creare)
│   └── package.json              # Dipendenze frontend
│
├── mobile/                       # APP SMARTPHONE
│   ├── App.tsx                   # Schermata principale app
│   └── package.json              # Dipendenze mobile
│
├── docs/                         # DOCUMENTAZIONE
│   └── GUIDA_BARCHE_STRIKE_FEATURES.md
│
├── DOCUMENTAZIONE_COMPLETA_TOURNAMENTMASTER.md   # Documentazione tecnica
├── GUIDA_INSTALLAZIONE_E_USO_REPOSITORY.md       # Questo file
└── README.md                                      # Readme in inglese
```

---

## Comandi Principali

### Comandi Backend (da eseguire in `backend/`)

| Comando | Cosa Fa |
|---------|---------|
| `npm run dev` | Avvia il server in sviluppo (si riavvia automaticamente) |
| `npm run build` | Compila per produzione |
| `npm start` | Avvia il server compilato |
| `npx prisma studio` | Apre interfaccia grafica per vedere il database |
| `npx prisma migrate dev` | Applica nuove modifiche al database |
| `npx prisma db seed` | Inserisce dati di test |

### Comandi Frontend (da eseguire in `frontend/`)

| Comando | Cosa Fa |
|---------|---------|
| `npm run dev` | Avvia il sito in sviluppo |
| `npm run build` | Compila per produzione |
| `npm start` | Avvia il sito compilato |
| `npm run lint` | Controlla errori nel codice |

### Comandi Git (da qualsiasi cartella del progetto)

| Comando | Cosa Fa |
|---------|---------|
| `git pull` | Scarica le ultime modifiche da GitHub |
| `git status` | Mostra quali file sono stati modificati |
| `git add .` | Prepara tutti i file per il commit |
| `git commit -m "messaggio"` | Salva le modifiche localmente |
| `git push` | Carica le modifiche su GitHub |

---

## Problemi Comuni e Soluzioni

### "npm: command not found"

**Causa:** Node.js non e installato o non e nel PATH.

**Soluzione:**
1. Scarica e installa Node.js da https://nodejs.org
2. Riavvia il terminale
3. Verifica con `node --version`

---

### "Port 3000 is already in use"

**Causa:** Un altro programma sta usando la porta 3000.

**Soluzione Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <numero_mostrato> /F
```

**Soluzione Mac/Linux:**
```bash
lsof -i :3000
kill -9 <pid>
```

---

### "Cannot connect to database" o "Connection refused"

**Causa:** MySQL non e in esecuzione o le credenziali sono sbagliate.

**Soluzione:**
1. Verifica che MySQL sia avviato (XAMPP → MySQL → Start)
2. Controlla username e password in `backend/.env`
3. Verifica che il database esista:
```sql
SHOW DATABASES LIKE 'tournamentmaster';
```

---

### "Prisma Client not generated"

**Causa:** Il client Prisma non e stato generato dopo l'installazione.

**Soluzione:**
```bash
cd backend
npx prisma generate
```

---

### "Module not found" o "Cannot find module"

**Causa:** Le dipendenze non sono state installate.

**Soluzione:**
```bash
# Cancella e reinstalla
rm -rf node_modules
npm install
```

---

### Il Frontend non si connette al Backend

**Causa:** Il backend non e in esecuzione o l'URL e sbagliato.

**Soluzione:**
1. Verifica che il backend sia attivo su http://localhost:3001
2. Controlla `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```
3. Riavvia il frontend

---

### "CORS error" nel browser

**Causa:** Il backend non accetta richieste dal frontend.

**Soluzione:** Verifica che in `backend/src/app.ts` ci sia:
```typescript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## Come Aggiornare il Progetto

Quando ci sono nuove versioni del progetto:

```bash
# 1. Vai nella cartella del progetto
cd TournamentMaster

# 2. Scarica le ultime modifiche
git pull

# 3. Aggiorna le dipendenze (se necessario)
cd backend && npm install
cd ../frontend && npm install

# 4. Aggiorna il database (se ci sono nuove migrazioni)
cd ../backend
npx prisma migrate dev

# 5. Riavvia i server
```

---

## Come Contribuire al Progetto

Se vuoi modificare il codice e contribuire:

### 1. Crea un Branch

```bash
git checkout -b feature/nome-della-tua-modifica
```

### 2. Fai le Modifiche

Modifica i file necessari con il tuo editor.

### 3. Testa le Modifiche

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### 4. Salva le Modifiche

```bash
git add .
git commit -m "Descrizione delle modifiche"
```

### 5. Carica su GitHub

```bash
git push origin feature/nome-della-tua-modifica
```

### 6. Crea una Pull Request

1. Vai su https://github.com/Marinovinc/TournamentMaster
2. Clicca "Pull requests" → "New pull request"
3. Seleziona il tuo branch
4. Descrivi le modifiche e invia

---

## Supporto

Per domande o problemi:

1. Controlla questa guida
2. Leggi `DOCUMENTAZIONE_COMPLETA_TOURNAMENTMASTER.md`
3. Apri una Issue su GitHub: https://github.com/Marinovinc/TournamentMaster/issues

---

**Repository:** https://github.com/Marinovinc/TournamentMaster
