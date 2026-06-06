import { CACHE_TTL } from '../../utils.js';
import { scanWorkspaces, streamJsonl } from './ghcopilot-vscode-sessions.js';
import { register } from '../logs.js';

let _cache = null, _cacheTime = 0;

export async function getLogs(page = 0, pageSize = 10) {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL)
    return { data: _cache.slice(page * pageSize, (page + 1) * pageSize), total: _cache.length };

  const logs = [];
  for (const [project, { files }] of scanWorkspaces()) {
    for (const [sessionId, fileInfo] of files) {
      let lineNumber = 0;
      try {
        await streamJsonl(fileInfo.filePath, event => {
          lineNumber++;
          logs.push({ project, session: sessionId, lineNumber, raw: event });
        });
      } catch { /* skip broken files */ }
    }
  }

  logs.sort((a, b) => {
    const ta = a.raw.timestamp ? new Date(a.raw.timestamp).getTime() : 0;
    const tb = b.raw.timestamp ? new Date(b.raw.timestamp).getTime() : 0;
    return tb - ta;
  });

  _cache = logs;
  _cacheTime = now;
  return { data: logs.slice(page * pageSize, (page + 1) * pageSize), total: logs.length };
}

register('ghcopilot-vscode', { getLogs });
