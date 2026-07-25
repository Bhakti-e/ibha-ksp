'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { getNetwork, getFinancialLinks, getCurrentUser } from '@/lib/api';
import type { NetworkGraph } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';
import { useMock, mockDelay } from '@/lib/mocks/useMock';
import { MOCK_NETWORK_WITH_RISK, MOCK_FINANCIAL_LINKS } from '@/lib/mocks/fixtures';

// D3/Cytoscape requires browser APIs — disable SSR for graph component
const NetworkGraphComponent = dynamic(
  () => import('@/components/network/NetworkGraph'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] bg-surface-muted rounded flex items-center justify-center">
        <span className="text-sm text-ink-muted">Loading network graph…</span>
      </div>
    ),
  }
);

export default function NetworkPage() {
  const [personId, setPersonId] = useState('42');
  const [network, setNetwork] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [showFinancial, setShowFinancial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isMockMode = useMock();

  useEffect(() => {
    // Auto load sample network on mount
    loadNetworkData('42');
  }, []);

  const loadNetworkData = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError('');
    try {
      if (isMockMode) {
        await mockDelay(500);
        setNetwork(MOCK_NETWORK_WITH_RISK);
        setFinancialData(MOCK_FINANCIAL_LINKS);
      } else {
        const netRes = await getNetwork(id);
        setNetwork(netRes);
        try {
          const finRes = await getFinancialLinks(id);
          setFinancialData(finRes);
        } catch {
          setFinancialData(null);
        }
      }
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load network data');
      setNetwork(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadNetworkData(personId);
  };

  const getRiskTierBadge = (tier?: string, score?: number) => {
    if (!tier) return null;
    switch (tier.toUpperCase()) {
      case 'CRITICAL':
        return <span className="badge badge-high animate-pulse">CRITICAL ({score})</span>;
      case 'HIGH':
        return <span className="badge badge-high">HIGH ({score})</span>;
      case 'MEDIUM':
        return <span className="badge badge-medium">MEDIUM ({score})</span>;
      case 'LOW':
        return <span className="badge badge-low">LOW ({score})</span>;
      default:
        return <span className="badge badge-neutral">{tier}</span>;
    }
  };

  return (
    <BaseLayout>
      {/* Page header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">Criminal Network & Risk Analysis</h1>
            {isMockMode && (
              <span className="badge bg-amber-100 text-amber-800 border border-amber-300">
                🧪 Mock Mode
              </span>
            )}
          </div>
          <p className="page-subtitle">
            Co-accused relationship graphs, offender risk scoring, and financial transaction links
          </p>
        </div>

        {/* Financial Overlay Toggle */}
        <button
          type="button"
          onClick={() => setShowFinancial(!showFinancial)}
          className={`btn text-xs gap-1.5 ${
            showFinancial
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'btn-secondary'
          }`}
        >
          💳 {showFinancial ? 'Hide Financial Links' : 'Show Financial Links'}
        </button>
      </div>

      {/* Search control */}
      <div className="card p-5 mb-5 shadow-panel">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            placeholder="Enter Accused ID (e.g. 42, 55, 1)…"
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={loading || !personId.trim()}
            className="btn btn-primary px-6 text-xs"
          >
            {loading ? 'Loading…' : 'Load Network'}
          </button>
        </form>
        <p className="text-2xs text-ink-muted mt-2">
          Sample Accused IDs: <strong>42</strong> (Ramesh Babu — High Risk), <strong>55</strong> (Vijay S. — Critical Risk)
        </p>
      </div>

      {error && (
        <div className="bg-status-dangerBg border border-status-dangerBorder text-status-danger rounded px-4 py-2 mb-5 text-sm">
          {error}
        </div>
      )}

      {/* Financial Transactions Stub View */}
      {showFinancial && financialData && (
        <div className="card p-5 mb-5 border-amber-300 bg-amber-50/50 shadow-panel space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <h3 className="text-xs font-semibold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              💳 Linked Financial Transactions (Accused #{financialData.accused_id})
            </h3>
            <span className="badge badge-medium">
              {financialData.transactions?.filter((t: any) => t.is_suspicious).length} Suspicious Flags
            </span>
          </div>

          <div className="overflow-x-auto rounded border border-amber-200 bg-white">
            <table className="data-table">
              <thead>
                <tr className="bg-amber-100/60 text-amber-900">
                  <th>Date</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Suspicion Flag</th>
                </tr>
              </thead>
              <tbody>
                {financialData.transactions?.map((txn: any) => (
                  <tr key={txn.txn_id} className={txn.is_suspicious ? 'bg-amber-50/80 font-medium' : ''}>
                    <td className="text-2xs text-ink-muted">{txn.txn_date}</td>
                    <td className="text-ink font-semibold">{txn.sender_name}</td>
                    <td className="text-ink">{txn.receiver_name}</td>
                    <td className="font-mono text-accent">₹{txn.amount.toLocaleString()}</td>
                    <td><span className="badge badge-neutral">{txn.txn_type}</span></td>
                    <td>
                      {txn.is_suspicious ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          ⚠️ {txn.suspicion_flag}
                        </span>
                      ) : (
                        <span className="text-2xs text-ink-muted">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Graph & Accused Cards */}
      {network ? (
        <div className="card overflow-hidden shadow-panel">
          {/* Legend + Metadata Bar */}
          <div className="section-header">
            <h2 className="section-title">Co-Accused Graph Topology</h2>
            <div className="flex items-center gap-5 text-xs text-ink-secondary flex-wrap">
              {[
                { color: 'bg-red-600', label: 'Critical Risk' },
                { color: 'bg-amber-600', label: 'High Risk' },
                { color: 'bg-accent', label: 'Co-Accused' },
                { color: 'bg-slate-500', label: 'Cases' },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          {/* Graph Component */}
          <div className="border-b border-slate-100">
            <NetworkGraphComponent data={network} />
          </div>

          {/* Metadata Summary Row */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50/50">
            {[
              { label: 'Total Nodes', value: network.metadata?.total_nodes ?? 0 },
              { label: 'Network Connections', value: network.metadata?.total_edges ?? 0 },
              { label: 'Linked Cases', value: network.metadata?.cases_count ?? 0 },
            ].map((s) => (
              <div key={s.label} className="px-5 py-3.5 text-center">
                <p className="text-2xs font-semibold text-ink-muted uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-bold text-ink mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Accused Persons Cards with Risk Breakdown */}
          <div className="px-5 py-5 border-t border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                Accused Profiles & Risk Explanations
              </h3>
              <span className="text-2xs text-ink-muted">
                Transparent attention-routing heuristic (not for legal use)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {network.nodes
                ?.filter((n: any) => n.data.type === 'person')
                .map((n: any) => {
                  const data = n.data;
                  const exp = data.score_explanation;

                  return (
                    <div
                      key={data.id}
                      className={`p-4 rounded border text-xs space-y-2 transition-all ${
                        data.is_central
                          ? 'border-accent-border bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-ink text-sm flex items-center gap-1.5">
                            {data.label}
                            {data.is_central && (
                              <span className="text-2xs bg-accent text-white px-1.5 py-0.5 rounded font-mono font-normal">
                                Central Hub
                              </span>
                            )}
                          </p>
                          <p className="text-2xs text-ink-muted">ID: {data.id} · Age: {data.age ?? 'Unknown'}</p>
                        </div>
                        {getRiskTierBadge(data.risk_tier, data.risk_score)}
                      </div>

                      {/* Score Explanation Details */}
                      {exp && (
                        <div className="pt-2 border-t border-slate-200/80 space-y-1 text-2xs text-ink-secondary">
                          <p className="font-semibold text-ink-muted uppercase tracking-wider text-[10px]">
                            Score Formula Breakdown:
                          </p>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px]">
                            <span>Priors (Capped): +{exp.prior_fir_capped_contribution}</span>
                            <span>Recency Decay: +{exp.recency_decay_contribution}</span>
                            <span>Violent Flag: +{exp.violent_crime_contribution}</span>
                            <span>Degree Centrality: +{exp.degree_centrality_contribution}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      ) : (
        !loading &&
        !error && (
          <div className="card py-16 text-center shadow-panel">
            <p className="text-sm font-medium text-ink">No network loaded</p>
          </div>
        )
      )}
    </BaseLayout>
  );
}
