'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs, getSystemStats, getCurrentUser } from '@/lib/api';
import type { AuditLog, SystemStats } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';

interface TopUser { user_id: string; query_count: number; }

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const [logs,    setLogs]    = useState<AuditLog[]>([]);
  const [stats,   setStats]   = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { window.location.href = '/login'; return; }
    if (!['Admin', 'SCRB_Analyst'].includes(u.role)) {
      setError('Access denied. Admin or SCRB_Analyst role required.');
      setLoading(false);
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const [l, s] = await Promise.all([getAuditLogs({ limit: 50 }), getSystemStats()]);
      setLogs(l.logs);
      setStats(s);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // ── Access denied ──────────────────────────────────────────────────────────
  if (!loading && error && logs.length === 0) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center py-24">
          <div className="bg-slate-800 border border-red-800 rounded-xl p-8 max-w-md text-center">
            <div className="w-14 h-14 bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400 mb-5">{error}</p>
            <button onClick={() => window.location.href = '/chat'}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
              Go to Chat
            </button>
          </div>
        </div>
      </BaseLayout>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading admin data…</p>
          </div>
        </div>
      </BaseLayout>
    );
  }

  const dbColor = stats?.database_health === 'OK'
    ? 'text-green-400'
    : stats?.database_health === 'WARNING'
    ? 'text-yellow-400'
    : 'text-red-400';

  return (
    <BaseLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">System statistics and audit logs</p>
        </div>
        <button onClick={loadData}
          className="px-4 py-2 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Cases"    value={stats.total_cases.toLocaleString()} />
          <StatCard label="Active Users"   value={stats.total_users} />
          <StatCard label="Queries Today"  value={stats.total_queries_today} />
          <StatCard label="DB Health"      value={stats.database_health} color={dbColor} />
        </div>
      )}

      {/* Top querying users */}
      {stats && stats.top_querying_users.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-slate-700">
            <h2 className="text-white font-semibold">Top Querying Users — Last 7 Days</h2>
          </div>
          <div className="divide-y divide-slate-700">
            {stats.top_querying_users.map((u: TopUser, i: number) => (
              <div key={u.user_id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-700/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-bold w-6">#{i+1}</span>
                  <span className="text-slate-200 font-medium text-sm">{u.user_id}</span>
                </div>
                <span className="text-blue-400 font-semibold text-sm">{u.query_count} queries</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit logs */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-white font-semibold">Audit Logs</h2>
          <span className="text-xs text-slate-500 bg-slate-700 px-2.5 py-1 rounded-full">
            {logs.length} entries
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <p className="text-slate-400 text-sm">No audit logs found</p>
            <p className="text-slate-600 text-xs mt-1">Logs will appear here as users query the system</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900">
                  {['Timestamp','User','Role','Query','Intent','Results'].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wide ${i === 5 ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {logs.map((log: AuditLog) => (
                  <tr key={log.log_id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-medium text-xs">{log.user_id}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded text-xs border border-blue-700">
                        {log.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs max-w-xs truncate" title={log.query_text}>
                      {log.query_text}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
                        {log.intent}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-bold">{log.result_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
