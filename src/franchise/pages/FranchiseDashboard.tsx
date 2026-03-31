import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Send, Receipt, TrendingUp, Users, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  royalty_percentage: number;
}

interface LocationRow {
  id: string;
  name: string;
  city: string | null;
  status: string;
  joined_at: string;
}

interface RevenueRow {
  month_year: string;
  total_revenue: number;
  member_count: number;
  new_members: number;
  location_id: string;
}

interface RoyaltyRow {
  status: string;
  amount_due: number;
}

export const FranchiseDashboard = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [royalties, setRoyalties] = useState<RoyaltyRow[]>([]);
  const [pendingInvites, setPendingInvites] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = 'Franchise Dashboard | GymSetu'; }, []);

  useEffect(() => {
    if (authLoading || !session) return;
    (async () => {
      // Get brand
      const { data: brandData } = await supabase
        .from('franchise_brands')
        .select('id, name, logo_url, royalty_percentage')
        .eq('owner_id', session.user.id)
        .maybeSingle();

      if (!brandData) {
        navigate('/franchise/readiness', { replace: true });
        return;
      }
      setBrand(brandData);

      // Parallel queries
      const [locRes, revRes, royRes, invRes] = await Promise.all([
        supabase.from('franchise_locations').select('id, name, city, status, joined_at')
          .eq('brand_id', brandData.id).order('joined_at', { ascending: false }),
        supabase.from('franchise_revenue').select('month_year, total_revenue, member_count, new_members, location_id')
          .eq('brand_id', brandData.id).order('month_year', { ascending: true }),
        supabase.from('franchise_royalties').select('status, amount_due')
          .eq('brand_id', brandData.id),
        supabase.from('franchise_invites').select('id', { count: 'exact', head: true })
          .eq('brand_id', brandData.id).eq('status', 'pending'),
      ]);

      setLocations(locRes.data ?? []);
      setRevenue(revRes.data ?? []);
      setRoyalties(royRes.data ?? []);
      setPendingInvites(invRes.count ?? 0);
      setLoading(false);
    })();
  }, [authLoading, session, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center">
        <div className="font-mono text-[10px] uppercase font-bold text-white/30 animate-pulse">
          LOADING DASHBOARD...
        </div>
      </div>
    );
  }

  if (!brand) return null;

  // Aggregate stats
  const activeLocations = locations.filter((l) => l.status === 'active').length;
  const totalRevenue = revenue.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
  const totalMembers = locations.length > 0
    ? Math.max(...revenue.map((r) => r.member_count || 0), 0)
    : 0;
  const pendingRoyalties = royalties
    .filter((r) => r.status === 'pending' || r.status === 'overdue')
    .reduce((sum, r) => sum + (r.amount_due || 0), 0);

  // Chart data: aggregate revenue by month
  const monthlyRevenue = revenue.reduce<Record<string, number>>((acc, r) => {
    acc[r.month_year] = (acc[r.month_year] || 0) + (r.total_revenue || 0);
    return acc;
  }, {});
  const revenueChartData = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, amount]) => ({ month, amount }));

  // Location growth: count by month joined
  const joinsByMonth = locations.reduce<Record<string, number>>((acc, l) => {
    const m = l.joined_at?.slice(0, 7);
    if (m) acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
  const growthChartData = Object.entries(joinsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, count]) => ({ month, count }));

  const stats = [
    { label: 'Active Locations', value: activeLocations, icon: MapPin, color: 'text-green-400' },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-brand-orange' },
    { label: 'Total Members', value: totalMembers, icon: Users, color: 'text-blue-400' },
    { label: 'Pending Royalties', value: `₹${pendingRoyalties.toLocaleString('en-IN')}`, icon: Receipt, color: 'text-yellow-400' },
    { label: 'Pending Invites', value: pendingInvites, icon: Send, color: 'text-purple-400' },
    { label: 'Total Locations', value: locations.length, icon: TrendingUp, color: 'text-white/60' },
  ];

  const tooltipStyle = {
    contentStyle: { background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Space Mono', fontSize: 10 },
    labelStyle: { color: 'rgba(255,255,255,0.4)' },
    itemStyle: { color: '#FF4D00' },
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {brand.logo_url && (
              <img src={brand.logo_url} alt="" className="w-10 h-10 object-cover border border-white/10" />
            )}
            <h1 className="font-archivo text-3xl md:text-4xl text-white uppercase tracking-tighter">
              {brand.name}
            </h1>
          </div>
          <p className="font-mono text-[10px] text-white/40 uppercase font-bold">
            FRANCHISE HQ DASHBOARD
          </p>
        </div>
        <Link
          to="/franchise/invites"
          className="inline-flex items-center gap-2 bg-brand-orange text-black px-6 py-3 font-archivo text-sm uppercase tracking-tighter hover:opacity-90 transition-opacity"
        >
          <Send className="w-4 h-4" />
          INVITE FRANCHISEE
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="border border-white/10 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${s.color}`} />
                <span className="font-mono text-[9px] font-bold text-white/30 uppercase">{s.label}</span>
              </div>
              <div className="font-archivo text-2xl md:text-3xl text-white">{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
        {/* Revenue chart */}
        <div className="border border-white/10 p-4 md:p-6">
          <h3 className="font-mono text-[10px] font-bold text-white/40 uppercase mb-4">
            REVENUE TREND (LAST 12 MONTHS)
          </h3>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Space Mono' }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Space Mono' }} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="amount" stroke="#FF4D00" fill="#FF4D00" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="font-mono text-[10px] text-white/20 uppercase">NO REVENUE DATA YET</p>
            </div>
          )}
        </div>

        {/* Growth chart */}
        <div className="border border-white/10 p-4 md:p-6">
          <h3 className="font-mono text-[10px] font-bold text-white/40 uppercase mb-4">
            LOCATION GROWTH
          </h3>
          {growthChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={growthChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Space Mono' }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Space Mono' }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#FF4D00" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="font-mono text-[10px] text-white/20 uppercase">NO LOCATIONS YET</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent locations */}
      <div className="border border-white/10 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-[10px] font-bold text-white/40 uppercase">
            RECENT LOCATIONS
          </h3>
          <Link to="/franchise/locations" className="font-mono text-[10px] font-bold text-brand-orange uppercase hover:underline">
            VIEW ALL →
          </Link>
        </div>
        {locations.length > 0 ? (
          <div className="divide-y divide-white/5">
            {locations.slice(0, 5).map((loc) => (
              <div key={loc.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-sans text-sm text-white">{loc.name}</span>
                  {loc.city && (
                    <span className="font-mono text-[10px] text-white/30 ml-2">{loc.city}</span>
                  )}
                </div>
                <span className={`font-mono text-[9px] font-bold uppercase px-2 py-0.5 border ${
                  loc.status === 'active' ? 'text-green-400 border-green-400/30' :
                  loc.status === 'pending' ? 'text-yellow-400 border-yellow-400/30' :
                  'text-white/30 border-white/10'
                }`}>
                  {loc.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[10px] text-white/20 uppercase py-8 text-center">
            NO LOCATIONS YET — INVITE YOUR FIRST FRANCHISEE
          </p>
        )}
      </div>
    </div>
  );
};
