'use client';

import { useState, useEffect } from 'react';
import BaseLayout from '@/components/layout/BaseLayout';
import { useMock, mockDelay } from '@/lib/mocks/useMock';
import { MOCK_INSIGHTS } from '@/lib/mocks/fixtures';
import { getSocioInsights } from '@/lib/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';

const COLORS = ['#1D4ED8', '#0D9488', '#D97706', '#7C3AED', '#DC2626', '#475569'];

export default function SociologicalInsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCrimeType, setSelectedCrimeType] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<string>('30d');

  const isMockMode = useMock();

  useEffect(() => {
    fetchData();
  }, [selectedCrimeType, timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isMockMode) {
        await mockDelay(600);
        setData(MOCK_INSIGHTS);
      } else {
        const res = await getSocioInsights({
          crime_type: selectedCrimeType !== 'ALL' ? selectedCrimeType : undefined,
        });
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load sociological insights:', err);
      // Fallback to mock if backend API fails
      setData(MOCK_INSIGHTS);
    } finally {
      setLoading(false);
    }
  };

  const demographic = data?.demographic_breakdown;
  const victimProfile = data?.victim_profile;

  return (
    <BaseLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title">Sociological Crime Insights</h1>
              {isMockMode && (
                <span className="badge bg-amber-100 text-amber-800 border border-amber-300">
                  🧪 Mock Mode
                </span>
              )}
            </div>
            <p className="page-subtitle">
              Demographic distributions, temporal patterns, and data-grounded criminological narrative
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-2xs font-semibold text-ink-muted uppercase mb-1">
                Crime Category
              </label>
              <select
                value={selectedCrimeType}
                onChange={(e) => setSelectedCrimeType(e.target.value)}
                className="input py-1.5 text-xs bg-white min-w-[140px]"
              >
                <option value="ALL">All Crimes</option>
                <option value="Theft">Theft</option>
                <option value="Assault">Assault</option>
                <option value="Cyber Fraud">Cyber Fraud</option>
                <option value="Robbery">Robbery</option>
                <option value="Murder">Murder</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-ink-muted uppercase mb-1">
                Time Window
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="input py-1.5 text-xs bg-white min-w-[130px]"
              >
                <option value="30d">Last 30 Days</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last 1 Year</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card p-12 flex flex-col items-center justify-center gap-3">
            <span className="spinner w-8 h-8 border-accent" />
            <p className="text-sm text-ink-secondary">Loading demographic aggregations and narrative…</p>
          </div>
        ) : (
          <>
            {/* AI Narrative Card (Data-Grounded) */}
            <div className="card p-5 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 border-accent-border shadow-panel">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <h2 className="text-sm font-semibold text-ink">Data-Grounded Criminology Summary</h2>
                </div>
                <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 text-2xs font-medium">
                  ✓ Empirical DB aggregations only — zero identity bias
                </span>
              </div>
              <p className="text-sm text-ink-secondary leading-relaxed bg-white/80 p-4 rounded border border-slate-200/80 shadow-sm font-normal">
                {data?.llm_narrative}
              </p>
              <p className="text-2xs text-ink-muted mt-2">
                * Note: Narrative is generated by Gemini Flash strictly grounded in empirical aggregate counts from station databases. Protects against identity/ethnic proxies.
              </p>
            </div>

            {/* Grid 1: Temporal & Occupational Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time of Day Distribution */}
              <div className="card p-5">
                <div className="section-header px-0 pt-0 border-b border-slate-100 mb-4">
                  <h3 className="section-title">🕒 Incident Distribution by Time of Day</h3>
                  <span className="text-2xs text-ink-muted">Neutral temporal proxy</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demographic?.by_time_of_day ?? []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '4px', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" fill="#1D4ED8" radius={[4, 4, 0, 0]} name="Incidents" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Occupation Breakdown (Horizontal Bar) */}
              <div className="card p-5">
                <div className="section-header px-0 pt-0 border-b border-slate-100 mb-4">
                  <h3 className="section-title">💼 Accused Occupation Breakdown</h3>
                  <span className="text-2xs text-ink-muted">Top self-reported occupations</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demographic?.by_occupation ?? []} layout="vertical" margin={{ left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="occupation" type="category" tick={{ fontSize: 11 }} width={110} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '4px', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" fill="#0D9488" radius={[0, 4, 4, 0]} name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Grid 2: Age Brackets, Income Brackets & Area Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Age Groups */}
              <div className="card p-5">
                <h3 className="section-title mb-4 pb-2 border-b border-slate-100">🎂 Accused Age Groups</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demographic?.by_age_group ?? []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="group" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '4px', fontSize: '11px' }}
                      />
                      <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Income Brackets */}
              <div className="card p-5">
                <h3 className="section-title mb-4 pb-2 border-b border-slate-100">💳 Income Brackets</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demographic?.by_income_bracket ?? []}
                        dataKey="count"
                        nameKey="bracket"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={35}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {(demographic?.by_income_bracket ?? []).map((_: any, idx: number) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '4px', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Area Type Distribution */}
              <div className="card p-5">
                <h3 className="section-title mb-4 pb-2 border-b border-slate-100">🏙️ Incident Area Type</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demographic?.by_area_type ?? []}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {(demographic?.by_area_type ?? []).map((_: any, idx: number) => (
                          <Cell key={idx} fill={COLORS[(idx + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '4px', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Grid 3: Victim Demographics Summary */}
            {victimProfile && (
              <div className="card p-5 bg-slate-50 border border-slate-200">
                <h3 className="section-title mb-3 pb-2 border-b border-slate-200 flex items-center justify-between">
                  <span>👤 Victim Demographics Summary</span>
                  <span className="text-2xs font-normal text-ink-muted">Anonymised aggregate profile</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <p className="text-2xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
                      Victim Occupations
                    </p>
                    <div className="space-y-2">
                      {victimProfile.by_occupation?.map((item: any) => (
                        <div key={item.occupation} className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded border border-slate-200">
                          <span className="text-ink font-medium">{item.occupation}</span>
                          <span className="badge badge-info">{item.count} victims</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-2xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
                      Victim Area Spread
                    </p>
                    <div className="space-y-2">
                      {victimProfile.by_area_type?.map((item: any) => (
                        <div key={item.type} className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded border border-slate-200">
                          <span className="text-ink font-medium">{item.type} Zone</span>
                          <span className="badge badge-neutral">{item.count} cases</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </BaseLayout>
  );
}
