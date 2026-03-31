import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FranchiseNavbar } from './FranchiseNavbar';

export const FranchiseLayout = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center">
        <div className="font-mono text-[10px] uppercase font-bold text-white/30 animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-near-black">
      <FranchiseNavbar />
      {/* Content area: offset by sidebar on desktop, topbar on mobile */}
      <main className="md:ml-56 pt-16 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
};
