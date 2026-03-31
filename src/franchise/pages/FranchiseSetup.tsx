import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TERRITORY_MODELS, SUPPORT_LEVELS } from '../../lib/franchise-constants';

export const FranchiseSetup = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    franchise_fee: '',
    royalty_percentage: '5',
    territory_model: 'exclusive',
    training_included: false,
    support_level: 'standard',
    min_investment: '',
    max_locations: '50',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => { document.title = 'Franchise Setup | GymSetu'; }, []);

  // Guard: check readiness + existing brand
  useEffect(() => {
    if (authLoading) return;
    if (!session) { navigate('/login', { replace: true }); return; }
    (async () => {
      try {
        // Check if brand already exists
        const { data: brand, error: brandErr } = await supabase
          .from('franchise_brands')
          .select('id')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        if (!brandErr && brand) {
          navigate('/franchise/dashboard', { replace: true });
          return;
        }

        // Check readiness (skip check if table doesn't exist yet)
        const { data: readiness, error: readinessErr } = await supabase
          .from('franchise_readiness')
          .select('completed')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        if (!readinessErr && !readiness?.completed) {
          navigate('/franchise/readiness', { replace: true });
          return;
        }
      } catch {
        // Tables may not exist yet — still allow access
      }
      setChecking(false);
    })();
  }, [authLoading, session, navigate]);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast('Only JPG, PNG, or WEBP images are allowed.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('Image must be under 2MB.', 'error');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    if (!form.name.trim()) { toast('Brand name is required.', 'error'); return; }

    setLoading(true);
    try {
      const userId = session.user.id;

      // Upload logo
      let logoUrl: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `franchise/${userId}/logo.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('gym-logos')
          .upload(path, logoFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('gym-logos').getPublicUrl(path);
          logoUrl = urlData.publicUrl;
        }
      }

      // Create brand
      const { error: brandErr } = await supabase.from('franchise_brands').insert({
        owner_id: userId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        logo_url: logoUrl,
        franchise_fee: parseFloat(form.franchise_fee) || 0,
        royalty_percentage: parseFloat(form.royalty_percentage) || 5,
        territory_model: form.territory_model,
        training_included: form.training_included,
        support_level: form.support_level,
        min_investment: parseFloat(form.min_investment) || null,
        max_locations: parseInt(form.max_locations) || 50,
      });

      if (brandErr) throw new Error(brandErr.message);

      toast('Franchise brand created!', 'success');
      navigate('/franchise/dashboard', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Setup failed.';
      toast(msg, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center">
        <div className="font-mono text-[10px] uppercase font-bold text-white/30 animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  const inputCls = 'w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors';
  const labelCls = 'font-mono text-[10px] uppercase font-bold text-white/40 block mb-1';

  return (
    <main className="bg-near-black min-h-screen px-4 pt-24 pb-16">
      <div className="max-w-lg mx-auto">
        <div className="font-mono text-[10px] text-brand-orange uppercase font-bold mb-2 tracking-widest">
          FRANCHISE SETUP
        </div>
        <h1 className="font-archivo text-4xl md:text-5xl text-white uppercase mb-2 leading-none tracking-tighter">
          CONFIGURE YOUR<br />
          <span className="text-brand-orange">BRAND.</span>
        </h1>
        <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-10">
          SET YOUR FRANCHISE PARAMETERS
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          {/* Brand Name */}
          <div>
            <label htmlFor="f_name" className={labelCls}>Brand Name *</label>
            <input id="f_name" type="text" required value={form.name} onChange={set('name')}
              placeholder="Iron Beast Franchise" className={inputCls} />
          </div>

          {/* Logo */}
          <div>
            <label className={labelCls}>
              Brand Logo <span className="opacity-50">(optional)</span>
            </label>
            {logoPreview ? (
              <div className="relative inline-block">
                <img src={logoPreview} alt="Logo preview" className="w-24 h-24 object-cover border border-white/10" />
                <button type="button" onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-black border border-white/20 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                  aria-label="Remove logo">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-white/20 py-8 flex flex-col items-center gap-2 hover:border-brand-orange transition-colors">
                <Upload className="w-5 h-5 text-white/30" />
                <span className="font-mono text-[10px] text-white/30 uppercase font-bold">
                  CLICK TO UPLOAD — JPG, PNG OR WEBP, MAX 2MB
                </span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleLogoChange} className="hidden" aria-label="Upload brand logo" />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="f_desc" className={labelCls}>
              Description <span className="opacity-50">(optional)</span>
            </label>
            <textarea id="f_desc" rows={3} maxLength={500} value={form.description}
              onChange={set('description')} placeholder="What makes your franchise unique..."
              className={`${inputCls} resize-none`} />
          </div>

          {/* Franchise Fee */}
          <div>
            <label htmlFor="f_fee" className={labelCls}>Franchise Fee (INR)</label>
            <input id="f_fee" type="number" min="0" value={form.franchise_fee} onChange={set('franchise_fee')}
              placeholder="500000" className={inputCls} />
          </div>

          {/* Royalty % */}
          <div>
            <label htmlFor="f_royalty" className={labelCls}>Royalty Percentage (%)</label>
            <input id="f_royalty" type="number" min="0" max="100" step="0.5" value={form.royalty_percentage}
              onChange={set('royalty_percentage')} placeholder="5" className={inputCls} />
          </div>

          {/* Territory Model */}
          <div>
            <label htmlFor="f_territory" className={labelCls}>Territory Model</label>
            <select id="f_territory" value={form.territory_model} onChange={set('territory_model')}
              className={inputCls}>
              {TERRITORY_MODELS.map((t) => (
                <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
              ))}
            </select>
          </div>

          {/* Training */}
          <div>
            <label className={labelCls}>Training Included</label>
            <button type="button"
              onClick={() => setForm((f) => ({ ...f, training_included: !f.training_included }))}
              className={`flex items-center gap-3 px-4 py-3 border transition-all w-full ${
                form.training_included
                  ? 'border-brand-orange bg-brand-orange/5 text-brand-orange'
                  : 'border-white/10 text-white/40'
              }`}
            >
              <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                form.training_included ? 'bg-brand-orange border-brand-orange' : 'border-white/20'
              }`}>
                {form.training_included && <span className="text-black text-xs font-bold">✓</span>}
              </div>
              <span className="font-mono text-[10px] font-bold uppercase">
                YES, I PROVIDE TRAINING TO FRANCHISEES
              </span>
            </button>
          </div>

          {/* Support Level */}
          <div>
            <label className={labelCls}>Support Level</label>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORT_LEVELS.map((s) => (
                <button key={s.value} type="button"
                  onClick={() => setForm((f) => ({ ...f, support_level: s.value }))}
                  className={`px-3 py-3 font-mono text-[10px] font-bold uppercase transition-all border ${
                    form.support_level === s.value
                      ? 'bg-brand-orange text-black border-brand-orange'
                      : 'border-white/10 text-white/40 hover:border-white/20'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
            <p className="font-mono text-[10px] text-white/20 mt-1">
              {SUPPORT_LEVELS.find((s) => s.value === form.support_level)?.desc}
            </p>
          </div>

          {/* Min Investment */}
          <div>
            <label htmlFor="f_invest" className={labelCls}>
              Minimum Investment (INR) <span className="opacity-50">(optional)</span>
            </label>
            <input id="f_invest" type="number" min="0" value={form.min_investment} onChange={set('min_investment')}
              placeholder="1000000" className={inputCls} />
          </div>

          {/* Max Locations */}
          <div>
            <label htmlFor="f_maxloc" className={labelCls}>Max Franchise Locations</label>
            <input id="f_maxloc" type="number" min="1" max="500" value={form.max_locations}
              onChange={set('max_locations')} placeholder="50" className={inputCls} />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-brand-orange text-black py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'CREATING BRAND...' : 'LAUNCH FRANCHISE →'}
          </button>
        </form>
      </div>
    </main>
  );
};
