'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { getNetwork, getCurrentUser } from '@/lib/api';
import type { NetworkGraph } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';

// D3 requires browser APIs — disable SSR for the graph component
const NetworkGraph = dynamic(
  () => import('@/components/network/NetworkGraph'),
  { ssr: false, loading: () => <div className="h-[520px] bg-surface-muted rounded flex items-center justify-center"><span className="text-sm text-ink-muted">Loading graph…</span></div> }
);

export default function NetworkPage() {
  const [personId, setPersonId] = useState('');
  const [network,  setNetwork]  = useState<NetworkGraph | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!getCurrentUser()) { window.location.href = '/login'; }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId.trim()) return;
    setLoading(true); setError('');
    try {
      setNetwork(await getNetwork(personId));
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load network data');
      setNetwork(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseLayout>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="page-title">Criminal Network Analysis</h1>
        <p className="page-subtitle">Visualise connections between accused persons and cases</p>
      </div>

      {/* Search control */}
      <div className="card p-5 mb-5 shadow-panel">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={personId}
            onChange={e => setPersonId(e.target.value)}
            placeholder="Enter Accused ID (e.g. 1, 2, 3)"
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={loading || !personId.trim()}
            className="btn btn-primary px-6"
          >
            {loading ? 'Loading…' : 'Load Network'}
          </button>
        </form>
        <p className="text-2xs text-ink-muted mt-2">
          Sample IDs from seed data: 1 (Ravi Kumar), 2 (Deepak Shetty), 3, 4
        </p>
      </div>

      {error && (
        <div className="bg-status-dangerBg border border-status-dangerBorder text-status-danger rounded px-4 py-2 mb-5 text-sm">
          {error}
        </div>
      )}

      {/* Graph */}
      {network ? (
        <div className="card overflow-hidden shadow-panel">
          {/* Legend + metadata bar */}
          <div className="section-header">
            <h2 className="section-title">Network Graph</h2>
            <div className="flex items-center gap-5 text-xs text-ink-secondary">
              {[
                { color: 'bg-amber-700',  label: 'Central Person' },
                { color: 'bg-accent',     label: 'Co-Accused' },
                { color: 'bg-slate-500',  label: 'Cases' },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          {/* D3 graph */}
          <div className="border-b border-slate-100">
            <NetworkGraph data={network} />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {[
              { label: 'Total Nodes',  value: network.metadata.total_nodes  },
              { label: 'Connections',  value: network.metadata.total_edges  },
              { label: 'Cases Linked', value: network.metadata.cases_count  },
            ].map(s => (
              <div key={s.label} className="px-5 py-4 text-center">
                <p className="text-2xs font-semibold text-ink-muted uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-ink mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Persons list */}
          <div className="px-5 py-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Accused Persons</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {network.nodes.filter(n => n.data.type === 'person').map(n => (
                <div key={n.data.id} className="flex items-center justify-between px-3 py-2 rounded border border-slate-100 bg-surface-muted">
                  <div>
                    <p className="text-sm font-medium text-ink">{n.data.label}</p>
                    <p className="text-2xs text-ink-muted">{n.data.age ? `Age ${n.data.age}` : 'Age unknown'}</p>
                  </div>
                  {n.data.is_central && (
                    <span className="badge badge-medium">Central</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !loading && !error && (
        <div className="card py-16 text-center shadow-panel">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857
                   M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857
                   m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-ink">No network loaded</p>
          <p className="text-xs text-ink-muted mt-1">Enter an Accused ID above and click Load Network</p>
        </div>
      )}
    </BaseLayout>
  );
}
