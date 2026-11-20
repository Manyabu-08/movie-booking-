import { Clapperboard } from 'lucide-react';
import type { AppPage } from '../types';

interface FooterProps {
  onNavigate: (page: AppPage) => void;
  selectedCity: string;
}

export function Footer({ onNavigate, selectedCity }: FooterProps) {
  return (
    <footer className="border-t border-white/[0.08] bg-[#08080B] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center">
              <Clapperboard className="w-3.5 h-3.5 text-white" />
            </span>
            <span className="font-display text-base font-bold text-white">
              CineBook <span className="text-rose-500">AI</span>
            </span>
          </div>
          <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
            AI-assisted cinema discovery and real-time seat reservation platform. Currently browsing listings for {selectedCity}.
          </p>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-md">
            AI genre tags and family-friendliness impressions are automated narrative assessments and do not replace official film age certifications. Payments run in simulated demo mode with no real charges.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Explore</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors cursor-pointer">
                Home
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('movies')} className="hover:text-white transition-colors cursor-pointer">
                All Movies
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('categories')} className="hover:text-white transition-colors cursor-pointer">
                Browse Categories
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('ai-finder')} className="hover:text-white transition-colors cursor-pointer">
                Find My Movie AI
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Account</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>
              <button onClick={() => onNavigate('my-bookings')} className="hover:text-white transition-colors cursor-pointer">
                My Bookings
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('profile')} className="hover:text-white transition-colors cursor-pointer">
                Profile & Preferences
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.06] py-5 px-4 sm:px-6 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} CineBook AI. Powered by Cloud Firestore, Firebase Auth, and Gemini AI.
      </div>
    </footer>
  );
}
