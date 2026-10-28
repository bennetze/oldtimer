@echo off
cd /d "%~dp0Website"
if errorlevel 1 (
  echo Website-Ordner fehlt. Bitte beide Unterordner Website und Intern zusammenlassen.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js fehlt. Bitte Node.js installieren und dieses Fenster erneut oeffnen.
  pause
  exit /b 1
)
call npm run tools -- %*
pause
