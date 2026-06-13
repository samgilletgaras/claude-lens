import fs from 'fs';
import path from 'path';
import { CLAUDE_DIR, tildeHome } from '../../utils.js';
import { register } from '../system-prompts.js';

function readEntry(filePath, label) {
  const sourcePath = tildeHome(filePath);
  const exists = fs.existsSync(filePath);
  return {
    label,
    filename: path.basename(filePath),
    sourcePath,
    content: exists ? fs.readFileSync(filePath, 'utf8') : '',
    exists,
  };
}

async function getSystemPrompts() {
  return [
    readEntry(path.join(CLAUDE_DIR, 'CLAUDE.md'), 'Global instructions (CLAUDE.md)'),
  ];
}

register('claude', { getSystemPrompts });
