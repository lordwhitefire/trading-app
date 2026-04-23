'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: 'home', label: 'Home' },
  { href: '/builder', icon: 'construction', label: 'Builder' },
  { href: '/results', icon: 'analytics', label: 'Results' },
  { href: '/live', icon: 'sensors', label: 'Signals' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── TOP BAR: logo left, nav links right (tablet+) ── */}
      <header className="hidden md:flex sticky top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-[#1F1F1F] h-16 items-center justify-between px-6 max-w-[1280px] mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-accent text-2xl">terminal</span>
          <span className="text-xl font-black text-accent tracking-tighter uppercase">AlphaDesk</span>
        </Link>

        {/* Nav links — right side */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium uppercase tracking-widest transition-colors duration-150 ${active
                    ? 'text-accent'
                    : 'text-white/40 hover:text-white'
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* ── TOP BAR: logo only, no nav (mobile) ── */}
      <header className="md:hidden sticky top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-[#1F1F1F] h-16 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-accent text-2xl">terminal</span>
          <span className="text-xl font-black text-accent tracking-tighter uppercase">AlphaDesk</span>
        </Link>
      </header>

      {/* ── BOTTOM NAV: icons only (mobile) ── */}
      <nav className="md:hidden fixed bottom-0 w-full bg-black/90 backdrop-blur-md border-t border-[#1F1F1F] z-50 flex justify-around items-center h-16">
        {navItems.map(({ href, icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 transition-colors duration-150 ${active ? 'text-accent' : 'text-white/40 hover:text-white'
                }`}
            >
              <span className="material-symbols-outlined text-[24px]">{icon}</span>
              <span className="text-[10px] font-medium uppercase">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}