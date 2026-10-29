$ErrorActionPreference = 'Stop'
$runtimeLock = $null
try {
  $project = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
  Set-Location $project
  foreach ($file in @('package.json', 'package-lock.json', '.npmrc', 'scripts\start-tools.mjs', 'scripts\lib\tools-setup.mjs', 'scripts\lib\tools-install-process.mjs')) {
    if (!(Test-Path -LiteralPath (Join-Path $project $file) -PathType Leaf)) {
      throw "Projektdatei $file fehlt. Bitte den Kopiervorgang abschliessen und den vollstaendigen Website-Ordner uebertragen."
    }
  }
  $driveRoot = [IO.Path]::GetPathRoot($project)
  if ($project.StartsWith('\\') -or ([IO.DriveInfo]::new($driveRoot).DriveType -eq [IO.DriveType]::Network)) {
    Write-Host 'Hinweis: Projekt liegt auf einem Netzlaufwerk. Die Paketinstallation kann dort sehr langsam sein.'
    Write-Host 'Empfohlen: Website und Intern vollstaendig auf C: kopieren, ohne node_modules, .cache und dist.'
  }
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $runtime = Join-Path $env:LOCALAPPDATA 'Oldtimermanufaktur\tools-node'
  New-Item -ItemType Directory -Force -Path (Split-Path $runtime) | Out-Null
  try {
    $runtimeLock = [IO.File]::Open("$runtime.lock", 'OpenOrCreate', 'ReadWrite', 'None')
  } catch { throw 'Eine andere Node.js-Einrichtung laeuft. Bitte deren Abschluss abwarten und erneut starten.' }

  function Test-ToolsRuntime($nodeExe, $npmCli) {
    try {
      if (!(Test-Path -LiteralPath $nodeExe) -or !(Test-Path -LiteralPath $npmCli)) { $script:runtimeError = 'Node.js oder npm-Dateien fehlen.'; return $false }
      $version = & $nodeExe --version
      if ($LASTEXITCODE -ne 0 -or $version -notmatch '^v\d+\.\d+\.\d+$' -or [version]$version.Substring(1) -lt [version]'22.12.0') { $script:runtimeError = "Node.js-Version konnte nicht geprueft werden: $version"; return $false }
      $npmVersion = & $nodeExe $npmCli --version
      $script:runtimeError = "npm konnte nicht gestartet werden: $npmVersion"
      return $LASTEXITCODE -eq 0 -and $npmVersion -match '^\d+\.\d+\.\d+$'
    } catch { $script:runtimeError = $_.Exception.Message; return $false }
  }

  $nodeExe = Join-Path $runtime 'node.exe'
  $npmCli = Join-Path $runtime 'node_modules\npm\bin\npm-cli.js'
  $usable = Test-ToolsRuntime $nodeExe $npmCli
  if (!$usable) {
    $systemNode = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    $systemNpm = Get-Command npm.cmd -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($systemNode -and $systemNpm) {
      $systemCli = Join-Path (Split-Path $systemNpm.Source) 'node_modules\npm\bin\npm-cli.js'
      if (Test-ToolsRuntime $systemNode.Source $systemCli) {
        $nodeExe = $systemNode.Source
        $npmCli = $systemCli
        $usable = $true
      }
    }
  }
  if (!$usable) {
    Write-Host 'Node.js wird heruntergeladen und lokal eingerichtet ...'
    $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64') { 'arm64' } else { 'x64' }
    $base = 'https://nodejs.org/dist/latest-v24.x'
    $manifest = (Invoke-WebRequest "$base/SHASUMS256.txt" -UseBasicParsing -TimeoutSec 120).Content
    $match = [regex]::Match($manifest, "(?m)^([a-f0-9]{64})\s+(node-v24\.[0-9]+\.[0-9]+-win-$arch\.zip)\s*$")
    if (!$match.Success) { throw 'Kein passendes Node.js-Paket gefunden.' }
    $temp = Join-Path (Split-Path $runtime) ([guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $temp | Out-Null
    try {
      $zip = Join-Path $temp 'node.zip'
      Invoke-WebRequest "$base/$($match.Groups[2].Value)" -OutFile $zip -UseBasicParsing -TimeoutSec 300
      if ((Get-FileHash $zip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $match.Groups[1].Value) { throw 'Node.js-Pruefsumme stimmt nicht.' }
      Expand-Archive -LiteralPath $zip -DestinationPath $temp
      $unpacked = Join-Path $temp ($match.Groups[2].Value -replace '\.zip$', '')
      if (!(Test-ToolsRuntime (Join-Path $unpacked 'node.exe') (Join-Path $unpacked 'node_modules\npm\bin\npm-cli.js'))) {
        throw "Das heruntergeladene Node.js-Paket kann nicht ausgefuehrt werden: $script:runtimeError"
      }
      if (Test-Path $runtime) { Remove-Item -Recurse -Force $runtime }
      Move-Item -LiteralPath $unpacked -Destination $runtime
    } finally { Remove-Item -Recurse -Force $temp }
    $nodeExe = Join-Path $runtime 'node.exe'
    $npmCli = Join-Path $runtime 'node_modules\npm\bin\npm-cli.js'
  }
  $env:PATH = "$(Split-Path $nodeExe);$env:PATH"
  $runtimeLock.Dispose()
  $runtimeLock = $null
  # Invoke npm's JS entry directly: no npm.ps1 policy or cmd.exe quoting involved.
  & $nodeExe $npmCli run tools -- @args
  exit $LASTEXITCODE
} catch {
  Write-Host "Einrichtung fehlgeschlagen: $($_.Exception.Message)"
  Write-Host 'Internetverbindung und Schreibrechte pruefen und Bearbeitung erneut starten.'
  exit 1
} finally {
  if ($runtimeLock) { $runtimeLock.Dispose() }
}
