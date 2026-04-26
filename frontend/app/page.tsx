import React from 'react';
import Link from 'next/link';


export default function HomePage() {
  return (
    <div className="max-w-[1280px] mx-auto px-6">

      {/* Hero */}
      <section className="pt-20 pb-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tighter uppercase">
          <span className="text-white">Alpha</span>
          <span className="text-accent">Desk</span>
        </h1>
        <p className="text-text-secondary mt-4 max-w-sm mx-auto text-base leading-relaxed">
          Build, backtest and analyze trading strategies with AI.
          Institutional grade tools for the modern quant.
        </p>
        <div className="flex flex-col gap-4 mt-8 md:flex-row md:justify-center">
          <Link
            href="/builder"
            className="bg-accent text-black font-bold py-4 px-8 rounded transition-all hover:bg-accent-hover uppercase text-sm tracking-widest text-center"
          >
            Build a Strategy
          </Link>
          <Link
            href="/live"
            className="bg-transparent border border-border text-white font-bold py-4 px-8 rounded transition-all hover:text-accent hover:border-accent uppercase text-sm tracking-widest text-center"
          >
            Live Signals
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="pb-24 space-y-4 md:grid md:grid-cols-3 md:gap-8 md:space-y-0">
        {[
          {
            icon: '🏗️',
            title: 'Strategy Builder',
            desc: 'Visual block-based builder to construct complex logic without writing a single line of code.',
          },
          {
            icon: '⚙️',
            title: 'Backtesting Engine',
            desc: 'High-fidelity historical simulation with tick-level data accuracy and slippage modeling.',
          },
          {
            icon: '🧠',
            title: 'AI Analysis',
            desc: 'Neural network optimization to identify hidden patterns and risk-adjusted performance metrics.',
          },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            className="bg-surface border border-border p-6 rounded hover:border-border-hover transition-colors"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 flex items-center justify-center text-2xl">{icon}</div>
              <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* Terminal Live Banner */}
      <section className="mb-24">
        <div className="relative h-48 rounded-xl border border-border bg-surface-elevated overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10" />
          <div className="absolute bottom-4 left-6 z-20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-success text-xs font-semibold uppercase tracking-widest">Terminal Live</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1F1F1F] py-8 text-center">
        <p className="text-[10px] tracking-widest uppercase text-white/40 mb-6">
          © 2024 AlphaDesk Terminal. Institutional Grade Strategy Builder.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          {['Documentation', 'API Reference', 'Status', 'Privacy'].map((l) => (
            <a
              key={l}

              href="#"
              className="text-[10px] tracking-widest uppercase text-white/40 hover:text-accent transition-colors"
            >
              {l}
            </a>
          ))}
        </div>
      </footer >
    </div >
  );
}