'use client';

import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = getCurrentUser();
    if (userData) {
      setUser(userData);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const navLinks = [
    { name: 'Chat', path: '/chat' },
    { name: 'Trends', path: '/screens/trends' },
    { name: 'Network', path: '/screens/network' },
  ];

  // Add Admin link for authorized roles
  if (user && ['Admin', 'SCRB_Analyst'].includes(user.role)) {
    navLinks.push({ name: 'Admin', path: '/screens/admin' });
  }

  return (
    <nav className="bg-surface border-b border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {/* Shield Logo Placeholder */}
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Ibha</h1>
                <p className="text-xs text-foreground-muted">KSP Intelligence</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.path || pathname.startsWith(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => router.push(link.path)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground-muted hover:text-foreground hover:bg-card'
                  }`}
                >
                  {link.name}
                </button>
              );
            })}
          </div>

          {/* User Info + Logout */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user.full_name}</p>
                <p className="text-xs text-foreground-muted">
                  {user.role} • Station {user.station_id}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
