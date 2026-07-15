import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { OAuthButtons } from '../components/OAuthButtons';
import { AuthShell, authInput, authLabel } from '../components/AuthShell';
import { MIN_PASSWORD_LENGTH } from '../lib/constants';

const StepIndicator = ({ step }: { step: 1 | 2 | 3 }) => (
  <div className="flex items-center gap-2 mb-8">
    {([1, 2, 3] as const).map((n, i) => {
      const labels = ['Account', 'Plan', 'Gym info'];
      const done = n < step;
      const active = n === step;
      return (
        <React.Fragment key={n}>
          {i > 0 && <div className={`flex-1 h-px ${done ? 'bg-flame/50' : 'bg-hairline'}`} />}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-6 h-6 grid place-items-center rounded-full font-mono text-[10px] font-bold ${
              done ? 'bg-flame/20 text-flame' : active ? 'bg-heat text-black' : 'border border-hairline text-ash'
            }`}>
              {done ? '✓' : n}
            </span>
            <span className={`font-mono text-[9px] font-bold uppercase tracking-wider ${active ? 'text-bone' : 'text-ash'}`}>
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
    <AuthShell>
      <StepIndicator step={1} />

      <div className="mb-6">
        <p className="font-mono text-[10px] text-ash uppercase tracking-[0.2em] mb-2">Step 1 of 3</p>
        <h1 className="font-display text-4xl md:text-5xl text-bone uppercase leading-[0.9]">
          Create your <span className="text-heat">account</span>
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
            <label htmlFor="su_email" className={authLabel}>Email address</label>
            <input
              id="su_email" type="email" required autoComplete="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="rajesh@ironbeast.in" className={authInput}
            />
          </div>

          <div>
            <label htmlFor="su_password" className={authLabel}>
              Password <span className="text-ash/60 normal-case">(min. {MIN_PASSWORD_LENGTH} chars)</span>
            </label>
            <div className="relative">
              <input
                id="su_password" type={showPassword ? 'text' : 'password'} required
                minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Create a strong password" className={`${authInput} pr-12`}
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ash hover:text-bone transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="font-mono text-[10px] text-red-400 uppercase font-bold">
              {error}{' '}
              {error.includes('already registered') && <Link to="/login" className="underline">Log in →</Link>}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-heat text-black py-3.5 rounded-lg font-mono text-sm uppercase font-bold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 mt-1">
            {loading ? 'Creating account…' : 'Continue →'}
          </button>
        </form>
      </div>

      <p className="text-center font-mono text-[10px] text-ash uppercase tracking-wider mt-6">
        Already have an account? <Link to="/login" className="text-flame hover:underline">Log in →</Link>
      </p>
    </AuthShell>
  );
};
