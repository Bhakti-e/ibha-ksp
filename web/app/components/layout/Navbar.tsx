'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/api';

const NAV_LINKS = [
  { label: 'Chat',    path: '/chat',            icon: '💬' },
  { label: 'Trends',  path: '/screens/trends',  icon: '📊' },
  { label: 'Network', path: '/screens/network', icon: '🕸️' },
];
const ADMIN_LINK = { label: 'Admin', path: '/screens/admin', icon: '⚙️' };

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const links = user && ['Admin', 'SCRB_Analyst'].includes(user.role)
    ? [...NAV_LINKS, ADMIN_LINK]
    : NAV_LINKS;

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <nav style={{
      backgroundColor: 'hsl(220 25% 10%)',
      borderBottom:    '1px solid hsl(220 20% 18%)',
      padding:         '0 1.5rem',
      height:          '56px',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      position:        'sticky',
      top:             0,
      zIndex:          50,
    }}>
      {/* Logo */}
      <button
        onClick={() => router.push('/chat')}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
        </div>
        <div className="hidden sm:block">
          <span className="text-white font-bold text-base leading-tight">Ibha</span>
          <span className="text-slate-400 text-xs block leading-tight">KSP Intelligence</span>
        </div>
      </button>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {links.map(link => {
          const active = pathname === link.path || pathname.startsWith(link.path + '/');
          return (
            <button
              key={link.path}
              onClick={() => router.push(link.path)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span className="text-base leading-none">{link.icon}</span>
              <span className="hidden sm:inline">{link.label}</span>
            </button>
          );
        })}
      </div>

      {/* User info + logout */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden md:block text-right">
            <p className="text-white text-sm font-medium leading-tight">{user.full_name}</p>
            <p className="text-slate-400 text-xs leading-tight">{user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 border border-slate-600 hover:bg-slate-700 hover:text-white transition-all"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
