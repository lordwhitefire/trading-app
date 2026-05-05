// frontend/components/shared/Navbar.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useStore();

  // Desktop links (shown inline in header)
  const desktopLinks = [
    { href: '/', label: 'Home' },
    { href: '/builder', label: 'Builder' },
    { href: '/results', label: 'Results' },
    { href: '/live', label: 'Signals' },
    { href: '/trade', label: 'Trade' },
    { href: '/profile', label: 'Profile' },
  ];

  // Mobile bottom nav links (exactly 5)
  const bottomNavLinks = [
    { href: '/', label: 'Home', icon: '❤' },
    { href: '/builder', label: 'Builder', icon: '⚡' },
    { href: '/live', label: 'Signals', icon: '📡' },
    { href: '/trade', label: 'Trade', icon: '📒' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
          ? 'com.alphadeskapp://auth/callback'
          : `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  return (
    <>
      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 w-full border-b border-[#1F1F1F] z-50 bg-black/90 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center px-6 h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-[#FACC15] text-lg">⚡</span>
            <span className="text-xl font-black text-[#FACC15] tracking-tighter uppercase">AlphaDesk</span>
          </div>

          {/* Desktop navigation (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-6">
            {desktopLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium uppercase tracking-widest transition-colors ${isActive ? 'text-[#FACC15]' : 'text-white/40 hover:text-white'
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side: user avatar / sign in button + hamburger menu (mobile only) */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <img
                  src={user.user_metadata?.avatar_url || ''}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border border-[#1F1F1F]"
                  onError={(e: any) => { e.target.style.display = 'none'; }}
                />
                <span className="text-[#9CA3AF] text-xs hidden sm:block">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-[10px] text-[#4B5563] hover:text-white uppercase tracking-widest transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-2 bg-[#FACC15] text-black font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-widest hover:bg-[#FDD047] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Sign in with Google
              </button>
            )}
            {/* Mobile hamburger button */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden p-2 rounded hover:bg-[#0D0D0D] transition-colors"
            >
              <span className="text-white text-xl">☰</span>
            </button>
          </div>
        </div>
      </header>

      {/* Left drawer (mobile only) */}
      {open && (
        <div className="fixed inset-0 bg-black/80 z-[100] md:hidden" onClick={() => setOpen(false)}>
          <div
            className="fixed inset-y-0 left-0 w-64 z-[110] bg-[#0D0D0D] border-r border-[#1F1F1F] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#1F1F1F]">
              <span className="text-[#FACC15] font-black text-sm uppercase tracking-widest">Menu</span>
            </div>
            <nav className="flex-1 py-4">
              {/* Drawer links: Results and placeholder */}
              <Link
                href="/results"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-4 px-6 py-4 text-sm font-medium uppercase transition-all ${pathname === '/results'
                    ? 'bg-[#FACC15]/10 text-[#FACC15] border-l-4 border-[#FACC15]'
                    : 'text-white/40 hover:bg-[#1F1F1F] hover:text-white'
                  }`}
              >
                <span>📊</span>
                Results
              </Link>
              <div className="flex items-center gap-4 px-6 py-4 text-sm font-medium uppercase text-white/20 cursor-not-allowed">
                <span>⚙️</span>
                Settings — coming soon
              </div>
            </nav>
            {/* Sign in/out button at bottom of drawer (if not already visible) */}
            <div className="p-6 border-t border-[#1F1F1F]">
              {!user && (
                <button
                  onClick={() => {
                    handleSignIn();
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#FACC15] text-black font-bold py-2 rounded-lg text-xs uppercase tracking-widest hover:bg-[#FDD047] transition-colors"
                >
                  Sign in
                </button>
              )}
              {user && (
                <button
                  onClick={() => {
                    handleSignOut();
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-400 font-bold py-2 rounded-lg text-xs uppercase tracking-widest hover:bg-red-500/30 transition-colors"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar (mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#1F1F1F] z-50 flex justify-around py-2 md:hidden">
        {bottomNavLinks.map(link => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-widest transition-colors ${isActive ? 'text-[#FACC15]' : 'text-white/40'
                }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}