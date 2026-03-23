import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

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
      <div className="border-2 border-white/20 p-8 md:p-12 text-white text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 bg-brand-orange flex items-center justify-center mb-6">
          <Check className="w-6 h-6 text-black" strokeWidth={3} aria-hidden="true" />
        </div>
        <div className="font-archivo text-3xl md:text-4xl text-brand-orange uppercase mb-4">MESSAGE SENT!</div>
        <p className="font-sans text-white/60 text-base">
          We'll get back to you shortly. For faster help, WhatsApp us directly.
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-white/20 p-8 md:p-12 text-white">
      <h2 className="font-archivo text-3xl md:text-4xl uppercase mb-8">SEND A MESSAGE</h2>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor="ct_name" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
            Your Name
          </label>
          <input
            id="ct_name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Rajesh Kumar"
            className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
          />
        </div>

        <div>
          <label htmlFor="ct_email" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
            Email Address
          </label>
          <input
            id="ct_email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="rajesh@ironbeast.in"
            className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
          />
        </div>

        <div>
          <label htmlFor="ct_message" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
            Message *
          </label>
          <textarea
            id="ct_message"
            required
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="How can we help you?"
            rows={5}
            className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors resize-none"
          />
        </div>

        {error && (
          <p role="alert" className="font-mono text-[10px] text-red-400 uppercase font-bold">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-orange text-black py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'SENDING...' : 'SEND MESSAGE →'}
        </button>
      </form>
    </div>
  );
};
