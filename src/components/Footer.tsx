import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { WaitlistForm } from './WaitlistForm';

export const Footer = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <>
      <footer className="bg-ink border-t border-bone/15 px-6 pt-16 pb-10">
        <div className="max-w-7xl mx-auto">
          {/* masthead sign-off */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-bone/10 pb-12">
            <Link to="/" className="font-display uppercase leading-[0.85] tracking-tight text-bone text-6xl md:text-8xl">
              GYM<span className="text-flame">SETU</span>
            </Link>
            <div className="flex flex-col items-start md:items-end gap-4">
              <span className="font-serif italic text-xl text-bone/70">The operating system for Indian gyms.</span>
              <button
                onClick={() => setShowWaitlist(true)}
                className="group inline-flex items-center gap-3 bg-flame text-black font-mono text-xs font-bold uppercase tracking-widest px-7 py-4 hover:gap-4 transition-all"
              >
                Start free trial <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* bottom bar */}
          <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
            <span>© {new Date().getFullYear()} GymSetu · Built for Indian gyms</span>
            {/* Payment gateways check that terms/privacy/refund are reachable
                from the site, and a footer is where reviewers look first. */}
            <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              <Link to="/pricing" className="hover:text-flame transition-colors">Pricing</Link>
              <Link to="/features" className="hover:text-flame transition-colors">Features</Link>
              <Link to="/contact" className="hover:text-flame transition-colors">Contact</Link>
              <Link to="/privacy" className="hover:text-flame transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-flame transition-colors">Terms</Link>
              <Link to="/refund" className="hover:text-flame transition-colors">Refunds</Link>
            </nav>
          </div>
        </div>
      </footer>

      {showWaitlist && <WaitlistForm plan="pro" onClose={() => setShowWaitlist(false)} />}
    </>
  );
};
