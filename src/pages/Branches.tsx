import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BRANCH_PACKS } from '../lib/constants';
import { trackEvent } from '../lib/analytics';
import { initiatePayU } from '../lib/payu';

export const Branches = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [currentSlots, setCurrentSlots] = useState<number | null>(null);
  const [gymId, setGymId] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [plan, setPlan]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [addedSlots, setAddedSlots] = useState(0);

  useEffect(() => { document.title = 'Add Branches | GymSetu'; }, []);

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
          .from('subscriptions').select('id, plan, branch_slots')
          .eq('gym_id', profile.gym_id).maybeSingle();
        if (sub) { setSubId(sub.id); setPlan(sub.plan); setCurrentSlots(sub.branch_slots ?? 0); }
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [authLoading, session, navigate]);

  const canUseBranches = plan && plan !== 'basic';

  const handlePurchase = async (slots: number, price: number) => {
    if (!session || !subId || !gymId) return;

    // Create pending purchase row — payu-callback flips status to 'paid'
    // and increments subscription.branch_slots server-side after PayU confirms.
    const { data: purchase, error: purchaseErr } = await supabase
      .from('purchases').insert({
        owner_id: session.user.id,
        gym_id: gymId,
        type: 'branch_pack',
        branch_slots: slots,
        amount: price,
        status: 'pending',
      }).select('id').single();

    if (purchaseErr || !purchase) {
      toast('Could not initiate purchase — please try again.', 'error');
      return;
    }

    setPurchasing(true);
    trackEvent('purchase_initiated', { product: 'branches', slots, price });

    try {
      await initiatePayU({
        purchase_id: purchase.id,
        amount:      price,
        productinfo: `${slots} Branch${slots > 1 ? 'es' : ''} Add-On — Monthly`,
        firstname:   session.user.user_metadata?.full_name ?? session.user.email ?? '',
        email:       session.user.email ?? '',
        phone:       session.user.user_metadata?.phone ?? '0000000000',
        udf1:        `branches:${slots}`,
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
        style={{ width: 480, height: 480, top: -120, left: '20%', background: 'radial-gradient(circle,#FF4D0030,transparent 70%)' }} />

      <div className="relative max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <GitBranch className="w-5 h-5 text-flame" />
          <span className="font-mono text-[10px] text-flame uppercase font-bold tracking-[0.2em]">Branch add-on</span>
        </div>
        <h1 className="font-display text-5xl md:text-6xl text-bone uppercase leading-[0.9] mb-4">
          Scale across <span className="text-heat">locations</span>
        </h1>
        <p className="font-sans text-ash text-base mb-10 max-w-xl">
          Each branch gets its own members, trainers, payments, attendance tracking, and a WhatsApp token pool matching your plan tier.
        </p>

        {/* Current status */}
        {currentSlots !== null && (
          <div className="glass rounded-2xl p-5 mb-10 flex items-center gap-8 flex-wrap">
            <div>
              <p className={labelCls}>Current branch slots</p>
              <p className="font-display text-3xl text-bone">{currentSlots} {currentSlots === 1 ? 'branch' : 'branches'}</p>
            </div>
            {plan && (
              <div>
                <p className={labelCls}>Plan</p>
                <p className="font-mono text-sm font-bold text-flame uppercase">{plan.replace(/_/g, ' ')}</p>
              </div>
            )}
          </div>
        )}

        {!canUseBranches && (
          <div className="glass rounded-2xl p-6 mb-10 text-center">
            <p className="font-mono text-[10px] font-bold text-ash uppercase tracking-wider mb-2">Upgrade required</p>
            <p className="font-sans text-ash text-sm mb-4">
              Branch add-ons are available on Pro, Pro Plus, and Pro Max plans only.
            </p>
            <a href="/pricing"
              className="inline-block bg-heat text-black px-6 py-3 rounded-lg font-mono text-xs uppercase font-bold tracking-wider hover:opacity-90 transition-opacity">
              View plans →
            </a>
          </div>
        )}

        {success && (
          <div className="mb-10 glass glass-heat top-sheen rounded-2xl p-6 text-center">
            <Check className="w-8 h-8 text-flame mx-auto mb-2" strokeWidth={3} />
            <p className="font-display text-xl text-heat uppercase">
              +{addedSlots} branch{addedSlots > 1 ? 'es' : ''} activated!
            </p>
            <p className="font-mono text-[10px] text-ash uppercase font-bold mt-1">
              You now have {currentSlots} active branch slot{(currentSlots ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {canUseBranches && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {BRANCH_PACKS.map(pack => (
              <div key={pack.slots}
                className="glass rounded-2xl p-7 flex flex-col hover:border-flame/40 transition-colors">
                <p className="font-mono text-[10px] font-bold text-ash uppercase tracking-wider mb-2">{pack.label}</p>
                <p className="font-display text-4xl text-bone mb-1">₹{pack.price.toLocaleString('en-IN')}</p>
                <p className="font-mono text-[10px] text-ash uppercase font-bold mb-1">/month add-on</p>
                <p className="font-mono text-[9px] text-ash/60 uppercase font-bold mb-6">+18% GST applicable</p>

                <ul className="flex flex-col gap-2 mb-8 flex-1">
                  {[
                    `${pack.slots} branch location${pack.slots > 1 ? 's' : ''}`,
                    'Own member database',
                    'Own trainer management',
                    'Own payments & attendance',
                    'Own WhatsApp token pool',
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-3 h-3 flex-shrink-0 mt-0.5 text-flame" strokeWidth={3} />
                      <span className="font-sans text-xs text-bone/70">{f}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={() => handlePurchase(pack.slots, pack.price)} disabled={purchasing}
                  className="w-full bg-heat text-black py-3 rounded-lg font-mono text-xs uppercase font-bold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50">
                  {purchasing ? 'Processing…' : 'Add branches →'}
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 font-mono text-[10px] text-ash uppercase font-bold tracking-wider text-center">
          Branches are billed as a flat monthly add-on to your existing subscription
        </p>
      </div>
    </main>
  );
};
