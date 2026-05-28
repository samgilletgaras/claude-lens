import { useEffect, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DiagnosticsStats } from '../types';
import { prettifyProjectName, fmt } from '../utils';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-lens-surface border border-lens-border rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-wider text-lens-text-dim mb-1">{label}</div>
      <div className="text-2xl font-semibold text-lens-text tabular-nums">{value}</div>
      {sub && <div className="text-xs text-lens-text-dim mt-1">{sub}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-lens-surface border border-lens-border rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-wider text-lens-text-dim mb-3">{title}</div>
      {children}
    </div>
  );
}

function BarRow({ label, value, max, color = 'bg-lens-accent/40' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex justify-between text-xs text-lens-text-sub mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{value.toLocaleString()} <span className="text-lens-text-faint">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-lens-border rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const PERIOD_WEEKS = 26;

function ActivityHeatmap({ activity }: { activity: Record<string, number> }) {
  const [offset, setOffset] = useState(0); // 0 = current period, 1 = one period back, etc.

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Anchor = today shifted back by offset periods
  const anchor = new Date(today);
  anchor.setDate(anchor.getDate() - offset * PERIOD_WEEKS * 7);

  // Start = 26 weeks before anchor, snapped to Sunday
  const start = new Date(anchor);
  start.setDate(start.getDate() - PERIOD_WEEKS * 7);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);

  const startStr = start.toISOString().slice(0, 10);
  const anchorStr = anchor.toISOString().slice(0, 10);

  const weeks: ({ date: string; count: number } | null)[][] = [];
  const cursor = new Date(start);
  while (cursor <= anchor) {
    const week: ({ date: string; count: number } | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(cursor);
      day.setDate(day.getDate() + d);
      if (day > anchor) {
        week.push(null);
      } else {
        const dateStr = day.toISOString().slice(0, 10);
        week.push({ date: dateStr, count: activity[dateStr] || 0 });
      }
    }
    weeks.push(week);
    cursor.setDate(cursor.getDate() + 7);
  }

  const windowCounts = Object.entries(activity)
    .filter(([d]) => d >= startStr && d <= anchorStr)
    .map(([, v]) => v);
  const maxCount = Math.max(...windowCounts, 1);
  const totalSessions = windowCounts.reduce((s, v) => s + v, 0);
  const activeDays = windowCounts.filter(v => v > 0).length;

  const canGoNext = offset > 0;
  const canGoPrev = Object.keys(activity).some(d => d < startStr);

  function cellColor(count: number) {
    if (count === 0) return 'bg-lens-border';
    const r = count / maxCount;
    if (r < 0.2) return 'bg-amber-900/70';
    if (r < 0.4) return 'bg-amber-800/80';
    if (r < 0.65) return 'bg-amber-600/80';
    if (r < 0.85) return 'bg-amber-500';
    return 'bg-amber-400';
  }

  const monthLabels: Record<number, string> = {};
  weeks.forEach((week, i) => {
    const first = week.find(d => d !== null);
    if (!first) return;
    const d = new Date(first.date);
    const prev = i > 0 ? weeks[i - 1].find(x => x !== null) : null;
    if (!prev || new Date(prev.date).getMonth() !== d.getMonth()) {
      monthLabels[i] = d.toLocaleDateString([], { month: 'short' });
    }
  });

  const periodLabel = offset === 0
    ? 'last 6 months'
    : `${start.toLocaleDateString([], { month: 'short', year: 'numeric' })} – ${anchor.toLocaleDateString([], { month: 'short', year: 'numeric' })}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-wider text-lens-text-dim">Activity — {periodLabel}</div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] text-lens-text-dim">
            <span className="text-lens-text-body">{totalSessions}</span> sessions · <span className="text-lens-text-body">{activeDays}</span> active days
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setOffset(o => o + 1)}
              disabled={!canGoPrev}
              title="Previous period"
              className="p-0.5 rounded hover:bg-lens-border disabled:opacity-25 disabled:cursor-not-allowed text-lens-text-sub hover:text-lens-text transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOffset(o => o - 1)}
              disabled={!canGoNext}
              title="Next period"
              className="p-0.5 rounded hover:bg-lens-border disabled:opacity-25 disabled:cursor-not-allowed text-lens-text-sub hover:text-lens-text transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0 min-w-0">
          <div className="flex gap-[3px] mb-1">
            {weeks.map((_, i) => (
              <div key={i} className="w-[11px] shrink-0 text-[8px] text-lens-text-faint leading-none overflow-visible whitespace-nowrap">
                {monthLabels[i] || ''}
              </div>
            ))}
          </div>
          {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
            <div key={dayIdx} className="flex gap-[3px] mb-[3px] last:mb-0">
              {weeks.map((week, wi) => {
                const cell = week[dayIdx];
                if (!cell) return <div key={wi} className="w-[11px] h-[11px] shrink-0" />;
                return (
                  <div
                    key={wi}
                    title={`${cell.date}: ${cell.count} session${cell.count !== 1 ? 's' : ''}`}
                    className={`w-[11px] h-[11px] shrink-0 rounded-[2px] ${cellColor(cell.count)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[9px] text-lens-text-faint">Less</span>
        {['bg-lens-border', 'bg-amber-900/70', 'bg-amber-700/80', 'bg-amber-500', 'bg-amber-400'].map((c, i) => (
          <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${c}`} />
        ))}
        <span className="text-[9px] text-lens-text-faint">More</span>
      </div>
    </div>
  );
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
      <div className="flex-1 flex items-center justify-center text-lens-text-dim">
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
            <Activity className="mr-3 text-lens-accent" /> Diagnostics
          </h2>
        </div>
        <p className="text-lens-text-dim text-sm mb-6">Aggregated from all session history</p>

        {/* Heatmap — always render, handles empty gracefully */}
        <div className="bg-lens-surface border border-lens-border rounded-lg p-4 mb-6">
          <ActivityHeatmap activity={stats.activity ?? {}} />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Sessions" value={stats.totals.sessions.toLocaleString()} />
          <StatCard label="Messages" value={fmt(stats.totals.messages)} />
          <StatCard label="Total Tokens" value={fmt(totalTokens)} sub={`${fmt(stats.totals.toolCalls)} tool calls`} />
          <StatCard
            label="Cache Hit Rate"
            value={`${stats.tokens.cacheHitRate}%`}
            sub={`${fmt(stats.tokens.cacheRead)} tokens from cache`}
          />
        </div>

        {/* Cost estimate */}
        {stats.estimatedCostUsd !== undefined && (
          <div className="bg-lens-surface border border-lens-border rounded-lg p-4 mb-6 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-lens-text-dim mb-1">Estimated Cost</div>
              <div className="text-3xl font-semibold text-lens-text tabular-nums">
                ${stats.estimatedCostUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right text-xs text-lens-text-faint max-w-xs">
              Approximate, based on public model pricing for input/output tokens. Cache tokens not billed.
            </div>
          </div>
        )}

        {/* Stop reasons + Models */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Panel title="Stop Reasons">
            {sortedStopReasons.length === 0
              ? <p className="text-lens-text-faint text-xs italic">No data</p>
              : sortedStopReasons.map(([reason, count]) => (
                  <BarRow key={reason} label={reason} value={count} max={maxStopReason} color="bg-lens-accent/40" />
                ))
            }
          </Panel>
          <Panel title="Models Used">
            {Object.keys(stats.models).length === 0
              ? <p className="text-lens-text-faint text-xs italic">No data</p>
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
            <BarRow label="Cache Created" value={stats.tokens.cacheCreation} max={maxToken} color="bg-lens-border/80" />
          </Panel>
          <Panel title="Hook Health">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm text-lens-text-sub">Successes</span>
                </div>
                <span className="text-lens-text tabular-nums font-medium">{stats.hooks.success.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-sm text-lens-text-sub">Failures</span>
                </div>
                <span className="text-lens-text tabular-nums font-medium">{stats.hooks.failure.toLocaleString()}</span>
              </div>
              {stats.hooks.success + stats.hooks.failure > 0 && (
                <div className="flex items-center justify-between border-t border-lens-border pt-3">
                  <span className="text-sm text-lens-text-sub">Success Rate</span>
                  <span className="text-lens-text font-medium">
                    {Math.round((stats.hooks.success / (stats.hooks.success + stats.hooks.failure)) * 100)}%
                  </span>
                </div>
              )}
              {stats.hooks.avgDurationMs > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-lens-text-sub">Avg Duration</span>
                  <span className="text-lens-text font-medium tabular-nums">{stats.hooks.avgDurationMs}ms</span>
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
                <tr className="border-b border-lens-border">
                  <th className="text-left py-2 text-[10px] uppercase tracking-wider text-lens-text-dim font-normal">Project</th>
                  <th className="text-right py-2 text-[10px] uppercase tracking-wider text-lens-text-dim font-normal">Messages</th>
                  <th className="text-right py-2 text-[10px] uppercase tracking-wider text-lens-text-dim font-normal">Tokens</th>
                  <th className="w-1/3 py-2 pl-4"></th>
                </tr>
              </thead>
              <tbody>
                {stats.topProjects.map(proj => (
                  <tr key={proj.id} className="border-b border-lens-border/50 last:border-0">
                    <td className="py-2 text-lens-text-body truncate max-w-[200px]">{prettifyProjectName(proj.id)}</td>
                    <td className="py-2 text-right text-lens-text-sub tabular-nums">{proj.messageCount.toLocaleString()}</td>
                    <td className="py-2 text-right text-lens-text-sub tabular-nums">{fmt(proj.tokenCount)}</td>
                    <td className="py-2 pl-4">
                      <div className="h-1.5 bg-lens-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-lens-accent/40 rounded-full"
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
