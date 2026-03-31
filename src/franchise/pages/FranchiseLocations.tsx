import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { LOCATION_STATUS_COLORS } from '../../lib/franchise-constants';

interface Location {
  id: string;
  name: string;
  city: string | null;
  status: string;
  joined_at: string;
  owner_id: string;
}

export const FranchiseLocations = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [brandId, setBrandId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = 'Locations | GymSetu Franchise'; }, []);

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
        .from('franchise_locations')
        .select('id, name, city, status, joined_at, owner_id')
        .eq('brand_id', brand.id)
        .order('joined_at', { ascending: false });

      setLocations(data ?? []);
      setLoading(false);
    })();
  }, [authLoading, session, navigate]);

  const updateStatus = async (locId: string, newStatus: string) => {
    await supabase.from('franchise_locations').update({ status: newStatus }).eq('id', locId);
    setLocations((prev) => prev.map((l) => l.id === locId ? { ...l, status: newStatus } : l));
  };

  const filtered = locations.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.name.toLowerCase().includes(q) || (l.city ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const statusCounts = locations.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center">
        <div className="font-mono text-[10px] uppercase font-bold text-white/30 animate-pulse">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-archivo text-3xl text-white uppercase tracking-tighter">LOCATIONS</h1>
          <p className="font-mono text-[10px] text-white/40 uppercase font-bold">
            {locations.length} TOTAL — {statusCounts['active'] || 0} ACTIVE
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or city..."
            className="w-full bg-black border border-white/10 text-white pl-10 pr-4 py-2.5 font-mono text-xs focus:outline-none focus:border-brand-orange transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'pending', 'suspended', 'terminated'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 font-mono text-[10px] font-bold uppercase transition-all ${
                statusFilter === s ? 'bg-brand-orange text-black' : 'border border-white/10 text-white/40 hover:border-white/20'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="border border-white/10 divide-y divide-white/5">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 font-mono text-[9px] font-bold text-white/30 uppercase">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">City</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-2">Actions</div>
          </div>

          {filtered.map((loc) => (
            <div key={loc.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 items-center">
              <div className="md:col-span-4 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                <span className="font-sans text-sm text-white">{loc.name}</span>
              </div>
              <div className="md:col-span-2 font-mono text-[10px] text-white/40">
                {loc.city || '—'}
              </div>
              <div className="md:col-span-2">
                <span className={`font-mono text-[9px] font-bold uppercase px-2 py-0.5 border inline-block ${
                  LOCATION_STATUS_COLORS[loc.status] || 'text-white/30 border-white/10'
                }`}>
                  {loc.status}
                </span>
              </div>
              <div className="md:col-span-2 font-mono text-[10px] text-white/30">
                {new Date(loc.joined_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div className="md:col-span-2 flex gap-2">
                {loc.status === 'pending' && (
                  <button onClick={() => updateStatus(loc.id, 'active')}
                    className="font-mono text-[9px] font-bold uppercase text-green-400 hover:underline">
                    ACTIVATE
                  </button>
                )}
                {loc.status === 'active' && (
                  <button onClick={() => updateStatus(loc.id, 'suspended')}
                    className="font-mono text-[9px] font-bold uppercase text-yellow-400 hover:underline">
                    SUSPEND
                  </button>
                )}
                {loc.status === 'suspended' && (
                  <button onClick={() => updateStatus(loc.id, 'active')}
                    className="font-mono text-[9px] font-bold uppercase text-green-400 hover:underline">
                    REACTIVATE
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-white/10 py-16 text-center">
          <MapPin className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="font-mono text-[10px] text-white/20 uppercase font-bold">
            {search || statusFilter !== 'all' ? 'NO MATCHING LOCATIONS' : 'NO LOCATIONS YET'}
          </p>
        </div>
      )}
    </div>
  );
};
