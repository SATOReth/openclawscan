'use client';

import { ReactNode } from 'react';

/* ─── Terminal Box with box-drawing borders ─── */
export function TBox({
  title, children, color = '#333', noPad = false, className = '',
}: {
  title?: string; children: ReactNode; color?: string; noPad?: boolean; className?: string;
}) {
  return (
    <div className={`mb-4 font-mono ${className}`}>
      {title && (
        <div className="text-[10px] tracking-wide overflow-hidden whitespace-nowrap" style={{ color }}>
          ┌── <span className="text-dim">{title}</span>{' '}{'─'.repeat(60)}
        </div>
      )}
      <div
        className={`bg-card ${noPad ? '' : 'p-3.5 px-4'}`}
        style={{ borderLeft: `1px solid ${color}44`, borderRight: `1px solid ${color}44` }}
      >
        {children}
      </div>
      <div className="text-[10px] overflow-hidden whitespace-nowrap" style={{ color }}>
        └{'─'.repeat(66)}
      </div>
    </div>
  );
}

/* ─── Stat cell ─── */
export function Stat({
  label, value, color, sub,
}: {
  label: string; value: string; color?: string; sub?: string;
}) {
  return (
    <div className="p-3.5 px-4 bg-card">
      <p className="text-[9px] text-ghost tracking-widest mb-1">{label}</p>
      <p className="text-lg font-bold tracking-tight" style={{ color: color || '#f0f0f0' }}>{value}</p>
      {sub && <p className="text-[9px] text-dim mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─── Block progress bar ─── */
export function PixelBar({
  value = 100, max = 100, color = '#22c55e', width = 20, label,
}: {
  value?: number; max?: number; color?: string; width?: number; label?: string;
}) {
  const filled = Math.round((value / max) * width);
  return (
    <div className="flex items-center gap-2 text-[11px] font-mono">
      {label && <span className="text-dim min-w-[80px]">{label}</span>}
      <span style={{ color, letterSpacing: '-0.05em' }}>
        {'█'.repeat(filled)}
        <span className="text-faint">{'░'.repeat(width - filled)}</span>
      </span>
      <span className="text-[10px] text-dim">{value}/{max}</span>
    </div>
  );
}

/* ─── Verification badge ─── */
export function StatusBadge({ ok, loading }: { ok: boolean; loading?: boolean }) {
  if (loading) {
    return (
      <span className="text-[9px] text-dim border border-faint px-2 py-0.5 bg-transparent transition-all">
        · · ·
      </span>
    );
  }
  return (
    <span
      className="text-[9px] px-2 py-0.5 transition-all"
      style={{
        color: ok ? '#22c55e' : '#ef4444',
        border: `1px solid ${ok ? '#22c55e44' : '#ef444444'}`,
        background: ok ? '#22c55e0a' : '#ef44440a',
      }}
    >
      {ok ? '✓ VERIFIED' : '✗ INVALID'}
    </span>
  );
}

/* ─── Back button ─── */
export function BackBtn({ href, label = '← BACK' }: { href: string; label?: string }) {
  return (
    <a href={href} className="block text-ghost text-[10px] tracking-wide py-4 hover:text-dim transition-colors">
      {label}
    </a>
  );
}

/* ─── Loading skeleton ─── */
export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-faint animate-pulse"
          style={{ width: `${60 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}

/* ─── Empty state ─── */
export function Empty({ icon = '◈', title, description }: { icon?: string; title: string; description: string }) {
  return (
    <div className="text-center py-16">
      <span className="text-2xl text-ghost block mb-3">{icon}</span>
      <p className="text-sm font-bold text-bright mb-1">{title}</p>
      <p className="text-[11px] text-dim">{description}</p>
    </div>
  );
}
