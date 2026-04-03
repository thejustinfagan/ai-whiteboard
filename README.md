# AI Whiteboard

**Excalidraw + Claude AI** = Turn sketches into functional specs, wireframes, diagrams, and user stories.

## Features

🎨 **Excalidraw Integration** - World-class whiteboard canvas  
🤖 **AI-Powered Analysis** - Claude Sonnet 4 vision + reasoning  
📋 **Multiple Output Modes:**
- **Spec** - Functional specifications with data flow, components, requirements
- **Wireframe** - UX/UI analysis with layout, components, navigation
- **Diagram** - Technical architecture documentation
- **Story** - Agile user stories with acceptance criteria

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add your Anthropic API key:
```bash
# Edit .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

3. Run dev server:
```bash
npm run dev
```

4. Open http://localhost:3000

## Usage

1. **Draw** on the Excalidraw canvas
   - Boxes = components/services/screens
   - Arrows = data flow/navigation
   - Text = labels, notes, requirements

2. **Select mode** (Spec / Wireframe / Diagram / Story)

3. **Click "Generate"** - Claude analyzes your sketch and produces:
   - Functional specifications
   - UI/UX analysis
   - Architecture docs
   - User stories with acceptance criteria

## Tech Stack

- **Next.js 14** - React framework
- **Excalidraw** - Canvas/whiteboard component
- **Claude Sonnet 4** - Vision AI
- **Tailwind CSS** - Styling

## Deploy

```bash
npm run build
npm run start
```

Or deploy to Vercel/Railway/Netlify - just set `ANTHROPIC_API_KEY` in env vars.

## Examples

**System Diagram** → Architecture documentation  
**Wireframe Sketch** → Component breakdown + navigation flow  
**Feature Boxes** → User stories with acceptance criteria  
**Data Flow** → Technical specification with API contracts

---

Built by Barry 🚀
