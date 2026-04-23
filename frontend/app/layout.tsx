import React from 'react';
import './globals.css';
import Navbar from '@/components/shared/Navbar';

export const metadata = {
  title: 'AlphaDesk',
  description: 'AI-powered trading strategy builder and backtesting platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black text-white antialiased">
        <Navbar />
        {/* pb-20 on mobile so bottom nav doesn't cover content */}
        <main className="md:pb-0 pb-20">
          {children}
        </main>
      </body>
    </html>
  );
}