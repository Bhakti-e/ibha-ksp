'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, getErrorMessage } from '@/lib/api';

const DEMO_USERS = [
  { label: 'Constable',   email: 'rajesh.kumar@ksp.gov.in'  },
  { label: 'Inspector',   email: 'arun.desai@ksp.gov.in'    },
  { label: 'DSP',         email: 'lakshmi.rao@ksp.gov.in'   },
  { label: 'Admin',       email: 'admin.system@ksp.gov.in'  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await login({ email, password });
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('user_data',  JSON.stringify(res.user));
      router.push('/chat');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Header — institutional branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 bg-navy rounded-lg flex items-center justify-center shadow-panel">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-semibold text-ink">Karnataka State Police</h1>
          <p className="text-sm text-ink-secondary mt-1">Ibha Crime Intelligence System</p>
        </div>

        {/* Form card */}
        <div className="card p-6 shadow-panel">
          <h2 className="text-base font-semibold text-ink mb-5">Officer Sign In</h2>

          {error && (
            <div className="bg-status-dangerBg border border-status-dangerBorder text-status-danger rounded px-3 py-2 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="officer@ksp.gov.in"
                disabled={loading}
                required
                autoComplete="email"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
                autoComplete="current-password"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-2.5"
            >
              {loading
                ? <><span className="spinner w-4 h-4" />Signing in…</>
                : 'Sign In'
              }
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-2xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
              Demo accounts — click to fill
            </p>
            <div className="space-y-1">
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => { setEmail(u.email); setPassword('password123'); }}
                  className="w-full flex justify-between items-center px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-left transition-colors"
                >
                  <span className="text-xs font-medium text-ink-secondary">{u.label}</span>
                  <span className="text-xs text-accent font-mono">{u.email}</span>
                </button>
              ))}
              <p className="text-center text-2xs text-ink-muted pt-1">
                Password: <span className="font-mono">password123</span>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-2xs text-ink-muted mt-6">
          © 2026 Karnataka State Police · Restricted Access
        </p>
      </div>
    </div>
  );
}
