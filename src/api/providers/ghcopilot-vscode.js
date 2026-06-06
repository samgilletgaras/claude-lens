import fs from 'fs';
import { getCandidateDirs } from '../readers/ghcopilot-vscode/ghcopilot-vscode-sessions.js';
import '../readers/ghcopilot-vscode/ghcopilot-vscode-stats.js';
import '../readers/ghcopilot-vscode/ghcopilot-vscode-logs.js';
import '../readers/ghcopilot-vscode/ghcopilot-vscode-mcps.js';
import '../readers/ghcopilot-vscode/ghcopilot-vscode-agents.js';
import '../readers/ghcopilot-vscode/ghcopilot-vscode-skills.js';

export const name = 'GitHub Copilot (VS Code)';
export const capabilities = {
  hasHistory: true, hasStats: true, hasLogs: true, hasSkills: true,
  hasAgents: true, hasMcps: true, hasMemory: false, hasPlans: false,
};

export async function isAvailable() {
  for (const wsDir of getCandidateDirs()) {
    let entries;
    try { entries = fs.readdirSync(wsDir, { withFileTypes: true }); }
    catch { continue; }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const tDir = `${wsDir}/${entry.name}/GitHub.copilot-chat/transcripts`;
      try { if (fs.statSync(tDir).isDirectory()) return true; }
      catch { /* not found */ }
    }
  }
  return false;
}
