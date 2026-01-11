@echo off
REM ============================================================================
REM TournamentMaster - Server Manager Web UI
REM ============================================================================
REM Apre la dashboard di gestione su Apache (porta 80)
REM URL: http://localhost/tournamentmaster/server_manager.html
REM
REM Nota: Richiede Apache attivo (XAMPP)
REM Frontend/Backend accessibili anche via: http://localhost/tm/
REM ============================================================================

echo.
echo ========================================
echo  TournamentMaster Server Manager
echo  Dashboard su http://localhost/tournamentmaster/
echo ========================================
echo.

REM Verifica se Apache e' attivo sulla porta 80
netstat -ano | findstr ":80.*LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRORE] Apache non attivo su porta 80
    echo Avvia XAMPP prima di usare il Server Manager
    pause
    exit /b 1
)

echo [OK] Apache attivo - Apertura dashboard...
echo.
echo URLs disponibili:
echo   Server Manager: http://localhost/tournamentmaster/server_manager.html
echo   Frontend:       http://localhost/tm/
echo   Backend API:    http://localhost/tm/api/health
echo.

start "" "http://localhost/tournamentmaster/server_manager.html"
