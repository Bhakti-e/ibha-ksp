'use client';

import { useState, useEffect, useRef } from 'react';
import { getNetwork, getCurrentUser } from '@/lib/api';
import type { NetworkGraph } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';

function drawGraph(canvas: HTMLCanvasElement, network: NetworkGraph) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width  = canvas.offsetWidth;
  canvas.height = 520;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r  = Math.min(cx, cy) * 0.65;

  const pos: Record<string, { x: number; y: number }> = {};
  network.nodes.forEach((n, i) => {
    const angle = (i / network.nodes.length) * 2 * Math.PI - Math.PI / 2;
    pos[n.data.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  if (network.nodes.length === 1) pos[network.nodes[0].data.id] = { x: cx, y: cy };

  // Edges
  ctx.strokeStyle = '#334155';
  ctx.lineWidth   = 1.5;
  network.edges.forEach(e => {
    const s = pos[e.data.source], t = pos[e.data.target];
    if (!s || !t) return;
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); ctx.stroke();
  });

  // Nodes
  network.nodes.forEach(n => {
    const p = pos[n.data.id]; if (!p) return;
    const isPerson  = n.data.type === 'person';
    const isCentral = n.data.is_central;
    const nodeR     = isCentral ? 26 : isPerson ? 20 : 14;

    ctx.beginPath();
    ctx.arc(p.x, p.y, nodeR, 0, 2 * Math.PI);
    ctx.fillStyle = isCentral ? '#f59e0b' : isPerson ? '#3b82f6' : '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle  = '#e2e8f0';
    ctx.font       = `${isCentral ? 12 : 10}px sans-serif`;
    ctx.textAlign  = 'center';
    const label    = n.data.label.length > 18 ? n.data.label.slice(0, 17) + '…' : n.data.label;
    ctx.fillText(label, p.x, p.y + nodeR + 14);
  });
}

export default function NetworkPage() {
  const [personId, setPersonId] = useState('');
  const [network,  setNetwork]  = useState<NetworkGraph | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!getCurrentUser()) { window.location.href = '/login'; return; }
  }, []);

  useEffect(() => {
    if (network && canvasRef.current) drawGraph(canvasRef.current, network);
  }, [network]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId.trim()) return;
    setLoading(true); setError('');
    try {
      setNetwork(await getNetwork(personId));
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load network');
      setNetwork(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Criminal Network Analysis</h1>
        <p className="text-slate-400 text-sm mt-0.5">Visualise connections between accused and cases</p>
      </div>

      {/* Search */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={personId}
            onChange={e => setPersonId(e.target.value)}
            placeholder="Enter Accused ID (e.g. 1, 2, 3…)"
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !personId.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Loading…' : 'Load Network'}
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-2">Try IDs: 1 (Ravi Kumar), 2, 3, 4</p>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-700 text-red-300 rounded-xl px-4 py-3 mb-6 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Graph */}
      {network ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {/* Legend */}
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-white font-semibold">Network Graph</h2>
            <div className="flex gap-5 text-sm text-slate-300">
              {[
                { color: 'bg-yellow-500', label: 'Central Person' },
                { color: 'bg-blue-500',   label: 'Co-Accused' },
                { color: 'bg-red-500',    label: 'Cases' },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full ${l.color}`} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: '520px', display: 'block', backgroundColor: '#0f172a' }}
          />

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-slate-700 border-t border-slate-700">
            {[
              { label: 'Nodes',       value: network.metadata.total_nodes },
              { label: 'Connections', value: network.metadata.total_edges },
              { label: 'Cases',       value: network.metadata.cases_count },
            ].map(s => (
              <div key={s.label} className="px-5 py-4 text-center">
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Person list */}
          <div className="px-5 py-4 border-t border-slate-700">
            <h3 className="text-slate-300 font-medium mb-3 text-sm">Accused Persons</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {network.nodes.filter(n => n.data.type === 'person').map(n => (
                <div key={n.data.id} className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-white text-sm font-medium">{n.data.label}</p>
                    <p className="text-slate-500 text-xs">{n.data.age ? `Age ${n.data.age}` : 'Age unknown'}</p>
                  </div>
                  {n.data.is_central && (
                    <span className="px-2 py-0.5 bg-yellow-900/60 text-yellow-300 text-xs rounded-full border border-yellow-700">Central</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !loading && !error && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl py-16 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-slate-400">Enter an Accused ID to visualise their network</p>
        </div>
      )}
    </BaseLayout>
  );
}
