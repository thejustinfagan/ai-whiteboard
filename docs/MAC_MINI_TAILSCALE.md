# Mac mini + Tailscale hosting

Run AI Whiteboard on your Mac mini and open it from Surface, phone, and laptops over Tailscale.

## 1. One-time setup on the Mac mini

### Install prerequisites
- [Node.js 20+](https://nodejs.org/) (or `brew install node`)
- [Tailscale](https://tailscale.com/download) — sign in with the same account on every device

### Clone and install the app
```bash
cd ~
git clone https://github.com/thejustinfagan/ai-whiteboard.git
cd ai-whiteboard
git checkout cursor/nvidia-provider-pipeline-a7e3   # or main after PR merge
chmod +x scripts/mac-mini/*.sh
./scripts/mac-mini/install.sh
```

### Start (foreground)
```bash
./scripts/mac-mini/start.sh
```

Server binds to `0.0.0.0:3000` so Tailscale peers can reach it.

### Autostart on login (recommended)
```bash
./scripts/mac-mini/install-launchd.sh
```

Logs: `~/Library/Logs/ai-whiteboard/`

Remove autostart:
```bash
./scripts/mac-mini/uninstall-launchd.sh
```

## 2. Tailscale on every device

1. Install Tailscale on Mac mini, Surface, phone, other Macs
2. Sign in to the **same Tailscale account / tailnet**
3. On the Mac mini, open Tailscale → note the machine name (e.g. `mac-mini`) or MagicDNS name
4. On another device, open:

```
http://mac-mini:3000
```

If MagicDNS name fails, use the Tailscale IP shown in the Tailscale app:

```
http://100.x.x.x:3000
```

## 3. macOS firewall check

If other devices can't connect:
- **System Settings → Network → Firewall** — allow Node / incoming for port 3000
- Confirm Tailscale is Connected on both devices
- From Surface, `ping mac-mini` (or the Tailscale IP)

## 4. Update the app later

```bash
cd ~/ai-whiteboard
git pull
./scripts/mac-mini/install.sh
./scripts/mac-mini/uninstall-launchd.sh
./scripts/mac-mini/install-launchd.sh
```

## Notes

- NVIDIA key is already in the repo `.env` for this project
- Traffic stays on your private Tailscale network — not public internet
- For a public HTTPS URL later, use Cloudflare Tunnel; Tailscale is enough for personal multi-device use
