@echo off
REM ============================================================================
REM TournamentMaster - Avvia Backend + Frontend in background
REM ============================================================================

echo.
echo ========================================
echo  TournamentMaster - Avvio Completo
echo ========================================
echo.

REM --- BACKEND ---
echo [BACKEND] Controllo porta 3001...
netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [BACKEND] Gia' in esecuzione - OK
) else (
    echo [BACKEND] Avvio in background...
    if not exist "D:\Dev\TournamentMaster\backend\logs" mkdir "D:\Dev\TournamentMaster\backend\logs"
    powershell -WindowStyle Hidden -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d D:\Dev\TournamentMaster\backend && npm run dev > D:\Dev\TournamentMaster\backend\logs\backend.log 2>&1' -WindowStyle Hidden"
)

REM --- FRONTEND ---
echo [FRONTEND] Controllo porta 3000...
netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [FRONTEND] Gia' in esecuzione - OK
) else (
    echo [FRONTEND] Avvio in background...
    if not exist "D:\Dev\TournamentMaster\frontend\logs" mkdir "D:\Dev\TournamentMaster\frontend\logs"
    powershell -WindowStyle Hidden -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d D:\Dev\TournamentMaster\frontend && npm run dev > D:\Dev\TournamentMaster\frontend\logs\frontend.log 2>&1' -WindowStyle Hidden"
)

echo.
echo Attendo avvio server...
timeout /t 8 >nul

REM Verifica finale
echo.
netstat -ano | findstr ":3001.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [BACKEND]  OK - http://localhost:3001
) else (
    echo [BACKEND]  ERRORE - controlla backend\logs\backend.log
)

netstat -ano | findstr ":3000.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [FRONTEND] OK - http://localhost:3000
) else (
    echo [FRONTEND] ERRORE - controlla frontend\logs\frontend.log
)

echo.
echo ========================================
echo  Avvio completato!
echo  Usa STOP_ALL.bat per fermare tutto
echo ========================================
echo.
timeout /t 3 >nul
