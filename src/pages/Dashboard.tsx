import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Zap, ArrowUpRight, Download, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AppStoreBadges } from '../components/AppStoreBadges';
import { TOKEN_PACKS, RAZORPAY_PRO_PAISE } from '../lib/constants';

declare global {
  interface Window { Razorpay: any; }
}

interface Subscription {
  id: string;
  gym_id: string;
  plan: 'basic' | 'pro';
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trial_ends_at: string | null;
  current_period_end: string;
}

interface TokenUsage {
  tokens_total: number;
  tokens_used: number;
}

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  trial:     { label: 'FREE TRIAL',  color: 'text-yellow-400' },
  active:    { label: 'ACTIVE',      color: 'text-green-400'  },
  expired:   { label: 'EXPIRED',     color: 'text-red-400'    },
  cancelled: { label: 'CANCELLED',   color: 'text-red-400'    },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function daysLeft(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tokens, setTokens] = useState<TokenUsage | null>(null);
  const [gymName, setGymName] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    document.title = 'Dashboard | GymSetu';
  }, []);

  // Load Razorpay SDK
  useEffect(() => {
    if (document.getElementById('rzp-sdk')) return;
    const script = document.createElement('script');
    script.id = 'rzp-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: sub, error: subErr } = await supabase
          .from('subscriptions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subErr) throw subErr;
        setSubscription(sub ?? null);

        if (sub) {
          const { data: gym } = await supabase
            .from('gyms')
            .select('name')
            .eq('id', sub.gym_id)
            .maybeSingle();
          setGymName(gym?.name ?? '');

          if (sub.plan === 'pro' && sub.status !== 'expired') {
            const monthYear = new Date().toISOString().slice(0, 7);
            const { data: tok } = await supabase
              .from('subscription_tokens')
              .select('tokens_total, tokens_used')
              .eq('gym_id', sub.gym_id)
              .eq('month_year', monthYear)
              .maybeSingle();
            setTokens(tok ?? { tokens_total: 500, tokens_used: 0 });
          }
        }
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const openTokenTopup = (pack: typeof TOKEN_PACKS[number]) => {
    if (typeof window.Razorpay === 'undefined') {
      toast('Payment gateway is still loading — please try again.', 'error');
      return;
    }

    const rzp = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: pack.paise,
      currency: 'INR',
      name: 'GymSetu',
      description: `WhatsApp Token Pack — ${pack.tokens} messages`,
      prefill: { email: user?.email },
      notes: { pack_tokens: String(pack.tokens), gym_id: subscription?.gym_id ?? '' },
      theme: { color: '#FF4D00' },
      handler: (_response: { razorpay_payment_id: string }) => {
        // TODO: Verify payment via Supabase Edge Function webhook + credit tokens
        toast(`Payment received! Your ${pack.tokens} tokens will be credited shortly.`, 'success');
      },
    });
    rzp.open();
  };

  const openUpgradeToPro = () => {
    if (!subscription) return;
    if (typeof window.Razorpay === 'undefined') {
      toast('Payment gateway is still loading — please try again.', 'error');
      return;
    }

    setUpgradeLoading(true);

    const rzp = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: RAZORPAY_PRO_PAISE,
      currency: 'INR',
      name: 'GymSetu',
      description: 'Upgrade to Pro — Monthly Subscription',
      prefill: { email: user?.email },
      notes: { upgrade_from: 'basic', gym_id: subscription.gym_id },
      theme: { color: '#FF4D00' },
      handler: async (response: { razorpay_payment_id: string }) => {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + 30);

        const { error, data: updated } = await supabase
          .from('subscriptions')
          .update({
            plan: 'pro',
            status: 'active',
            razorpay_payment_id: response.razorpay_payment_id,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', subscription.id)
          .select()
          .single();

        if (error) {
          toast('Upgrade recorded but DB update failed. Contact support.', 'error');
        } else {
          setSubscription(updated);
          toast('Welcome to Pro! AI features and WhatsApp automation are now active.', 'success');
        }
        setUpgradeLoading(false);
      },
      modal: {
        ondismiss: () => setUpgradeLoading(false),
      },
    });
    rzp.open();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center">
        <div className="font-mono text-[10px] uppercase font-bold text-white/30 animate-pulse">
          LOADING YOUR DASHBOARD...
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center px-6 text-center">
        <div>
          <AlertCircle className="w-12 h-12 text-brand-orange mx-auto mb-4" />
          <p className="font-archivo text-2xl text-white uppercase mb-2">Failed to load</p>
          <p className="font-sans text-white/40 text-sm mb-6">Check your connection and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-brand-orange text-black px-6 py-3 font-archivo text-lg uppercase tracking-tighter hover:opacity-90"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = subscription ? STATUS_STYLE[subscription.status] : null;

  return (
    <main className="bg-near-black min-h-screen px-4 pt-32 pb-16">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <p className="font-mono text-[10px] text-brand-orange uppercase font-bold mb-1">
              GYM OWNER DASHBOARD
            </p>
            <h1 className="font-archivo text-4xl md:text-5xl text-white uppercase leading-none tracking-tighter">
              {gymName || 'YOUR GYM'}
            </h1>
            <p className="font-mono text-[10px] text-white/30 uppercase font-bold mt-2">
              {user?.email}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 border border-white/10 text-white/40 hover:text-white hover:border-white/30 px-4 py-2 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase font-bold hidden sm:block">SIGN OUT</span>
          </button>
        </div>

        {subscription ? (
          <>
            {/* Subscription Card */}
            <div className={`border-2 p-8 mb-6 ${
              subscription.plan === 'pro' ? 'border-brand-orange' : 'border-white/20'
            }`}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <span className="font-archivo text-3xl text-white uppercase">
                      {subscription.plan === 'pro' ? 'PRO' : 'BASIC'} PLAN
                    </span>
                    {statusInfo && (
                      <span className={`font-mono text-[10px] uppercase font-bold ${statusInfo.color}`}
                        aria-label={`Status: ${statusInfo.label}`}>
                        ● {statusInfo.label}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-white/40 uppercase font-bold">
                    {subscription.plan === 'pro' ? '₹1,699/month' : '₹999/month'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {subscription.status === 'trial' && subscription.trial_ends_at && (
                  <div>
                    <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-1">TRIAL ENDS</p>
                    <p className="font-archivo text-xl text-white uppercase">
                      {formatDate(subscription.trial_ends_at)}
                    </p>
                    <p className="font-mono text-[10px] text-yellow-400 uppercase font-bold mt-1">
                      {daysLeft(subscription.trial_ends_at)} DAYS LEFT
                    </p>
                  </div>
                )}
                <div>
                  <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-1">
                    {subscription.status === 'active' ? 'RENEWS ON' : 'PERIOD ENDS'}
                  </p>
                  <p className="font-archivo text-xl text-white uppercase">
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp Tokens — Pro only */}
            {subscription.plan === 'pro' && tokens && (
              <div className="border border-white/10 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-brand-orange" aria-hidden="true" />
                    <span className="font-mono text-[10px] uppercase font-bold text-white">
                      WHATSAPP TOKENS — {new Date().toLocaleString('en-IN', {
                        month: 'long', year: 'numeric',
                      }).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-white/40 uppercase">
                    {tokens.tokens_used} / {tokens.tokens_total} USED
                  </span>
                </div>

                <div
                  className="w-full bg-white/10 h-2 mb-6"
                  role="progressbar"
                  aria-valuenow={tokens.tokens_used}
                  aria-valuemin={0}
                  aria-valuemax={tokens.tokens_total}
                  aria-label="WhatsApp token usage"
                >
                  <div
                    className="bg-brand-orange h-2 transition-all"
                    style={{ width: `${Math.min(100, (tokens.tokens_used / tokens.tokens_total) * 100)}%` }}
                  />
                </div>

                <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-4">BUY MORE TOKENS</p>
                <div className="grid grid-cols-3 gap-3">
                  {TOKEN_PACKS.map(pack => (
                    <button
                      key={pack.name}
                      onClick={() => openTokenTopup(pack)}
                      className="border border-white/10 p-3 text-center hover:border-brand-orange transition-colors"
                      aria-label={`Buy ${pack.tokens} WhatsApp tokens for ₹${pack.price}`}
                    >
                      <div className="font-mono text-[8px] text-brand-orange font-bold mb-1 uppercase">{pack.name}</div>
                      <div className="font-archivo text-lg text-white">{pack.tokens}</div>
                      <div className="font-mono text-[8px] text-white/40 font-bold uppercase mb-2">MSGS</div>
                      <div className="font-archivo text-sm text-brand-orange">₹{pack.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upgrade to Pro — Basic only */}
            {subscription.plan === 'basic' && (
              <div className="border border-white/10 p-6 mb-6 bg-white/[0.02]">
                <p className="font-mono text-[10px] text-brand-orange uppercase font-bold mb-2">
                  UNLOCK AI + WHATSAPP AUTOMATION
                </p>
                <p className="font-sans text-white/60 text-sm mb-4">
                  Upgrade to Pro for AI insights, WhatsApp automation, revenue forecasts, and more. Only ₹700 extra per month.
                </p>
                <button
                  onClick={openUpgradeToPro}
                  disabled={upgradeLoading}
                  className="flex items-center gap-2 bg-brand-orange text-black px-6 py-3 font-archivo text-lg uppercase tracking-tighter hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {upgradeLoading ? 'PROCESSING...' : 'UPGRADE TO PRO — ₹1,699/MO'}
                  {!upgradeLoading && <ArrowUpRight className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
            )}
          </>
        ) : (
          /* No subscription */
          <div className="border-2 border-white/20 p-8 mb-6 text-center">
            <p className="font-archivo text-2xl text-white uppercase mb-4">NO ACTIVE SUBSCRIPTION</p>
            <p className="font-sans text-white/60 text-sm mb-6">
              Your account is set up. Choose a plan to activate your gym.
            </p>
            <Link
              to="/pricing"
              className="inline-block bg-brand-orange text-black px-6 py-3 font-archivo text-lg uppercase tracking-tighter hover:opacity-90 transition-opacity"
            >
              VIEW PLANS →
            </Link>
          </div>
        )}

        {/* Download App */}
        <div className="border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Download className="w-4 h-4 text-brand-orange" aria-hidden="true" />
            <span className="font-mono text-[10px] uppercase font-bold text-white">DOWNLOAD THE APP</span>
          </div>
          <p className="font-sans text-white/40 text-sm mb-4">
            Full gym management — members, payments, attendance — happens in the mobile app.
          </p>
          <AppStoreBadges theme="light" />
        </div>

      </div>
    </main>
  );
};
