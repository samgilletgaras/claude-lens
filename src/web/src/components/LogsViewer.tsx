import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import type { DiagnosticsStats } from '../types';
import { prettifyProjectName } from '../utils';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-slate-200 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">{title}</div>
      {children}
    </div>
  );
}

function BarRow({ label, value, max, color = 'bg-amber-500/40' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex justify-between text-xs text-zinc-400 mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{value.toLocaleString()} <span className="text-zinc-600">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
}

export function LogsViewer() {
  const [stats, setStats] = useState<DiagnosticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(res => {
        if (res.error) throw new Error(res.error);
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <p>Computing stats…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center text-rose-400 text-sm">
        <p>{error ?? 'No data'}</p>
      </div>
    );
  }

  const totalTokens = stats.tokens.input + stats.tokens.output;
  const maxStopReason = Math.max(...Object.values(stats.stopReasons), 1);
  const maxModel = Math.max(...Object.values(stats.models), 1);
  const maxToken = Math.max(stats.tokens.input, stats.tokens.output, stats.tokens.cacheRead, stats.tokens.cacheCreation, 1);
  const maxProjectMsgs = Math.max(...stats.topProjects.map(p => p.messageCount), 1);

  const stopReasonOrder = ['tool_use', 'end_turn', 'max_tokens', 'stop_sequence'];
  const sortedStopReasons = [
    ...stopReasonOrder.filter(k => stats.stopReasons[k] !== undefined).map(k => [k, stats.stopReasons[k]] as [string, number]),
    ...Object.entries(stats.stopReasons).filter(([k]) => !stopReasonOrder.includes(k)),
  ];

  return (
    <div className="flex-1 overflow-y-auto w-full">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center mb-2">
          <h2 className="text-2xl font-semibold flex items-center">
            <Activity className="mr-3 text-amber-500" /> Diagnostics
          </h2>
        </div>
        <p className="text-zinc-500 text-sm mb-6">Aggregated from all session history</p>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Sessions" value={stats.totals.sessions.toLocaleString()} />
          <StatCard label="Messages" value={fmt(stats.totals.messages)} />
          <StatCard label="Total Tokens" value={fmt(totalTokens)} sub={`${fmt(stats.totals.toolCalls)} tool calls`} />
          <StatCard
            label="Cache Hit Rate"
            value={`${stats.tokens.cacheHitRate}%`}
            sub={`${fmt(stats.tokens.cacheRead)} tokens served from cache`}
          />
        </div>

        {/* Stop reasons + Models */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Panel title="Stop Reasons">
            {sortedStopReasons.length === 0
              ? <p className="text-zinc-600 text-xs italic">No data</p>
              : sortedStopReasons.map(([reason, count]) => (
                  <BarRow key={reason} label={reason} value={count} max={maxStopReason} color="bg-amber-500/40" />
                ))
            }
          </Panel>
          <Panel title="Models Used">
            {Object.keys(stats.models).length === 0
              ? <p className="text-zinc-600 text-xs italic">No data</p>
              : Object.entries(stats.models)
                  .sort((a, b) => b[1] - a[1])
                  .map(([model, count]) => (
                    <BarRow key={model} label={model} value={count} max={maxModel} color="bg-sky-500/40" />
                  ))
            }
          </Panel>
        </div>

        {/* Token breakdown + Hook health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Panel title="Token Breakdown">
            <BarRow label="Input" value={stats.tokens.input} max={maxToken} color="bg-violet-500/40" />
            <BarRow label="Output" value={stats.tokens.output} max={maxToken} color="bg-emerald-500/40" />
            <BarRow label="Cache Read" value={stats.tokens.cacheRead} max={maxToken} color="bg-sky-500/40" />
            <BarRow label="Cache Created" value={stats.tokens.cacheCreation} max={maxToken} color="bg-zinc-500/40" />
          </Panel>
          <Panel title="Hook Health">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm text-zinc-400">Successes</span>
                </div>
                <span className="text-slate-200 tabular-nums font-medium">{stats.hooks.success.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-sm text-zinc-400">Failures</span>
                </div>
                <span className="text-slate-200 tabular-nums font-medium">{stats.hooks.failure.toLocaleString()}</span>
              </div>
              {stats.hooks.success + stats.hooks.failure > 0 && (
                <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                  <span className="text-sm text-zinc-400">Success Rate</span>
                  <span className="text-slate-200 font-medium">
                    {Math.round((stats.hooks.success / (stats.hooks.success + stats.hooks.failure)) * 100)}%
                  </span>
                </div>
              )}
              {stats.hooks.avgDurationMs > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Avg Duration</span>
                  <span className="text-slate-200 font-medium tabular-nums">{stats.hooks.avgDurationMs}ms</span>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Top projects */}
        {stats.topProjects.length > 0 && (
          <Panel title="Top Projects by Activity">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-normal">Project</th>
                  <th className="text-right py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-normal">Messages</th>
                  <th className="text-right py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-normal">Tokens</th>
                  <th className="w-1/3 py-2 pl-4"></th>
                </tr>
              </thead>
              <tbody>
                {stats.topProjects.map(proj => (
                  <tr key={proj.id} className="border-b border-zinc-800/50 last:border-0">
                    <td className="py-2 text-slate-300 truncate max-w-[200px]">{prettifyProjectName(proj.id)}</td>
                    <td className="py-2 text-right text-zinc-400 tabular-nums">{proj.messageCount.toLocaleString()}</td>
                    <td className="py-2 text-right text-zinc-400 tabular-nums">{fmt(proj.tokenCount)}</td>
                    <td className="py-2 pl-4">
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500/40 rounded-full"
                          style={{ width: `${Math.round((proj.messageCount / maxProjectMsgs) * 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </div>
    </div>
  );
}
