import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROYALTY_STATUS_COLORS } from '../../lib/franchise-constants';

interface Royalty {
  id: string;
  month_year: string;
  revenue_reported: number;
  royalty_percentage: number;
  amount_due: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  location: { name: string; city: string | null } | null;
}

export const FranchiseRoyalties = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [brandId, setBrandId] = useState<string | null>(null);

  useEffect(() => { document.title = 'Royalties | GymSetu Franchise'; }, []);

  useEffect(() => {
    if (authLoading || !session) return;
    (async () => {
      const { data: brand } = await supabase
        .from('franchise_brands')
        .select('id')
        .eq('owner_id', session.user.id)
        .maybeSingle();
      if (!brand) { navigate('/franchise/readiness', { replace: true }); return; }
      setBrandId(brand.id);

      const { data } = await supabase
        .from('franchise_royalties')
        .select('id, month_year, revenue_reported, royalty_percentage, amount_due, status, due_date, paid_at, location:franchise_locations(name, city)')
        .eq('brand_id', brand.id)
        .order('month_year', { ascending: false });

      setRoyalties((data ?? []).map((r: any) => ({
        ...r,
        location: Array.isArray(r.location) ? r.location[0] ?? null : r.location,
      })));
      setLoading(false);
    })();
  }, [authLoading, session, navigate]);

  const markPaid = async (id: string) => {
    const { error } = await supabase.from('franchise_royalties')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { toast('Failed to update.', 'error'); return; }
    setRoyalties((prev) => prev.map((r) => r.id === id ? { ...r, status: 'paid', paid_at: new Date().toISOString() } : r));
    toast('Marked as paid.', 'success');
  };

  const waive = async (id: string) => {
    const { error } = await supabase.from('franchise_royalties')
      .update({ status: 'waived' })
      .eq('id', id);
    if (error) { toast('Failed to update.', 'error'); return; }
    setRoyalties((prev) => prev.map((r) => r.id === id ? { ...r, status: 'waived' } : r));
    toast('Royalty waived.', 'info');
  };

  const filtered = statusFilter === 'all'
    ? royalties
    : royalties.filter((r) => r.status === statusFilter);

  const totalPending = royalties
    .filter((r) => r.status === 'pending' || r.status === 'overdue')
    .reduce((s, r) => s + r.amount_due, 0);
  const totalCollected = royalties
    .filter((r) => r.status === 'paid')
    .reduce((s, r) => s + r.amount_due, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center">
        <div className="font-mono text-[10px] uppercase font-bold text-white/30 animate-pulse">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="font-archivo text-3xl text-white uppercase tracking-tighter">ROYALTIES</h1>
        <p className="font-mono text-[10px] text-white/40 uppercase font-bold">
          TRACK ROYALTY INVOICES ACROSS ALL LOCATIONS
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <div className="border border-white/10 p-4">
          <p className="font-mono text-[9px] font-bold text-white/30 uppercase mb-1">PENDING</p>
          <p className="font-archivo text-2xl text-yellow-400">₹{totalPending.toLocaleString('en-IN')}</p>
        </div>
        <div className="border border-white/10 p-4">
          <p className="font-mono text-[9px] font-bold text-white/30 uppercase mb-1">COLLECTED</p>
          <p className="font-archivo text-2xl text-green-400">₹{totalCollected.toLocaleString('en-IN')}</p>
        </div>
        <div className="border border-white/10 p-4">
          <p className="font-mono text-[9px] font-bold text-white/30 uppercase mb-1">TOTAL INVOICES</p>
          <p className="font-archivo text-2xl text-white">{royalties.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'paid', 'overdue', 'waived'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 font-mono text-[10px] font-bold uppercase transition-all ${
              statusFilter === s ? 'bg-brand-orange text-black' : 'border border-white/10 text-white/40 hover:border-white/20'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="border border-white/10 divide-y divide-white/5">
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 font-mono text-[9px] font-bold text-white/30 uppercase">
            <div className="col-span-2">Month</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Revenue</div>
            <div className="col-span-1">Rate</div>
            <div className="col-span-2">Amount Due</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Actions</div>
          </div>

          {filtered.map((r) => (
            <div key={r.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 items-center">
              <div className="md:col-span-2 font-mono text-xs text-white">{r.month_year}</div>
              <div className="md:col-span-2 font-sans text-sm text-white/60">
                {r.location?.name ?? '—'}
                {r.location?.city && <span className="text-white/20 ml-1">({r.location.city})</span>}
              </div>
              <div className="md:col-span-2 font-mono text-xs text-white/40">
                ₹{r.revenue_reported.toLocaleString('en-IN')}
              </div>
              <div className="md:col-span-1 font-mono text-xs text-white/30">{r.royalty_percentage}%</div>
              <div className="md:col-span-2 font-archivo text-lg text-white">
                ₹{r.amount_due.toLocaleString('en-IN')}
              </div>
              <div className="md:col-span-1">
                <span className={`font-mono text-[9px] font-bold uppercase px-2 py-0.5 border inline-block ${
                  ROYALTY_STATUS_COLORS[r.status] || 'text-white/30 border-white/10'
                }`}>
                  {r.status}
                </span>
              </div>
              <div className="md:col-span-2 flex gap-2">
                {(r.status === 'pending' || r.status === 'overdue') && (
                  <>
                    <button onClick={() => markPaid(r.id)}
                      className="font-mono text-[9px] font-bold uppercase text-green-400 hover:underline">
                      MARK PAID
                    </button>
                    <button onClick={() => waive(r.id)}
                      className="font-mono text-[9px] font-bold uppercase text-white/30 hover:underline">
                      WAIVE
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-white/10 py-16 text-center">
          <Receipt className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="font-mono text-[10px] text-white/20 uppercase font-bold">
            {royalties.length === 0 ? 'NO ROYALTY INVOICES YET' : 'NO MATCHING INVOICES'}
          </p>
        </div>
      )}
    </div>
  );
};
