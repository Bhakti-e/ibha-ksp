'use client';

import { useState, useEffect } from 'react';
import { getHotspots, getTrendsSummary, getTrendForecast } from '@/lib/api';
import type { Hotspot, TrendData } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';
import { useMock, mockDelay } from '@/lib/mocks/useMock';
import { MOCK_TREND_FORECAST, MOCK_HOTSPOTS } from '@/lib/mocks/fixtures';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const PERIODS = [7, 15, 30, 60, 90];

function RiskBadge({ level }: { level: string }) {
  const cls: Record<string, string> = {
    HIGH: 'badge badge-high',
    MEDIUM: 'badge badge-medium',
    LOW: 'badge badge-low',
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
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  const isMockMode = useMock();

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isMockMode) {
        await mockDelay(600);
        setHotspots(MOCK_HOTSPOTS.hotspots as Hotspot[]);
        setForecastData(MOCK_TREND_FORECAST);
      } else {
        const [h, t, f] = await Promise.all([
          getHotspots(days),
          getTrendsSummary(12),
          getTrendForecast(),
        ]);
        setHotspots(h.hotspots as Hotspot[]);
        setTrends(t.trends);
        setForecastData(f);
      }
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load trend data');
      setHotspots(MOCK_HOTSPOTS.hotspots as Hotspot[]);
      setForecastData(MOCK_TREND_FORECAST);
    } finally {
      setLoading(false);
    }
  };

  const maxCount = hotspots.length ? Math.max(...hotspots.map((h) => h.crime_count)) : 1;

  // Combine historical and projection for Recharts
  const chartData = [
    ...(forecastData?.historical?.map((item: any) => ({
      month: item.month,
      historical: item.case_count,
      projection: null,
    })) ?? []),
    ...(forecastData?.projection?.map((item: any) => ({
      month: item.month,
      historical: null,
      projection: item.case_count,
    })) ?? []),
  ];

  // Connect last historical point to first projection point for continuous rendering
  if (chartData.length > 0 && forecastData?.historical?.length > 0 && forecastData?.projection?.length > 0) {
    const lastHist = forecastData.historical[forecastData.historical.length - 1];
    const firstProjIdx = forecastData.historical.length;
    if (chartData[firstProjIdx]) {
      chartData[firstProjIdx - 1] = {
        ...chartData[firstProjIdx - 1],
        projection: lastHist.case_count,
      };
    }
  }

  return (
    <BaseLayout>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">Crime Trends & Statistical Forecasting</h1>
            {isMockMode && (
              <span className="badge bg-amber-100 text-amber-800 border border-amber-300">
                🧪 Mock Mode
              </span>
            )}
          </div>
          <p className="page-subtitle">
            Hotspot monitoring, historical trend breakdown, and 3-month statistical projections
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1">
          {PERIODS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                days === d
                  ? 'bg-navy text-white'
                  : 'bg-white text-ink-secondary border border-slate-200 hover:border-slate-300 hover:text-ink'
              }`}
            >
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
          <div className="spinner w-8 h-8 border-accent" />
          <span className="ml-3 text-sm text-ink-muted">Loading trends and projection model…</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Stations Monitored" value={hotspots.length} />
            <StatCard label="Total Cases (30d)" value={hotspots.reduce((s, h) => s + h.crime_count, 0)} />
            <StatCard
              label="High Risk Stations"
              value={hotspots.filter((h) => h.risk_level === 'HIGH').length}
              color="text-status-danger"
            />
            <StatCard
              label="Medium Risk Stations"
              value={hotspots.filter((h) => h.risk_level === 'MEDIUM').length}
              color="text-status-warning"
            />
          </div>

          {/* Early Warning Alert Card */}
          {forecastData?.early_warning && (
            <div className="card p-5 bg-amber-50/90 border-amber-300 shadow-panel space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <h2 className="text-sm font-bold text-amber-900">
                    Proactive Early Warning Alert — Projected Incident Spike
                  </h2>
                </div>
                <span className="badge badge-medium">
                  {forecastData.trailing_6mo_avg} avg cases/mo
                </span>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed bg-white/80 p-3.5 rounded border border-amber-200">
                {forecastData.early_warning}
              </p>
            </div>
          )}

          {/* Recharts Historical + Projection Chart */}
          <div className="card p-5 shadow-panel space-y-4">
            <div className="section-header px-0 pt-0 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="section-title">Monthly Volume & 3-Month Projection Line</h2>
                <p className="text-2xs text-ink-muted mt-0.5">
                  Method: {forecastData?.method ?? 'linear_ols_projection'} — Ordinary Least Squares statistical estimate
                </p>
              </div>
              <span className="badge badge-neutral text-2xs">
                ⚠️ Statistical estimate — NOT a predictive ML model
              </span>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="historical"
                    stroke="#1D4ED8"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    name="Historical Cases"
                  />
                  <Line
                    type="monotone"
                    dataKey="projection"
                    stroke="#D97706"
                    strokeWidth={2.5}
                    strokeDasharray="6 6"
                    dot={{ r: 4, fill: '#D97706' }}
                    name="Trend Projection (statistical estimate)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hotspots */}
          <div className="card overflow-hidden shadow-panel">
            <div className="section-header">
              <h2 className="section-title">Station Hotspot Rankings — Last {days} Days</h2>
            </div>
            {hotspots.length === 0 ? (
              <p className="px-5 py-8 text-sm text-ink-muted text-center">No hotspot data available</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {hotspots.map((h, i) => (
                  <div key={h.station_id} className="px-5 py-4 hover:bg-surface-muted transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-ink-muted w-6">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-semibold text-ink">{h.station_name}</p>
                          <p className="text-2xs text-ink-muted">Station ID: {h.station_id}</p>
                        </div>
                      </div>
                      <RiskBadge level={h.risk_level} />
                    </div>
                    <HotspotBar count={h.crime_count} max={maxCount} />
                    <div className="flex gap-6 mt-2 text-xs text-ink-secondary">
                      <span>
                        Total: <strong className="text-ink">{h.crime_count}</strong>
                      </span>
                      <span>
                        Heinous: <strong className="text-status-danger">{h.heinous_count}</strong>
                      </span>
                      <span>
                        Change:{' '}
                        <strong
                          className={
                            h.change_percentage > 0 ? 'text-status-danger' : 'text-status-success'
                          }
                        >
                          {h.change_percentage > 0 ? '+' : ''}
                          {h.change_percentage.toFixed(1)}%
                        </strong>
                      </span>
                    </div>
                    {h.reason && <p className="text-2xs text-ink-muted mt-1">{h.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </BaseLayout>
  );
}
