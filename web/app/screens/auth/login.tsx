'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, getErrorMessage } from '@/lib/api';

const DEMO_USERS = [
  { label: 'Constable',  email: 'rajesh.kumar@ksp.gov.in' },
  { label: 'Inspector',  email: 'arun.desai@ksp.gov.in' },
  { label: 'DSP',        email: 'lakshmi.rao@ksp.gov.in' },
  { label: 'Admin',      email: 'admin.system@ksp.gov.in' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50">
              <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Ibha</h1>
          <p className="text-slate-400 text-sm">KSP Crime Intelligence System</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Officer Sign In</h2>

          {error && (
            <div className="bg-red-950 border border-red-700 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 font-medium mb-1.5" htmlFor="email">
                Email
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
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 text-white placeholder-slate-500 border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 font-medium mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 text-white placeholder-slate-500 border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Authenticating…</>
                : 'Sign In Securely'
              }
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-700">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Demo Credentials
            </p>
            <div className="space-y-1.5">
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => { setEmail(u.email); setPassword('password123'); }}
                  className="w-full flex justify-between items-center px-3 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-700 text-left transition-colors"
                >
                  <span className="text-xs text-slate-400 font-medium">{u.label}</span>
                  <span className="text-xs text-blue-400 font-mono">{u.email}</span>
                </button>
              ))}
              <p className="text-center text-xs text-slate-500 pt-1">
                Password: <span className="font-mono text-yellow-400">password123</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          © 2026 Karnataka State Police · Powered by Zoho Catalyst
        </p>
      </div>
    </div>
  );
}
