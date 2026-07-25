'use client';

import Navbar from './Navbar';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
}

export default function Layout({ children, showNavbar = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showNavbar && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
