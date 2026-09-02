@echo off
title FileFly
chcp 65001 >nul

:: Check if server is running on port 53316; if not, launch it in background
netstat -ano | findstr :53316 >nul 2>&1
if %errorLevel% neq 0 (
    start /b "" node "%~dp0server\index.js"
    timeout /t 2 /nobreak >nul
)

:: If Electron unpacked build exists, give choice or run directly
if exist "%~dp0release\FileFly-win32-x64\FileFly.exe" (
    start "" "%~dp0release\FileFly-win32-x64\FileFly.exe"
    exit
)

:: Otherwise open lightweight 0MB App Mode (Edge / Chrome standalone window)
start msedge --app=http://localhost:53316 2>nul || start chrome --app=http://localhost:53316 2>nul || start http://localhost:53316
exit
