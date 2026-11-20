import { useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { CITIES, LANGUAGES, MOVIE_CATEGORIES } from '../constants';
import type { Movie, MovieCategory } from '../types';

interface MoviesPageProps {
  movies: Movie[];
  loading: boolean;
  selectedCity: string;
  onChangeCity: (city: string) => void;
  onSelectMovie: (movie: Movie) => void;
}

export function MoviesPage({
  movies,
  loading,
  selectedCity,
  onChangeCity,
  onSelectMovie,
}: MoviesPageProps) {
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState<MovieCategory | 'all'>('all');
  const [language, setLanguage] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [availability, setAvailability] = useState<'all' | 'now_showing' | 'coming_soon'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'release_desc'>('rating');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return movies
      .filter((m) => {
        if (selectedCity && !m.cities.includes(selectedCity)) return false;
        if (
          genre !== 'all' &&
          m.primaryCategory !== genre &&
          !m.secondaryCategories.includes(genre)
        ) {
          return false;
        }
        if (language !== 'all' && m.language !== language) return false;
        if (m.rating < minRating) return false;
        if (availability !== 'all' && m.status !== availability) return false;
        if (
          q &&
          !m.title.toLowerCase().includes(q) &&
          !m.synopsis.toLowerCase().includes(q) &&
          !m.cast.some((c) => c.toLowerCase().includes(q))
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) =>
        sortBy === 'rating'
          ? b.rating - a.rating
          : b.releaseDate.localeCompare(a.releaseDate)
      );
  }, [movies, selectedCity, genre, language, minRating, availability, search, sortBy]);

  function resetFilters() {
    setSearch('');
    setGenre('all');
    setLanguage('all');
    setMinRating(0);
    setAvailability('all');
    setSortBy('rating');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
          Movies Directory
        </h1>
        <p className="text-sm text-zinc-400 mt-1.5">
          Filter live Cloud Firestore listings by city, genre, language, rating, and release schedule.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#131318] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, cast, or synopsis..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <select
            value={selectedCity}
            onChange={(e) => onChangeCity(e.target.value)}
            aria-label="Filter by city"
            className="px-3.5 py-2.5 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white focus:outline-none focus:border-rose-500"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value as MovieCategory | 'all')}
            aria-label="Filter by genre"
            className="px-3.5 py-2.5 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Genres</option>
            {MOVIE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Filter by language"
            className="px-3.5 py-2.5 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Languages</option>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            aria-label="Minimum rating"
            className="px-3.5 py-2.5 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white focus:outline-none focus:border-rose-500"
          >
            <option value={0}>Any Rating</option>
            <option value={8}>8.0+ Rating</option>
            <option value={8.5}>8.5+ Rating</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'All Releases' },
                { id: 'now_showing', label: 'Now Showing' },
                { id: 'coming_soon', label: 'Coming Soon' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAvailability(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  availability === tab.id
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#0D0D12] text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'release_desc')}
              aria-label="Sort movies"
              className="px-3 py-1.5 rounded-lg bg-[#0D0D12] border border-white/10 text-xs text-zinc-200"
            >
              <option value="rating">Highest Rated</option>
              <option value="release_desc">Newest Release Date</option>
            </select>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[420px] rounded-2xl bg-[#131318] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-[#131318] border border-white/[0.08] p-12 text-center space-y-3">
          <p className="text-lg font-semibold text-white">No matching films found</p>
          <p className="text-sm text-zinc-400">
            Adjust your city, genre, language, or minimum rating filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onSelect={onSelectMovie} />
          ))}
        </div>
      )}
    </div>
  );
}
