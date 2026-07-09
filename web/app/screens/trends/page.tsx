'use client';

import { useState, useEffect } from 'react';
import { getHotspots, getTrendsSummary, getCurrentUser } from '@/lib/api';
import type { Hotspot, TrendData } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';

const PERIODS = [7, 15, 30, 60, 90];

function RiskBadge({ level }: { level: string }) {
  const cls: Record<string, string> = {
    HIGH:   'badge badge-high',
    MEDIUM: 'badge badge-medium',
    LOW:    'badge badge-low',
  };
  return <span className={cls[level] ?? 'badge badge-neutral'}>{level}</span>;
}

function HotspotBar({ count, max }: { count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
      <div className="bg-accent h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="card p-4">
      <p className="text-2xs font-semibold text-ink-muted uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color ?? 'text-ink'}`}>{value}</p>
    </div>
  );
}

export default function TrendsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [trends,   setTrends]   = useState<TrendData[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [days,     setDays]     = useState(30);

  useEffect(() => {
    if (!getCurrentUser()) { window.location.href = '/login'; return; }
    load();
  }, [days]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [h, t] = await Promise.all([getHotspots(days), getTrendsSummary(12)]);
      setHotspots(h.hotspots);
      setTrends(t.trends);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const maxCount = hotspots.length ? Math.max(...hotspots.map(h => h.crime_count)) : 1;

  return (
    <BaseLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Crime Trends &amp; Hotspots</h1>
          <p className="page-subtitle">Crime pattern analysis across stations</p>
        </div>
        {/* Period selector */}
        <div className="flex gap-1">
          {PERIODS.map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                days === d
                  ? 'bg-navy text-white'
                  : 'bg-white text-ink-secondary border border-slate-200 hover:border-slate-300 hover:text-ink'
              }`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-status-dangerBg border border-status-dangerBorder text-status-danger rounded px-4 py-2 mb-5 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="spinner" />
          <span className="ml-3 text-sm text-ink-muted">Loading…</span>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Stations Monitored" value={hotspots.length} />
            <StatCard label="Total Cases"         value={hotspots.reduce((s, h) => s + h.crime_count, 0)} />
            <StatCard label="High Risk"           value={hotspots.filter(h => h.risk_level === 'HIGH').length}   color="text-status-danger" />
            <StatCard label="Medium Risk"         value={hotspots.filter(h => h.risk_level === 'MEDIUM').length} color="text-status-warning" />
          </div>

          {/* Hotspots */}
          <div className="card overflow-hidden shadow-panel">
            <div className="section-header">
              <h2 className="section-title">Crime Hotspots — Last {days} Days</h2>
            </div>
            {hotspots.length === 0 ? (
              <p className="px-5 py-8 text-sm text-ink-muted text-center">No hotspot data available</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {hotspots.map((h, i) => (
                  <div key={h.station_id} className="px-5 py-4 hover:bg-surface-muted transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-ink-muted w-6">#{i+1}</span>
                        <div>
                          <p className="text-sm font-semibold text-ink">{h.station_name}</p>
                          <p className="text-2xs text-ink-muted">Station {h.station_id}</p>
                        </div>
                      </div>
                      <RiskBadge level={h.risk_level} />
                    </div>
                    <HotspotBar count={h.crime_count} max={maxCount} />
                    <div className="flex gap-6 mt-2 text-xs text-ink-secondary">
                      <span>Total: <strong className="text-ink">{h.crime_count}</strong></span>
                      <span>Heinous: <strong className="text-status-danger">{h.heinous_count}</strong></span>
                      <span>Change: <strong className={h.change_percentage > 0 ? 'text-status-danger' : 'text-status-success'}>
                        {h.change_percentage > 0 ? '+' : ''}{h.change_percentage.toFixed(1)}%
                      </strong></span>
                    </div>
                    {h.reason && <p className="text-2xs text-ink-muted mt-1">{h.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly trends table */}
          <div className="card overflow-hidden shadow-panel">
            <div className="section-header">
              <h2 className="section-title">Monthly Crime Breakdown</h2>
            </div>
            {trends.length === 0 ? (
              <p className="px-5 py-8 text-sm text-ink-muted text-center">No trend data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Crime Type</th>
                      <th className="text-right">Cases</th>
                      <th className="text-right">Unique</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.slice(0, 20).map((t, i) => (
                      <tr key={i}>
                        <td className="font-mono text-xs text-ink-secondary">{t.month}</td>
                        <td>{t.crime_type}</td>
                        <td className="text-right font-semibold">{t.case_count}</td>
                        <td className="text-right text-ink-secondary">{t.unique_crimes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </BaseLayout>
  );
}
