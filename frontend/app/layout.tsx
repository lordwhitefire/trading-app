import React from 'react';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import AuthProvider from '@/components/shared/AuthProvider';

export const metadata = {
  title: 'AlphaDesk',
  description: 'AI-powered trading strategy analysis',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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