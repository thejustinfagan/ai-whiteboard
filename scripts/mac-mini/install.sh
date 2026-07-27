#!/usr/bin/env bash
# Install AI Whiteboard dependencies and build for Mac mini hosting.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Installing dependencies"
npm install

echo "==> Building production bundle"
npm run build

echo "==> Done"
echo "Start with:  ./scripts/mac-mini/start.sh"
echo "Autostart:   ./scripts/mac-mini/install-launchd.sh"
