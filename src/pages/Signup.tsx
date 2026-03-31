import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { OAuthButtons } from '../components/OAuthButtons';
import { MIN_PASSWORD_LENGTH } from '../lib/constants';

const StepIndicator = ({ step }: { step: 1 | 2 | 3 }) => (
  <div className="flex items-center gap-2 mb-8">
    {([1, 2, 3] as const).map((n, i) => {
      const labels = ['ACCOUNT', 'PLAN', 'GYM INFO'];
      const done = n < step;
      const active = n === step;
      return (
        <React.Fragment key={n}>
          {i > 0 && <div className="flex-1 h-px bg-white/10" />}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-6 h-6 flex items-center justify-center font-mono text-[10px] font-bold ${
              done ? 'bg-white/20 text-white/50' : active ? 'bg-brand-orange text-black' : 'border border-white/20 text-white/30'
            }`}>
              {done ? '✓' : n}
            </span>
            <span className={`font-mono text-[10px] font-bold uppercase ${active ? 'text-white' : 'text-white/30'}`}>
              {labels[i]}
            </span>
          </div>
        </React.Fragment>
      );
    })}
  </div>
);

export { StepIndicator };

export const Signup = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { document.title = 'Create Account | GymSetu'; }, []);
  useEffect(() => { if (session) navigate('/dashboard', { replace: true }); }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setLoading(true);
    setError('');

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.message.toLowerCase().includes('already')
          ? 'This email is already registered.'
          : signUpError.message
      );
      return;
    }

    navigate('/signup/plan');
  };

  return (
    <main className="bg-near-black min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
      <div className="w-full max-w-sm">
        <StepIndicator step={1} />

        <h1 className="font-archivo text-5xl md:text-6xl text-white uppercase mb-2 leading-none tracking-tighter">
          CREATE YOUR<br /><span className="text-brand-orange">ACCOUNT.</span>
        </h1>
        <p className="font-mono text-[10px] text-white/40 uppercase font-bold mb-8">STEP 1 OF 3</p>

        <OAuthButtons />

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="font-mono text-[10px] text-white/30 uppercase font-bold">OR SIGN UP WITH EMAIL</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div>
            <label htmlFor="su_email" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
              Email Address
            </label>
            <input
              id="su_email"
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
            <label htmlFor="su_password" className="font-mono text-[10px] uppercase font-bold text-white/40 block mb-1">
              Password <span className="opacity-50">(min. {MIN_PASSWORD_LENGTH} chars)</span>
            </label>
            <div className="relative">
              <input
                id="su_password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Create a strong password"
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
            <p role="alert" className="font-mono text-[10px] text-red-400 uppercase font-bold">
              {error}{' '}
              {error.includes('already registered') && (
                <Link to="/login" className="underline">Log in →</Link>
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange text-black py-4 font-archivo text-xl uppercase tracking-tighter hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'CREATING ACCOUNT...' : 'CONTINUE →'}
          </button>

          <p className="text-center font-mono text-[10px] text-white/30 uppercase font-bold">
            ALREADY HAVE AN ACCOUNT?{' '}
            <Link to="/login" className="text-brand-orange hover:underline">LOG IN →</Link>
          </p>
        </form>
      </div>
    </main>
  );
};
