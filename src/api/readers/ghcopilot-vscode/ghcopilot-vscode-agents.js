import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseFrontmatter, CACHE_TTL } from '../../utils.js';
import { register } from '../agents.js';

const USER_PROMPTS_DIR = path.join(os.homedir(), '.config', 'Code', 'User', 'prompts');
const COPILOT_STORAGE_DIR = path.join(os.homedir(), '.config', 'Code', 'User', 'globalStorage', 'github.copilot-chat');

let _cache = null, _cacheTime = 0;

function slugify(name) {
  return name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
}

function scanDir(dir, agents, seen) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.agent.md')) continue;
    const filePath = path.join(dir, entry.name);
    let content;
    try { content = fs.readFileSync(filePath, 'utf8'); } catch { continue; }
    const { meta, body } = parseFrontmatter(content);
    const name = meta.name || entry.name.replace(/\.agent\.md$/, '');
    const slug = slugify(name);
    if (seen.has(slug)) continue;
    seen.add(slug);
    let mtime = null;
    try { mtime = fs.statSync(filePath).mtimeMs; } catch { /* ok */ }
    agents.push({ slug, name, description: meta.description || null, hasSkillMd: true, trigger: null, totalCalls: 0, lastUsed: mtime, _filePath: filePath, _meta: meta, _body: body });
  }
}

function scanAll() {
  const agents = [];
  const seen = new Set();

  // User custom agents
  scanDir(USER_PROMPTS_DIR, agents, seen);

  // Built-in Copilot agents (Ask, Explore, Plan, …)
  let builtinDirs;
  try { builtinDirs = fs.readdirSync(COPILOT_STORAGE_DIR, { withFileTypes: true }); } catch { builtinDirs = []; }
  for (const entry of builtinDirs) {
    if (entry.isDirectory()) scanDir(path.join(COPILOT_STORAGE_DIR, entry.name), agents, seen);
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

async function getAgents() {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL) return _cache;
  const all = scanAll();
  _cache = all.map(({ _filePath, _meta, _body, ...rest }) => rest);
  _cacheTime = now;
  return _cache;
}

function getAgentDetail(slug) {
  const agent = scanAll().find(x => x.slug === slug);
  if (!agent) return null;
  const displayMeta = {};
  for (const [k, v] of Object.entries(agent._meta)) {
    if (v !== undefined && v !== null && v !== '') displayMeta[k] = String(v);
  }
  return { slug: agent.slug, name: agent.name, hasSkillMd: true, frontmatter: displayMeta, body: agent._body || null };
}

register('ghcopilot-vscode', { getAgents, getAgentDetail });
