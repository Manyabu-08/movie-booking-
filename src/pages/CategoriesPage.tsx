import { useMemo, useState } from 'react';
import { MovieCard } from '../components/MovieCard';
import { CATEGORY_STYLES, CITIES, LANGUAGES, MOVIE_CATEGORIES } from '../constants';
import type { Movie, MovieCategory } from '../types';

interface CategoriesPageProps {
  movies: Movie[];
  initialCategory: MovieCategory | null;
  selectedCity: string;
  onChangeCity: (city: string) => void;
  onSelectMovie: (movie: Movie) => void;
}

export function CategoriesPage({
  movies,
  initialCategory,
  selectedCity,
  onChangeCity,
  onSelectMovie,
}: CategoriesPageProps) {
  const [activeCategory, setActiveCategory] = useState<MovieCategory | 'all'>(
    initialCategory ?? 'all'
  );
  const [language, setLanguage] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [availability, setAvailability] = useState<'all' | 'now_showing' | 'coming_soon'>('all');

  const matchingMovies = useMemo(() => {
    return movies.filter((m) => {
      if (selectedCity && !m.cities.includes(selectedCity)) return false;
      if (
        activeCategory !== 'all' &&
        m.primaryCategory !== activeCategory &&
        !m.secondaryCategories.includes(activeCategory)
      ) {
        return false;
      }
      if (language !== 'all' && m.language !== language) return false;
      if (m.rating < minRating) return false;
      if (availability !== 'all' && m.status !== availability) return false;
      return true;
    });
  }, [movies, selectedCity, activeCategory, language, minRating, availability]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Explore 12 AI-Curated Genres
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 max-w-2xl">
            Every title is analyzed by Gemini AI for primary genre, secondary crossovers, and story mood.
          </p>
        </div>

        {activeCategory !== 'all' && (
          <button
            onClick={() => setActiveCategory('all')}
            className="px-4 py-2 rounded-xl bg-[#16161D] border border-white/10 text-xs font-medium text-zinc-200 hover:text-white self-start cursor-pointer"
          >
            Show All Categories
          </button>
        )}
      </div>

      {/* 12 Distinctive Genre Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOVIE_CATEGORIES.map((category) => {
          const style = CATEGORY_STYLES[category];
          const selected = activeCategory === category;
          const count = movies.filter(
            (m) => m.primaryCategory === category || m.secondaryCategories.includes(category)
          ).length;

          return (
            <button
              key={category}
              onClick={() => setActiveCategory(selected ? 'all' : category)}
              className={`p-5 rounded-2xl bg-gradient-to-br ${style.gradient} border text-left transition-all duration-200 cursor-pointer ${
                selected
                  ? 'border-rose-500 ring-1 ring-rose-500/50 -translate-y-0.5'
                  : 'border-white/[0.08] hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className={`font-display text-lg font-bold ${style.accent}`}>
                  {category}
                </h2>
                <span className="text-xs font-mono tabular-nums text-zinc-400">
                  {count}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                {style.tagline}
              </p>
            </button>
          );
        })}
      </div>

      {/* Refine Bar */}
      <div className="bg-[#131318] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">
          {activeCategory === 'all' ? 'All Categories' : activeCategory}{' '}
          <span className="text-zinc-400 font-normal tabular-nums">
            ({matchingMovies.length} {matchingMovies.length === 1 ? 'movie' : 'movies'})
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedCity}
            onChange={(e) => onChangeCity(e.target.value)}
            aria-label="City filter"
            className="px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-xs text-white"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Language filter"
            className="px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-xs text-white"
          >
            <option value="all">All Languages</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            aria-label="Rating filter"
            className="px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-xs text-white"
          >
            <option value={0}>Any Rating</option>
            <option value={8}>8.0+ Rated</option>
            <option value={8.5}>8.5+ Rated</option>
          </select>

          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value as 'all' | 'now_showing' | 'coming_soon')}
            aria-label="Availability filter"
            className="px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-xs text-white"
          >
            <option value="all">All Releases</option>
            <option value="now_showing">Now Showing</option>
            <option value="coming_soon">Coming Soon</option>
          </select>
        </div>
      </div>

      {matchingMovies.length === 0 ? (
        <div className="rounded-2xl bg-[#131318] border border-white/[0.08] p-10 text-center space-y-2">
          <p className="text-base font-medium text-white">No movies match these filters.</p>
          <p className="text-sm text-zinc-400">
            Try choosing another category, city, or lowering the minimum rating.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {matchingMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onSelect={onSelectMovie} />
          ))}
        </div>
      )}
    </div>
  );
}
