import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
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
    <main className="bg-near-black min-h-screen px-4 pt-24 pb-40 md:pb-16">
      <div className="max-w-5xl mx-auto">
        <StepIndicator step={2} />

        <h1 className="font-archivo text-5xl md:text-6xl text-white uppercase mb-2 leading-none tracking-tighter">
          CHOOSE YOUR<br /><span className="text-brand-orange">PLAN.</span>
        </h1>
        <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-8">STEP 2 OF 3</p>

        {/* Billing cycle toggle */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CYCLES.map(c => (
            <button key={c.key} type="button" onClick={() => setCycle(c.key)}
              className={`relative px-4 py-2 font-mono text-[10px] font-bold uppercase transition-all ${
                cycle === c.key
                  ? 'bg-brand-orange text-black'
                  : 'border border-white/20 text-white/50 hover:border-white/50 hover:text-white'
              }`}
            >
              {c.label}
              {c.tag && (
                <span className="absolute -top-px -right-px -translate-y-full bg-black border border-brand-orange text-brand-orange font-mono text-[8px] uppercase px-1.5 py-0.5 font-bold">
                  {c.tag}
                </span>
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
                className={`relative border-2 p-5 flex flex-col ${
                  plan.highlight ? 'border-brand-orange' : 'border-white/20'
                }`}
              >
                {plan.id === 'pro' && (
                  <span className="absolute -top-px right-4 -translate-y-full bg-black text-white font-mono text-[8px] uppercase px-2 py-0.5 font-bold border border-white/20">
                    7-DAY FREE TRIAL
                  </span>
                )}

                <div className={`font-archivo text-2xl mb-0.5 ${plan.highlight ? 'text-brand-orange' : 'text-white'}`}>
                  {plan.label.toUpperCase()}
                </div>
                <p className="font-mono text-[9px] text-white/30 uppercase font-bold mb-3">{plan.members}</p>

                <div className="mb-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-archivo text-2xl text-white">₹{amount.toLocaleString('en-IN')}</span>
                    <span className="font-mono text-[9px] font-bold text-white/40 uppercase">
                      /{CYCLES.find(c => c.key === cycle)?.label}
                    </span>
                  </div>
                  {cycle !== 'monthly' && (
                    <p className="font-mono text-[9px] font-bold text-white/30 mt-0.5">
                      ₹{perMonth.toLocaleString('en-IN')}/mo
                    </p>
                  )}
                  <p className="font-mono text-[9px] font-bold text-white/20 mt-0.5">+18% GST applicable</p>
                </div>

                {savings > 0 ? (
                  <span className="inline-flex self-start mt-1.5 mb-4 bg-brand-orange/10 border border-brand-orange/30 text-brand-orange font-mono text-[9px] font-bold uppercase px-2 py-0.5">
                    SAVE ₹{savings.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <div className="mb-4" />
                )}

                <ul className="flex flex-col gap-2 flex-1 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="font-sans text-xs text-white/70 flex items-start gap-2">
                      <Check className="w-3 h-3 flex-shrink-0 mt-0.5 text-brand-orange" strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={`/signup/setup?plan=${plan.id}&cycle=${cycle}`}
                  className={`block w-full py-3 font-archivo text-base uppercase tracking-tighter text-center transition-opacity hover:opacity-90 ${
                    plan.highlight
                      ? 'bg-brand-orange text-black'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                >
                  {plan.id === 'pro' ? 'START FREE TRIAL →' : `CHOOSE ${plan.label.toUpperCase()} →`}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};
