import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { READINESS_ITEMS, type ReadinessKey } from '../../lib/franchise-constants';

type ChecklistState = Record<ReadinessKey, boolean>;

const defaultState: ChecklistState = Object.fromEntries(
  READINESS_ITEMS.map((item) => [item.key, false])
) as ChecklistState;

export const FranchiseReadiness = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [checks, setChecks] = useState<ChecklistState>(defaultState);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { document.title = 'Franchise Readiness | GymSetu'; }, []);

  // Load existing readiness state
  useEffect(() => {
    if (authLoading) return;
    if (!session) { navigate('/login', { replace: true }); return; }
    (async () => {
      try {
        const { data, error } = await supabase
          .from('franchise_readiness')
          .select('*')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        // If table doesn't exist yet, just show fresh checklist
        if (error) {
          console.warn('franchise_readiness table not found — showing fresh checklist:', error.message);
          setLoaded(true);
          return;
        }

        if (data) {
          const loaded: Partial<ChecklistState> = {};
          for (const item of READINESS_ITEMS) {
            loaded[item.key] = !!data[item.key];
          }
          setChecks((prev) => ({ ...prev, ...loaded }));
          if (data.completed) {
            navigate('/franchise/setup', { replace: true });
            return;
          }
        }
      } catch {
        // Network or unknown error — still show checklist
      }
      setLoaded(true);
    })();
  }, [authLoading, session, navigate]);

  const toggle = (key: ReadinessKey) =>
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));

  const completedCount = Object.values(checks).filter(Boolean).length;
  const allDone = completedCount === READINESS_ITEMS.length;

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const row: Record<string, unknown> = {
        owner_id: session.user.id,
        completed: allDone,
        updated_at: new Date().toISOString(),
      };
      for (const item of READINESS_ITEMS) {
        row[item.key] = checks[item.key];
      }

      const { error } = await supabase
        .from('franchise_readiness')
        .upsert(row, { onConflict: 'owner_id' });

      if (error) {
        // Table doesn't exist yet — still let user proceed if all done
        console.warn('Could not save readiness (table may not exist):', error.message);
        if (allDone) {
          navigate('/franchise/setup');
          return;
        }
        toast('Run the franchise SQL migration in Supabase to save progress.', 'error');
        return;
      }

      if (allDone) {
        toast('Readiness complete! Let\u2019s set up your franchise.', 'success');
        navigate('/franchise/setup');
      } else {
        toast('Progress saved.', 'success');
      }
    } catch (err) {
      toast('Failed to save progress.', 'error');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !loaded) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center">
        <div className="font-mono text-[10px] uppercase font-bold text-white/30 animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  return (
    <main className="bg-near-black min-h-screen px-4 pt-24 pb-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="font-mono text-[10px] text-brand-orange uppercase font-bold mb-2 tracking-widest">
          FRANCHISE READINESS
        </div>
        <h1 className="font-archivo text-4xl md:text-5xl text-white uppercase mb-2 leading-none tracking-tighter">
          ARE YOU<br />
          <span className="text-brand-orange">READY?</span>
        </h1>
        <p className="font-sans text-white/40 text-sm mb-2 leading-relaxed">
          Complete all 9 items to proceed to franchise setup.
          This isn't a test — it's a self-assessment to help you think through the key pillars of a successful franchise.
        </p>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] font-bold text-white/40 uppercase">
              {completedCount} / {READINESS_ITEMS.length} COMPLETE
            </span>
            <span className="font-mono text-[10px] font-bold text-brand-orange uppercase">
              {Math.round((completedCount / READINESS_ITEMS.length) * 100)}%
            </span>
          </div>
          <div className="h-1 bg-white/10 w-full">
            <div
              className="h-1 bg-brand-orange transition-all duration-500"
              style={{ width: `${(completedCount / READINESS_ITEMS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="flex flex-col gap-3 mb-8">
          {READINESS_ITEMS.map((item, i) => {
            const checked = checks[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggle(item.key)}
                className={`w-full text-left border-2 p-4 md:p-5 transition-all ${
                  checked
                    ? 'border-brand-orange bg-brand-orange/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 flex-shrink-0 border-2 flex items-center justify-center mt-0.5 transition-all ${
                      checked
                        ? 'bg-brand-orange border-brand-orange'
                        : 'border-white/20'
                    }`}
                  >
                    {checked && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold text-white/20">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className={`font-archivo text-lg uppercase tracking-tighter ${
                        checked ? 'text-brand-orange' : 'text-white'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    <p className="font-sans text-sm text-white/40 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 py-4 font-archivo text-xl uppercase tracking-tighter transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 ${
              allDone
                ? 'bg-brand-orange text-black hover:opacity-90'
                : 'bg-white/10 text-white/50'
            }`}
          >
            {saving ? 'SAVING...' : allDone ? (
              <>PROCEED TO SETUP <ArrowRight className="w-5 h-5" /></>
            ) : 'SAVE PROGRESS'}
          </button>
        </div>

        {!allDone && (
          <p className="font-mono text-[10px] text-white/20 uppercase font-bold mt-4 text-center">
            COMPLETE ALL 9 ITEMS TO UNLOCK FRANCHISE SETUP
          </p>
        )}
      </div>
    </main>
  );
};
