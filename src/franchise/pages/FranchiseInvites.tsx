import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Copy, Check, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface Invite {
  id: string;
  token: string;
  email: string | null;
  city: string | null;
  status: string;
  expires_at: string;
  created_at: string;
}

export const FranchiseInvites = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [brandId, setBrandId] = useState<string | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New invite form
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => { document.title = 'Invites | GymSetu Franchise'; }, []);

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
      await loadInvites(brand.id);
      setLoading(false);
    })();
  }, [authLoading, session, navigate]);

  const loadInvites = async (bId: string) => {
    const { data } = await supabase
      .from('franchise_invites')
      .select('id, token, email, city, status, expires_at, created_at')
      .eq('brand_id', bId)
      .order('created_at', { ascending: false });
    setInvites(data ?? []);
  };

  const createInvite = async () => {
    if (!brandId) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('franchise_invites').insert({
        brand_id: brandId,
        email: email.trim() || null,
        city: city.trim() || null,
      });
      if (error) throw error;
      toast('Invite created!', 'success');
      setEmail('');
      setCity('');
      setShowForm(false);
      await loadInvites(brandId);
    } catch (err) {
      toast('Failed to create invite.', 'error');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const revokeInvite = async (id: string) => {
    await supabase.from('franchise_invites').update({ status: 'revoked' }).eq('id', id);
    setInvites((prev) => prev.map((i) => i.id === id ? { ...i, status: 'revoked' } : i));
    toast('Invite revoked.', 'info');
  };

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/accept-invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'pending': return 'text-yellow-400 border-yellow-400/30';
      case 'accepted': return 'text-green-400 border-green-400/30';
      case 'expired': return 'text-white/30 border-white/10';
      case 'revoked': return 'text-red-400 border-red-400/30';
      default: return 'text-white/30 border-white/10';
    }
  };

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
          <h1 className="font-archivo text-3xl text-white uppercase tracking-tighter">INVITES</h1>
          <p className="font-mono text-[10px] text-white/40 uppercase font-bold">
            GENERATE & SHARE INVITE LINKS — NO EMAIL NEEDED
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-brand-orange text-black px-6 py-3 font-archivo text-sm uppercase tracking-tighter hover:opacity-90 transition-opacity"
        >
          <Send className="w-4 h-4" />
          NEW INVITE
        </button>
      </div>

      {/* Create invite form */}
      {showForm && (
        <div className="border-2 border-brand-orange p-6 mb-8">
          <h3 className="font-archivo text-lg text-white uppercase mb-4 tracking-tighter">
            CREATE INVITE LINK
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
                Email <span className="opacity-50">(optional — for your reference)</span>
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="franchisee@email.com"
                className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
                City <span className="opacity-50">(optional)</span>
              </label>
              <input
                type="text" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={createInvite}
              disabled={creating}
              className="bg-brand-orange text-black px-6 py-2 font-mono text-[10px] font-bold uppercase hover:opacity-90 disabled:opacity-50"
            >
              {creating ? 'CREATING...' : 'GENERATE LINK'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border border-white/20 text-white/40 px-6 py-2 font-mono text-[10px] font-bold uppercase hover:text-white"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Invites list */}
      {invites.length > 0 ? (
        <div className="border border-white/10 divide-y divide-white/5">
          {invites.map((inv) => {
            const expired = new Date(inv.expires_at) < new Date();
            const displayStatus = inv.status === 'pending' && expired ? 'expired' : inv.status;
            return (
              <div key={inv.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono text-[9px] font-bold uppercase px-2 py-0.5 border ${statusColor(displayStatus)}`}>
                      {displayStatus}
                    </span>
                    {inv.email && (
                      <span className="font-mono text-[10px] text-white/40 truncate">{inv.email}</span>
                    )}
                    {inv.city && (
                      <span className="font-mono text-[10px] text-white/20">{inv.city}</span>
                    )}
                  </div>
                  <p className="font-mono text-[9px] text-white/20">
                    Created {new Date(inv.created_at).toLocaleDateString('en-IN')} — Expires {new Date(inv.expires_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {displayStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => copyLink(inv.token, inv.id)}
                        className="inline-flex items-center gap-1.5 border border-white/20 text-white px-3 py-1.5 font-mono text-[10px] font-bold uppercase hover:border-brand-orange hover:text-brand-orange transition-colors"
                      >
                        {copiedId === inv.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedId === inv.id ? 'COPIED!' : 'COPY LINK'}
                      </button>
                      <button
                        onClick={() => revokeInvite(inv.id)}
                        className="inline-flex items-center gap-1.5 border border-white/10 text-white/30 px-3 py-1.5 font-mono text-[10px] font-bold uppercase hover:border-red-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        REVOKE
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-white/10 py-16 text-center">
          <Send className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="font-mono text-[10px] text-white/20 uppercase font-bold">
            NO INVITES YET — CREATE YOUR FIRST ONE
          </p>
        </div>
      )}
    </div>
  );
};
