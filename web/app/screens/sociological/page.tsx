'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getSociologicalDemographics, getCurrentUser } from '@/lib/api';
import type { SociologicalData } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const CrimeHeatmap = dynamic(() => import('@/components/map/CrimeHeatmap'), { ssr: false });

const COLORS = ['#FEB226', '#AD222F', '#9A8A6E', '#D9C9A8', '#6B1019'];

export default function SociologicalPage() {
  const [data, setData] = useState<SociologicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getCurrentUser()) { window.location.href = '/login'; return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const d = await getSociologicalDemographics();
      setData(d);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load sociological data');
    } finally { setLoading(false); }
  };

  if (loading) return <BaseLayout><div className="flex justify-center py-24"><div className="spinner"/><span className="ml-3 text-sm text-ink-muted">Loading…</span></div></BaseLayout>;

  return (
    <BaseLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Sociological Crime Insights</h1>
          <p className="page-subtitle">Demographic patterns — age, gender, unit type, time</p>
        </div>
        <button onClick={load} className="btn btn-secondary text-xs">Refresh</button>
      </div>

      {error && <div className="bg-status-dangerBg border border-status-dangerBorder text-status-danger rounded px-4 py-2 mb-5 text-sm">{error}</div>}

      {data && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4"><p className="text-2xs uppercase tracking-wider text-ink-muted font-bold">Total Accused</p><p className="text-2xl font-bold text-ink mt-1">{data.total_accused}</p></div>
            <div className="card p-4"><p className="text-2xs uppercase tracking-wider text-ink-muted font-bold">Avg Age</p><p className="text-2xl font-bold text-accent mt-1">{data.age_stats?.avg_age?.toFixed(1) || '—'}</p></div>
            <div className="card p-4"><p className="text-2xs uppercase tracking-wider text-ink-muted font-bold">Age Range</p><p className="text-lg font-bold text-ink mt-1">{data.age_stats?.min_age || '—'} - {data.age_stats?.max_age || '—'}</p></div>
            <div className="card p-4"><p className="text-2xs uppercase tracking-wider text-ink-muted font-bold">Gender Dist.</p><p className="text-lg font-bold text-ink mt-1">{data.gender?.length || 0} groups</p></div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="card p-5 shadow-panel">
              <h2 className="section-title mb-4">Age Buckets</h2>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.age_buckets}>
                    <XAxis dataKey="bucket" stroke="#9A8A6E" fontSize={10} />
                    <YAxis stroke="#9A8A6E" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#241214', border: '1px solid #6B1019', color: '#FBF6E9' }} />
                    <Bar dataKey="count" fill="#FEB226" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-5 shadow-panel">
              <h2 className="section-title mb-4">Gender Distribution</h2>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.gender} dataKey="count" nameKey="gender_id" cx="50%" cy="50%" outerRadius={90} label>
                      {data.gender.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#241214', border: '1px solid #6B1019', color: '#FBF6E9' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-2xs text-ink-muted mt-2">Gender ID mapping from accused table (1=Male expected for seed)</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="card p-5 shadow-panel">
              <h2 className="section-title mb-4">Crime by Unit Type</h2>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.unit_type.slice(0,10)}>
                    <XAxis dataKey="unittypeid" stroke="#9A8A6E" fontSize={10} />
                    <YAxis stroke="#9A8A6E" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#241214', border: '1px solid #6B1019' }} />
                    <Bar dataKey="case_count" fill="#AD222F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-5 shadow-panel">
              <h2 className="section-title mb-4">Hourly Distribution</h2>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.hourly}>
                    <XAxis dataKey="hour_of_day" stroke="#9A8A6E" fontSize={10} />
                    <YAxis stroke="#9A8A6E" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#241214', border: '1px solid #6B1019' }} />
                    <Area type="monotone" dataKey="case_count" stroke="#FEB226" fill="#FEB226" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-2xs text-ink-muted mt-2">{data.hourly.length===0 ? 'No hourly data (date field lacks time in seed)' : 'Hourly pattern'}</p>
            </div>
          </div>

          <div className="card overflow-hidden shadow-panel">
            <div className="section-header"><h2 className="section-title">Geographic Hotspots — OSM</h2><span className="badge badge-neutral">Leaflet + OSM no watermark</span></div>
            <CrimeHeatmap height={380} />
            <p className="text-2xs text-ink-muted px-5 py-2">OSM tiles © OpenStreetMap contributors — no API key, no watermark, attribution only.</p>
          </div>
        </div>
      )}
    </BaseLayout>
  );
}
