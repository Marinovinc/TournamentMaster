@echo off
:: =============================================================================
:: INSTALL_PM2_SERVICE.bat - Eseguire come Amministratore
:: =============================================================================
:: Questo script installa PM2 come servizio Windows usando NSSM
:: I servizi tm-frontend e tm-backend partiranno automaticamente al boot
:: senza finestre visibili.
:: =============================================================================

echo ============================================
echo   INSTALLAZIONE PM2 COME SERVIZIO WINDOWS
echo ============================================
echo.

set NSSM="C:\Users\marin\AppData\Local\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe"
set NODE="C:\Program Files\nodejs\node.exe"
set PM2_BIN="C:\Users\marin\AppData\Roaming\npm\node_modules\pm2\bin\pm2"

echo [1/4] Verifico NSSM...
if not exist %NSSM% (
    echo ERRORE: NSSM non trovato in %NSSM%
    pause
    exit /b 1
)
echo OK: NSSM trovato

echo.
echo [2/4] Rimuovo servizio esistente se presente...
%NSSM% stop PM2 2>nul
%NSSM% remove PM2 confirm 2>nul
echo OK: Pulizia completata

echo.
echo [3/4] Installo servizio PM2...
%NSSM% install PM2 %NODE% "%PM2_BIN% resurrect"
if errorlevel 1 (
    echo ERRORE: Installazione fallita
    pause
    exit /b 1
)

:: Configura il servizio
%NSSM% set PM2 DisplayName "PM2 Process Manager"
%NSSM% set PM2 Description "Gestisce frontend e backend TournamentMaster in background"
%NSSM% set PM2 Start SERVICE_AUTO_START
%NSSM% set PM2 AppDirectory "C:\Users\marin"
%NSSM% set PM2 AppStdout "C:\Users\marin\.pm2\pm2-service.log"
%NSSM% set PM2 AppStderr "C:\Users\marin\.pm2\pm2-service-error.log"
echo OK: Servizio installato

echo.
echo [4/4] Avvio servizio PM2...
%NSSM% start PM2
if errorlevel 1 (
    echo ATTENZIONE: Avvio manuale fallito, prova con: net start PM2
) else (
    echo OK: Servizio avviato
)

echo.
echo ============================================
echo   INSTALLAZIONE COMPLETATA
echo ============================================
echo.
echo Il servizio PM2 e' ora installato e partira' automaticamente al boot.
echo I processi tm-frontend e tm-backend gireranno senza finestre visibili.
echo.
echo Comandi utili:
echo   net start PM2   - Avvia il servizio
echo   net stop PM2    - Ferma il servizio
echo   sc query PM2    - Stato del servizio
echo   pm2 list        - Lista processi PM2
echo.
pause
