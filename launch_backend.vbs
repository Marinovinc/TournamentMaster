' ============================================
' TournamentMaster Backend - Launcher Invisibile
' ============================================
' Avvia Express/ts-node server senza finestra visibile
' ============================================

Set WshShell = CreateObject("WScript.Shell")
Set FsoObj = CreateObject("Scripting.FileSystemObject")

' Directory backend
BackendDir = "D:\Dev\TournamentMaster\backend"

' Crea directory logs se non esiste
If Not FsoObj.FolderExists(BackendDir & "\logs") Then
    FsoObj.CreateFolder(BackendDir & "\logs")
End If

' Comando: npm run dev con output su log
Cmd = "cmd /c cd /d """ & BackendDir & """ && npm run dev > """ & BackendDir & "\logs\backend.log"" 2>&1"

' 0 = finestra nascosta, False = non attendere
WshShell.Run Cmd, 0, False

Set FsoObj = Nothing
Set WshShell = Nothing
