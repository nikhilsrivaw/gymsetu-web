import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Plus, ArrowRight } from 'lucide-react';
import { FRANCHISE_BASE_PRICE, FRANCHISE_PER_LOCATION, FRANCHISE_FEATURES } from '../../lib/franchise-constants';

const EXAMPLES = [1, 3, 5, 10, 20];

export const FranchisePricing = () => {
  const [locations, setLocations] = useState(5);

  useEffect(() => { document.title = 'Franchise Pricing | GymSetu'; }, []);

  const total = FRANCHISE_BASE_PRICE + locations * FRANCHISE_PER_LOCATION;
  const proTotal = Math.round(FRANCHISE_BASE_PRICE * 0.85) + locations * FRANCHISE_PER_LOCATION;

  return (
    <main className="bg-near-black min-h-screen">
      {/* Minimal nav */}
      <nav className="fixed top-0 left-0 w-full z-50 px-4 md:px-8 py-4 flex items-center justify-between bg-near-black border-b border-white/10">
        <Link to="/franchise" className="font-archivo text-xl tracking-tighter text-white flex items-center gap-2">
          GYMSETU
          <span className="font-mono text-[8px] font-bold text-brand-orange border border-brand-orange px-1.5 py-0.5 uppercase">
            FRANCHISE
          </span>
        </Link>
        <Link to="/franchise/readiness"
          className="bg-brand-orange text-black px-5 py-2 font-mono text-[10px] font-bold uppercase hover:opacity-90 transition-opacity">
          GET STARTED
        </Link>
      </nav>

      <div className="px-4 md:px-6 pt-32 pb-24 max-w-4xl mx-auto">

        {/* Header */}
        <div className="font-mono text-[10px] text-brand-orange uppercase font-bold mb-2 tracking-widest">
          FRANCHISE PRICING
        </div>
        <h1 className="font-archivo text-5xl md:text-6xl text-white uppercase leading-none tracking-tighter mb-4">
          PAY AS YOU<br /><span className="text-brand-orange">GROW.</span>
        </h1>
        <p className="font-sans text-white/40 text-base mb-16 max-w-xl">
          One flat base fee, then a small per-location charge. No hidden costs. Scale up or down any time.
        </p>

        {/* Pricing breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="border-2 border-white/10 p-8">
            <p className="font-mono text-[10px] font-bold text-white/30 uppercase mb-2">BASE FEE</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-archivo text-5xl text-white">₹{FRANCHISE_BASE_PRICE.toLocaleString('en-IN')}</span>
              <span className="font-mono text-[10px] font-bold text-white/30 uppercase">/MONTH</span>
            </div>
            <p className="font-sans text-white/30 text-sm">Covers your HQ dashboard, brand config, SOP library, invite tools, and royalty tracking.</p>
          </div>

          <div className="border-2 border-brand-orange p-8">
            <p className="font-mono text-[10px] font-bold text-brand-orange/60 uppercase mb-2">PER LOCATION</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-archivo text-5xl text-white">₹{FRANCHISE_PER_LOCATION}</span>
              <span className="font-mono text-[10px] font-bold text-white/30 uppercase">/LOCATION /MONTH</span>
            </div>
            <p className="font-sans text-white/30 text-sm">Add or remove locations any time. You only pay for what you have active.</p>
          </div>
        </div>

        {/* Interactive calculator */}
        <div className="border border-white/10 p-6 md:p-8 mb-12">
          <h2 className="font-archivo text-2xl text-white uppercase tracking-tighter mb-6">
            CALCULATE YOUR COST
          </h2>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-[10px] font-bold text-white/40 uppercase">
                NUMBER OF LOCATIONS
              </label>
              <span className="font-archivo text-2xl text-brand-orange">{locations}</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={locations}
              onChange={(e) => setLocations(Number(e.target.value))}
              className="w-full accent-brand-orange h-1 cursor-pointer"
            />
            <div className="flex justify-between font-mono text-[9px] text-white/20 mt-1">
              <span>1</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 p-4">
              <p className="font-mono text-[9px] font-bold text-white/30 uppercase mb-1">STANDARD</p>
              <p className="font-archivo text-3xl text-white">₹{total.toLocaleString('en-IN')}<span className="font-mono text-[10px] text-white/30">/mo</span></p>
              <p className="font-mono text-[9px] text-white/20 mt-1">
                ₹{FRANCHISE_BASE_PRICE.toLocaleString('en-IN')} + ({locations} × ₹{FRANCHISE_PER_LOCATION})
              </p>
            </div>
            <div className="bg-brand-orange/5 border border-brand-orange/30 p-4">
              <p className="font-mono text-[9px] font-bold text-brand-orange/60 uppercase mb-1">PRO SUBSCRIBER RATE</p>
              <p className="font-archivo text-3xl text-brand-orange">₹{proTotal.toLocaleString('en-IN')}<span className="font-mono text-[10px] text-brand-orange/40">/mo</span></p>
              <p className="font-mono text-[9px] text-white/20 mt-1">
                15% OFF BASE — SAVE ₹{(total - proTotal).toLocaleString('en-IN')}/MO
              </p>
            </div>
          </div>

          <p className="font-mono text-[10px] text-white/20 uppercase font-bold mt-4">+18% GST APPLICABLE ON ALL AMOUNTS</p>
        </div>

        {/* Quick examples */}
        <div className="mb-12">
          <h2 className="font-archivo text-2xl text-white uppercase tracking-tighter mb-4">
            QUICK EXAMPLES
          </h2>
          <div className="border border-white/10 divide-y divide-white/5">
            <div className="hidden md:grid grid-cols-4 gap-4 px-4 py-2 font-mono text-[9px] font-bold text-white/20 uppercase">
              <span>Locations</span>
              <span>Base</span>
              <span>Total/mo</span>
              <span>Pro Rate/mo</span>
            </div>
            {EXAMPLES.map((n) => {
              const t = FRANCHISE_BASE_PRICE + n * FRANCHISE_PER_LOCATION;
              const p = Math.round(FRANCHISE_BASE_PRICE * 0.85) + n * FRANCHISE_PER_LOCATION;
              return (
                <div key={n} className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-3 items-center">
                  <span className="font-archivo text-lg text-white">{n} {n === 1 ? 'location' : 'locations'}</span>
                  <span className="font-mono text-xs text-white/30 hidden md:block">₹{FRANCHISE_BASE_PRICE.toLocaleString('en-IN')}</span>
                  <span className="font-archivo text-lg text-white">₹{t.toLocaleString('en-IN')}</span>
                  <span className="font-mono text-xs text-brand-orange">₹{p.toLocaleString('en-IN')} <span className="text-white/20">(Pro)</span></span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="border border-white/10 p-6 md:p-8 mb-12">
          <h2 className="font-archivo text-2xl text-white uppercase tracking-tighter mb-6">EVERYTHING INCLUDED</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FRANCHISE_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-orange flex-shrink-0" strokeWidth={3} />
                <span className="font-mono text-[10px] font-bold text-white/60 uppercase">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/franchise/readiness"
            className="inline-flex items-center gap-2 bg-brand-orange text-black px-10 py-5 font-archivo text-2xl uppercase tracking-tighter hover:opacity-90 transition-opacity">
            START READINESS CHECK
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="font-mono text-[10px] text-white/20 uppercase font-bold mt-4">
            FREE TO CHECK — PAY ONLY WHEN YOU LAUNCH
          </p>
        </div>
      </div>
    </main>
  );
};
