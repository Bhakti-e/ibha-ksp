'use client';

import { useState, useEffect } from 'react';
import { getHotspots, getTrendsSummary, getCurrentUser } from '@/lib/api';
import type { Hotspot, TrendData } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';

const PERIODS = [7, 15, 30, 60, 90];

function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    HIGH:   'bg-red-900/60 text-red-300 border border-red-700',
    MEDIUM: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
    LOW:    'bg-green-900/60 text-green-300 border border-green-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[level] ?? 'bg-slate-700 text-slate-300'}`}>
      {level}
    </span>
  );
}

// Simple visual bar using div widths
function HotspotBar({ count, max }: { count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
      <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Crime Trends &amp; Hotspots</h1>
          <p className="text-slate-400 text-sm mt-0.5">Crime pattern analysis across stations</p>
        </div>
        {/* Period selector */}
        <div className="flex gap-1.5">
          {PERIODS.map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-700 text-red-300 rounded-xl px-4 py-3 mb-6 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading trends…</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Hotspot Stations</p>
              <p className="text-3xl font-bold text-white mt-1">{hotspots.length}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Total Cases</p>
              <p className="text-3xl font-bold text-white mt-1">
                {hotspots.reduce((s, h) => s + h.crime_count, 0)}
              </p>
            </div>
            <div className="bg-red-950/50 border border-red-800 rounded-xl p-4">
              <p className="text-red-400 text-xs font-medium uppercase tracking-wide">High Risk</p>
              <p className="text-3xl font-bold text-red-300 mt-1">
                {hotspots.filter(h => h.risk_level === 'HIGH').length}
              </p>
            </div>
            <div className="bg-yellow-950/50 border border-yellow-800 rounded-xl p-4">
              <p className="text-yellow-400 text-xs font-medium uppercase tracking-wide">Medium Risk</p>
              <p className="text-3xl font-bold text-yellow-300 mt-1">
                {hotspots.filter(h => h.risk_level === 'MEDIUM').length}
              </p>
            </div>
          </div>

          {/* Hotspots list */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-semibold">Crime Hotspots — Last {days} Days</h2>
            </div>
            {hotspots.length === 0 ? (
              <p className="px-5 py-8 text-slate-500 text-center">No hotspot data available</p>
            ) : (
              <div className="divide-y divide-slate-700">
                {hotspots.map((h, i) => (
                  <div key={h.station_id} className="px-5 py-4 hover:bg-slate-700/40 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-bold text-lg w-7">#{i+1}</span>
                        <div>
                          <p className="text-white font-semibold">{h.station_name}</p>
                          <p className="text-slate-500 text-xs">Station ID: {h.station_id}</p>
                        </div>
                      </div>
                      <RiskBadge level={h.risk_level} />
                    </div>
                    <HotspotBar count={h.crime_count} max={maxCount} />
                    <div className="flex gap-6 mt-2 text-sm">
                      <span className="text-slate-300">
                        <span className="text-slate-500">Total: </span>
                        <strong>{h.crime_count}</strong>
                      </span>
                      <span className="text-red-400">
                        <span className="text-slate-500">Heinous: </span>
                        <strong>{h.heinous_count}</strong>
                      </span>
                      <span className={h.change_percentage > 0 ? 'text-red-400' : 'text-green-400'}>
                        <span className="text-slate-500">Change: </span>
                        <strong>{h.change_percentage > 0 ? '+' : ''}{h.change_percentage.toFixed(1)}%</strong>
                      </span>
                    </div>
                    {h.reason && <p className="text-slate-500 text-xs mt-1.5">{h.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly trends table */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700">
              <h2 className="text-white font-semibold">Monthly Crime Breakdown</h2>
            </div>
            {trends.length === 0 ? (
              <p className="px-5 py-8 text-slate-500 text-center">No trend data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900">
                      <th className="px-4 py-3 text-left text-slate-400 font-semibold">Month</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-semibold">Crime Type</th>
                      <th className="px-4 py-3 text-right text-slate-400 font-semibold">Cases</th>
                      <th className="px-4 py-3 text-right text-slate-400 font-semibold">Unique</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {trends.slice(0, 20).map((t, i) => (
                      <tr key={i} className="hover:bg-slate-700/40 transition-colors">
                        <td className="px-4 py-3 text-slate-300 font-mono text-xs">{t.month}</td>
                        <td className="px-4 py-3 text-slate-200">{t.crime_type}</td>
                        <td className="px-4 py-3 text-right text-white font-bold">{t.case_count}</td>
                        <td className="px-4 py-3 text-right text-slate-400">{t.unique_crimes}</td>
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
