@echo off
REM ============================================================================
REM TournamentMaster - Frontend Startup Script
REM ============================================================================
REM Porta: 3000 (Next.js)
REM URL: http://localhost:3000
REM ============================================================================

echo.
echo ========================================
echo  TournamentMaster FRONTEND
echo  Next.js - Porta 3000
echo ========================================
echo.

REM Vai alla cartella frontend
cd /d "C:\Users\marin\Downloads\TournamentMaster\frontend"

REM Verifica Node.js
echo [1/3] Controllo Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRORE] Node.js non trovato! Installa da https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js trovato
echo.

REM Verifica node_modules
echo [2/3] Controllo dipendenze...
if not exist "node_modules" (
    echo node_modules non trovato. Eseguo npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRORE] npm install fallito!
        pause
        exit /b 1
    )
)
echo OK - Dipendenze pronte
echo.

REM Avvia frontend
echo [3/3] Avvio Next.js...
echo.
echo ========================================
echo  Frontend in avvio su:
echo  http://localhost:3000
echo ========================================
echo.
echo Premi CTRL+C per fermare
echo.

npm run dev

pause
