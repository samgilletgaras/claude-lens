import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { CACHE_TTL, isTmp, tildeHome, getServerSettings } from '../../utils.js';
import { register } from '../sessions.js';

// ─── Workspace discovery ──────────────────────────────────────────────────────

// This provider is VS Code only — stable + Insiders. Other editors (Cursor,
// Windsurf, VSCodium) are deliberately NOT listed here; per the architecture
// rules they belong to their own provider, not GitHub Copilot for VS Code.
export function isInsidersPresent() {
  const home = os.homedir();
  const platform = os.platform();
  if (platform === 'linux') {
    const configBase = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
    return fs.existsSync(path.join(configBase, 'Code - Insiders', 'User'));
  }
  if (platform === 'darwin') {
    return fs.existsSync(path.join(home, 'Library', 'Application Support', 'Code - Insiders', 'User'));
  }
  return false;
}

function getVscodeAppNames() {
  const names = ['Code'];
  if (getServerSettings().includeVscodeInsiders) names.push('Code - Insiders');
  return names;
}

export function getCandidateDirs() {
  const home = os.homedir();
  const platform = os.platform();
  const names = getVscodeAppNames();
  if (platform === 'linux') {
    const configBase = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
    return [
      ...names.map(n => path.join(configBase, n, 'User', 'workspaceStorage')),
      path.join(home, '.vscode-server', 'data', 'User', 'workspaceStorage'),
    ];
  }
  if (platform === 'darwin') {
    const appSupport = path.join(home, 'Library', 'Application Support');
    return names.map(n => path.join(appSupport, n, 'User', 'workspaceStorage'));
  }
  // Windows is intentionally out of scope (see CLAUDE.md data-sourcing rules).
  return [];
}

// VS Code "User" directories (the parent of each workspaceStorage), deduped.
// Use this for User-level data that lives outside workspaceStorage —
// e.g. User/prompts, User/globalStorage, User/mcp.json — so those readers cover
// every VS Code variant (stable + Insiders) instead of hardcoding one path.
export function getUserDirs() {
  return [...new Set(getCandidateDirs().map(d => path.dirname(d)))];
}

function decodeWorkspaceUri(uri) {
  try { return new URL(uri).pathname; } catch { return null; }
}

const _extraCacheClears = [];
export function registerCacheClear(fn) { _extraCacheClears.push(fn); }
export function clearAllCaches() {
  _scanCache = null; _scanCacheTime = 0;
  _projectsCache = null; _projectsCacheTime = 0;
  _sessionsCache.clear(); _messagesCache.clear();
  for (const fn of _extraCacheClears) fn();
}

let _scanCache = null, _scanCacheTime = 0;

// Cached wrapper around the workspace walk. The scan touches every VS Code
// variant's workspaceStorage and reads a workspace.json + transcript dir listing
// per workspace — too expensive to repeat on every getSessions/getMessages/logs
// /stats call, all of which only need the resulting map. Cached for CACHE_TTL;
// the returned map is treated as read-only by every caller.
export function scanWorkspaces() {
  const now = Date.now();
  if (_scanCache && now - _scanCacheTime < CACHE_TTL) return _scanCache;
  _scanCache = scanWorkspacesUncached();
  _scanCacheTime = now;
  return _scanCache;
}

