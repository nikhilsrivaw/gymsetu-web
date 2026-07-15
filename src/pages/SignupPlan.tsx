import React, { useEffect, useState } from 'react';
import { Check, MessageSquare } from 'lucide-react';
import { PRICING, SAVINGS, type BillingCycle, type PlanId } from '../lib/constants';
import { StepIndicator } from './Signup';

const CYCLES: { key: BillingCycle; label: string; tag?: string }[] = [
  { key: 'monthly',     label: 'Monthly' },
  { key: 'quarterly',   label: 'Quarterly' },
  { key: 'half_yearly', label: 'Half-Yearly', tag: 'RECOMMENDED' },
  { key: 'yearly',      label: 'Yearly' },
];

const CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1, quarterly: 3, half_yearly: 6, yearly: 12,
};

const PLANS: { id: PlanId; label: string; members: string; tokens: string; highlight: boolean; features: string[] }[] = [
  {
    id: 'basic',
    label: 'Basic',
    members: 'Any members',
    tokens: 'No WhatsApp',
    highlight: false,
    features: ['Member management', 'Attendance & payments', 'Reports & analytics', 'Trainer management'],
  },
  {
    id: 'pro',
    label: 'Pro',
    members: 'Up to 200 members',
    tokens: '500 tokens/mo',
    highlight: true,
    features: ['Everything in Basic', '500 WhatsApp tokens/mo', 'AI features', 'Branch add-on available', '7-day free trial'],
  },
  {
    id: 'pro_plus',
    label: 'Pro Plus',
    members: '200–500 members',
    tokens: '1,000 tokens/mo',
    highlight: false,
    features: ['Everything in Pro', '1,000 WhatsApp tokens/mo', 'AI features', 'Branch add-on available'],
  },
  {
    id: 'pro_max',
    label: 'Pro Max',
    members: '500+ members',
    tokens: '2,000 tokens/mo',
    highlight: false,
    features: ['Everything in Pro Plus', '2,000 WhatsApp tokens/mo', 'Priority support'],
  },
];

export const SignupPlan = () => {
  const [cycle, setCycle] = useState<BillingCycle>('half_yearly');

  useEffect(() => { document.title = 'Choose Plan | GymSetu'; }, []);

  return (
    <main className="relative bg-ink min-h-screen px-4 pt-28 pb-40 md:pb-20 overflow-hidden">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="glow-orb animate-float-glow" aria-hidden="true"
        style={{ width: 520, height: 520, top: -140, left: '30%', background: 'radial-gradient(circle,#FF4D0033,transparent 70%)' }} />

      <div className="relative max-w-5xl mx-auto">
        <StepIndicator step={2} />

        <div className="mb-8">
          <p className="font-mono text-[10px] text-ash uppercase tracking-[0.2em] mb-2">Step 2 of 3</p>
          <h1 className="font-display text-5xl md:text-6xl text-bone uppercase leading-[0.9]">
            Choose your <span className="text-heat">plan</span>
          </h1>
        </div>

        {/* Billing cycle toggle */}
        <div className="inline-flex flex-wrap gap-1 p-1 glass rounded-xl mb-8">
          {CYCLES.map(c => (
            <button key={c.key} type="button" onClick={() => setCycle(c.key)}
              className={`relative px-4 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                cycle === c.key ? 'bg-heat text-black' : 'text-ash hover:text-bone'
              }`}
            >
              {c.label}
              {c.tag && cycle !== c.key && (
                <span className="absolute -top-1.5 -right-1 w-2 h-2 rounded-full bg-flame" />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map(plan => {
            const amount = PRICING[plan.id][cycle];
            const savings = SAVINGS[plan.id][cycle];
            const perMonth = Math.round(amount / CYCLE_MONTHS[cycle]);

            return (
              <div key={plan.id}
                className={`relative glass rounded-2xl p-5 flex flex-col ${plan.highlight ? 'glass-heat top-sheen' : ''}`}
              >
                {plan.id === 'pro' && (
                  <span className="absolute top-0 right-4 -translate-y-1/2 bg-heat text-black font-mono text-[8px] uppercase px-2 py-0.5 font-bold rounded-full tracking-wider">
                    7-day free trial
                  </span>
                )}

                <div className={`font-display text-2xl uppercase mb-0.5 ${plan.highlight ? 'text-heat' : 'text-bone'}`}>
                  {plan.label}
                </div>
                <p className="font-mono text-[9px] text-ash uppercase tracking-wider mb-3">{plan.members}</p>

                <div className={`inline-flex items-center gap-1.5 self-start px-2 py-0.5 mb-4 rounded font-mono text-[9px] font-bold uppercase ${
                  plan.id === 'basic' ? 'border border-hairline text-ash' : 'border border-flame/40 bg-flame/10 text-flame'
                }`}>
                  <MessageSquare className="w-2.5 h-2.5" />{plan.tokens}
                </div>

                <div className="mb-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-3xl text-bone">₹{amount.toLocaleString('en-IN')}</span>
                    <span className="font-mono text-[9px] font-bold text-ash uppercase">
                      /{CYCLES.find(c => c.key === cycle)?.label}
                    </span>
                  </div>
                  {cycle !== 'monthly' && (
                    <p className="font-mono text-[9px] font-bold text-ash mt-0.5">₹{perMonth.toLocaleString('en-IN')}/mo equiv.</p>
                  )}
                  <p className="font-mono text-[9px] font-bold text-ash/60 mt-0.5">+18% GST</p>
                </div>

                {savings > 0 ? (
                  <span className="inline-flex self-start mt-1.5 mb-4 bg-flame/10 border border-flame/30 text-flame font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                    Save ₹{savings.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <div className="mb-4" />
                )}

                <ul className="flex flex-col gap-2 flex-1 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="font-sans text-xs text-bone/70 flex items-start gap-2">
                      <Check className="w-3 h-3 flex-shrink-0 mt-0.5 text-flame" strokeWidth={3} />{f}
                    </li>
                  ))}
                </ul>

                <a
                  href={`/signup/setup?plan=${plan.id}&cycle=${cycle}`}
                  className={`block w-full py-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider text-center transition-opacity hover:opacity-90 ${
                    plan.highlight ? 'bg-heat text-black' : 'bg-surface text-bone border border-hairline hover:border-flame/50'
                  }`}
                >
                  {plan.id === 'pro' ? 'Start free trial →' : `Choose ${plan.label} →`}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};
