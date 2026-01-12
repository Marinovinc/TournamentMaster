# Kill backend processes and restart
$procs = Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like "*backend*npm*" -or $_.CommandLine -like "*nodemon*backend*" }
foreach ($p in $procs) {
    Write-Host "Killing PID $($p.ProcessId)"
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 2

# Launch backend
Write-Host "Starting backend..."
Start-Process -FilePath "cscript.exe" -ArgumentList "//nologo", "D:\Dev\TournamentMaster\launch_backend.vbs" -WindowStyle Hidden

Write-Host "Done. Wait 5 seconds..."
Start-Sleep -Seconds 5

# Check
$result = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
if ($result.StatusCode -eq 200) {
    Write-Host "Backend OK!"
} else {
    Write-Host "Backend not responding"
}
