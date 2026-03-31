import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { trackEvent } from '../lib/analytics';
import { AppStoreBadges } from '../components/AppStoreBadges';
import { StepIndicator } from './Signup';
import { CYCLE_DAYS, PLAN_TOKENS, PRICING, toPaise, type BillingCycle, type PlanId } from '../lib/constants';

declare global { interface Window { Razorpay: any; } }

function validatePhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

const MAX_DESC = 300;

const CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: 'Monthly', quarterly: 'Quarterly', half_yearly: 'Half-Yearly', yearly: 'Yearly',
};

export const SignupSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan  = (searchParams.get('plan')  ?? 'pro') as PlanId;
  const cycle = (searchParams.get('cycle') ?? 'monthly') as BillingCycle;
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: '', gymName: '', description: '', phone: '', city: '',
  });
  const [logoFile, setLogoFile]     = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [successEmail, setSuccessEmail] = useState('');

  useEffect(() => { document.title = 'Gym Setup | GymSetu'; }, []);

  // Load Razorpay SDK
  useEffect(() => {
    if (document.getElementById('rzp-sdk')) return;
    const s = document.createElement('script');
    s.id = 'rzp-sdk';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!session) { navigate('/signup', { replace: true }); return; }
    const oauthName = session.user.user_metadata?.full_name ?? '';
    if (oauthName) setForm(f => ({ ...f, fullName: oauthName }));
  }, [authLoading, session, navigate]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast('Only JPG, PNG, or WEBP images are allowed.', 'error'); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('Image must be under 2MB.', 'error'); return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  // ── Core DB writes — called after payment confirmed (or immediately for Pro trial) ──
  const createGymAndSubscription = async (paymentId: string | null) => {
    if (!session) return;
    setLoading(true);

    try {
      const userId = session.user.id;

      // 1 — Upload logo
      let logoUrl: string | null = null;
      if (logoFile) {
        const ext  = logoFile.name.split('.').pop();
        const path = `${userId}/logo.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('gym-logos').upload(path, logoFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('gym-logos').getPublicUrl(path);
          logoUrl = urlData.publicUrl;
        } else {
          console.warn('Logo upload failed (continuing):', uploadErr.message);
        }
      }

      // 2 — Create gym
      const { data: gymData, error: gymErr } = await supabase
        .from('gyms').insert({
          name:        form.gymName.trim(),
          owner_id:    userId,
          is_branch:   false,
          description: form.description.trim() || null,
          logo_url:    logoUrl,
          phone:       form.phone.trim() || null,
          address:     form.city.trim() || null,
        }).select('id').single();
      if (gymErr) throw new Error(`Gym creation failed: ${gymErr.message}`);

      // 3 — Create profile (must exist before subscription — FK constraint)
      const { error: profileErr } = await supabase.from('profiles').insert({
        id:        userId,
        full_name: form.fullName.trim(),
        email:     session.user.email ?? '',
        role:      'gym_owner',
        gym_id:    gymData.id,
        phone:     form.phone.trim() || null,
      });
      if (profileErr) throw new Error(`Profile creation failed: ${profileErr.message}`);

      // 4 — Create subscription
      const now        = new Date();
      const days       = CYCLE_DAYS[cycle] ?? 30;
      const periodEnd  = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const trialEndsAt = plan === 'pro'
        ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error: subErr } = await supabase.from('subscriptions').insert({
        gym_id:                  gymData.id,
        owner_id:                userId,
        plan,
        tier:                    plan,
        billing_cycle:           cycle,
        status:                  plan === 'pro' ? 'trial' : 'active',
        trial_ends_at:           trialEndsAt,
        current_period_start:    now.toISOString(),
        current_period_end:      periodEnd.toISOString(),
        razorpay_payment_id:     paymentId,
        razorpay_subscription_id: null,
        branch_slots:            0,
      });
      if (subErr) throw new Error(`Subscription creation failed: ${subErr.message}`);

      // 5 — Seed WhatsApp tokens
      const tokenAllocation = PLAN_TOKENS[plan];
      if (tokenAllocation > 0) {
        const monthYear = now.toISOString().slice(0, 7);
        const { error: tokErr } = await supabase.from('subscription_tokens').insert({
          gym_id:       gymData.id,
          month_year:   monthYear,
          tokens_total: tokenAllocation,
          tokens_used:  0,
        });
        if (tokErr) console.warn('Token seed failed (non-critical):', tokErr.message);
      }

      // 6 — Log purchase record (only for paid plans)
      if (paymentId) {
        await supabase.from('purchases').insert({
          owner_id:           userId,
          gym_id:             gymData.id,
          type:               'plan',
          plan,
          billing_cycle:      cycle,
          amount:             PRICING[plan][cycle],
          razorpay_payment_id: paymentId,
          status:             'paid',
        });
      }

      trackEvent('sign_up', { plan, cycle });
      setSuccessEmail(session.user.email ?? '');
      setDone(true);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Setup failed. Please try again.';
      toast(msg, 'error');
      console.error('Signup setup error:', err);
      setLoading(false);
    }
  };

  // ── Form submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    if (!form.fullName.trim())     { toast('Please enter your name.', 'error'); return; }
    if (!form.gymName.trim())      { toast('Gym name is required.', 'error'); return; }
    if (!validatePhone(form.phone)){ toast('Enter a valid 10-digit Indian mobile number.', 'error'); return; }

    // Pro plan = 7-day free trial, no payment needed
    if (plan === 'pro') {
      await createGymAndSubscription(null);
      return;
    }

    // Paid plans — open Razorpay first
    if (typeof window.Razorpay === 'undefined') {
      toast('Payment gateway is still loading — please try again in a moment.', 'error');
      return;
    }

    const amount = PRICING[plan][cycle];
    setLoading(true);

    const rzp = new window.Razorpay({
      key:         import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount:      toPaise(amount),
      currency:    'INR',
      name:        'GymSetu',
      description: `${plan.replace(/_/g, ' ').toUpperCase()} Plan — ${CYCLE_LABEL[cycle]}`,
      prefill: {
        name:    form.fullName,
        contact: form.phone,
        email:   session.user.email ?? '',
      },
      notes: { plan, cycle, gym_name: form.gymName },
      theme: { color: '#FF4D00' },
      handler: async (response: { razorpay_payment_id: string }) => {
        // Payment confirmed — now create everything
        await createGymAndSubscription(response.razorpay_payment_id);
      },
      modal: {
        ondismiss: () => setLoading(false), // user closed modal without paying
      },
    });
    rzp.open();
  };

  if (authLoading) return null;

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <main className="bg-near-black min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-brand-orange flex items-center justify-center mx-auto mb-8">
            <Check className="w-8 h-8 text-black" strokeWidth={3} />
          </div>
          <h1 className="font-archivo text-4xl md:text-5xl text-white uppercase mb-4 leading-tight tracking-tighter">
            YOUR GYM<br />IS LIVE!
          </h1>
          <p className="font-sans text-white/60 text-base mb-6 leading-relaxed">
            Download the GymSetu app and sign in to start managing your gym.
          </p>
          <div className="bg-[#141414] border border-white/10 px-4 py-3 inline-block mb-8">
            <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-1">LOG IN WITH</p>
            <p className="font-mono text-sm text-brand-orange font-bold">{successEmail}</p>
          </div>
          <AppStoreBadges theme="light" className="justify-center mb-8" />
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="font-mono text-[10px] text-white/30 uppercase font-bold hover:text-brand-orange transition-colors"
          >
            VIEW SUBSCRIPTION DASHBOARD →
          </button>
        </div>
      </main>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  const isPaidPlan = plan !== 'pro';
  const payAmount  = PRICING[plan][cycle];
  const inputCls   = 'w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors';
  const labelCls   = 'font-mono text-[10px] uppercase font-bold text-white/40 block mb-1';

  return (
    <main className="bg-near-black min-h-screen px-4 pt-24 pb-16">
      <div className="max-w-lg mx-auto">
        <StepIndicator step={3} />

        <h1 className="font-archivo text-5xl md:text-6xl text-white uppercase mb-2 leading-none tracking-tighter">
          YOUR GYM<br /><span className="text-brand-orange">DETAILS.</span>
        </h1>
        <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-10">STEP 3 OF 3 — ALMOST DONE</p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

          {/* Your Name */}
          <div>
            <label htmlFor="gs_name" className={labelCls}>Your Name *</label>
            <input id="gs_name" type="text" required autoComplete="name"
              value={form.fullName} onChange={set('fullName')}
              placeholder="Rajesh Kumar" className={inputCls} />
          </div>

          {/* Gym Name */}
          <div>
            <label htmlFor="gs_gymname" className={labelCls}>Gym Name *</label>
            <input id="gs_gymname" type="text" required
              value={form.gymName} onChange={set('gymName')}
              placeholder="Iron Beast Fitness" className={inputCls} />
          </div>

          {/* Logo */}
          <div>
            <label className={labelCls}>
              Gym Logo <span className="opacity-50">(optional — shown to members in the app)</span>
            </label>
            {logoPreview ? (
              <div className="relative inline-block">
                <img src={logoPreview} alt="Logo preview" className="w-24 h-24 object-cover border border-white/10" />
                <button type="button" onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-black border border-white/20 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                  aria-label="Remove logo">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-white/20 py-8 flex flex-col items-center gap-2 hover:border-brand-orange transition-colors">
                <Upload className="w-5 h-5 text-white/30" />
                <span className="font-mono text-[10px] text-white/30 uppercase font-bold">
                  CLICK TO UPLOAD — JPG, PNG OR WEBP, MAX 2MB
                </span>
              </button>
            )}
            <input ref={fileInputRef} type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleLogoChange} className="hidden" aria-label="Upload gym logo" />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="gs_desc" className={labelCls}>
              Gym Description <span className="opacity-50">(optional)</span>
            </label>
            <textarea id="gs_desc" rows={3} maxLength={MAX_DESC}
              value={form.description} onChange={set('description')}
              placeholder="Tell members what makes your gym special..."
              className={`${inputCls} resize-none`} />
            <p className={`font-mono text-[10px] font-bold text-right mt-1 ${
              form.description.length > MAX_DESC * 0.9 ? 'text-yellow-400' : 'text-white/20'
            }`}>{form.description.length} / {MAX_DESC}</p>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="gs_phone" className={labelCls}>WhatsApp Number *</label>
            <input id="gs_phone" type="tel" required autoComplete="tel"
              value={form.phone} onChange={set('phone')}
              placeholder="9876543210" maxLength={10} className={inputCls} />
          </div>

          {/* City */}
          <div>
            <label htmlFor="gs_city" className={labelCls}>City <span className="opacity-50">(optional)</span></label>
            <input id="gs_city" type="text"
              value={form.city} onChange={set('city')}
              placeholder="Mumbai" className={inputCls} />
          </div>

          {/* Payment summary for paid plans */}
          {isPaidPlan && (
            <div className="bg-white/5 border border-white/10 p-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-[9px] font-bold text-white/30 uppercase mb-0.5">
                  {plan.replace(/_/g, ' ').toUpperCase()} — {CYCLE_LABEL[cycle].toUpperCase()}
                </p>
                <p className="font-mono text-[9px] text-white/20">+18% GST applicable</p>
              </div>
              <p className="font-archivo text-2xl text-brand-orange">
                ₹{payAmount.toLocaleString('en-IN')}
              </p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-brand-orange text-black py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading
              ? 'PLEASE WAIT...'
              : plan === 'pro'
                ? 'START FREE TRIAL →'
                : `PAY ₹${payAmount.toLocaleString('en-IN')} & LAUNCH →`}
          </button>

          {plan === 'pro' && (
            <p className="text-center font-mono text-[10px] text-white/20 uppercase font-bold -mt-2">
              7 DAYS FREE — NO CARD REQUIRED
            </p>
          )}
        </form>
      </div>
    </main>
  );
};
