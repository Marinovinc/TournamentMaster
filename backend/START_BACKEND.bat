@echo off
cd /d "%~dp0"
echo ========================================
echo   TournamentMaster Backend Server
echo ========================================
echo.
echo Starting server on port 3001 in background...
echo.

:: Avvia in una nuova finestra minimizzata che resta attiva
START "TournamentMaster-Backend" /MIN cmd /c "npm run dev"

echo Backend avviato in background!
echo Puoi chiudere questa finestra.
echo.
echo Per vedere i log: apri Task Manager e cerca "node"
echo Per fermare: taskkill /F /FI "WINDOWTITLE eq TournamentMaster-Backend"
echo.
timeout /t 3
