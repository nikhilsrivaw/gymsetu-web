import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../context/AuthContext';

// Whether the signed-in user is a platform super-admin. Source of truth is the
// Postgres `is_super_admin()` function (checked against the platform_admins
// allowlist) — the UI only mirrors it; real enforcement is RLS on the server.
export function useIsAdmin() {
  const { session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session) { setIsAdmin(false); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('is_super_admin');
      if (!cancelled) setIsAdmin(!error && data === true);
    })();
    return () => { cancelled = true; };
  }, [authLoading, session]);

  return { isAdmin, loading: authLoading || isAdmin === null };
}

// One-shot admin check (for redirect decisions outside React state).
export async function isAdminNow(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_super_admin');
  return !error && data === true;
}

// Where a freshly-authenticated user should land: admins → console, else app.
export async function landingPath(): Promise<string> {
  return (await isAdminNow()) ? '/admin' : '/dashboard';
}
