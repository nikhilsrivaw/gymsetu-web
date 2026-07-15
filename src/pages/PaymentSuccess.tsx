import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../lib/analytics';
import { AppStoreBadges } from '../components/AppStoreBadges';
import { AuthShell } from '../components/AuthShell';
import { PLAN_TOKENS, type PlanId } from '../lib/constants';

export const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const txnid = searchParams.get('txnid');
  const { session, loading: authLoading } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [verified,  setVerified]  = useState(false);

  useEffect(() => { document.title = 'Payment Successful | GymSetu'; }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!session)    { navigate('/login', { replace: true }); return; }
    if (!txnid)      { navigate('/dashboard', { replace: true }); return; }

    let cancelled = false;
    const verify = async () => {
      // The callback function runs server-side and updates the row.
      // We just confirm here that the subscription is now active.
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id, plan, gym_id, payment_status, status')
        .eq('payu_txnid', txnid)
        .maybeSingle();

      if (cancelled) return;

      if (sub && sub.payment_status === 'success') {
        // Seed WhatsApp tokens now that payment confirmed (couldn't seed earlier — gym was pending)
        const tokenAllocation = PLAN_TOKENS[sub.plan as PlanId] ?? 0;
        if (tokenAllocation > 0) {
          const monthYear = new Date().toISOString().slice(0, 7);
          await supabase.from('subscription_tokens')
            .upsert({
              gym_id:       sub.gym_id,
              month_year:   monthYear,
              tokens_total: tokenAllocation,
              tokens_used:  0,
            }, { onConflict: 'gym_id,month_year' });
        }
        trackEvent('payment_success', { plan: sub.plan, txnid });
        setVerified(true);
      }
      setVerifying(false);
    };
    verify();
    return () => { cancelled = true; };
  }, [authLoading, session, txnid, navigate]);

  if (authLoading || verifying) {
    return (
      <main className="bg-ink min-h-screen flex items-center justify-center px-4">
        <p className="font-mono text-[11px] text-ash uppercase font-bold tracking-widest animate-pulse">Verifying payment…</p>
      </main>
    );
  }

  if (!verified) {
    return (
      <AuthShell width="md">
        <div className="text-center">
          <h1 className="font-display text-3xl text-bone uppercase mb-4">Payment not confirmed</h1>
          <p className="font-sans text-ash text-sm mb-6 leading-relaxed">
            We received your return from PayU but couldn't confirm the payment status yet.
            Refresh in a few seconds — if it still doesn't update, contact support with txnid: <span className="font-mono text-flame">{txnid}</span>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-heat text-black py-3 px-6 rounded-lg font-mono text-xs uppercase font-bold tracking-wider hover:opacity-90"
          >
            Retry verification →
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell width="md">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-heat grid place-items-center mx-auto mb-8">
          <Check className="w-8 h-8 text-black" strokeWidth={3} />
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-bone uppercase mb-4 leading-[0.95]">
          Your gym <span className="text-heat">is live</span>
        </h1>
        <p className="font-sans text-ash text-base mb-6 leading-relaxed">
          Payment confirmed. Download the GymSetu app and sign in to start managing your gym.
        </p>
        <div className="glass rounded-xl px-4 py-3 inline-block mb-8">
          <p className="font-mono text-[10px] text-ash uppercase tracking-wider mb-1">Log in with</p>
          <p className="font-mono text-sm text-flame font-bold">{session?.user.email}</p>
        </div>
        <AppStoreBadges theme="light" className="justify-center mb-8" />
        <div>
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="font-mono text-[10px] text-ash uppercase font-bold tracking-wider hover:text-flame transition-colors"
          >
            View subscription dashboard →
          </button>
        </div>
      </div>
    </AuthShell>
  );
};
