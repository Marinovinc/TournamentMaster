@echo off
REM ============================================================================
REM TournamentMaster - Backend Stop Script
REM ============================================================================

echo.
echo ========================================
echo  Fermando Backend (porta 3001)...
echo ========================================
echo.

REM Trova e termina processo sulla porta 3001
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001.*LISTENING"') do (
    echo Terminando processo PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Backend fermato.
echo.
pause
