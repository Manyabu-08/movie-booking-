import { useState } from 'react';
import { Clapperboard, LogOut, Menu, ShieldCheck, Ticket, User as UserIcon, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { AppPage, UserProfile } from '../types';

interface NavbarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Navbar({
  currentPage,
  onNavigate,
  user,
  profile,
  isAdmin,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const navLinks: { id: AppPage; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'movies', label: 'Movies' },
    { id: 'categories', label: 'Categories' },
    { id: 'ai-finder', label: 'AI Finder' },
    { id: 'my-bookings', label: 'My Bookings' },
  ];

  const displayName =
    profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Account';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0A0D]/80 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Mark */}
        <button
          onClick={() => {
            onNavigate('home');
            setMenuOpen(false);
          }}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <Clapperboard className="w-4 h-4 text-white" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            CineBook <span className="text-rose-500">AI</span>
          </span>
        </button>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
          {navLinks.map((link) => {
            const active = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded ${
                  active ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-rose-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary account action */}
        <div className="flex items-center gap-3 shrink-0">
          {!user ? (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              Sign In
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#16161D] hover:bg-[#1E1E27] border border-white/10 text-sm font-medium text-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span className="w-6 h-6 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center text-xs font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate hidden sm:inline">{displayName}</span>
              </button>

              {profileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#14141A] border border-white/10 shadow-2xl py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-white/[0.06]">
                      <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                      <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onNavigate('profile');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/[0.05] flex items-center gap-2.5 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-zinc-400" />
                      Profile & Preferences
                    </button>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onNavigate('my-bookings');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/[0.05] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Ticket className="w-4 h-4 text-zinc-400" />
                      My Bookings
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-rose-400" />
                        Admin Dashboard
                      </button>
                    )}
                    <div className="my-1 border-t border-white/[0.06]" />
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-xl bg-[#16161D] border border-white/10 text-zinc-200 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#0D0D12] px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer ${
                currentPage === link.id
                  ? 'bg-rose-600/15 text-rose-300'
                  : 'text-zinc-300 hover:bg-white/[0.04]'
              }`}
            >
              {link.label}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:bg-rose-500/10 cursor-pointer"
            >
              Admin Dashboard
            </button>
          )}
        </div>
      )}
    </header>
  );
}
