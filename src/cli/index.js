import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';

const PORT = process.env.PORT || 3000;
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');

function isTmp(name) {
  return name === 'tmp' || name.endsWith('-tmp') || name.includes('tmp');
}

function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (!lines[0] || lines[0].trim() !== '---') return { meta: {}, body: content };
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { endIdx = i; break; }
  }
  if (endIdx === -1) return { meta: {}, body: content };
  const meta = {};
  for (const line of lines.slice(1, endIdx)) {
    const m = line.match(/^([\w-]+)\s*:\s*(.*)/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[m[1]] = val;
    }
  }
  return { meta, body: lines.slice(endIdx + 1).join('\n').trimStart() };
}

// Fast: uses only file stats, no content reading
async function getProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];

  const projects = [];
  for (const proj of fs.readdirSync(PROJECTS_DIR)) {
    if (isTmp(proj)) continue;
    const pPath = path.join(PROJECTS_DIR, proj);
    if (!fs.statSync(pPath).isDirectory()) continue;

    let files;
    try { files = fs.readdirSync(pPath).filter(f => f.endsWith('.jsonl')); }
    catch(e) { continue; }

    let lastUpdated = 0;
    for (const f of files) {
      const mtime = fs.statSync(path.join(pPath, f)).mtimeMs;
      if (mtime > lastUpdated) lastUpdated = mtime;
    }

    projects.push({ id: proj, fullPath: proj, sessionCount: files.length, lastUpdated });
  }

  return projects.sort((a, b) => b.lastUpdated - a.lastUpdated);
}

// Reads one project's JSONL files, returns paginated sessions with messages
async function getProjectSessions(project, page = 0, pageSize = 20) {
  const pPath = path.join(PROJECTS_DIR, project);
  if (!fs.existsSync(pPath) || !fs.statSync(pPath).isDirectory()) {
    return { data: [], total: 0 };
  }

  let files;
  try { files = fs.readdirSync(pPath).filter(f => f.endsWith('.jsonl')); }
  catch(e) { return { data: [], total: 0 }; }

  const sessions = [];
  for (const f of files) {
    const sessionId = f.replace('.jsonl', '');
    const filePath = path.join(pPath, f);
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const messages = [];
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        const tstamp = new Date(parsed.timestamp).getTime();
        if (parsed.type === 'user') {
          messages.push({ role: 'user', content: parsed.message.content, timestamp: tstamp || 0 });
        } else if (parsed.type === 'assistant') {
          messages.push({ role: 'assistant', content: parsed.message.content, timestamp: tstamp || 0 });
        } else if (parsed.type === 'attachment') {
          messages.push({ role: 'system_attachment', content: parsed.attachment, timestamp: tstamp || 0 });
        } else if (parsed.type === 'system') {
          messages.push({ role: 'system', content: parsed.content, timestamp: tstamp || 0 });
        }
      } catch(e) {}
    }

    if (messages.length > 0) {
      sessions.push({
        id: sessionId,
        project,
        lastUpdated: messages[messages.length - 1].timestamp || 0,
        messages
      });
    }
  }

  sessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
  const total = sessions.length;
  const data = sessions.slice(page * pageSize, (page + 1) * pageSize);
  return { data, total };
}

// Reads all JSONL files, sorts by timestamp desc, returns one page
async function getLogs(page = 0, pageSize = 10) {
  if (!fs.existsSync(PROJECTS_DIR)) return { data: [], total: 0 };

  const logs = [];
  for (const proj of fs.readdirSync(PROJECTS_DIR)) {
    if (isTmp(proj)) continue;
    const pPath = path.join(PROJECTS_DIR, proj);
    if (!fs.statSync(pPath).isDirectory()) continue;

    let files;
    try { files = fs.readdirSync(pPath).filter(f => f.endsWith('.jsonl')); }
    catch(e) { continue; }

    for (const f of files) {
      const sessionId = f.replace('.jsonl', '');
      const filePath = path.join(pPath, f);
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      let lineNumber = 0;
      for await (const line of rl) {
        lineNumber++;
        if (!line.trim()) continue;
        try {
          const raw = JSON.parse(line);
          logs.push({ project: proj, session: sessionId, lineNumber, raw });
        } catch(e) {}
      }
    }
  }

  logs.sort((a, b) => {
    const ta = typeof a.raw.timestamp === 'string' ? new Date(a.raw.timestamp).getTime() : 0;
    const tb = typeof b.raw.timestamp === 'string' ? new Date(b.raw.timestamp).getTime() : 0;
    return tb - ta;
  });

  const total = logs.length;
  const data = logs.slice(page * pageSize, (page + 1) * pageSize);
  return { data, total };
}

