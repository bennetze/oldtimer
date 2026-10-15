@echo off
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js fehlt. Bitte Node.js installieren und dieses Fenster erneut oeffnen.
  pause
  exit /b 1
)
call npm run tools
pause
