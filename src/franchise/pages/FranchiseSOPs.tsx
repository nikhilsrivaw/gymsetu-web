import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Edit3, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface SOP {
  id: string;
  title: string;
  content: string;
  category: string | null;
  is_required: boolean;
  created_at: string;
  submissions_count?: number;
}

export const FranchiseSOPs = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [brandId, setBrandId] = useState<string | null>(null);
  const [sops, setSops] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [editing, setEditing] = useState<string | null>(null); // SOP id or 'new'
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formRequired, setFormRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = 'SOPs | GymSetu Franchise'; }, []);

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
      await loadSOPs(brand.id);
      setLoading(false);
    })();
  }, [authLoading, session, navigate]);

  const loadSOPs = async (bId: string) => {
    const { data } = await supabase
      .from('franchise_sops')
      .select('id, title, content, category, is_required, created_at')
      .eq('brand_id', bId)
      .order('created_at', { ascending: false });
    setSops(data ?? []);
  };

  const startNew = () => {
    setEditing('new');
    setFormTitle('');
    setFormContent('');
    setFormCategory('');
    setFormRequired(false);
  };

  const startEdit = (sop: SOP) => {
    setEditing(sop.id);
    setFormTitle(sop.title);
    setFormContent(sop.content);
    setFormCategory(sop.category ?? '');
    setFormRequired(sop.is_required);
  };

  const cancelEdit = () => setEditing(null);

  const handleSave = async () => {
    if (!brandId || !formTitle.trim() || !formContent.trim()) {
      toast('Title and content are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing === 'new') {
        const { error } = await supabase.from('franchise_sops').insert({
          brand_id: brandId,
          title: formTitle.trim(),
          content: formContent.trim(),
          category: formCategory.trim() || null,
          is_required: formRequired,
        });
        if (error) throw error;
        toast('SOP created.', 'success');
      } else {
        const { error } = await supabase.from('franchise_sops')
          .update({
            title: formTitle.trim(),
            content: formContent.trim(),
            category: formCategory.trim() || null,
            is_required: formRequired,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editing);
        if (error) throw error;
        toast('SOP updated.', 'success');
      }
      setEditing(null);
      await loadSOPs(brandId);
    } catch (err) {
      toast('Failed to save SOP.', 'error');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteSOP = async (id: string) => {
    const { error } = await supabase.from('franchise_sops').delete().eq('id', id);
    if (error) { toast('Failed to delete.', 'error'); return; }
    setSops((prev) => prev.filter((s) => s.id !== id));
    toast('SOP deleted.', 'info');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center">
        <div className="font-mono text-[10px] uppercase font-bold text-white/30 animate-pulse">LOADING...</div>
      </div>
    );
  }

  const inputCls = 'w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors';

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-archivo text-3xl text-white uppercase tracking-tighter">SOPS</h1>
          <p className="font-mono text-[10px] text-white/40 uppercase font-bold">
            STANDARD OPERATING PROCEDURES FOR YOUR FRANCHISEES
          </p>
        </div>
        {!editing && (
          <button onClick={startNew}
            className="inline-flex items-center gap-2 bg-brand-orange text-black px-6 py-3 font-archivo text-sm uppercase tracking-tighter hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            NEW SOP
          </button>
        )}
      </div>

      {/* Editor */}
      {editing && (
        <div className="border-2 border-brand-orange p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-archivo text-lg text-white uppercase tracking-tighter">
              {editing === 'new' ? 'CREATE SOP' : 'EDIT SOP'}
            </h3>
            <button onClick={cancelEdit} className="text-white/30 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">Title *</label>
              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., Opening Checklist" className={inputCls} />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">Content *</label>
              <textarea rows={8} value={formContent} onChange={(e) => setFormContent(e.target.value)}
                placeholder="Describe the standard operating procedure in detail..."
                className={`${inputCls} resize-none`} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
                  Category <span className="opacity-50">(optional)</span>
                </label>
                <input type="text" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Operations, Safety, Hygiene..." className={inputCls} />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">Required</label>
                <button type="button" onClick={() => setFormRequired(!formRequired)}
                  className={`flex items-center gap-3 px-4 py-3 border transition-all w-full ${
                    formRequired ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' : 'border-white/10 text-white/40'
                  }`}>
                  <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                    formRequired ? 'bg-brand-orange border-brand-orange' : 'border-white/20'
                  }`}>
                    {formRequired && <span className="text-black text-xs font-bold">✓</span>}
                  </div>
                  <span className="font-mono text-[10px] font-bold uppercase">MANDATORY FOR ALL FRANCHISEES</span>
                </button>
              </div>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="bg-brand-orange text-black px-6 py-3 font-archivo text-sm uppercase tracking-tighter hover:opacity-90 disabled:opacity-50">
              {saving ? 'SAVING...' : 'SAVE SOP'}
            </button>
          </div>
        </div>
      )}

      {/* SOP list */}
      {sops.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sops.map((sop) => (
            <div key={sop.id} className="border border-white/10 p-5 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-brand-orange flex-shrink-0" />
                    <h4 className="font-archivo text-lg text-white">{sop.title}</h4>
                    {sop.is_required && (
                      <span className="font-mono text-[8px] font-bold text-red-400 border border-red-400/30 px-1.5 py-0.5 uppercase">
                        REQUIRED
                      </span>
                    )}
                    {sop.category && (
                      <span className="font-mono text-[8px] font-bold text-white/20 border border-white/10 px-1.5 py-0.5 uppercase">
                        {sop.category}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-sm text-white/40 line-clamp-2">{sop.content}</p>
                  <p className="font-mono text-[9px] text-white/15 mt-2">
                    Created {new Date(sop.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(sop)}
                    className="p-2 border border-white/10 text-white/30 hover:border-brand-orange hover:text-brand-orange transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteSOP(sop.id)}
                    className="p-2 border border-white/10 text-white/30 hover:border-red-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-white/10 py-16 text-center">
          <FileText className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="font-mono text-[10px] text-white/20 uppercase font-bold">
            NO SOPS YET — CREATE YOUR FIRST STANDARD OPERATING PROCEDURE
          </p>
        </div>
      )}
    </div>
  );
};
