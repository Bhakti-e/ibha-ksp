'use client';

import { useState, useEffect } from 'react';
import { getProfiling, getCurrentUser } from '@/lib/api';
import type { ProfilingData } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';

function RiskBadge({ level }: { level: string }) {
  const cls: Record<string, string> = {
    HIGH: 'badge badge-high',
    MEDIUM: 'badge badge-medium',
    LOW: 'badge badge-low',
  };
  return <span className={cls[level] ?? 'badge badge-neutral'}>{level}</span>;
}

export default function ProfilingPage() {
  const [accusedId, setAccusedId] = useState('');
  const [data, setData] = useState<ProfilingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!getCurrentUser()) window.location.href='/login'; }, []);

  const load = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!accusedId.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await getProfiling(accusedId.trim());
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profiling');
      setData(null);
    } finally { setLoading(false); }
  };

  return (
    <BaseLayout>
      <div className="mb-6">
        <h1 className="page-title">Offender Profiling</h1>
        <p className="page-subtitle">Risk scoring, repeat offense, MO similarity, co-accused network</p>
      </div>

      <div className="card p-5 mb-5 shadow-panel">
        <form onSubmit={load} className="flex gap-3">
          <input value={accusedId} onChange={e=>setAccusedId(e.target.value)} placeholder="Accused ID e.g. 13 (Anil Patil), 5 (Mukesh), 8, 11" className="input flex-1" />
          <button disabled={loading || !accusedId.trim()} className="btn btn-primary px-6">{loading?'Loading…':'Profile'}</button>
        </form>
        <p className="text-2xs text-ink-muted mt-2">Try 13 (3 co-accused, risk medium), 5, 8, 11 — IDs from financial test cases</p>
      </div>

      {error && <div className="bg-status-dangerBg border border-status-dangerBorder text-status-danger rounded px-4 py-2 mb-5 text-sm">{error}</div>}

      {data ? (
        <div className="space-y-5">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card p-5 shadow-panel">
              <p className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Accused</p>
              <p className="text-xl font-bold text-ink mt-1">{data.accused.accusedname}</p>
              <p className="text-sm text-ink-secondary">Age {data.accused.ageyear || '—'} · ID {data.accused.accusedmasterid}</p>
              <div className="mt-3 flex items-center gap-2"><RiskBadge level={data.risk_level} /><span className="text-2xl font-bold text-accent">{data.risk_score}</span><span className="text-xs text-ink-muted">/100</span></div>
            </div>
            <div className="card p-5">
              <p className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Repeat & Network</p>
              <p className="text-sm mt-2">Cases: <strong className="text-ink">{data.repeat_count}</strong></p>
              <p className="text-sm">Co-accused: <strong className="text-ink">{data.co_accused_count}</strong></p>
              <p className="text-sm">Recency: <strong className="text-ink">{data.factors.recency || '—'}</strong></p>
              <p className="text-xs text-ink-muted mt-2">Gravity ID: {data.factors.gravity_id} · Co factor: {data.factors.co_accused}</p>
            </div>
            <div className="card p-5">
              <p className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Risk Factors</p>
              <div className="space-y-2 mt-2">
                {['repeat','co_accused','gravity'].map(k => (
                  <div key={k}><div className="flex justify-between text-xs"><span className="text-ink-secondary">{k}</span><span className="text-ink">{JSON.stringify((data.factors as any)[k] ?? '—')}</span></div><div className="w-full bg-navy-border/40 rounded-full h-1.5 mt-1"><div className="bg-accent h-1.5 rounded-full" style={{width: `${Math.min(100, (Number((data.factors as any)[k])||0)*20)}%`}} /></div></div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="card overflow-hidden shadow-panel">
              <div className="section-header"><h2 className="section-title">Cases Involved</h2><span className="badge badge-neutral">{data.cases.length}</span></div>
              <div className="divide-y divide-navy-border/40">
                {data.cases.map((c:any,i:number)=>(
                  <div key={i} className="px-5 py-3">
                    <p className="text-sm font-mono text-accent">{c.crimeno}</p>
                    <p className="text-xs text-ink-secondary">{c.crimeregistereddate} · Gravity {c.gravityoffenceid}</p>
                    <p className="text-xs text-ink mt-1 line-clamp-2">{c.brieffacts?.slice(0,120)}…</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card overflow-hidden shadow-panel">
              <div className="section-header"><h2 className="section-title">Co-Accused Network</h2><span className="badge badge-info">{data.co_accused.length} linked</span></div>
              <div className="divide-y divide-navy-border/40">
                {data.co_accused.map((ca:any)=>(
                  <div key={ca.accusedmasterid} className="px-5 py-3 flex justify-between items-center hover:bg-surface-muted">
                    <div><p className="text-sm font-bold text-ink">{ca.accusedname}</p><p className="text-2xs text-ink-muted">ID {ca.accusedmasterid} · Age {ca.ageyear||'—'}</p></div>
                    <button onClick={()=>{setAccusedId(String(ca.accusedmasterid)); setTimeout(()=>load(),100);}} className="btn btn-secondary text-2xs">View</button>
                  </div>
                ))}
                {data.co_accused.length===0 && <p className="px-5 py-8 text-sm text-ink-muted text-center">No co-accused for this ID (try 13)</p>}
              </div>
            </div>
          </div>

          <div className="card overflow-hidden shadow-panel">
            <div className="section-header"><h2 className="section-title">MO Similar Cases (Embedding Cosine)</h2></div>
            {data.mo_similar_cases.length===0 ? <p className="px-5 py-6 text-sm text-ink-muted text-center">No similar MO found</p> :
              <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Case ID</th><th>Similarity</th></tr></thead><tbody>{data.mo_similar_cases.map((m:any)=><tr key={m.case_id}><td className="font-mono text-accent">{m.case_id}</td><td>{(m.similarity*100).toFixed(1)}%</td></tr>)}</tbody></table></div>
            }
          </div>
        </div>
      ) : !loading && !error && (
        <div className="card py-16 text-center shadow-panel"><p className="text-sm font-medium text-ink">No profile loaded</p><p className="text-xs text-ink-muted mt-1">Enter an Accused ID above</p></div>
      )}
    </BaseLayout>
  );
}