async function getSkills() {
  if (!fs.existsSync(SKILLS_DIR)) return [];

  const skills = [];
  for (const entry of fs.readdirSync(SKILLS_DIR)) {
    const entryPath = path.join(SKILLS_DIR, entry);
    if (!fs.statSync(entryPath).isDirectory()) continue;

    const skillMdPath = path.join(entryPath, 'SKILL.md');
    let description = null;
    let hasSkillMd = false;

    if (fs.existsSync(skillMdPath)) {
      hasSkillMd = true;
      const content = fs.readFileSync(skillMdPath, 'utf8');
      const { meta, body } = parseFrontmatter(content);
      if (meta.description) {
        description = meta.description.slice(0, 200);
      } else {
        for (const line of body.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            description = trimmed.slice(0, 200);
            break;
          }
        }
      }
    }

    const name = entry.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    skills.push({ slug: entry, name, description, hasSkillMd });
  }

  return skills.sort((a, b) => a.slug.localeCompare(b.slug));
}

function parseQuery(url) {
  const u = new URL(url, 'http://localhost');
  return {
    pathname: u.pathname,
    get: (k, def) => u.searchParams.get(k) ?? def
  };
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const q = parseQuery(req.url);
  const ok = (payload) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: null, ...payload }));
  };
  const err = (msg) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: null, error: msg }));
  };

  if (req.method !== 'GET') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: null, error: 'Not Found' }));
    return;
  }

  if (q.pathname === '/api/health') {
    ok({ data: 'ok' });
    return;
  }

  if (q.pathname === '/api/skills') {
    const slug = q.get('slug', null);
    if (slug) {
      try {
        const entryPath = path.join(SKILLS_DIR, slug);
        const skillMdPath = path.join(entryPath, 'SKILL.md');
        const hasSkillMd = fs.existsSync(skillMdPath);
        const name = slug.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        let frontmatter = {};
        let body = null;
        if (hasSkillMd) {
          const content = fs.readFileSync(skillMdPath, 'utf8');
          const parsed = parseFrontmatter(content);
          frontmatter = parsed.meta;
          body = parsed.body;
        }
        ok({ data: { slug, name, hasSkillMd, frontmatter, body } });
      } catch(e) { err(e.message); }
      return;
    }
    try { ok({ data: await getSkills() }); }
    catch(e) { err(e.message); }
    return;
  }

  if (q.pathname === '/api/projects') {
    try { ok({ data: await getProjects() }); }
    catch(e) { err(e.message); }
    return;
  }

  if (q.pathname === '/api/history') {
    const project = q.get('project', null);
    if (!project) { err('project param required'); return; }
    const page = Math.max(0, parseInt(q.get('page', '0')));
    const pageSize = Math.max(1, parseInt(q.get('pageSize', '20')));
    try {
      const { data, total } = await getProjectSessions(project, page, pageSize);
      ok({ data, total, page, pageSize });
    } catch(e) { err(e.message); }
    return;
  }

  if (q.pathname === '/api/logs') {
    const page = Math.max(0, parseInt(q.get('page', '0')));
    const pageSize = Math.max(1, parseInt(q.get('pageSize', '10')));
    try {
      const { data, total } = await getLogs(page, pageSize);
      ok({ data, total, page, pageSize });
    } catch(e) { err(e.message); }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ data: null, error: 'Not Found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Claude Lens CLI backend running on http://127.0.0.1:${PORT}`);
});
