import { useState, type FormEvent } from 'react';
import { sendEmailVerification, type User } from 'firebase/auth';
import { AlertCircle, CheckCircle2, MailCheck, Save } from 'lucide-react';
import { CITIES, MOVIE_CATEGORIES } from '../constants';
import { friendlyErrorMessage } from '../lib/firestoreError';
import { updateUserProfile } from '../lib/firestoreService';
import type { MovieCategory, UserProfile } from '../types';

interface ProfilePageProps {
  user: User | null;
  profile: UserProfile | null;
  onOpenAuth: () => void;
  onProfileUpdated: () => Promise<void>;
}

export function ProfilePage({
  user,
  profile,
  onOpenAuth,
  onProfileUpdated,
}: ProfilePageProps) {
  const [displayName, setDisplayName] = useState(
    profile?.displayName || user?.displayName || ''
  );
  const [city, setCity] = useState(profile?.city || 'Mumbai');
  const [favoriteGenres, setFavoriteGenres] = useState<MovieCategory[]>(
    profile?.favoriteGenres || []
  );
  const [consent, setConsent] = useState(Boolean(profile?.aiPersonalizationConsent));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-[#131318] border border-white/10 rounded-2xl p-10 text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-white">
            Sign in to manage your profile
          </h1>
          <p className="text-sm text-zinc-400">
            Save your preferred city and favorite genres for personalized movie recommendations.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  function toggleGenre(cat: MovieCategory) {
    setFavoriteGenres((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim() || 'Cinema Guest',
        city,
        favoriteGenres,
        aiPersonalizationConsent: consent,
      });
      await onProfileUpdated();
      setMessage('Profile and genre preferences saved to Cloud Firestore.');
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleResendVerification() {
    if (!user) return;
    setError('');
    setMessage('');
    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent. Check your inbox, then click Refresh Status.');
    } catch (err) {
      setError(friendlyErrorMessage(err));
    }
  }

  async function handleRefreshAuth() {
    if (!user) return;
    await user.reload();
    await onProfileUpdated();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">
          Profile & Preferences
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your cinema city, favorite genres, and AI personalization consent.
        </p>
      </div>

      {!user.emailVerified && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-200">
                Email verification required for bookings
              </p>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Verify {user.email} to unlock Firestore profile updates and seat reservations.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleResendVerification}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-semibold cursor-pointer"
            >
              Resend Verification Email
            </button>
            <button
              onClick={handleRefreshAuth}
              className="px-3.5 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-zinc-200 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <MailCheck className="w-3.5 h-3.5" />
              Refresh Status
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-[#131318] border border-white/10 rounded-2xl p-6 space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Preferred City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white focus:outline-none focus:border-rose-500"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-2">
            Favorite Movie Genres
          </label>
          <div className="flex flex-wrap gap-2">
            {MOVIE_CATEGORIES.map((cat) => {
              const selected = favoriteGenres.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleGenre(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    selected
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-[#0D0D12] border-white/10 text-zinc-300 hover:border-white/25'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-start gap-3 p-4 rounded-xl bg-[#0D0D12] border border-white/[0.08] cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 rounded border-white/20 bg-[#131318] text-rose-600 focus:ring-rose-500"
          />
          <span className="text-xs text-zinc-300 leading-relaxed">
            Allow Find My Movie AI to use my favorite genres and past CineBook AI booking history for personalized film recommendations.
          </span>
        </label>

        {message && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !user.emailVerified}
          className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
}
