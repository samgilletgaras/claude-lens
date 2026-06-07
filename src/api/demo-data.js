const NOW = 1780099200000; // 2026-05-30 00:00:00 UTC
const DAY = 86400000;
const HOUR = 3600000;
const MIN = 60000;

// Claude sessions
const S1 = NOW - 2 * DAY + 14 * HOUR;  // May 28 14:00 — JWT bug
const S2 = NOW - 7 * DAY + 10 * HOUR;  // May 23 10:00 — dark mode
const S3 = NOW - 21 * DAY + 9 * HOUR;  // May 9  09:00 — CI setup
const S4 = NOW - 5 * DAY + 15 * HOUR;  // May 25 15:00 — Q1 analysis
const S5 = NOW - 14 * DAY + 11 * HOUR; // May 16 11:00 — ETL script

// Cursor sessions
const S6 = NOW - 1 * DAY + 16 * HOUR;  // May 29 16:00 — cursor ai-lens session
const S7 = NOW - 3 * DAY + 11 * HOUR;  // May 27 11:00 — cursor ai-lens session 2
const S8 = NOW - 4 * DAY + 14 * HOUR;  // May 26 14:00 — cursor react-dashboard

const SID1 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const SID2 = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const SID3 = 'c3d4e5f6-a7b8-9012-cdef-012345678902';
const SID4 = 'd4e5f6a7-b8c9-0123-def0-123456789003';
const SID5 = 'e5f6a7b8-c9d0-1234-ef01-234567890004';
const SID6 = 'f6a7b8c9-d0e1-2345-f012-345678901005';
const SID7 = 'a7b8c9d0-e1f2-3456-0123-456789012006';
const SID8 = 'b8c9d0e1-f2a3-4567-1234-567890123007';

export const DEMO_PROJECTS = [
  { id: 'claude:::-home-demo-myapp', fullPath: '/home/demo/myapp', sessionCount: 3, lastUpdated: S1 + 2 * HOUR, provider: 'claude' },
  { id: 'claude:::-home-demo-data-pipeline', fullPath: '/home/demo/data-pipeline', sessionCount: 2, lastUpdated: S4 + 2 * HOUR, provider: 'claude' },
  { id: 'cursor:::-home-demo-ai-lens', fullPath: '/home/demo/ai-lens', sessionCount: 2, lastUpdated: S6 + HOUR, provider: 'cursor' },
  { id: 'cursor:::-home-demo-react-dashboard', fullPath: '/home/demo/react-dashboard', sessionCount: 1, lastUpdated: S8 + 2 * HOUR, provider: 'cursor' },
];

export const DEMO_SESSIONS = {
  'claude:::-home-demo-myapp': [
    { id: SID1, project: 'claude:::-home-demo-myapp', lastUpdated: S1 + 2 * HOUR, firstMessageTs: S1, preview: "There's a bug in the JWT authentication middleware — tokens aren't being validated correctly", tokens: { input: 287400, output: 41200, cacheRead: 423000, cacheCreation: 78000 }, turnCount: 9, provider: 'claude' },
    { id: SID2, project: 'claude:::-home-demo-myapp', lastUpdated: S2 + HOUR, firstMessageTs: S2, preview: 'Add a dark mode toggle to the settings page', tokens: { input: 143200, output: 21800, cacheRead: 224000, cacheCreation: 39000 }, turnCount: 5, provider: 'claude' },
    { id: SID3, project: 'claude:::-home-demo-myapp', lastUpdated: S3 + 30 * MIN, firstMessageTs: S3, preview: 'Set up GitHub Actions CI pipeline for automated testing and deployments', tokens: { input: 92800, output: 11200, cacheRead: 165000, cacheCreation: 26000 }, turnCount: 3, provider: 'claude' },
  ],
  'claude:::-home-demo-data-pipeline': [
    { id: SID4, project: 'claude:::-home-demo-data-pipeline', lastUpdated: S4 + 2 * HOUR, firstMessageTs: S4, preview: 'Analyze Q1 2026 sales data and generate an executive summary report', tokens: { input: 198300, output: 29400, cacheRead: 251000, cacheCreation: 41000 }, turnCount: 7, provider: 'claude' },
    { id: SID5, project: 'claude:::-home-demo-data-pipeline', lastUpdated: S5 + HOUR, firstMessageTs: S5, preview: 'Write an ETL script to clean and normalize the customer dataset', tokens: { input: 170750, output: 21230, cacheRead: 180500, cacheCreation: 26000 }, turnCount: 5, provider: 'claude' },
  ],
  'cursor:::-home-demo-ai-lens': [
    { id: SID6, project: 'cursor:::-home-demo-ai-lens', lastUpdated: S6 + HOUR, firstMessageTs: S6, preview: 'Tool results are not rendering inline in the session viewer — they collapse instead of showing content', tokens: null, turnCount: 6, provider: 'cursor' },
    { id: SID7, project: 'cursor:::-home-demo-ai-lens', lastUpdated: S7 + 45 * MIN, firstMessageTs: S7, preview: 'Add stats aggregation for the Cursor provider — count sessions messages and tool calls from transcripts', tokens: null, turnCount: 4, provider: 'cursor' },
  ],
  'cursor:::-home-demo-react-dashboard': [
    { id: SID8, project: 'cursor:::-home-demo-react-dashboard', lastUpdated: S8 + 2 * HOUR, firstMessageTs: S8, preview: 'Build a sales metrics dashboard with bar charts and trend indicators for each region', tokens: null, turnCount: 5, provider: 'cursor' },
  ],
};

