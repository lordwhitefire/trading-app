'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
    { href: '/', label: 'Home', icon: 'home' },
    { href: '/builder', label: 'Builder', icon: 'construction' },
    { href: '/results', label: 'Results', icon: 'analytics' },
    { href: '/live', label: 'Signals', icon: 'sensors' },
];

export default function BottomNavBar() {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-border z-50">
            <div className="flex justify-around items-center h-16">
                {items.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-accent' : 'text-white/40 hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-xl">{item.icon}</span>
                            <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
