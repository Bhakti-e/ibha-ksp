'use client';

import { useState, useEffect } from 'react';
import { getCaseSummary, getSimilarCases, getCaseTimeline, getCaseLeads, getCurrentUser, getFinancialTransactions } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';

const INVESTIGATION_PAGE_STATE_KEY = 'ibha-decision-support-state';

function SummaryPanel({ summary }: { summary: any }) {
  const structured = summary?.summary_structured;
  if (!structured) {
    return <p className="text-sm text-ink whitespace-pre-wrap">{summary?.summary}</p>;
  }
  return (
    <div className="space-y-4">
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

export default function InvestigationPage() {
  const [caseId, setCaseId] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [financial, setFinancial] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getCurrentUser()) { window.location.href='/login'; return; }
    const saved = localStorage.getItem(INVESTIGATION_PAGE_STATE_KEY);
    if (!saved) return;
    try {
      const s = JSON.parse(saved);
      setCaseId(s.caseId ?? '');
      setSummary(s.summary ?? null);
      setSimilar(s.similar ?? []);
      setTimeline(s.timeline ?? []);
      setLeads(s.leads ?? []);
      setFinancial(s.financial ?? []);
    } catch {
      localStorage.removeItem(INVESTIGATION_PAGE_STATE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(INVESTIGATION_PAGE_STATE_KEY, JSON.stringify({ caseId, summary, similar, timeline, leads, financial }));
  }, [caseId, summary, similar, timeline, leads, financial]);

  const load = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!caseId.trim()) return;
    setLoading(true); setError('');
    try {
      const [s, sim, tl, ld, fin] = await Promise.all([
        getCaseSummary(caseId.trim()),
        getSimilarCases(caseId.trim()),
        getCaseTimeline(caseId.trim()),
        getCaseLeads(caseId.trim()),
        getFinancialTransactions(caseId.trim()).catch(()=>({transactions:[]}))
      ]);
      setSummary(s);
      setSimilar(sim.similar_cases || []);
      setTimeline(tl.timeline || []);
      setLeads(ld.leads || []);
      setFinancial((fin as any).transactions || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load investigation data');
    } finally { setLoading(false); }
  };

  const exportPDF = async () => {
    if (!summary) return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFont('courier');
    doc.text(`IBHA Investigation Report - Case ${caseId}`, 10, 15);
    doc.text(`FIR: ${summary.case?.crimeno || '—'}`, 10, 25);
    doc.text(`Summary:`, 10, 35);
    const lines = doc.splitTextToSize(summary.summary || '', 180);
    doc.text(lines, 10, 45);
    let y = 45 + lines.length*6 + 10;
    doc.text(`Similar Cases:`, 10, y); y+=8;
    similar.slice(0,3).forEach((c:any)=>{ doc.text(`- ${c.crimeno} (${(c.similarity*100).toFixed(1)}%)`, 12, y); y+=6; });
    y+=6;
    doc.text(`Leads:`, 10, y); y+=8;
    leads.slice(0,4).forEach((l:any)=>{ doc.text(`- [${l.priority}] ${l.description.slice(0,80)}`, 12, y); y+=6; });
    doc.save(`investigation-${caseId}.pdf`);
  };

  return (
    <BaseLayout>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-title">Investigator Decision Support</h1><p className="page-subtitle">Auto summary, similar cases, timeline, leads — Focus 6</p></div>
        <div className="flex gap-2">
          <button onClick={exportPDF} disabled={!summary} className="btn btn-secondary text-xs">Export PDF</button>
          <button onClick={()=>load()} disabled={loading} className="btn btn-primary text-xs">{loading?'Loading…':'Reload'}</button>
        </div>
      </div>

      <div className="card p-5 mb-5 shadow-panel">
        <form onSubmit={load} className="flex gap-3">
          <input value={caseId} onChange={e=>setCaseId(e.target.value)} placeholder="Case ID e.g. 31 (drug trafficking, 3 accused), 14, 21, 29" className="input flex-1" />
          <button disabled={loading || !caseId.trim()} className="btn btn-primary px-6">{loading?'Loading…':'Investigate'}</button>
        </form>
        <p className="text-2xs text-ink-muted mt-2">Try 31 (Anil Patil case with financial test data), 14, 21, 29 — multi-accused cases have richest data</p>
      </div>

      {error && <div className="bg-status-dangerBg border border-status-dangerBorder text-status-danger rounded px-4 py-2 mb-5 text-sm">{error}</div>}

      {summary ? (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-5 shadow-panel">
              <h2 className="section-title mb-3">AI Case Summary {summary.source==='openrouter' ? <span className="badge badge-info ml-2">OpenRouter Agent</span> : <span className="badge badge-neutral">Template fallback</span>}</h2>
              <SummaryPanel summary={summary} />
              <div className="mt-3 text-xs text-ink-muted">FIR {summary.case?.crimeno} · Registered {summary.case?.crimeregistereddate} · Gravity {summary.case?.gravityoffenceid} · Lat {summary.case?.latitude} Lon {summary.case?.longitude}</div>
            </div>

            <div className="card overflow-hidden shadow-panel">
              <div className="section-header"><h2 className="section-title">Similar Past Cases (Embedding Cosine)</h2><span className="badge badge-neutral">{similar.length}</span></div>
              {similar.length===0 ? <p className="px-5 py-6 text-sm text-ink-muted text-center">No similar cases found</p> :
                <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>FIR No</th><th>Date</th><th>Sim</th><th>Facts</th></tr></thead><tbody>{similar.map((c:any)=>(<tr key={c.casemasterid}><td className="font-mono text-accent text-xs">{c.crimeno}</td><td className="text-xs">{c.crimeregistereddate}</td><td className="text-xs font-bold text-accent">{(c.similarity*100).toFixed(1)}%</td><td className="text-xs max-w-xs truncate" title={c.brieffacts}>{c.brieffacts?.slice(0,80)}…</td></tr>))}</tbody></table></div>
              }
            </div>

            {financial.length>0 && (
              <div className="card overflow-hidden shadow-panel border-accent-border">
                <div className="section-header"><h2 className="section-title">Financial Links — TEST DATA</h2><span className="badge badge-high">Flagged</span></div>
                <div className="divide-y divide-navy-border/40">{financial.map((f:any,i:number)=>(<div key={i} className="px-5 py-3 flex justify-between"><div><p className="text-xs font-mono text-accent">{f.from_holder} → {f.to_holder}</p><p className="text-2xs text-ink-muted">{f.notes} · {f.ts}</p></div><span className={`badge ${f.flagged?'badge-high':'badge-neutral'}`}>₹{f.amount?.toLocaleString()}</span></div>))}</div>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="card p-5 shadow-panel">
              <h2 className="section-title mb-3">Investigation Timeline</h2>
              <div className="space-y-3">
                {timeline.map((ev:any,i:number)=>(
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                    <div><p className="text-xs font-bold text-ink">{ev.title}</p><p className="text-2xs text-ink-muted">{ev.date} · {ev.type}</p></div>
                  </div>
                ))}
                {timeline.length===0 && <p className="text-xs text-ink-muted">No timeline events</p>}
              </div>
            </div>

            <div className="card p-5 shadow-panel">
              <h2 className="section-title mb-3">Recommended Leads</h2>
              <div className="space-y-2">
                {leads.map((l:any,i:number)=>(
                  <div key={i} className="flex gap-2 p-2 rounded border border-navy-border/40 hover:border-accent/50">
                    <span className={`badge ${l.priority==='HIGH'?'badge-high':l.priority==='MEDIUM'?'badge-medium':'badge-neutral'} h-fit`}>{l.priority}</span>
                    <p className="text-xs text-ink flex-1">{l.description}</p>
                  </div>
                ))}
                {leads.length===0 && <p className="text-xs text-ink-muted">No leads</p>}
              </div>
            </div>
          </div>
        </div>
      ) : !loading && !error && (
        <div className="card py-16 text-center shadow-panel"><p className="text-sm font-medium text-ink">No case loaded</p><p className="text-xs text-ink-muted mt-1">Enter a Case ID above and click Investigate</p></div>
      )}
    </BaseLayout>
  );
}
