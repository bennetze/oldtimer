#!/bin/zsh
cd -- "${0:A:h}/Website" || exit 1
sh scripts/setup-tools.sh "$@"
result=$?
read '?Eingabetaste zum Schließen …'
exit $result
