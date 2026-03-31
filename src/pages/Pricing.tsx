import React, { useState, useEffect } from 'react';
import { Check, X, MessageSquare, GitBranch } from 'lucide-react';
import { WaitlistForm } from '../components/WaitlistForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  PRICING, SAVINGS, TOKEN_PACKS, PLAN_TOKENS, CYCLE_DAYS,
  toPaise, type BillingCycle, type PlanId,
} from '../lib/constants';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

declare global { interface Window { Razorpay: any; } }

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
    id: 'basic',
    label: 'Basic',
    members: 'Any members',
    highlight: false,
    features: ['Member management', 'Attendance & payments', 'Reports & analytics', 'Trainer management'],
    missing: ['WhatsApp automation', 'AI features', 'Branch management'],
  },
  {
    id: 'pro',
    label: 'Pro',
    members: 'Up to 200 members',
    highlight: true,
    features: ['Everything in Basic', '500 WhatsApp tokens/mo', 'AI Insights & Reports', 'Revenue Forecast', 'Churn Early Warning', 'AI Diet & Workout Plans', 'Branch add-on available', '7-day free trial'],
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

  useEffect(() => {
    if (document.getElementById('rzp-sdk')) return;
    const s = document.createElement('script');
    s.id = 'rzp-sdk';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(s);
  }, []);

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
    if (typeof window.Razorpay === 'undefined') {
      toast('Payment gateway is still loading — please try again.', 'error');
      return;
    }

    const amount = PRICING[planId][cycle];

    // 1. Create pending purchase record
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

    const rzp = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: toPaise(amount),
      currency: 'INR',
      name: 'GymSetu',
      description: `${planId.replace(/_/g, ' ').toUpperCase()} Plan — ${cycle.replace('_', '-')}`,
      prefill: {
        name: session.user.user_metadata?.full_name ?? '',
        contact: session.user.user_metadata?.phone ?? '',
        email: session.user.email ?? '',
      },
      notes: { purchase_id: purchase.id, plan: planId, cycle },
      theme: { color: '#FF4D00' },
      handler: async (response: { razorpay_payment_id: string }) => {
        try {
          const now      = new Date();
          const days     = CYCLE_DAYS[cycle];
          const periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
          const monthYear = now.toISOString().slice(0, 7);

          // 2a. Mark purchase as paid
          await supabase.from('purchases').update({
            status: 'paid',
            razorpay_payment_id: response.razorpay_payment_id,
          }).eq('id', purchase.id);

          // 2b. Update subscription
          const { error: subErr } = await supabase.from('subscriptions').update({
            plan: planId,
            billing_cycle: cycle,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            razorpay_payment_id: response.razorpay_payment_id,
          }).eq('id', subId);
          if (subErr) throw new Error(subErr.message);

          // 2c. Seed / reset token allocation for new plan
          const tokenAlloc = PLAN_TOKENS[planId];
          if (tokenAlloc > 0) {
            await supabase.from('subscription_tokens').upsert(
              { gym_id: gymId, month_year: monthYear, tokens_total: tokenAlloc, tokens_used: 0 },
              { onConflict: 'gym_id,month_year' }
            );
          }

          setCurrentPlan(planId);
          setUpgradeSuccess(planId);
          trackEvent('purchase', { product: 'plan', plan: planId, cycle, value: amount });
        } catch (err) {
          await supabase.from('purchases').update({ status: 'failed' }).eq('id', purchase.id);
          toast(err instanceof Error ? err.message : 'Plan upgrade failed.', 'error');
        } finally {
          setPurchasing(false);
        }
      },
      modal: { ondismiss: () => setPurchasing(false) },
    });
    rzp.open();
  };

  const isReady = !authLoading && !profileLoading;

  return (
    <main className="bg-near-black pt-32 md:pt-48 pb-24 md:pb-32 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-archivo text-6xl sm:text-7xl md:text-[10vw] text-white uppercase leading-none mb-12 md:mb-16 tracking-tighter">
          SIMPLE, <span className="text-brand-orange">HONEST</span><br />PRICING.
        </h1>

        {/* Cycle toggle */}
        <div className="flex flex-wrap gap-2 mb-12 md:mb-16">
          {CYCLES.map(c => (
            <button key={c.key} type="button" onClick={() => setCycle(c.key)}
              className={`relative px-5 py-2.5 font-mono text-[11px] font-bold uppercase transition-all ${
                cycle === c.key
                  ? 'bg-brand-orange text-black'
                  : 'border border-white/20 text-white/50 hover:border-white/50 hover:text-white'
              }`}
            >
              {c.label}
              {c.discount && <span className="ml-1.5 opacity-60 text-[9px]">{c.discount}</span>}
              {c.tag && (
                <span className="absolute -top-px -right-px -translate-y-full bg-black border border-brand-orange text-brand-orange font-mono text-[8px] uppercase px-1.5 py-0.5 font-bold">
                  {c.tag}
                </span>
              )}
            </button>
          ))}
        </div>

        {upgradeSuccess && (
          <div role="alert" className="mb-12 border-2 border-brand-orange bg-brand-orange/10 p-6 text-center">
            <Check className="w-8 h-8 text-brand-orange mx-auto mb-2" strokeWidth={3} />
            <p className="font-archivo text-2xl text-brand-orange uppercase">
              UPGRADED TO {upgradeSuccess.replace(/_/g, ' ').toUpperCase()}!
            </p>
            <p className="font-mono text-xs text-white/60 uppercase mt-2 font-bold">
              Your subscription is now active. Open the GymSetu app to start using new features.
            </p>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
          {PLANS.map(plan => {
            const amount   = PRICING[plan.id][cycle];
            const savings  = SAVINGS[plan.id][cycle];
            const perMonth = Math.round(amount / CYCLE_MONTHS[cycle]);
            const isCurrent = currentPlan === plan.id;

            return (
              <div key={plan.id}
                className={`relative border-2 p-6 md:p-8 flex flex-col ${
                  isCurrent
                    ? 'border-brand-orange ring-1 ring-brand-orange/20'
                    : plan.highlight
                      ? 'border-brand-orange/50'
                      : 'border-white/20'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-0 left-0 bg-brand-orange text-black px-3 py-1 font-mono text-[9px] font-bold uppercase -translate-y-1/2 translate-x-2">
                    CURRENT PLAN
                  </div>
                )}
                {plan.highlight && !isCurrent && (
                  <div className="absolute top-0 right-0 bg-brand-orange/20 border border-brand-orange text-brand-orange px-3 py-1 font-mono text-[9px] font-bold uppercase -translate-y-1/2 translate-x-1">
                    RECOMMENDED
                  </div>
                )}

                <h2 className={`font-archivo text-3xl md:text-4xl mb-0.5 ${isCurrent || plan.highlight ? 'text-brand-orange' : 'text-white'}`}>
                  {plan.label.toUpperCase()}
                </h2>
                <p className="font-mono text-[10px] text-white/30 uppercase font-bold mb-3">{plan.members}</p>

                <div className={`inline-flex items-center gap-1.5 self-start px-2.5 py-1 mb-4 font-mono text-[9px] font-bold uppercase ${
                  plan.id === 'basic'
                    ? 'border border-white/10 text-white/20'
                    : 'border border-brand-orange/40 bg-brand-orange/10 text-brand-orange'
                }`}>
                  <MessageSquare className="w-3 h-3" />
                  {plan.id === 'basic' ? 'No WhatsApp' : `${PLAN_TOKENS[plan.id].toLocaleString('en-IN')} tokens/mo`}
                </div>

                <div className="mb-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-archivo text-4xl md:text-5xl text-white">
                      ₹{amount.toLocaleString('en-IN')}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-white/40 uppercase">
                      /{CYCLES.find(c => c.key === cycle)?.label}
                    </span>
                  </div>
                  {cycle !== 'monthly' && (
                    <p className="font-mono text-[10px] font-bold text-white/30 mt-0.5">
                      ₹{perMonth.toLocaleString('en-IN')}/mo equivalent
                    </p>
                  )}
                  <p className="font-mono text-[9px] font-bold text-white/20 mt-0.5">+18% GST applicable</p>
                </div>

                {savings > 0 ? (
                  <div className="inline-flex items-center self-start px-2.5 py-1 mb-6 bg-brand-orange/10 border border-brand-orange/30 text-brand-orange font-mono text-[9px] font-bold uppercase">
                    SAVE ₹{savings.toLocaleString('en-IN')}
                  </div>
                ) : <div className="mb-6" />}

                <ul className="flex flex-col gap-3 mb-8 flex-grow">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-brand-orange" strokeWidth={3} />
                      <span className="font-mono text-[10px] font-bold uppercase text-white/70">{f}</span>
                    </li>
                  ))}
                  {plan.missing.map((f, i) => (
                    <li key={`x-${i}`} className="flex items-start gap-2.5 opacity-25">
                      <X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={3} />
                      <span className="font-mono text-[10px] font-bold uppercase">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA — auth vs non-auth */}
                {isReady && session && gymId ? (
                  isCurrent ? (
                    <div className="w-full py-4 font-archivo text-lg uppercase tracking-tighter text-center border-2 border-brand-orange/30 text-brand-orange/60 cursor-default">
                      CURRENT PLAN
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        trackEvent('cta_click', { plan: plan.id, cycle, page: 'pricing' });
                        handleUpgrade(plan.id);
                      }}
                      disabled={purchasing}
                      className="w-full py-4 font-archivo text-lg uppercase tracking-tighter transition-opacity hover:opacity-90 disabled:opacity-50 bg-brand-orange text-black"
                    >
                      {purchasing ? 'PROCESSING...' : `SWITCH TO ${plan.label.toUpperCase()} →`}
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => {
                      trackEvent('cta_click', { plan: plan.id, cycle, page: 'pricing' });
                      setActiveModal(plan.id);
                    }}
                    className={`w-full py-4 font-archivo text-lg uppercase tracking-tighter transition-opacity hover:opacity-90 ${
                      plan.highlight
                        ? 'bg-brand-orange text-black'
                        : 'bg-white/10 text-white border border-white/20 hover:border-white/40'
                    }`}
                  >
                    {plan.id === 'pro' ? 'START FREE TRIAL' : 'GET STARTED'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Branch add-on callout */}
        <div className="mt-16 md:mt-20 border-2 border-white/10 p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-5 h-5 text-brand-orange" />
              <span className="font-mono text-[10px] font-bold text-brand-orange uppercase tracking-widest">Branch Add-On</span>
            </div>
            <h3 className="font-archivo text-2xl md:text-3xl text-white uppercase tracking-tighter mb-2">
              MANAGE MULTIPLE LOCATIONS
            </h3>
            <p className="font-sans text-white/40 text-sm">
              Add branches to any Pro plan. Each gets its own members, trainers, payments, attendance, and WhatsApp pool.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              { label: '1 Branch', price: '₹799/mo' },
              { label: '2 Branches', price: '₹1,499/mo' },
              { label: '3 Branches', price: '₹2,099/mo' },
            ].map(b => (
              <div key={b.label} className="border border-white/20 px-5 py-4 text-center min-w-[110px]">
                <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-1">{b.label}</p>
                <p className="font-archivo text-xl text-white">{b.price}</p>
              </div>
            ))}
          </div>
          <a href="/branches" className="font-mono text-[10px] font-bold text-brand-orange uppercase hover:underline whitespace-nowrap">
            ADD BRANCHES →
          </a>
        </div>

        {/* Token packs callout */}
        <div className="mt-10 border-2 border-white/10 p-8 md:p-10">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-brand-orange" />
            <span className="font-mono text-[10px] font-bold text-brand-orange uppercase tracking-widest">WhatsApp Top-Up Packs</span>
          </div>
          <p className="font-sans text-white/40 text-sm mb-8">
            Run out of tokens mid-month? Top up instantly — added to your current month's pool right away.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TOKEN_PACKS.map(pack => (
              <div key={pack.name} className="border border-white/20 p-6 text-center hover:border-brand-orange transition-colors">
                <div className="font-mono text-[10px] text-brand-orange mb-2 font-bold">{pack.name}</div>
                <div className="font-archivo text-2xl text-white mb-1">{pack.tokens.toLocaleString('en-IN')} tokens</div>
                <div className="font-archivo text-2xl text-brand-orange">₹{pack.price}</div>
                <p className="font-mono text-[9px] text-white/20 mt-1">+18% GST applicable</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a href="/tokens" className="font-mono text-[10px] font-bold text-brand-orange uppercase hover:underline">
              BUY TOKEN PACK →
            </a>
          </div>
        </div>

        <p className="mt-12 text-center font-mono text-[10px] md:text-sm text-white/40 uppercase font-bold">
          NOT HAPPY IN YOUR FIRST 7 DAYS? WE'LL REFUND YOU. NO QUESTIONS.
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
