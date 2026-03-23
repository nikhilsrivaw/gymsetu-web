import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { WaitlistForm } from './WaitlistForm';
import { AppStoreBadges } from './AppStoreBadges';

export const Footer = () => {
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <>
      <footer className="bg-brand-orange text-black pt-16 md:pt-24 pb-8 md:pb-12 px-6 border-t-2 border-black">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <h2 className="font-archivo text-[18vw] md:text-[14vw] leading-[0.85] uppercase mb-8 md:mb-12">
            READY TO<br />GROW?
          </h2>

          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={() => setShowWaitlist(true)}
            className="bg-black text-white px-8 md:px-12 py-4 md:py-6 rounded-full font-archivo text-xl md:text-2xl uppercase tracking-tighter mb-8 md:mb-12"
          >
            START FREE TRIAL →
          </motion.button>

          <AppStoreBadges className="mb-16 md:mb-24 justify-center" />

          <div className="w-full pt-8 md:pt-12 border-t-2 border-black flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
            <div className="font-mono text-[10px] md:text-xs uppercase font-bold">
              © {new Date().getFullYear()} GYMSETU. ALL RIGHTS RESERVED.
            </div>
            <nav aria-label="Footer navigation" className="flex gap-6 md:gap-8 font-mono text-[10px] md:text-xs uppercase font-bold">
              <Link to="/pricing" className="hover:underline">PRICING</Link>
              <Link to="/features" className="hover:underline">FEATURES</Link>
              <Link to="/contact" className="hover:underline">CONTACT</Link>
            </nav>
          </div>
        </div>
      </footer>

      {showWaitlist && (
        <WaitlistForm plan="pro" onClose={() => setShowWaitlist(false)} />
      )}
    </>
  );
};