export const DEMO_MESSAGES = {
  [SID1]: [
    { role: 'user', content: "There's a bug in the JWT authentication middleware. Tokens are being accepted even when they've expired. Can you help me fix it?", timestamp: S1 },
    { role: 'assistant', content: [{ type: 'text', text: "Sure, let me look at the auth middleware." }, { type: 'tool_use', id: 'tu1', name: 'Read', input: { file_path: '/home/demo/myapp/src/auth/middleware.ts' } }], timestamp: S1 + 30 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu1', content: "import jwt from 'jsonwebtoken';\nimport type { Request, Response, NextFunction } from 'express';\n\nconst SECRET = process.env.JWT_SECRET!;\n\nexport function authenticate(req: Request, res: Response, next: NextFunction) {\n  const token = req.headers.authorization?.replace('Bearer ', '');\n  if (!token) return res.status(401).json({ error: 'No token' });\n  try {\n    const decoded = jwt.verify(token, SECRET, { ignoreExpiration: true });\n    req.user = decoded;\n    next();\n  } catch (err) {\n    return res.status(401).json({ error: 'Invalid token' });\n  }\n}" }], timestamp: S1 + 31 * MIN },
    { role: 'assistant', content: [{ type: 'text', text: "Found it. Line 10 passes `{ ignoreExpiration: true }` — that's why expired tokens are accepted. Removing that option will make `jwt.verify()` enforce the `exp` claim." }, { type: 'tool_use', id: 'tu2', name: 'Edit', input: { file_path: '/home/demo/myapp/src/auth/middleware.ts', old_string: '    const decoded = jwt.verify(token, SECRET, { ignoreExpiration: true });', new_string: '    const decoded = jwt.verify(token, SECRET);' } }], timestamp: S1 + 45 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu2', content: '' }], timestamp: S1 + 46 * MIN },
    { role: 'assistant', content: [{ type: 'text', text: "Fix applied. Let me run the auth tests." }, { type: 'tool_use', id: 'tu3', name: 'Bash', input: { command: 'npm test -- --testPathPattern=auth' } }], timestamp: S1 + 50 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu3', content: "FAIL src/auth/middleware.test.ts\n  JWT Middleware\n    ✓ should reject requests with no token (8ms)\n    ✗ should reject expired tokens (12ms)\n\n  ● should reject expired tokens\n    Expected status: 401\n    Received:        200\n\nTests: 1 failed, 1 passed", is_error: true }], timestamp: S1 + 55 * MIN },
    { role: 'system_attachment', content: { type: 'hook_event', hookName: 'PostToolUse', hookEvent: 'PostToolUse', command: 'npm test -- --testPathPattern=auth', exitCode: 1, durationMs: 3241 }, timestamp: S1 + 56 * MIN },
    { role: 'assistant', content: [{ type: 'text', text: "Test still failing — likely a fixture issue. Let me check the test." }, { type: 'tool_use', id: 'tu4', name: 'Read', input: { file_path: '/home/demo/myapp/src/auth/middleware.test.ts' } }], timestamp: S1 + 60 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu4', content: "import jwt from 'jsonwebtoken';\nimport { authenticate } from './middleware';\n\ndescribe('JWT Middleware', () => {\n  it('should reject expired tokens', () => {\n    // BUG: notBefore is set to 1h in the future\n    const token = jwt.sign({ sub: 'user1' }, 'test-secret', {\n      expiresIn: '-1h',\n      notBefore: '1h',\n    });\n    // ...\n  });\n});" }], timestamp: S1 + 61 * MIN },
    { role: 'assistant', content: [{ type: 'text', text: "The test fixture has `notBefore: '1h'` which causes a `NotBeforeError` before expiration is even checked. Removing it." }, { type: 'tool_use', id: 'tu5', name: 'Edit', input: { file_path: '/home/demo/myapp/src/auth/middleware.test.ts', old_string: "      expiresIn: '-1h',\n      notBefore: '1h',", new_string: "      expiresIn: '-1h'," } }], timestamp: S1 + 75 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu5', content: '' }], timestamp: S1 + 76 * MIN },
    { role: 'assistant', content: [{ type: 'tool_use', id: 'tu6', name: 'Bash', input: { command: 'npm test -- --testPathPattern=auth' } }], timestamp: S1 + 80 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu6', content: "PASS src/auth/middleware.test.ts\n  JWT Middleware\n    ✓ should reject requests with no token (7ms)\n    ✓ should reject expired tokens (11ms)\n    ✓ should accept valid tokens (9ms)\n\nTests: 3 passed, 3 total\nTime: 1.842s" }], timestamp: S1 + 85 * MIN },
    { role: 'assistant', content: "All tests passing.\n\n**Root cause**: `jwt.verify()` was called with `{ ignoreExpiration: true }`, silently accepting expired tokens.\n\n**Fix**: Removed the option — JWT expiration is now enforced by default.\n\n**Test fix**: The fixture had `notBefore: '1h'` causing an unrelated error that masked the real assertion.", timestamp: S1 + 90 * MIN },
  ],

  [SID2]: [
    { role: 'user', content: 'Add a dark mode toggle to the settings page. It should persist across sessions using localStorage.', timestamp: S2 },
    { role: 'assistant', content: [{ type: 'text', text: "I'll add a dark mode toggle with localStorage persistence. Let me look at the settings page first." }, { type: 'tool_use', id: 'tu7', name: 'Read', input: { file_path: '/home/demo/myapp/src/pages/Settings.tsx' } }], timestamp: S2 + 10 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu7', content: "export function Settings() {\n  return (\n    <div className=\"p-8\">\n      <h1 className=\"text-2xl font-bold mb-6\">Settings</h1>\n      <p className=\"text-gray-500\">No settings configured yet.</p>\n    </div>\n  );\n}" }], timestamp: S2 + 11 * MIN },
    { role: 'assistant', content: [{ type: 'tool_use', id: 'tu8', name: 'Write', input: { file_path: '/home/demo/myapp/src/pages/Settings.tsx', content: "import { useState, useEffect } from 'react';\n\nexport function Settings() {\n  const [darkMode, setDarkMode] = useState(\n    () => localStorage.getItem('theme') === 'dark'\n  );\n\n  useEffect(() => {\n    document.documentElement.classList.toggle('dark', darkMode);\n    localStorage.setItem('theme', darkMode ? 'dark' : 'light');\n  }, [darkMode]);\n\n  return (\n    <div className=\"p-8\">\n      <h1 className=\"text-2xl font-bold mb-6\">Settings</h1>\n      <div className=\"flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border\">\n        <div>\n          <div className=\"font-medium\">Dark Mode</div>\n          <div className=\"text-sm text-gray-500\">Use dark color scheme</div>\n        </div>\n        <button onClick={() => setDarkMode(d => !d)}\n          className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>\n          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-5' : ''}`} />\n        </button>\n      </div>\n    </div>\n  );\n}" } }], timestamp: S2 + 25 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu8', content: '' }], timestamp: S2 + 26 * MIN },
    { role: 'assistant', content: "Done. The dark mode toggle reads from `localStorage` on mount and syncs back on every change.", timestamp: S2 + 30 * MIN },
  ],

  [SID3]: [
    { role: 'user', content: 'Set up a GitHub Actions CI pipeline. Tests on every PR, deploy to staging on main branch merges.', timestamp: S3 },
    { role: 'assistant', content: [{ type: 'text', text: "I'll create two workflows." }, { type: 'tool_use', id: 'tu9', name: 'Write', input: { file_path: '/home/demo/myapp/.github/workflows/ci.yml', content: "name: CI\non:\n  pull_request:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '20'\n          cache: 'npm'\n      - run: npm ci\n      - run: npm test\n      - run: npm run lint" } }], timestamp: S3 + 10 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu9', content: '' }], timestamp: S3 + 11 * MIN },
    { role: 'assistant', content: [{ type: 'tool_use', id: 'tu10', name: 'Write', input: { file_path: '/home/demo/myapp/.github/workflows/deploy-staging.yml', content: "name: Deploy to Staging\non:\n  push:\n    branches: [main]\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '20'\n          cache: 'npm'\n      - run: npm ci && npm run build\n      - run: npx wrangler deploy\n        env:\n          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}" } }], timestamp: S3 + 15 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu10', content: '' }], timestamp: S3 + 16 * MIN },
    { role: 'assistant', content: "Both workflows created:\n\n- **ci.yml** — runs on every PR: installs deps, tests, lint\n- **deploy-staging.yml** — runs on main push: builds and deploys via Wrangler\n\nAdd `CLOUDFLARE_API_TOKEN` to your repo secrets.", timestamp: S3 + 25 * MIN },
  ],

  [SID4]: [
    { role: 'user', content: 'Analyze the Q1 2026 sales data from Snowflake. Table is `sales.transactions` with columns: date, product_id, revenue, region, rep_id. Generate an executive summary.', timestamp: S4 },
    { role: 'assistant', content: [{ type: 'text', text: "I'll query the data and build the analysis." }, { type: 'tool_use', id: 'tu11', name: 'Bash', input: { command: "python scripts/query_snowflake.py --query \"SELECT COUNT(*), MIN(date), MAX(date), SUM(revenue) FROM sales.transactions WHERE date >= '2026-01-01' AND date < '2026-04-01'\"" } }], timestamp: S4 + 5 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu11', content: "count  | min_date   | max_date   | sum_revenue\n-------|------------|------------|------------\n48293  | 2026-01-02 | 2026-03-31 | 3847291.42" }], timestamp: S4 + 8 * MIN },
    { role: 'assistant', content: [{ type: 'text', text: "48k transactions, ~$3.85M in Q1. Now by region." }, { type: 'tool_use', id: 'tu12', name: 'Bash', input: { command: "python scripts/query_snowflake.py --query \"SELECT region, SUM(revenue) as revenue, COUNT(*) as txns FROM sales.transactions WHERE date >= '2026-01-01' AND date < '2026-04-01' GROUP BY region ORDER BY revenue DESC\"" } }], timestamp: S4 + 15 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu12', content: "region    | revenue     | txns\n----------|-------------|------\nAPAC      | 1243847.18  | 15821\nEMEA      | 1089234.67  | 13402\nAMER      | 982741.23   | 12847\nLATAM     | 531468.34   | 6223" }], timestamp: S4 + 18 * MIN },
    { role: 'assistant', content: [{ type: 'text', text: "APAC leads at 32%. Let me get month-over-month trend." }, { type: 'tool_use', id: 'tu13', name: 'Bash', input: { command: "python scripts/query_snowflake.py --query \"SELECT DATE_TRUNC('month', date) as month, SUM(revenue) FROM sales.transactions WHERE date >= '2026-01-01' AND date < '2026-04-01' GROUP BY 1 ORDER BY 1\"" } }], timestamp: S4 + 25 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu13', content: "month      | sum_revenue\n-----------|------------\n2026-01-01 | 1124783.21\n2026-02-01 | 1287634.89\n2026-03-01 | 1434873.32" }], timestamp: S4 + 28 * MIN },
    { role: 'assistant', content: [{ type: 'text', text: "Strong growth: +14.5% Jan→Feb, +11.4% Feb→Mar. Writing the summary." }, { type: 'tool_use', id: 'tu14', name: 'Write', input: { file_path: '/home/demo/data-pipeline/reports/q1-2026-executive-summary.md', content: "# Q1 2026 Sales Executive Summary\n\n**Total Revenue**: $3,847,291 | **Transactions**: 48,293\n\n## Revenue by Region\n| Region | Revenue | Share |\n|--------|---------|-------|\n| APAC | $1,243,847 | 32% |\n| EMEA | $1,089,235 | 28% |\n| AMER | $982,741 | 26% |\n| LATAM | $531,468 | 14% |\n\n## Monthly Growth\n| Month | Revenue | MoM |\n|-------|---------|-----|\n| January | $1,124,783 | — |\n| February | $1,287,635 | +14.5% |\n| March | $1,434,873 | +11.4% |" } }], timestamp: S4 + 40 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu14', content: '' }], timestamp: S4 + 41 * MIN },
    { role: 'assistant', content: "Report saved. Key takeaway: strong quarter, consistent growth, APAC leading. If March's pace holds, Q2 should exceed $5M.", timestamp: S4 + 45 * MIN },
  ],

  [SID5]: [
    { role: 'user', content: 'Write an ETL script to clean and normalize our customer CSV. Columns: customer_id, name, email, phone, signup_date, country. Issues: inconsistent phone formats, duplicates, null emails.', timestamp: S5 },
    { role: 'assistant', content: [{ type: 'text', text: "I'll write a polars-based ETL. Let me check the raw data first." }, { type: 'tool_use', id: 'tu15', name: 'Bash', input: { command: 'head -5 data/raw/customers.csv && wc -l data/raw/customers.csv' } }], timestamp: S5 + 5 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu15', content: "customer_id,name,email,phone,signup_date,country\n1001,Alice Johnson,alice@example.com,+1 (415) 555-0123,2024-03-15,US\n1002,Bob Smith,,415.555.0124,2024-03-15,US\n1003,Bob Smith,,415.555.0124,2024-03-15,US\n1004,Carlos Mendez,carlos@example.com,+52-55-1234-5678,2024-04-01,MX\n---\n24817 data/raw/customers.csv" }], timestamp: S5 + 6 * MIN },
    { role: 'assistant', content: [{ type: 'text', text: "I can see duplicates (rows 1002/1003), null emails, and inconsistent phone formats." }, { type: 'tool_use', id: 'tu16', name: 'Write', input: { file_path: '/home/demo/data-pipeline/scripts/clean_customers.py', content: "\"\"\"ETL: clean and normalize customers dataset.\"\"\"\nimport re\nimport polars as pl\n\nRAW = 'data/raw/customers.csv'\nOUT = 'data/processed/customers_clean.parquet'\n\ndef normalize_phone(phone):\n    if not phone:\n        return None\n    digits = re.sub(r'\\D', '', phone)\n    if len(digits) == 10:\n        return f'+1{digits}'\n    if len(digits) == 11 and digits.startswith('1'):\n        return f'+{digits}'\n    return f'+{digits}'\n\ndef run():\n    df = pl.read_csv(RAW, null_values=['', 'NULL'])\n    before = len(df)\n    df = df.with_columns(\n        pl.col('phone').map_elements(normalize_phone, return_dtype=pl.Utf8),\n        pl.col('signup_date').str.to_date('%Y-%m-%d', strict=False),\n    )\n    df = df.filter(pl.col('email').is_not_null())\n    df = df.unique(subset=['customer_id'])\n    after = len(df)\n    print(f'Cleaned: {before} → {after} rows ({before - after} removed)')\n    df.write_parquet(OUT)\n    print(f'Saved to {OUT}')\n\nif __name__ == '__main__':\n    run()" } }], timestamp: S5 + 20 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu16', content: '' }], timestamp: S5 + 21 * MIN },
    { role: 'assistant', content: [{ type: 'tool_use', id: 'tu17', name: 'Bash', input: { command: 'python scripts/clean_customers.py' } }], timestamp: S5 + 25 * MIN },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu17', content: "Cleaned: 24817 → 21493 rows (3324 removed)\nSaved to data/processed/customers_clean.parquet" }], timestamp: S5 + 28 * MIN },
    { role: 'assistant', content: "Done — removed 3,324 rows (duplicates + null emails). Phone numbers normalized to E.164. Output saved as Parquet.", timestamp: S5 + 30 * MIN },
  ],

  // Cursor sessions — no per-message timestamps (mirrors Cursor JSONL format)
  [SID6]: [
    { role: 'user', content: 'Tool results are not rendering inline in the session viewer — they collapse into a "1 result" badge instead of showing the content. The issue seems to be in how MessageBubble handles tool_result blocks.', timestamp: null },
    { role: 'assistant', content: [{ type: 'text', text: "Let me look at how MessageBubble handles tool result content." }, { type: 'tool_use', id: 'tc1', name: 'Read', input: { file_path: '/home/demo/ai-lens/src/web/src/components/MessageBubble.tsx' } }], timestamp: null },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tc1', content: "// ...component code...\nfunction ToolResultBlock({ block }: { block: ToolResultBlock }) {\n  const content = block.content;\n  if (!content || (Array.isArray(content) && content.length === 0)) {\n    return <span className=\"text-lens-text-faint italic\">empty result</span>;\n  }\n  if (Array.isArray(content) && content.length === 1) {\n    return <span className=\"text-lens-text-faint\">1 result</span>; // BUG: should render content\n  }\n  return <pre>{typeof content === 'string' ? content : JSON.stringify(content, null, 2)}</pre>;\n}" }], timestamp: null },
    { role: 'assistant', content: [{ type: 'text', text: "Found it — the single-element array branch returns a badge string instead of rendering the content. Fix:" }, { type: 'tool_use', id: 'tc2', name: 'Edit', input: { file_path: '/home/demo/ai-lens/src/web/src/components/MessageBubble.tsx', old_string: "  if (Array.isArray(content) && content.length === 1) {\n    return <span className=\"text-lens-text-faint\">1 result</span>; // BUG: should render content\n  }", new_string: "  if (Array.isArray(content) && content.length === 1) {\n    const item = content[0];\n    return <pre className=\"whitespace-pre-wrap\">{typeof item === 'string' ? item : item.text ?? JSON.stringify(item, null, 2)}</pre>;\n  }" } }], timestamp: null },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tc2', content: '' }], timestamp: null },
    { role: 'assistant', content: [{ type: 'text', text: "Fix applied. Let me verify no TypeScript errors." }, { type: 'tool_use', id: 'tc3', name: 'Shell', input: { command: 'cd /home/demo/ai-lens/src/web && npm run build 2>&1 | tail -5' } }], timestamp: null },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tc3', content: "vite v6.3.5 building for production...\n✓ 142 modules transformed.\ndist/index.html              0.46 kB\ndist/assets/index-BxKp1.js  284.31 kB\n✓ built in 2.14s" }], timestamp: null },
    { role: 'assistant', content: "Build clean. The fix unwraps the single-element array and renders the text content directly, whether it's a plain string or a `{ type: 'text', text: '...' }` block.", timestamp: null },
  ],

  [SID7]: [
    { role: 'user', content: 'Add stats aggregation for the Cursor provider. It should count sessions, messages, and tool calls from the transcript JSONL files. No token data since Cursor does not store it.', timestamp: null },
    { role: 'assistant', content: [{ type: 'text', text: "Let me read the existing claude-stats reader to understand the expected output shape, then implement cursor-stats." }, { type: 'tool_use', id: 'tc4', name: 'Read', input: { file_path: '/home/demo/ai-lens/src/api/readers/claude/claude-stats.js' } }], timestamp: null },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tc4', content: "// Returns: { totals: { sessions, messages, toolCalls }, tokens: {...}, models: {...}, hooks: {...}, topProjects: [...], activity: {...}, estimatedCostUsd }\nexport async function getStats(project = null) { /* ... */ }" }], timestamp: null },
    { role: 'assistant', content: [{ type: 'tool_use', id: 'tc5', name: 'Write', input: { file_path: '/home/demo/ai-lens/src/api/readers/cursor/cursor-stats.js', content: "import { CURSOR_PROJECTS_DIR } from '../../utils.js';\nimport fs from 'fs';\nimport path from 'path';\nimport readline from 'readline';\n\nexport async function getStats(project = null) {\n  const totals = { sessions: 0, messages: 0, toolCalls: 0 };\n  const activity = {};\n  const topProjectsMap = {};\n\n  const projectDirs = project\n    ? [path.join(CURSOR_PROJECTS_DIR, project)]\n    : fs.readdirSync(CURSOR_PROJECTS_DIR).map(d => path.join(CURSOR_PROJECTS_DIR, d));\n\n  for (const dir of projectDirs) {\n    const transcriptsDir = path.join(dir, 'agent-transcripts');\n    if (!fs.existsSync(transcriptsDir)) continue;\n    const projectId = path.basename(dir);\n    let projectMessages = 0, projectTools = 0;\n\n    for (const uuid of fs.readdirSync(transcriptsDir)) {\n      const file = path.join(transcriptsDir, uuid, `${uuid}.jsonl`);\n      if (!fs.existsSync(file)) continue;\n      totals.sessions++;\n      const mtime = fs.statSync(file).mtime;\n      const dateKey = mtime.toISOString().slice(0, 10);\n      activity[dateKey] = (activity[dateKey] || 0) + 1;\n\n      const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });\n      for await (const line of rl) {\n        if (!line.trim()) continue;\n        try {\n          const msg = JSON.parse(line);\n          totals.messages++; projectMessages++;\n          const content = msg.message?.content ?? [];\n          for (const block of (Array.isArray(content) ? content : [])) {\n            if (block.type === 'tool_use') { totals.toolCalls++; projectTools++; }\n          }\n        } catch { /* skip malformed lines */ }\n      }\n    }\n    if (projectMessages > 0) topProjectsMap[projectId] = { id: projectId, messageCount: projectMessages, tokenCount: 0 };\n  }\n\n  return {\n    totals,\n    tokens: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0, cacheHitRate: 0 },\n    models: {},\n    hooks: { success: 0, failure: 0, avgDurationMs: 0 },\n    topProjects: Object.values(topProjectsMap).sort((a, b) => b.messageCount - a.messageCount).slice(0, 5),\n    activity,\n    estimatedCostUsd: 0,\n  };\n}" } }], timestamp: null },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tc5', content: '' }], timestamp: null },
    { role: 'assistant', content: "Done. The reader derives all stats from the JSONL transcript files — session count from file existence, message/tool counts from line parsing, activity from file mtimes. Tokens and cost are explicitly 0 since Cursor doesn't log them.", timestamp: null },
  ],

  [SID8]: [
    { role: 'user', content: 'Build a sales metrics dashboard component. It needs a bar chart showing revenue by region, a trend line for month-over-month growth, and KPI cards at the top. Use Recharts and Tailwind.', timestamp: null },
    { role: 'assistant', content: [{ type: 'text', text: "I'll scaffold the dashboard. Let me check what data shape is available first." }, { type: 'tool_use', id: 'tc6', name: 'Read', input: { file_path: '/home/demo/react-dashboard/src/data/salesData.ts' } }], timestamp: null },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tc6', content: "export const regionRevenue = [\n  { region: 'APAC', revenue: 1243847 },\n  { region: 'EMEA', revenue: 1089235 },\n  { region: 'AMER', revenue: 982741 },\n  { region: 'LATAM', revenue: 531468 },\n];\n\nexport const monthlyTrend = [\n  { month: 'Jan', revenue: 1124783 },\n  { month: 'Feb', revenue: 1287635 },\n  { month: 'Mar', revenue: 1434873 },\n];" }], timestamp: null },
    { role: 'assistant', content: [{ type: 'tool_use', id: 'tc7', name: 'Write', input: { file_path: '/home/demo/react-dashboard/src/components/SalesDashboard.tsx', content: "import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';\nimport { regionRevenue, monthlyTrend } from '../data/salesData';\n\nconst fmt = (n: number) => `$${(n / 1_000_000).toFixed(2)}M`;\nconst total = regionRevenue.reduce((s, r) => s + r.revenue, 0);\nconst lastMoM = ((monthlyTrend[2].revenue - monthlyTrend[1].revenue) / monthlyTrend[1].revenue * 100).toFixed(1);\n\nexport function SalesDashboard() {\n  return (\n    <div className=\"p-6 space-y-6\">\n      <div className=\"grid grid-cols-3 gap-4\">\n        <div className=\"bg-white rounded-xl border p-4\">\n          <div className=\"text-sm text-gray-500\">Total Q1 Revenue</div>\n          <div className=\"text-2xl font-bold mt-1\">{fmt(total)}</div>\n        </div>\n        <div className=\"bg-white rounded-xl border p-4\">\n          <div className=\"text-sm text-gray-500\">Transactions</div>\n          <div className=\"text-2xl font-bold mt-1\">48,293</div>\n        </div>\n        <div className=\"bg-white rounded-xl border p-4\">\n          <div className=\"text-sm text-gray-500\">Mar MoM Growth</div>\n          <div className=\"text-2xl font-bold mt-1 text-green-600\">+{lastMoM}%</div>\n        </div>\n      </div>\n      <div className=\"grid grid-cols-2 gap-6\">\n        <div className=\"bg-white rounded-xl border p-4\">\n          <h3 className=\"text-sm font-medium text-gray-600 mb-3\">Revenue by Region</h3>\n          <ResponsiveContainer width=\"100%\" height={200}>\n            <BarChart data={regionRevenue}>\n              <XAxis dataKey=\"region\" tick={{ fontSize: 12 }} />\n              <YAxis tickFormatter={v => `$${(v/1e6).toFixed(1)}M`} tick={{ fontSize: 11 }} />\n              <Tooltip formatter={(v: number) => fmt(v)} />\n              <Bar dataKey=\"revenue\" fill=\"#6366f1\" radius={[4, 4, 0, 0]} />\n            </BarChart>\n          </ResponsiveContainer>\n        </div>\n        <div className=\"bg-white rounded-xl border p-4\">\n          <h3 className=\"text-sm font-medium text-gray-600 mb-3\">Monthly Trend</h3>\n          <ResponsiveContainer width=\"100%\" height={200}>\n            <LineChart data={monthlyTrend}>\n              <XAxis dataKey=\"month\" tick={{ fontSize: 12 }} />\n              <YAxis tickFormatter={v => `$${(v/1e6).toFixed(1)}M`} tick={{ fontSize: 11 }} />\n              <Tooltip formatter={(v: number) => fmt(v)} />\n              <Line type=\"monotone\" dataKey=\"revenue\" stroke=\"#6366f1\" strokeWidth={2} dot={{ r: 4 }} />\n            </LineChart>\n          </ResponsiveContainer>\n        </div>\n      </div>\n    </div>\n  );\n}" } }], timestamp: null },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tc7', content: '' }], timestamp: null },
    { role: 'assistant', content: "Dashboard built. Three KPI cards at the top, bar chart for regional breakdown, and a line chart for the monthly trend. The MoM calculation is live from the data array so it'll update automatically when new months land.", timestamp: null },
  ],
};

export const DEMO_SKILLS = [
  { slug: 'code-review', name: 'Code Review', description: 'Review code for correctness bugs and simplification opportunities. Pass --fix to apply suggestions automatically.', hasSkillMd: true, trigger: '/code-review', totalCalls: 34, lastUsed: NOW - 2 * DAY, providers: ['claude', 'cursor'] },
  { slug: 'react-dev', name: 'React Dev', description: 'React development assistant: component generation, hooks patterns, performance optimization, and Tailwind styling.', hasSkillMd: true, trigger: '/react-dev', totalCalls: 21, lastUsed: NOW - 3 * DAY, providers: ['claude', 'cursor'] },
  { slug: 'graphify', name: 'Graphify', description: 'Transform any input into a knowledge graph. Analyzes relationships and creates structured graph representations.', hasSkillMd: true, trigger: '/graphify', totalCalls: 8, lastUsed: NOW - 7 * DAY, providers: ['claude'] },
  { slug: 'frontend-design', name: 'Frontend Design', description: 'Create distinctive, production-grade frontend interfaces with high design quality. Avoids generic AI aesthetics.', hasSkillMd: true, trigger: '/frontend-design', totalCalls: 15, lastUsed: NOW - 1 * DAY, providers: ['cursor'] },
  { slug: 'bmad-dev-story', name: 'BMad Dev Story', description: 'Execute story implementation following a context-filled story spec file. Produces clean, working code that follows project conventions.', hasSkillMd: true, trigger: '/dev-story', totalCalls: 6, lastUsed: NOW - 5 * DAY, providers: ['cursor'] },
];

export const DEMO_SKILL_DETAIL = {
  'code-review': {
    slug: 'code-review', name: 'Code Review', hasSkillMd: true,
    frontmatter: { name: 'Code Review', description: 'Review the current diff for correctness bugs and reuse/simplification/efficiency cleanups', trigger: '/code-review' },
    sourcePath: '~/.agents/skills/code-review/SKILL.md',
    body: "## Code Review Skill\n\nReviews the current working tree diff for:\n\n- **Correctness bugs** — logic errors, off-by-one, missing edge cases\n- **Simplification** — unnecessary complexity, dead code\n- **Security** — injection risks, exposed secrets, unsafe defaults\n\n### Usage\n\n```\n/code-review          # Review current diff\n/code-review --fix    # Apply suggestions automatically\n/code-review --pr 42  # Review a GitHub PR\n```\n\n### Effort levels\n\nPass `low`, `medium`, `high`, or `max` to control thoroughness.",
  },
  'react-dev': {
    slug: 'react-dev', name: 'React Dev', hasSkillMd: true,
    frontmatter: { name: 'React Dev', description: 'React development assistant with component generation and hooks guidance', trigger: '/react-dev' },
    sourcePath: '~/.agents/skills/react-dev/SKILL.md',
    body: "## React Dev Skill\n\nSpecialized assistant for React development tasks.\n\n### Capabilities\n\n- Generate typed components with Tailwind styling\n- Advise on hook patterns and dependency arrays\n- Optimize re-renders with `memo`, `useMemo`, `useCallback`\n- Convert class components to hooks\n\n### Usage\n\n```\n/react-dev create a data table with sorting and pagination\n```",
  },
  'graphify': {
    slug: 'graphify', name: 'Graphify', hasSkillMd: true,
    frontmatter: { name: 'Graphify', description: 'Transform any input into a knowledge graph', trigger: '/graphify' },
    sourcePath: '~/.claude/skills/graphify/SKILL.md',
    body: "## Graphify Skill\n\nConverts unstructured input — notes, documents, codebases — into a knowledge graph with nodes and edges.\n\n### Usage\n\n```\n/graphify            # Graph this conversation\n/graphify <file>     # Graph a document\n```\n\nOutput is saved to `~/.claude/graphs/` as JSON and optionally rendered as Mermaid.",
  },
  'frontend-design': {
    slug: 'frontend-design', name: 'Frontend Design', hasSkillMd: true,
    frontmatter: { name: 'Frontend Design', description: 'Create distinctive production-grade frontend interfaces', trigger: '/frontend-design' },
    sourcePath: '~/.cursor/skills-cursor/frontend-design/SKILL.md',
    body: "## Frontend Design Skill\n\nProduces polished, production-ready UI with a distinct visual identity — not generic AI-generated layouts.\n\n### Principles\n\n- **Distinctive** — custom color palettes, thoughtful spacing, real typography choices\n- **Production-grade** — accessible, responsive, keyboard-navigable\n- **Component-first** — outputs self-contained, reusable React components\n\n### Usage\n\n```\n/frontend-design landing page for a SaaS analytics tool\n/frontend-design settings panel with dark mode toggle\n```",
  },
  'bmad-dev-story': {
    slug: 'bmad-dev-story', name: 'BMad Dev Story', hasSkillMd: true,
    frontmatter: { name: 'BMad Dev Story', description: 'Execute story implementation from a spec file', trigger: '/dev-story' },
    sourcePath: '~/.cursor/skills-cursor/bmad-dev-story/SKILL.md',
    body: "## BMad Dev Story Skill\n\nImplements a story from a pre-written spec file, producing clean working code that follows the project's architecture and conventions.\n\n### Usage\n\n```\n/dev-story docs/stories/story-1.2.md\n```\n\n### What it does\n\n1. Reads the story spec for acceptance criteria and technical context\n2. Explores the relevant codebase sections\n3. Implements each criterion with tests\n4. Runs a self-review before marking complete\n\n### Prerequisites\n\nA story file created by `/create-story` with fully-filled context sections.",
  },
};

export const DEMO_AGENTS = [
  { slug: 'quick-dev', name: 'Quick Dev', description: 'Implements any user intent, requirement, story, bug fix or change request by producing clean working code that follows project architecture, patterns and conventions.', hasSkillMd: true, trigger: null, totalCalls: 28, lastUsed: NOW - 1 * DAY, sourcePath: '~/.claude/agents/quick-dev.md', providers: ['claude', 'cursor'] },
  { slug: 'bmad-agent-architect', name: 'Architect', description: 'System architect and technical design leader. Produces architecture decision records, solution designs, and component diagrams.', hasSkillMd: true, trigger: null, totalCalls: 12, lastUsed: NOW - 2 * DAY, sourcePath: '~/.claude/agents/bmad-agent-architect.md', providers: ['claude', 'cursor'] },
  { slug: 'context7-mcp', name: 'Context7 MCP', description: 'Fetches up-to-date library documentation from context7.com for any library or framework. Keeps code examples current beyond training data cutoff.', hasSkillMd: true, trigger: null, totalCalls: 19, lastUsed: NOW - 3 * DAY, sourcePath: '~/.cursor/plugins/cache/cursor-public/context7-plugin/latest/agents/context7-mcp.md', providers: ['cursor'] },
];

export const DEMO_AGENT_DETAIL = {
  'quick-dev': {
    slug: 'quick-dev', name: 'Quick Dev', hasSkillMd: true,
    frontmatter: { name: 'Quick Dev', description: 'Implements any user intent following project conventions' },
    sourcePath: '~/.claude/agents/quick-dev.md',
    body: "## Quick Dev Agent\n\nA senior software engineer persona focused on story execution and clean code delivery.\n\n### When to use\n\n- Implementing a feature, fix, or refactor with clear requirements\n- Building a component or script from scratch\n- Applying a code review's suggestions\n\n### Behaviour\n\n1. Reads the relevant area of the codebase before writing\n2. Follows existing patterns — no unnecessary abstractions\n3. Keeps changes minimal and focused\n4. Runs linting/tests after writing\n\n### Usage\n\nActivate via `@quick-dev` in a Cursor chat, or invoke as a subagent from another workflow.",
  },
  'bmad-agent-architect': {
    slug: 'bmad-agent-architect', name: 'Architect', hasSkillMd: true,
    frontmatter: { name: 'Architect', description: 'System architect and technical design leader' },
    sourcePath: '~/.claude/agents/bmad-agent-architect.md',
    body: "## Architect Agent\n\nProduces architecture decision records, solution designs, and C4 diagrams.\n\n### When to use\n\n- Designing a new service or major feature\n- Evaluating technology choices with clear trade-offs\n- Documenting an existing system for onboarding\n\n### Deliverables\n\n- **ADR** — Architecture Decision Record in MADR format\n- **C4 diagrams** — Context, Container, and Component level Mermaid diagrams\n- **Solution design** — Approach, risks, alternatives considered\n\n### Usage\n\nActivate via `@architect` or invoke the `bmad-create-architecture` skill.",
  },
  'context7-mcp': {
    slug: 'context7-mcp', name: 'Context7 MCP', hasSkillMd: true,
    frontmatter: { name: 'Context7 MCP', description: 'Fetches up-to-date library documentation from context7.com' },
    sourcePath: '~/.cursor/plugins/cache/cursor-public/context7-plugin/latest/agents/context7-mcp.md',
    body: "## Context7 MCP Agent\n\nA Cursor plugin agent that fetches live library documentation via the Context7 MCP server.\n\n### Why it exists\n\nTraining data has a cutoff. Libraries ship breaking changes. Context7 retrieves the current docs so code examples are accurate for the version you're actually using.\n\n### How it works\n\n1. Detects library references in your query\n2. Resolves the library ID via the Context7 registry\n3. Fetches focused documentation snippets (scoped to the relevant API surface)\n4. Injects them into the assistant context before responding\n\n### Supported libraries\n\nReact, Next.js, Prisma, Tailwind, Supabase, Drizzle, tRPC, and 2,000+ more.",
  },
};

export const DEMO_MCPS = [
  { id: 'github', name: 'GitHub', type: 'cloud', config: null, toolCount: 5, totalCalls: 127, lastUsed: NOW - DAY, auth: { authenticated: true, timestamp: NOW - 30 * DAY } },
  { id: 'readwise', name: 'Readwise', type: 'plugin', config: { command: 'npx', args: ['-y', '@readwise/mcp'] }, toolCount: 3, totalCalls: 43, lastUsed: NOW - 3 * DAY },
];

export const DEMO_MCP_DETAIL = {
  'github': { id: 'github', name: 'GitHub', type: 'cloud', config: null, toolCount: 5, totalCalls: 127, lastUsed: NOW - DAY, auth: { authenticated: true, timestamp: NOW - 30 * DAY }, tools: [{ name: 'add_comment', count: 45, lastUsed: NOW - DAY }, { name: 'get_issue', count: 38, lastUsed: NOW - DAY }, { name: 'create_pull_request', count: 18, lastUsed: NOW - 2 * DAY }, { name: 'create_issue', count: 14, lastUsed: NOW - 5 * DAY }, { name: 'merge_pull_request', count: 12, lastUsed: NOW - 4 * DAY }] },
  'readwise': { id: 'readwise', name: 'Readwise', type: 'plugin', config: { command: 'npx', args: ['-y', '@readwise/mcp'] }, toolCount: 3, totalCalls: 43, lastUsed: NOW - 3 * DAY, tools: [{ name: 'reader_list_documents', count: 22, lastUsed: NOW - 3 * DAY }, { name: 'readwise_search_highlights', count: 15, lastUsed: NOW - 3 * DAY }, { name: 'reader_create_document', count: 6, lastUsed: NOW - 7 * DAY }] },
};

export const DEMO_MEMORY = [
  { project: 'global', filename: 'user_profile.md', name: 'User Profile', description: 'Full-stack developer with 8 years experience, specializes in TypeScript and React', type: 'user', snippet: 'Works at a SaaS startup, prefers functional programming patterns and small focused PRs.' },
  { project: 'global', filename: 'feedback_code_style.md', name: 'Code Style', description: 'Prefer explicit over clever; no unnecessary abstractions; trust the framework', type: 'feedback', snippet: 'Why: burnt by over-engineered code that was impossible to debug in production.' },
  { project: 'claude:::-home-demo-myapp', filename: 'project_status.md', name: 'MyApp Status', description: 'Building v2.0 with JWT auth rewrite; targeting Q3 2026 launch', type: 'project', snippet: 'Current sprint: auth system overhaul. Next: dark mode, then mobile layout.' },
  { project: 'claude:::-home-demo-myapp', filename: 'feedback_testing.md', name: 'Testing Approach', description: 'Integration tests over unit tests; mock only at system boundaries', type: 'feedback', snippet: 'Why: lost a week debugging mock/prod divergence in a previous quarter.' },
  { project: 'claude:::-home-demo-data-pipeline', filename: 'reference_data_sources.md', name: 'Data Sources', description: 'Sales data: Snowflake; customers: Salesforce; catalog: S3', type: 'reference', snippet: 'Snowflake creds in .env.production. Never commit. Salesforce uses OAuth2.' },
  { project: 'claude:::-home-demo-data-pipeline', filename: 'project_q1_analysis.md', name: 'Q1 Analysis', description: 'Quarterly sales analysis pipeline; due 2026-06-15', type: 'project', snippet: 'Goal: automated weekly sales digest for leadership team. Owner: Alex.' },
];

export const DEMO_MEMORY_DETAIL = [
  { project: 'global', filename: 'user_profile.md', name: 'User Profile', description: 'Full-stack developer with 8 years experience, specializes in TypeScript and React', type: 'user', snippet: null, frontmatter: { name: 'User Profile', description: 'Full-stack developer with 8 years experience', 'metadata.type': 'user' }, body: "Full-stack developer (8 years), currently at a SaaS startup.\n\n**Stack**: TypeScript, React, Node.js, PostgreSQL, Tailwind\n\n**Preferences**:\n- Functional programming patterns over OOP where possible\n- Small, focused PRs with clear commit messages\n- Tests that hit real integrations, not mocks\n- Explicit over clever — readable code wins" },
  { project: 'global', filename: 'feedback_code_style.md', name: 'Code Style', description: 'Prefer explicit over clever; no unnecessary abstractions; trust the framework', type: 'feedback', snippet: null, frontmatter: { name: 'Code Style', 'metadata.type': 'feedback' }, body: "Don't add abstractions beyond what the current task requires.\n\n**Why:** Over-engineered utilities in a prior codebase made debugging production issues take 3× longer.\n\n**How to apply:** Three similar lines is better than a premature helper. If removing a comment wouldn't confuse a future reader, don't write it." },
  { project: 'claude:::-home-demo-myapp', filename: 'project_status.md', name: 'MyApp Status', description: 'Building v2.0 with JWT auth rewrite; targeting Q3 2026 launch', type: 'project', snippet: null, frontmatter: { name: 'MyApp Status', 'metadata.type': 'project' }, body: "**Current sprint**: Auth system overhaul (JWT replace legacy sessions)\n\n**Roadmap**:\n1. ~~JWT middleware rewrite~~ ✓\n2. Dark mode toggle\n3. Mobile-responsive layout\n4. Stripe billing integration\n\n**Why:** Legal flagged session token storage as non-compliant with new data residency requirements.\n\n**Launch target**: Q3 2026 (September)" },
  { project: 'claude:::-home-demo-myapp', filename: 'feedback_testing.md', name: 'Testing Approach', description: 'Integration tests over unit tests; mock only at system boundaries', type: 'feedback', snippet: null, frontmatter: { name: 'Testing Approach', 'metadata.type': 'feedback' }, body: "Prefer integration tests that hit a real database over unit tests with mocks.\n\n**Why:** In Q4 2025 a mock-based test suite passed while a prod migration silently broke the auth flow for 2 days.\n\n**How to apply:** Only mock at system boundaries (external APIs, email providers). Use test databases seeded with fixtures." },
  { project: 'claude:::-home-demo-data-pipeline', filename: 'reference_data_sources.md', name: 'Data Sources', description: 'Sales data: Snowflake; customers: Salesforce; catalog: S3', type: 'reference', snippet: null, frontmatter: { name: 'Data Sources', 'metadata.type': 'reference' }, body: "## Data Source Inventory\n\n| Source | System | Access |\n|--------|--------|--------|\n| Sales transactions | Snowflake | `.env.production` |\n| Customer records | Salesforce | OAuth2 via `scripts/sf_auth.py` |\n| Product catalog | S3 `s3://demo-data/catalog/` | IAM role |\n\nNever commit credentials. Use `direnv` to load `.env.production` locally." },
  { project: 'claude:::-home-demo-data-pipeline', filename: 'project_q1_analysis.md', name: 'Q1 Analysis', description: 'Quarterly sales analysis pipeline; due 2026-06-15', type: 'project', snippet: null, frontmatter: { name: 'Q1 Analysis', 'metadata.type': 'project' }, body: "Goal: automated weekly sales digest delivered to leadership every Monday.\n\n**Owner**: Alex\n\n**Due**: 2026-06-15\n\n**Components**:\n- ETL: clean customer + transaction data\n- Analysis: regional breakdown, MoM growth\n- Report: markdown summary → PDF via Pandoc\n- Delivery: email via SendGrid\n\n**Why:** Leadership currently spends ~3h/week manually pulling numbers from Snowflake." },
];

const PLAN_ACTIVITY = {
  '2025-12-08': 3, '2025-12-09': 5, '2025-12-17': 6, '2025-12-22': 7, '2025-12-23': 8,
  '2026-01-07': 4, '2026-01-14': 6, '2026-01-21': 5, '2026-01-26': 8, '2026-01-28': 9,
  '2026-02-04': 3, '2026-02-11': 4, '2026-02-18': 5, '2026-02-25': 4,
  '2026-03-04': 6, '2026-03-11': 4, '2026-03-18': 7, '2026-03-25': 6, '2026-03-30': 8,
  '2026-04-01': 9, '2026-04-08': 4, '2026-04-15': 7, '2026-04-22': 5, '2026-04-29': 8,
  '2026-05-06': 6, '2026-05-09': 4, '2026-05-11': 7, '2026-05-13': 8,
  '2026-05-16': 5, '2026-05-19': 6, '2026-05-23': 9, '2026-05-25': 10,
  '2026-05-26': 3, '2026-05-27': 4, '2026-05-28': 11, '2026-05-29': 7,
};

export const DEMO_PLANS = [
  { filename: 'implement-user-auth-v2.md', title: 'Implement User Auth V2', snippet: 'Replace legacy session-based auth with JWT tokens, refresh token rotation, and Redis session store.', mtime: NOW - 2 * DAY },
  { filename: 'refactor-data-pipeline.md', title: 'Refactor Data Pipeline', snippet: 'Migrate from pandas to polars for 4-10× performance improvement on large datasets.', mtime: NOW - 7 * DAY },
];

export const DEMO_PLAN_BODY = {
  'implement-user-auth-v2.md': "---\ntitle: Implement User Auth V2\n---\n\n## Context\n\nLegal flagged the current session-based auth as non-compliant with new data residency requirements. JWT tokens allow stateless validation without server-side session storage.\n\n## Approach\n\n1. Replace `express-session` with `jsonwebtoken`\n2. Add refresh token rotation with Redis store\n3. Implement `authenticate` middleware (done ✓)\n4. Update all protected routes\n5. Add logout endpoint that invalidates refresh tokens\n\n## Critical Files\n\n- `src/auth/middleware.ts` — core JWT validation\n- `src/routes/auth.ts` — login, logout, refresh endpoints\n- `src/redis.ts` — refresh token store\n\n## Verification\n\n1. `npm test -- --testPathPattern=auth` — all auth tests green\n2. Manual: login → access protected route → wait for expiry → verify 401\n3. Manual: use refresh token → verify new access token issued",
  'refactor-data-pipeline.md': "---\ntitle: Refactor Data Pipeline\n---\n\n## Context\n\nThe current pandas-based pipeline takes 18 minutes on the full customer dataset (24k rows). Polars uses Apache Arrow under the hood and is typically 4-10× faster for this workload.\n\n## Approach\n\nReplace `pandas` with `polars` in:\n\n- `scripts/clean_customers.py` — done ✓\n- `scripts/query_snowflake.py` — use `polars.read_database()`\n- `scripts/generate_report.py` — Polars DataFrames are compatible with existing chart code\n\n## Migration Notes\n\n- `df.map()` → `df.map_elements()` (with explicit `return_dtype`)\n- `df.dropna()` → `df.filter(pl.col('x').is_not_null())`\n- `df.drop_duplicates()` → `df.unique()`\n\n## Verification\n\n```bash\ntime python scripts/clean_customers.py  # target: < 5s\npython -m pytest tests/test_pipeline.py\n```",
};

export const DEMO_STATS = {
  totals: { sessions: 8, messages: 90, toolCalls: 105 },
  tokens: { input: 892450, output: 124830, cacheRead: 1243500, cacheCreation: 210000, cacheHitRate: 58 },
  stopReasons: { tool_use: 55, end_turn: 18 },
  // Provider-prefixed model keys (mirrors all-provider aggregation)
  models: { 'claude/claude-sonnet-4-6': 48, 'claude/claude-opus-4-7': 14 },
  hooks: { success: 23, failure: 2, avgDurationMs: 487 },
  topProjects: [
    { id: 'claude:::-home-demo-myapp', messageCount: 38, tokenCount: 587000, provider: 'claude' },
    { id: 'claude:::-home-demo-data-pipeline', messageCount: 24, tokenCount: 430000, provider: 'claude' },
    { id: 'cursor:::-home-demo-ai-lens', messageCount: 18, tokenCount: 0, provider: 'cursor' },
    { id: 'cursor:::-home-demo-react-dashboard', messageCount: 10, tokenCount: 0, provider: 'cursor' },
  ],
  activity: PLAN_ACTIVITY,
  estimatedCostUsd: 4.72,
  estimatedCostByProvider: { claude: 4.72, cursor: 0 },
};

export const DEMO_PROJECT_STATS = {
  'claude:::-home-demo-myapp': {
    totals: { sessions: 3, messages: 38, toolCalls: 52 },
    tokens: { input: 523400, output: 74200, cacheRead: 812000, cacheCreation: 143000, cacheHitRate: 61 },
    models: { 'claude-sonnet-4-6': 31, 'claude-opus-4-7': 7 },
    topTools: [{ name: 'Read', count: 18 }, { name: 'Edit', count: 15 }, { name: 'Bash', count: 12 }, { name: 'Write', count: 4 }, { name: 'WebFetch', count: 3 }],
    activity: { '2026-05-09': 4, '2026-05-11': 7, '2026-05-13': 8, '2026-05-23': 9, '2026-05-28': 11, '2026-04-15': 5, '2026-03-30': 6 },
    hooks: { success: 14, failure: 1, avgDurationMs: 412 },
    estimatedCostUsd: 2.87,
  },
  'claude:::-home-demo-data-pipeline': {
    totals: { sessions: 2, messages: 24, toolCalls: 35 },
    tokens: { input: 369050, output: 50630, cacheRead: 431500, cacheCreation: 67000, cacheHitRate: 54 },
    models: { 'claude-sonnet-4-6': 17, 'claude-opus-4-7': 7 },
    topTools: [{ name: 'Bash', count: 16 }, { name: 'Read', count: 9 }, { name: 'Write', count: 6 }, { name: 'Edit', count: 4 }],
    activity: { '2026-05-16': 5, '2026-05-25': 10, '2026-04-29': 6, '2026-03-25': 4 },
    hooks: { success: 9, failure: 1, avgDurationMs: 603 },
    estimatedCostUsd: 1.85,
  },
  'cursor:::-home-demo-ai-lens': {
    totals: { sessions: 2, messages: 18, toolCalls: 12 },
    tokens: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0, cacheHitRate: 0 },
    models: {},
    topTools: [{ name: 'Read', count: 5 }, { name: 'Edit', count: 4 }, { name: 'Shell', count: 3 }],
    activity: { '2026-05-27': 4, '2026-05-29': 7 },
    hooks: { success: 0, failure: 0, avgDurationMs: 0 },
    estimatedCostUsd: 0,
  },
  'cursor:::-home-demo-react-dashboard': {
    totals: { sessions: 1, messages: 10, toolCalls: 6 },
    tokens: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0, cacheHitRate: 0 },
    models: {},
    topTools: [{ name: 'Read', count: 3 }, { name: 'Write', count: 2 }, { name: 'Shell', count: 1 }],
    activity: { '2026-05-26': 3 },
    hooks: { success: 0, failure: 0, avgDurationMs: 0 },
    estimatedCostUsd: 0,
  },
};


export const DEMO_LOGS = {
  data: [
    { project: 'claude:::-home-demo-myapp', session: SID1, lineNumber: 1, raw: { type: 'userMessage', message: { role: 'user', content: "There's a bug in the JWT authentication middleware." }, timestamp: S1 } },
    { project: 'claude:::-home-demo-myapp', session: SID1, lineNumber: 2, raw: { type: 'assistantMessage', message: { role: 'assistant', content: [{ type: 'text', text: 'Let me look at the auth middleware.' }, { type: 'tool_use', id: 'tu1', name: 'Read', input: { file_path: '/home/demo/myapp/src/auth/middleware.ts' } }] }, timestamp: S1 + 30 * MIN } },
    { project: 'claude:::-home-demo-myapp', session: SID1, lineNumber: 3, raw: { type: 'toolResult', toolUseId: 'tu1', content: 'import jwt from ...', timestamp: S1 + 31 * MIN } },
    { project: 'claude:::-home-demo-myapp', session: SID2, lineNumber: 1, raw: { type: 'userMessage', message: { role: 'user', content: 'Add a dark mode toggle' }, timestamp: S2 } },
    { project: 'claude:::-home-demo-myapp', session: SID3, lineNumber: 1, raw: { type: 'userMessage', message: { role: 'user', content: 'Set up GitHub Actions CI pipeline' }, timestamp: S3 } },
    { project: 'claude:::-home-demo-data-pipeline', session: SID4, lineNumber: 1, raw: { type: 'userMessage', message: { role: 'user', content: 'Analyze Q1 2026 sales data' }, timestamp: S4 } },
    { project: 'claude:::-home-demo-data-pipeline', session: SID4, lineNumber: 2, raw: { type: 'assistantMessage', message: { role: 'assistant', content: [{ type: 'tool_use', name: 'Bash', input: { command: 'python scripts/query_snowflake.py ...' } }] }, timestamp: S4 + 5 * MIN } },
    { project: 'claude:::-home-demo-data-pipeline', session: SID5, lineNumber: 1, raw: { type: 'userMessage', message: { role: 'user', content: 'Write an ETL script to clean customers CSV' }, timestamp: S5 } },
    { project: 'claude:::-home-demo-data-pipeline', session: SID5, lineNumber: 2, raw: { type: 'assistantMessage', message: { role: 'assistant', content: [{ type: 'tool_use', name: 'Bash', input: { command: 'head -5 data/raw/customers.csv' } }] }, timestamp: S5 + 5 * MIN } },
    { project: 'claude:::-home-demo-data-pipeline', session: SID5, lineNumber: 3, raw: { type: 'toolResult', toolUseId: 'tu15', content: 'customer_id,name,email,...\n24817 data/raw/customers.csv', timestamp: S5 + 6 * MIN } },
  ],
  total: 10,
};
