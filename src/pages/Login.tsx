import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { OAuthButtons } from '../components/OAuthButtons';
import { AuthShell, authInput, authLabel } from '../components/AuthShell';
import { landingPath } from '../lib/admin';

export const Login = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Log In | GymSetu';
  }, []);

  useEffect(() => {
    if (session) landingPath().then(p => navigate(p, { replace: true }));
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    setLoading(false);

    if (error) {
      setError('Invalid email or password.');
      return;
    }

    navigate(await landingPath());
  };

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <p className="font-mono text-[10px] text-ash uppercase tracking-[0.2em] mb-3">Gym owner portal</p>
        <h1 className="font-display text-5xl md:text-6xl text-bone uppercase leading-[0.9]">
          Welcome <span className="text-heat">back</span>
        </h1>
      </div>

      <div className="glass rounded-2xl p-7 md:p-8">
        <OAuthButtons />

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-hairline" />
          <span className="font-mono text-[9px] text-ash uppercase tracking-wider">or with email</span>
          <div className="flex-1 h-px bg-hairline" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label htmlFor="login_email" className={authLabel}>Email address</label>
            <input
              id="login_email" type="email" required autoComplete="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="rajesh@ironbeast.in" className={authInput}
            />
          </div>

          <div>
            <label htmlFor="login_password" className={authLabel}>Password</label>
            <div className="relative">
              <input
                id="login_password" type={showPassword ? 'text' : 'password'} required
                autoComplete="current-password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Your password" className={`${authInput} pr-12`}
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ash hover:text-bone transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p role="alert" className="font-mono text-[10px] text-red-400 uppercase font-bold">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-heat text-black py-3.5 rounded-lg font-mono text-sm uppercase font-bold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 mt-1">
            {loading ? 'Logging in…' : 'Log in →'}
          </button>
        </form>
      </div>

      <p className="text-center font-mono text-[10px] text-ash uppercase tracking-wider mt-6">
        No account? <Link to="/signup" className="text-flame hover:underline">Sign up free →</Link>
      </p>
    </AuthShell>
  );
};
