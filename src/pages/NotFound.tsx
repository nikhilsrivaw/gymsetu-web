import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export const NotFound = () => {
  useEffect(() => {
    document.title = '404 — Page Not Found | GymSetu';
  }, []);

  return (
    <main className="bg-near-black min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <p className="font-mono text-brand-orange text-xs uppercase font-bold mb-4 tracking-widest">
          404
        </p>
        <h1 className="font-archivo text-6xl md:text-8xl text-white uppercase leading-none tracking-tighter mb-6">
          PAGE NOT<br />FOUND.
        </h1>
        <p className="font-sans text-white/40 text-base mb-10">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-block bg-brand-orange text-black px-8 py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity"
        >
          GO HOME →
        </Link>
      </div>
    </main>
  );
};
