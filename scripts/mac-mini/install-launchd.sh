#!/usr/bin/env bash
# Install a launchd job so AI Whiteboard starts on login/boot (macOS).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LABEL="com.aiwhiteboard.app"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG_DIR="$HOME/Library/Logs/ai-whiteboard"
NODE_BIN="$(command -v node)"
NPM_BIN="$(command -v npm)"
NPX_BIN="$(command -v npx)"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "install-launchd.sh is for macOS only."
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents" "$LOG_DIR"

# Ensure production build exists
"$ROOT/scripts/mac-mini/install.sh"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>WorkingDirectory</key>
  <string>${ROOT}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${ROOT}/scripts/mac-mini/start.sh</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:${NODE_BIN%/*}:${NPM_BIN%/*}:${NPX_BIN%/*}</string>
    <key>PORT</key>
    <string>3000</string>
    <key>HOSTNAME</key>
    <string>0.0.0.0</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/stderr.log</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl enable "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl kickstart -k "gui/$(id -u)/${LABEL}" 2>/dev/null || launchctl load "$PLIST"

echo "Installed LaunchAgent: $PLIST"
echo "Logs: $LOG_DIR"
echo "Stop with:  ./scripts/mac-mini/uninstall-launchd.sh"
