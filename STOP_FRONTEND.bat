@echo off
REM ============================================================================
REM TournamentMaster - Frontend Stop Script
REM ============================================================================

echo.
echo ========================================
echo  Fermando Frontend (porta 3000)...
echo ========================================
echo.

REM Trova e termina processo sulla porta 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
    echo Terminando processo PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Frontend fermato.
echo.
timeout /t 2 >nul
