#!/usr/bin/env bash
# Traz os MÓDULOS PRIVADOS (multiplayer + editor) do repo csbrasil-private para o
# working tree. É o mesmo padrão do fetch-audio.sh: no repo público esses caminhos
# ficam no .gitignore (fora do open source); aqui eles são clonados de volta pra você
# desenvolver/rodar o build privado.
#
# Uso:
#   bash scripts/fetch-private.sh
#   PRIVATE_REPO=git@github.com:EmersonGarrido/csbrasil-private.git bash scripts/fetch-private.sh
#
# Depois, pra ligar MP+editor no build:  PUBLIC_PRIVATE_FEATURES=1 npm run build
set -euo pipefail

REPO="${PRIVATE_REPO:-https://github.com/EmersonGarrido/csbrasil-private.git}"
DEST="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Clonando módulos privados de: $REPO"
git clone --depth 1 -q "$REPO" "$TMP"

echo "Instalando nos caminhos do projeto…"
cp    "$TMP/public/js/net.js"        "$DEST/public/js/net.js"
cp    "$TMP/public/js/netgame.js"    "$DEST/public/js/netgame.js"
rm -rf "$DEST/public/js/editor";     cp -R "$TMP/public/js/editor" "$DEST/public/js/editor"
cp    "$TMP/src/pages/editor.astro"  "$DEST/src/pages/editor.astro"
# server: código-fonte (o node_modules dele instala à parte com `cd server && npm install`)
mkdir -p "$DEST/server"
( cd "$TMP/server" && tar cf - . ) | ( cd "$DEST/server" && tar xf - )

echo "Pronto. Módulos privados instalados. (server: rode 'cd server && npm install' se ainda não tiver.)"
