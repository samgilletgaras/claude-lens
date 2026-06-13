import fs from 'fs';
import path from 'path';
import { CURSOR_DATA_DIR, parseFrontmatter, tildeHome } from '../../utils.js';
import { register } from '../system-prompts.js';

const RULES_DIR = path.join(CURSOR_DATA_DIR, 'rules');

async function getSystemPrompts() {
  if (!fs.existsSync(RULES_DIR)) return [];

  let files;
  try {
    files = fs.readdirSync(RULES_DIR).filter(f => f.endsWith('.mdc')).sort();
  } catch { return []; }

  return files.map(filename => {
    const filePath = path.join(RULES_DIR, filename);
    let raw = '';
    try { raw = fs.readFileSync(filePath, 'utf8'); } catch { /* skip unreadable */ }
    const { meta, body } = parseFrontmatter(raw);
    const label = meta.description || filename.replace(/\.mdc$/, '');
    return {
      label,
      filename,
      sourcePath: tildeHome(filePath),
      content: body,
      exists: true,
    };
  });
}

register('cursor', { getSystemPrompts });
