import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Layers, ArrowLeft, Search, Zap } from 'lucide-react';
import type { Skill, SkillDetail } from '../types';

const META_LABEL: Record<string, string> = {
  name: 'Name',
  description: 'Description',
  trigger: 'Trigger',
};

function metaLabel(key: string) {
  return META_LABEL[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

function formatDate(ts: number | null) {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString();
}

export function SkillsViewer() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skillDetail, setSkillDetail] = useState<SkillDetail | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(res => {
        if (res.error) throw new Error(res.error);
        setSkills(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  function openSkill(skill: Skill) {
    setSelectedSkill(skill);
    setSkillDetail(null);
    if (!skill.hasSkillMd) return;
    setContentLoading(true);
    fetch(`/api/skills?slug=${encodeURIComponent(skill.slug)}`)
      .then(res => res.json())
      .then(res => {
        setSkillDetail(res.data ?? null);
        setContentLoading(false);
      })
      .catch(() => setContentLoading(false));
  }

  function closeSkill() {
    setSelectedSkill(null);
    setSkillDetail(null);
    setContentLoading(false);
  }

  if (selectedSkill !== null) {
    const meta = skillDetail?.frontmatter ?? {};
    const metaEntries = Object.entries(meta);
    return (
      <div className="flex-1 overflow-y-auto w-full">
        <div className="px-4 md:px-8 pt-8 pb-16 max-w-4xl mx-auto">
          <button
            onClick={closeSkill}
            className="flex items-center text-zinc-400 hover:text-slate-200 text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Skills
          </button>

          <h1 className="text-2xl font-semibold text-slate-200 mb-1">{selectedSkill.name}</h1>
          <div className="font-mono text-[11px] text-zinc-600 mb-6">{selectedSkill.slug}</div>

          {contentLoading && <p className="text-zinc-500 text-sm">Loading...</p>}

          {!contentLoading && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex gap-4 text-sm border-b border-zinc-800 pb-2 mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 min-w-[80px] pt-0.5 shrink-0">Usage</span>
                <span className="text-slate-300">
                  {selectedSkill.totalCalls > 0
                    ? <>{selectedSkill.totalCalls.toLocaleString()} calls{selectedSkill.lastUsed ? <span className="text-zinc-500"> · Last used {formatDate(selectedSkill.lastUsed)}</span> : null}</>
                    : <span className="text-zinc-500 italic">Never used</span>
                  }
                </span>
              </div>
              {metaEntries.map(([key, val]) => (
                <div key={key} className="flex gap-4 text-sm">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 min-w-[80px] pt-0.5 shrink-0">
                    {metaLabel(key)}
                  </span>
                  <span className="text-slate-300 break-all">{val}</span>
                </div>
              ))}
            </div>
          )}

          {!contentLoading && skillDetail?.body && (
            <div className="prose prose-invert prose-zinc max-w-none prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-code:text-amber-200/90 text-slate-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{skillDetail.body}</ReactMarkdown>
            </div>
          )}

          {!contentLoading && !selectedSkill.hasSkillMd && (
            <p className="text-zinc-500 text-sm">No SKILL.md found for this skill.</p>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <p>Loading skills...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-rose-400 text-sm">
        <p>{error}</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <p>No skills found in ~/.claude/skills</p>
      </div>
    );
  }

  const q = search.toLowerCase().trim();
  const filtered = q
    ? skills.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      )
    : skills;

  return (
    <div className="flex-1 overflow-y-auto w-full">
      <div className="p-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold flex items-center">
            <Layers className="mr-3 text-amber-500" /> Installed Skills
          </h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-md pl-8 pr-3 py-1.5 text-sm text-slate-300 placeholder:text-zinc-600 outline-none transition-colors w-52"
            />
          </div>
        </div>
        <p className="text-zinc-500 text-sm mb-6">
          {q
            ? `${filtered.length} of ${skills.length} skills`
            : (() => {
                const used = skills.filter(s => s.totalCalls > 0).length;
                return used > 0
                  ? `${used} of ${skills.length} skills used`
                  : `${skills.length} skills installed`;
              })()
          }
        </p>
        {filtered.length === 0 ? (
          <p className="text-zinc-500 text-sm">No skills match &ldquo;{search}&rdquo;</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
            {filtered.map(skill => (
              <button
                key={skill.slug}
                onClick={() => openSkill(skill)}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-lg p-4 text-left transition-colors flex flex-col"
              >
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-medium text-slate-200">{skill.name}</span>
                  {skill.trigger && (
                    <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800/50 font-mono">
                      <Zap className="w-2.5 h-2.5" />{skill.trigger}
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-zinc-600 mb-2">{skill.slug}</div>
                {skill.description ? (
                  <p className="text-zinc-500 text-xs flex-1 line-clamp-2">{skill.description}</p>
                ) : (
                  <p className="text-zinc-700 text-xs flex-1 italic">No description</p>
                )}
                <div className="mt-2 flex items-center justify-between text-xs">
                  {skill.totalCalls > 0 ? (
                    <>
                      <span className="text-zinc-400">{skill.totalCalls.toLocaleString()} calls</span>
                      <span className="text-zinc-600">{formatDate(skill.lastUsed)}</span>
                    </>
                  ) : (
                    <span className="text-zinc-700 italic">Never used</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
