#!/usr/bin/env bash
# Start AI Whiteboard bound to all interfaces so Tailscale devices can reach it.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3000}"
HOSTNAME="${HOSTNAME:-0.0.0.0}"

if [[ ! -d .next ]]; then
  echo "No production build found. Running install/build first..."
  "$ROOT/scripts/mac-mini/install.sh"
fi

# Load committed .env if present (Next.js also auto-loads .env / .env.local)
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${NVIDIA_API_KEY:-}" && -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "Warning: no NVIDIA_API_KEY or ANTHROPIC_API_KEY found in environment."
fi

echo "Starting AI Whiteboard on http://${HOSTNAME}:${PORT}"
echo "On Tailscale devices, open: http://$(scutil --get LocalHostName 2>/dev/null || hostname):${PORT}"
echo "Or use the Mac mini Tailscale IP from the Tailscale app."

exec npx next start -H "$HOSTNAME" -p "$PORT"
