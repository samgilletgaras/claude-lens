import fs from 'fs';
import path from 'path';
import { AGENTS_DIR, CURSOR_PLUGINS_DIR, CACHE_TTL, parseFrontmatter, tildeHome } from '../../utils.js';
import { register } from '../agents.js';

let _cache = null, _cacheTime = 0;

function scanDir(dir, agents, seen) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      scanDir(path.join(dir, entry.name), agents, seen);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const filePath = path.join(dir, entry.name);
    let content;
    try { content = fs.readFileSync(filePath, 'utf8'); } catch { continue; }
    const { meta, body } = parseFrontmatter(content);
    const slug = entry.name.replace(/\.md$/, '');
    if (seen.has(filePath)) continue;
    seen.add(filePath);
    const name = meta.name || slug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    let description = meta.description || null;
    if (!description) {
      for (const line of body.split('\n')) {
        const t = line.trim();
        if (t && !t.startsWith('#')) { description = t.slice(0, 200); break; }
      }
    }
    let mtime = null;
    try { mtime = fs.statSync(filePath).mtimeMs; } catch { /* ok */ }
    agents.push({ slug, name, description, hasSkillMd: true, trigger: null, totalCalls: 0, lastUsed: mtime, _filePath: filePath, _meta: meta, _body: body });
  }
}

// Scan ~/.cursor/plugins/{cache,local}/{source}/{plugin-id}/{version}/agents/
function scanPluginAgents(agents, seen) {
  if (!fs.existsSync(CURSOR_PLUGINS_DIR)) return;
  let roots;
  try { roots = fs.readdirSync(CURSOR_PLUGINS_DIR, { withFileTypes: true }); } catch { return; }
  for (const root of roots) {
    if (!root.isDirectory()) continue; // cache / local
    const rootDir = path.join(CURSOR_PLUGINS_DIR, root.name);
    let sources;
    try { sources = fs.readdirSync(rootDir, { withFileTypes: true }); } catch { continue; }
    for (const source of sources) {
      if (!source.isDirectory()) continue;
      const sourceDir = path.join(rootDir, source.name);
      let pluginIds;
      try { pluginIds = fs.readdirSync(sourceDir, { withFileTypes: true }); } catch { continue; }
      for (const pluginId of pluginIds) {
        if (!pluginId.isDirectory()) continue;
        const pluginDir = path.join(sourceDir, pluginId.name);
        let versions;
        try { versions = fs.readdirSync(pluginDir, { withFileTypes: true }); } catch { continue; }
        for (const version of versions) {
          if (!version.isDirectory()) continue;
          const agentsDir = path.join(pluginDir, version.name, 'agents');
          if (!fs.existsSync(agentsDir)) continue;
          scanDir(agentsDir, agents, seen);
        }
      }
    }
  }
}

async function getAgents() {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL) return _cache;
  const agents = [];
  const seen = new Set();
  // Global Claude agents — same files Cursor reads for ~/.claude/agents/
  scanDir(AGENTS_DIR, agents, seen);
  // Plugin-bundled agents from ~/.cursor/plugins/
  scanPluginAgents(agents, seen);
  agents.sort((a, b) => a.name.localeCompare(b.name));
  _cache = agents.map(({ _filePath, _meta, _body, ...rest }) => ({ ...rest, sourcePath: tildeHome(_filePath) }));
  _cacheTime = now;
  return _cache;
}

function getAgentDetail(slug) {
  const agents = [];
  const seen = new Set();
  scanDir(AGENTS_DIR, agents, seen);
  scanPluginAgents(agents, seen);
  const agent = agents.find(a => a.slug === slug);
  if (!agent) return null;
  const displayMeta = {};
  for (const [k, v] of Object.entries(agent._meta)) {
    if (v !== undefined && v !== null && v !== '') displayMeta[k] = String(v);
  }
  return { slug: agent.slug, name: agent.name, hasSkillMd: true, frontmatter: displayMeta, body: agent._body || null, sourcePath: tildeHome(agent._filePath) };
}

register('cursor', { getAgents, getAgentDetail });
