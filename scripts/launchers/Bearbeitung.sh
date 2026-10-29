#!/bin/sh
cd -- "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/Website" || exit 1
sh scripts/setup-tools.sh "$@"
