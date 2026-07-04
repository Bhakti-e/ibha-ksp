'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/chat');
    } else {
      router.push('/login');
    }
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse">
          <h1 className="text-2xl font-bold gradient-text">Ibha</h1>
          <p className="text-foreground-muted mt-2">Loading...</p>
        </div>
      </div>
    </div>
  );
}
