# =============================================================================
# INSTALL_PM2_SERVICE_V3.ps1 - Eseguire come Amministratore in PowerShell
# =============================================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  INSTALLAZIONE PM2 COME SERVIZIO WINDOWS" -ForegroundColor Cyan
Write-Host "  Versione 3 - PowerShell" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$NSSM = "C:\Users\marin\AppData\Local\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe"
$NODE = "C:\Program Files\nodejs\node.exe"
$PM2_BIN = "C:\Users\marin\AppData\Roaming\npm\node_modules\pm2\bin\pm2"
$ECOSYSTEM = "D:\Dev\TournamentMaster\ecosystem.config.js"

# 1. Ferma PM2 normale
Write-Host "[1/6] Fermo PM2 normale..." -ForegroundColor Yellow
pm2 kill 2>$null
Write-Host "OK" -ForegroundColor Green

# 2. Rimuovi servizio esistente
Write-Host "[2/6] Rimuovo servizio esistente..." -ForegroundColor Yellow
& $NSSM stop PM2 2>$null
& $NSSM remove PM2 confirm 2>$null
Start-Sleep -Seconds 2
Write-Host "OK" -ForegroundColor Green

# 3. Installa servizio
Write-Host "[3/6] Installo servizio..." -ForegroundColor Yellow
& $NSSM install PM2 $NODE "$PM2_BIN start $ECOSYSTEM"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRORE installazione!" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "OK" -ForegroundColor Green

# 4. Configura variabili ambiente (CRITICO!)
Write-Host "[4/6] Configuro variabili ambiente..." -ForegroundColor Yellow
& $NSSM set PM2 AppEnvironmentExtra "PM2_HOME=C:\Users\marin\.pm2"
& $NSSM set PM2 AppEnvironmentExtra +USERPROFILE=C:\Users\marin
& $NSSM set PM2 AppEnvironmentExtra +HOMEPATH=\Users\marin
& $NSSM set PM2 AppEnvironmentExtra +HOMEDRIVE=C:
& $NSSM set PM2 AppEnvironmentExtra +HOME=C:\Users\marin
Write-Host "OK" -ForegroundColor Green

# 5. Altre configurazioni
Write-Host "[5/6] Configuro servizio..." -ForegroundColor Yellow
& $NSSM set PM2 DisplayName "PM2 Process Manager"
& $NSSM set PM2 Description "TournamentMaster frontend e backend"
& $NSSM set PM2 Start SERVICE_AUTO_START
& $NSSM set PM2 AppDirectory "D:\Dev\TournamentMaster"
& $NSSM set PM2 AppStdout "C:\Users\marin\.pm2\pm2-service.log"
& $NSSM set PM2 AppStderr "C:\Users\marin\.pm2\pm2-service-error.log"
Write-Host "OK" -ForegroundColor Green

# 6. Avvia servizio
Write-Host "[6/6] Avvio servizio..." -ForegroundColor Yellow
& $NSSM start PM2
Start-Sleep -Seconds 5

# Verifica
$status = sc.exe query PM2 | Select-String "RUNNING"
if ($status) {
    Write-Host "OK - Servizio RUNNING" -ForegroundColor Green
} else {
    Write-Host "ATTENZIONE - Controlla: sc query PM2" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  COMPLETATO" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test: curl http://localhost:3001/api/health"
Write-Host ""
pause
