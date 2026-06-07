import { useState } from 'react';
import { FolderOpen, Search } from 'lucide-react';
import type { ProjectSummary, ProviderInfo } from '../types';
import { prettifyProjectName, formatRelative, slugify } from '../utils';
import { ProviderFilterBar } from './ProviderFilterBar';

type ProjectSort = 'updated' | 'sessions' | 'name';

export function ProjectGrid({ projects, providers, provider, onOpen }: {
  projects: ProjectSummary[];
  providers: ProviderInfo[];
  provider?: string | null;
  onOpen: (id: string) => void;
}) {
  const [sort, setSort] = useState<ProjectSort>('updated');
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<string | null>(null);

  const isAllMode = !provider || provider === 'all';
  const presentProviderIds = isAllMode
    ? [...new Set(projects.map(p => p.provider).filter((p): p is string => !!p))].sort()
    : [];

  const q = search.toLowerCase().trim();
  const sorted = [...projects].filter(p =>
    (!providerFilter || p.provider === providerFilter) &&
    (!q || prettifyProjectName(p.id).toLowerCase().includes(q) || p.fullPath?.toLowerCase().includes(q))
  ).sort((a, b) => {
    if (sort === 'name') return prettifyProjectName(a.id).localeCompare(prettifyProjectName(b.id));
    if (sort === 'sessions') return b.sessionCount - a.sessionCount;
    return (b.lastUpdated || 0) - (a.lastUpdated || 0);
  });

  return (
    <div className="flex-1 overflow-y-auto w-full">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold flex items-center">
              <FolderOpen className="mr-3 text-lens-accent shrink-0" /> Select a Project
            </h2>
            <p className="text-lens-text-dim text-sm mt-1">
              {q || providerFilter ? `${sorted.length} of ${projects.length} projects` : `${projects.length} projects`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1">
              {(['updated', 'sessions', 'name'] as const).map(s => (
                <button key={s} onClick={() => setSort(s)} className={`px-2 py-1 text-xs rounded transition-colors ${sort === s ? 'bg-lens-border text-lens-accent' : 'text-lens-text-faint hover:text-lens-text-body'}`}>
                  {s === 'updated' ? 'Recent' : s === 'sessions' ? 'Sessions' : 'A–Z'}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-lens-text-dim pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="bg-lens-surface border border-lens-border focus:border-lens-border-hi rounded-md pl-8 pr-3 py-1.5 text-sm text-lens-text-body placeholder:text-lens-text-faint outline-none transition-colors w-52"
              />
            </div>
          </div>
        </div>
        {isAllMode && (
          <ProviderFilterBar providers={providers} presentIds={presentProviderIds} filter={providerFilter} onChange={setProviderFilter} />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(proj => (
            <button key={proj.id} onClick={() => onOpen(proj.id)} className="bg-lens-surface border border-lens-border hover:border-lens-border-hi rounded-lg p-6 text-left transition-colors flex flex-col">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-medium text-lens-text text-lg">{prettifyProjectName(proj.id)}</span>
                {proj.provider && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 provider-badge provider-badge-${slugify(proj.provider)}`}>
                    {providers.find(p => p.id === proj.provider)?.name ?? proj.provider}
                  </span>
                )}
              </div>
              <div className="text-xs text-lens-text-dim truncate mb-4" title={proj.fullPath}>{proj.fullPath}</div>
              <div className="mt-auto flex items-center justify-between text-xs text-lens-text-sub">
                <span>{proj.sessionCount} Sessions</span>
                <span>{proj.lastUpdated ? formatRelative(proj.lastUpdated) : 'Never'}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
