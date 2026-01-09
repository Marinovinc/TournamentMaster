@echo off
REM ============================================================================
REM TournamentMaster - Ferma Backend + Frontend
REM ============================================================================

echo.
echo ========================================
echo  TournamentMaster - Stop Completo
echo ========================================
echo.

REM --- BACKEND (porta 3001) ---
echo [BACKEND] Fermando porta 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001.*LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
    echo [BACKEND] Processo %%a terminato
)

REM --- FRONTEND (porta 3000) ---
echo [FRONTEND] Fermando porta 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
    echo [FRONTEND] Processo %%a terminato
)

echo.
echo ========================================
echo  Tutto fermato!
echo ========================================
echo.
timeout /t 2 >nul
