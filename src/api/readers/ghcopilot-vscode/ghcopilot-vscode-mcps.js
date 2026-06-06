import fs from 'fs';
import path from 'path';
import os from 'os';
import { CACHE_TTL } from '../../utils.js';
import { scanWorkspaces } from './ghcopilot-vscode-sessions.js';
import { register } from '../mcps.js';

// Global MCP config: ~/.config/Code/User/mcp.json
const GLOBAL_MCP_PATH = path.join(os.homedir(), '.config', 'Code', 'User', 'mcp.json');

let _cache = null, _cacheTime = 0;

function readGlobalServers() {
  let raw;
  try { raw = JSON.parse(fs.readFileSync(GLOBAL_MCP_PATH, 'utf8')); } catch { return []; }
  const mcpServers = raw?.servers;
  if (!mcpServers || typeof mcpServers !== 'object') return [];
  return Object.entries(mcpServers).map(([name, cfg]) => ({
    id: `global:${name}`,
    name,
    type: 'plugin',
    config: { command: cfg.command ?? null, args: cfg.args ?? null, url: cfg.url ?? null },
    source: GLOBAL_MCP_PATH,
    toolCount: 0, totalCalls: 0, lastUsed: null,
  }));
}

function readWorkspaceServers() {
  const servers = [];
  for (const [folderPath] of scanWorkspaces()) {
    const mcpJsonPath = path.join(folderPath, '.vscode', 'mcp.json');
    let raw;
    try { raw = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8')); } catch { continue; }
    const mcpServers = raw?.servers;
    if (!mcpServers || typeof mcpServers !== 'object') continue;
    const wsName = path.basename(folderPath);
    for (const [name, cfg] of Object.entries(mcpServers)) {
      if (typeof cfg !== 'object' || !cfg) continue;
      servers.push({
        id: `workspace:${wsName}:${name}`,
        name,
        type: 'cloud',
        config: { command: cfg.command ?? null, args: cfg.args ?? null, url: cfg.url ?? null },
        source: mcpJsonPath,
        toolCount: 0, totalCalls: 0, lastUsed: null,
      });
    }
  }
  return servers;
}

export async function getMcps(serverId = null) {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL) {
    if (serverId) return _cache.find(s => s.id === serverId) ?? null;
    return _cache;
  }

  const all = [...readGlobalServers(), ...readWorkspaceServers()];
  all.sort((a, b) => a.name.localeCompare(b.name));
  _cache = all;
  _cacheTime = now;

  if (serverId) {
    const found = all.find(s => s.id === serverId) ?? null;
    return found ? { ...found, tools: [] } : null;
  }
  return all;
}

register('ghcopilot-vscode', { getMcps });
