#!/bin/sh
set -eu
cd -- "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
for file in package.json package-lock.json .npmrc scripts/start-tools.mjs scripts/lib/tools-setup.mjs scripts/lib/tools-install-process.mjs; do
  [ -f "$file" ] || { printf '%s\n' "Projektdatei $file fehlt. Kopiervorgang abschließen und vollständigen Website-Ordner übertragen."; exit 1; }
done
runtime="$PWD/.cache/tools-node"
if [ -x "$runtime/bin/node" ]; then PATH="$runtime/bin:$PATH"; export PATH; fi
if ! command -v node >/dev/null 2>&1 || ! node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>22 || (a===22 && b>=12) ? 0 : 1)' || ! command -v npm >/dev/null 2>&1 || ! npm --version >/dev/null 2>&1; then
  printf '%s\n' 'Node.js wird heruntergeladen und lokal eingerichtet …'
  case "$(uname -s)" in Darwin) os=darwin ;; Linux) os=linux ;; *) echo 'Betriebssystem nicht unterstützt.'; exit 1 ;; esac
  case "$(uname -m)" in arm64|aarch64) arch=arm64 ;; x86_64) arch=x64 ;; *) echo 'Prozessor nicht unterstützt.'; exit 1 ;; esac
  download() {
    if command -v curl >/dev/null 2>&1; then curl --fail --location --silent --show-error --connect-timeout 30 --max-time 300 --retry 2 "$1" -o "$2"
    elif command -v wget >/dev/null 2>&1; then wget --timeout=30 --tries=3 -q "$1" -O "$2"
    else echo 'Bitte curl oder wget installieren und erneut starten.'; return 1; fi
  }
  temp=$(mktemp -d)
  trap 'rm -rf -- "$temp"' EXIT HUP INT TERM
  base=https://nodejs.org/dist/latest-v24.x
  download "$base/SHASUMS256.txt" "$temp/sums"
  file=$(awk -v ending="-$os-$arch.tar.gz" '$2 ~ /^node-v24\.[0-9]+\.[0-9]+-/ && substr($2,length($2)-length(ending)+1)==ending {print $2; exit}' "$temp/sums")
  [ -n "$file" ] || { echo 'Kein passendes Node.js-Paket gefunden.'; exit 1; }
  download "$base/$file" "$temp/node.tar.gz"
  expected=$(awk -v name="$file" '$2==name {print $1}' "$temp/sums")
  if command -v sha256sum >/dev/null 2>&1; then actual=$(sha256sum "$temp/node.tar.gz" | awk '{print $1}')
  else actual=$(shasum -a 256 "$temp/node.tar.gz" | awk '{print $1}'); fi
  [ "$expected" = "$actual" ] || { echo 'Node.js-Prüfsumme stimmt nicht.'; exit 1; }
  tar -xzf "$temp/node.tar.gz" -C "$temp"
  candidate="$temp/${file%.tar.gz}"
  "$candidate/bin/node" --version >/dev/null
  PATH="$candidate/bin:$PATH" "$candidate/bin/npm" --version >/dev/null
  mkdir -p .cache
  rm -rf -- "$runtime"
  mv -- "$temp/${file%.tar.gz}" "$runtime"
  PATH="$runtime/bin:$PATH"; export PATH
  rm -rf -- "$temp"
  trap - EXIT HUP INT TERM
fi
exec npm run tools -- "$@"
