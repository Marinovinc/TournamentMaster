@echo off
chcp 65001 >nul
title TournamentMaster - Docker Manager
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         TOURNAMENTMASTER - DOCKER MANAGER                    ║
echo ║         Piattaforma Gestione Tornei Pesca                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verifica se Docker è installato
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERRORE] Docker non trovato!
    echo.
    echo Per installare Docker Desktop:
    echo   1. Vai su https://www.docker.com/products/docker-desktop
    echo   2. Scarica e installa Docker Desktop per Windows
    echo   3. Riavvia il PC
    echo   4. Avvia Docker Desktop
    echo   5. Esegui nuovamente questo script
    echo.
    pause
    exit /b 1
)

:: Verifica se Docker è in esecuzione
docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0E
    echo [ATTENZIONE] Docker Desktop non è in esecuzione!
    echo.
    echo Avvio Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo.
    echo Attendi che Docker Desktop sia pronto (icona nella system tray)
    echo Poi esegui nuovamente questo script.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker è installato e in esecuzione
echo.

:: Menu principale
:MENU
echo ┌──────────────────────────────────────────────────────────────┐
echo │                      MENU PRINCIPALE                         │
echo ├──────────────────────────────────────────────────────────────┤
echo │  1. Avvia TournamentMaster (docker compose up)               │
echo │  2. Ferma TournamentMaster (docker compose down)             │
echo │  3. Riavvia servizi (docker compose restart)                 │
echo │  4. Visualizza stato container                               │
echo │  5. Visualizza logs (tempo reale)                            │
echo │  6. Rebuild e avvia (dopo modifiche codice)                  │
echo │  7. Reset completo (elimina database!)                       │
echo │  8. Apri applicazione nel browser                            │
echo │  9. Esci                                                     │
echo └──────────────────────────────────────────────────────────────┘
echo.

set /p choice="Seleziona opzione (1-9): "

if "%choice%"=="1" goto START
if "%choice%"=="2" goto STOP
if "%choice%"=="3" goto RESTART
if "%choice%"=="4" goto STATUS
if "%choice%"=="5" goto LOGS
if "%choice%"=="6" goto REBUILD
if "%choice%"=="7" goto RESET
if "%choice%"=="8" goto BROWSER
if "%choice%"=="9" goto EXIT

echo.
echo [ERRORE] Opzione non valida. Riprova.
echo.
goto MENU

:: ==================== AVVIA ====================
:START
echo.
echo ══════════════════════════════════════════════════════════════
echo  AVVIO TOURNAMENTMASTER...
echo ══════════════════════════════════════════════════════════════
echo.

:: Verifica se esiste .env
if not exist ".env" (
    echo [INFO] File .env non trovato. Creo da template...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] File .env creato. Modifica con le tue API keys se necessario.
    ) else (
        echo [ATTENZIONE] Nessun template .env.example trovato.
    )
    echo.
)

docker compose up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ┌──────────────────────────────────────────────────────────────┐
    echo │  [OK] TournamentMaster avviato con successo!                 │
    echo ├──────────────────────────────────────────────────────────────┤
    echo │                                                              │
    echo │  Frontend:     http://localhost:3000                         │
    echo │  Backend API:  http://localhost:3001                         │
    echo │  Database:     localhost:3306                                │
    echo │                                                              │
    echo │  Credenziali default:                                        │
    echo │    Admin:    admin@ischiafishing.it / demo123                │
    echo │    Giudice:  giudice@ischiafishing.it / demo123              │
    echo │                                                              │
    echo └──────────────────────────────────────────────────────────────┘
) else (
    color 0C
    echo.
    echo [ERRORE] Avvio fallito. Controlla i logs con opzione 5.
)

echo.
pause
goto MENU

:: ==================== STOP ====================
:STOP
echo.
echo ══════════════════════════════════════════════════════════════
echo  ARRESTO TOURNAMENTMASTER...
echo ══════════════════════════════════════════════════════════════
echo.

docker compose down

echo.
echo [OK] TournamentMaster arrestato.
echo.
pause
goto MENU

:: ==================== RESTART ====================
:RESTART
echo.
echo ══════════════════════════════════════════════════════════════
echo  RIAVVIO SERVIZI...
echo ══════════════════════════════════════════════════════════════
echo.

docker compose restart

echo.
echo [OK] Servizi riavviati.
echo.
pause
goto MENU

:: ==================== STATUS ====================
:STATUS
echo.
echo ══════════════════════════════════════════════════════════════
echo  STATO CONTAINER
echo ══════════════════════════════════════════════════════════════
echo.

docker compose ps

echo.
echo ──────────────────────────────────────────────────────────────
echo  RISORSE UTILIZZATE
echo ──────────────────────────────────────────────────────────────
echo.

docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo.
pause
goto MENU

:: ==================== LOGS ====================
:LOGS
echo.
echo ══════════════════════════════════════════════════════════════
echo  LOGS IN TEMPO REALE (Premi Ctrl+C per uscire)
echo ══════════════════════════════════════════════════════════════
echo.
echo Quale servizio vuoi monitorare?
echo   1. Tutti i servizi
echo   2. Backend
echo   3. Frontend
echo   4. Database
echo.

set /p logchoice="Seleziona (1-4): "

if "%logchoice%"=="1" docker compose logs -f
if "%logchoice%"=="2" docker compose logs -f backend
if "%logchoice%"=="3" docker compose logs -f frontend
if "%logchoice%"=="4" docker compose logs -f database

echo.
pause
goto MENU

:: ==================== REBUILD ====================
:REBUILD
echo.
echo ══════════════════════════════════════════════════════════════
echo  REBUILD E AVVIO
echo ══════════════════════════════════════════════════════════════
echo.
echo Questo processo:
echo   - Ricostruisce le immagini Docker
echo   - Riavvia tutti i container
echo   - Puo' richiedere alcuni minuti
echo.

set /p confirm="Continuare? (S/N): "
if /i "%confirm%" NEQ "S" goto MENU

echo.
echo [1/2] Build immagini...
docker compose build

echo.
echo [2/2] Avvio container...
docker compose up -d --force-recreate

echo.
echo [OK] Rebuild completato!
echo.
pause
goto MENU

:: ==================== RESET ====================
:RESET
echo.
color 0C
echo ══════════════════════════════════════════════════════════════
echo  ⚠️  ATTENZIONE - RESET COMPLETO  ⚠️
echo ══════════════════════════════════════════════════════════════
echo.
echo Questa operazione:
echo   - Elimina TUTTI i container
echo   - Elimina TUTTI i volumi (DATABASE INCLUSO!)
echo   - Elimina TUTTE le immagini
echo   - I dati saranno PERSI permanentemente!
echo.
color 0A

set /p confirm1="Sei sicuro? Scrivi 'RESET' per confermare: "
if "%confirm1%" NEQ "RESET" (
    echo.
    echo Operazione annullata.
    echo.
    pause
    goto MENU
)

echo.
echo Arresto container...
docker compose down -v --rmi all

echo.
echo Pulizia sistema Docker...
docker system prune -af

echo.
echo [OK] Reset completato. Usa opzione 1 per riavviare.
echo.
pause
goto MENU

:: ==================== BROWSER ====================
:BROWSER
echo.
echo Apertura browser...
start "" "http://localhost:3000"
echo.
goto MENU

:: ==================== EXIT ====================
:EXIT
echo.
echo Arrivederci!
echo.
exit /b 0
