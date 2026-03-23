import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
    if (session) navigate('/dashboard', { replace: true });
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

    navigate('/dashboard');
  };

  return (
    <main className="bg-near-black min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
      <div className="w-full max-w-sm">
        <h1 className="font-archivo text-5xl md:text-6xl text-white uppercase mb-2 leading-none tracking-tighter">
          WELCOME<br /><span className="text-brand-orange">BACK.</span>
        </h1>
        <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-12">GYM OWNER PORTAL</p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div>
            <label htmlFor="login_email" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
              Email Address
            </label>
            <input
              id="login_email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="rajesh@ironbeast.in"
              className="w-full bg-black border border-white/10 text-white px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          <div>
            <label htmlFor="login_password" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="login_password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Your password"
                className="w-full bg-black border border-white/10 text-white px-4 py-3 pr-12 font-sans text-sm focus:outline-none focus:border-brand-orange transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="font-mono text-[10px] text-red-400 uppercase font-bold">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange text-black py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'LOGGING IN...' : 'LOG IN →'}
          </button>

          <p className="text-center font-mono text-[10px] text-white/30 uppercase font-bold">
            DON'T HAVE AN ACCOUNT?{' '}
            <Link to="/signup" className="text-brand-orange hover:underline">SIGN UP FREE →</Link>
          </p>
        </form>
      </div>
    </main>
  );
};
