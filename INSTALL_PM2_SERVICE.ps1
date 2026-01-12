# ============================================
# Installazione PM2 come Servizio Windows
# ============================================
# Eseguire come Amministratore!
# ============================================

$ErrorActionPreference = "Stop"

Write-Host "=== Installazione PM2 come Servizio Windows ===" -ForegroundColor Cyan

# Verifica NSSM
$nssm = Get-Command nssm -ErrorAction SilentlyContinue
if (-not $nssm) {
    Write-Host "ERRORE: NSSM non trovato. Installare con: winget install nssm" -ForegroundColor Red
    exit 1
}

# Path
$pm2Path = "C:\Users\marin\AppData\Roaming\npm\pm2.cmd"
$nodePath = (Get-Command node).Source

Write-Host "Node: $nodePath" -ForegroundColor Yellow
Write-Host "PM2: $pm2Path" -ForegroundColor Yellow

# Rimuovi servizio esistente se presente
$existingService = Get-Service -Name "PM2" -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Rimozione servizio PM2 esistente..." -ForegroundColor Yellow
    nssm stop PM2 2>$null
    nssm remove PM2 confirm
}

# Crea batch file per resurrect
$batchContent = @"
@echo off
cd /d C:\Users\marin
call C:\Users\marin\AppData\Roaming\npm\pm2.cmd resurrect
"@
$batchPath = "C:\Users\marin\.pm2\pm2-resurrect.bat"
Set-Content -Path $batchPath -Value $batchContent -Encoding ASCII

Write-Host "Creato script: $batchPath" -ForegroundColor Green

# Installa servizio
Write-Host "Installazione servizio PM2..." -ForegroundColor Cyan
nssm install PM2 $batchPath
nssm set PM2 AppDirectory "C:\Users\marin"
nssm set PM2 DisplayName "PM2 Process Manager"
nssm set PM2 Description "PM2 - TournamentMaster Node.js Process Manager"
nssm set PM2 Start SERVICE_AUTO_START
nssm set PM2 AppStdout "C:\Users\marin\.pm2\service-stdout.log"
nssm set PM2 AppStderr "C:\Users\marin\.pm2\service-stderr.log"

# Avvia servizio
Write-Host "Avvio servizio PM2..." -ForegroundColor Cyan
nssm start PM2

# Verifica
Start-Sleep -Seconds 3
$service = Get-Service -Name "PM2" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Host ""
    Write-Host "=== SUCCESSO ===" -ForegroundColor Green
    Write-Host "PM2 installato come servizio Windows!" -ForegroundColor Green
    Write-Host "Il servizio si avviera automaticamente al boot." -ForegroundColor Green
    Write-Host ""
    Write-Host "Comandi utili:" -ForegroundColor Yellow
    Write-Host "  pm2 list          - Mostra processi"
    Write-Host "  pm2 logs          - Mostra log"
    Write-Host "  nssm status PM2   - Stato servizio"
} else {
    Write-Host "ERRORE: Servizio non avviato correttamente" -ForegroundColor Red
    nssm status PM2
}

Write-Host ""
Write-Host "Premi un tasto per chiudere..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
