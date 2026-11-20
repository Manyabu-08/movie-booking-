import { useState, type FormEvent } from 'react';
import { AlertCircle, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { recommendMoviesWithAI } from '../lib/api';
import { friendlyErrorMessage } from '../lib/firestoreError';
import type { AiRecommendationItem, Booking, Movie, UserProfile } from '../types';

interface AiFinderPageProps {
  movies: Movie[];
  selectedCity: string;
  profile: UserProfile | null;
  bookings: Booking[];
  onSelectMovie: (movie: Movie) => void;
  onUpdateConsent?: (consent: boolean) => Promise<void>;
}

const SAMPLE_PROMPTS = [
  'I want a scary horror movie.',
  'Suggest a funny family movie.',
  'Recommend a romantic movie.',
  'Show action movies with high ratings.',
  'I want something exciting to watch tonight.',
];

export function AiFinderPage({
  movies,
  selectedCity,
  profile,
  bookings,
  onSelectMovie,
  onUpdateConsent,
}: AiFinderPageProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [results, setResults] = useState<AiRecommendationItem[]>([]);
  const [usePersonalization, setUsePersonalization] = useState(
    Boolean(profile?.aiPersonalizationConsent)
  );

  async function runSearch(inputQuery: string) {
    const trimmed = inputQuery.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setLoading(true);
    setError('');
    try {
      const bookedTitles = Array.from(new Set(bookings.map((b) => b.movieTitle))).slice(0, 8);
      const res = await recommendMoviesWithAI({
        query: trimmed,
        movies,
        city: selectedCity,
        favoriteGenres: usePersonalization ? profile?.favoriteGenres : [],
        bookedMovieTitles: usePersonalization ? bookedTitles : [],
        personalizationConsent: usePersonalization,
      });
      setSummary(res.assistantSummary);
      setResults(res.recommendations);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  const matchedCards = results
    .map((item) => ({
      item,
      movie: movies.find((m) => m.id === item.movieId),
    }))
    .filter((entry): entry is { item: AiRecommendationItem; movie: Movie } => Boolean(entry.movie));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold text-rose-400 inline-flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          Powered by Gemini AI
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-white text-balance">
          Find My Movie
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          Describe the mood, pace, or audience you are planning for. Every recommendation comes strictly from live titles in our Cloud Firestore database.
        </p>
      </div>

      {/* Prompt Form */}
      <div className="bg-[#131318] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Suggest a mysterious neo-noir thriller or a heartwarming family film..."
            className="flex-1 px-4 py-3 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim() || movies.length === 0}
            className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Analyzing Catalog...' : 'Find Movies'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => runSearch(sample)}
              disabled={loading || movies.length === 0}
              className="px-3.5 py-1.5 rounded-lg bg-[#0D0D12] hover:bg-white/[0.06] border border-white/10 text-xs text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              {sample}
            </button>
          ))}
        </div>

        {profile && (
          <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={usePersonalization}
                onChange={(e) => {
                  const next = e.target.checked;
                  setUsePersonalization(next);
                  onUpdateConsent?.(next);
                }}
                className="rounded border-white/20 bg-[#0D0D12] text-rose-600 focus:ring-rose-500"
              />
              <span>
                Include my favorite genres ({profile.favoriteGenres.length || 'none set'}) and booking history for personalized picks
              </span>
            </label>
            <span className="text-[11px] text-zinc-500 inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              Consent-based personalization
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Could not complete AI recommendation</p>
            <p className="text-xs text-rose-200/80">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[420px] rounded-2xl bg-[#131318] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && summary && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#131318] border border-white/10 p-5">
            <p className="text-xs font-semibold text-rose-400 mb-1">Concierge Summary</p>
            <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">{summary}</p>
          </div>

          {matchedCards.length === 0 ? (
            <div className="rounded-2xl bg-[#131318] border border-white/[0.08] p-8 text-center text-sm text-zinc-400">
              No titles in the active database catalog closely matched that request. Try broadening your description.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {matchedCards.map(({ movie, item }) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSelect={onSelectMovie}
                  subtitleNote={item.matchReason}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
