import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { CURSOR_PROJECTS_DIR, CACHE_TTL, isTmp, tildeHome, isWithin, getCursorAppDirs } from '../../utils.js';
import { register } from '../sessions.js';

// ─── Workspace path recovery ──────────────────────────────────────────────────

// Cursor slugifies a workspace path by dropping the leading '/' and replacing
// every '/' with '-'. We recover the real path by cross-referencing Cursor's
// workspaceStorage JSON files.
let _slugMapCache = null, _slugMapCacheTs = 0;

function buildSlugMap() {
  const now = Date.now();
  if (_slugMapCache && now - _slugMapCacheTs < CACHE_TTL) return _slugMapCache;
  const map = new Map();
  for (const userDir of getCursorAppDirs()) {
    const wsDir = path.join(userDir, 'workspaceStorage');
    let hashes;
    try { hashes = fs.readdirSync(wsDir, { withFileTypes: true }); } catch { continue; }
    for (const entry of hashes) {
      if (!entry.isDirectory()) continue;
      const wsJson = path.join(wsDir, entry.name, 'workspace.json');
      try {
        const parsed = JSON.parse(fs.readFileSync(wsJson, 'utf8'));
        const folder = parsed.folder;
        if (!folder) continue;
        let folderPath;
        try { folderPath = new URL(folder).pathname; } catch { continue; }
        if (!folderPath) continue;
        // Encode path → slug the same way Cursor does (drop leading '/', replace '/' with '-')
        const slug = folderPath.slice(1).replace(/\//g, '-');
        map.set(slug, folderPath);
      } catch { continue; }
    }
  }
  _slugMapCache = map;
  _slugMapCacheTs = now;
  return map;
}

// Return the best display path for a slug: workspace.json lookup → fallback reconstruction.
function slugToPath(slug, slugMap) {
  if (slugMap.has(slug)) return slugMap.get(slug);
  // Approximate: re-insert slashes. Wrong for paths with hyphens in dir names,
  // but readable enough when no workspace.json entry exists.
  return '/' + slug.replace(/-/g, '/');
}

// ─── Transcript scanning ──────────────────────────────────────────────────────

// Returns the text of the first user message, stripped of Cursor-injected XML
// wrapper tags. Extracts the <user_query> content when present so that injected
// metadata (timestamp, user_info, …) never leaks into the session preview.
function extractPreview(text) {
  if (typeof text !== 'string') return null;
  // Prefer the inner text of <user_query> as the canonical preview
  const uqMatch = text.match(/<user_query>([\s\S]*?)<\/user_query>/);
  if (uqMatch) text = uqMatch[1];
  // Strip any remaining block tags together with their content
  text = text.replace(/<[a-zA-Z_][a-zA-Z0-9_-]*>[\s\S]*?<\/[a-zA-Z_][a-zA-Z0-9_-]*>/g, '');
  // Strip any leftover opening/self-closing tags
  text = text.replace(/<[^>]+>/g, '').trim();
  return text.slice(0, 150) || null;
}

// ─── Block flattening helpers ─────────────────────────────────────────────────

// Flatten a Cursor user message's content into normalized events.
// Strips Cursor-injected XML wrappers (<timestamp>, <user_info>, etc.),
// promotes <system_reminder> to system events, and extracts <user_query> text.
function flattenCursorUser(content, ts, out) {
  if (!Array.isArray(content)) return;
  for (const block of content) {
    if (block?.type !== 'text' || !block.text) continue;
    let text = block.text;

    // Extract <system_reminder> → emit as system events
    const sysRe = /<system_reminder>([\s\S]*?)<\/system_reminder>/g;
    let m;
    while ((m = sysRe.exec(text)) !== null) {
      const reminder = m[1].trim();
      if (reminder) out.push({ role: 'system', content: reminder, timestamp: ts });
    }
    text = text.replace(/<system_reminder>[\s\S]*?<\/system_reminder>/g, '');

    // Extract the user's actual query from its wrapper
    const uqMatch = text.match(/<user_query>([\s\S]*?)<\/user_query>/);
    if (uqMatch) text = uqMatch[1];

    // Strip remaining injected block tags (timestamp, user_info, attached_files, git_status, …)
    text = text.replace(/<[a-zA-Z_][a-zA-Z0-9_-]*>[\s\S]*?<\/[a-zA-Z_][a-zA-Z0-9_-]*>/g, '');
    text = text.replace(/<[^>]+>/g, '').trim();

    if (text) out.push({ role: 'user', content: text, timestamp: ts });
  }
}

// Flatten a Cursor assistant message's content into normalized events.
function flattenCursorAssistant(content, ts, out) {
  if (!Array.isArray(content)) return;
  for (const block of content) {
    if (!block) continue;
    if (block.type === 'text' && block.text?.trim()) {
      out.push({ role: 'assistant', content: block.text, timestamp: ts });
    } else if (block.type === 'tool_use') {
      out.push({ role: 'tool_use', name: block.name, input: block.input ?? {}, id: block.id, timestamp: ts });
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

let _projectsCache = null, _projectsCacheTs = 0;

async function getProjects() {
  const now = Date.now();
  if (_projectsCache && now - _projectsCacheTs < CACHE_TTL) return _projectsCache;
  if (!fs.existsSync(CURSOR_PROJECTS_DIR)) return [];

  const slugMap = buildSlugMap();
  const projects = [];

  for (const entry of fs.readdirSync(CURSOR_PROJECTS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || isTmp(entry.name)) continue;
    const slug = entry.name;
    const transcriptsDir = path.join(CURSOR_PROJECTS_DIR, slug, 'agent-transcripts');
    if (!fs.existsSync(transcriptsDir)) continue;

    let sessionCount = 0, lastUpdated = 0;
    try {
      for (const uuidEntry of fs.readdirSync(transcriptsDir, { withFileTypes: true })) {
        if (!uuidEntry.isDirectory()) continue;
        const jsonlPath = path.join(transcriptsDir, uuidEntry.name, `${uuidEntry.name}.jsonl`);
        if (!fs.existsSync(jsonlPath)) continue;
        sessionCount++;
        const mtime = fs.statSync(jsonlPath).mtimeMs;
        if (mtime > lastUpdated) lastUpdated = mtime;
      }
    } catch { continue; }

    if (sessionCount === 0) continue;

    projects.push({
      id: slug,
      fullPath: slugToPath(slug, slugMap),
      sessionCount,
      lastUpdated,
    });
  }

  projects.sort((a, b) => b.lastUpdated - a.lastUpdated);
  _projectsCache = projects;
  _projectsCacheTs = now;
  return projects;
}

async function getSessions(project, page = 0, pageSize = 20) {
  const transcriptsDir = path.join(CURSOR_PROJECTS_DIR, project, 'agent-transcripts');
  if (!isWithin(CURSOR_PROJECTS_DIR, transcriptsDir) || !fs.existsSync(transcriptsDir)) {
    return { data: [], total: 0 };
  }

  const sessions = [];
  for (const uuidEntry of fs.readdirSync(transcriptsDir, { withFileTypes: true })) {
    if (!uuidEntry.isDirectory()) continue;
    const sessionId = uuidEntry.name;
    const jsonlPath = path.join(transcriptsDir, sessionId, `${sessionId}.jsonl`);
    if (!fs.existsSync(jsonlPath)) continue;

    let stat;
    try { stat = fs.statSync(jsonlPath); } catch { continue; }
    const lastUpdated = stat.mtimeMs;

    // Stream through file to get preview and turn count without loading all into memory
    let preview = null, turnCount = 0;
    try {
      const rl = readline.createInterface({ input: fs.createReadStream(jsonlPath), crlfDelay: Infinity });
      for await (const line of rl) {
        if (!line.trim()) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        if (msg.role === 'user') {
          turnCount++;
          if (!preview) {
            const content = msg.message?.content;
            if (Array.isArray(content)) {
              for (const block of content) {
                if (block?.type === 'text' && block.text) {
                  preview = extractPreview(block.text);
                  if (preview) break;
                }
              }
            }
          }
        }
      }
    } catch { continue; }

    sessions.push({
      id: sessionId,
      project,
      lastUpdated,
      firstMessageTs: lastUpdated,
      preview,
      turnCount,
      tokens: null,
      sourcePaths: [tildeHome(jsonlPath)],
    });
  }

  sessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
  const total = sessions.length;
  const data = sessions.slice(page * pageSize, (page + 1) * pageSize);
  return { data, total };
}

async function getMessages(project, sessionId) {
  const jsonlPath = path.join(CURSOR_PROJECTS_DIR, project, 'agent-transcripts', sessionId, `${sessionId}.jsonl`);
  if (!isWithin(CURSOR_PROJECTS_DIR, jsonlPath) || !fs.existsSync(jsonlPath)) return [];

  const messages = [];
  const rl = readline.createInterface({ input: fs.createReadStream(jsonlPath), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (!msg.role || !msg.message?.content) continue;

    if (msg.role === 'user') {
      flattenCursorUser(msg.message.content, null, messages);
    } else if (msg.role === 'assistant') {
      flattenCursorAssistant(msg.message.content, null, messages);
    }
  }
  return messages;
}

register('cursor', { getProjects, getSessions, getMessages });
