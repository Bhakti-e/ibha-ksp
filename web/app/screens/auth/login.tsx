'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  login,
  saveAuthentication,
  getErrorMessage,
} from '@/lib/api';

const DEMO_USERS = [
  {
    label: 'Constable',
    email: 'rajesh.kumar@ksp.gov.in',
  },
  {
    label: 'Inspector',
    email: 'arun.desai@ksp.gov.in',
  },
  {
    label: 'DSP',
    email: 'lakshmi.rao@ksp.gov.in',
  },
  {
    label: 'Admin',
    email: 'admin.system@ksp.gov.in',
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const credentials = {
        email: email.trim().toLowerCase(),
        password,
      };

      const authentication = await login(credentials);

      saveAuthentication(authentication);

      const savedToken =
        localStorage.getItem('auth_token');

      const savedUser =
        localStorage.getItem('user_data');

      if (
        !savedToken ||
        savedToken === 'undefined' ||
        savedToken === 'null' ||
        !savedUser ||
        savedUser === 'undefined' ||
        savedUser === 'null'
      ) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');

        throw new Error(
          'Authentication could not be saved in the browser.'
        );
      }

      window.location.replace('/chat');
    } catch (err) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');

      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const fillDemoCredentials = (
    demoEmail: string
  ) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 bg-navy rounded-lg flex items-center justify-center shadow-panel">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-ink">
            Karnataka State Police
          </h1>

          <p className="text-sm text-ink-secondary mt-1">
            Ibha Crime Intelligence System
          </p>
        </div>

        <div className="card p-6 shadow-panel">
          <h2 className="text-base font-semibold text-ink mb-5">
            Officer Sign In
          </h2>

          {error && (
            <div
              role="alert"
              className="bg-status-dangerBg border border-status-dangerBorder text-status-danger rounded px-3 py-2 mb-4 text-sm"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink mb-1"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                }}
                placeholder="officer@ksp.gov.in"
                disabled={loading}
                required
                autoComplete="email"
                className="input"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink mb-1"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
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
              {loading ? (
                <>
                  <span
                    className="spinner w-4 h-4"
                    aria-hidden="true"
                  />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-2xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
              Demo accounts — click to fill
            </p>

            <div className="space-y-1">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    fillDemoCredentials(user.email)
                  }
                  className="w-full flex justify-between items-center px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="text-xs font-medium text-ink-secondary">
                    {user.label}
                  </span>

                  <span className="text-xs text-accent font-mono">
                    {user.email}
                  </span>
                </button>
              ))}

              <p className="text-center text-2xs text-ink-muted pt-1">
                Password:{' '}
                <span className="font-mono">
                  password123
                </span>
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