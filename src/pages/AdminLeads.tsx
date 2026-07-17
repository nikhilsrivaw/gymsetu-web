import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, X, Loader2, AlertCircle, Phone, MessageCircle,
  MapPin, CalendarClock, TrendingUp, Target, ThumbsDown, Trophy,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

// ── Vocabulary ───────────────────────────────────────────────────────────────
// These lists mirror the CHECK constraints in database/leads.sql. If you add an
// option here you MUST add it there too, or the insert fails at the database.

export type LeadStatus = 'new' | 'owner_absent' | 'visited' | 'interested' | 'demo_done' | 'trial' | 'won' | 'lost';
type Interest = 'hot' | 'warm' | 'cold' | 'none';

const STATUS: { id: LeadStatus; label: string; hint: string }[] = [
  { id: 'new',          label: 'New',           hint: 'Added to the list, not visited yet' },
  { id: 'owner_absent', label: 'Owner away',    hint: 'Visited but the owner wasn’t there — revisit, not a rejection' },
  { id: 'visited',      label: 'Visited',       hint: 'Spoke to the owner, no decision yet' },
  { id: 'interested',   label: 'Interested',    hint: 'Wants to know more' },
  { id: 'demo_done',    label: 'Demo done',     hint: 'Showed them the app' },
  { id: 'trial',        label: 'On trial',      hint: 'Using the free trial' },
  { id: 'won',          label: 'Won',           hint: 'Paying customer' },
  { id: 'lost',         label: 'Lost',          hint: 'Said no' },
];

const STATUS_STYLE: Record<LeadStatus, string> = {
  new:          'text-ash border-ash/30 bg-ash/10',
  owner_absent: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  visited:      'text-sky-400 border-sky-400/30 bg-sky-400/10',
  interested:   'text-amber border-amber/30 bg-amber/10',
  demo_done:    'text-amber border-amber/30 bg-amber/10',
  trial:        'text-violet-400 border-violet-400/30 bg-violet-400/10',
  won:          'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  lost:         'text-red-400 border-red-400/30 bg-red-400/10',
};

const INTEREST: { id: Interest; label: string; style: string }[] = [
  { id: 'hot',  label: '🔥 Hot',  style: 'text-red-400 border-red-400/30 bg-red-400/10' },
  { id: 'warm', label: '🙂 Warm', style: 'text-amber border-amber/30 bg-amber/10' },
  { id: 'cold', label: '😐 Cold', style: 'text-sky-400 border-sky-400/30 bg-sky-400/10' },
  { id: 'none', label: '🚫 Not interested', style: 'text-red-400 border-red-400/30 bg-red-400/10' },
];

const CURRENT_SYSTEM: { id: string; label: string }[] = [
  { id: 'register',       label: 'Paper register' },
  { id: 'excel',          label: 'Excel sheet' },
  { id: 'whatsapp',       label: 'WhatsApp only' },
  { id: 'competitor',     label: 'Competitor app' },
  { id: 'other_software', label: 'Other software' },
  { id: 'nothing',        label: 'Nothing at all' },
];

// Kept short on purpose — a long list means everything gets coded 'other' and
// you learn nothing. `notes` is where the nuance goes.
const OBJECTIONS: { id: string; label: string }[] = [
  { id: 'price_high',             label: 'Too expensive' },
  { id: 'happy_with_register',    label: 'Happy with paper register' },
  { id: 'uses_competitor',        label: 'Already uses another app' },
  { id: 'not_tech_savvy',         label: 'Not comfortable with tech' },
  { id: 'no_smartphone',          label: 'No smartphone' },
  { id: 'needs_partner_approval', label: 'Needs partner/family approval' },
  { id: 'gym_too_small',          label: 'Gym too small to need it' },
  { id: 'missing_feature',        label: 'Wants a feature we don’t have' },
  { id: 'no_time',                label: 'No time / brushed us off' },
  { id: 'other',                  label: 'Other (see notes)' },
];

const LIKED = [
  'WhatsApp reminders', 'Payment & dues tracking', 'Member management',
  'Reports & revenue', 'AI features', 'Attendance', 'Price', 'Looks easy to use',
];

