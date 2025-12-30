@echo off
chcp 65001 >nul
title TournamentMaster - Dev Mode
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║     TOURNAMENTMASTER - AVVIO DEVELOPMENT (no Docker)        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verifica MySQL
echo [1/3] Verifica MySQL...
mysql -u root -e "SELECT 1" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERRORE] MySQL non raggiungibile!
    echo Avvia XAMPP e riprova.
    pause
    exit /b 1
)
echo [OK] MySQL attivo

:: Verifica database
echo [2/3] Verifica database...
mysql -u root -e "USE tournamentmaster" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERRORE] Database 'tournamentmaster' non trovato!
    pause
    exit /b 1
)
echo [OK] Database presente

:: Avvio servizi
echo [3/3] Avvio servizi...
echo.

:: Backend in nuova finestra
start "TournamentMaster Backend" cmd /k "cd /d C:\Users\marin\Downloads\TournamentMaster\backend && npx ts-node src/index.ts"

:: Attendi 3 secondi per backend
timeout /t 3 /nobreak >nul

:: Frontend in nuova finestra
start "TournamentMaster Frontend" cmd /k "cd /d C:\Users\marin\Downloads\TournamentMaster\frontend && npm run dev"

:: Attendi avvio
timeout /t 5 /nobreak >nul

echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  TournamentMaster avviato!                                   │
echo ├──────────────────────────────────────────────────────────────┤
echo │  Frontend:  http://localhost:3000                            │
echo │  Backend:   http://localhost:3001                            │
echo │                                                              │
echo │  Credenziali:                                                │
echo │    admin@ischiafishing.it / demo123                          │
echo └──────────────────────────────────────────────────────────────┘
echo.

:: Apri browser
set /p openbrowser="Aprire il browser? (S/N): "
if /i "%openbrowser%"=="S" start "" "http://localhost:3000"

echo.
echo Premi un tasto per chiudere questa finestra...
echo (I server continueranno a girare nelle altre finestre)
pause >nul
