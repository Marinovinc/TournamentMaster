# Migrazione TournamentMaster - 6 Gennaio 2026

## Riepilogo

**Data:** 2026-01-06
**Operazione:** Migrazione directory progetto
**Da:** `C:\Users\marin\Downloads\TournamentMaster`
**A:** `D:\Dev\TournamentMaster`

---

## Motivazione

La directory Downloads non è una posizione appropriata per progetti di sviluppo attivi:
- Rischio di cancellazione accidentale durante pulizia Downloads
- Path lungo e non standard
- Meglio avere progetti in una directory dedicata allo sviluppo

---

## Operazioni Eseguite

### 1. Copia Progetto
```powershell
robocopy "C:\Users\marin\Downloads\TournamentMaster" "D:\Dev\TournamentMaster" /E /COPYALL
```

### 2. Verifica Integrità
- ✅ Frontend: 427 file copiati
- ✅ Backend: struttura completa
- ✅ node_modules: preservati
- ✅ .git: repository intatto

### 3. Test Funzionamento
- ✅ Backend avviato su porta 3001
- ✅ Frontend avviato su porta 3000
- ✅ API `/api/tournaments` risponde correttamente

### 4. Aggiornamento Script Batch

| File | Modifica |
|------|----------|
| `START_FRONTEND.bat` | Path frontend aggiornato |
| `START_TOURNAMENTMASTER.bat` | Tutti i path aggiornati (logs, .next cache, backend, frontend) |
| `START_DEV.bat` | Path backend e frontend aggiornati |

**Script già compatibili (usano `%~dp0`):**
- `backend\START_BACKEND.bat`
- `backend\STOP_BACKEND.bat`
- `STOP_FRONTEND.bat`
- `STOP_TOURNAMENTMASTER.bat`
- `AVVIA_SERVER.bat`
- `start.bat` (Docker)

### 5. Sincronizzazione GitHub
```bash
git push origin master
```
Commit: `a0fcca1` - "fix: Update paths after migration to D:\Dev\TournamentMaster"

---

## Struttura Finale

```
D:\Dev\TournamentMaster\
├── backend\
│   ├── src\
│   ├── START_BACKEND.bat
│   ├── STOP_BACKEND.bat
│   └── package.json
├── frontend\
│   ├── src\
│   ├── public\
│   └── package.json
├── START_FRONTEND.bat
├── STOP_FRONTEND.bat
├── START_TOURNAMENTMASTER.bat
├── STOP_TOURNAMENTMASTER.bat
├── START_DEV.bat
├── AVVIA_SERVER.bat
├── start.bat (Docker)
└── README.md
```

---

## Porte e URL

| Servizio | Porta | URL |
|----------|-------|-----|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend (Express) | 3001 | http://localhost:3001 |

---

## Comandi Rapidi

**Avvio completo:**
```cmd
D:\Dev\TournamentMaster\START_TOURNAMENTMASTER.bat
```

**Avvio singoli:**
```cmd
D:\Dev\TournamentMaster\backend\START_BACKEND.bat
D:\Dev\TournamentMaster\START_FRONTEND.bat
```

**Stop:**
```cmd
D:\Dev\TournamentMaster\STOP_TOURNAMENTMASTER.bat
```

---

## Directory Originale

La directory originale `C:\Users\marin\Downloads\TournamentMaster` è stata lasciata in attesa di eliminazione manuale.

**Per eliminarla dopo aver chiuso Claude Code:**
```cmd
rmdir /s /q "C:\Users\marin\Downloads\TournamentMaster"
```

Oppure verrà eliminata automaticamente al prossimo riavvio di Windows (script di avvio creato).

---

## Note Tecniche

- La migrazione preserva tutti i node_modules, evitando `npm install`
- Il repository Git rimane intatto con tutta la storia dei commit
- Gli script che usano `%~dp0` (path relativo allo script) non richiedono modifiche

---

*Documento generato automaticamente durante la sessione di migrazione.*
