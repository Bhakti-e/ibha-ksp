'use client';

import { useState, useEffect } from 'react';
import { getHotspots, getTrendsSummary, getCurrentUser } from '@/lib/api';
import type { Hotspot, TrendData } from '@/lib/api';

export default function TrendsPage() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    loadData();
  }, [days]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [hotspotsData, trendsData] = await Promise.all([
        getHotspots(days),
        getTrendsSummary(12),
      ]);

      setHotspots(hotspotsData.hotspots);
      setTrends(trendsData.trends);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load trends data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'text-red-500 bg-red-500/10 border-red-500';
      case 'MEDIUM':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500';
      case 'LOW':
        return 'text-green-500 bg-green-500/10 border-green-500';
      default:
        return 'text-foreground-muted bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-foreground-muted">Loading trends data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Crime Trends & Hotspots</h1>
        <p className="text-foreground-muted">Analysis of crime patterns and risk areas</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Period Selector */}
      <div className="card mb-6">
        <label className="block text-sm font-medium mb-2">Analysis Period</label>
        <div className="flex space-x-2">
          {[7, 15, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                days === d
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Hotspots */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Crime Hotspots</h2>
        {hotspots.length === 0 ? (
          <p className="text-foreground-muted">No hotspot data available</p>
        ) : (
          <div className="space-y-3">
            {hotspots.map((hotspot, idx) => (
              <div
                key={hotspot.station_id}
                className="p-4 bg-muted/50 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl font-bold text-foreground-muted">#{idx + 1}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{hotspot.station_name}</h3>
                        <p className="text-sm text-foreground-muted">Station ID: {hotspot.station_id}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center space-x-4 text-sm">
                      <div>
                        <span className="text-foreground-muted">Total Cases: </span>
                        <span className="font-semibold">{hotspot.crime_count}</span>
                      </div>
                      <div>
                        <span className="text-foreground-muted">Heinous: </span>
                        <span className="font-semibold text-red-500">{hotspot.heinous_count}</span>
                      </div>
                      <div>
                        <span className="text-foreground-muted">Change: </span>
                        <span
                          className={`font-semibold ${
                            hotspot.change_percentage > 0 ? 'text-red-500' : 'text-green-500'
                          }`}
                        >
                          {hotspot.change_percentage > 0 ? '+' : ''}
                          {hotspot.change_percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground-muted mt-2">{hotspot.reason}</p>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(
                        hotspot.risk_level
                      )}`}
                    >
                      {hotspot.risk_level}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Trends */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Monthly Crime Trends</h2>
        {trends.length === 0 ? (
          <p className="text-foreground-muted">No trend data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Month</th>
                  <th className="px-4 py-2 text-left">Crime Type</th>
                  <th className="px-4 py-2 text-right">Case Count</th>
                  <th className="px-4 py-2 text-right">Unique Crimes</th>
                </tr>
              </thead>
              <tbody>
                {trends.slice(0, 20).map((trend, idx) => (
                  <tr key={idx} className="border-t border-border hover:bg-muted/50">
                    <td className="px-4 py-2">{trend.month}</td>
                    <td className="px-4 py-2">{trend.crime_type}</td>
                    <td className="px-4 py-2 text-right font-semibold">{trend.case_count}</td>
                    <td className="px-4 py-2 text-right">{trend.unique_crimes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
