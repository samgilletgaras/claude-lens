# Claude Lens

A local web app for browsing your Claude Code session history. Reads JSONL files from `~/.claude/projects/` and displays them as a timeline of messages, tool calls, and system events.

## Features

- Browse all Claude Code projects and sessions
- Timeline view of messages, tool calls, thinking blocks, and hook events
- Collapsible pipeline events and expandable long content
- Markdown rendering for Claude responses
- Skill list viewer

## Prerequisites

- Node.js 18+

## Setup

```bash
npm install
```

## Usage

```bash
# Start both backend and frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

| Command | Description |
|---|---|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run dev:cli` | Backend only (port 3000) |
| `npm run dev:web` | Frontend only (port 5173) |

## Architecture

Two npm workspaces under `src/`:

- **`src/cli`** — Node.js HTTP backend (`http.createServer`, no framework). Reads `~/.claude/projects/**/*.jsonl` and serves `GET /api/history`.
- **`src/web`** — React + Vite + Tailwind v4 frontend. Proxies `/api/*` to the backend.

```
~/.claude/projects/<project>/<session>.jsonl
  → CLI parses line-by-line
  → GET /api/history → Conversation[]
  → App.tsx groups by project
  → MessageBubble renders timeline
```