function scanWorkspacesUncached() {
  const result = new Map();
  for (const wsDir of getCandidateDirs()) {
    let hashes;
    try { hashes = fs.readdirSync(wsDir, { withFileTypes: true }); }
    catch { continue; }
    for (const entry of hashes) {
      if (!entry.isDirectory()) continue;
      const wsJson = path.join(wsDir, entry.name, 'workspace.json');
      const tDir = path.join(wsDir, entry.name, 'GitHub.copilot-chat', 'transcripts');
      if (!fs.existsSync(wsJson) || !fs.existsSync(tDir)) continue;
      let folderPath;
      try {
        const parsed = JSON.parse(fs.readFileSync(wsJson, 'utf8'));
        folderPath = parsed.folder ? decodeWorkspaceUri(parsed.folder) : null;
      } catch { continue; }
      if (!folderPath || isTmp(path.basename(folderPath))) continue;
      let entries;
      try { entries = fs.readdirSync(tDir, { withFileTypes: true }); }
      catch { continue; }
      if (!result.has(folderPath)) result.set(folderPath, { files: new Map() });
      const proj = result.get(folderPath);
      for (const f of entries) {
        if (!f.isFile() || !f.name.endsWith('.jsonl')) continue;
        const sessionId = f.name.slice(0, -6);
        const filePath = path.join(tDir, f.name);
        try {
          const { mtimeMs } = fs.statSync(filePath);
          const existing = proj.files.get(sessionId);
          if (!existing || existing.mtime < mtimeMs) proj.files.set(sessionId, { filePath, mtime: mtimeMs });
        } catch { /* skip */ }
      }
    }
  }
  return result;
}

// ─── Streaming ────────────────────────────────────────────────────────────────

export async function streamJsonl(filePath, onLine) {
  return new Promise((resolve, reject) => {
    let stream;
    try { stream = fs.createReadStream(filePath, { encoding: 'utf8' }); }
    catch (e) { reject(e); return; }
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    rl.on('line', line => { if (line.trim()) try { onLine(JSON.parse(line)); } catch { /* skip */ } });
    rl.on('close', resolve);
    rl.on('error', reject);
    stream.on('error', reject);
  });
}

// ─── chatSessions (VS Code native chat store) ─────────────────────────────────

// Copilot stores conversations differently depending on the producer version:
//
//   Legacy (producer absent / "copilot"):
//     transcripts/<id>.jsonl contains session.start → user.message / assistant.message
//     events, but the very first user prompt is missing from the transcript.
//     chatSessions/<id>.jsonl fills that gap — it has every user prompt in order.
//
//   Newer agent format (producer "copilot-agent", version ≥ 1):
//     transcripts/<id>.jsonl only has session.start — no user or assistant events.
//     The entire conversation lives in chatSessions/<id>.jsonl:
//       user messages  → kind:2 request objects (message.text)
//       assistant text → kind:1 result patches (result.metadata.toolCallRounds[].response)
//
// In both cases we read from chatSessions whenever available so we get a complete
// picture. We only open chatSessions files whose sessionId matches a transcript we
// already found, keeping this strictly scoped to VS Code Copilot data.
function chatSessionPathFor(transcriptPath, sessionId) {
  // transcriptPath = <hash>/GitHub.copilot-chat/transcripts/<id>.jsonl
  return path.join(path.dirname(transcriptPath), '..', '..', 'chatSessions', `${sessionId}.jsonl`);
}

// The file is an append-only "observable diff" log:
//   kind:0 — base snapshot (may have requests: [] when session starts)
//   kind:2 — array-append to ["requests"]: the new request object (result: {} is empty here)
//   kind:1 — path patches, e.g. ["requests", N, "result"] carries the actual
//             assistant response (toolCallRounds) once the model finishes
//
// We reconstruct the full conversation by accumulating requests from kind:0/kind:2
// and then applying kind:1 result patches so toolCallRounds is populated.
export async function readChatRequests(transcriptPath, sessionId) {
  const chatPath = chatSessionPathFor(transcriptPath, sessionId);
  if (!fs.existsSync(chatPath)) return null;
  const requests = [];
  const resultPatches = new Map(); // requestIndex → result object
  try {
    await streamJsonl(chatPath, ev => {
      if (ev.kind === 0 && Array.isArray(ev.v?.requests)) requests.push(...ev.v.requests);
      else if (ev.kind === 2 && Array.isArray(ev.k) && ev.k.length === 1 && ev.k[0] === 'requests' && Array.isArray(ev.v)) requests.push(...ev.v);
      else if (ev.kind === 1 && Array.isArray(ev.k) && ev.k.length === 3 && ev.k[0] === 'requests' && typeof ev.k[1] === 'number' && ev.k[2] === 'result') {
        resultPatches.set(ev.k[1], ev.v);
      }
    });
  } catch { return null; }
  // Apply result patches — this is where toolCallRounds (assistant responses) live
  for (const [index, result] of resultPatches) {
    if (index < requests.length) requests[index] = { ...requests[index], result };
  }
  return requests.map(r => ({
    text: typeof r?.message?.text === 'string' ? r.message.text : '',
    timestamp: typeof r?.timestamp === 'number' ? r.timestamp : 0,
    modelId: typeof r?.modelId === 'string' ? r.modelId : null,
    completionTokens: typeof r?.completionTokens === 'number' ? r.completionTokens : 0,
    toolCallRounds: Array.isArray(r?.result?.metadata?.toolCallRounds) ? r.result.metadata.toolCallRounds : [],
  }));
}

