#!/usr/bin/env bash
# Screenshot 3D models from the gallery with headless Chrome (software WebGL).
# Needs the dev server running (npm run dev, port 5340, or set PORT).
#   scripts/shoot.sh OUT_DIR ID [ID...]          -> OUT_DIR/ID-34.png and ID-front.png
#   VIEWS="34 side top" scripts/shoot.sh out bed-queen
#   CAT=Tech scripts/shoot.sh out                -> OUT_DIR/cat-Tech.png (whole category)
set -e
OUT="$1"; shift || true
PORT="${PORT:-5340}"
CH="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
VIEWS="${VIEWS:-34 front}"
mkdir -p "$OUT"
PROFILE="$(mktemp -d)"
shot() { "$CH" --headless=new --use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader --hide-scrollbars \
  --window-size="${SIZE:-900,700}" --virtual-time-budget=8000 --user-data-dir="$PROFILE" --screenshot="$2" "$1" >/dev/null 2>&1; echo "$2"; }
if [ -n "$CAT" ]; then shot "http://localhost:$PORT/?gallery=1&cat=$CAT" "$OUT/cat-$CAT.png"; fi
for id in "$@"; do
  for v in $VIEWS; do
    q=""; [ "$v" != "34" ] && q="&view=$v"
    shot "http://localhost:$PORT/?gallery=1&focus=$id$q" "$OUT/$id-$v.png"
  done
done
rm -rf "$PROFILE"
