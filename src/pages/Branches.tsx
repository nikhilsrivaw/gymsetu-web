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
      <main className="bg-near-black min-h-screen flex items-center justify-center">
        <div className="font-mono text-[10px] uppercase font-bold text-white/30 animate-pulse">LOADING...</div>
      </main>
    );
  }

  const labelCls = 'font-mono text-[10px] uppercase font-bold text-white/40 block mb-1';

  return (
    <main className="bg-near-black min-h-screen px-4 pt-32 md:pt-48 pb-24">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <GitBranch className="w-6 h-6 text-brand-orange" />
          <span className="font-mono text-[10px] text-brand-orange uppercase font-bold tracking-widest">BRANCH ADD-ON</span>
        </div>
        <h1 className="font-archivo text-5xl md:text-6xl text-white uppercase leading-none tracking-tighter mb-4">
          SCALE ACROSS<br /><span className="text-brand-orange">LOCATIONS.</span>
        </h1>
        <p className="font-sans text-white/40 text-base mb-10 max-w-xl">
          Each branch gets its own members, trainers, payments, attendance tracking, and a WhatsApp token pool matching your plan tier.
        </p>

        {/* Current status */}
        {currentSlots !== null && (
          <div className="bg-white/5 border border-white/10 p-5 mb-10 flex items-center gap-6 flex-wrap">
            <div>
              <p className={labelCls}>CURRENT BRANCH SLOTS</p>
              <p className="font-archivo text-3xl text-white">{currentSlots} {currentSlots === 1 ? 'branch' : 'branches'}</p>
            </div>
            {plan && (
              <div>
                <p className={labelCls}>PLAN</p>
                <p className="font-mono text-sm font-bold text-brand-orange uppercase">{plan.replace(/_/g, ' ')}</p>
              </div>
            )}
          </div>
        )}

        {!canUseBranches && (
          <div className="border-2 border-white/10 p-6 mb-10 text-center">
            <p className="font-mono text-[10px] font-bold text-white/40 uppercase mb-2">UPGRADE REQUIRED</p>
            <p className="font-sans text-white/60 text-sm mb-4">
              Branch add-ons are available on Pro, Pro Plus, and Pro Max plans only.
            </p>
            <a href="/pricing"
              className="inline-block bg-brand-orange text-black px-6 py-3 font-archivo text-base uppercase tracking-tighter hover:opacity-90 transition-opacity">
              VIEW PLANS →
            </a>
          </div>
        )}

        {success && (
          <div className="mb-10 border-2 border-brand-orange bg-brand-orange/10 p-6 text-center">
            <Check className="w-8 h-8 text-brand-orange mx-auto mb-2" strokeWidth={3} />
            <p className="font-archivo text-xl text-brand-orange uppercase">
              +{addedSlots} BRANCH{addedSlots > 1 ? 'ES' : ''} ACTIVATED!
            </p>
            <p className="font-mono text-[10px] text-white/50 uppercase font-bold mt-1">
              You now have {currentSlots} active branch slot{(currentSlots ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {canUseBranches && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BRANCH_PACKS.map(pack => (
              <div key={pack.slots}
                className="border-2 border-white/20 p-8 flex flex-col hover:border-brand-orange/50 transition-colors">
                <p className="font-mono text-[10px] font-bold text-white/30 uppercase mb-2">{pack.label}</p>
                <p className="font-archivo text-4xl text-white mb-1">₹{pack.price.toLocaleString('en-IN')}</p>
                <p className="font-mono text-[10px] text-white/30 uppercase font-bold mb-1">/MONTH ADD-ON</p>
                <p className="font-mono text-[9px] text-white/20 uppercase font-bold mb-6">+18% GST applicable</p>

                <ul className="flex flex-col gap-2 mb-8 flex-1">
                  {[
                    `${pack.slots} branch location${pack.slots > 1 ? 's' : ''}`,
                    'Own member database',
                    'Own trainer management',
                    'Own payments & attendance',
                    'Own WhatsApp token pool',
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-3 h-3 flex-shrink-0 mt-0.5 text-brand-orange" strokeWidth={3} />
                      <span className="font-mono text-[10px] uppercase text-white/60">{f}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={() => handlePurchase(pack.slots, pack.price)} disabled={purchasing}
                  className="w-full bg-brand-orange text-black py-3 font-archivo text-lg uppercase tracking-tighter hover:opacity-90 transition-opacity disabled:opacity-50">
                  {purchasing ? 'PROCESSING...' : 'ADD BRANCHES →'}
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 font-mono text-[10px] text-white/20 uppercase font-bold text-center">
          BRANCHES ARE BILLED AS A FLAT MONTHLY ADD-ON TO YOUR EXISTING SUBSCRIPTION
        </p>
      </div>
    </main>
  );
};
