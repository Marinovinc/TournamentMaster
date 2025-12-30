@echo off
title TournamentMaster - Backend Server
color 0A

echo ========================================
echo   TournamentMaster - Avvio Server
echo ========================================
echo.
echo IP Server: 192.168.1.74
echo Porta API: 3001
echo.
echo Assicurati che il PC abbia IP 192.168.1.74
echo (configura IP statico nel router)
echo.
echo ----------------------------------------
echo.

cd /d "%~dp0backend"

echo Avvio backend in corso...
echo.

npm run dev

pause
