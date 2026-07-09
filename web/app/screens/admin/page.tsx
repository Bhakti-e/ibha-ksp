'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs, getSystemStats, getCurrentUser } from '@/lib/api';
import type { AuditLog, SystemStats } from '@/lib/api';
import BaseLayout from '@/components/layout/BaseLayout';

interface TopUser { user_id: string; query_count: number; }

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="card p-5">
      <p className="text-2xs font-semibold text-ink-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color ?? 'text-ink'}`}>{value}</p>
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
      setError(e.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (!loading && error && logs.length === 0) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center py-24">
          <div className="card p-8 max-w-sm text-center shadow-panel">
            <div className="w-12 h-12 bg-status-dangerBg rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-status-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <h2 className="text-base font-semibold text-ink mb-2">Access Restricted</h2>
            <p className="text-sm text-ink-secondary mb-5">{error}</p>
            <button onClick={() => window.location.href = '/chat'} className="btn btn-primary">
              Return to Chat
            </button>
          </div>
        </div>
      </BaseLayout>
    );
  }

  if (loading) {
    return (
      <BaseLayout>
        <div className="flex items-center justify-center py-24">
          <div className="spinner" />
          <span className="ml-3 text-sm text-ink-muted">Loading…</span>
        </div>
      </BaseLayout>
    );
  }

  const dbColor = stats?.database_health === 'OK' ? 'text-status-success'
    : stats?.database_health === 'WARNING' ? 'text-status-warning' : 'text-status-danger';

  return (
    <BaseLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">System Administration</h1>
          <p className="page-subtitle">Statistics and audit log</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary text-xs gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <StatCard label="Total Cases"   value={stats.total_cases.toLocaleString()} />
          <StatCard label="Users"         value={stats.total_users} />
          <StatCard label="Queries Today" value={stats.total_queries_today} />
          <StatCard label="DB Health"     value={stats.database_health} color={dbColor} />
        </div>
      )}

      {/* Top users */}
      {stats && stats.top_querying_users.length > 0 && (
        <div className="card overflow-hidden shadow-panel mb-5">
          <div className="section-header">
            <h2 className="section-title">Top Querying Users — Last 7 Days</h2>
          </div>
          <div className="divide-y divide-navy-border/40">
            {stats.top_querying_users.map((u: TopUser, i: number) => (
              <div key={u.user_id} className="px-5 py-3 flex items-center justify-between hover:bg-surface-muted transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-ink-muted w-5">#{i+1}</span>
                  <span className="text-sm font-medium text-ink">{u.user_id}</span>
                </div>
                <span className="text-xs font-semibold text-accent">{u.query_count} queries</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit logs */}
      <div className="card overflow-hidden shadow-panel">
        <div className="section-header">
          <h2 className="section-title">Audit Log</h2>
          <span className="badge badge-neutral">{logs.length} entries</span>
        </div>
        {logs.length === 0 ? (
          <p className="px-5 py-10 text-sm text-ink-muted text-center">
            No audit log entries. Entries appear when officers query the system.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Query</th>
                  <th>Intent</th>
                  <th className="text-right">Results</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: AuditLog) => (
                  <tr key={log.log_id}>
                    <td className="font-mono text-xs text-ink-secondary whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td className="font-medium text-xs">{log.user_id}</td>
                    <td><span className="badge badge-info">{log.role}</span></td>
                    <td className="max-w-xs truncate text-xs" title={log.query_text}>{log.query_text}</td>
                    <td><span className="badge badge-neutral">{log.intent}</span></td>
                    <td className="text-right font-semibold">{log.result_count}</td>
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
