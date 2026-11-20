import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  MapPin,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { PosterImage } from '../components/PosterImage';
import { CATEGORY_STYLES, CITIES, MOVIE_CATEGORIES } from '../constants';
import type { AppPage, Movie, MovieCategory, UserProfile } from '../types';

interface HomePageProps {
  movies: Movie[];
  loading: boolean;
  selectedCity: string;
  onChangeCity: (city: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectMovie: (movie: Movie) => void;
  onSelectCategory: (cat: MovieCategory) => void;
  onNavigate: (page: AppPage) => void;
  profile: UserProfile | null;
  isAdmin: boolean;
  seeding: boolean;
  onSeedCatalog: () => void;
  onOpenAuth: () => void;
}

export function HomePage({
  movies,
  loading,
  selectedCity,
  onChangeCity,
  searchQuery,
  onSearchChange,
  onSelectMovie,
  onSelectCategory,
  onNavigate,
  profile,
  isAdmin,
  seeding,
  onSeedCatalog,
  onOpenAuth,
}: HomePageProps) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [showcaseTab, setShowcaseTab] = useState<'trending' | 'coming_soon'>('trending');

  const featuredMovies = useMemo(() => {
    const feat = movies.filter((m) => m.featured);
    return feat.length > 0 ? feat : movies.slice(0, 3);
  }, [movies]);

  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((idx) => (idx + 1) % featuredMovies.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [featuredMovies.length]);

  const activeHero = featuredMovies[heroIndex % Math.max(1, featuredMovies.length)];

