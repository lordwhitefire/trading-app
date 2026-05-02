'use client';
import React, { useEffect } from 'react';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import AuthProvider from '@/components/shared/AuthProvider';
import { supabase } from '@/lib/supabase';

export const metadata = {
  title: 'AlphaDesk',
  description: 'AI-powered trading strategy analysis',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handler = async (e: any) => {
      const url = e.detail?.url;
      if (url) {
        const hash = url.split('#')[1] || url.split('?')[1];
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          window.location.reload();
        }
      }
    };
    window.addEventListener('supabase-auth-callback', handler);
    return () => window.removeEventListener('supabase-auth-callback', handler);
  }, []);

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black text-white font-sans antialiased">
        <AuthProvider>
          <Navbar />
          <main className="pt-16 pb-20">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}