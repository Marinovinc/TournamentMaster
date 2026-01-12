@echo off
REM ============================================================================
REM TournamentMaster - Backend Startup Script (Background Mode)
REM ============================================================================
REM Porta: 3001 (Express)
REM URL: http://localhost:3001
REM Il backend gira in background - usa STOP_BACKEND.bat per fermarlo
REM ============================================================================

echo.
echo ========================================
echo  TournamentMaster BACKEND
echo  Express - Porta 3001 (Background)
echo ========================================
echo.

REM Verifica se porta 3001 è già in uso
echo [1/3] Controllo porta 3001...
netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo [OK] Il backend e' gia' in esecuzione sulla porta 3001!
    echo API Health: http://localhost:3001/api/health
    echo.
    echo Per riavviare, usa prima STOP_BACKEND.bat
    echo.
    timeout /t 3 >nul
    exit /b 0
)
echo OK - Porta 3001 libera
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

REM Avvia backend in background usando PowerShell
echo [3/3] Avvio Express in background...
powershell -WindowStyle Hidden -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d D:\Dev\TournamentMaster\backend && npm run dev > D:\Dev\TournamentMaster\backend\logs\backend.log 2>&1' -WindowStyle Hidden"

REM Attendi che il server si avvii
echo.
echo Attendo avvio server...
timeout /t 3 >nul

REM Verifica che sia partito
netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  Backend AVVIATO con successo!
    echo  http://localhost:3001
    echo  Health: http://localhost:3001/api/health
    echo ========================================
    echo.
    echo Il backend gira in background.
    echo Usa STOP_BACKEND.bat per fermarlo.
    echo I log sono in: backend\logs\backend.log
    echo.
) else (
    echo.
    echo [ATTENZIONE] Il backend potrebbe non essere partito.
    echo Controlla i log in: backend\logs\backend.log
    echo.
)

timeout /t 3 >nul
