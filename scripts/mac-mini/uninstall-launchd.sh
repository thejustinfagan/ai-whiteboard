#!/usr/bin/env bash
# Remove the AI Whiteboard LaunchAgent.
set -euo pipefail

LABEL="com.aiwhiteboard.app"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "uninstall-launchd.sh is for macOS only."
  exit 1
fi

launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl unload "$PLIST" 2>/dev/null || true
rm -f "$PLIST"

echo "Removed LaunchAgent ${LABEL}"
