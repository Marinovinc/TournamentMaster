' ============================================
' TournamentMaster - Autostart Silenzioso
' ============================================
' Questo script avvia i server senza finestra visibile
' Da copiare nella cartella Startup di Windows:
' %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
' ============================================

Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "D:\Dev\TournamentMaster\START_TOURNAMENTMASTER.bat" & chr(34), 0
Set WshShell = Nothing
