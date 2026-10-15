#!/bin/zsh
cd -- "${0:A:h}" || exit 1
if ! command -v npm >/dev/null 2>&1; then
  print 'Node.js fehlt. Bitte Node.js installieren und dieses Fenster erneut öffnen.'
  read '?Eingabetaste zum Schließen …'
  exit 1
fi
npm run tools
read '?Eingabetaste zum Schließen …'
