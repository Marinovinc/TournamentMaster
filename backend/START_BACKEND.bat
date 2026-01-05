@echo off
title TournamentMaster Backend
cd /d "%~dp0"
echo ========================================
echo   TournamentMaster Backend Server
echo ========================================
echo.
echo Starting server on port 3001...
echo.
npm run dev
pause
