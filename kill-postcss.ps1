# Kill orphan PostCSS processes for TournamentMaster
$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'postcss\.js' }
$count = 0
foreach ($proc in $procs) {
    try {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
        Write-Host "Terminato PID: $($proc.ProcessId)"
        $count++
    } catch {
        Write-Host "Errore terminando PID: $($proc.ProcessId)"
    }
}
Write-Host "`nProcessi PostCSS terminati: $count"
