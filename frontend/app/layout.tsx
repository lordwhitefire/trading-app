import React from 'react';
import '../globals.css';
import Navbar from '@/components/shared/Navbar';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>AlphaDesk</title>
        <meta name="description" content="AI-powered trading strategy analysis" />
      </head>
      <body className="bg-gray-900 text-white">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
