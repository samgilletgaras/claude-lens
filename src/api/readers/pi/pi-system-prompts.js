import fs from 'fs';
import path from 'path';
import { PI_AGENT_DIR, tildeHome } from '../../utils.js';
import { register } from '../system-prompts.js';

const ENTRIES = [
  { filename: 'AGENTS.md',        label: 'Global instructions (AGENTS.md)' },
  { filename: 'SYSTEM.md',        label: 'Custom system prompt (SYSTEM.md)' },
  { filename: 'APPEND_SYSTEM.md', label: 'Appended system prompt (APPEND_SYSTEM.md)' },
];

function readEntry({ filename, label }) {
  const filePath = path.join(PI_AGENT_DIR, filename);
  // fs.existsSync and readFileSync both follow symlinks automatically
  const exists = fs.existsSync(filePath);
  return {
    label,
    filename,
    sourcePath: tildeHome(filePath),
    content: exists ? fs.readFileSync(filePath, 'utf8') : '',
    exists,
  };
}

async function getSystemPrompts() {
  return ENTRIES.map(readEntry).filter(e => e.exists);
}

register('pi', { getSystemPrompts });
