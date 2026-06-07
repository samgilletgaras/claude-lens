import path from 'path';
import os from 'os';

export const PORT = process.env.PORT || 3000;
export const CLAUDE_DIR = path.join(os.homedir(), '.claude');
export const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');
export const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
export const AGENTS_DIR = path.join(CLAUDE_DIR, 'agents');
export const PLANS_DIR = path.join(CLAUDE_DIR, 'plans');
export const MCP_PLUGINS_DIR = path.join(CLAUDE_DIR, 'plugins/marketplaces/claude-plugins-official/external_plugins');
export const CACHE_TTL = 60_000;

// Reserved meta-provider id: aggregates data across every registered provider.
// Not a real registered provider — synthesized in /api/config and fanned out in
// the registry hubs. Project/memory ids are "packed" with their source provider
// (e.g. `claude:::<id>`) so every drill-down routes back deterministically.
export const ALL_PROVIDER = 'all';
const ID_SEP = ':::';
export const packId = (provider, id) => `${provider}${ID_SEP}${id}`;
export function unpackId(packed) {
  const i = packed.indexOf(ID_SEP);
  return i === -1
    ? { provider: null, id: packed }
    : { provider: packed.slice(0, i), id: packed.slice(i + ID_SEP.length) };
}

export const MODEL_PRICING = {
  'claude-opus-4': [15, 75], 'claude-3-opus': [15, 75],
  'claude-sonnet-4': [3, 15], 'claude-3-5-sonnet': [3, 15], 'claude-3-sonnet': [3, 15],
  'claude-haiku-4': [0.8, 4], 'claude-3-5-haiku': [0.8, 4], 'claude-3-haiku': [0.25, 1.25],
};

export function isTmp(name) {
  return name === 'tmp' || name.endsWith('-tmp') || name.includes('tmp');
}

// Guard against path traversal: returns true only when `target` resolves to a
// location inside `root`. Used before reading any path built from a request
// param (project/session/file) so `?project=../../..` can't escape the root.
export function isWithin(root, target) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

export function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (!lines[0] || lines[0].trim() !== '---') return { meta: {}, body: content };
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { endIdx = i; break; }
  }
  if (endIdx === -1) return { meta: {}, body: content };
  const meta = {};
  for (const line of lines.slice(1, endIdx)) {
    const m = line.match(/^([\w-]+)\s*:\s*(.*)/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[m[1]] = val;
    }
  }
  return { meta, body: lines.slice(endIdx + 1).join('\n').trimStart() };
}

export function parseQuery(url) {
  const u = new URL(url, 'http://localhost');
  return {
    pathname: u.pathname,
    get: (k, def) => u.searchParams.get(k) ?? def,
  };
}
