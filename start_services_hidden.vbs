Set WshShell = CreateObject("WScript.Shell")

' Backend - nodemon con ts-node
WshShell.CurrentDirectory = "D:\Dev\TournamentMaster\backend"
WshShell.Run "cmd /c npx nodemon --exec npx ts-node src/index.ts > logs\backend.log 2>&1", 0, False

' Aspetta 2 secondi
WScript.Sleep 2000

' Frontend - next dev
WshShell.CurrentDirectory = "D:\Dev\TournamentMaster\frontend"
WshShell.Run "cmd /c npx next dev > ..\backend\logs\frontend.log 2>&1", 0, False

Set WshShell = Nothing
