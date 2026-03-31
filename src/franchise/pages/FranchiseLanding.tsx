import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Building2, BarChart3, Shield, Users, Plus } from 'lucide-react';
import { FRANCHISE_BASE_PRICE, FRANCHISE_PER_LOCATION, FRANCHISE_FEATURES } from '../../lib/franchise-constants';

const features = [
  { icon: Building2,  title: 'MULTI-LOCATION HQ',     desc: 'Manage all your franchise locations from one powerful dashboard.' },
  { icon: BarChart3,  title: 'REVENUE ANALYTICS',      desc: 'Track revenue, member growth, and churn across every location with Recharts-powered visuals.' },
  { icon: Shield,     title: 'SOP COMPLIANCE',         desc: 'Create SOP templates, push to franchisees, and track completion.' },
  { icon: Users,      title: 'INVITE-BASED ONBOARDING', desc: 'Generate invite links — no email setup needed. Franchisees sign up and get auto-linked.' },
];

const steps = [
  { num: '01', title: 'CHECK READINESS',  desc: 'Complete a 9-point franchise readiness checklist to ensure your brand is expansion-ready.' },
  { num: '02', title: 'CONFIGURE BRAND',  desc: 'Set franchise fees, royalty percentages, territory model, and support levels.' },
  { num: '03', title: 'INVITE & GROW',    desc: 'Generate invite links, onboard franchisees, and scale your brand across cities.' },
];

