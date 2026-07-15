import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export const NotFound = () => {
  useEffect(() => {
    document.title = '404 — Page Not Found | GymSetu';
  }, []);

  return (
    <main className="relative bg-ink min-h-screen flex items-center justify-center px-6 text-center overflow-hidden">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="glow-orb animate-float-glow" aria-hidden="true"
        style={{ width: 420, height: 420, top: '20%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle,#FF4D0033,transparent 70%)' }} />
      <div className="relative">
        <p className="font-mono text-flame text-xs uppercase font-bold mb-4 tracking-[0.25em]">404</p>
        <h1 className="font-display text-6xl md:text-8xl text-bone uppercase leading-[0.85] mb-6">
          Page not <span className="text-heat">found</span>
        </h1>
        <p className="font-sans text-ash text-base mb-10">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-block bg-heat text-black px-8 py-3.5 rounded-lg font-mono text-sm uppercase font-bold tracking-wider hover:opacity-90 transition-opacity"
        >
          Go home →
        </Link>
      </div>
    </main>
  );
};
