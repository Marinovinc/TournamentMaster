# TournamentMaster Dev Startup Script
# Pulisce processi orfani prima di avviare il dev server

Write-Host "=== TournamentMaster Dev Startup ===" -ForegroundColor Cyan

# 1. Kill orphan PostCSS processes
Write-Host "`n[1/3] Pulizia processi PostCSS orfani..." -ForegroundColor Yellow
$postcss = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'postcss\.js' }
$count = 0
foreach ($proc in $postcss) {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    $count++
}
Write-Host "      Terminati: $count processi" -ForegroundColor Green

# 2. Kill old TournamentMaster node processes (except Claude Code)
Write-Host "`n[2/3] Pulizia processi TournamentMaster precedenti..." -ForegroundColor Yellow
$tmProcs = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -match 'TournamentMaster' -and
    $_.CommandLine -notmatch 'claude-code' -and
    $_.CommandLine -notmatch 'start-dev\.ps1'
}
$count2 = 0
foreach ($proc in $tmProcs) {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    $count2++
}
Write-Host "      Terminati: $count2 processi" -ForegroundColor Green

# 3. Wait a moment for cleanup
Start-Sleep -Seconds 2

# 4. Start dev servers
Write-Host "`n[3/3] Avvio server di sviluppo..." -ForegroundColor Yellow
Write-Host "      Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "      Frontend: http://localhost:3000" -ForegroundColor Cyan

# Start backend in new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\Dev\TournamentMaster\backend; npm run dev"

# Wait for backend to initialize
Start-Sleep -Seconds 3

# Start frontend in new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\Dev\TournamentMaster\frontend; npm run dev"

Write-Host "`n=== Server avviati! ===" -ForegroundColor Green
Write-Host "Premi un tasto per aprire il browser..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:3000"
