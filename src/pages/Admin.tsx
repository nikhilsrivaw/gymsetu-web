import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw, AlertCircle, Search, X, Check, Loader2,
  Building2, IndianRupee, Users, Activity, Zap, Wallet,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { PRICING, type PlanId } from '../lib/constants';

// ── Types ──────────────────────────────────────────────────────
type SubStatus = 'trial' | 'active' | 'expired' | 'cancelled';

interface GymRow {
  subId: string;
  gymId: string;
  ownerId: string;
  plan: PlanId;
  status: SubStatus;
  trialEndsAt: string | null;
  periodEnd: string | null;
  createdAt: string;
  gymName: string;
  gymPhone: string;
  gymCity: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  memberCount: number;
  tokensTotal: number;
  tokensUsed: number;
}

interface PurchaseRow {
  id: string;
  gymName: string;
  ownerEmail: string;
  type: string;
  detail: string;
  amount: number;
  status: string;
  txnid: string | null;
  createdAt: string;
}

const PLAN_LABEL: Record<PlanId, string> = {
  basic: 'Basic', pro: 'Pro', pro_plus: 'Pro Plus', pro_max: 'Pro Max',
};
const PLAN_IDS: PlanId[] = ['basic', 'pro', 'pro_plus', 'pro_max'];
const STATUS_IDS: SubStatus[] = ['trial', 'active', 'expired', 'cancelled'];

const STATUS_STYLE: Record<string, string> = {
  trial:     'text-amber border-amber/30 bg-amber/10',
  active:    'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  expired:   'text-red-400 border-red-400/30 bg-red-400/10',
  cancelled: 'text-red-400 border-red-400/30 bg-red-400/10',
  // purchases
  paid:      'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  success:   'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  pending:   'text-amber border-amber/30 bg-amber/10',
  failed:    'text-red-400 border-red-400/30 bg-red-400/10',
  refunded:  'text-ash border-hairline bg-white/5',
};

const PAID_STATUSES = ['paid', 'success', 'completed'];
const monthKey = () => new Date().toISOString().slice(0, 7);

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtINR = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
const toDateInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');
const fromDateInput = (d: string) => (d ? new Date(d + 'T00:00:00Z').toISOString() : null);

const EYEBROW = 'font-mono text-[10px] uppercase tracking-[0.2em] text-ash';

