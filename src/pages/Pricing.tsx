import React, { useState, useEffect } from 'react';
import { Check, X, MessageSquare, GitBranch } from 'lucide-react';
import { WaitlistForm } from '../components/WaitlistForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  PRICING, SAVINGS, TOKEN_PACKS, PLAN_TOKENS,
  type BillingCycle, type PlanId,
} from '../lib/constants';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { initiatePayU } from '../lib/payu';

const CYCLES: { key: BillingCycle; label: string; tag?: string; discount: string }[] = [
  { key: 'monthly',     label: 'Monthly',     discount: '' },
  { key: 'quarterly',   label: 'Quarterly',   discount: '8% off' },
  { key: 'half_yearly', label: 'Half-Yearly', discount: '12% off', tag: 'POPULAR' },
  { key: 'yearly',      label: 'Yearly',      discount: '15% off' },
];

const CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1, quarterly: 3, half_yearly: 6, yearly: 12,
};

const PLANS: {
  id: PlanId;
  label: string;
  members: string;
  highlight: boolean;
  features: string[];
  missing: string[];
}[] = [
  {
    id: 'pro',
    label: 'Pro',
    members: 'Up to 200 members',
    highlight: true,
    features: ['Member, attendance & payments', 'GST invoices & reports', '500 WhatsApp tokens/mo', 'AI Insights & Reports', 'Revenue Forecast', 'Churn Early Warning', 'AI Diet & Workout Plans', 'Trainer management', 'Branch add-on available', '7-day free trial'],
    missing: [],
  },
  {
    id: 'pro_plus',
    label: 'Pro Plus',
    members: '200–500 members',
    highlight: false,
    features: ['Everything in Pro', '1,000 WhatsApp tokens/mo', 'AI features', 'Branch add-on available'],
    missing: [],
  },
  {
    id: 'pro_max',
    label: 'Pro Max',
    members: '500+ members',
    highlight: false,
    features: ['Everything in Pro Plus', '2,000 WhatsApp tokens/mo', 'Priority support', 'Advanced analytics', 'Branch add-on available'],
    missing: [],
  },
];

