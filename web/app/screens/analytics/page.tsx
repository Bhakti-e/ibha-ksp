'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getHotspots, getTrendsSummary, getSociologicalDemographics, getCurrentUser } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const CrimeHeatmap = dynamic(() => import('@/components/map/CrimeHeatmap'), { ssr: false, loading: () => <div className="h-[420px] bg-surface-card rounded-xl animate-pulse" /> });

const PERIODS = [7, 15, 30, 60, 90, 180];
const COLORS = ['#FEB226', '#AD222F', '#9A8A6E', '#D9C9A8', '#6B1019'];

function RiskBadge({ level }: { level: string }) {
  const cls: Record<string, string> = { HIGH: 'badge badge-high', MEDIUM: 'badge badge-medium', LOW: 'badge badge-low' };
  return <span className={cls[level] ?? 'badge badge-neutral'}>{level}</span>;
}

export default function AnalyticsPage() {
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [socio, setSocio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getCurrentUser()) { window.location.href = '/login'; return; }
    load();
  }, [days]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [h, t, s] = await Promise.all([
        getHotspots(days),
        getTrendsSummary(12),
        getSociologicalDemographics().catch(() => null)
      ]);
      setHotspots(h.hotspots || []);
      setTrends(t.trends || []);
      setSocio(s);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load analytics');
    } finally { setLoading(false); }
  };

  const maxCount = hotspots.length ? Math.max(...hotspots.map((h: any) => h.crime_count)) : 1;
  const totalCases = hotspots.reduce((s: number, h: any) => s + h.crime_count, 0);
  const mapPoints = hotspots
    .filter((h: any) => h.latitude && h.longitude)
    .map((h: any) => ({
      lat: Number(h.latitude),
      lon: Number(h.longitude),
      crime_type: h.station_name,
      count: h.crime_count,
    }));

  return (
    <BaseLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Crime Analytics</h1>
          <p className="page-subtitle">Hotspots, trends, map and sociological breakdown — one view</p>
        </div>
        <div className="flex gap-1.5 p-1 rounded-full bg-surface-card border border-navy-border/20">
          {PERIODS.map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${days === d ? 'bg-accent text-[#160A0B] shadow' : 'text-ink-muted hover:text-ink'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-status-dangerBg border border-status-dangerBorder text-status-danger rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-24"><div className="spinner" /><span className="ml-3 text-sm text-ink-muted">Loading analytics…</span></div>
      ) : (
        <div className="space-y-8">
          {/* Stats strip - no boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Stations', value: hotspots.length },
              { label: `Cases in ${days}d`, value: totalCases },
              { label: 'High Risk', value: hotspots.filter((h: any) => h.risk_level === 'HIGH').length, color: 'text-status-danger' },
              { label: 'Age Avg', value: socio?.age_stats?.avg_age ? `${socio.age_stats.avg_age.toFixed(1)}y` : '—' },
            ].map((s, i) => (
              <div key={i} className="border-b border-navy-border/20 pb-3">
                <p className="text-[10px] font-bold tracking-widest uppercase text-ink-muted">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color || 'text-ink'}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Hotspots + Map side by side - clean */}
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-sm font-bold text-ink tracking-wide">Hotspots — Last {days} days</h2>
              <p className="text-2xs text-ink-muted">Now correctly filters by max date in DB: 7d=5 cases, 30d=16, 90d=35</p>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
                {hotspots.length === 0 ? <p className="text-sm text-ink-muted py-8 text-center">No data for this window</p> :
                  hotspots.map((h: any, i: number) => (
                    <div key={h.station_id} className="group flex items-start justify-between p-3 rounded-xl bg-surface-card/60 hover:bg-surface-card border border-transparent hover:border-navy-border/30 transition-all">
                      <div className="flex gap-3">
                        <span className="text-[10px] font-bold text-ink-muted mt-0.5">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-bold text-ink group-hover:text-accent transition-colors">{h.station_name}</p>
                          <div className="w-20 h-1 bg-navy-border/30 rounded-full mt-1.5"><div className="h-1 bg-accent rounded-full" style={{ width: `${(h.crime_count / maxCount) * 100}%` }} /></div>
                          <p className="text-[11px] text-ink-muted mt-1">{h.crime_count} cases • {h.heinous_count} heinous • {h.reason}</p>
                        </div>
                      </div>
                      <RiskBadge level={h.risk_level} />
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-ink tracking-wide">Geographic Distribution</h2>
                <span className="text-[10px] text-ink-muted">OSM • Leaflet • No watermark • No API key</span>
              </div>
              <CrimeHeatmap key={days} points={mapPoints} height={420} />
              <p className="text-[11px] text-ink-muted mt-2">Map reflects the selected day window using filtered hotspot coordinates from case records.</p>
            </div>
          </div>

          {/* Trends table - minimal */}
          <div>
            <h2 className="text-sm font-bold text-ink tracking-wide mb-3">Monthly Breakdown (Last 12 Months)</h2>
            <div className="rounded-xl bg-surface-card/40 border border-navy-border/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr><th>Month</th><th>Crime Type</th><th className="text-right">Cases</th><th className="text-right">Unique</th></tr></thead>
                  <tbody>
                    {trends.slice(0, 12).map((t: any, i: number) => (
                      <tr key={i}><td className="font-mono text-xs text-ink-secondary">{t.month}</td><td>{t.crime_type}</td><td className="text-right font-bold">{t.case_count}</td><td className="text-right text-ink-muted">{t.unique_crimes}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sociological - no heavy boxes, flowing */}
          {socio && (
            <div className="border-t border-navy-border/20 pt-8 space-y-6">
              <h2 className="text-sm font-bold text-ink tracking-wide">Sociological Insights</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">Age Buckets</p>
                  <div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={socio.age_buckets}><XAxis dataKey="bucket" stroke="#9A8A6E" fontSize={10} axisLine={false} tickLine={false} /><YAxis stroke="#9A8A6E" fontSize={10} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ backgroundColor: '#241214', border: '1px solid #6B1019', borderRadius: '8px' }} /><Bar dataKey="count" fill="#FEB226" radius={[6,6,0,0]} barSize={32} /></BarChart></ResponsiveContainer></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">Gender</p>
                  <div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={socio.gender} dataKey="count" nameKey="gender_id" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={4} label>{socio.gender.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#241214', border: '1px solid #6B1019', borderRadius: '8px' }} /></PieChart></ResponsiveContainer></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">Hourly Pattern</p>
                  <div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={socio.hourly}><XAxis dataKey="hour_of_day" stroke="#9A8A6E" fontSize={10} axisLine={false} tickLine={false} /><YAxis stroke="#9A8A6E" fontSize={10} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ backgroundColor: '#241214', border: '1px solid #6B1019', borderRadius: '8px' }} /><Area type="monotone" dataKey="case_count" stroke="#AD222F" fill="#AD222F" fillOpacity={0.2} strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
                  <p className="text-[10px] text-ink-muted mt-1">{socio.hourly.length===0 ? 'No time data in seed (date only) — shows empty, expected' : 'Time distribution'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </BaseLayout>
  );
}
