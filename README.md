# AI Whiteboard

**Excalidraw + NVIDIA NIM** — draw scenarios on your Surface, decipher with Hermes-style AI, review, and export agent-ready prompt loops.

## Features

- **Excalidraw canvas** with Surface pen detection
- **NVIDIA NIM vision** (default) via `meta/llama-3.2-90b-vision-instruct`
- **Optional Anthropic Claude** fallback
- **Workflow pipeline:** Draw → Decipher → Review → Export
- **Prompt pack export** — JSON for Hermes bots, Cursor agents, or custom loops
- **Quick Generate** — one-shot spec/wireframe/diagram/story (legacy mode)

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000 — `NVIDIA_API_KEY` is in the committed `.env` file.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `NVIDIA_API_KEY` | Yes (default) | In committed `.env` |
| `NVIDIA_MODEL` | No | Vision model (default: `meta/llama-3.2-90b-vision-instruct`) |
| `ANTHROPIC_API_KEY` | No | Optional Claude fallback |
| `ANTHROPIC_MODEL` | No | Claude model override |

## Workflow

1. **Draw** — sketch boxes, arrows, labels on the canvas (Surface pen supported)
2. **Decipher** — Hermes-style structured extraction (entities, relationships, ambiguities)
3. **Review** — AI critique with gaps, suggestions, and approval status
4. **Export Loop** — download/copy `prompt_pack.json` with system prompt, user prompt, acceptance criteria, and agent loop steps

## API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/decipher` | Vision → Whiteboard IR JSON |
| `POST /api/review` | Vision + IR → review JSON |
| `POST /api/export` | IR + review → prompt pack |
| `POST /api/generate` | Quick one-shot generation |
| `GET /api/providers` | List configured providers |

## Deploy

### Mac mini + Tailscale (recommended for personal use)

Host on your Mac mini; open from Surface / phone / laptops over Tailscale.

```bash
chmod +x scripts/mac-mini/*.sh
./scripts/mac-mini/install.sh
./scripts/mac-mini/start.sh
# optional always-on:
./scripts/mac-mini/install-launchd.sh
```

Full steps: [docs/MAC_MINI_TAILSCALE.md](docs/MAC_MINI_TAILSCALE.md)

### Cloud (optional)

Railway / Vercel / Netlify — set `NVIDIA_API_KEY` in environment variables.

```bash
npm run build
npm run start
```

---

Built by Barry