  const filteredBySearchAndCity = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return movies.filter((m) => {
      const cityOk = !selectedCity || m.cities.includes(selectedCity);
      const queryOk =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.primaryCategory.toLowerCase().includes(q) ||
        m.language.toLowerCase().includes(q) ||
        m.moodTags.some((t) => t.toLowerCase().includes(q));
      return cityOk && queryOk;
    });
  }, [movies, selectedCity, searchQuery]);

  const nowShowing = useMemo(
    () => filteredBySearchAndCity.filter((m) => m.status === 'now_showing'),
    [filteredBySearchAndCity]
  );

  const trendingMovies = useMemo(
    () => filteredBySearchAndCity.filter((m) => m.trending && m.status === 'now_showing'),
    [filteredBySearchAndCity]
  );

  const comingSoonMovies = useMemo(
    () => movies.filter((m) => m.status === 'coming_soon'),
    [movies]
  );

  const aiRecommendedForYou = useMemo(() => {
    if (profile?.aiPersonalizationConsent && profile.favoriteGenres.length > 0) {
      const matched = movies.filter(
        (m) =>
          profile.favoriteGenres.includes(m.primaryCategory) ||
          m.secondaryCategories.some((c) => profile.favoriteGenres.includes(c))
      );
      if (matched.length > 0) return matched.slice(0, 4);
    }
    return [...movies].sort((a, b) => b.rating - a.rating).slice(0, 4);
  }, [movies, profile]);

  const showcaseMovies = showcaseTab === 'trending' ? trendingMovies : comingSoonMovies;

  return (
    <div className="space-y-14">
      {/* Hero Banner Carousel */}
      <section className="relative w-full bg-[#0D0D12] border-b border-white/[0.08] overflow-hidden">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
            <div className="h-[380px] rounded-2xl bg-[#16161D] animate-pulse" />
          </div>
        ) : activeHero ? (
          <div className="relative min-h-[470px] lg:h-[540px] flex items-end">
            <div className="absolute inset-0">
              <PosterImage
                src={activeHero.bannerUrl || activeHero.posterUrl}
                alt={`${activeHero.title} widescreen banner`}
                title={activeHero.title}
                aspect="banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0D] via-[#0A0A0D]/60 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0D]/95 via-[#0A0A0D]/55 to-transparent" />
            </div>

            <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-12 pt-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <p className="text-xs font-medium tracking-wide text-rose-400">
                  Featured Presentation
                  <span aria-hidden="true"> · </span>
                  {activeHero.primaryCategory}
                  <span aria-hidden="true"> · </span>
                  {activeHero.language}
                </p>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight text-balance">
                  {activeHero.title}
                </h1>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed line-clamp-3 max-w-xl">
                  {activeHero.synopsis}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-zinc-300 pt-1">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-white tabular-nums">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {activeHero.rating.toFixed(1)} / 10
                  </span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span className="tabular-nums">{activeHero.durationMinutes} min</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span className="font-mono text-xs">{activeHero.officialCertification}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => onSelectMovie(activeHero)}
                    className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Book Tickets
                  </button>
                  <button
                    onClick={() => onNavigate('ai-finder')}
                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    Find My Movie
                  </button>
                </div>
              </div>

              {featuredMovies.length > 1 && (
                <div className="flex items-center gap-2 self-start md:self-end">
                  <button
                    onClick={() =>
                      setHeroIndex((i) => (i - 1 + featuredMovies.length) % featuredMovies.length)
                    }
                    className="p-2.5 rounded-xl bg-black/50 hover:bg-black/75 border border-white/15 text-white cursor-pointer"
                    aria-label="Previous featured movie"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono tabular-nums text-zinc-300 px-2">
                    {(heroIndex % featuredMovies.length) + 1} / {featuredMovies.length}
                  </span>
                  <button
                    onClick={() => setHeroIndex((i) => (i + 1) % featuredMovies.length)}
                    className="p-2.5 rounded-xl bg-black/50 hover:bg-black/75 border border-white/15 text-white cursor-pointer"
                    aria-label="Next featured movie"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="bg-[#131318] border border-white/10 rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <p className="text-xs font-semibold text-rose-400">Cloud Firestore Catalog</p>
                <h1 className="font-display text-3xl font-bold text-white">
                  CineBook AI is connected and ready to seed
                </h1>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  No movies are stored in Cloud Firestore yet. Sign in as the administrator account to populate the initial movies, theatres, and showtimes.
                </p>
              </div>
              {isAdmin ? (
                <button
                  onClick={onSeedCatalog}
                  disabled={seeding}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold inline-flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-60"
                >
                  <Database className="w-4 h-4" />
                  {seeding ? 'Seeding Catalog...' : 'Seed Sample Catalog'}
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shrink-0 cursor-pointer"
                >
                  Admin Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Discovery Toolbar: City Selector + Movie Search Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-20">
        <div className="bg-[#131318] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col md:flex-row gap-3">
          <div className="relative md:w-56 shrink-0">
            <MapPin className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCity}
              onChange={(e) => onChangeCity(e.target.value)}
              aria-label="Select city"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search movies by title, genre, language, or mood..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            onClick={() => onNavigate('movies')}
            className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.11] border border-white/10 text-sm font-medium text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            All Filters
          </button>
        </div>
      </section>

      {/* Now Showing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Now Showing in {selectedCity}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Book real-time seats across premier IMAX and Dolby Atmos screens.
            </p>
          </div>
          <button
            onClick={() => onNavigate('movies')}
            className="text-sm font-medium text-rose-400 hover:text-rose-300 whitespace-nowrap cursor-pointer"
          >
            View all movies
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[420px] rounded-2xl bg-[#131318] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : nowShowing.length === 0 ? (
          <div className="rounded-2xl bg-[#131318] border border-white/[0.08] p-10 text-center space-y-3">
            <p className="text-base font-medium text-zinc-200">
              No matching movies found in {selectedCity}.
            </p>
            <p className="text-sm text-zinc-400">
              Try clearing your search query or switching to another city.
            </p>
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nowShowing.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onSelect={onSelectMovie} />
            ))}
          </div>
        )}
      </section>

      {/* Trending & Coming Soon Segmented Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              {showcaseTab === 'trending' ? 'Trending This Week' : 'Coming Soon to Theatres'}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {showcaseTab === 'trending'
                ? 'Most booked titles and audience favorites across cities.'
                : 'Upcoming premieres categorized and indexed by Gemini AI.'}
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-[#131318] border border-white/10 self-start">
            <button
              onClick={() => setShowcaseTab('trending')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                showcaseTab === 'trending'
                  ? 'bg-rose-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Trending
            </button>
            <button
              onClick={() => setShowcaseTab('coming_soon')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                showcaseTab === 'coming_soon'
                  ? 'bg-rose-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Coming Soon
            </button>
          </div>
        </div>

        {showcaseMovies.length === 0 ? (
          <div className="rounded-2xl bg-[#131318] border border-white/[0.08] p-8 text-center text-sm text-zinc-400">
            No titles in this view for {selectedCity}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {showcaseMovies.slice(0, 4).map((movie) => (
              <MovieCard key={movie.id} movie={movie} onSelect={onSelectMovie} />
            ))}
          </div>
        )}
      </section>

      {/* AI Recommended For You + Find My Movie Concierge */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-[#1B1218] via-[#131318] to-[#111218] border border-white/10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold text-rose-400 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Find My Movie — Gemini Concierge
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Not sure what to watch tonight?
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Describe your mood in plain language — like &ldquo;a tense rainy mystery&rdquo; or &ldquo;a funny family film&rdquo; — and Gemini AI matches live titles directly from our Firestore catalog.
            </p>
          </div>
          <button
            onClick={() => onNavigate('ai-finder')}
            className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Launch Find My Movie
          </button>
        </div>

        {aiRecommendedForYou.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-white">
                {profile?.aiPersonalizationConsent && profile.favoriteGenres.length > 0
                  ? 'Recommended Based on Your Favorite Genres'
                  : 'Top-Rated Picks Tonight'}
              </h3>
              {!profile?.aiPersonalizationConsent && (
                <button
                  onClick={() => onNavigate(profile ? 'profile' : 'ai-finder')}
                  className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Personalize with favorite genres
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiRecommendedForYou.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onSelect={onSelectMovie} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Browse by Genre */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Browse by Genre
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Every movie is analyzed by Gemini AI across 12 curated cinema categories.
            </p>
          </div>
          <button
            onClick={() => onNavigate('categories')}
            className="text-sm font-medium text-rose-400 hover:text-rose-300 whitespace-nowrap cursor-pointer"
          >
            Explore all 12
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {MOVIE_CATEGORIES.map((category) => {
            const style = CATEGORY_STYLES[category];
            const count = movies.filter(
              (m) => m.primaryCategory === category || m.secondaryCategories.includes(category)
            ).length;
            return (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                className={`p-4 rounded-2xl bg-gradient-to-br ${style.gradient} border border-white/[0.08] hover:border-white/25 text-left transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer`}
              >
                <p className={`font-display text-sm font-semibold ${style.accent}`}>
                  {category}
                </p>
                <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                  {count} {count === 1 ? 'film' : 'films'}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
