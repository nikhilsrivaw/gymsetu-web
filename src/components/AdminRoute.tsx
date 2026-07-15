import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIsAdmin } from '../lib/admin';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading: authLoading } = useAuth();
  const { isAdmin, loading } = useIsAdmin();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="flex items-center gap-2 text-ash">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-mono text-[11px] uppercase tracking-widest">Checking access…</span>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6 text-center">
        <div className="max-w-sm">
          <ShieldAlert className="w-10 h-10 text-flame mx-auto mb-4" />
          <h1 className="font-display text-3xl text-bone uppercase mb-2">Restricted</h1>
          <p className="font-sans text-ash text-sm mb-6">
            This area is for GymSetu platform operators. Your account doesn’t have admin access.
          </p>
          <Link to="/dashboard"
            className="inline-block bg-heat text-black px-6 py-3 font-mono text-xs uppercase font-bold tracking-wider rounded-md hover:opacity-90">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
