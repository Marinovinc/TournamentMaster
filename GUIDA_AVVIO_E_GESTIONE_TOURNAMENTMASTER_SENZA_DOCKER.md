# Guida Completa all'Avvio e Gestione di TournamentMaster senza Docker

**Versione:** 1.0
**Data:** 30 Dicembre 2025
**Ambiente:** Windows 10/11 con XAMPP

---

## Indice

1. [Panoramica del Sistema](#1-panoramica-del-sistema)
2. [Architettura dell'Applicazione](#2-architettura-dellapplicazione)
3. [Prerequisiti](#3-prerequisiti)
4. [Procedura di Avvio](#4-procedura-di-avvio)
5. [Verifica del Funzionamento](#5-verifica-del-funzionamento)
6. [Arresto dei Servizi](#6-arresto-dei-servizi)
7. [Risoluzione Problemi](#7-risoluzione-problemi)
8. [Manutenzione Database](#8-manutenzione-database)

---

## 1. Panoramica del Sistema

TournamentMaster e una piattaforma SaaS per la gestione di tornei di pesca sportiva. L'applicazione e composta da tre componenti principali che comunicano tra loro:

- **Frontend**: Interfaccia utente web costruita con Next.js 16
- **Backend**: API REST costruita con Express.js e TypeScript
- **Database**: MySQL per la persistenza dei dati

Questa guida descrive come avviare l'applicazione in modalita development senza utilizzare Docker, sfruttando MySQL di XAMPP gia installato sul sistema.

---

## 2. Architettura dell'Applicazione

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│                    http://localhost:3000                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                          │
│                         Porta 3000                               │
│  Percorso: C:\Users\marin\Downloads\TournamentMaster\frontend   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ API Calls
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Express + Prisma)                     │
│                         Porta 3001                               │
│  Percorso: C:\Users\marin\Downloads\TournamentMaster\backend    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ SQL Queries
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (MySQL)                            │
│                         Porta 3306                               │
│                 Database: tournamentmaster                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Prerequisiti

Prima di avviare TournamentMaster, verificare che siano soddisfatti i seguenti requisiti:

### 3.1 Software Richiesto

| Software | Versione Minima | Verifica Installazione |
|----------|-----------------|------------------------|
| Node.js | 18.x o superiore | `node --version` |
| npm | 9.x o superiore | `npm --version` |
| MySQL | 5.7 o superiore | Attivo tramite XAMPP |

### 3.2 Stato XAMPP

MySQL deve essere attivo nel pannello di controllo XAMPP. Verificare che la porta 3306 sia in ascolto.

### 3.3 Database

Il database `tournamentmaster` deve esistere. Se non esiste, verra creato automaticamente da Prisma al primo avvio del backend.

---

## 4. Procedura di Avvio

### 4.1 Metodo Automatico (Consigliato)

Eseguire il file batch con doppio click:

```
C:\Users\marin\Downloads\TournamentMaster\START_DEV.bat
```

Questo script:
1. Verifica che MySQL sia attivo
2. Verifica che il database esista
3. Avvia il backend in una nuova finestra
4. Avvia il frontend in una nuova finestra
5. Offre di aprire il browser

### 4.2 Metodo Manuale

Se si preferisce avviare i servizi manualmente, seguire questi passaggi:

#### Passo 1: Verificare MySQL

Aprire un terminale e verificare che MySQL sia raggiungibile:

```powershell
mysql -u root -e "SHOW DATABASES LIKE 'tournamentmaster'"
```

Output atteso:
```
+---------------------------+
| Database (tournamentmaster) |
+---------------------------+
| tournamentmaster            |
+---------------------------+
```

#### Passo 2: Avviare il Backend

Aprire un **primo terminale** ed eseguire:

```powershell
cd "C:\Users\marin\Downloads\TournamentMaster\backend"
npx ts-node src/index.ts
```

Attendere il messaggio di conferma:

```
========================================
  TournamentMaster Backend API
========================================
  Environment: development
  Port: 3001
  Frontend URL: http://localhost:3000
  Database: Connected
========================================
```

#### Passo 3: Avviare il Frontend

Aprire un **secondo terminale** ed eseguire:

```powershell
cd "C:\Users\marin\Downloads\TournamentMaster\frontend"
npm run dev
```

Attendere il messaggio di conferma:

```
▲ Next.js 16.1.1 (Turbopack)
- Local: http://localhost:3000
✓ Ready in XXXms
```

#### Passo 4: Accedere all'Applicazione

Aprire il browser e navigare a:

```
http://localhost:3000
```

---

## 5. Verifica del Funzionamento

### 5.1 Test delle Porte

Verificare che entrambe le porte siano in ascolto:

```powershell
netstat -ano | findstr ":3000 :3001"
```

Output atteso (i PID saranno diversi):
```
TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    67890
```

### 5.2 Test API Backend

Verificare che l'API risponda correttamente:

```powershell
curl http://localhost:3001/api/tournaments
```

Output atteso: JSON con l'elenco dei tornei.

### 5.3 Credenziali di Accesso

Per accedere all'applicazione, utilizzare le seguenti credenziali demo:

| Ruolo | Email | Password |
|-------|-------|----------|
| Amministratore | admin@ischiafishing.it | demo123 |
| Giudice | giudice@ischiafishing.it | demo123 |

---

## 6. Arresto dei Servizi

### 6.1 Arresto Normale

Per arrestare i servizi, premere `Ctrl+C` in ciascuna finestra del terminale dove sono in esecuzione backend e frontend.

### 6.2 Arresto Forzato

Se i servizi non rispondono, identificare e terminare i processi:

```powershell
# Trovare i PID
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"

# Terminare i processi (sostituire XXXX con il PID)
taskkill /PID XXXX /F
```

---

## 7. Risoluzione Problemi

### 7.1 Errore: "Database not connected"

**Causa:** MySQL non e attivo o il database non esiste.

**Soluzione:**
1. Verificare che MySQL sia attivo in XAMPP
2. Creare il database se necessario:
   ```sql
   CREATE DATABASE tournamentmaster;
   ```
3. Eseguire le migration Prisma:
   ```powershell
   cd "C:\Users\marin\Downloads\TournamentMaster\backend"
   npx prisma migrate dev
   ```

### 7.2 Errore: "Port 3000/3001 already in use"

**Causa:** Un altro processo sta utilizzando la porta.

**Soluzione:**
```powershell
# Identificare il processo
netstat -ano | findstr ":3000"

# Terminare il processo
taskkill /PID <numero> /F
```

### 7.3 Errore: "Module not found"

**Causa:** Le dipendenze non sono installate.

**Soluzione:**
```powershell
# Backend
cd "C:\Users\marin\Downloads\TournamentMaster\backend"
npm install

# Frontend
cd "C:\Users\marin\Downloads\TournamentMaster\frontend"
npm install
```

### 7.4 Backend si chiude subito ("clean exit")

**Causa:** nodemon puo avere problemi in alcune configurazioni.

**Soluzione:** Avviare direttamente con ts-node invece di npm run dev:
```powershell
cd "C:\Users\marin\Downloads\TournamentMaster\backend"
npx ts-node src/index.ts
```

---

## 8. Manutenzione Database

### 8.1 Accesso Diretto al Database

```powershell
mysql -u root
USE tournamentmaster;
```

### 8.2 Prisma Studio (Interfaccia Grafica)

Per visualizzare e modificare i dati tramite interfaccia grafica:

```powershell
cd "C:\Users\marin\Downloads\TournamentMaster\backend"
npx prisma studio
```

Questo aprira un browser su `http://localhost:5555` con l'interfaccia di gestione dati.

### 8.3 Reset Database

Per resettare completamente il database (ATTENZIONE: cancella tutti i dati):

```powershell
cd "C:\Users\marin\Downloads\TournamentMaster\backend"
npx prisma migrate reset
```

### 8.4 Seed Dati Demo

Per ripopolare il database con i dati demo:

```powershell
cd "C:\Users\marin\Downloads\TournamentMaster\backend"
npx prisma db seed
```

---

## Riepilogo Comandi Rapidi

| Azione | Comando |
|--------|---------|
| Avvio automatico | `START_DEV.bat` |
| Avvio backend | `cd backend && npx ts-node src/index.ts` |
| Avvio frontend | `cd frontend && npm run dev` |
| Test API | `curl http://localhost:3001/api/tournaments` |
| Prisma Studio | `cd backend && npx prisma studio` |
| Stop servizi | `Ctrl+C` in ogni terminale |

---

*Documento generato il 30 Dicembre 2025*
