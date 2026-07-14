import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LogOut, Zap, ArrowUpRight, Download, AlertCircle,
  User, Building2, Phone, MapPin, Mail, Pencil, Check, X, Camera, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AppStoreBadges } from '../components/AppStoreBadges';
import { TOKEN_PACKS, PRICING } from '../lib/constants';
import { initiatePayU } from '../lib/payu';

interface Subscription {
  id: string;
  gym_id: string;
  plan: 'basic' | 'pro';
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'pending_payment';
  trial_ends_at: string | null;
  current_period_end: string;
}

interface TokenUsage {
  tokens_total: number;
  tokens_used: number;
}

interface Account {
  fullName: string;
  gymName: string;
  description: string;
  phone: string;
  city: string;
  logoUrl: string | null;
}

const EMPTY_ACCOUNT: Account = {
  fullName: '', gymName: '', description: '', phone: '', city: '', logoUrl: null,
};

const PLAN_META: Record<Subscription['plan'], { label: string; price: string }> = {
  basic: { label: 'Basic', price: '₹999 / month' },
  pro:   { label: 'Pro',   price: '₹1,699 / month' },
};

const STATUS_STYLE: Record<string, { label: string; dot: string; text: string }> = {
  trial:           { label: 'Free trial', dot: 'bg-amber',   text: 'text-amber'      },
  active:          { label: 'Active',     dot: 'bg-emerald-400', text: 'text-emerald-400' },
  pending_payment: { label: 'Payment due', dot: 'bg-amber',  text: 'text-amber'      },
  expired:         { label: 'Expired',    dot: 'bg-red-400', text: 'text-red-400'    },
  cancelled:       { label: 'Cancelled',  dot: 'bg-red-400', text: 'text-red-400'    },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
function daysLeft(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}
function validatePhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

const EYEBROW = 'font-mono text-[10px] uppercase tracking-[0.2em] text-ash';

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tokens, setTokens] = useState<TokenUsage | null>(null);
  const [gymId, setGymId] = useState<string | null>(null);
  const [account, setAccount] = useState<Account>(EMPTY_ACCOUNT);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Account edit state
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Account>(EMPTY_ACCOUNT);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = 'Dashboard | GymSetu'; }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [{ data: prof }, { data: gym }, { data: sub, error: subErr }] = await Promise.all([
          supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
          supabase.from('gyms').select('id, name, description, phone, address, logo_url').eq('owner_id', user.id).maybeSingle(),
          supabase.from('subscriptions').select('*').eq('owner_id', user.id)
            .order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (subErr) throw subErr;

        setSubscription(sub ?? null);
        if (gym) setGymId(gym.id);

        const acc: Account = {
          fullName:    prof?.full_name ?? '',
          gymName:     gym?.name ?? '',
          description: gym?.description ?? '',
          phone:       prof?.phone ?? gym?.phone ?? '',
          city:        gym?.address ?? '',
          logoUrl:     gym?.logo_url ?? null,
        };
        setAccount(acc);
        setDraft(acc);

        if (sub && sub.plan === 'pro' && sub.status !== 'expired') {
          const monthYear = new Date().toISOString().slice(0, 7);
          const { data: tok } = await supabase
            .from('subscription_tokens')
            .select('tokens_total, tokens_used')
            .eq('gym_id', sub.gym_id).eq('month_year', monthYear).maybeSingle();
          setTokens(tok ?? { tokens_total: 500, tokens_used: 0 });
        }
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // ── Account editing ──────────────────────────────────────────
  const startEdit = () => { setDraft(account); setLogoFile(null); setLogoPreview(null); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setLogoFile(null); setLogoPreview(null); };

  const onLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) { toast('Logo must be under 3 MB.', 'error'); return; }
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const saveAccount = async () => {
    if (!user || !gymId) return;
    if (!draft.fullName.trim()) { toast('Your name is required.', 'error'); return; }
    if (!draft.gymName.trim())  { toast('Gym name is required.', 'error'); return; }
    if (draft.phone && !validatePhone(draft.phone)) { toast('Enter a valid 10-digit mobile number.', 'error'); return; }

    setSaving(true);
    try {
      let logoUrl = account.logoUrl;
      if (logoFile) {
        const ext  = logoFile.name.split('.').pop();
        const path = `${user.id}/logo.${ext}`;
        const { error: upErr } = await supabase.storage.from('gym-logos').upload(path, logoFile, { upsert: true });
        if (upErr) throw new Error(`Logo upload failed: ${upErr.message}`);
        const { data: urlData } = supabase.storage.from('gym-logos').getPublicUrl(path);
        logoUrl = `${urlData.publicUrl}?v=${Date.now()}`; // bust cache
      }

      const phone = draft.phone.trim() || null;
      const { error: gymErr } = await supabase.from('gyms').update({
        name:        draft.gymName.trim(),
        description: draft.description.trim() || null,
        phone,
        address:     draft.city.trim() || null,
        logo_url:    logoUrl,
      }).eq('id', gymId);
      if (gymErr) throw new Error(gymErr.message);

      const { error: profErr } = await supabase.from('profiles').update({
        full_name: draft.fullName.trim(),
        phone,
      }).eq('id', user.id);
      if (profErr) throw new Error(profErr.message);

      const saved: Account = { ...draft, logoUrl };
      setAccount(saved);
      setDraft(saved);
      setEditing(false);
      setLogoFile(null); setLogoPreview(null);
      toast('Account details saved.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Payments ─────────────────────────────────────────────────
  const openTokenTopup = async (pack: typeof TOKEN_PACKS[number]) => {
    if (!user || !subscription) return;
    const { data: purchase, error } = await supabase.from('purchases').insert({
      owner_id: user.id, gym_id: subscription.gym_id, type: 'token_pack',
      token_amount: pack.tokens, amount: pack.price, status: 'pending',
    }).select('id').single();
    if (error || !purchase) { toast('Could not initiate purchase — please try again.', 'error'); return; }
    try {
      await initiatePayU({
        purchase_id: purchase.id, amount: pack.price,
        productinfo: `WhatsApp Token Pack — ${pack.tokens} messages`,
        firstname: user.user_metadata?.full_name ?? user.email ?? '',
        email: user.email ?? '', phone: account.phone || '0000000000',
        udf1: `tokens:${pack.tokens}`,
      });
    } catch (err) {
      await supabase.from('purchases').update({ status: 'failed' }).eq('id', purchase.id);
      toast(err instanceof Error ? err.message : 'Could not start payment.', 'error');
    }
  };

  const openUpgradeToPro = async () => {
    if (!subscription || !user) return;
    setUpgradeLoading(true);
    const amount = PRICING.pro.monthly;
    const { data: purchase, error } = await supabase.from('purchases').insert({
      owner_id: user.id, gym_id: subscription.gym_id, type: 'plan',
      plan: 'pro', billing_cycle: 'monthly', amount, status: 'pending',
    }).select('id').single();
    if (error || !purchase) { toast('Could not initiate upgrade — please try again.', 'error'); setUpgradeLoading(false); return; }
    try {
      await initiatePayU({
        purchase_id: purchase.id, amount,
        productinfo: 'Upgrade to Pro — Monthly Subscription',
        firstname: user.user_metadata?.full_name ?? user.email ?? '',
        email: user.email ?? '', phone: account.phone || '0000000000',
        udf1: 'upgrade:pro',
      });
    } catch (err) {
      await supabase.from('purchases').update({ status: 'failed' }).eq('id', purchase.id);
      toast(err instanceof Error ? err.message : 'Could not start payment.', 'error');
      setUpgradeLoading(false);
    }
  };

  // ── Loading / error states ───────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="flex items-center gap-2 text-ash">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-mono text-[11px] uppercase tracking-widest">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6 text-center">
        <div>
          <AlertCircle className="w-10 h-10 text-flame mx-auto mb-4" />
          <p className="font-display text-3xl text-bone uppercase mb-2">Couldn’t load your dashboard</p>
          <p className="font-sans text-ash text-sm mb-6">Check your connection and try again.</p>
          <button onClick={() => window.location.reload()}
            className="bg-heat text-black px-6 py-3 font-mono text-xs uppercase font-bold tracking-wider rounded-md hover:opacity-90">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = subscription ? STATUS_STYLE[subscription.status] : null;
  const isPro = subscription?.plan === 'pro';
  const initials = (account.gymName || 'G').trim().charAt(0).toUpperCase();
  const currentLogo = logoPreview ?? account.logoUrl;

  const inputCls =
    'w-full bg-ink border border-hairline focus:border-flame rounded-md px-3 py-2 ' +
    'text-bone text-sm outline-none transition-colors font-sans placeholder:text-ash/50';

  return (
    <main className="relative bg-ink min-h-screen px-4 pt-28 md:pt-32 pb-20 overflow-hidden">
      {/* Ambient atmosphere */}
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="glow-orb animate-float-glow" aria-hidden="true"
        style={{ width: 420, height: 420, top: -80, right: -60, background: 'radial-gradient(circle,#FF4D0055,transparent 70%)' }} />

      <div className="relative max-w-5xl mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 grid place-items-center glass">
              {account.logoUrl
                ? <img src={account.logoUrl} alt="" className="w-full h-full object-cover" />
                : <span className="font-display text-2xl text-flame">{initials}</span>}
            </div>
            <div className="min-w-0">
              <p className={EYEBROW}>Owner dashboard</p>
              <h1 className="font-display text-3xl md:text-4xl text-bone uppercase leading-none truncate">
                {account.gymName || 'Your gym'}
              </h1>
            </div>
          </div>
          <button onClick={signOut} aria-label="Sign out"
            className="flex items-center gap-2 border border-hairline text-ash hover:text-bone hover:border-ash px-4 py-2.5 rounded-md transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase font-bold hidden sm:block tracking-wider">Sign out</span>
          </button>
        </header>

        <div className="grid lg:grid-cols-3 gap-5">

          {/* ── Subscription pass (signature) ─────────────────── */}
          <section className={`lg:col-span-3 glass top-sheen rounded-2xl p-7 md:p-8 ${isPro ? 'glass-heat' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div>
                <p className={EYEBROW}>Subscription</p>
                <div className="flex items-baseline gap-3 mt-2">
                  <h2 className={`font-display text-4xl md:text-5xl uppercase leading-none ${isPro ? 'text-heat' : 'text-bone'}`}>
                    {subscription ? PLAN_META[subscription.plan].label : 'No plan'}
                  </h2>
                  {statusInfo && (
                    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold tracking-wider ${statusInfo.text}`}>
                      <span className={`pulse-dot w-1.5 h-1.5 rounded-full ${statusInfo.dot} ${statusInfo.text}`} />
                      {statusInfo.label}
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-ash mt-1">
                  {subscription ? PLAN_META[subscription.plan].price : 'Pick a plan to activate your gym'}
                </p>
              </div>

              <Link to="/pricing"
                className="self-start font-mono text-[10px] uppercase font-bold tracking-wider text-flame hover:underline whitespace-nowrap">
                Manage plan →
              </Link>
            </div>

            {subscription && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-7 pt-6 border-t border-hairline">
                {subscription.status === 'trial' && subscription.trial_ends_at && (
                  <Stat label="Trial ends" value={formatDate(subscription.trial_ends_at)}
                    sub={`${daysLeft(subscription.trial_ends_at)} days left`} subClass="text-amber" />
                )}
                <Stat
                  label={subscription.status === 'active' ? 'Renews on' : 'Period ends'}
                  value={formatDate(subscription.current_period_end)} />
                <Stat label="Plan tier" value={PLAN_META[subscription.plan].label} />
              </div>
            )}
          </section>

          {/* ── Account details (editable) ────────────────────── */}
          <section className="lg:col-span-2 glass rounded-2xl p-7">
            <div className="flex items-center justify-between mb-5">
              <p className={EYEBROW}>Account details</p>
              {!editing ? (
                <button onClick={startEdit}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold tracking-wider text-flame hover:underline">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={cancelEdit} disabled={saving}
                    className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold tracking-wider text-ash hover:text-bone disabled:opacity-40">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button onClick={saveAccount} disabled={saving}
                    className="flex items-center gap-1.5 bg-heat text-black px-3 py-1.5 rounded-md font-mono text-[10px] uppercase font-bold tracking-wider hover:opacity-90 disabled:opacity-50">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {saving ? 'Saving' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* Logo row */}
            <div className="flex items-center gap-4 pb-5 mb-1 border-b border-hairline">
              <div className="w-16 h-16 rounded-xl overflow-hidden grid place-items-center bg-ink border border-hairline shrink-0">
                {currentLogo
                  ? <img src={currentLogo} alt="Gym logo" className="w-full h-full object-cover" />
                  : <span className="font-display text-2xl text-flame">{initials}</span>}
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-ash mb-1">Gym logo</p>
                {editing ? (
                  <>
                    <button onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 border border-hairline hover:border-flame text-bone px-3 py-1.5 rounded-md font-mono text-[10px] uppercase font-bold tracking-wider transition-colors">
                      <Camera className="w-3.5 h-3.5" /> Change logo
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={onLogoPick} className="hidden" />
                  </>
                ) : (
                  <p className="font-sans text-sm text-ash">Shown to members in the app</p>
                )}
              </div>
            </div>

            <div className="divide-y divide-hairline">
              <Field icon={User} label="Your name" editing={editing} value={account.fullName}>
                <input className={inputCls} value={draft.fullName}
                  onChange={e => setDraft({ ...draft, fullName: e.target.value })} placeholder="Rajesh Kumar" />
              </Field>
              <Field icon={Building2} label="Gym name" editing={editing} value={account.gymName}>
                <input className={inputCls} value={draft.gymName}
                  onChange={e => setDraft({ ...draft, gymName: e.target.value })} placeholder="Iron Beast Fitness" />
              </Field>
              <Field icon={Mail} label="Email" editing={false} value={user?.email ?? ''}
                hint="Login email can’t be changed" />
              <Field icon={Phone} label="Phone" editing={editing} value={account.phone}>
                <input className={inputCls} value={draft.phone} inputMode="numeric" maxLength={10}
                  onChange={e => setDraft({ ...draft, phone: e.target.value.replace(/\D/g, '') })} placeholder="9876543210" />
              </Field>
              <Field icon={MapPin} label="City" editing={editing} value={account.city}>
                <input className={inputCls} value={draft.city}
                  onChange={e => setDraft({ ...draft, city: e.target.value })} placeholder="Mumbai" />
              </Field>
              <Field icon={Building2} label="Description" editing={editing} value={account.description}>
                <textarea rows={2} className={inputCls} value={draft.description}
                  onChange={e => setDraft({ ...draft, description: e.target.value })}
                  placeholder="A short line about your gym" />
              </Field>
            </div>
          </section>

          {/* ── Right rail ────────────────────────────────────── */}
          <div className="lg:col-span-1 flex flex-col gap-5">

            {/* No subscription → activate */}
            {!subscription && (
              <section className="glass top-sheen glass-heat rounded-2xl p-6">
                <p className={EYEBROW}>Activation required</p>
                <h3 className="font-display text-2xl text-bone uppercase leading-tight mt-2 mb-3">
                  Pick a plan to go live
                </h3>
                <p className="font-sans text-ash text-sm mb-5">
                  Your gym is set up. Choose a plan to start managing members.
                </p>
                <Link to="/signup/plan"
                  className="flex items-center justify-center gap-2 bg-heat text-black py-3 rounded-md font-mono text-xs uppercase font-bold tracking-wider hover:opacity-90">
                  Choose a plan <ArrowUpRight className="w-4 h-4" />
                </Link>
              </section>
            )}

            {/* WhatsApp tokens — Pro only */}
            {isPro && tokens && (
              <section className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-flame" />
                  <p className={EYEBROW}>WhatsApp tokens</p>
                </div>
                <p className="font-mono text-[10px] text-ash uppercase mb-4">
                  {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="font-display text-4xl text-bone">{tokens.tokens_total - tokens.tokens_used}</span>
                  <span className="font-mono text-[10px] text-ash uppercase">/ {tokens.tokens_total} left</span>
                </div>
                <div className="w-full bg-white/8 h-1.5 rounded-full mb-6" role="progressbar"
                  aria-valuenow={tokens.tokens_used} aria-valuemin={0} aria-valuemax={tokens.tokens_total}>
                  <div className="bg-heat h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (tokens.tokens_used / tokens.tokens_total) * 100)}%` }} />
                </div>
                <p className="font-mono text-[10px] text-ash uppercase mb-3 tracking-wider">Top up instantly</p>
                <div className="grid grid-cols-3 gap-2">
                  {TOKEN_PACKS.map(pack => (
                    <button key={pack.name} onClick={() => openTokenTopup(pack)}
                      className="border border-hairline hover:border-flame rounded-lg p-2.5 text-center transition-colors group"
                      aria-label={`Buy ${pack.tokens} tokens for ₹${pack.price}`}>
                      <div className="font-display text-lg text-bone group-hover:text-flame transition-colors">{pack.tokens}</div>
                      <div className="font-mono text-[8px] text-ash uppercase mb-1">msgs</div>
                      <div className="font-mono text-[11px] font-bold text-flame">₹{pack.price}</div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Upgrade to Pro — Basic only */}
            {subscription?.plan === 'basic' && (
              <section className="glass top-sheen rounded-2xl p-6">
                <p className={`${EYEBROW} text-flame`}>Unlock everything</p>
                <h3 className="font-display text-2xl text-bone uppercase leading-tight mt-2 mb-2">
                  Go Pro
                </h3>
                <p className="font-sans text-ash text-sm mb-5">
                  AI insights, WhatsApp automation, revenue forecasts &amp; more — just ₹700 more a month.
                </p>
                <button onClick={openUpgradeToPro} disabled={upgradeLoading}
                  className="flex items-center justify-center gap-2 w-full bg-heat text-black py-3 rounded-md font-mono text-xs uppercase font-bold tracking-wider hover:opacity-90 disabled:opacity-50">
                  {upgradeLoading ? 'Processing…' : 'Upgrade — ₹1,699/mo'}
                  {!upgradeLoading && <ArrowUpRight className="w-4 h-4" />}
                </button>
              </section>
            )}

            {/* Download app */}
            <section className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-4 h-4 text-flame" />
                <p className={EYEBROW}>Get the app</p>
              </div>
              <p className="font-sans text-ash text-sm mb-4">
                Members, payments &amp; attendance are managed in the mobile app.
              </p>
              <AppStoreBadges theme="light" />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

// ── Small building blocks ──────────────────────────────────────
function Stat({ label, value, sub, subClass }: {
  label: string; value: string; sub?: string; subClass?: string;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-ash mb-1.5">{label}</p>
      <p className="font-mono text-sm text-bone">{value}</p>
      {sub && <p className={`font-mono text-[10px] uppercase font-bold mt-1 ${subClass ?? 'text-ash'}`}>{sub}</p>}
    </div>
  );
}

function Field({ icon: Icon, label, value, editing, hint, children }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; editing: boolean; hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <Icon className="w-4 h-4 text-ash mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wider text-ash mb-1">{label}</p>
        {editing && children
          ? children
          : <p className="font-sans text-sm text-bone break-words">{value || <span className="text-ash">—</span>}</p>}
        {hint && !editing && <p className="font-mono text-[9px] text-ash/70 uppercase mt-1">{hint}</p>}
      </div>
    </div>
  );
}
