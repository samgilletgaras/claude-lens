import fs from 'fs';
import path from 'path';
import { CURSOR_SKILLS_DIR, CACHE_TTL, parseFrontmatter, tildeHome } from '../../utils.js';
import { register } from '../skills.js';

// parseFrontmatter only handles simple key: value pairs.
// Extract a YAML block scalar (>- / >) description when present.
function extractBlockDescription(raw) {
  const match = raw.match(/^description:\s*>-?\s*\n((?:[ \t]+\S[^\n]*\n?)*)/m);
  if (!match) return null;
  return match[1].split('\n').map(l => l.trim()).filter(Boolean).join(' ').slice(0, 200);
}

let _skillsCache = null, _skillsCacheTs = 0;

async function getSkills() {
  const now = Date.now();
  if (_skillsCache && now - _skillsCacheTs < CACHE_TTL) return _skillsCache;
  if (!fs.existsSync(CURSOR_SKILLS_DIR)) return [];

  const skills = [];
  for (const entry of fs.readdirSync(CURSOR_SKILLS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const skillMdPath = path.join(CURSOR_SKILLS_DIR, slug, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) continue;

    let description = null, trigger = null;
    try {
      const content = fs.readFileSync(skillMdPath, 'utf8');
      const { meta, body } = parseFrontmatter(content);
      const isBlockScalar = meta.description === '>-' || meta.description === '>';
      if (meta.description && !isBlockScalar) {
        description = meta.description.slice(0, 200);
      } else if (isBlockScalar) {
        description = extractBlockDescription(content);
      }
      if (!description) {
        for (const line of body.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---')) { description = trimmed.slice(0, 200); break; }
        }
      }
      if (meta.trigger) trigger = meta.trigger;
    } catch { continue; }

    const name = slug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    skills.push({
      slug,
      name,
      description,
      hasSkillMd: true,
      trigger,
      totalCalls: 0,
      lastUsed: null,
      sourcePath: tildeHome(skillMdPath),
    });
  }

  skills.sort((a, b) => a.slug.localeCompare(b.slug));
  _skillsCache = skills;
  _skillsCacheTs = now;
  return skills;
}

function getSkillDetail(slug) {
  const skillMdPath = path.join(CURSOR_SKILLS_DIR, slug, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) return null;
  const name = slug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  let frontmatter = {}, body = null;
  try {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    const parsed = parseFrontmatter(content);
    frontmatter = parsed.meta;
    body = parsed.body;
  } catch { return null; }
  return { slug, name, hasSkillMd: true, frontmatter, body, sourcePath: tildeHome(skillMdPath) };
}

register('cursor', { getSkills, getSkillDetail });
