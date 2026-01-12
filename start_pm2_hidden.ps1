# Start PM2 completely hidden
Set-Location "D:\Dev\TournamentMaster"
pm2 start ecosystem.config.js --silent
pm2 save --silent
