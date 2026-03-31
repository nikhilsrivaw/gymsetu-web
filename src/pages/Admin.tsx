import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface GymRow {
  id: string;
  gymName: string;
  ownerName: string;
  email: string;
  plan: 'basic' | 'pro';
  status: string;
  trialEndsAt: string | null;
  periodEnd: string;
  createdAt: string;
}

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  trial:     { label: 'TRIAL',     color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  active:    { label: 'ACTIVE',    color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  expired:   { label: 'EXPIRED',   color: 'text-red-400 bg-red-400/10 border-red-400/30' },
  cancelled: { label: 'CANCELLED', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function daysLeft(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function DaysLeftBadge({ iso }: { iso: string }) {
  const days = daysLeft(iso);
  if (days < 0) return <span className="font-mono text-[10px] text-red-400 font-bold">EXPIRED</span>;
  if (days <= 7) return <span className="font-mono text-[10px] text-yellow-400 font-bold">{days}d LEFT</span>;
  return <span className="font-mono text-[10px] text-white/40 font-bold">{days}d LEFT</span>;
}

export const Admin = () => {
  const [rows, setRows] = useState<GymRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { document.title = 'Admin | GymSetu'; }, []);

  const load = async () => {
    setLoading(true);
    setError(false);

    const { data, error: err } = await supabase
      .from('subscriptions')
      .select(`
        id,
        plan,
        status,
        trial_ends_at,
        current_period_end,
        created_at,
        gyms ( name ),
        profiles ( full_name, email )
      `)
      .order('created_at', { ascending: false });

    if (err || !data) {
      setError(true);
      setLoading(false);
      return;
    }

    const mapped: GymRow[] = data.map((row: any) => ({
      id: row.id,
      gymName: row.gyms?.name ?? '—',
      ownerName: row.profiles?.full_name ?? '—',
      email: row.profiles?.email ?? '—',
      plan: row.plan,
      status: row.status,
      trialEndsAt: row.trial_ends_at,
      periodEnd: row.current_period_end,
      createdAt: row.created_at,
    }));

    setRows(mapped);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter(r =>
    r.gymName.toLowerCase().includes(search.toLowerCase()) ||
    r.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  const total = rows.length;
  const activeCount = rows.filter(r => r.status === 'active' || r.status === 'trial').length;
  const proCount = rows.filter(r => r.plan === 'pro').length;
  const basicCount = rows.filter(r => r.plan === 'basic').length;

  return (
    <main className="bg-near-black min-h-screen px-4 pt-32 pb-16">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="font-mono text-[10px] text-brand-orange uppercase font-bold mb-1">INTERNAL</p>
            <h1 className="font-archivo text-4xl md:text-5xl text-white uppercase leading-none tracking-tighter">
              ADMIN PANEL
            </h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 border border-white/10 text-white/40 hover:text-white hover:border-white/30 px-4 py-2 transition-colors disabled:opacity-30"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-mono text-[10px] uppercase font-bold hidden sm:block">REFRESH</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'TOTAL GYMS',   value: total },
            { label: 'ACTIVE',       value: activeCount },
            { label: 'PRO PLAN',     value: proCount },
            { label: 'BASIC PLAN',   value: basicCount },
          ].map(stat => (
            <div key={stat.label} className="border border-white/10 p-5">
              <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-1">{stat.label}</p>
              <p className="font-archivo text-3xl text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by gym name, owner, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-24">
            <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-mono text-[10px] uppercase font-bold text-white/30 animate-pulse">LOADING...</p>
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <AlertCircle className="w-10 h-10 text-brand-orange mx-auto mb-4" />
            <p className="font-archivo text-2xl text-white uppercase mb-4">FAILED TO LOAD</p>
            <button onClick={load} className="bg-brand-orange text-black px-6 py-3 font-archivo text-lg uppercase tracking-tighter hover:opacity-90">
              RETRY
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-white/10">
            <p className="font-archivo text-2xl text-white/20 uppercase">NO GYMS FOUND</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block border border-white/10 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['GYM NAME', 'OWNER', 'EMAIL', 'PLAN', 'STATUS', 'ENDS ON', 'DAYS LEFT', 'JOINED'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-mono text-[10px] text-white/30 uppercase font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const statusInfo = STATUS_STYLE[row.status] ?? STATUS_STYLE.expired;
                    const endDate = row.status === 'trial' && row.trialEndsAt ? row.trialEndsAt : row.periodEnd;
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                      >
                        <td className="px-5 py-4 font-archivo text-base text-white">{row.gymName}</td>
                        <td className="px-5 py-4 font-sans text-sm text-white/70">{row.ownerName}</td>
                        <td className="px-5 py-4 font-mono text-[11px] text-white/40">{row.email}</td>
                        <td className="px-5 py-4">
                          <span className={`font-mono text-[10px] font-bold uppercase px-2 py-1 border ${
                            row.plan === 'pro'
                              ? 'text-brand-orange border-brand-orange/30 bg-brand-orange/10'
                              : 'text-white/60 border-white/20 bg-white/5'
                          }`}>
                            {row.plan.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`font-mono text-[10px] font-bold uppercase px-2 py-1 border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px] text-white/50">{formatDate(endDate)}</td>
                        <td className="px-5 py-4"><DaysLeftBadge iso={endDate} /></td>
                        <td className="px-5 py-4 font-mono text-[11px] text-white/30">{formatDate(row.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-3">
              {filtered.map(row => {
                const statusInfo = STATUS_STYLE[row.status] ?? STATUS_STYLE.expired;
                const endDate = row.status === 'trial' && row.trialEndsAt ? row.trialEndsAt : row.periodEnd;
                return (
                  <div key={row.id} className="border border-white/10 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-archivo text-lg text-white">{row.gymName}</p>
                        <p className="font-sans text-xs text-white/40">{row.ownerName} · {row.email}</p>
                      </div>
                      <span className={`font-mono text-[9px] font-bold uppercase px-2 py-1 border ${
                        row.plan === 'pro'
                          ? 'text-brand-orange border-brand-orange/30 bg-brand-orange/10'
                          : 'text-white/60 border-white/20 bg-white/5'
                      }`}>
                        {row.plan.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`font-mono text-[9px] font-bold uppercase px-2 py-1 border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className="font-mono text-[10px] text-white/40">ENDS {formatDate(endDate)}</span>
                      <DaysLeftBadge iso={endDate} />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="font-mono text-[10px] text-white/20 uppercase font-bold mt-6 text-right">
              SHOWING {filtered.length} OF {total} GYMS
            </p>
          </>
        )}
      </div>
    </main>
  );
};
