@echo off
setlocal
cd /d "%~dp0Website"
if errorlevel 1 (
  echo Website-Ordner fehlt. Bitte beide Unterordner Website und Intern zusammenlassen.
  pause
  exit /b 1
)
if not exist "scripts\setup-tools.ps1" (
  echo Startdateien fehlen noch. Bitte den Kopiervorgang abschliessen oder den vollstaendigen Website-Ordner uebertragen und erneut starten.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\scripts\setup-tools.ps1" %*
set "result=%errorlevel%"
pause
exit /b %result%
