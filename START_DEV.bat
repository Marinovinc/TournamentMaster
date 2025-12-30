@echo off
chcp 65001 >nul
title TournamentMaster - Dev Mode
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║     TOURNAMENTMASTER - AVVIO DEVELOPMENT (no Docker)        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Path MySQL XAMPP
set MYSQL_PATH=D:\xampp\mysql\bin\mysql.exe

:: Verifica MySQL
echo [1/3] Verifica MySQL...
"%MYSQL_PATH%" -u root -e "SELECT 1" >nul 2>&1
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
"%MYSQL_PATH%" -u root -e "USE tournamentmaster" >nul 2>&1
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

:: Attendi 5 secondi per backend
echo Attendo avvio backend...
timeout /t 5 /nobreak >nul

:: Frontend in nuova finestra
start "TournamentMaster Frontend" cmd /k "cd /d C:\Users\marin\Downloads\TournamentMaster\frontend && npm run dev"

:: Attendi avvio frontend
echo Attendo avvio frontend...
timeout /t 8 /nobreak >nul

echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  TournamentMaster avviato!                                   │
echo ├──────────────────────────────────────────────────────────────┤
echo │  Frontend:  http://localhost:3000                            │
echo │  Backend:   http://localhost:3001/api/tournaments            │
echo │                                                              │
echo │  Credenziali demo:                                           │
echo │    admin@ischiafishing.it / demo123                          │
echo │    giudice@ischiafishing.it / demo123                        │
echo └──────────────────────────────────────────────────────────────┘
echo.

:: Apri browser automaticamente
echo Apertura browser...
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"

echo.
echo Premi un tasto per chiudere questa finestra...
echo (I server continueranno a girare nelle altre finestre)
pause >nul
