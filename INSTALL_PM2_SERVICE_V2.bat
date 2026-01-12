@echo off
:: =============================================================================
:: INSTALL_PM2_SERVICE_V2.bat - Eseguire come Amministratore
:: =============================================================================
:: FIX: Imposta PM2_HOME per risolvere problema variabili ambiente
:: =============================================================================

echo ============================================
echo   INSTALLAZIONE PM2 COME SERVIZIO WINDOWS
echo   Versione 2 - Con fix PM2_HOME
echo ============================================
echo.

set NSSM=C:\Users\marin\AppData\Local\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe
set NODE=C:\Program Files\nodejs\node.exe
set PM2_BIN=C:\Users\marin\AppData\Roaming\npm\node_modules\pm2\bin\pm2
set PM2_HOME_DIR=C:\Users\marin\.pm2
set ECOSYSTEM=D:\Dev\TournamentMaster\ecosystem.config.js

echo [1/5] Verifico NSSM...
if not exist "%NSSM%" (
    echo ERRORE: NSSM non trovato
    pause
    exit /b 1
)
echo OK

echo.
echo [2/5] Fermo PM2 normale se attivo...
pm2 kill 2>nul
echo OK

echo.
echo [3/5] Rimuovo servizio esistente...
"%NSSM%" stop PM2 2>nul
"%NSSM%" remove PM2 confirm 2>nul
echo OK

echo.
echo [4/5] Installo servizio PM2...
:: Usa "pm2 start ecosystem.config.js" invece di "resurrect"
"%NSSM%" install PM2 "%NODE%" "\"%PM2_BIN%\" start \"%ECOSYSTEM%\""
if errorlevel 1 (
    echo ERRORE: Installazione fallita
    pause
    exit /b 1
)

:: Configura variabili ambiente - CRITICO!
"%NSSM%" set PM2 AppEnvironmentExtra PM2_HOME=%PM2_HOME_DIR%
"%NSSM%" set PM2 AppEnvironmentExtra +USERPROFILE=C:\Users\marin
"%NSSM%" set PM2 AppEnvironmentExtra +HOMEPATH=\Users\marin
"%NSSM%" set PM2 AppEnvironmentExtra +HOMEDRIVE=C:

:: Altre configurazioni
"%NSSM%" set PM2 DisplayName "PM2 Process Manager"
"%NSSM%" set PM2 Description "TournamentMaster frontend e backend"
"%NSSM%" set PM2 Start SERVICE_AUTO_START
"%NSSM%" set PM2 AppDirectory "D:\Dev\TournamentMaster"
"%NSSM%" set PM2 AppStdout "%PM2_HOME_DIR%\pm2-service.log"
"%NSSM%" set PM2 AppStderr "%PM2_HOME_DIR%\pm2-service-error.log"
"%NSSM%" set PM2 AppStopMethodSkip 6
"%NSSM%" set PM2 AppStopMethodConsole 3000
"%NSSM%" set PM2 AppStopMethodWindow 3000
"%NSSM%" set PM2 AppStopMethodThreads 3000
echo OK

echo.
echo [5/5] Avvio servizio PM2...
"%NSSM%" start PM2
timeout /t 5 /nobreak >nul

:: Verifica
sc query PM2 | findstr "RUNNING" >nul
if errorlevel 1 (
    echo ATTENZIONE: Servizio non in RUNNING, controlla i log
) else (
    echo OK - Servizio in esecuzione
)

echo.
echo ============================================
echo   COMPLETATO
echo ============================================
echo.
echo Verifica: curl http://localhost:3001/api/health
echo.
pause
