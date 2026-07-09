'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/api';

const NAV_LINKS = [
  { label: 'Chat',           path: '/chat'                        },
  { label: 'Analytics',      path: '/screens/analytics'           },
  { label: 'Investigations', path: '/screens/investigations'      },
];
const ADMIN_LINK = { label: 'Administration', path: '/screens/admin' };

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => { setUser(getCurrentUser()); }, []);

  const links = user && ['Admin', 'SCRB_Analyst'].includes(user.role)
    ? [...NAV_LINKS, ADMIN_LINK]
    : NAV_LINKS;

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <header className="bg-navy sticky top-0 z-50 shadow-nav">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

        {/* Brand */}
        <button
          onClick={() => router.push('/chat')}
          className="flex items-center gap-3 shrink-0 hover:opacity-90 transition-opacity"
          aria-label="Ibha Home"
        >
          <div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center border border-white/20">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide hidden sm:block">
            IBHA · KSP
          </span>
        </button>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5 flex-1">
          {links.map(link => {
            const active = pathname === link.path || pathname.startsWith(link.path + '/');
            return (
              <button
                key={link.path}
                onClick={() => router.push(link.path)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150 ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="flex items-center gap-4 shrink-0">
          {user && (
            <div className="hidden md:block text-right">
              <p className="text-white text-xs font-semibold leading-tight">{user.full_name}</p>
              <p className="text-white/50 text-2xs leading-tight">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded transition-colors"
          >
            Sign out
          </button>
        </div>

      </div>
    </header>
  );
}
