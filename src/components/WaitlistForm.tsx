import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

interface WaitlistFormProps {
  plan: 'basic' | 'pro';
  onClose: () => void;
  onReadyForPayment?: (data: { owner_name: string; gym_name: string; phone: string }) => void;
}

function validatePhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

export const WaitlistForm = ({ plan, onClose, onReadyForPayment }: WaitlistFormProps) => {
  const [form, setForm] = useState({ owner_name: '', gym_name: '', city: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.owner_name.trim() || !form.gym_name.trim() || !form.phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!validatePhone(form.phone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: sbError } = await supabase.from('waitlist').insert({
      owner_name: form.owner_name.trim(),
      gym_name: form.gym_name.trim(),
      city: form.city.trim() || null,
      phone: form.phone.trim(),
      plan_interest: plan,
    });

    setLoading(false);

    if (sbError) {
      setError('Something went wrong — please try again.');
      return;
    }

    trackEvent('waitlist_submit', { plan });

    if (plan === 'basic' && onReadyForPayment) {
      onReadyForPayment({ owner_name: form.owner_name, gym_name: form.gym_name, phone: form.phone });
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Join waitlist">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 bg-[#141414] border-2 border-white/10 w-full max-w-md p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-brand-orange flex items-center justify-center mx-auto mb-6">
              <Check className="w-6 h-6 text-black" strokeWidth={3} aria-hidden="true" />
            </div>
            <div className="font-archivo text-4xl text-brand-orange uppercase mb-4">YOU'RE IN!</div>
            <p className="font-sans text-white/70 text-base leading-relaxed">
              You're on the list! We'll WhatsApp you when your gym is ready to go live.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-archivo text-3xl text-white uppercase mb-1">
              {plan === 'pro' ? 'START FREE TRIAL' : 'GET STARTED'}
            </h2>
            <p className="font-mono text-[10px] text-brand-orange uppercase font-bold mb-8">
              {plan === 'pro' ? '7 DAYS FREE — NO CARD NEEDED' : 'BASIC PLAN — ₹999/MONTH'}
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {[
                { id: 'wl_name',     field: 'owner_name', label: 'Your Name *',         placeholder: 'Rajesh Kumar',       type: 'text' },
                { id: 'wl_gym',      field: 'gym_name',   label: 'Gym Name *',           placeholder: 'Iron Beast Fitness', type: 'text' },
                { id: 'wl_city',     field: 'city',       label: 'City',                 placeholder: 'Mumbai',             type: 'text' },
                { id: 'wl_phone',    field: 'phone',      label: 'WhatsApp Number *',    placeholder: '9876543210',         type: 'tel'  },
              ].map(({ id, field, label, placeholder, type }) => (
                <div key={field}>
                  <label htmlFor={id} className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
                    {label}
                  </label>
                  <input
                    id={id}
                    type={type}
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    maxLength={field === 'phone' ? 10 : undefined}
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
                  />
                </div>
              ))}

              {error && (
                <p role="alert" className="font-mono text-[10px] text-red-400 uppercase font-bold">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-orange text-black py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
              >
                {loading
                  ? 'PLEASE WAIT...'
                  : plan === 'pro'
                  ? 'START FREE TRIAL →'
                  : 'PROCEED TO PAYMENT →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
