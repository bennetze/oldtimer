#!/bin/sh
cd -- "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/Website" || exit 1
if ! command -v npm >/dev/null 2>&1; then
  printf '%s\n' 'Node.js fehlt. Bitte Node.js installieren und erneut starten.'
  exit 1
fi
npm run tools -- "$@"
