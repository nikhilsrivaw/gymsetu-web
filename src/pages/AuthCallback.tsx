import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = async () => {
      // Supabase exchanges the OAuth code automatically.
      // Give it a moment to hydrate the session from the URL hash/code.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Sign-in failed. Please try again.');
        setTimeout(() => navigate('/login'), 2500);
        return;
      }

      // Check if this user already has a profile (returning user vs new OAuth user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        navigate('/dashboard', { replace: true });
      } else {
        // New OAuth user — send to plan selection to start signup flow
        navigate('/signup/plan', { replace: true });
      }
    };

    handle();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-mono text-[10px] text-red-400 uppercase font-bold mb-4">{error}</p>
          <p className="font-sans text-white/40 text-sm">Redirecting you back...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-near-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-mono text-[10px] uppercase font-bold text-white/30 animate-pulse">
          SIGNING YOU IN...
        </p>
      </div>
    </div>
  );
};
