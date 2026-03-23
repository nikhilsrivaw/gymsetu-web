import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AppStoreBadges } from '../components/AppStoreBadges';
import { MIN_PASSWORD_LENGTH, RAZORPAY_BASIC_PAISE } from '../lib/constants';
import { trackEvent } from '../lib/analytics';

declare global {
  interface Window { Razorpay: any; }
}

type Plan = 'basic' | 'pro';

const planConfig = [
  {
    id: 'basic' as Plan,
    name: 'BASIC',
    price: '₹999/mo',
    badge: null,
    features: ['Member management', 'Attendance & payments', 'Reports & analytics', 'Trainer management'],
  },
  {
    id: 'pro' as Plan,
    name: 'PRO',
    price: '₹1,699/mo',
    badge: '7-DAY FREE TRIAL',
    features: ['Everything in Basic', 'AI Insights & Reports', 'WhatsApp Automation', 'Revenue Forecast'],
  },
];

function validatePhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

export const Signup = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [selectedPlan, setSelectedPlan] = useState<Plan>('pro');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successEmail, setSuccessEmail] = useState('');

  const [form, setForm] = useState({
    full_name: '', gym_name: '', email: '',
    password: '', phone: '', city: '',
  });

  useEffect(() => {
    document.title = 'Create Account | GymSetu';
  }, []);

  useEffect(() => {
    if (session) navigate('/dashboard', { replace: true });
  }, [session, navigate]);

  // Load Razorpay SDK once
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (!validatePhone(form.phone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed — please try again.');

      const userId = authData.user.id;

      // 2. Create gym record
      // NOTE: adjust column names to match your mobile app's gyms table schema
      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .insert({ name: form.gym_name.trim(), city: form.city.trim() })
        .select('id')
        .single();

      if (gymError) throw gymError;
      const gymId = gymData.id;

      // 3. Create profile record
      // NOTE: adjust column names to match your mobile app's profiles table schema
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        full_name: form.full_name.trim(),
        gym_id: gymId,
        role: 'gym_owner',
        phone: form.phone.trim(),
      });

      if (profileError) throw profileError;

      setSuccessEmail(form.email.trim().toLowerCase());
      setLoading(false);

      if (selectedPlan === 'pro') {
        const { error: subError } = await createSubscription(gymId, userId, 'pro');
        if (subError) console.warn('Subscription insert failed:', subError);
        trackEvent('sign_up', { plan: 'pro' });
        setStep('success');
      } else {
        if (typeof window.Razorpay === 'undefined') {
          setError('Payment gateway is still loading — please try again.');
          return;
        }

        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: RAZORPAY_BASIC_PAISE,
          currency: 'INR',
          name: 'GymSetu',
          description: 'Basic Plan — Monthly Subscription',
          prefill: { name: form.full_name, email: form.email, contact: form.phone },
          notes: { gym_name: form.gym_name, plan: 'basic' },
          theme: { color: '#FF4D00' },
          handler: async (response: { razorpay_payment_id: string }) => {
            const { error: subError } = await createSubscription(gymId, userId, 'basic', response.razorpay_payment_id);
            if (subError) console.warn('Subscription insert failed:', subError);
            trackEvent('purchase', { plan: 'basic', value: 999 });
            setStep('success');
          },
          modal: {
            ondismiss: () => setStep('success'), // Account created; owner can pay from dashboard
          },
        });
        rzp.open();
      }
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Something went wrong — please try again.';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setError('This email is already registered.');
      } else {
        setError(msg);
      }
    }
  };

  if (step === 'success') {
    return (
      <main className="bg-near-black min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-brand-orange flex items-center justify-center mx-auto mb-8">
            <Check className="w-8 h-8 text-black" strokeWidth={3} aria-hidden="true" />
          </div>

          <h1 className="font-archivo text-4xl md:text-5xl text-white uppercase mb-4 leading-tight tracking-tighter">
            YOUR GYM<br />IS LIVE!
          </h1>
          <p className="font-sans text-white/60 text-base mb-6 leading-relaxed">
            Download the GymSetu app and log in with your email and password to start managing your gym.
          </p>

          <div className="bg-[#141414] border border-white/10 px-4 py-3 inline-block mb-8">
            <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-1">LOG IN WITH</p>
            <p className="font-mono text-sm text-brand-orange font-bold">{successEmail}</p>
          </div>

          <AppStoreBadges theme="light" className="justify-center mb-8" />

          <Link
            to="/dashboard"
            className="font-mono text-[10px] text-white/30 uppercase font-bold hover:text-brand-orange transition-colors"
          >
            VIEW SUBSCRIPTION DASHBOARD →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-near-black min-h-screen px-4 pt-32 pb-16">
      <div className="max-w-xl mx-auto">
        <h1 className="font-archivo text-5xl md:text-6xl text-white uppercase mb-2 leading-none tracking-tighter">
          CREATE YOUR<br /><span className="text-brand-orange">GYM ACCOUNT</span>
        </h1>
        <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-12">
          TAKES LESS THAN 2 MINUTES
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="full_name" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
                Your Full Name *
              </label>
              <input
                id="full_name"
                type="text"
                required
                autoComplete="name"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Rajesh Kumar"
                className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>
            <div>
              <label htmlFor="gym_name" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
                Gym Name *
              </label>
              <input
                id="gym_name"
                type="text"
                required
                value={form.gym_name}
                onChange={e => setForm(f => ({ ...f, gym_name: e.target.value }))}
                placeholder="Iron Beast Fitness"
                className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="rajesh@ironbeast.in"
              className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
              Password * <span className="opacity-50">(min. {MIN_PASSWORD_LENGTH} characters)</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Create a strong password"
                className="w-full bg-black border border-white/10 text-white px-4 py-3 pr-12 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="phone" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
                WhatsApp Number *
              </label>
              <input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="9876543210"
                maxLength={10}
                className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>
            <div>
              <label htmlFor="city" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
                City
              </label>
              <input
                id="city"
                type="text"
                autoComplete="address-level2"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Mumbai"
                className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>
          </div>

          {/* Plan Selection */}
          <fieldset className="pt-2">
            <legend className="font-mono text-[10px] uppercase font-bold text-white/40 mb-4">
              SELECT YOUR PLAN *
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {planConfig.map(plan => (
                <button
                  key={plan.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedPlan === plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative text-left p-5 border-2 transition-all ${
                    selectedPlan === plan.id
                      ? plan.id === 'pro'
                        ? 'border-brand-orange bg-brand-orange text-black'
                        : 'border-white bg-white text-black'
                      : 'border-white/20 text-white hover:border-white/40'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-px right-4 -translate-y-full bg-black text-white font-mono text-[8px] uppercase px-2 py-0.5 font-bold border border-white/20">
                      {plan.badge}
                    </span>
                  )}
                  <div className="font-archivo text-2xl mb-0.5">{plan.name}</div>
                  <div className="font-mono text-xs font-bold mb-3 opacity-60">{plan.price}</div>
                  <ul className="flex flex-col gap-1.5">
                    {plan.features.map(f => (
                      <li key={f} className="font-sans text-[11px] flex items-start gap-2">
                        <Check className="w-3 h-3 flex-shrink-0 mt-0.5" strokeWidth={3} aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="font-mono text-[10px] text-red-400 uppercase font-bold">
              {error}{' '}
              {error.includes('already registered') && (
                <Link to="/login" className="underline">Log in →</Link>
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange text-black py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {loading
              ? 'SETTING UP YOUR GYM...'
              : selectedPlan === 'pro'
              ? 'START FREE TRIAL →'
              : 'PROCEED TO PAYMENT →'}
          </button>

          <p className="text-center font-mono text-[10px] text-white/30 uppercase font-bold">
            ALREADY HAVE AN ACCOUNT?{' '}
            <Link to="/login" className="text-brand-orange hover:underline">LOG IN →</Link>
          </p>
        </form>
      </div>
    </main>
  );
};
