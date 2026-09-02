@echo off
chcp 65001 >nul

:: FileFly One-Time Setup
:: Run this once on each PC to enable  fly.local  (no port needed)

:: -- Auto-elevate to Admin ------------------------------------------
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo.
echo  ============================================
echo   FileFly Setup
echo  ============================================
echo.
echo  Setting up network redirect...
echo.

:: Remove old rule if exists
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=0.0.0.0 >nul 2>&1

:: Add new: port 80 -> 53316
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=53316 connectaddress=127.0.0.1

:: Open firewall ports
netsh advfirewall firewall delete rule name="FileFly-Port80" >nul 2>&1
netsh advfirewall firewall add rule name="FileFly-Port80" protocol=TCP dir=in localport=80 action=allow >nul 2>&1
netsh advfirewall firewall delete rule name="FileFly-Main" >nul 2>&1
netsh advfirewall firewall add rule name="FileFly-Main" protocol=TCP dir=in localport=53316 action=allow >nul 2>&1

echo.
echo  Done! Other devices can now connect by typing:
echo.
echo        fly.local
echo.
echo  in any browser on the same WiFi network.
echo.
pause