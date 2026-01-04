@echo off
title TournamentMaster - Stop Server
color 0C

echo ============================================
echo    TournamentMaster - Stop Server
echo ============================================
echo.

echo Fermando server...

powershell -Command "Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Write-Host 'Termino processo porta 3000 (PID:' $_.OwningProcess ')'; Stop-Process -Id $_.OwningProcess -Force }"

powershell -Command "Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Write-Host 'Termino processo porta 3001 (PID:' $_.OwningProcess ')'; Stop-Process -Id $_.OwningProcess -Force }"

echo.
echo Server fermati.
echo.
pause
