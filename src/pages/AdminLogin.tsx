import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Internal sign-in for /admin. Deliberately NOT the gym-owner login:
 *
 *  - Different surface. An operator hitting /admin shouldn't be bounced to a
 *    page selling gym software, and the owner portal shouldn't advertise where
 *    the staff door is.
 *  - No signup, no OAuth, no password reset. Admins are a hand-maintained
 *    allowlist (platform_admins); there is no self-serve path in and every
 *    extra entry point is another thing to get wrong.
 *  - The error is always the same sentence. It must not reveal whether an
 *    email exists, or whether it happens to be an admin — that would turn this
 *    form into an oracle for "who are GymSetu's operators".
 *
 * This form only authenticates. It does NOT decide access: AdminRoute re-runs
 * is_super_admin() once a session exists, and RLS enforces it server-side
 * regardless. Signing in here as a non-admin gets you the Restricted screen,
 * which is the correct outcome, not a bug.
 */
export const AdminLogin = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: e2 } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    setLoading(false);

    // Same message for wrong password, unknown email, and a real account that
    // simply isn't an admin. Never differentiate.
    if (e2) { setError('Invalid credentials.'); return; }

    // No navigate() — AuthContext publishes the new session, AdminRoute
    // re-renders and decides what this account is allowed to see.
  };

  return (
    <main className="min-h-screen bg-ink flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Muted, colder than the marketing site on purpose — this is a back office. */}
      <div className="hud-grid absolute inset-0 opacity-40" aria-hidden="true" />

      <div className="relative w-full max-w-sm">
        <div className="glass rounded-2xl p-8 border border-hairline">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-md border border-hairline flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-ash" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash font-bold">Platform · Internal</p>
              <h1 className="font-display text-xl text-bone uppercase leading-none mt-0.5">Admin access</h1>
            </div>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="admin-email" className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash font-bold block mb-2">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-ink border border-hairline rounded-md px-3 py-2.5 font-mono text-sm text-bone placeholder:text-ash/50 focus:border-ash outline-none"
                placeholder="you@aqirox.com"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash font-bold block mb-2">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-ink border border-hairline rounded-md px-3 py-2.5 font-mono text-sm text-bone focus:border-ash outline-none"
                required
              />
            </div>

            {error && (
              <p role="alert" className="font-mono text-[11px] text-red-400 border border-red-400/30 bg-red-400/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !form.email || !form.password}
              className="mt-2 w-full bg-bone text-black py-3 rounded-md font-mono text-[11px] uppercase font-bold tracking-wider hover:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2 transition-opacity"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Checking…' : 'Sign in'}
            </button>
          </form>

          <p className="font-sans text-[11px] text-ash/70 mt-6 leading-relaxed">
            Access is restricted to GymSetu operators. Gym owners should sign in
            through the <Link to="/login" className="text-ash hover:text-bone underline underline-offset-2">owner portal</Link>.
          </p>
        </div>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ash/60 hover:text-ash transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> gymsetu.it.com
        </Link>
      </div>
    </main>
  );
};
