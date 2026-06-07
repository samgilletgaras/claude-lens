import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { CURSOR_PROJECTS_DIR, CACHE_TTL, isTmp } from '../../utils.js';
import { register } from '../stats.js';

let _statsCache = null, _statsCacheTs = 0;

async function globalStats() {
  const now = Date.now();
  if (_statsCache && now - _statsCacheTs < CACHE_TTL) return _statsCache;

  const empty = {
    totals: { sessions: 0, messages: 0, toolCalls: 0 },
    tokens: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0, cacheHitRate: 0 },
    stopReasons: {}, models: {},
    hooks: { success: 0, failure: 0, avgDurationMs: 0 },
    topProjects: [], activity: {}, estimatedCostUsd: 0,
  };
  if (!fs.existsSync(CURSOR_PROJECTS_DIR)) return empty;

  let sessions = 0, messages = 0, toolCalls = 0, inputChars = 0, outputChars = 0;
  const toolCounts = {}, activityByDay = {}, projectStats = {};

  for (const projEntry of fs.readdirSync(CURSOR_PROJECTS_DIR, { withFileTypes: true })) {
    if (!projEntry.isDirectory() || isTmp(projEntry.name)) continue;
    const proj = projEntry.name;
    const transcriptsDir = path.join(CURSOR_PROJECTS_DIR, proj, 'agent-transcripts');
    if (!fs.existsSync(transcriptsDir)) continue;

    let projMessages = 0;
    for (const uuidEntry of fs.readdirSync(transcriptsDir, { withFileTypes: true })) {
      if (!uuidEntry.isDirectory()) continue;
      const jsonlPath = path.join(transcriptsDir, uuidEntry.name, `${uuidEntry.name}.jsonl`);
      if (!fs.existsSync(jsonlPath)) continue;
      sessions++;

      const mtime = fs.statSync(jsonlPath).mtimeMs;
      const day = new Date(mtime).toISOString().slice(0, 10);
      activityByDay[day] = (activityByDay[day] || 0) + 1;

      const rl = readline.createInterface({ input: fs.createReadStream(jsonlPath), crlfDelay: Infinity });
      for await (const line of rl) {
        if (!line.trim()) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        if (!msg.role || !msg.message?.content) continue;
        messages++;
        projMessages++;
        if (!Array.isArray(msg.message.content)) continue;
        for (const block of msg.message.content) {
          if (block?.type === 'tool_use' && typeof block.name === 'string') {
            toolCalls++;
            toolCounts[block.name] = (toolCounts[block.name] || 0) + 1;
          } else if (block?.type === 'text' && typeof block.text === 'string') {
            if (msg.role === 'user') inputChars += block.text.length;
            else outputChars += block.text.length;
          }
        }
      }
    }
    if (projMessages > 0) projectStats[proj] = projMessages;
  }

  const inputTokens = Math.round(inputChars / 4);
  const outputTokens = Math.round(outputChars / 4);

  const topTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const topProjects = Object.entries(projectStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, messageCount]) => ({ id, messageCount, tokenCount: 0 }));

  _statsCache = {
    totals: { sessions, messages, toolCalls, projects: Object.keys(projectStats).length },
    tokens: { input: inputTokens, output: outputTokens, cacheRead: 0, cacheCreation: 0, cacheHitRate: 0, inputEstimated: true, outputEstimated: true },
    stopReasons: {}, models: {},
    hooks: { success: 0, failure: 0, avgDurationMs: 0 },
    topTools,
    topProjects,
    activity: activityByDay,
    estimatedCostUsd: 0,
  };
  _statsCacheTs = now;
  return _statsCache;
}

async function projectStats(project) {
  const transcriptsDir = path.join(CURSOR_PROJECTS_DIR, project, 'agent-transcripts');
  if (!fs.existsSync(transcriptsDir)) return null;

  let sessions = 0, messages = 0, toolCalls = 0, inputChars = 0, outputChars = 0;
  const toolCounts = {}, activityByDay = {};

  for (const uuidEntry of fs.readdirSync(transcriptsDir, { withFileTypes: true })) {
    if (!uuidEntry.isDirectory()) continue;
    const jsonlPath = path.join(transcriptsDir, uuidEntry.name, `${uuidEntry.name}.jsonl`);
    if (!fs.existsSync(jsonlPath)) continue;
    sessions++;

    const mtime = fs.statSync(jsonlPath).mtimeMs;
    const day = new Date(mtime).toISOString().slice(0, 10);
    activityByDay[day] = (activityByDay[day] || 0) + 1;

    const rl = readline.createInterface({ input: fs.createReadStream(jsonlPath), crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line.trim()) continue;
      let msg;
      try { msg = JSON.parse(line); } catch { continue; }
      if (!msg.role || !msg.message?.content) continue;
      messages++;
      if (!Array.isArray(msg.message.content)) continue;
      for (const block of msg.message.content) {
        if (block?.type === 'tool_use' && typeof block.name === 'string') {
          toolCalls++;
          toolCounts[block.name] = (toolCounts[block.name] || 0) + 1;
        } else if (block?.type === 'text' && typeof block.text === 'string') {
          if (msg.role === 'user') inputChars += block.text.length;
          else outputChars += block.text.length;
        }
      }
    }
  }

  const topTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const inputTokens = Math.round(inputChars / 4);
  const outputTokens = Math.round(outputChars / 4);

  return {
    totals: { sessions, messages, toolCalls },
    tokens: { input: inputTokens, output: outputTokens, cacheRead: 0, cacheCreation: 0, cacheHitRate: 0, inputEstimated: true, outputEstimated: true },
    stopReasons: {}, models: {},
    hooks: { success: 0, failure: 0, avgDurationMs: 0 },
    topTools,
    topProjects: [],
    activity: activityByDay,
    estimatedCostUsd: 0,
  };
}

async function getStats(project = null) {
  return project ? projectStats(project) : globalStats();
}

register('cursor', { getStats });
