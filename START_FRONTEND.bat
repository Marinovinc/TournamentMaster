@echo off
REM ============================================================================
REM TournamentMaster - Frontend Startup Script (Background Mode)
REM ============================================================================
REM Porta: 3000 (Next.js)
REM URL: http://localhost:3000
REM Il frontend gira in background - usa STOP_FRONTEND.bat per fermarlo
REM ============================================================================

echo.
echo ========================================
echo  TournamentMaster FRONTEND
echo  Next.js - Porta 3000 (Background)
echo ========================================
echo.

REM Verifica se porta 3000 è già in uso
echo [1/3] Controllo porta 3000...
netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo [OK] Il frontend e' gia' in esecuzione sulla porta 3000!
    echo URL: http://localhost:3000
    echo.
    echo Per riavviare, usa prima STOP_FRONTEND.bat
    echo.
    timeout /t 3 >nul
    exit /b 0
)
echo OK - Porta 3000 libera
echo.

REM Verifica Node.js
echo [2/3] Controllo Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRORE] Node.js non trovato! Installa da https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js trovato
echo.

REM Crea cartella logs se non esiste
if not exist "D:\Dev\TournamentMaster\frontend\logs" mkdir "D:\Dev\TournamentMaster\frontend\logs"

REM Avvia frontend in background usando PowerShell
echo [3/3] Avvio Next.js in background...
powershell -WindowStyle Hidden -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d D:\Dev\TournamentMaster\frontend && npm run dev > D:\Dev\TournamentMaster\frontend\logs\frontend.log 2>&1' -WindowStyle Hidden"

REM Attendi che il server si avvii (Next.js impiega un po' di piu)
echo.
echo Attendo avvio server...
timeout /t 8 >nul

REM Verifica che sia partito
netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  Frontend AVVIATO con successo!
    echo  http://localhost:3000
    echo ========================================
    echo.
    echo Il frontend gira in background.
    echo Usa STOP_FRONTEND.bat per fermarlo.
    echo I log sono in: frontend\logs\frontend.log
    echo.
) else (
    echo.
    echo [ATTENZIONE] Il frontend potrebbe non essere partito.
    echo Controlla i log in: frontend\logs\frontend.log
    echo.
)

timeout /t 3 >nul
