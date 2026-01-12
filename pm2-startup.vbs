' ============================================
' TournamentMaster Startup - Esecuzione Invisibile
' ============================================
' Avvia backend e frontend senza finestre visibili
' Usato da Task Scheduler all'avvio di Windows
' ============================================

Set WshShell = CreateObject("WScript.Shell")

' Avvia Backend (porta 3001)
WshShell.Run "cscript //nologo ""D:\Dev\TournamentMaster\launch_backend.vbs""", 0, True

' Attendi 3 secondi
WScript.Sleep 3000

' Avvia Frontend (porta 3000)
WshShell.Run "cscript //nologo ""D:\Dev\TournamentMaster\launch_frontend.vbs""", 0, True

Set WshShell = Nothing
