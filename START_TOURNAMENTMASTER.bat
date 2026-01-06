@echo off
title TournamentMaster - Avvio Background
color 0A

echo ============================================
echo    TournamentMaster - Avvio Permanente
echo ============================================
echo.

:: Ferma eventuali istanze precedenti
echo Fermando istanze precedenti...
powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
powershell -Command "Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
timeout /t 3 /nobreak >nul

:: Rimuovi cache Next.js (causa lock file)
echo Pulizia cache Next.js...
rd /s /q "D:\Dev\TournamentMaster\frontend\.next" 2>nul
echo.

:: Crea cartella logs
if not exist "D:\Dev\TournamentMaster\logs" mkdir "D:\Dev\TournamentMaster\logs"

:: Svuota log precedenti
echo. > "D:\Dev\TournamentMaster\logs\backend.log"
echo. > "D:\Dev\TournamentMaster\logs\frontend.log"

:: Avvia Backend in nuova finestra minimizzata
echo Avvio Backend (porta 3001)...
start "TournamentMaster Backend" /min cmd /k "cd /d D:\Dev\TournamentMaster\backend && npm run dev"

timeout /t 5 /nobreak >nul

:: Avvia Frontend in nuova finestra minimizzata
echo Avvio Frontend (porta 3000)...
start "TournamentMaster Frontend" /min cmd /k "cd /d D:\Dev\TournamentMaster\frontend && npm run dev"

echo.
echo ============================================
echo    Server avviati in finestre separate
echo ============================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.
echo Le finestre dei server sono minimizzate.
echo Per fermare: chiudi le finestre o usa STOP_TOURNAMENTMASTER.bat
echo.

:: Attendi e verifica
echo Attendo avvio server (15 sec)...
timeout /t 15 /nobreak >nul
echo.
echo Verifica porte...
powershell -Command "if (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue) { Write-Host '[OK] Backend porta 3001 attivo' -ForegroundColor Green } else { Write-Host '[!!] Backend non pronto' -ForegroundColor Red }"
powershell -Command "if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { Write-Host '[OK] Frontend porta 3000 attivo' -ForegroundColor Green } else { Write-Host '[!!] Frontend non pronto' -ForegroundColor Red }"
echo.
pause
