'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    router.replace(token ? '/chat' : '/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="spinner" />
        <span className="text-sm text-ink-muted">Loading…</span>
      </div>
    </div>
  );
}
