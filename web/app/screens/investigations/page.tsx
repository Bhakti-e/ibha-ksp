'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getNetwork, getProfiling, getCaseSummary, getSimilarCases, getCaseTimeline, getCaseLeads, getFinancialTransactions, getCurrentUser } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';

const NetworkGraph = dynamic(() => import('@/components/network/NetworkGraph'), { ssr: false, loading: () => <div className="h-[520px] bg-surface-card/40 rounded-xl animate-pulse" /> });
const INVESTIGATION_STATE_KEY = 'ibha-investigation-state';

function RiskBadge({ level }: { level: string }) {
  const cls: Record<string, string> = { HIGH: 'badge badge-high', MEDIUM: 'badge badge-medium', LOW: 'badge badge-low' };
  return <span className={cls[level] ?? 'badge badge-neutral'}>{level}</span>;
}

function SummaryPanel({ summary }: { summary: any }) {
  const structured = summary?.summary_structured;
  if (!structured) {
    return <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap bg-surface-card/40 p-4 rounded-xl border border-navy-border/20">{summary?.summary}</p>;
  }
  return (
    <div className="bg-surface-card/40 p-4 rounded-xl border border-navy-border/20 space-y-4">
      {[
        ['Incident', structured.incident],
        ['Suspects', structured.suspects],
        ['Status', structured.status],
      ].map(([label, value]) => value && (
        <div key={label as string}>
          <p className="text-[10px] uppercase tracking-widest text-accent mb-1">{label}</p>
          <p className="text-sm text-ink leading-relaxed">{value as string}</p>
        </div>
      ))}
      {Array.isArray(structured.next_steps) && structured.next_steps.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-accent mb-2">Next Steps</p>
          <div className="space-y-2">
            {structured.next_steps.map((step: string, i: number) => (
              <div key={i} className="flex gap-2 text-sm text-ink-secondary">
                <span className="text-accent font-bold">{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvestigationsPage() {
  const [accusedId, setAccusedId] = useState('13');
  const [caseId, setCaseId] = useState('31');
  const [network, setNetwork] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [financial, setFinancial] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getCurrentUser()) { window.location.href='/login'; return; }
    const saved = localStorage.getItem(INVESTIGATION_STATE_KEY);
    if (saved) {
      try {
        const s = JSON.parse(saved);
        setAccusedId(s.accusedId ?? '13');
        setCaseId(s.caseId ?? '31');
        setNetwork(s.network ?? null);
        setProfile(s.profile ?? null);
        setSummary(s.summary ?? null);
        setSimilar(s.similar ?? []);
        setTimeline(s.timeline ?? []);
        setLeads(s.leads ?? []);
        setFinancial(s.financial ?? []);
        return;
      } catch {
        localStorage.removeItem(INVESTIGATION_STATE_KEY);
      }
    }
    loadAll();
  }, []);

  useEffect(() => {
    localStorage.setItem(INVESTIGATION_STATE_KEY, JSON.stringify({ accusedId, caseId, network, profile, summary, similar, timeline, leads, financial }));
  }, [accusedId, caseId, network, profile, summary, similar, timeline, leads, financial]);

  const loadAll = async () => {
    if (!accusedId && !caseId) return;
    setLoading(true); setError('');
    try {
      const networkPromise = accusedId ? getNetwork(accusedId) : Promise.resolve(null);
      const profileResult = accusedId ? await getProfiling(accusedId) : null;
      const resolvedCaseId = caseId.trim() || profileResult?.cases?.[0]?.casemasterid?.toString() || '';
      if (!caseId.trim() && resolvedCaseId) setCaseId(resolvedCaseId);

      const results = await Promise.allSettled([
        networkPromise,
        Promise.resolve(profileResult),
        resolvedCaseId ? getCaseSummary(resolvedCaseId) : Promise.resolve(null),
        resolvedCaseId ? getSimilarCases(resolvedCaseId) : Promise.resolve(null),
        resolvedCaseId ? getCaseTimeline(resolvedCaseId) : Promise.resolve(null),
        resolvedCaseId ? getCaseLeads(resolvedCaseId) : Promise.resolve(null),
        resolvedCaseId ? getFinancialTransactions(resolvedCaseId).catch(()=>({transactions:[]})) : Promise.resolve(null),
      ]);
      if (results[0].status==='fulfilled') setNetwork(results[0].value);
      if (results[1].status==='fulfilled') setProfile(results[1].value);
      if (results[2].status==='fulfilled') setSummary(results[2].value);
      if (results[3].status==='fulfilled') setSimilar((results[3].value as any)?.similar_cases || []);
      if (results[4].status==='fulfilled') setTimeline((results[4].value as any)?.timeline || []);
      if (results[5].status==='fulfilled') setLeads((results[5].value as any)?.leads || []);
      if (results[6].status==='fulfilled') setFinancial((results[6].value as any)?.transactions || []);
    } catch (e: any) { setError(e.response?.data?.error || 'Failed to load'); }
    finally { setLoading(false); }
  };

  return (
    <BaseLayout>
      <div className="mb-8">
        <h1 className="page-title">Investigations Hub</h1>
        <p className="page-subtitle">Network → Profiling → Decision Support in one flow — no nav bloat</p>
      </div>

      {/* Unified search bar - less boxes */}
      <div className="flex flex-col md:flex-row gap-3 mb-8 p-4 rounded-2xl bg-surface-card/60 border border-navy-border/20">
        <div className="flex-1 flex gap-2">
          <input value={accusedId} onChange={e=>{ setAccusedId(e.target.value); setCaseId(''); }} placeholder="Accused ID (13, 5, 8, 11)" className="input flex-1" />
          <input value={caseId} onChange={e=>setCaseId(e.target.value)} placeholder="Case ID (31,14,21,29)" className="input flex-1" />
        </div>
        <button onClick={loadAll} disabled={loading} className="btn btn-primary px-8 self-start md:self-auto">{loading?'Loading…':'Investigate'}</button>
      </div>

      {error && <div className="bg-status-dangerBg border border-status-dangerBorder text-status-danger rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>}

      <div className="space-y-10">
        {/* Network */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-bold tracking-widest uppercase text-ink">1. Criminal Network</h2>
            <span className="text-[11px] text-ink-muted">{network ? `${network.metadata.total_nodes} nodes • ${network.metadata.total_edges} edges • ${network.metadata.cases_count} cases` : 'Enter Accused ID'}</span>
          </div>
          {network ? <NetworkGraph data={network} /> : <div className="h-[320px] rounded-xl bg-surface-card/30 border border-dashed border-navy-border/30 flex items-center justify-center text-sm text-ink-muted">No network loaded — try 13</div>}
          <p className="text-[11px] text-ink-muted mt-2">Canvas • Drag node individually (fixed), drag background to pan, scroll to zoom. ID 13 = Anil Patil triangle gang.</p>
        </section>

        {/* Profiling */}
        <section className="border-t border-navy-border/20 pt-8">
          <h2 className="text-sm font-bold tracking-widest uppercase text-ink mb-4">2. Offender Profiling — Focus 5</h2>
          {profile ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-widest text-ink-muted">Subject</p>
                <p className="text-xl font-bold text-ink">{profile.accused.accusedname}</p>
                <p className="text-xs text-ink-secondary">ID {profile.accused.accusedmasterid} • Age {profile.accused.ageyear || '—'} • {profile.repeat_count} cases</p>
                <div className="flex items-center gap-2 mt-3"><RiskBadge level={profile.risk_level} /><span className="text-2xl font-bold text-accent">{profile.risk_score}</span><span className="text-xs text-ink-muted">/100</span></div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-widest text-ink-muted">Co-accused ({profile.co_accused.length})</p>
                {profile.co_accused.map((ca:any)=><div key={ca.accusedmasterid} className="flex justify-between text-sm"><span className="text-ink">{ca.accusedname}</span><span className="text-ink-muted text-xs">ID {ca.accusedmasterid}</span></div>)}
                {profile.co_accused.length===0 && <p className="text-xs text-ink-muted">No co-accused — try 13</p>}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-ink-muted mb-2">MO Similarity</p>
                {profile.mo_similar_cases.length===0 ? <p className="text-xs text-ink-muted">None</p> : profile.mo_similar_cases.map((m:any)=><div key={m.case_id} className="flex justify-between text-xs py-1"><span className="font-mono text-accent">{m.case_id}</span><span className="text-ink-muted">{(m.similarity*100).toFixed(1)}%</span></div>)}
              </div>
            </div>
          ) : <p className="text-sm text-ink-muted">Profile appears after search — try 13</p>}
        </section>

        {/* Decision Support */}
        <section className="border-t border-navy-border/20 pt-8">
          <h2 className="text-sm font-bold tracking-widest uppercase text-ink mb-4">3. Decision Support — Focus 6</h2>
          {!summary ? <p className="text-sm text-ink-muted">Enter Case ID (31 has richest data — 3 accused + financial) and click Investigate</p> : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-ink-muted mb-2">AI Summary {summary.source==='openrouter' ? '(OpenRouter Agent)' : '(Template)'}</p>
                  <SummaryPanel summary={summary} />
                  <p className="text-[11px] text-ink-muted mt-2">FIR {summary.case?.crimeno} • {summary.case?.crimeregistereddate} • Gravity {summary.case?.gravityoffenceid}</p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-widest text-ink-muted mb-2">Similar Cases (Embedding)</p>
                  <div className="space-y-2">
                    {similar.slice(0,4).map((c:any)=><div key={c.casemasterid} className="flex gap-3 text-xs p-2 rounded-lg bg-surface-card/30"><span className="font-mono text-accent">{c.crimeno}</span><span className="text-ink-muted flex-1 truncate">{c.brieffacts?.slice(0,80)}…</span><span className="text-accent font-bold">{(c.similarity*100).toFixed(0)}%</span></div>)}
                  </div>
                </div>

                {financial.length>0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-ink-muted mb-2">Financial Links — TEST DATA</p>
                    <div className="space-y-1.5">
                      {financial.map((f:any,i:number)=><div key={i} className="flex justify-between text-xs p-2 rounded-lg bg-accent/10 border border-accent/20"><span className="font-mono text-ink">{f.from_holder} → {f.to_holder}</span><span className={`badge ${f.flagged?'badge-high':'badge-neutral'}`}>₹{f.amount}</span></div>)}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-ink-muted mb-3">Timeline</p>
                  <div className="space-y-3 relative pl-4 border-l border-navy-border/20">
                    {timeline.map((ev:any,i:number)=><div key={i} className="relative"><div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-accent" /><p className="text-xs font-bold text-ink">{ev.title}</p><p className="text-[11px] text-ink-muted">{ev.date} • {ev.type}</p></div>)}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-ink-muted mb-3">Leads</p>
                  <div className="space-y-2">
                    {leads.map((l:any,i:number)=><div key={i} className="flex gap-2 p-2 rounded-lg bg-surface-card/50 border border-navy-border/20"><span className={`badge ${l.priority==='HIGH'?'badge-high':'badge-medium'} h-fit text-[10px]`}>{l.priority}</span><p className="text-xs text-ink flex-1">{l.description}</p></div>)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </BaseLayout>
  );
}
