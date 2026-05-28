import { useEffect, useRef, useState } from 'react';
import { Search, Clock } from 'lucide-react';
import type { SearchResult } from '../types';
import { prettifyProjectName, formatRelative } from '../utils';

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-500/30 text-amber-200 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

interface SearchViewProps {
  onNavigate: (project: string, sessionId: string) => void;
}

export function SearchView({ onNavigate }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then(res => res.json())
        .then(res => {
          setResults(res.data || []);
          setLoading(false);
          setSearched(true);
        })
        .catch(() => {
          setLoading(false);
          setSearched(true);
        });
    }, 300);
  }, [query]);

  return (
    <div className="flex-1 overflow-y-auto w-full">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center mb-2">
          <h2 className="text-2xl font-semibold flex items-center">
            <Search className="mr-3 text-amber-500" /> Search Sessions
          </h2>
        </div>
        <p className="text-zinc-500 text-sm mb-6">Search across all projects and sessions</p>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search messages, tool calls, commands…"
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg pl-11 pr-4 py-3 text-slate-200 placeholder:text-zinc-600 outline-none transition-colors text-sm"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">Searching…</div>
          )}
        </div>

        {!searched && query.length < 2 && (
          <div className="text-center text-zinc-600 text-sm py-12">
            Type at least 2 characters to search
          </div>
        )}

        {searched && results.length === 0 && (
          <div className="text-center text-zinc-500 text-sm py-12">
            No sessions found matching &ldquo;{query}&rdquo;
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <p className="text-zinc-500 text-xs mb-4">{results.length} session{results.length !== 1 ? 's' : ''} found</p>
            {results.map(result => (
              <button
                key={`${result.project}/${result.sessionId}`}
                onClick={() => onNavigate(result.project, result.sessionId)}
                className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-lg p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-1">
                  <span className="font-medium text-slate-200 text-sm truncate flex-1">{result.title}</span>
                  <span className="flex items-center gap-1 text-[10px] text-zinc-500 shrink-0">
                    <Clock className="w-3 h-3" />{formatRelative(result.lastUpdated)}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 mb-2">{prettifyProjectName(result.project)}</div>
                <p className="text-xs text-zinc-400 line-clamp-2 font-mono">
                  {highlight(result.excerpt, query)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