// ── Component ──────────────────────────────────────────────────
export const Admin = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<'overview' | 'gyms' | 'payments'>('overview');
  const [rows, setRows] = useState<GymRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [payFilter, setPayFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [editing, setEditing] = useState<GymRow | null>(null);

  useEffect(() => { document.title = 'Admin | GymSetu'; }, []);

  const load = async () => {
    setLoading(true); setError(false);
    try {
      const [subsRes, gymsRes, profRes, memRes, tokRes] = await Promise.all([
        supabase.from('subscriptions').select('id, gym_id, owner_id, plan, status, trial_ends_at, current_period_end, created_at').order('created_at', { ascending: false }),
        supabase.from('gyms').select('id, name, phone, address'),
        supabase.from('profiles').select('id, full_name, email, phone'),
        supabase.from('members').select('gym_id'),
        supabase.from('subscription_tokens').select('gym_id, tokens_total, tokens_used, month_year').eq('month_year', monthKey()),
      ]);
      if (subsRes.error) throw subsRes.error;

      const gymMap = new Map((gymsRes.data ?? []).map(g => [g.id, g]));
      const profMap = new Map((profRes.data ?? []).map(p => [p.id, p]));
      const tokMap = new Map((tokRes.data ?? []).map(t => [t.gym_id, t]));
      const memCount = new Map<string, number>();
      (memRes.data ?? []).forEach((m: any) => memCount.set(m.gym_id, (memCount.get(m.gym_id) ?? 0) + 1));

      const mapped: GymRow[] = (subsRes.data ?? []).map((s: any) => {
        const g = gymMap.get(s.gym_id) as any;
        const p = profMap.get(s.owner_id) as any;
        const t = tokMap.get(s.gym_id) as any;
        return {
          subId: s.id, gymId: s.gym_id, ownerId: s.owner_id,
          plan: (s.plan ?? 'basic') as PlanId, status: (s.status ?? 'trial') as SubStatus,
          trialEndsAt: s.trial_ends_at, periodEnd: s.current_period_end, createdAt: s.created_at,
          gymName: g?.name ?? '—', gymPhone: g?.phone ?? '', gymCity: g?.address ?? '',
          ownerName: p?.full_name ?? '—', ownerEmail: p?.email ?? '—', ownerPhone: p?.phone ?? '',
          memberCount: memCount.get(s.gym_id) ?? 0,
          tokensTotal: t?.tokens_total ?? 0, tokensUsed: t?.tokens_used ?? 0,
        };
      });
      setRows(mapped);

      // Purchases (optional table — don't fail the whole page if absent)
      const purRes = await supabase
        .from('purchases')
        .select('id, gym_id, owner_id, type, plan, billing_cycle, token_amount, amount, status, payu_txnid, created_at')
        .order('created_at', { ascending: false }).limit(500);
      if (!purRes.error && purRes.data) {
        setPurchases(purRes.data.map((r: any) => ({
          id: r.id,
          gymName: (gymMap.get(r.gym_id) as any)?.name ?? '—',
          ownerEmail: (profMap.get(r.owner_id) as any)?.email ?? '—',
          type: r.type ?? '—',
          detail: r.type === 'token_pack'
            ? `${r.token_amount ?? '?'} tokens`
            : `${PLAN_LABEL[r.plan as PlanId] ?? r.plan ?? ''} ${r.billing_cycle ? '· ' + String(r.billing_cycle).replace('_', '-') : ''}`.trim(),
          amount: Number(r.amount ?? 0),
          status: r.status ?? '—',
          txnid: r.payu_txnid ?? null,
          createdAt: r.created_at,
        })));
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived stats ────────────────────────────────────────────
  const stats = useMemo(() => {
    const activeish = rows.filter(r => r.status === 'active' || r.status === 'trial');
    const mrr = activeish.reduce((sum, r) => sum + (PRICING[r.plan]?.monthly ?? 0), 0);
    const revenue = purchases
      .filter(p => PAID_STATUSES.includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);
    return {
      totalGyms: rows.length,
      active: activeish.length,
      trials: rows.filter(r => r.status === 'trial').length,
      members: rows.reduce((s, r) => s + r.memberCount, 0),
      mrr, revenue,
      byPlan: PLAN_IDS.map(id => ({ id, count: rows.filter(r => r.plan === id).length })),
    };
  }, [rows, purchases]);

  const filteredGyms = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r =>
      r.gymName.toLowerCase().includes(q) ||
      r.ownerName.toLowerCase().includes(q) ||
      r.ownerEmail.toLowerCase().includes(q) ||
      r.ownerPhone.includes(q));
  }, [rows, search]);

  const filteredPurchases = useMemo(() => {
    if (payFilter === 'all') return purchases;
    if (payFilter === 'paid') return purchases.filter(p => PAID_STATUSES.includes(p.status));
    return purchases.filter(p => p.status === payFilter);
  }, [purchases, payFilter]);

  // ── Mutations ────────────────────────────────────────────────
  const saveGym = async (draft: {
    subId: string; gymId: string; plan: PlanId; status: SubStatus;
    trialEndsAt: string | null; periodEnd: string | null; tokensTotal: number;
  }) => {
    const { error: subErr } = await supabase.from('subscriptions').update({
      plan: draft.plan, status: draft.status,
      trial_ends_at: draft.trialEndsAt, current_period_end: draft.periodEnd,
    }).eq('id', draft.subId);
    if (subErr) throw new Error(subErr.message);

    // upsert this month's token budget
    const { error: tokErr } = await supabase.from('subscription_tokens').upsert({
      gym_id: draft.gymId, month_year: monthKey(), tokens_total: draft.tokensTotal,
    }, { onConflict: 'gym_id,month_year' });
    if (tokErr) throw new Error(tokErr.message);

    await load();
  };

  const setPurchaseStatus = async (id: string, status: string) => {
    const { error: e } = await supabase.from('purchases').update({ status }).eq('id', id);
    if (e) { toast(e.message, 'error'); return; }
    setPurchases(prev => prev.map(p => (p.id === id ? { ...p, status } : p)));
    toast(`Marked ${status}.`, 'success');
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <main className="relative bg-ink min-h-screen px-4 pt-28 md:pt-32 pb-20 overflow-hidden">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="glow-orb animate-float-glow" aria-hidden="true"
        style={{ width: 460, height: 460, top: -100, left: -80, background: 'radial-gradient(circle,#FF4D0044,transparent 70%)' }} />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className={`${EYEBROW} text-flame`}>Platform · Internal</p>
            <h1 className="font-display text-4xl md:text-5xl text-bone uppercase leading-none mt-1">Admin console</h1>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 border border-hairline text-ash hover:text-bone hover:border-ash px-4 py-2.5 rounded-md transition-colors disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-mono text-[10px] uppercase font-bold hidden sm:block tracking-wider">Refresh</span>
          </button>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 p-1 glass rounded-lg w-fit mb-8">
          {([['overview', 'Overview'], ['gyms', 'Gyms & Owners'], ['payments', 'Payments']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-md font-mono text-[11px] uppercase font-bold tracking-wider transition-colors ${
                tab === id ? 'bg-heat text-black' : 'text-ash hover:text-bone'}`}>
              {label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="text-center py-24">
            <AlertCircle className="w-10 h-10 text-flame mx-auto mb-4" />
            <p className="font-display text-2xl text-bone uppercase mb-4">Failed to load</p>
            <button onClick={load} className="bg-heat text-black px-6 py-3 font-mono text-xs uppercase font-bold tracking-wider rounded-md hover:opacity-90">Retry</button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-ash">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-mono text-[11px] uppercase tracking-widest">Loading platform data…</span>
          </div>
        ) : (
          <>
            {tab === 'overview' && <Overview stats={stats} recent={rows.slice(0, 6)} />}
            {tab === 'gyms' && (
              <GymsTab
                rows={filteredGyms} total={rows.length}
                search={search} setSearch={setSearch} onEdit={setEditing} />
            )}
            {tab === 'payments' && (
              <PaymentsTab
                rows={filteredPurchases} total={purchases.length}
                filter={payFilter} setFilter={setPayFilter} onStatus={setPurchaseStatus} />
            )}
          </>
        )}
      </div>

      {editing && (
        <EditDrawer row={editing} onClose={() => setEditing(null)}
          onSave={saveGym} toast={toast} />
      )}
    </main>
  );
};

// ── Overview tab ───────────────────────────────────────────────
function Overview({ stats, recent }: { stats: any; recent: GymRow[] }) {
  const cards = [
    { icon: IndianRupee, label: 'Est. MRR', value: fmtINR(stats.mrr), sub: 'active + trial plans' },
    { icon: Wallet, label: 'Total revenue', value: fmtINR(stats.revenue), sub: 'paid purchases' },
    { icon: Building2, label: 'Total gyms', value: stats.totalGyms, sub: `${stats.active} active` },
    { icon: Users, label: 'Members', value: stats.members.toLocaleString('en-IN'), sub: 'across all gyms' },
  ];
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="glass rounded-2xl p-5">
            <c.icon className="w-4 h-4 text-flame mb-3" />
            <p className={EYEBROW}>{c.label}</p>
            <p className="font-display text-3xl md:text-4xl text-bone mt-1 leading-none">{c.value}</p>
            <p className="font-mono text-[10px] text-ash mt-1.5">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Plan split */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4"><Activity className="w-4 h-4 text-flame" /><p className={EYEBROW}>Plan distribution</p></div>
          <div className="flex flex-col gap-3">
            {stats.byPlan.map((p: any) => {
              const pct = stats.totalGyms ? (p.count / stats.totalGyms) * 100 : 0;
              return (
                <div key={p.id}>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[11px] text-bone uppercase">{PLAN_LABEL[p.id as PlanId]}</span>
                    <span className="font-mono text-[11px] text-ash">{p.count}</span>
                  </div>
                  <div className="w-full bg-white/8 h-1.5 rounded-full">
                    <div className="bg-heat h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent signups */}
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <p className={`${EYEBROW} mb-4`}>Recent signups</p>
          <div className="flex flex-col divide-y divide-hairline">
            {recent.length === 0 && <p className="font-sans text-sm text-ash">No gyms yet.</p>}
            {recent.map(r => (
              <div key={r.subId} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="font-sans text-sm text-bone truncate">{r.gymName}</p>
                  <p className="font-mono text-[10px] text-ash truncate">{r.ownerEmail}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className={`font-mono text-[9px] font-bold uppercase px-2 py-0.5 border rounded ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  <p className="font-mono text-[10px] text-ash mt-1">{fmtDate(r.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Gyms tab ───────────────────────────────────────────────────
function GymsTab({ rows, total, search, setSearch, onEdit }: {
  rows: GymRow[]; total: number; search: string;
  setSearch: (s: string) => void; onEdit: (r: GymRow) => void;
}) {
  return (
    <div>
      <div className="relative max-w-sm mb-5">
        <Search className="w-4 h-4 text-ash absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search gym, owner, email, phone…"
          className="w-full bg-surface border border-hairline focus:border-flame rounded-md pl-9 pr-3 py-2.5 text-bone text-sm outline-none transition-colors font-sans placeholder:text-ash/60" />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-hairline">
                {['Gym', 'Owner', 'Plan', 'Status', 'Members', 'Tokens', 'Ends', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-mono text-[10px] text-ash uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.subId} className="border-b border-hairline/60 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-sans text-sm text-bone">{r.gymName}</p>
                    <p className="font-mono text-[10px] text-ash">{r.gymCity || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-sans text-[13px] text-bone/90">{r.ownerName}</p>
                    <p className="font-mono text-[10px] text-ash">{r.ownerEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] font-bold uppercase text-bone">{PLAN_LABEL[r.plan]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[9px] font-bold uppercase px-2 py-1 border rounded ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-bone/80">{r.memberCount}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ash">{r.tokensTotal ? `${r.tokensUsed}/${r.tokensTotal}` : '—'}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ash">{fmtDate(r.status === 'trial' ? r.trialEndsAt : r.periodEnd)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onEdit(r)}
                      className="font-mono text-[10px] uppercase font-bold tracking-wider text-flame hover:underline">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-hairline">
          {rows.map(r => (
            <button key={r.subId} onClick={() => onEdit(r)} className="w-full text-left p-4 hover:bg-white/[0.02]">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="font-sans text-sm text-bone truncate">{r.gymName}</p>
                  <p className="font-mono text-[10px] text-ash truncate">{r.ownerName} · {r.ownerEmail}</p>
                </div>
                <span className={`font-mono text-[9px] font-bold uppercase px-2 py-1 border rounded shrink-0 ml-2 ${STATUS_STYLE[r.status]}`}>{r.status}</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[10px] text-ash">
                <span className="text-bone/70">{PLAN_LABEL[r.plan]}</span>
                <span>· {r.memberCount} members</span>
                <span>· ends {fmtDate(r.status === 'trial' ? r.trialEndsAt : r.periodEnd)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <p className="font-mono text-[10px] text-ash uppercase mt-4 text-right">Showing {rows.length} of {total} gyms</p>
    </div>
  );
}

// ── Payments tab ───────────────────────────────────────────────
function PaymentsTab({ rows, total, filter, setFilter, onStatus }: {
  rows: PurchaseRow[]; total: number;
  filter: string; setFilter: (f: any) => void;
  onStatus: (id: string, status: string) => void;
}) {
  return (
    <div>
      <div className="flex gap-2 mb-5">
        {(['all', 'paid', 'pending', 'failed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md font-mono text-[10px] uppercase font-bold tracking-wider border transition-colors ${
              filter === f ? 'bg-heat text-black border-transparent' : 'text-ash border-hairline hover:border-ash'}`}>
            {f}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center">
          <Zap className="w-8 h-8 text-ash mx-auto mb-3" />
          <p className="font-sans text-sm text-ash">No purchases {filter !== 'all' ? `with status “${filter}”` : 'yet'}.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-hairline">
                {['Gym / Owner', 'Item', 'Amount', 'Status', 'Txn', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-mono text-[10px] text-ash uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.id} className="border-b border-hairline/60 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-sans text-[13px] text-bone">{p.gymName}</p>
                    <p className="font-mono text-[10px] text-ash">{p.ownerEmail}</p>
                  </td>
                  <td className="px-4 py-3 font-sans text-[12px] text-bone/80">{p.detail}<span className="text-ash"> · {p.type}</span></td>
                  <td className="px-4 py-3 font-mono text-[13px] text-bone">{fmtINR(p.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[9px] font-bold uppercase px-2 py-1 border rounded ${STATUS_STYLE[p.status] ?? 'text-ash border-hairline'}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-ash">{p.txnid ? p.txnid.slice(0, 14) : '—'}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-ash">{fmtDate(p.createdAt)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {p.status === 'pending' && (
                      <button onClick={() => onStatus(p.id, 'paid')}
                        className="font-mono text-[10px] uppercase font-bold text-emerald-400 hover:underline mr-3">Mark paid</button>
                    )}
                    {PAID_STATUSES.includes(p.status) && (
                      <button onClick={() => onStatus(p.id, 'refunded')}
                        className="font-mono text-[10px] uppercase font-bold text-ash hover:text-bone hover:underline">Refund</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="font-mono text-[10px] text-ash uppercase mt-4 text-right">Showing {rows.length} of {total} purchases</p>
    </div>
  );
}

// ── Edit drawer ────────────────────────────────────────────────
function EditDrawer({ row, onClose, onSave, toast }: {
  row: GymRow; onClose: () => void;
  onSave: (d: any) => Promise<void>;
  toast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [plan, setPlan] = useState<PlanId>(row.plan);
  const [status, setStatus] = useState<SubStatus>(row.status);
  const [trial, setTrial] = useState(toDateInput(row.trialEndsAt));
  const [period, setPeriod] = useState(toDateInput(row.periodEnd));
  const [tokensTotal, setTokensTotal] = useState(String(row.tokensTotal));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        subId: row.subId, gymId: row.gymId, plan, status,
        trialEndsAt: fromDateInput(trial), periodEnd: fromDateInput(period),
        tokensTotal: Math.max(0, parseInt(tokensTotal || '0', 10)),
      });
      toast('Gym updated.', 'success');
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-ink border border-hairline focus:border-flame rounded-md px-3 py-2 text-bone text-sm outline-none transition-colors font-sans';
  const labelCls = 'font-mono text-[10px] uppercase tracking-wider text-ash mb-1.5 block';

  return (
    <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-ink-2 border-l border-hairline overflow-y-auto p-7 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className={EYEBROW}>Manage gym</p>
            <h2 className="font-display text-2xl text-bone uppercase leading-tight mt-1">{row.gymName}</h2>
            <p className="font-mono text-[10px] text-ash mt-1">{row.ownerEmail}</p>
          </div>
          <button onClick={onClose} className="text-ash hover:text-bone p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Read-only owner facts */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            ['Owner', row.ownerName], ['Phone', row.ownerPhone || row.gymPhone || '—'],
            ['City', row.gymCity || '—'], ['Members', String(row.memberCount)],
          ].map(([k, v]) => (
            <div key={k} className="glass rounded-lg p-3">
              <p className="font-mono text-[9px] uppercase tracking-wider text-ash">{k}</p>
              <p className="font-sans text-sm text-bone truncate">{v}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Plan</label>
            <div className="grid grid-cols-2 gap-2">
              {PLAN_IDS.map(id => (
                <button key={id} onClick={() => setPlan(id)}
                  className={`px-3 py-2 rounded-md font-mono text-[11px] uppercase font-bold border transition-colors ${
                    plan === id ? 'bg-heat text-black border-transparent' : 'text-ash border-hairline hover:border-ash'}`}>
                  {PLAN_LABEL[id]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_IDS.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`px-3 py-2 rounded-md font-mono text-[11px] uppercase font-bold border transition-colors ${
                    status === s ? 'bg-heat text-black border-transparent' : 'text-ash border-hairline hover:border-ash'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Trial ends</label>
              <input type="date" value={trial} onChange={e => setTrial(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Period ends</label>
              <input type="date" value={period} onChange={e => setPeriod(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>WhatsApp tokens — this month</label>
            <input type="number" min={0} value={tokensTotal} onChange={e => setTokensTotal(e.target.value)} className={inputCls} />
            <p className="font-mono text-[9px] text-ash mt-1">Used so far: {row.tokensUsed}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} disabled={saving}
            className="flex-1 border border-hairline text-ash hover:text-bone py-3 rounded-md font-mono text-xs uppercase font-bold tracking-wider disabled:opacity-40">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-heat text-black py-3 rounded-md font-mono text-xs uppercase font-bold tracking-wider hover:opacity-90 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
