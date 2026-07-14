import React, { useEffect, useState } from 'react';
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Desktop / top bar */}
      <nav className="fixed top-0 left-0 w-full z-50 px-4 md:px-6 pt-4 md:pt-5 pointer-events-none">
        <div
          className={cn(
            'max-w-7xl mx-auto flex items-center justify-between gap-4 rounded-full pointer-events-auto transition-all duration-300 px-3 md:px-4 py-2.5',
            scrolled
              ? 'bg-surface/80 backdrop-blur-xl border border-hairline shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7)]'
              : 'bg-transparent border border-transparent'
          )}
        >
          <Link to="/" className="font-archivo text-xl md:text-2xl uppercase tracking-tight text-bone pl-2">
            GYM<span className="text-heat">SETU</span>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-1 rounded-full border border-hairline bg-ink/50 p-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'px-5 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-wide transition-colors',
                    active ? 'bg-heat text-black' : 'text-ash hover:text-bone'
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full bg-heat px-5 py-2 font-mono text-xs font-bold uppercase text-black hover:shadow-[0_10px_30px_-8px_rgba(255,77,0,0.6)] transition-shadow"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-hairline px-5 py-2 font-mono text-xs font-bold uppercase text-bone hover:border-flame/60 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-heat px-5 py-2 font-mono text-xs font-bold uppercase text-black hover:shadow-[0_10px_30px_-8px_rgba(255,77,0,0.6)] transition-shadow"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex justify-around items-center rounded-2xl border border-hairline bg-surface/85 backdrop-blur-xl p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn('flex flex-col items-center justify-center py-2 px-1 flex-1 rounded-xl transition-colors', isActive ? 'text-flame' : 'text-ash')}
            >
              <Icon className={cn('w-5 h-5 mb-1', isActive ? 'stroke-[2.6px]' : 'stroke-[2px]')} />
              <span className="font-mono text-[8px] font-bold uppercase tracking-tight">{link.name}</span>
            </Link>
          );
        })}
        {session ? (
          <Link to="/dashboard" className={cn('flex flex-col items-center justify-center py-2 px-1 flex-1', location.pathname === '/dashboard' ? 'text-flame' : 'text-ash')}>
            <LayoutDashboard className="w-5 h-5 mb-1" />
            <span className="font-mono text-[8px] font-bold uppercase tracking-tight">Dash</span>
          </Link>
        ) : (
          <Link to="/signup" className={cn('flex flex-col items-center justify-center py-2 px-1 flex-1', ['/signup', '/login'].includes(location.pathname) ? 'text-flame' : 'text-ash')}>
            <UserCircle className="w-5 h-5 mb-1" />
            <span className="font-mono text-[8px] font-bold uppercase tracking-tight">Sign up</span>
          </Link>
        )}
      </nav>
    </>
  );
};
