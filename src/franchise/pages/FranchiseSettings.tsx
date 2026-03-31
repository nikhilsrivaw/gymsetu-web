import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TERRITORY_MODELS, SUPPORT_LEVELS } from '../../lib/franchise-constants';

interface Brand {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  franchise_fee: number;
  royalty_percentage: number;
  territory_model: string;
  training_included: boolean;
  support_level: string;
  min_investment: number | null;
  max_locations: number;
}

export const FranchiseSettings = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [brand, setBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    franchise_fee: '',
    royalty_percentage: '',
    territory_model: 'exclusive',
    training_included: false,
    support_level: 'standard',
    min_investment: '',
    max_locations: '50',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = 'Settings | GymSetu Franchise'; }, []);

  useEffect(() => {
    if (authLoading || !session) return;
    (async () => {
      const { data } = await supabase
        .from('franchise_brands')
        .select('*')
        .eq('owner_id', session.user.id)
        .maybeSingle();
      if (!data) { navigate('/franchise/readiness', { replace: true }); return; }
      setBrand(data);
      setForm({
        name: data.name,
        description: data.description ?? '',
        franchise_fee: String(data.franchise_fee ?? ''),
        royalty_percentage: String(data.royalty_percentage ?? ''),
        territory_model: data.territory_model ?? 'exclusive',
        training_included: data.training_included ?? false,
        support_level: data.support_level ?? 'standard',
        min_investment: data.min_investment != null ? String(data.min_investment) : '',
        max_locations: String(data.max_locations ?? 50),
      });
      if (data.logo_url) setLogoPreview(data.logo_url);
      setLoading(false);
    })();
  }, [authLoading, session, navigate]);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast('Only JPG, PNG, or WEBP images.', 'error'); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('Image must be under 2MB.', 'error'); return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(brand?.logo_url ?? null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!session || !brand) return;
    if (!form.name.trim()) { toast('Brand name is required.', 'error'); return; }

    setSaving(true);
    try {
      let logoUrl = brand.logo_url;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `franchise/${session.user.id}/logo.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('gym-logos').upload(path, logoFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('gym-logos').getPublicUrl(path);
          logoUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('franchise_brands')
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', brand.id);

      if (error) throw error;
      toast('Settings saved.', 'success');
    } catch (err) {
      toast('Failed to save settings.', 'error');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center">
        <div className="font-mono text-[10px] uppercase font-bold text-white/30 animate-pulse">LOADING...</div>
      </div>
    );
  }

  const inputCls = 'w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors';
  const labelCls = 'font-mono text-[10px] uppercase font-bold text-white/40 block mb-1';

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-lg">
        <h1 className="font-archivo text-3xl text-white uppercase tracking-tighter mb-1">SETTINGS</h1>
        <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-8">
          EDIT YOUR FRANCHISE BRAND CONFIGURATION
        </p>

        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="fs_name" className={labelCls}>Brand Name *</label>
            <input id="fs_name" type="text" value={form.name} onChange={set('name')} className={inputCls} />
          </div>

          {/* Logo */}
          <div>
            <label className={labelCls}>Brand Logo</label>
            {logoPreview ? (
              <div className="relative inline-block">
                <img src={logoPreview} alt="Logo" className="w-24 h-24 object-cover border border-white/10" />
                <button type="button" onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-black border border-white/20 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                  aria-label="Remove logo">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-white/20 py-6 flex flex-col items-center gap-2 hover:border-brand-orange transition-colors">
                <Upload className="w-5 h-5 text-white/30" />
                <span className="font-mono text-[10px] text-white/30 uppercase font-bold">UPLOAD LOGO</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleLogoChange} className="hidden" />
          </div>

          <div>
            <label htmlFor="fs_desc" className={labelCls}>Description</label>
            <textarea id="fs_desc" rows={3} value={form.description} onChange={set('description')}
              className={`${inputCls} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fs_fee" className={labelCls}>Franchise Fee (INR)</label>
              <input id="fs_fee" type="number" min="0" value={form.franchise_fee} onChange={set('franchise_fee')} className={inputCls} />
            </div>
            <div>
              <label htmlFor="fs_roy" className={labelCls}>Royalty %</label>
              <input id="fs_roy" type="number" min="0" max="100" step="0.5" value={form.royalty_percentage}
                onChange={set('royalty_percentage')} className={inputCls} />
            </div>
          </div>

          <div>
            <label htmlFor="fs_territory" className={labelCls}>Territory Model</label>
            <select id="fs_territory" value={form.territory_model} onChange={set('territory_model')} className={inputCls}>
              {TERRITORY_MODELS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Training Included</label>
            <button type="button" onClick={() => setForm((f) => ({ ...f, training_included: !f.training_included }))}
              className={`flex items-center gap-3 px-4 py-3 border transition-all w-full ${
                form.training_included ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' : 'border-white/10 text-white/40'
              }`}>
              <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                form.training_included ? 'bg-brand-orange border-brand-orange' : 'border-white/20'
              }`}>
                {form.training_included && <span className="text-black text-xs font-bold">✓</span>}
              </div>
              <span className="font-mono text-[10px] font-bold uppercase">YES</span>
            </button>
          </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fs_invest" className={labelCls}>Min Investment (INR)</label>
              <input id="fs_invest" type="number" min="0" value={form.min_investment} onChange={set('min_investment')} className={inputCls} />
            </div>
            <div>
              <label htmlFor="fs_maxloc" className={labelCls}>Max Locations</label>
              <input id="fs_maxloc" type="number" min="1" value={form.max_locations} onChange={set('max_locations')} className={inputCls} />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-brand-orange text-black py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            {saving ? 'SAVING...' : 'SAVE SETTINGS'}
          </button>
        </div>
      </div>
    </div>
  );
};
