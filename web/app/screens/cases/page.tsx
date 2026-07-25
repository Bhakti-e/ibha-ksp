'use client';

import { useState, useEffect } from 'react';
import BaseLayout from '@/components/layout/BaseLayout';
import { useMock, mockDelay } from '@/lib/mocks/useMock';
import { MOCK_CASE_SUMMARY, MOCK_SIMILAR_CASES } from '@/lib/mocks/fixtures';
import { getCaseSummary, getSimilarCases } from '@/lib/api';

export default function CaseDecisionSupportPage() {
  const [caseIdInput, setCaseIdInput] = useState<string>('101');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('101');
  const [summaryData, setSummaryData] = useState<any>(null);
  const [similarCasesData, setSimilarCasesData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isMockMode = useMock();

  useEffect(() => {
    fetchCaseData(selectedCaseId);
  }, [selectedCaseId]);

  const fetchCaseData = async (id: string) => {
    setLoading(true);
    try {
      if (isMockMode) {
        await mockDelay(600);
        setSummaryData(MOCK_CASE_SUMMARY);
        setSimilarCasesData(MOCK_SIMILAR_CASES);
      } else {
        const [sumRes, simRes] = await Promise.all([
          getCaseSummary(id),
          getSimilarCases(id),
        ]);
        setSummaryData(sumRes);
        setSimilarCasesData(simRes);
      }
    } catch (err) {
      console.error('Failed to fetch case decision support data:', err);
      setSummaryData(MOCK_CASE_SUMMARY);
      setSimilarCasesData(MOCK_SIMILAR_CASES);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseIdInput.trim()) return;
    setSelectedCaseId(caseIdInput.trim());
  };

  return (
    <BaseLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title">Investigator Decision Support</h1>
              {isMockMode && (
                <span className="badge bg-amber-100 text-amber-800 border border-amber-300">
                  🧪 Mock Mode
                </span>
              )}
            </div>
            <p className="page-subtitle">
              Automated case summarisation, precedent matching, and risk-aware investigator routing
            </p>
          </div>

          {/* Case Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={caseIdInput}
              onChange={(e) => setCaseIdInput(e.target.value)}
              placeholder="Enter Case ID or FIR No (e.g. 101)…"
              className="input w-64 text-xs"
            />
            <button type="submit" className="btn btn-primary text-xs px-4">
              Inspect Case
            </button>
          </form>
        </div>

        {loading ? (
          <div className="card p-12 flex flex-col items-center justify-center gap-3">
            <span className="spinner w-8 h-8 border-accent" />
            <p className="text-sm text-ink-secondary">Analyzing case facts and finding precedent patterns…</p>
          </div>
        ) : (
          <>
            {/* Case Header Details */}
            {summaryData && (
              <div className="card p-5 bg-white border-slate-200 shadow-panel space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-accent bg-accent-light px-2 py-0.5 rounded border border-accent-border">
                        {summaryData.crime_no}
                      </span>
                      <span className="badge badge-info">{summaryData.status}</span>
                    </div>
                    <h2 className="text-base font-semibold text-ink mt-1">{summaryData.crime_type}</h2>
                  </div>

                  <div className="text-right text-2xs text-ink-muted">
                    <p>Station: <strong className="text-slate-700">{summaryData.station}</strong></p>
                    <p>IO: <strong className="text-slate-700">{summaryData.investigating_officer}</strong></p>
                    <p>Registered: <strong className="text-slate-700">{summaryData.registered_date}</strong></p>
                  </div>
                </div>

                {/* LLM Summary Card */}
                <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📋</span>
                    <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
                      AI Executive Summary
                    </h3>
                  </div>
                  <p className="text-sm text-ink leading-relaxed font-normal">
                    {summaryData.llm_summary}
                  </p>
                </div>

                {/* Accused & Victim Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Accused List */}
                  <div className="border border-slate-200 rounded p-3 bg-white">
                    <p className="text-2xs font-semibold text-ink-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
                      ⚖️ Accused Person(s)
                    </p>
                    <div className="space-y-2">
                      {summaryData.accused?.map((acc: any) => (
                        <div key={acc.accused_id} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                          <div>
                            <p className="font-semibold text-ink">{acc.name} ({acc.age} yrs)</p>
                            <p className="text-2xs text-ink-muted">Priors on record: {acc.prior_firs}</p>
                          </div>
                          <div className="text-right">
                            <span className={`badge ${acc.risk_tier === 'HIGH' || acc.risk_tier === 'CRITICAL' ? 'badge-high' : 'badge-medium'}`}>
                              {acc.risk_tier} RISK ({acc.risk_score})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Victim List */}
                  <div className="border border-slate-200 rounded p-3 bg-white">
                    <p className="text-2xs font-semibold text-ink-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
                      🛡️ Victim(s)
                    </p>
                    <div className="space-y-2">
                      {summaryData.victims?.map((vic: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                          <div>
                            <p className="font-semibold text-ink">{vic.name} ({vic.age} yrs)</p>
                            <p className="text-2xs text-ink-muted">Occupation: {vic.occupation}</p>
                          </div>
                          <span className="badge badge-neutral">{vic.area_type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Similar Past Cases (Precedents) */}
            {similarCasesData && (
              <div className="card p-5 bg-white border-slate-200">
                <div className="section-header px-0 pt-0 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="section-title flex items-center gap-2">
                      <span>🔗 Precedent Matching — Similar Past Cases</span>
                    </h3>
                    <p className="text-2xs text-ink-muted mt-0.5">
                      Matched by crime category, police station jurisdiction, and temporal proximity (±180 days)
                    </p>
                  </div>
                  <span className="badge badge-info">{similarCasesData.similar_cases?.length ?? 0} matches</span>
                </div>

                <div className="space-y-3">
                  {similarCasesData.similar_cases?.map((c: any) => (
                    <div
                      key={c.case_id}
                      className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-accent-border rounded transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-accent">{c.crime_no}</span>
                          <span className="badge badge-neutral">{c.crime_type}</span>
                          <span className="text-2xs text-ink-muted">{c.date}</span>
                        </div>
                        <p className="text-ink-secondary">Place of Offence: <strong className="text-ink">{c.place}</strong></p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-2xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ {c.similarity_reason}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </BaseLayout>
  );
}
