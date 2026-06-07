# Cursor Provider

## TL;DR

Cursor stores its agent session data in `~/.cursor/` as plain JSONL + Markdown files — no SQLite needed. The provider reads:

- **Agent transcripts** — per-project JSONL files under `~/.cursor/projects/`
- **Plans** — Markdown files under `~/.cursor/plans/`
- **Skills** — SKILL.md files under `~/.cursor/skills-cursor/` (Cursor-specific) and `~/.agents/skills/` (agentskills.io global standard)
- **Agents** — `~/.claude/agents/*.md` (Claude global agents) + `~/.cursor/plugins/{cache,local}/{source}/{plugin-id}/{version}/agents/*.md` (plugin-bundled agents)
- **MCPs** — SERVER_METADATA.json files under `~/.cursor/projects/*/mcps/`

## Directory layout

```
~/.cursor/
├── projects/
│   ├── {slug}/                              # one dir per workspace
│   │   ├── agent-transcripts/
│   │   │   └── {uuid}/
│   │   │       └── {uuid}.jsonl             # ← one session per UUID
│   │   ├── mcps/
│   │   │   └── {server-id}/
│   │   │       └── SERVER_METADATA.json     # {serverIdentifier, serverName}
│   │   └── terminals/
├── plans/
│   └── {name}.plan.md                       # YAML frontmatter + markdown body
├── skills-cursor/
│   └── {skill-name}/
│       └── SKILL.md                         # YAML frontmatter + markdown body
└── mcp.json                                 # global MCP config (may be empty)

~/.agents/
└── skills/
    └── {skill-name}/
        └── SKILL.md                         # agentskills.io open standard (shared across editors)

~/.claude/
└── agents/
    └── {agent-name}.md                      # Claude global agents — visible to Cursor too

~/.cursor/plugins/
├── cache/
│   └── {source}/                            # e.g. cursor-public
│       └── {plugin-id}/
│           └── {version-hash}/
│               ├── agents/
│               │   └── {name}.md            # plugin-bundled agents
│               ├── skills/
│               ├── commands/
│               └── .claude-plugin/
│                   └── plugin.json          # {name, description, author}
└── local/                                   # locally installed plugins (same layout)
```

The project **slug** encodes the workspace path: drop the leading `/`, then replace every `/` with `-`.  
Example: `/home/sam/Projects/tamagotchi` → `home-sam-Projects-tamagotchi`.

## Session JSONL format

Each line is one message (no timestamps):

```json
{"role":"user","message":{"content":[{"type":"text","text":"<user_query>\nHello\n</user_query>"}]}}
{"role":"assistant","message":{"content":[{"type":"text","text":"..."},{"type":"tool_use","name":"Shell","input":{...}}]}}
```

Content blocks follow the Anthropic message shape (`type: "text"`, `type: "tool_use"`, `type: "tool_result"`). Cursor wraps user queries in `<user_query>` XML tags — these are stripped when building the session preview.

**Timestamps are not stored** in the JSONL. The provider uses the file's `mtime` as the session timestamp.

## Feature sourcing

| Feature | Source | Notes |
|---------|--------|-------|
| Projects | `~/.cursor/projects/` directory listing | Slugs decoded via workspaceStorage cross-reference |
| Sessions | `agent-transcripts/{uuid}/{uuid}.jsonl` | One file per agent run |
| Messages | Same JSONL, streamed line by line | No per-message timestamps |
| Stats | Derived from transcript JSONL | No token counts (not in JSONL) |
| Skills | `skills-cursor/{name}/SKILL.md` + `~/.agents/skills/{name}/SKILL.md` | Cursor-specific first; global deduped by slug |
| Agents | `~/.claude/agents/*.md` + `plugins/{cache,local}/**/agents/*.md` | Global Claude agents + plugin-bundled agents |
| Plans | `plans/*.plan.md` | YAML frontmatter with `name`, `overview`, `todos` |
| MCPs | `projects/*/mcps/*/SERVER_METADATA.json` | Also reads `mcp.json` for global config |

## Project path recovery

Cursor slugifies workspace paths, which is lossy for directories with hyphens in their names. The reader recovers the real path by cross-referencing:

```
{XDG_CONFIG_HOME|~/.config}/Cursor/User/workspaceStorage/{hash}/workspace.json
→ {"folder": "file:///home/sam/Projects/tamagotchi"}
```

For slugs without a matching `workspace.json` entry (e.g. `empty-window`), the reader falls back to an approximate reconstruction: `'/' + slug.replace(/-/g, '/')`.

## Availability check

`isAvailable()` returns `true` if `~/.cursor/` exists. On macOS the app data lives under `~/Library/Application Support/Cursor/User/` for workspaceStorage, but the Cursor-specific data (`projects/`, `plans/`, etc.) is always at `~/.cursor/`.

## Capabilities

| Capability | Supported | Reason |
|------------|-----------|--------|
| `hasHistory` | ✓ | JSONL transcripts |
| `hasStats` | ✓ | Derived from transcripts |
| `hasLogs` | ✗ | No separate raw-log layer |
| `hasSkills` | ✓ | `skills-cursor/` + `~/.agents/skills/` |
| `hasAgents` | ✓ | `~/.claude/agents/` + `~/.cursor/plugins/` plugin agents |
| `hasMcps` | ✓ | `SERVER_METADATA.json` files |
| `hasMemory` | ✗ | No memory system found |
| `hasPlans` | ✓ | `plans/` directory |