export interface Lead {
  id: string;
  gym_name: string; owner_name: string | null; phone: string; alt_phone: string | null;
  area: string | null; city: string | null; maps_url: string | null;
  approx_members: number | null; current_system: string | null; competitor_name: string | null;
  status: LeadStatus; interest: Interest | null; liked: string[] | null; objection: string | null;
  visited_on: string | null; follow_up_on: string | null; notes: string | null; rep_name: string | null;
  created_at: string; updated_at: string;
}

const EYEBROW = 'font-mono text-[10px] uppercase tracking-[0.2em] font-bold';
const todayISO = () => {
  // Local date, not toISOString() — in IST that returns yesterday until 05:30.
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const blank = (): Partial<Lead> => ({
  gym_name: '', phone: '', status: 'new', liked: [], visited_on: todayISO(),
});

// ── Page ─────────────────────────────────────────────────────────────────────
export const AdminLeads = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all' | 'followup'>('all');
  const [editing, setEditing] = useState<Partial<Lead> | null>(null);

  const load = async () => {
    setLoading(true); setError('');
    const { data, error: e } = await supabase
      .from('leads').select('*')
      .order('follow_up_on', { ascending: true, nullsFirst: false })
      .order('updated_at', { ascending: false });
    if (e) setError(e.message); else setRows((data ?? []) as Lead[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const n = (f: (l: Lead) => boolean) => rows.filter(f).length;
    const today = todayISO();
    return {
      total:    rows.length,
      pipeline: n(l => ['interested', 'demo_done', 'trial'].includes(l.status)),
      won:      n(l => l.status === 'won'),
      lost:     n(l => l.status === 'lost'),
      due:      n(l => !!l.follow_up_on && l.follow_up_on <= today && !['won', 'lost'].includes(l.status)),
    };
  }, [rows]);

  // Why we lose — the reason this page exists. Counting only actual losses.
  const objectionCounts = useMemo(() => {
    const m = new Map<string, number>();
    rows.filter(l => l.status === 'lost' && l.objection)
        .forEach(l => m.set(l.objection!, (m.get(l.objection!) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = todayISO();
    return rows.filter(l => {
      if (statusFilter === 'followup') {
        if (!l.follow_up_on || l.follow_up_on > today || ['won', 'lost'].includes(l.status)) return false;
      } else if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (!q) return true;
      return [l.gym_name, l.owner_name, l.phone, l.city, l.area, l.rep_name]
        .some(v => (v ?? '').toLowerCase().includes(q));
    });
  }, [rows, search, statusFilter]);

  const save = async (draft: Partial<Lead>) => {
    if (!draft.gym_name?.trim()) { toast('Gym name is required.', 'error'); return; }
    if (!draft.phone?.trim())    { toast('Phone number is required.', 'error'); return; }

    const payload = {
      ...draft,
      gym_name: draft.gym_name.trim(),
      phone: draft.phone.trim(),
      approx_members: draft.approx_members ? Number(draft.approx_members) : null,
      // '' would violate the CHECK constraints; they accept NULL, not empty string.
      interest: draft.interest || null,
      objection: draft.objection || null,
      current_system: draft.current_system || null,
      visited_on: draft.visited_on || null,
      follow_up_on: draft.follow_up_on || null,
    };
    delete (payload as any).created_at;
    delete (payload as any).updated_at;

    const { error: e } = draft.id
      ? await supabase.from('leads').update(payload).eq('id', draft.id)
      : await supabase.from('leads').insert({ ...payload, created_by: (await supabase.auth.getUser()).data.user?.id });

    if (e) { toast(e.message, 'error'); return; }
    toast(draft.id ? 'Lead updated.' : 'Lead added.', 'success');
    setEditing(null); load();
  };

  const remove = async (id: string) => {
    const { error: e } = await supabase.from('leads').delete().eq('id', id);
    if (e) { toast(e.message, 'error'); return; }
    toast('Lead deleted.', 'success'); setEditing(null); load();
  };

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-24 text-ash">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="font-mono text-[11px] uppercase tracking-widest">Loading leads…</span>
    </div>
  );

  if (error) return (
    <div className="text-center py-24">
      <AlertCircle className="w-10 h-10 text-flame mx-auto mb-4" />
      <p className="font-display text-2xl text-bone uppercase mb-2">Couldn’t load leads</p>
      <p className="font-sans text-ash text-sm mb-6">{error}</p>
      <button onClick={load} className="bg-heat text-black px-6 py-3 font-mono text-xs uppercase font-bold tracking-wider rounded-md hover:opacity-90">Retry</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat icon={<Target className="w-4 h-4" />}       label="Total leads"  value={stats.total} />
        <Stat icon={<TrendingUp className="w-4 h-4" />}   label="In pipeline"  value={stats.pipeline} tone="text-amber" />
        <Stat icon={<Trophy className="w-4 h-4" />}       label="Won"          value={stats.won} tone="text-emerald-400" />
        <Stat icon={<ThumbsDown className="w-4 h-4" />}   label="Lost"         value={stats.lost} tone="text-red-400" />
        <Stat icon={<CalendarClock className="w-4 h-4" />} label="Follow-up due" value={stats.due} tone={stats.due ? 'text-flame' : 'text-ash'} />
      </div>

      {/* Why we lose — the whole point of coding objections */}
      {objectionCounts.length > 0 && (
        <div className="glass rounded-xl p-5">
          <p className={`${EYEBROW} text-ash mb-3`}>Why we’re losing ({stats.lost} lost)</p>
          <div className="flex flex-col gap-2">
            {objectionCounts.map(([id, count]) => {
              const pct = Math.round((count / stats.lost) * 100);
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="font-sans text-sm text-bone/80 w-56 shrink-0 truncate">
                    {OBJECTIONS.find(o => o.id === id)?.label ?? id}
                  </span>
                  <div className="flex-1 h-2 bg-bone/10 rounded-full overflow-hidden">
                    <div className="h-full bg-flame rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono text-[11px] text-ash w-14 text-right">{count} · {pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ash absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search gym, owner, phone, city, rep…"
            className="w-full bg-ink border border-hairline rounded-md pl-9 pr-3 py-2.5 font-sans text-sm text-bone placeholder:text-ash/60 focus:border-flame outline-none"
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          className="bg-ink border border-hairline rounded-md px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider text-bone focus:border-flame outline-none"
        >
          <option value="all">All statuses</option>
          <option value="followup">⏰ Follow-up due</option>
          {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button
          onClick={() => setEditing(blank())}
          className="flex items-center justify-center gap-2 bg-heat text-black px-5 py-2.5 rounded-md font-mono text-[11px] uppercase font-bold tracking-wider hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add lead
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 glass rounded-xl">
          <Target className="w-9 h-9 text-ash mx-auto mb-4" />
          <p className="font-display text-xl text-bone uppercase mb-2">
            {rows.length === 0 ? 'No leads yet' : 'Nothing matches'}
          </p>
          <p className="font-sans text-ash text-sm">
            {rows.length === 0 ? 'Add the first gym your team visits.' : 'Try a different search or filter.'}
          </p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-hairline">
                  {['Gym', 'Owner & phone', 'Area', 'Size', 'Status', 'Interest', 'Follow-up', 'Rep'].map(h => (
                    <th key={h} className={`${EYEBROW} text-ash px-4 py-3 whitespace-nowrap`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const overdue = !!l.follow_up_on && l.follow_up_on <= todayISO() && !['won', 'lost'].includes(l.status);
                  return (
                    <tr key={l.id}
                      onClick={() => setEditing(l)}
                      className="border-b border-hairline/50 last:border-0 hover:bg-bone/[0.03] cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-sans text-sm text-bone">{l.gym_name}</div>
                        {l.current_system && (
                          <div className="font-mono text-[10px] text-ash mt-0.5">
                            {CURRENT_SYSTEM.find(c => c.id === l.current_system)?.label}
                            {l.competitor_name ? ` · ${l.competitor_name}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-sans text-sm text-bone/80">{l.owner_name || '—'}</div>
                        <div className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                          <a href={`tel:${l.phone}`} className="text-ash hover:text-flame" title={`Call ${l.phone}`}><Phone className="w-3.5 h-3.5" /></a>
                          <a href={`https://wa.me/${l.phone.replace(/\D/g, '').replace(/^0+/, '').replace(/^(?!91)/, '91')}`}
                             target="_blank" rel="noopener noreferrer"
                             className="text-ash hover:text-emerald-400" title="WhatsApp"><MessageCircle className="w-3.5 h-3.5" /></a>
                          <span className="font-mono text-[11px] text-ash">{l.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-sans text-sm text-bone/80">{l.city || '—'}</div>
                        {l.area && <div className="font-mono text-[10px] text-ash mt-0.5">{l.area}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-ash whitespace-nowrap">
                        {l.approx_members ? `${l.approx_members} mem` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded border font-mono text-[9px] uppercase font-bold tracking-wider whitespace-nowrap ${STATUS_STYLE[l.status]}`}>
                          {STATUS.find(s => s.id === l.status)?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-sans text-xs whitespace-nowrap">
                        {l.interest ? INTEREST.find(i => i.id === l.interest)?.label : <span className="text-ash">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {l.follow_up_on
                          ? <span className={`font-mono text-[11px] ${overdue ? 'text-flame font-bold' : 'text-ash'}`}>
                              {overdue ? '⏰ ' : ''}{l.follow_up_on}
                            </span>
                          : <span className="text-ash font-mono text-[11px]">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-ash whitespace-nowrap">{l.rep_name || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-hairline">
            <span className="font-mono text-[10px] text-ash uppercase tracking-wider">
              Showing {filtered.length} of {rows.length} · click a row to edit
            </span>
          </div>
        </div>
      )}

      {editing && <LeadDrawer draft={editing} onClose={() => setEditing(null)} onSave={save} onDelete={remove} />}
    </div>
  );
};

// ── Stat card ────────────────────────────────────────────────────────────────
const Stat = ({ icon, label, value, tone = 'text-bone' }: { icon: React.ReactNode; label: string; value: number; tone?: string }) => (
  <div className="glass rounded-xl p-4">
    <div className={`flex items-center gap-2 ${tone} mb-2`}>{icon}<span className={`${EYEBROW} text-ash`}>{label}</span></div>
    <div className={`font-display text-3xl ${tone}`}>{value}</div>
  </div>
);

// ── Add / edit drawer ────────────────────────────────────────────────────────
const LeadDrawer = ({ draft, onClose, onSave, onDelete }: {
  draft: Partial<Lead>;
  onClose: () => void;
  onSave: (d: Partial<Lead>) => void;
  onDelete: (id: string) => void;
}) => {
  const [d, setD] = useState<Partial<Lead>>(draft);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k: keyof Lead, v: any) => setD(p => ({ ...p, [k]: v }));

  const toggleLiked = (item: string) => {
    const cur = d.liked ?? [];
    set('liked', cur.includes(item) ? cur.filter(x => x !== item) : [...cur, item]);
  };

  const submit = async () => { setSaving(true); await onSave(d); setSaving(false); };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-ink border-l border-hairline h-full overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-ink border-b border-hairline px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className={`${EYEBROW} text-flame`}>{d.id ? 'Edit lead' : 'New lead'}</p>
            <h2 className="font-display text-2xl text-bone uppercase leading-none mt-1">
              {d.gym_name || 'Untitled gym'}
            </h2>
          </div>
          <button onClick={onClose} className="text-ash hover:text-bone"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-6 flex flex-col gap-6">
          <Group title="The gym">
            <Field label="Gym name *" value={d.gym_name ?? ''} onChange={v => set('gym_name', v)} placeholder="Iron Paradise Gym" />
            <Row>
              <Field label="Owner name" value={d.owner_name ?? ''} onChange={v => set('owner_name', v)} placeholder="Ramesh Kumar" />
              <Field label="Phone *" value={d.phone ?? ''} onChange={v => set('phone', v)} placeholder="9876543210" />
            </Row>
            <Row>
              <Field label="Area / landmark" value={d.area ?? ''} onChange={v => set('area', v)} placeholder="Shivpuri Colony" />
              <Field label="City" value={d.city ?? ''} onChange={v => set('city', v)} placeholder="Gorakhpur" />
            </Row>
          </Group>

          <Group title="Size & what they use now" hint="Members decides which plan to pitch: ≤200 Pro · 200–500 Pro Plus · 500+ Pro Max">
            <Row>
              <Field label="Approx. members" type="number" value={d.approx_members ?? ''} onChange={v => set('approx_members', v)} placeholder="150" />
              <Select label="Currently uses" value={d.current_system ?? ''} onChange={v => set('current_system', v)}
                options={[{ id: '', label: '—' }, ...CURRENT_SYSTEM]} />
            </Row>
            {d.current_system === 'competitor' && (
              <Field label="Which app?" value={d.competitor_name ?? ''} onChange={v => set('competitor_name', v)} placeholder="Name of the competitor" />
            )}
          </Group>

          <Group title="How did it go?">
            <Select label="Status" value={d.status ?? 'new'} onChange={v => set('status', v)}
              options={STATUS.map(s => ({ id: s.id, label: s.label }))}
              hint={STATUS.find(s => s.id === d.status)?.hint} />
            <div>
              <label className={`${EYEBROW} text-ash block mb-2`}>Interest level</label>
              <div className="flex flex-wrap gap-2">
                {INTEREST.map(i => (
                  <button key={i.id} type="button" onClick={() => set('interest', d.interest === i.id ? null : i.id)}
                    className={`px-3 py-1.5 rounded-md border font-sans text-xs transition-colors ${
                      d.interest === i.id ? i.style : 'text-ash border-hairline hover:border-ash'}`}>
                    {i.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={`${EYEBROW} text-ash block mb-2`}>What did they like?</label>
              <div className="flex flex-wrap gap-2">
                {LIKED.map(item => (
                  <button key={item} type="button" onClick={() => toggleLiked(item)}
                    className={`px-3 py-1.5 rounded-md border font-sans text-xs transition-colors ${
                      (d.liked ?? []).includes(item)
                        ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
                        : 'text-ash border-hairline hover:border-ash'}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <Select label="Main objection" value={d.objection ?? ''} onChange={v => set('objection', v)}
              options={[{ id: '', label: '— none —' }, ...OBJECTIONS]}
              hint="Pick the single biggest reason. This is what the “why we’re losing” chart counts." />
          </Group>

          <Group title="Notes & next step">
            <div>
              <label className={`${EYEBROW} text-ash block mb-2`}>Summary of the visit</label>
              <textarea
                value={d.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={5}
                placeholder="What was said, who you spoke to, what they asked for, what to do next time…"
                className="w-full bg-ink border border-hairline rounded-md px-3 py-2.5 font-sans text-sm text-bone placeholder:text-ash/60 focus:border-flame outline-none resize-y"
              />
            </div>
            <Row>
              <Field label="Visited on" type="date" value={d.visited_on ?? ''} onChange={v => set('visited_on', v)} />
              <Field label="Follow up on" type="date" value={d.follow_up_on ?? ''} onChange={v => set('follow_up_on', v)} />
            </Row>
            <Field label="Rep / marketer" value={d.rep_name ?? ''} onChange={v => set('rep_name', v)} placeholder="Who visited" />
          </Group>
        </div>

        <div className="sticky bottom-0 bg-ink border-t border-hairline px-6 py-4 flex items-center gap-3">
          <button onClick={submit} disabled={saving}
            className="flex-1 bg-heat text-black py-3 rounded-md font-mono text-[11px] uppercase font-bold tracking-wider hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {d.id ? 'Save changes' : 'Add lead'}
          </button>
          {d.id && (
            confirmDelete ? (
              <button onClick={() => onDelete(d.id!)}
                className="px-4 py-3 rounded-md border border-red-400/40 text-red-400 font-mono text-[11px] uppercase font-bold tracking-wider hover:bg-red-400/10">
                Really delete?
              </button>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="px-4 py-3 rounded-md border border-hairline text-ash font-mono text-[11px] uppercase font-bold tracking-wider hover:text-red-400 hover:border-red-400/40">
                Delete
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

// ── Small form primitives ────────────────────────────────────────────────────
const Group = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-4">
    <div className="border-b border-hairline pb-2">
      <h3 className="font-display text-lg text-bone uppercase">{title}</h3>
      {hint && <p className="font-sans text-[11px] text-ash mt-1">{hint}</p>}
    </div>
    {children}
  </div>
);

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
);

const Field = ({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string;
}) => (
  <div>
    <label className={`${EYEBROW} text-ash block mb-2`}>{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-ink border border-hairline rounded-md px-3 py-2.5 font-sans text-sm text-bone placeholder:text-ash/60 focus:border-flame outline-none"
    />
  </div>
);

const Select = ({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { id: string; label: string }[]; hint?: string;
}) => (
  <div>
    <label className={`${EYEBROW} text-ash block mb-2`}>{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-ink border border-hairline rounded-md px-3 py-2.5 font-sans text-sm text-bone focus:border-flame outline-none"
    >
      {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
    {hint && <p className="font-sans text-[11px] text-ash mt-1.5">{hint}</p>}
  </div>
);
