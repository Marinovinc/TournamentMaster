@echo off
echo ========================================
echo   Stopping TournamentMaster Backend
echo ========================================
echo.

:: Kill node processes on port 3001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo Killing process PID: %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo Backend stopped.
timeout /t 2
