@echo off
title TournamentMaster - Server Completo
color 0A

echo ========================================
echo   TournamentMaster - Avvio Completo
echo ========================================
echo.
echo IP Server: 192.168.1.74
echo Frontend:  http://192.168.1.74:3000
echo Backend:   http://192.168.1.74:3001
echo.
echo Assicurati che il PC abbia IP 192.168.1.74
echo (vedi GUIDA_IP_STATICO_ROUTER.md)
echo.
echo ----------------------------------------
echo.

:: Avvia Backend in una nuova finestra
echo Avvio Backend (porta 3001)...
start "TournamentMaster Backend" cmd /c "cd /d "%~dp0backend" && npm run dev"

:: Aspetta 3 secondi per il backend
timeout /t 3 /nobreak > nul

:: Avvia Frontend in una nuova finestra
echo Avvio Frontend (porta 3000)...
start "TournamentMaster Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo   Server avviati!
echo ========================================
echo.
echo Frontend: http://192.168.1.74:3000
echo Backend:  http://192.168.1.74:3001
echo Health:   http://192.168.1.74:3001/api/health
echo.
echo Chiudi questa finestra quando vuoi fermare i server.
echo Premi un tasto per terminare tutti i server...
pause > nul

:: Termina i processi node
taskkill /f /fi "WINDOWTITLE eq TournamentMaster Backend*" > nul 2>&1
taskkill /f /fi "WINDOWTITLE eq TournamentMaster Frontend*" > nul 2>&1
echo Server terminati.
