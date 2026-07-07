'use client';

import React, { useState, useEffect } from 'react';
import { getAuditLogs, getSystemStats, getCurrentUser } from '@/lib/api';
import type { AuditLog, SystemStats } from '@/lib/api';

interface TopUser {
  user_id: string;
  query_count: number;
}

export default function AdminPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = getCurrentUser();
    if (!userData) {
      window.location.href = '/login';
      return;
    }

    // Check if user has admin access
    if (!['Admin', 'SCRB_Analyst'].includes(userData.role)) {
      setError('Access denied. Admin or SCRB_Analyst role required.');
      setLoading(false);
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [logsData, statsData] = await Promise.all([
        getAuditLogs({ limit: 50 }),
        getSystemStats(),
      ]);

      setLogs(logsData.logs);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-foreground-muted">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-foreground-muted mb-4">{error}</p>
          <button onClick={() => (window.location.href = '/chat')} className="btn btn-primary">
            Go to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Admin Dashboard</h1>
        <p className="text-foreground-muted">System statistics and audit logs</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-foreground-muted mb-1">Total Cases</p>
            <p className="text-3xl font-bold">{stats.total_cases.toLocaleString()}</p>
          </div>
          <div className="card">
            <p className="text-sm text-foreground-muted mb-1">Active Users</p>
            <p className="text-3xl font-bold">{stats.total_users}</p>
          </div>
          <div className="card">
            <p className="text-sm text-foreground-muted mb-1">Queries Today</p>
            <p className="text-3xl font-bold">{stats.total_queries_today}</p>
          </div>
          <div className="card">
            <p className="text-sm text-foreground-muted mb-1">Database Health</p>
            <p
              className={`text-3xl font-bold ${
                stats.database_health === 'OK'
                  ? 'text-green-500'
                  : stats.database_health === 'WARNING'
                  ? 'text-yellow-500'
                  : 'text-red-500'
              }`}
            >
              {stats.database_health}
            </p>
          </div>
        </div>
      )}

      {/* Top Users */}
      {stats && stats.top_querying_users.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Top Querying Users (Last 7 Days)</h2>
          <div className="space-y-2">
            {stats.top_querying_users.map((u: TopUser, idx: number) => (
              <div
                key={u.user_id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-foreground-muted">#{idx + 1}</span>
                  <span className="font-medium">{u.user_id}</span>
                </div>
                <span className="text-primary font-semibold">{u.query_count} queries</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Audit Logs</h2>
          <button onClick={loadData} className="btn btn-secondary text-sm">
            Refresh
          </button>
        </div>

        {logs.length === 0 ? (
          <p className="text-foreground-muted text-center py-8">No audit logs found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Timestamp</th>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Query</th>
                  <th className="px-4 py-2 text-left">Intent</th>
                  <th className="px-4 py-2 text-right">Results</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: AuditLog) => (
                  <tr key={log.log_id} className="border-t border-border hover:bg-muted/50">
                    <td className="px-4 py-2">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 font-medium">{log.user_id}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                        {log.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 max-w-xs truncate" title={log.query_text}>
                      {log.query_text}
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 bg-muted rounded text-xs">{log.intent}</span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">{log.result_count}</td>
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