// ─── Session parsing ──────────────────────────────────────────────────────────

async function summariseFile(filePath, sessionId, project) {
  let firstTs = null, lastTs = null, preview = '', turnCount = 0;
  const metadata = {};
  await streamJsonl(filePath, event => {
    const ts = event.timestamp ? new Date(event.timestamp).getTime() : null;
    if (ts && isFinite(ts)) { if (!firstTs || ts < firstTs) firstTs = ts; if (!lastTs || ts > lastTs) lastTs = ts; }
    if (event.type === 'session.start') {
      if (event.data?.copilotVersion) metadata.copilotVersion = event.data.copilotVersion;
      if (event.data?.vscodeVersion) metadata.vscodeVersion = event.data.vscodeVersion;
    }
    if (event.type === 'user.message') {
      turnCount++;
      const content = event.data?.content;
      if (!preview && content && typeof content === 'string') preview = content.slice(0, 150);
    }
  });
  // Prefer chatSessions for the prompt count + preview: it includes the opening
  // prompt the transcript drops, so the count and preview reflect the real first message.
  const reqs = await readChatRequests(filePath, sessionId);
  if (reqs && reqs.length) {
    turnCount = reqs.length;
    const first = reqs.find(r => r.text.trim());
    if (first) preview = first.text.slice(0, 150);
    const modelIds = reqs.map(r => r.modelId && (r.modelId.startsWith('copilot/') ? r.modelId.slice(8) : r.modelId)).filter(Boolean);
    if (modelIds.length) {
      const counts = {};
      for (const m of modelIds) counts[m] = (counts[m] ?? 0) + 1;
      metadata.model = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }
  }
  const chatPath = chatSessionPathFor(filePath, sessionId);
  const sourcePaths = [tildeHome(filePath)];
  if (fs.existsSync(chatPath)) sourcePaths.push(tildeHome(chatPath));
  return { id: sessionId, project, firstMessageTs: firstTs ?? 0, lastUpdated: lastTs ?? firstTs ?? 0, preview, turnCount, metadata, sourcePaths };
}

function tryParseJson(s) { try { return JSON.parse(s); } catch { return s; } }

// Returns an array of flat normalized events for one assistant turn.
function normaliseAssistant(event) {
  const d = event.data ?? {};
  const ts = event.timestamp ? new Date(event.timestamp).getTime() : 0;
  const out = [];
  if (d.content && typeof d.content === 'string' && d.content.trim()) {
    out.push({ role: 'assistant', content: d.content, timestamp: ts });
  }
  if (Array.isArray(d.toolRequests)) {
    for (const req of d.toolRequests) {
      out.push({
        role: 'tool_use',
        name: req.name ?? '',
        input: typeof req.arguments === 'string' ? tryParseJson(req.arguments) : (req.arguments ?? {}),
        id: req.toolCallId ?? req.id ?? undefined,
        timestamp: ts,
      });
    }
  }
  return out;
}

// ─── Implementations ──────────────────────────────────────────────────────────

let _projectsCache = null, _projectsCacheTime = 0;
const _sessionsCache = new Map();
const _messagesCache = new Map();

