import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RAZORPAY_BASIC_PAISE } from '../lib/constants';
import { trackEvent } from '../lib/analytics';

declare global {
  interface Window { Razorpay: any; }
}

type Plan = 'basic' | 'pro';

function validatePhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

export const Onboarding = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    full_name: '',
    gym_name: '',
    phone: '',
    city: '',
  });
  const [selectedPlan, setSelectedPlan] = useState<Plan>('pro');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Complete Setup | GymSetu';
  }, []);

  // Pre-fill name from OAuth metadata
  useEffect(() => {
    if (session?.user?.user_metadata?.full_name) {
      setForm(f => ({ ...f, full_name: session.user.user_metadata.full_name }));
    }
  }, [session]);

  // Load Razorpay SDK
  useEffect(() => {
    if (document.getElementById('rzp-sdk')) return;
    const script = document.createElement('script');
    script.id = 'rzp-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(script);
  }, []);

  const createSubscription = async (gymId: string, userId: string, plan: Plan, razorpayPaymentId?: string) => {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);
    const trialEndsAt = plan === 'pro'
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    return supabase.from('subscriptions').insert({
      gym_id: gymId,
      owner_id: userId,
      plan,
      status: plan === 'pro' ? 'trial' : 'active',
      trial_ends_at: trialEndsAt,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      razorpay_payment_id: razorpayPaymentId ?? null,
    });
  };

  const createTokens = async (gymId: string) => {
    const monthYear = new Date().toISOString().slice(0, 7);
    return supabase.from('subscription_tokens').insert({
      gym_id: gymId,
      month_year: monthYear,
      tokens_total: 500,
      tokens_used: 0,
    });
  };

  const finishSetup = async (razorpayPaymentId?: string) => {
    if (!session) return;

    try {
      // Insert gym
      const { data: gym, error: gymErr } = await supabase
        .from('gyms')
        .insert({
          name: form.gym_name.trim(),
          owner_id: session.user.id,
          is_branch: false,
          phone: form.phone.trim() || null,
          address: form.city.trim() || null,
        })
        .select('id')
        .single();

      if (gymErr || !gym) throw gymErr ?? new Error('Failed to create gym');

      // Insert profile
      const { error: profileErr } = await supabase.from('profiles').insert({
        id: session.user.id,
        full_name: form.full_name.trim(),
        email: session.user.email ?? '',
        gym_id: gym.id,
        role: 'gym_owner',
        phone: form.phone.trim() || null,
      });

      if (profileErr) throw profileErr;

      // Create subscription
      const { error: subErr } = await createSubscription(gym.id, session.user.id, selectedPlan, razorpayPaymentId);
      if (subErr) throw subErr;

      // Create initial tokens for Pro
      if (selectedPlan === 'pro') {
        const { error: tokensErr } = await createTokens(gym.id);
        if (tokensErr) console.warn('Tokens insert failed:', tokensErr);
      }

      trackEvent('onboarding_complete', { plan: selectedPlan });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Setup failed. Please try again.';
      toast(msg, 'error');
      console.error('Onboarding error:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name.trim()) { toast('Please enter your name.', 'error'); return; }
    if (!form.gym_name.trim()) { toast('Please enter your gym name.', 'error'); return; }
    if (!validatePhone(form.phone)) { toast('Enter a valid 10-digit Indian mobile number.', 'error'); return; }
    if (!form.city.trim()) { toast('Please enter your city.', 'error'); return; }

    setLoading(true);

    if (selectedPlan === 'basic') {
      const rzpKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!rzpKeyId || rzpKeyId === 'rzp_test_XXXXXXXXXX') {
        toast('Payment not configured. Contact support.', 'error');
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: rzpKeyId,
        amount: RAZORPAY_BASIC_PAISE,
        currency: 'INR',
        name: 'GymSetu',
        description: 'Basic Plan — ₹999/month',
        handler: async (response: { razorpay_payment_id: string }) => {
          await finishSetup(response.razorpay_payment_id);
        },
        prefill: {
          name: form.full_name,
          contact: form.phone,
          email: session?.user?.email ?? '',
        },
        theme: { color: '#FF4D00' },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.open();
    } else {
      await finishSetup();
    }
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <main className="bg-near-black min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
      <div className="w-full max-w-sm">
        <h1 className="font-archivo text-5xl md:text-6xl text-white uppercase mb-2 leading-none tracking-tighter">
          ONE MORE<br /><span className="text-brand-orange">STEP.</span>
        </h1>
        <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-10">
          COMPLETE YOUR GYM SETUP
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* Name */}
          <div>
            <label htmlFor="ob_name" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
              Your Name
            </label>
            <input
              id="ob_name"
              type="text"
              required
              autoComplete="name"
              value={form.full_name}
              onChange={set('full_name')}
              placeholder="Rajesh Kumar"
              className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          {/* Gym name */}
          <div>
            <label htmlFor="ob_gym" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
              Gym Name
            </label>
            <input
              id="ob_gym"
              type="text"
              required
              value={form.gym_name}
              onChange={set('gym_name')}
              placeholder="Iron Beast Fitness"
              className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="ob_phone" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
              WhatsApp Number
            </label>
            <input
              id="ob_phone"
              type="tel"
              required
              autoComplete="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="9876543210"
              maxLength={10}
              className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="ob_city" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
              City
            </label>
            <input
              id="ob_city"
              type="text"
              required
              value={form.city}
              onChange={set('city')}
              placeholder="Mumbai"
              className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          {/* Plan selection */}
          <fieldset>
            <legend className="font-mono text-[10px] uppercase font-bold text-white/40 mb-2">
              Choose Plan
            </legend>
            <div className="flex gap-3">
              {(['pro', 'basic'] as Plan[]).map(plan => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`flex-1 py-3 border-2 font-mono text-xs font-bold uppercase transition-all ${
                    selectedPlan === plan
                      ? 'bg-brand-orange border-brand-orange text-black'
                      : 'bg-black border-white/20 text-white/60 hover:border-white/50'
                  }`}
                >
                  {plan === 'pro' ? 'PRO — 7-Day Trial' : 'BASIC — ₹999/mo'}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange text-black py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading
              ? 'SETTING UP...'
              : selectedPlan === 'pro'
                ? 'START FREE TRIAL →'
                : 'PAY & ACTIVATE →'}
          </button>
        </form>
      </div>
    </main>
  );
};
