@echo off
echo Stopping TournamentMaster Backend...
taskkill /F /FI "WINDOWTITLE eq TournamentMaster-Backend" >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo Backend stopped.
timeout /t 2
