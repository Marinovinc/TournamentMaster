@echo off
REM ============================================
REM TournamentMaster - Avvio Server Silenzioso
REM ============================================
REM Avvia frontend (porta 3000) e backend (porta 3001)
REM ============================================

cd /d D:\Dev\TournamentMaster

REM Avvia Backend (porta 3001)
start /B /MIN cmd /c "cd backend && npm run dev > nul 2>&1"

REM Attendi 3 secondi per il backend
timeout /t 3 /nobreak > nul

REM Avvia Frontend (porta 3000)
start /B /MIN cmd /c "cd frontend && npm run dev > nul 2>&1"

exit