export const FranchiseLanding = () => {
  useEffect(() => { document.title = 'Franchise Management | GymSetu'; }, []);

  return (
    <main className="bg-near-black min-h-screen">
      {/* Hero */}
      <section className="px-4 md:px-6 pt-32 md:pt-48 pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto">
          <div className="font-mono text-[10px] text-brand-orange uppercase font-bold mb-4 tracking-widest">
            FRANCHISE MODULE
          </div>
          <h1 className="font-archivo text-5xl sm:text-6xl md:text-[8vw] text-white uppercase leading-none tracking-tighter mb-6">
            SCALE YOUR<br />
            <span className="text-brand-orange">GYM BRAND.</span>
          </h1>
          <p className="font-sans text-white/50 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
            Turn your successful gym into a franchise empire. Manage locations,
            track royalties, enforce standards — all from one HQ dashboard.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/franchise/readiness"
              className="inline-flex items-center gap-2 bg-brand-orange text-black px-8 py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity"
            >
              START READINESS CHECK
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/franchise/pricing"
              className="inline-flex items-center gap-2 border-2 border-white/20 text-white px-8 py-4 font-archivo text-xl uppercase tracking-tighter hover:border-white/50 transition-colors"
            >
              VIEW PRICING
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-4 md:px-6 pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="border-2 border-white/10 p-8 hover:border-brand-orange/50 transition-colors"
              >
                <Icon className="w-8 h-8 text-brand-orange mb-4" />
                <h3 className="font-archivo text-2xl text-white mb-2">
                  {f.title}
                </h3>
                <p className="font-sans text-white/50 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 md:px-6 pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-archivo text-4xl md:text-5xl text-white uppercase mb-12 tracking-tighter">
            HOW IT <span className="text-brand-orange">WORKS.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="relative">
                <div className="font-archivo text-6xl text-white/5 mb-2">
                  {s.num}
                </div>
                <h3 className="font-archivo text-xl text-white mb-2">
                  {s.title}
                </h3>
                <p className="font-sans text-white/40 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 md:px-6 pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-archivo text-4xl md:text-5xl text-white uppercase mb-12 tracking-tighter">
            SIMPLE <span className="text-brand-orange">PRICING.</span>
          </h2>

          <div className="border-2 border-brand-orange p-8 md:p-12">
            {/* Price header */}
            <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
              <div>
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="font-archivo text-6xl md:text-7xl text-white">
                    ₹{FRANCHISE_BASE_PRICE.toLocaleString('en-IN')}
                  </span>
                  <span className="font-mono text-xs font-bold text-white/40 uppercase">/MONTH BASE</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Plus className="w-4 h-4 text-brand-orange" />
                  <span className="font-archivo text-3xl text-brand-orange">
                    ₹{FRANCHISE_PER_LOCATION}
                  </span>
                  <span className="font-mono text-xs font-bold text-white/40 uppercase">/LOCATION /MONTH</span>
                </div>
                <p className="font-mono text-[10px] font-bold text-white/20 mt-2">+18% GST APPLICABLE</p>
              </div>
              <div className="md:ml-auto">
                <Link
                  to="/franchise/readiness"
                  className="inline-flex items-center gap-2 bg-brand-orange text-black px-8 py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity"
                >
                  GET STARTED <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Example */}
            <div className="bg-white/5 border border-white/10 p-4 md:p-6 mb-8">
              <p className="font-mono text-[10px] font-bold text-white/40 uppercase mb-2">EXAMPLE</p>
              <p className="font-sans text-white/60 text-sm">
                5 locations = ₹{FRANCHISE_BASE_PRICE.toLocaleString('en-IN')} + (5 × ₹{FRANCHISE_PER_LOCATION}) = <span className="text-white font-bold">₹{(FRANCHISE_BASE_PRICE + 5 * FRANCHISE_PER_LOCATION).toLocaleString('en-IN')}/mo</span>
              </p>
              <p className="font-sans text-white/60 text-sm mt-1">
                10 locations = ₹{FRANCHISE_BASE_PRICE.toLocaleString('en-IN')} + (10 × ₹{FRANCHISE_PER_LOCATION}) = <span className="text-white font-bold">₹{(FRANCHISE_BASE_PRICE + 10 * FRANCHISE_PER_LOCATION).toLocaleString('en-IN')}/mo</span>
              </p>
            </div>

            {/* Features list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FRANCHISE_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-orange flex-shrink-0" strokeWidth={3} />
                  <span className="font-mono text-xs font-bold text-white/60 uppercase">{f}</span>
                </div>
              ))}
            </div>

            {/* Pro discount note */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="font-sans text-white/40 text-sm">
                GymSetu Pro subscribers get <span className="text-brand-orange font-bold">15% off the base price</span> —
                pay ₹{Math.round(FRANCHISE_BASE_PRICE * 0.85).toLocaleString('en-IN')}/mo instead of ₹{FRANCHISE_BASE_PRICE.toLocaleString('en-IN')}/mo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 md:px-6 pb-24 md:pb-32">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-archivo text-3xl text-white uppercase mb-8 tracking-tighter">
            QUESTIONS.
          </h2>
          {[
            { q: 'Do I need to be a GymSetu user to franchise?', a: 'Any gym owner can register as a franchisor. Pro plan subscribers get a 15% discount on franchise subscriptions.' },
            { q: 'How do franchisees join?', a: 'You generate an invite link and share it (WhatsApp, email, etc). The franchisee clicks the link, creates an account, and gets auto-linked to your brand.' },
            { q: 'What does it cost?', a: '₹4,999/mo base + ₹699 per location per month. GymSetu Pro subscribers get 15% off the base price. Separate from your gym subscription.' },
            { q: 'Can I track revenue from each location?', a: 'Yes. Each franchisee reports monthly revenue, and royalty invoices are auto-generated based on your configured royalty percentage.' },
          ].map((item) => (
            <div key={item.q} className="border-b border-white/10 py-6">
              <h4 className="font-mono text-xs font-bold text-white uppercase mb-2">
                {item.q}
              </h4>
              <p className="font-sans text-white/40 text-sm leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Simple footer */}
      <footer className="px-4 md:px-6 py-8 border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="font-archivo text-lg tracking-tighter text-white/30 hover:text-white transition-colors">
            GYMSETU
          </Link>
          <p className="font-mono text-[10px] text-white/20 uppercase font-bold">
            FRANCHISE MANAGEMENT BY GYMSETU
          </p>
        </div>
      </footer>
    </main>
  );
};
