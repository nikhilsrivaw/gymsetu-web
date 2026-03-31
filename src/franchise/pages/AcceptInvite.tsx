import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Check, AlertTriangle, ArrowRight, Shield, IndianRupee, MapPin, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface BrandData {
  name: string;
  logo_url: string | null;
  royalty_percentage: number | null;
  franchise_fee: number | null;
  territory_model: string | null;
  support_level: string | null;
  training_included: boolean | null;
  description: string | null;
}

interface InviteData {
  id: string;
  brand_id: string;
  status: string;
  expires_at: string;
  city: string | null;
  brand: BrandData | null;
}

const TERRITORY_LABELS: Record<string, string> = {
  exclusive: 'Exclusive Territory',
  non_exclusive: 'Non-Exclusive',
  protected: 'Protected Zone',
};

const SUPPORT_LABELS: Record<string, string> = {
  basic: 'Basic Support',
  standard: 'Standard Support',
  premium: 'Premium Support',
};

export const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(1); // 1 = brand terms, 2 = agreement, 3 = gym form
  const [agreed, setAgreed] = useState(false);
  const [gymName, setGymName] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => { document.title = 'Accept Invite | GymSetu Franchise'; }, []);

  useEffect(() => {
    if (!token) { setError('No invite token provided.'); setLoading(false); return; }
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('franchise_invites')
        .select(`
          id, brand_id, status, expires_at, city,
          brand:franchise_brands(
            name, logo_url, royalty_percentage, franchise_fee,
            territory_model, support_level, training_included, description
          )
        `)
        .eq('token', token)
        .maybeSingle();

      if (fetchErr || !data) {
        setError('This invite link is invalid or has been removed.');
        setLoading(false);
        return;
      }

      const inv = {
        ...data,
        brand: Array.isArray(data.brand) ? data.brand[0] ?? null : data.brand,
      } as InviteData;

      if (inv.status === 'accepted') { setError('This invite has already been accepted.'); setLoading(false); return; }
      if (inv.status === 'revoked')  { setError('This invite has been revoked by the franchisor.'); setLoading(false); return; }
      if (new Date(inv.expires_at) < new Date()) { setError('This invite has expired.'); setLoading(false); return; }

      setInvite(inv);
      if (inv.city) setCity(inv.city);
      setLoading(false);
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!session || !invite) return;
    if (!gymName.trim()) { toast('Please enter a name for your location.', 'error'); return; }

    setAccepting(true);
    try {
      const userId = session.user.id;

      const { error: locErr } = await supabase.from('franchise_locations').insert({
        brand_id: invite.brand_id,
        owner_id: userId,
        name: gymName.trim(),
        city: city.trim() || null,
        status: 'pending',
      });
      if (locErr) throw new Error(locErr.message);

      const { error: invErr } = await supabase.from('franchise_invites')
        .update({ status: 'accepted', accepted_by: userId })
        .eq('id', invite.id);
      if (invErr) console.warn('Failed to update invite status:', invErr.message);

      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to accept invite.';
      toast(msg, 'error');
      console.error(err);
    } finally {
      setAccepting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <main className="bg-near-black min-h-screen flex items-center justify-center px-4">
        <div className="font-mono text-[10px] uppercase font-bold text-white/30 animate-pulse">
          LOADING INVITE...
        </div>
      </main>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="bg-near-black min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="font-archivo text-3xl text-white uppercase mb-4 tracking-tighter">INVITE ISSUE</h1>
          <p className="font-sans text-white/50 mb-6">{error}</p>
          <Link to="/" className="font-mono text-[10px] text-brand-orange uppercase font-bold hover:underline">
            GO TO HOMEPAGE →
          </Link>
        </div>
      </main>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <main className="bg-near-black min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-brand-orange flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-black" strokeWidth={3} />
          </div>
          <h1 className="font-archivo text-4xl text-white uppercase mb-4 tracking-tighter">YOU'RE IN!</h1>
          <p className="font-sans text-white/50 mb-2">
            You've joined <span className="text-brand-orange font-bold">{invite?.brand?.name}</span> as a franchise location.
          </p>
          <p className="font-sans text-white/30 text-sm mb-8">
            The franchisor will review and activate your location. You'll see updates in your dashboard.
          </p>
          <Link to="/dashboard"
            className="inline-block bg-brand-orange text-black px-8 py-4 font-archivo text-lg uppercase tracking-tighter hover:opacity-90 transition-opacity">
            GO TO DASHBOARD
          </Link>
        </div>
      </main>
    );
  }

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!session) {
    return (
      <main className="bg-near-black min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {invite?.brand?.logo_url && (
            <img src={invite.brand.logo_url} alt="" className="w-16 h-16 object-cover border border-white/10 mx-auto mb-4" />
          )}
          <div className="font-mono text-[10px] text-brand-orange uppercase font-bold mb-2 tracking-widest">
            FRANCHISE INVITE
          </div>
          <h1 className="font-archivo text-3xl text-white uppercase mb-2 tracking-tighter">
            JOIN {invite?.brand?.name?.toUpperCase()}
          </h1>
          <p className="font-sans text-white/50 text-sm mb-8">
            You've been invited to join as a franchise location. Create an account or log in to view terms and accept.
          </p>
          <div className="flex flex-col gap-3">
            <Link to={`/signup?redirect=/accept-invite/${token}`}
              className="w-full bg-brand-orange text-black py-4 font-archivo text-lg uppercase tracking-tighter hover:opacity-90 transition-opacity text-center">
              CREATE ACCOUNT
            </Link>
            <Link to={`/login?redirect=/accept-invite/${token}`}
              className="w-full border-2 border-white/20 text-white py-4 font-archivo text-lg uppercase tracking-tighter hover:border-white/50 transition-colors text-center">
              LOG IN
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Logged in — multi-step flow ──────────────────────────────────────────
  const brand = invite!.brand;

  const inputCls = 'w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors';
  const labelCls = 'font-mono text-[10px] uppercase font-bold text-white/40 block mb-1';

  return (
    <main className="bg-near-black min-h-screen px-4 pt-16 pb-16 flex items-start justify-center">
      <div className="max-w-lg w-full mt-8">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-7 h-7 border-2 font-mono text-[10px] font-bold transition-all ${
                step === s
                  ? 'border-brand-orange bg-brand-orange text-black'
                  : step > s
                    ? 'border-brand-orange bg-brand-orange/10 text-brand-orange'
                    : 'border-white/20 text-white/30'
              }`}>
                {step > s ? <Check className="w-3 h-3" strokeWidth={3} /> : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-px ${step > s ? 'bg-brand-orange/40' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1: Brand Overview ────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <div className="font-mono text-[10px] text-brand-orange uppercase font-bold mb-2 tracking-widest">
              STEP 1 — FRANCHISE TERMS
            </div>
            <h1 className="font-archivo text-3xl md:text-4xl text-white uppercase mb-1 leading-none tracking-tighter">
              REVIEW THE<br /><span className="text-brand-orange">BRAND TERMS.</span>
            </h1>
            <p className="font-sans text-white/40 text-sm mb-6">
              Before joining, review what this franchise offers and expects.
            </p>

            {/* Brand card */}
            <div className="border-2 border-white/10 p-6 mb-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                {brand?.logo_url ? (
                  <img src={brand.logo_url} alt="" className="w-14 h-14 object-cover border border-white/10 flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                    <span className="font-archivo text-xl text-white/20">{brand?.name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <h2 className="font-archivo text-2xl text-white uppercase tracking-tighter">{brand?.name}</h2>
                  {brand?.description && (
                    <p className="font-sans text-white/40 text-sm mt-1 leading-relaxed">{brand.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Franchise Fee */}
                <div className="bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee className="w-3.5 h-3.5 text-brand-orange" />
                    <span className="font-mono text-[9px] font-bold text-white/30 uppercase">Franchise Fee</span>
                  </div>
                  <p className="font-archivo text-xl text-white">
                    {brand?.franchise_fee
                      ? `₹${brand.franchise_fee.toLocaleString('en-IN')}`
                      : 'Not specified'}
                  </p>
                  <p className="font-mono text-[9px] text-white/20 mt-0.5">ONE-TIME</p>
                </div>

                {/* Royalty % */}
                <div className="bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[9px] font-bold text-brand-orange">%</span>
                    <span className="font-mono text-[9px] font-bold text-white/30 uppercase">Royalty</span>
                  </div>
                  <p className="font-archivo text-xl text-white">
                    {brand?.royalty_percentage != null ? `${brand.royalty_percentage}%` : 'Not specified'}
                  </p>
                  <p className="font-mono text-[9px] text-white/20 mt-0.5">OF MONTHLY REVENUE</p>
                </div>

                {/* Territory */}
                <div className="bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-orange" />
                    <span className="font-mono text-[9px] font-bold text-white/30 uppercase">Territory</span>
                  </div>
                  <p className="font-archivo text-base text-white leading-tight">
                    {brand?.territory_model ? TERRITORY_LABELS[brand.territory_model] ?? brand.territory_model : 'Not specified'}
                  </p>
                </div>

                {/* Support Level */}
                <div className="bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-3.5 h-3.5 text-brand-orange" />
                    <span className="font-mono text-[9px] font-bold text-white/30 uppercase">Support</span>
                  </div>
                  <p className="font-archivo text-base text-white leading-tight">
                    {brand?.support_level ? SUPPORT_LABELS[brand.support_level] ?? brand.support_level : 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Training included */}
              <div className={`mt-4 flex items-center gap-3 p-3 border ${
                brand?.training_included
                  ? 'border-brand-orange/40 bg-brand-orange/5'
                  : 'border-white/10'
              }`}>
                <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 ${
                  brand?.training_included ? 'bg-brand-orange border-brand-orange' : 'border-white/20'
                }`}>
                  {brand?.training_included && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                </div>
                <span className={`font-mono text-[10px] font-bold uppercase ${
                  brand?.training_included ? 'text-brand-orange' : 'text-white/30'
                }`}>
                  {brand?.training_included ? 'TRAINING PROVIDED TO FRANCHISEES' : 'NO TRAINING INCLUDED'}
                </span>
              </div>
            </div>

            <button onClick={() => setStep(2)}
              className="w-full bg-brand-orange text-black py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              REVIEW AGREEMENT <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Agreement ─────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <div className="font-mono text-[10px] text-brand-orange uppercase font-bold mb-2 tracking-widest">
              STEP 2 — AGREEMENT
            </div>
            <h1 className="font-archivo text-3xl md:text-4xl text-white uppercase mb-1 leading-none tracking-tighter">
              KEY<br /><span className="text-brand-orange">OBLIGATIONS.</span>
            </h1>
            <p className="font-sans text-white/40 text-sm mb-6">
              By joining, you acknowledge and agree to the following.
            </p>

            <div className="border border-white/10 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-brand-orange" />
                <span className="font-mono text-[10px] font-bold text-white/50 uppercase">Franchise Obligations</span>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  `Pay the one-time franchise fee of ${brand?.franchise_fee ? `₹${brand.franchise_fee.toLocaleString('en-IN')}` : 'as agreed'} upon activation.`,
                  `Pay ${brand?.royalty_percentage ?? 0}% of monthly revenue as royalty to ${brand?.name}.`,
                  `Operate exclusively within your ${brand?.territory_model ? TERRITORY_LABELS[brand.territory_model]?.toLowerCase() ?? brand.territory_model : 'designated'} territory.`,
                  `Follow brand standards, SOPs, and operational guidelines set by ${brand?.name}.`,
                  'Report monthly revenue accurately and on time via the GymSetu platform.',
                  'Maintain brand quality standards and undergo periodic reviews.',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="font-mono text-[9px] text-white/30">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <p className="font-sans text-sm text-white/60 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Agreement checkbox */}
            <button
              type="button"
              onClick={() => setAgreed((v) => !v)}
              className={`w-full text-left flex items-start gap-3 p-4 border-2 transition-all mb-6 ${
                agreed ? 'border-brand-orange bg-brand-orange/5' : 'border-white/20 hover:border-white/30'
              }`}
            >
              <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                agreed ? 'bg-brand-orange border-brand-orange' : 'border-white/30'
              }`}>
                {agreed && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
              </div>
              <p className={`font-sans text-sm leading-relaxed ${agreed ? 'text-white' : 'text-white/50'}`}>
                I have read and understood the franchise terms above. I agree to operate under the brand standards and obligations of{' '}
                <span className="font-bold text-brand-orange">{brand?.name}</span>.
              </p>
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 border-2 border-white/20 text-white/50 py-4 font-archivo text-lg uppercase tracking-tighter hover:border-white/40 hover:text-white/70 transition-all">
                BACK
              </button>
              <button
                onClick={() => { if (!agreed) { toast('Please agree to the terms to continue.', 'error'); return; } setStep(3); }}
                className="flex-1 bg-brand-orange text-black py-4 font-archivo text-lg uppercase tracking-tighter hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                CONTINUE <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Gym Details ───────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <div className="font-mono text-[10px] text-brand-orange uppercase font-bold mb-2 tracking-widest">
              STEP 3 — YOUR LOCATION
            </div>
            <h1 className="font-archivo text-3xl md:text-4xl text-white uppercase mb-1 leading-none tracking-tighter">
              SET UP YOUR<br /><span className="text-brand-orange">GYM.</span>
            </h1>
            <p className="font-sans text-white/40 text-sm mb-6">
              Tell us about your location. The franchisor will review and activate it.
            </p>

            <div className="flex flex-col gap-5 mb-6">
              <div>
                <label htmlFor="ai_name" className={labelCls}>Your Gym / Location Name *</label>
                <input id="ai_name" type="text" value={gymName} onChange={(e) => setGymName(e.target.value)}
                  placeholder={`${brand?.name} — Andheri`}
                  className={inputCls} />
              </div>
              <div>
                <label htmlFor="ai_city" className={labelCls}>City</label>
                <input id="ai_city" type="text" value={city} onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className={inputCls} />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 mb-6">
              <p className="font-mono text-[10px] font-bold text-white/30 uppercase mb-2">SUMMARY</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="font-mono text-[10px] text-white/30 uppercase">Brand</span>
                  <span className="font-mono text-[10px] text-white font-bold">{brand?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-[10px] text-white/30 uppercase">Royalty</span>
                  <span className="font-mono text-[10px] text-brand-orange font-bold">{brand?.royalty_percentage ?? 0}% of monthly revenue</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-[10px] text-white/30 uppercase">Agreement</span>
                  <span className="font-mono text-[10px] text-brand-orange font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" strokeWidth={3} /> SIGNED
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 border-2 border-white/20 text-white/50 py-4 font-archivo text-lg uppercase tracking-tighter hover:border-white/40 hover:text-white/70 transition-all">
                BACK
              </button>
              <button onClick={handleAccept} disabled={accepting}
                className="flex-1 bg-brand-orange text-black py-4 font-archivo text-lg uppercase tracking-tighter hover:opacity-90 transition-opacity disabled:opacity-50">
                {accepting ? 'JOINING...' : 'ACCEPT & JOIN →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