async function getProjects() {
  const now = Date.now();
  if (_projectsCache && now - _projectsCacheTime < CACHE_TTL) return _projectsCache;
  const projects = [];
  for (const [folderPath, { files }] of scanWorkspaces()) {
    if (files.size === 0) continue;
    const lastUpdated = Math.max(...[...files.values()].map(f => f.mtime));
    projects.push({ id: folderPath, fullPath: folderPath, sessionCount: files.size, lastUpdated });
  }
  projects.sort((a, b) => b.lastUpdated - a.lastUpdated);
  _projectsCache = projects; _projectsCacheTime = now;
  return projects;
}

async function getSessions(project, page, pageSize) {
  const now = Date.now();
  const cached = _sessionsCache.get(project);
  if (cached && now - cached.time < CACHE_TTL)
    return { data: cached.data.slice(page * pageSize, (page + 1) * pageSize), total: cached.data.length };
  const info = scanWorkspaces().get(project);
  if (!info) return { data: [], total: 0 };
  const summaries = [];
  for (const [sessionId, fileInfo] of info.files) {
    try { summaries.push(await summariseFile(fileInfo.filePath, sessionId, project)); }
    catch { /* skip broken files */ }
  }
  summaries.sort((a, b) => b.lastUpdated - a.lastUpdated);
  _sessionsCache.set(project, { data: summaries, time: now });
  return { data: summaries.slice(page * pageSize, (page + 1) * pageSize), total: summaries.length };
}

async function getMessages(project, session) {
  const key = `${project}:${session}`;
  const now = Date.now();
  const cached = _messagesCache.get(key);
  if (cached && now - cached.time < CACHE_TTL) return cached.data;
  const info = scanWorkspaces().get(project);
  const fileInfo = info?.files.get(session);
  if (!fileInfo) return [];

  // Assistant turns (with tool calls) come from the transcript.
  const assistantMsgs = [];
  await streamJsonl(fileInfo.filePath, event => {
    if (event.type === 'assistant.message') { assistantMsgs.push(...normaliseAssistant(event)); }
  });

  // User turns come from chatSessions when available — it's a superset that
  // includes the opening prompt the transcript omits. Fall back to the
  // transcript's user.message events if the chatSessions file is missing.
  //
  // For sessions produced by the newer copilot-agent format the transcript only
  // contains session.start (no assistant.message events); assistant responses
  // live in chatSessions' toolCallRounds, so we extract them from there when
  // the transcript-based assistantMsgs list is empty.
  const reqs = await readChatRequests(fileInfo.filePath, session);
  let userMsgs;
  if (reqs) {
    userMsgs = reqs.filter(r => r.text).map(r => ({ role: 'user', content: r.text, timestamp: r.timestamp }));
    if (assistantMsgs.length === 0) {
      for (const r of reqs) {
        for (const round of r.toolCallRounds) {
          const roundTs = typeof round.timestamp === 'number' ? round.timestamp : r.timestamp + 1;
          if (round.response && round.response.trim()) {
            assistantMsgs.push({ role: 'assistant', content: round.response, timestamp: roundTs });
          }
          if (Array.isArray(round.toolCalls)) {
            for (const tc of round.toolCalls) {
              assistantMsgs.push({
                role: 'tool_use',
                name: tc.function?.name ?? tc.name ?? '',
                input: tryParseJson(tc.function?.arguments ?? tc.arguments ?? '{}'),
                id: tc.id ?? undefined,
                timestamp: roundTs,
              });
            }
          }
        }
      }
    }
  } else {
    userMsgs = [];
    await streamJsonl(fileInfo.filePath, event => {
      if (event.type === 'user.message') {
        const content = event.data?.content;
        if (content) userMsgs.push({ role: 'user', content, timestamp: event.timestamp ? new Date(event.timestamp).getTime() : 0 });
      }
    });
  }

  // Merge chronologically; on a tie the user prompt precedes its assistant turn.
  const messages = [...userMsgs, ...assistantMsgs].sort((a, b) =>
    (a.timestamp - b.timestamp) || ((a.role === 'user' ? 0 : 1) - (b.role === 'user' ? 0 : 1)));
  _messagesCache.set(key, { data: messages, time: now });
  return messages;
}

register('ghcopilot-vscode', { getProjects, getSessions, getMessages });
