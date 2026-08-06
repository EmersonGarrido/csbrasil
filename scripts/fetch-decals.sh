#!/usr/bin/env bash
# Baixa o pacote de decalques de grafite para public/img/decals/.
# Os 174 PNGs ficam FORA do git (curadoria de acervo — ver .gitignore, bloco
# "Decalques de graffiti"); sem este passo o deploy renderiza os mapas SEM
# grafite (T.decals vira 404 silencioso — foi o "os mapas perderam toda textura
# de graffitis" do dono em 06/08). Publicação do pack autorizada pelo dono.
set -e
cd "$(dirname "$0")/.."

URL="${DECALS_PACK_URL:-https://github.com/rubenmarcus/csbrasil/releases/download/decals-pack-v1/decals-pack.zip}"
DEST="public/img/decals"

if [ -d "$DEST" ] && [ "$(ls -1 "$DEST"/*.png 2>/dev/null | wc -l)" -gt 0 ]; then
  echo "decals/ já configurado — nada a fazer."
  exit 0
fi
mkdir -p "$DEST"
echo "Baixando decalques de: $URL"
curl -fsSL "$URL" -o /tmp/csbrasil-decals.zip
unzip -o -q /tmp/csbrasil-decals.zip -d "$DEST/"
echo "Pronto. $(ls -1 "$DEST"/*.png | wc -l | tr -d ' ') decalques em $DEST/."
