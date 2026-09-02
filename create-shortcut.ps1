$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\FileFly.lnk")
$Shortcut.TargetPath = "C:\Users\msi\Desktop\Others\FileFly\release\FileFly-win32-x64\FileFly.exe"
$Shortcut.WorkingDirectory = "C:\Users\msi\Desktop\Others\FileFly\release\FileFly-win32-x64"
$Shortcut.Description = "FileFly - Fast Local File Transfer"
$Shortcut.Save()
Write-Host "Shortcut created successfully on Desktop!"
