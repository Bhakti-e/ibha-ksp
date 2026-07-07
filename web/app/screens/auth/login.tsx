'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, getErrorMessage } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login({ email, password });
      
      // Store token and user data
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
      
      // Redirect to chat
      router.push('/chat');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-surface p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fade-in">
          {/* Shield with Elephant Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary via-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-glow">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Ibha</h1>
          <p className="text-xl text-foreground font-semibold mb-1">
            KSP Crime Intelligence
          </p>
          <p className="text-sm text-foreground-muted">
            Secure, multilingual crime intelligence assistant
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            State Crime Records Bureau (SCRB) • Karnataka Police
          </p>
        </div>

        {/* Login Form Card */}
        <div className="card animate-slide-in">
          <h2 className="text-2xl font-bold mb-6 text-center">Officer Sign In</h2>
          
          {error && (
            <div className="bg-red-600/10 border border-red-600/50 text-red-400 px-4 py-3 rounded-lg mb-4 animate-fade-in">
              <p className="text-sm font-medium">⚠️ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2 text-foreground">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="input w-full"
                placeholder="officer@ksp.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2 text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input w-full"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full text-base font-semibold py-3"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="spinner mr-3"></span>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In Securely
                </span>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm font-bold text-foreground mb-3">🔑 Demo Credentials:</p>
            <div className="bg-surface rounded-lg p-4 space-y-2 text-xs text-foreground-muted">
              <div className="flex justify-between">
                <span className="font-semibold">Constable:</span>
                <span className="text-primary">rajesh.kumar@ksp.gov.in</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Inspector:</span>
                <span className="text-primary">arun.desai@ksp.gov.in</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">DSP (District):</span>
                <span className="text-primary">lakshmi.rao@ksp.gov.in</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Admin:</span>
                <span className="text-primary">admin.system@ksp.gov.in</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border text-center">
                <span className="font-bold text-warning">Password: </span>
                <span className="font-mono text-foreground">password123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-foreground-muted animate-fade-in">
          <p>© 2026 Karnataka State Police</p>
          <p className="mt-1 text-xs">Powered by Zoho Catalyst • Secure by Design</p>
        </div>
      </div>
    </div>
  );
}
