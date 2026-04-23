import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-lg font-bold">AlphaDesk</Link>
        <ul className="flex space-x-4">
          <li><Link href="/builder" className="text-white hover:text-gray-300">Builder</Link></li>
          <li><Link href="/results" className="text-white hover:text-gray-300">Results</Link></li>
          <li><Link href="/compare" className="text-white hover:text-gray-300">Compare</Link></li>
          <li><Link href="/live" className="text-white hover:text-gray-300">Live</Link></li>
        </ul>
      </div>
    </nav>
  );
}
