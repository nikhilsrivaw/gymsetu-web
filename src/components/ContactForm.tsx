import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { authInput, authLabel } from './AuthShell';

export const ContactForm = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) {
      setError('Please enter your message.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: sbError } = await supabase.from('support_tickets').insert({
      name: form.name.trim() || null,
      email: form.email.trim() || null,
      message: form.message.trim(),
    });

    setLoading(false);

    if (sbError) {
      setError('Something went wrong — please try again or WhatsApp us.');
      return;
    }

    trackEvent('contact_form_submit');
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="glass rounded-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 rounded-xl bg-heat grid place-items-center mb-6">
          <Check className="w-6 h-6 text-black" strokeWidth={3} aria-hidden="true" />
        </div>
        <div className="font-display text-3xl md:text-4xl text-heat uppercase mb-4">Message sent!</div>
        <p className="font-sans text-ash text-base">
          We'll get back to you shortly. For faster help, WhatsApp us directly.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8 md:p-10">
      <h2 className="font-display text-3xl md:text-4xl uppercase mb-8 text-bone">Send a message</h2>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor="ct_name" className={authLabel}>Your name</label>
          <input
            id="ct_name" type="text" autoComplete="name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Rajesh Kumar" className={authInput}
          />
        </div>

        <div>
          <label htmlFor="ct_email" className={authLabel}>Email address</label>
          <input
            id="ct_email" type="email" autoComplete="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="rajesh@ironbeast.in" className={authInput}
          />
        </div>

        <div>
          <label htmlFor="ct_message" className={authLabel}>Message *</label>
          <textarea
            id="ct_message" required value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="How can we help you?" rows={5}
            className={`${authInput} resize-none`}
          />
        </div>

        {error && <p role="alert" className="font-mono text-[10px] text-red-400 uppercase font-bold">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full bg-heat text-black py-3.5 rounded-lg font-mono text-sm uppercase font-bold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send message →'}
        </button>
      </form>
    </div>
  );
};
