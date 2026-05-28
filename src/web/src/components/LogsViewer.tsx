import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import type { LogEntry } from '../types';
import { prettifyProjectName } from '../utils';

const PAGE_SIZE = 10;

export function LogsViewer() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loadedPage, setLoadedPage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loading = loadedPage !== page;

  useEffect(() => {
    fetch(`/api/logs?page=${page}&pageSize=${PAGE_SIZE}`)
      .then(res => res.json())
      .then(res => {
        if (res.error) throw new Error(res.error);
        setEntries(res.data || []);
        setTotal(res.total || 0);
        setLoadedPage(page);
      })
      .catch(err => {
        setError(err.message);
        setLoadedPage(page);
      });
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto w-full">
        <div className="px-4 md:px-8 pt-8 pb-4 max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-2 flex items-center">
            <Activity className="mr-3 text-amber-500" /> Diagnostics
          </h2>
          <p className="text-zinc-500 text-sm mb-6">
            {loading ? 'Loading…' : `${total.toLocaleString()} log entries`}
          </p>
        </div>

        {error ? (
          <div className="px-4 md:px-8 max-w-6xl mx-auto text-rose-400 text-sm">{error}</div>
        ) : loading ? (
          <div className="flex justify-center py-8 text-zinc-500 text-sm">Loading logs...</div>
        ) : entries.length === 0 ? (
          <div className="flex justify-center py-8 text-zinc-500 text-sm">No log entries found.</div>
        ) : (
          <div className="px-4 md:px-8 pb-6 max-w-6xl mx-auto space-y-2">
            {entries.map((entry, idx) => (
              <div key={idx}>
                <div className="text-[10px] text-zinc-500 mb-1">
                  {prettifyProjectName(entry.project)} · {entry.session} · line {entry.lineNumber}
                </div>
                <pre className="text-[10px] text-zinc-400 max-h-48 overflow-y-auto font-mono whitespace-pre-wrap bg-zinc-950/80 p-3 rounded-md border border-zinc-800/80 shadow-inner">
                  {JSON.stringify(entry.raw, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-800 px-4 py-3 flex items-center justify-between text-sm">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          className="px-3 py-1 rounded text-zinc-400 hover:text-slate-200 hover:bg-zinc-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        <span className="text-zinc-500 text-xs">
          {total > 0 ? `Page ${page + 1} of ${totalPages} · ${total.toLocaleString()} entries` : ''}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1 || loading}
          className="px-3 py-1 rounded text-zinc-400 hover:text-slate-200 hover:bg-zinc-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
