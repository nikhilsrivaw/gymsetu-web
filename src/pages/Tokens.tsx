import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Check, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TOKEN_PACKS, PLAN_TOKENS, type PlanId } from '../lib/constants';
import { trackEvent } from '../lib/analytics';
import { initiatePayU } from '../lib/payu';

export const Tokens = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [gymId, setGymId]             = useState<string | null>(null);
  const [plan, setPlan]               = useState<PlanId | null>(null);
  const [tokensTotal, setTokensTotal] = useState<number | null>(null);
  const [tokensUsed, setTokensUsed]   = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);
  const [purchasing, setPurchasing]   = useState(false);
  const [lastAdded, setLastAdded]     = useState<number | null>(null);

  const monthYear = new Date().toISOString().slice(0, 7);

  useEffect(() => { document.title = 'Buy Tokens | GymSetu'; }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!session) { navigate('/login', { replace: true }); return; }
    (async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles').select('gym_id').eq('id', session.user.id).maybeSingle();
        if (!profile?.gym_id) { setLoading(false); return; }
        setGymId(profile.gym_id);

        const { data: sub } = await supabase
          .from('subscriptions').select('plan').eq('gym_id', profile.gym_id).maybeSingle();
        if (sub) setPlan(sub.plan as PlanId);

        const { data: tok } = await supabase
          .from('subscription_tokens')
          .select('tokens_total, tokens_used')
          .eq('gym_id', profile.gym_id).eq('month_year', monthYear).maybeSingle();
        if (tok) { setTokensTotal(tok.tokens_total); setTokensUsed(tok.tokens_used); }
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [authLoading, session, navigate]);

  const hasWhatsApp = plan && plan !== 'basic';
  const remaining   = tokensTotal !== null && tokensUsed !== null ? tokensTotal - tokensUsed : null;

  const handlePurchase = async (tokens: number, price: number) => {
    if (!session || !gymId) return;

    // Create pending purchase row — payu-callback will flip status to 'paid'
    // and add tokens to subscription_tokens server-side after PayU confirms.
    const { data: purchase, error: purchaseErr } = await supabase
      .from('purchases').insert({
        owner_id: session.user.id,
        gym_id: gymId,
        type: 'token_pack',
        token_amount: tokens,
        amount: price,
        status: 'pending',
      }).select('id').single();

    if (purchaseErr || !purchase) {
      toast('Could not initiate purchase — please try again.', 'error');
      return;
    }

    setPurchasing(true);
    trackEvent('purchase_initiated', { product: 'tokens', tokens, price });

    try {
      await initiatePayU({
        purchase_id: purchase.id,
        amount:      price,
        productinfo: `${tokens.toLocaleString('en-IN')} WhatsApp Tokens`,
        firstname:   session.user.user_metadata?.full_name ?? session.user.email ?? '',
        email:       session.user.email ?? '',
        phone:       session.user.user_metadata?.phone ?? '0000000000',
        udf1:        `tokens:${tokens}`,
      });
      // Browser navigates to PayU.
    } catch (err) {
      await supabase.from('purchases').update({ status: 'failed' }).eq('id', purchase.id);
      toast(err instanceof Error ? err.message : 'Could not start payment.', 'error');
      setPurchasing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="bg-ink min-h-screen flex items-center justify-center">
        <div className="font-mono text-[11px] uppercase font-bold text-ash tracking-widest animate-pulse">Loading…</div>
      </main>
    );
  }

  const labelCls = 'font-mono text-[10px] uppercase tracking-wider text-ash block mb-1';

  return (
    <main className="relative bg-ink min-h-screen px-4 pt-32 md:pt-44 pb-24 overflow-hidden">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="glow-orb animate-float-glow" aria-hidden="true"
        style={{ width: 480, height: 480, top: -120, right: -80, background: 'radial-gradient(circle,#FF4D0030,transparent 70%)' }} />

      <div className="relative max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-flame" />
          <span className="font-mono text-[10px] text-flame uppercase font-bold tracking-[0.2em]">WhatsApp tokens</span>
        </div>
        <h1 className="font-display text-5xl md:text-6xl text-bone uppercase leading-[0.9] mb-4">
          Top up your <span className="text-heat">tokens</span>
        </h1>
        <p className="font-sans text-ash text-base mb-10 max-w-xl">
          Ran out of WhatsApp messages this month? Top up instantly — tokens are added to your current month's pool right away.
        </p>

        {/* Balance bar */}
        {plan && (
          <div className="glass rounded-2xl p-5 mb-10 grid grid-cols-2 md:grid-cols-4 gap-5">
            <div>
              <p className={labelCls}>Plan</p>
              <p className="font-mono text-sm font-bold text-flame uppercase">{plan.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className={labelCls}>Monthly allocation</p>
              <p className="font-display text-2xl text-bone">{PLAN_TOKENS[plan].toLocaleString('en-IN')}</p>
            </div>
            {tokensTotal !== null && (
              <div>
                <p className={labelCls}>Total this month</p>
                <p className="font-display text-2xl text-bone">{tokensTotal.toLocaleString('en-IN')}</p>
              </div>
            )}
            {remaining !== null && (
              <div>
                <p className={labelCls}>Remaining</p>
                <p className={`font-display text-2xl ${remaining < 50 ? 'text-red-400' : 'text-bone'}`}>
                  {remaining.toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>
        )}

        {!hasWhatsApp && (
          <div className="glass rounded-2xl p-6 mb-10 text-center">
            <p className="font-mono text-[10px] font-bold text-ash uppercase tracking-wider mb-2">Upgrade required</p>
            <p className="font-sans text-ash text-sm mb-4">
              WhatsApp tokens are available on Pro, Pro Plus, and Pro Max plans only.
            </p>
            <a href="/pricing"
              className="inline-block bg-heat text-black px-6 py-3 rounded-lg font-mono text-xs uppercase font-bold tracking-wider hover:opacity-90 transition-opacity">
              View plans →
            </a>
          </div>
        )}

        {lastAdded && (
          <div className="mb-10 glass glass-heat top-sheen rounded-2xl p-6 text-center">
            <Check className="w-8 h-8 text-flame mx-auto mb-2" strokeWidth={3} />
            <p className="font-display text-xl text-heat uppercase">
              +{lastAdded.toLocaleString('en-IN')} tokens added!
            </p>
            <p className="font-mono text-[10px] text-ash uppercase font-bold mt-1">
              New balance: {(tokensTotal ?? 0).toLocaleString('en-IN')} tokens this month
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TOKEN_PACKS.map(pack => (
            <div key={pack.name}
              className="glass rounded-2xl p-7 flex flex-col hover:border-flame/40 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-flame" />
                <p className="font-mono text-[10px] font-bold text-flame uppercase tracking-wider">{pack.name}</p>
              </div>
              <p className="font-display text-4xl text-bone mb-0.5">{pack.tokens.toLocaleString('en-IN')}</p>
              <p className="font-mono text-[10px] text-ash uppercase font-bold mb-3">tokens</p>
              <p className="font-display text-3xl text-heat mb-0.5">₹{pack.price}</p>
              <p className="font-mono text-[9px] text-ash/60 uppercase font-bold mb-8">+18% GST applicable</p>

              <button onClick={() => handlePurchase(pack.tokens, pack.price)}
                disabled={purchasing || !hasWhatsApp}
                className="mt-auto w-full bg-heat text-black py-3 rounded-lg font-mono text-xs uppercase font-bold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50">
                {purchasing ? 'Processing…' : 'Buy now →'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 glass rounded-2xl p-6">
          <p className="font-mono text-[10px] font-bold text-ash uppercase tracking-wider mb-3">How tokens work</p>
          <ul className="flex flex-col gap-2.5">
            {[
              '1 WhatsApp message = 1 token consumed',
              'Monthly allocation resets at the start of each billing month',
              'Top-up tokens are added to the current month — they don\'t roll over to next month',
              'Token pool is shared across all branches under your gym account',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="font-mono text-[9px] text-flame/70 mt-0.5 flex-shrink-0 font-bold">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-sans text-xs text-ash leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
};
