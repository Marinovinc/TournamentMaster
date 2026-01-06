@echo off
REM ============================================================================
REM TournamentMaster - Frontend Stop Script
REM ============================================================================
REM Ferma il processo Next.js sulla porta 3000
REM ============================================================================

echo.
echo ========================================
echo  STOP TournamentMaster FRONTEND
echo  Porta 3000
echo ========================================
echo.

REM Trova e termina il processo sulla porta 3000
echo Ricerca processo sulla porta 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Trovato PID: %%a
    echo Terminazione processo...
    taskkill /PID %%a /F >nul 2>&1
    if %errorlevel%==0 (
        echo.
        echo [OK] Frontend fermato con successo!
    ) else (
        echo.
        echo [INFO] Processo gia' terminato o non trovato.
    )
)

echo.
echo ========================================
echo  Frontend FERMATO
echo ========================================
echo.
pause
