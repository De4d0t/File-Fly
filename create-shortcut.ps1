$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\FileFly.lnk")

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = "C:\Users\msi\Desktop\Others\FileFly" }

$exePath = Join-Path $scriptDir "release\FileFly-win32-x64\FileFly.exe"
if (Test-Path $exePath) {
    $Shortcut.TargetPath = $exePath
    $Shortcut.WorkingDirectory = Split-Path -Parent $exePath
    $Shortcut.IconLocation = "$scriptDir\public\icon.ico"
    $Shortcut.WindowStyle = 1
} else {
    $batPath = Join-Path $scriptDir "FileFly.bat"
    $Shortcut.TargetPath = $batPath
    $Shortcut.WorkingDirectory = $scriptDir
    $Shortcut.IconLocation = "$scriptDir\public\icon.ico"
    $Shortcut.WindowStyle = 7 # Minimized launch
}
$Shortcut.Save()
Write-Host "Shortcut created successfully on Desktop!"
