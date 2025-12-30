# TournamentMaster - Avvio Manuale (senza Docker)

## Prerequisiti

- Node.js installato
- MySQL attivo su localhost:3306
- Database `tournamentmaster` esistente

## Comandi di Avvio

### 1. Backend (porta 3001)

```bash
cd C:\Users\marin\Downloads\TournamentMaster\backend
npx ts-node src/index.ts
```

Oppure con nodemon (hot reload):
```bash
cd C:\Users\marin\Downloads\TournamentMaster\backend
npm run dev
```

### 2. Frontend (porta 3000)

```bash
cd C:\Users\marin\Downloads\TournamentMaster\frontend
npm run dev
```

## Avvio Rapido (PowerShell)

Aprire **due terminali separati**:

**Terminale 1 - Backend:**
```powershell
cd "C:\Users\marin\Downloads\TournamentMaster\backend"; npx ts-node src/index.ts
```

**Terminale 2 - Frontend:**
```powershell
cd "C:\Users\marin\Downloads\TournamentMaster\frontend"; npm run dev
```

## URL Applicazione

| Servizio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| API Tornei | http://localhost:3001/api/tournaments |

## Credenziali Demo

| Ruolo | Email | Password |
|-------|-------|----------|
| Admin | admin@ischiafishing.it | demo123 |
| Giudice | giudice@ischiafishing.it | demo123 |

## Troubleshooting

### Backend non parte
1. Verificare che MySQL sia attivo
2. Verificare che il database `tournamentmaster` esista:
   ```bash
   mysql -u root -e "SHOW DATABASES LIKE 'tournamentmaster'"
   ```

### Porta occupata
```bash
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"
```

Per terminare un processo su una porta:
```bash
taskkill /PID <numero_pid> /F
```

### Reinstallare dipendenze
```bash
cd C:\Users\marin\Downloads\TournamentMaster\backend
npm install

cd C:\Users\marin\Downloads\TournamentMaster\frontend
npm install
```

## Stop Servizi

Premere `Ctrl+C` in ogni terminale per fermare i server.
