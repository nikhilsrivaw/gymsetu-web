import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import {
  LayoutDashboard,
  MapPin,
  Send,
  Receipt,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const sideLinks = [
  { name: 'DASHBOARD',  path: '/franchise/dashboard',  icon: LayoutDashboard },
  { name: 'LOCATIONS',  path: '/franchise/locations',   icon: MapPin },
  { name: 'INVITES',    path: '/franchise/invites',     icon: Send },
  { name: 'ROYALTIES',  path: '/franchise/royalties',   icon: Receipt },
  { name: 'SOPS',       path: '/franchise/sops',        icon: FileText },
  { name: 'SETTINGS',   path: '/franchise/settings',    icon: Settings },
];

export const FranchiseNavbar = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-56 bg-black border-r-2 border-white/10 flex-col z-40">
        {/* Logo */}
        <Link
          to="/franchise/dashboard"
          className="p-6 border-b border-white/10 flex items-center gap-2"
        >
          <span className="font-archivo text-xl tracking-tighter text-white">
            GYMSETU
          </span>
          <span className="font-mono text-[8px] font-bold text-brand-orange border border-brand-orange px-1.5 py-0.5 uppercase">
            FRANCHISE
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
          {sideLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 font-mono text-[10px] font-bold uppercase transition-all',
                  active
                    ? 'bg-brand-orange text-black'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 font-mono text-[10px] font-bold uppercase text-white/30 hover:text-white/60 transition-colors mb-1"
          >
            BACK TO GYMSETU
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 font-mono text-[10px] font-bold uppercase text-white/30 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            LOG OUT
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <nav className="md:hidden fixed top-0 left-0 w-full z-50 bg-black border-b-2 border-white/10 px-4 py-3 flex items-center justify-between">
        <Link to="/franchise/dashboard" className="flex items-center gap-2">
          <span className="font-archivo text-lg tracking-tighter text-white">
            GYMSETU
          </span>
          <span className="font-mono text-[7px] font-bold text-brand-orange border border-brand-orange px-1 py-0.5 uppercase">
            FRANCHISE
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white p-1"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile slide-out */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/95 pt-16">
          <nav className="flex flex-col gap-1 p-4">
            {sideLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 font-mono text-xs font-bold uppercase transition-all',
                    active
                      ? 'bg-brand-orange text-black'
                      : 'text-white/60 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {link.name}
                </Link>
              );
            })}

            <div className="border-t border-white/10 mt-4 pt-4">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 font-mono text-xs font-bold uppercase text-white/30"
              >
                BACK TO GYMSETU
              </Link>
              <button
                onClick={() => { setMobileOpen(false); signOut(); }}
                className="w-full flex items-center gap-3 px-4 py-3 font-mono text-xs font-bold uppercase text-white/30 hover:text-red-400"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                LOG OUT
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};