export const Pricing = () => {
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [cycle, setCycle]           = useState<BillingCycle>('half_yearly');
  const [activeModal, setActiveModal] = useState<PlanId | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState<PlanId | null>(null);

  // Authenticated user state
  const [gymId, setGymId]         = useState<string | null>(null);
  const [subId, setSubId]         = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => { document.title = 'Pricing | GymSetu'; }, []);

  // Load current plan for auth users
  useEffect(() => {
    if (authLoading) return;
    if (!session) { setProfileLoading(false); return; }
    (async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles').select('gym_id').eq('id', session.user.id).maybeSingle();
        if (!profile?.gym_id) { setProfileLoading(false); return; }
        setGymId(profile.gym_id);

        const { data: sub } = await supabase
          .from('subscriptions').select('id, plan').eq('gym_id', profile.gym_id).maybeSingle();
        if (sub) { setSubId(sub.id); setCurrentPlan(sub.plan as PlanId); }
      } catch (e) { console.error(e); }
      setProfileLoading(false);
    })();
  }, [authLoading, session]);

  const handleUpgrade = async (planId: PlanId) => {
    if (!session || !gymId || !subId) return;

    const amount = PRICING[planId][cycle];

    // Create pending purchase record — payu-callback flips status to 'paid'
    // and applies the plan upgrade server-side after PayU confirms.
    const { data: purchase, error: purchaseErr } = await supabase
      .from('purchases').insert({
        owner_id: session.user.id,
        gym_id: gymId,
        type: 'plan',
        plan: planId,
        billing_cycle: cycle,
        amount,
        status: 'pending',
      }).select('id').single();

    if (purchaseErr || !purchase) {
      toast('Could not initiate purchase — please try again.', 'error');
      return;
    }

    setPurchasing(true);
    trackEvent('purchase_initiated', { product: 'plan', plan: planId, cycle, value: amount });

    try {
      await initiatePayU({
        purchase_id: purchase.id,
        amount,
        productinfo: `${planId.replace(/_/g, ' ').toUpperCase()} Plan — ${cycle.replace('_', '-')}`,
        firstname:   session.user.user_metadata?.full_name ?? session.user.email ?? '',
        email:       session.user.email ?? '',
        phone:       session.user.user_metadata?.phone ?? '0000000000',
        udf1:        planId,
      });
      // Browser navigates to PayU — keep purchasing=true.
    } catch (err) {
      await supabase.from('purchases').update({ status: 'failed' }).eq('id', purchase.id);
      toast(err instanceof Error ? err.message : 'Could not start payment.', 'error');
      setPurchasing(false);
    }
  };

  const isReady = !authLoading && !profileLoading;

  return (
    <main className="relative bg-ink pt-32 md:pt-44 pb-24 md:pb-32 px-4 md:px-6 overflow-hidden">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="glow-orb animate-float-glow" aria-hidden="true"
        style={{ width: 560, height: 560, top: -160, left: '25%', background: 'radial-gradient(circle,#FF4D0033,transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto">
        <p className="font-mono text-[11px] text-ash uppercase tracking-[0.25em] mb-4">Pricing</p>
        <h1 className="font-display text-6xl sm:text-7xl md:text-[9vw] text-bone uppercase leading-[0.85] mb-3 tracking-tight">
          Simple, <span className="text-heat">honest</span><br />pricing
        </h1>
        <p className="font-sans text-ash text-base md:text-lg max-w-md mb-12 md:mb-14">
          Every plan is a flat monthly fee. No per-member charges, no setup costs. Cancel anytime.
        </p>

        {/* Cycle toggle */}
        <div className="inline-flex flex-wrap gap-1 p-1 glass rounded-xl mb-12 md:mb-14">
          {CYCLES.map(c => (
            <button key={c.key} type="button" onClick={() => setCycle(c.key)}
              className={`relative px-5 py-2.5 rounded-lg font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
                cycle === c.key ? 'bg-heat text-black' : 'text-ash hover:text-bone'
              }`}
            >
              {c.label}
              {c.discount && <span className="ml-1.5 opacity-70 text-[9px]">{c.discount}</span>}
              {c.tag && cycle !== c.key && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-flame" />}
            </button>
          ))}
        </div>

        {upgradeSuccess && (
          <div role="alert" className="mb-12 glass glass-heat top-sheen rounded-2xl p-6 text-center">
            <Check className="w-8 h-8 text-flame mx-auto mb-2" strokeWidth={3} />
            <p className="font-display text-2xl text-heat uppercase">
              Upgraded to {upgradeSuccess.replace(/_/g, ' ')}!
            </p>
            <p className="font-mono text-xs text-ash mt-2">
              Your subscription is now active. Open the GymSetu app to start using new features.
            </p>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6">
          {PLANS.map(plan => {
            const amount   = PRICING[plan.id][cycle];
            const savings  = SAVINGS[plan.id][cycle];
            const perMonth = Math.round(amount / CYCLE_MONTHS[cycle]);
            const isCurrent = currentPlan === plan.id;

            return (
              <div key={plan.id}
                className={`relative glass rounded-2xl p-6 md:p-7 flex flex-col ${
                  isCurrent ? 'ring-1 ring-flame/40 glass-heat' : plan.highlight ? 'glass-heat top-sheen' : ''
                }`}
              >
                {isCurrent ? (
                  <div className="absolute top-0 left-6 -translate-y-1/2 bg-heat text-black px-3 py-1 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider">
                    Current plan
                  </div>
                ) : plan.highlight && (
                  <div className="absolute top-0 right-6 -translate-y-1/2 bg-heat text-black px-3 py-1 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider">
                    Recommended
                  </div>
                )}

                <h2 className={`font-display text-3xl md:text-4xl uppercase mb-0.5 ${isCurrent || plan.highlight ? 'text-heat' : 'text-bone'}`}>
                  {plan.label}
                </h2>
                <p className="font-mono text-[10px] text-ash uppercase tracking-wider mb-3">{plan.members}</p>

                <div className={`inline-flex items-center gap-1.5 self-start px-2.5 py-1 mb-4 rounded font-mono text-[9px] font-bold uppercase ${
                  plan.id === 'basic' ? 'border border-hairline text-ash' : 'border border-flame/40 bg-flame/10 text-flame'
                }`}>
                  <MessageSquare className="w-3 h-3" />
                  {plan.id === 'basic' ? 'No WhatsApp' : `${PLAN_TOKENS[plan.id].toLocaleString('en-IN')} tokens/mo`}
                </div>

                <div className="mb-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-4xl md:text-5xl text-bone">₹{amount.toLocaleString('en-IN')}</span>
                    <span className="font-mono text-[10px] font-bold text-ash uppercase">
                      /{CYCLES.find(c => c.key === cycle)?.label}
                    </span>
                  </div>
                  {cycle !== 'monthly' && (
                    <p className="font-mono text-[10px] font-bold text-ash mt-0.5">₹{perMonth.toLocaleString('en-IN')}/mo equivalent</p>
                  )}
                  <p className="font-mono text-[9px] font-bold text-ash/60 mt-0.5">+18% GST applicable</p>
                </div>

                {savings > 0 ? (
                  <div className="inline-flex items-center self-start px-2.5 py-1 mb-6 bg-flame/10 border border-flame/30 text-flame font-mono text-[9px] font-bold uppercase rounded">
                    Save ₹{savings.toLocaleString('en-IN')}
                  </div>
                ) : <div className="mb-6" />}

                <ul className="flex flex-col gap-2.5 mb-8 flex-grow">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-flame" strokeWidth={3} />
                      <span className="font-sans text-xs text-bone/75">{f}</span>
                    </li>
                  ))}
                  {plan.missing.map((f, i) => (
                    <li key={`x-${i}`} className="flex items-start gap-2.5 opacity-40">
                      <X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-ash" strokeWidth={3} />
                      <span className="font-sans text-xs text-ash line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA — auth vs non-auth */}
                {isReady && session && gymId ? (
                  isCurrent ? (
                    <div className="w-full py-3.5 rounded-lg font-mono text-xs uppercase font-bold tracking-wider text-center border border-flame/30 text-flame/70 cursor-default">
                      Current plan
                    </div>
                  ) : (
                    <button
                      onClick={() => { trackEvent('cta_click', { plan: plan.id, cycle, page: 'pricing' }); handleUpgrade(plan.id); }}
                      disabled={purchasing}
                      className="w-full py-3.5 rounded-lg font-mono text-xs uppercase font-bold tracking-wider transition-opacity hover:opacity-90 disabled:opacity-50 bg-heat text-black"
                    >
                      {purchasing ? 'Processing…' : `Switch to ${plan.label} →`}
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => { trackEvent('cta_click', { plan: plan.id, cycle, page: 'pricing' }); setActiveModal(plan.id); }}
                    className={`w-full py-3.5 rounded-lg font-mono text-xs uppercase font-bold tracking-wider transition-opacity hover:opacity-90 ${
                      plan.highlight ? 'bg-heat text-black' : 'bg-surface text-bone border border-hairline hover:border-flame/50'
                    }`}
                  >
                    {plan.id === 'pro' ? 'Start free trial' : 'Get started'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Branch add-on callout */}
        <div className="mt-16 md:mt-20 glass rounded-2xl p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-5 h-5 text-flame" />
              <span className="font-mono text-[10px] font-bold text-flame uppercase tracking-widest">Branch add-on</span>
            </div>
            <h3 className="font-display text-2xl md:text-3xl text-bone uppercase mb-2">
              Manage multiple locations
            </h3>
            <p className="font-sans text-ash text-sm">
              Add branches to any Pro plan. Each gets its own members, trainers, payments, attendance, and WhatsApp pool.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              { label: '1 Branch', price: '₹799/mo' },
              { label: '2 Branches', price: '₹1,499/mo' },
              { label: '3 Branches', price: '₹2,099/mo' },
            ].map(b => (
              <div key={b.label} className="border border-hairline rounded-xl px-5 py-4 text-center min-w-[110px]">
                <p className="font-mono text-[10px] text-ash uppercase font-bold mb-1">{b.label}</p>
                <p className="font-display text-xl text-bone">{b.price}</p>
              </div>
            ))}
          </div>
          <a href="/branches" className="font-mono text-[10px] font-bold text-flame uppercase hover:underline whitespace-nowrap">
            Add branches →
          </a>
        </div>

        {/* Token packs callout */}
        <div className="mt-8 glass rounded-2xl p-8 md:p-10">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-flame" />
            <span className="font-mono text-[10px] font-bold text-flame uppercase tracking-widest">WhatsApp top-up packs</span>
          </div>
          <p className="font-sans text-ash text-sm mb-8">
            Run out of tokens mid-month? Top up instantly — added to your current month's pool right away.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TOKEN_PACKS.map(pack => (
              <div key={pack.name} className="border border-hairline rounded-xl p-6 text-center hover:border-flame/50 transition-colors">
                <div className="font-mono text-[10px] text-flame mb-2 font-bold uppercase tracking-wider">{pack.name}</div>
                <div className="font-display text-2xl text-bone mb-1">{pack.tokens.toLocaleString('en-IN')} tokens</div>
                <div className="font-display text-2xl text-heat">₹{pack.price}</div>
                <p className="font-mono text-[9px] text-ash/60 mt-1">+18% GST applicable</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a href="/tokens" className="font-mono text-[10px] font-bold text-flame uppercase hover:underline">
              Buy token pack →
            </a>
          </div>
        </div>

        <p className="mt-12 text-center font-mono text-[10px] md:text-xs text-ash uppercase font-bold tracking-wider">
          Not happy in your first 7 days? We'll refund you. No questions.
        </p>
      </div>

      {/* WaitlistForm for non-auth users */}
      {activeModal && !session && (
        <WaitlistForm
          plan={activeModal}
          onClose={() => setActiveModal(null)}
          onReadyForPayment={() => setActiveModal(null)}
        />
      )}
    </main>
  );
};
