' ============================================
' TournamentMaster Frontend - Launcher Invisibile
' ============================================
' Avvia Next.js dev server senza finestra visibile
' ============================================

Set WshShell = CreateObject("WScript.Shell")
Set FsoObj = CreateObject("Scripting.FileSystemObject")

' Directory frontend
FrontendDir = "D:\Dev\TournamentMaster\frontend"

' Crea directory logs se non esiste
If Not FsoObj.FolderExists(FrontendDir & "\logs") Then
    FsoObj.CreateFolder(FrontendDir & "\logs")
End If

' Comando: npm run dev con output su log
Cmd = "cmd /c cd /d """ & FrontendDir & """ && npm run dev > """ & FrontendDir & "\logs\frontend.log"" 2>&1"

' 0 = finestra nascosta, False = non attendere
WshShell.Run Cmd, 0, False

Set FsoObj = Nothing
Set WshShell = Nothing
