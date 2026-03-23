import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { Home, Zap, Tag, MessageCircle, LayoutDashboard, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { name: 'HOME', path: '/', icon: Home },
  { name: 'FEATURES', path: '/features', icon: Zap },
  { name: 'PRICING', path: '/pricing', icon: Tag },
  { name: 'CONTACT', path: '/contact', icon: MessageCircle },
];

export const Navbar = () => {
  const location = useLocation();
  const { session } = useAuth();

  return (
    <>
      {/* Desktop & Mobile Top Bar */}
      <nav className="fixed top-0 left-0 w-full z-50 p-4 md:p-8 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
          <Link 
            to="/" 
            className="font-archivo text-2xl md:text-3xl tracking-tighter text-white bg-black px-4 py-2 border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,77,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            GYMSETU
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex bg-black border-2 border-white p-1 gap-1 shadow-[4px_4px_0px_0px_rgba(255,77,0,1)]">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-6 py-2 font-mono text-sm transition-all font-bold uppercase",
                  location.pathname === link.path 
                    ? "bg-brand-orange text-black" 
                    : "text-white hover:text-brand-orange"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <Link
                to="/dashboard"
                className={cn(
                  "flex items-center gap-2 px-5 py-2 border-2 font-mono text-xs font-bold uppercase transition-all",
                  location.pathname === '/dashboard'
                    ? "bg-brand-orange border-brand-orange text-black"
                    : "bg-black border-white text-white hover:bg-brand-orange hover:border-brand-orange hover:text-black"
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                DASHBOARD
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2 border-2 border-white/40 bg-black font-mono text-xs font-bold uppercase text-white hover:border-white transition-colors"
                >
                  LOG IN
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 border-2 border-brand-orange bg-brand-orange font-mono text-xs font-bold uppercase text-black hover:opacity-90 transition-opacity"
                >
                  GET STARTED
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-black border-2 border-white p-1 flex justify-around items-center shadow-[6px_6px_0px_0px_rgba(255,77,0,1)]">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 transition-all flex-1",
                isActive ? "text-brand-orange" : "text-white"
              )}
            >
              <Icon className={cn("w-5 h-5 mb-1", isActive ? "stroke-[3px]" : "stroke-[2px]")} />
              <span className="font-mono text-[8px] font-bold uppercase tracking-tighter">
                {link.name}
              </span>
            </Link>
          );
        })}

        {/* Auth slot */}
        {session ? (
          <Link
            to="/dashboard"
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 transition-all flex-1",
              location.pathname === '/dashboard' ? "text-brand-orange" : "text-white"
            )}
          >
            <LayoutDashboard className={cn("w-5 h-5 mb-1", location.pathname === '/dashboard' ? "stroke-[3px]" : "stroke-[2px]")} />
            <span className="font-mono text-[8px] font-bold uppercase tracking-tighter">DASH</span>
          </Link>
        ) : (
          <Link
            to="/signup"
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 transition-all flex-1",
              ['/signup', '/login'].includes(location.pathname) ? "text-brand-orange" : "text-white"
            )}
          >
            <UserCircle className={cn("w-5 h-5 mb-1", ['/signup', '/login'].includes(location.pathname) ? "stroke-[3px]" : "stroke-[2px]")} />
            <span className="font-mono text-[8px] font-bold uppercase tracking-tighter">SIGN UP</span>
          </Link>
        )}
      </nav>
    </>
  );
};
