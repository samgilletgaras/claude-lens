import fs from 'fs';
import path from 'path';
import os from 'os';
import { tildeHome } from '../../utils.js';
import { register } from '../system-prompts.js';

const INSTRUCTIONS_FILE = path.join(os.homedir(), '.copilot', 'copilot-instructions.md');

async function getSystemPrompts() {
  const exists = fs.existsSync(INSTRUCTIONS_FILE);
  return [{
    label: 'Global instructions (copilot-instructions.md)',
    filename: 'copilot-instructions.md',
    sourcePath: tildeHome(INSTRUCTIONS_FILE),
    content: exists ? fs.readFileSync(INSTRUCTIONS_FILE, 'utf8') : '',
    exists,
  }];
}

register('ghcopilot-cli', { getSystemPrompts });
