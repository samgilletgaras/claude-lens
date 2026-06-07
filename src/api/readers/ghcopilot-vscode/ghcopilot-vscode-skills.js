import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseFrontmatter, CACHE_TTL, tildeHome } from '../../utils.js';
import { register } from '../skills.js';

// Global skill roots VS Code Copilot resolves, per the agentskills.io open standard.
// ~/.claude/skills is intentionally omitted — the Claude provider owns that directory.
const GLOBAL_SKILL_ROOTS = [
  path.join(os.homedir(), '.copilot', 'skills'),
  path.join(os.homedir(), '.agents', 'skills'),
];

let _cache = null, _cacheTime = 0;

function readSkillsFromDir(dir, seen) {
  const skills = [];
  if (!fs.existsSync(dir)) return skills;
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return skills; }
  for (const entry of entries) {
    if (seen.has(entry)) continue;
    const entryPath = path.join(dir, entry);
    let stat;
    try { stat = fs.statSync(entryPath); } catch { continue; }
    if (!stat.isDirectory()) continue;
    const skillMdPath = path.join(entryPath, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) continue;
    const content = fs.readFileSync(skillMdPath, 'utf8');
    const { meta, body } = parseFrontmatter(content);
    let description = meta.description || null;
    if (!description) {
      for (const line of body.split('\n')) {
        const t = line.trim();
        if (t && !t.startsWith('#')) { description = t.slice(0, 200); break; }
      }
    }
    const name = meta.name || entry.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const trigger = meta.trigger || null;
    seen.add(entry);
    skills.push({ slug: entry, name, description, hasSkillMd: true, trigger, totalCalls: 0, lastUsed: null, sourcePath: tildeHome(skillMdPath) });
  }
  return skills;
}

async function getSkills() {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL) return _cache;

  const seen = new Set();
  const skills = [];
  for (const root of GLOBAL_SKILL_ROOTS) {
    skills.push(...readSkillsFromDir(root, seen));
  }

  skills.sort((a, b) => a.slug.localeCompare(b.slug));
  _cache = skills;
  _cacheTime = now;
  return skills;
}

function getSkillDetail(slug) {
  for (const root of GLOBAL_SKILL_ROOTS) {
    const skillMdPath = path.join(root, slug, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) continue;
    const content = fs.readFileSync(skillMdPath, 'utf8');
    const { meta, body } = parseFrontmatter(content);
    const name = meta.name || slug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const displayMeta = {};
    for (const [k, v] of Object.entries(meta)) {
      if (v !== undefined && v !== null && v !== '') displayMeta[k] = String(v);
    }
    return { slug, name, hasSkillMd: true, frontmatter: displayMeta, body: body || null, sourcePath: tildeHome(skillMdPath) };
  }
  return null;
}

register('ghcopilot-vscode', { getSkills, getSkillDetail });
