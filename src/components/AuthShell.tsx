import React from 'react';

// Shared background + centered column for every auth / funnel page, so the
// whole flow (login, signup, plan, setup) sits on one consistent canvas.
export const AuthShell = ({ children, width = 'sm' }: {
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}) => {
  const max = width === 'lg' ? 'max-w-2xl' : width === 'md' ? 'max-w-md' : 'max-w-sm';
  return (
    <main className="relative bg-ink min-h-screen flex items-center justify-center px-4 pt-28 pb-24 overflow-hidden">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="glow-orb animate-float-glow" aria-hidden="true"
        style={{ width: 480, height: 480, top: -120, right: -100, background: 'radial-gradient(circle,#FF4D0044,transparent 70%)' }} />
      <div className={`relative w-full ${max}`}>{children}</div>
    </main>
  );
};

// Shared field styles used across the funnel.
export const authInput =
  'w-full bg-surface border border-hairline focus:border-flame rounded-lg px-4 py-3 ' +
  'text-bone text-sm outline-none transition-colors font-sans placeholder:text-ash/50';
export const authLabel = 'font-mono text-[10px] uppercase tracking-wider text-ash block mb-1.5';
