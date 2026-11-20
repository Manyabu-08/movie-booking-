import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Edit3,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  CITIES,
  formatCurrency,
  LANGUAGES,
  MOVIE_CATEGORIES,
} from '../constants';
import { categorizeMovieWithAI } from '../lib/api';
import { friendlyErrorMessage } from '../lib/firestoreError';
import {
  deleteMovieAdmin,
  deleteShowtimeAdmin,
  fetchAllBookingsAdmin,
  saveMovieAdmin,
  saveShowtimeAdmin,
  saveTheatreAdmin,
} from '../lib/firestoreService';
import type {
  Booking,
  FamilyFriendlyAssessment,
  Movie,
  MovieCategory,
  Showtime,
  Theatre,
} from '../types';

interface AdminDashboardPageProps {
  isAdmin: boolean;
  movies: Movie[];
  theatres: Theatre[];
  showtimes: Showtime[];
  seeding: boolean;
  onSeedCatalog: () => Promise<void>;
  onRefreshCatalog: () => Promise<void>;
}

const DEFAULT_POSTER = '/src/assets/images/poster_solar_eclipse_1795160107300.jpg';

function createBlankMovie(): Omit<Movie, 'createdAt' | 'updatedAt'> {
  return {
    id: `mov_${Date.now().toString(36)}`,
    title: '',
    synopsis: '',
    posterUrl: DEFAULT_POSTER,
    bannerUrl: '',
    trailerUrl: '',
    language: 'English',
    durationMinutes: 120,
    rating: 8.0,
    officialCertification: 'UA 13+',
    releaseDate: '2026-11-25',
    status: 'now_showing',
    trending: false,
    featured: false,
    cities: ['Mumbai', 'Bengaluru'],
    cast: [],
    primaryCategory: 'Drama',
    secondaryCategories: [],
    moodTags: [],
    aiExplanation: '',
    aiFamilyFriendlyAssessment: 'uncertain',
    aiFamilyFriendlyNote:
      'AI narrative assessment has not been generated yet; refer to official certification.',
    aiReviewedByAdmin: false,
  };
}

export function AdminDashboardPage({
  isAdmin,
  movies,
  theatres,
  showtimes,
  seeding,
  onSeedCatalog,
  onRefreshCatalog,
}: AdminDashboardPageProps) {
  const [tab, setTab] = useState<'movies' | 'theatres' | 'showtimes' | 'bookings'>('movies');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Movie editor state
  const [editingMovie, setEditingMovie] = useState<Omit<Movie, 'createdAt' | 'updatedAt'> | null>(null);
  const [isNewMovie, setIsNewMovie] = useState(true);
  const [castInput, setCastInput] = useState('');
  const [moodInput, setMoodInput] = useState('');
  const [aiRunning, setAiRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Theatre form state
  const [theatreName, setTheatreName] = useState('');
  const [theatreCity, setTheatreCity] = useState<string>('Mumbai');
  const [theatreAddress, setTheatreAddress] = useState('');
  const [theatreScreens, setTheatreScreens] = useState(6);
  const [theatreAmenities, setTheatreAmenities] = useState('IMAX Laser, Dolby Atmos');

  // Showtime form state
  const [stMovieId, setStMovieId] = useState('');
  const [stTheatreId, setStTheatreId] = useState('');
  const [stDate, setStDate] = useState('2026-11-22');
  const [stTime, setStTime] = useState('07:30 PM');
  const [stFormat, setStFormat] = useState('Dolby Atmos');
  const [stScreen, setStScreen] = useState('Audi 01');
  const [stStdPrice, setStStdPrice] = useState(320);
  const [stPremPrice, setStPremPrice] = useState(520);
  const [stFee, setStFee] = useState(40);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingBookings(true);
    fetchAllBookingsAdmin()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoadingBookings(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!stMovieId && movies.length > 0) setStMovieId(movies[0].id);
    if (!stTheatreId && theatres.length > 0) setStTheatreId(theatres[0].id);
  }, [movies, theatres, stMovieId, stTheatreId]);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-[#131318] border border-rose-500/30 rounded-2xl p-10 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
          <h1 className="font-display text-2xl font-bold text-white">
            Administrator Access Required
          </h1>
          <p className="text-sm text-zinc-400">
            This console is restricted to verified CineBook AI administrators. Regular user accounts cannot manage movies, theatres, or AI categories.
          </p>
        </div>
      </div>
    );
  }

  const confirmedBookings = bookings.filter((b) => b.bookingStatus === 'confirmed');
  const totalDemoRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  function startNewMovie() {
    const blank = createBlankMovie();
    setEditingMovie(blank);
    setCastInput('');
    setMoodInput('');
    setIsNewMovie(true);
    setErrorMsg('');
    setStatusMsg('');
  }

  function startEditMovie(m: Movie) {
    setEditingMovie({
      id: m.id,
      title: m.title,
      synopsis: m.synopsis,
      posterUrl: m.posterUrl,
      bannerUrl: m.bannerUrl ?? '',
      trailerUrl: m.trailerUrl ?? '',
      language: m.language,
      durationMinutes: m.durationMinutes,
      rating: m.rating,
      officialCertification: m.officialCertification,
      releaseDate: m.releaseDate,
      status: m.status,
      trending: m.trending,
      featured: m.featured,
      cities: m.cities,
      cast: m.cast,
      primaryCategory: m.primaryCategory,
      secondaryCategories: m.secondaryCategories,
      moodTags: m.moodTags,
      aiExplanation: m.aiExplanation,
      aiFamilyFriendlyAssessment: m.aiFamilyFriendlyAssessment,
      aiFamilyFriendlyNote: m.aiFamilyFriendlyNote,
      aiReviewedByAdmin: m.aiReviewedByAdmin,
    });
    setCastInput(m.cast.join(', '));
    setMoodInput(m.moodTags.join(', '));
    setIsNewMovie(false);
    setErrorMsg('');
    setStatusMsg('');
  }

  async function handleRunAiCategorization() {
    if (!editingMovie) return;
    if (!editingMovie.title.trim() || editingMovie.synopsis.trim().length < 10) {
      setErrorMsg('Enter a title and synopsis (at least 10 characters) before running Gemini AI categorization.');
      return;
    }
    setAiRunning(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const res = await categorizeMovieWithAI({
        title: editingMovie.title,
        synopsis: editingMovie.synopsis,
        language: editingMovie.language,
        officialCertification: editingMovie.officialCertification,
      });
      setEditingMovie((prev) =>
        prev
          ? {
              ...prev,
              primaryCategory: res.primaryCategory,
              secondaryCategories: res.secondaryCategories,
              moodTags: res.moodTags,
              aiExplanation: res.explanation,
              aiFamilyFriendlyAssessment: res.familyFriendlyAssessment,
              aiFamilyFriendlyNote: res.familyFriendlyNote,
              aiReviewedByAdmin: false,
            }
          : null
      );
      setMoodInput(res.moodTags.join(', '));
      setStatusMsg('Gemini AI categorization completed. Review and adjust fields below before saving.');
    } catch (err) {
      setErrorMsg(friendlyErrorMessage(err));
    } finally {
      setAiRunning(false);
    }
  }

  async function handleSaveMovie(e: FormEvent) {
    e.preventDefault();
    if (!editingMovie) return;
    setSaving(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const parsedCast = castInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 15);
      const parsedMoods = moodInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8);

      const payload: Omit<Movie, 'createdAt' | 'updatedAt'> = {
        ...editingMovie,
        title: editingMovie.title.trim(),
        synopsis: editingMovie.synopsis.trim(),
        posterUrl: editingMovie.posterUrl.trim() || DEFAULT_POSTER,
        cast: parsedCast,
        moodTags: parsedMoods,
        cities: editingMovie.cities.length > 0 ? editingMovie.cities : ['Mumbai'],
      };

      await saveMovieAdmin(payload, isNewMovie);
      await onRefreshCatalog();
      setStatusMsg(`Saved "${payload.title}" to Cloud Firestore.`);
      setEditingMovie(null);
    } catch (err) {
      setErrorMsg(friendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMovie(movieId: string, title: string) {
    setErrorMsg('');
    setStatusMsg('');
    try {
      await deleteMovieAdmin(movieId);
      await onRefreshCatalog();
      setStatusMsg(`Deleted "${title}" from Cloud Firestore.`);
    } catch (err) {
      setErrorMsg(friendlyErrorMessage(err));
    }
  }

  async function handleAddTheatre(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const id = `th_${Date.now().toString(36)}`;
      await saveTheatreAdmin(
        {
          id,
          name: theatreName.trim(),
          city: theatreCity,
          address: theatreAddress.trim(),
          screens: Number(theatreScreens),
          amenities: theatreAmenities
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
        true
      );
      setTheatreName('');
      setTheatreAddress('');
      await onRefreshCatalog();
      setStatusMsg('Theatre added to Cloud Firestore.');
    } catch (err) {
      setErrorMsg(friendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddShowtime(e: FormEvent) {
    e.preventDefault();
    const theatre = theatres.find((t) => t.id === stTheatreId);
    if (!stMovieId || !theatre) {
      setErrorMsg('Select both a valid movie and theatre.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const id = `st_${Date.now().toString(36)}`;
      await saveShowtimeAdmin(
        {
          id,
          movieId: stMovieId,
          theatreId: theatre.id,
          city: theatre.city,
          screenName: stScreen.trim() || 'Audi 01',
          showDate: stDate,
          showTime: stTime.trim(),
          format: stFormat.trim(),
          standardPrice: Number(stStdPrice),
          premiumPrice: Number(stPremPrice),
          convenienceFeePerTicket: Number(stFee),
          bookedSeats: [],
          heldSeats: {},
        },
        true
      );
      await onRefreshCatalog();
      setStatusMsg('Showtime scheduled in Cloud Firestore.');
    } catch (err) {
      setErrorMsg(friendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Admin Console
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage films, review Gemini AI genre classifications, schedule showtimes, and inspect bookings.
          </p>
        </div>

        <button
          onClick={onSeedCatalog}
          disabled={seeding}
          className="px-4 py-2.5 rounded-xl bg-[#131318] hover:bg-[#1C1C24] border border-white/15 text-xs font-semibold text-white inline-flex items-center gap-2 self-start cursor-pointer disabled:opacity-60"
        >
          <Database className="w-4 h-4 text-rose-400" />
          {seeding ? 'Seeding Firestore...' : 'Seed / Reset Sample Catalog'}
        </button>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131318] border border-white/[0.08] rounded-2xl p-5">
          <p className="text-xs text-zinc-400">Movies in Catalog</p>
          <p className="font-display text-3xl font-bold text-white mt-1 tabular-nums">
            {movies.length}
          </p>
        </div>
        <div className="bg-[#131318] border border-white/[0.08] rounded-2xl p-5">
          <p className="text-xs text-zinc-400">Active Showtimes</p>
          <p className="font-display text-3xl font-bold text-white mt-1 tabular-nums">
            {showtimes.length}
          </p>
        </div>
        <div className="bg-[#131318] border border-white/[0.08] rounded-2xl p-5">
          <p className="text-xs text-zinc-400">Confirmed Bookings</p>
          <p className="font-display text-3xl font-bold text-white mt-1 tabular-nums">
            {confirmedBookings.length}
          </p>
        </div>
        <div className="bg-[#131318] border border-white/[0.08] rounded-2xl p-5">
          <p className="text-xs text-zinc-400">Demo Revenue</p>
          <p className="font-display text-3xl font-bold text-white mt-1 tabular-nums">
            {formatCurrency(totalDemoRevenue)}
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-3">
        {(
          [
            { id: 'movies', label: 'Movies & AI Categorization' },
            { id: 'theatres', label: 'Theatres' },
            { id: 'showtimes', label: 'Showtimes' },
            { id: 'bookings', label: 'Bookings' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              tab === item.id
                ? 'bg-rose-600 text-white'
                : 'bg-[#131318] text-zinc-400 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: MOVIES & GEMINI AI CATEGORIZATION */}
      {tab === 'movies' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-xl font-bold text-white">
              Movie Catalog ({movies.length})
            </h2>
            <button
              onClick={startNewMovie}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Movie
            </button>
          </div>

          {editingMovie && (
            <form
              onSubmit={handleSaveMovie}
              className="bg-[#131318] border border-white/15 rounded-2xl p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <h3 className="font-display text-lg font-bold text-white">
                  {isNewMovie ? 'Add New Movie' : `Editing: ${editingMovie.title}`}
                </h3>
                <button
                  type="button"
                  onClick={handleRunAiCategorization}
                  disabled={aiRunning}
                  className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-200 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  {aiRunning ? 'Running Gemini AI...' : 'Run Gemini AI Categorization'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Movie Title</label>
                  <input
                    type="text"
                    required
                    value={editingMovie.title}
                    onChange={(e) =>
                      setEditingMovie({ ...editingMovie, title: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Poster Image URL</label>
                  <input
                    type="text"
                    required
                    value={editingMovie.posterUrl}
                    onChange={(e) =>
                      setEditingMovie({ ...editingMovie, posterUrl: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Synopsis</label>
                <textarea
                  rows={3}
                  required
                  value={editingMovie.synopsis}
                  onChange={(e) =>
                    setEditingMovie({ ...editingMovie, synopsis: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Language</label>
                  <select
                    value={editingMovie.language}
                    onChange={(e) =>
                      setEditingMovie({ ...editingMovie, language: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    min={30}
                    max={400}
                    value={editingMovie.durationMinutes}
                    onChange={(e) =>
                      setEditingMovie({
                        ...editingMovie,
                        durationMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Rating (0–10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={10}
                    value={editingMovie.rating}
                    onChange={(e) =>
                      setEditingMovie({ ...editingMovie, rating: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Official Certification</label>
                  <input
                    type="text"
                    required
                    value={editingMovie.officialCertification}
                    onChange={(e) =>
                      setEditingMovie({
                        ...editingMovie,
                        officialCertification: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Release Date</label>
                  <input
                    type="date"
                    required
                    value={editingMovie.releaseDate}
                    onChange={(e) =>
                      setEditingMovie({ ...editingMovie, releaseDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Status</label>
                  <select
                    value={editingMovie.status}
                    onChange={(e) =>
                      setEditingMovie({
                        ...editingMovie,
                        status: e.target.value as 'now_showing' | 'coming_soon',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                  >
                    <option value="now_showing">Now Showing</option>
                    <option value="coming_soon">Coming Soon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Cast (comma-separated)</label>
                  <input
                    type="text"
                    value={castInput}
                    onChange={(e) => setCastInput(e.target.value)}
                    placeholder="Actor One, Actor Two"
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                  />
                </div>
              </div>

              {/* Cities */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Available Cities</label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((city) => {
                    const checked = editingMovie.cities.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() =>
                          setEditingMovie({
                            ...editingMovie,
                            cities: checked
                              ? editingMovie.cities.filter((c) => c !== city)
                              : [...editingMovie.cities, city],
                          })
                        }
                        className={`px-3 py-1 rounded-lg text-xs border cursor-pointer ${
                          checked
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'bg-[#0D0D12] border-white/10 text-zinc-400'
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Categorization Review Block */}
              <div className="border-t border-white/[0.08] pt-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-rose-400">
                    Review & Edit AI-Generated Categorization
                  </p>
                  <label className="inline-flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingMovie.aiReviewedByAdmin}
                      onChange={(e) =>
                        setEditingMovie({
                          ...editingMovie,
                          aiReviewedByAdmin: e.target.checked,
                        })
                      }
                    />
                    Mark AI categories as admin-reviewed
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Primary Category</label>
                    <select
                      value={editingMovie.primaryCategory}
                      onChange={(e) =>
                        setEditingMovie({
                          ...editingMovie,
                          primaryCategory: e.target.value as MovieCategory,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                    >
                      {MOVIE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      AI Family-Friendly Tone Impression (Not Official Rating)
                    </label>
                    <select
                      value={editingMovie.aiFamilyFriendlyAssessment}
                      onChange={(e) =>
                        setEditingMovie({
                          ...editingMovie,
                          aiFamilyFriendlyAssessment: e.target.value as FamilyFriendlyAssessment,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                    >
                      <option value="likely_family_friendly">Likely Family-Friendly</option>
                      <option value="caution_advised">Caution Advised</option>
                      <option value="adult_themes">Adult Themes</option>
                      <option value="uncertain">Uncertain</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Secondary Categories</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOVIE_CATEGORIES.filter((c) => c !== editingMovie.primaryCategory).map((cat) => {
                      const active = editingMovie.secondaryCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            setEditingMovie({
                              ...editingMovie,
                              secondaryCategories: active
                                ? editingMovie.secondaryCategories.filter((c) => c !== cat)
                                : [...editingMovie.secondaryCategories, cat].slice(0, 3),
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs border cursor-pointer ${
                            active
                              ? 'bg-white/15 border-white/30 text-white'
                              : 'bg-[#0D0D12] border-white/10 text-zinc-400'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Mood Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={moodInput}
                      onChange={(e) => setMoodInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">AI Tone Disclaimer Note</label>
                    <input
                      type="text"
                      value={editingMovie.aiFamilyFriendlyNote}
                      onChange={(e) =>
                        setEditingMovie({
                          ...editingMovie,
                          aiFamilyFriendlyNote: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">AI Explanation</label>
                  <textarea
                    rows={2}
                    value={editingMovie.aiExplanation}
                    onChange={(e) =>
                      setEditingMovie({ ...editingMovie, aiExplanation: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Movie'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMovie(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#0D0D12] border border-white/10 text-zinc-300 text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Movies Table */}
          <div className="bg-[#131318] border border-white/[0.08] rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.08] text-xs text-zinc-400">
                <tr>
                  <th className="py-3.5 px-4">Movie</th>
                  <th className="py-3.5 px-4">AI Primary / Secondary</th>
                  <th className="py-3.5 px-4">Cert</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">AI Review</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {movies.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-medium text-white">{m.title}</td>
                    <td className="py-3 px-4 text-xs text-zinc-300">
                      <span className="text-rose-300 font-medium">{m.primaryCategory}</span>
                      {m.secondaryCategories.length > 0 && (
                        <span className="text-zinc-500"> · {m.secondaryCategories.join(', ')}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-zinc-300">
                      {m.officialCertification}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-300 capitalize">
                      {m.status.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className={m.aiReviewedByAdmin ? 'text-emerald-400' : 'text-amber-300'}>
                        {m.aiReviewedByAdmin ? 'Reviewed' : 'Pending Review'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => startEditMovie(m)}
                        className="p-2 rounded-lg bg-[#0D0D12] hover:bg-white/10 text-zinc-300 cursor-pointer"
                        aria-label={`Edit ${m.title}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMovie(m.id, m.title)}
                        className="p-2 rounded-lg bg-[#0D0D12] hover:bg-rose-600/20 text-zinc-400 hover:text-rose-300 cursor-pointer"
                        aria-label={`Delete ${m.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: THEATRES */}
      {tab === 'theatres' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleAddTheatre}
            className="lg:col-span-5 bg-[#131318] border border-white/[0.08] rounded-2xl p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-white">Add Theatre</h2>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Theatre Name</label>
              <input
                type="text"
                required
                value={theatreName}
                onChange={(e) => setTheatreName(e.target.value)}
                placeholder="Grand Cinema Complex"
                className="w-full px-3.5 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">City</label>
                <select
                  value={theatreCity}
                  onChange={(e) => setTheatreCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Screens</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={theatreScreens}
                  onChange={(e) => setTheatreScreens(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Address</label>
              <input
                type="text"
                required
                value={theatreAddress}
                onChange={(e) => setTheatreAddress(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Amenities</label>
              <input
                type="text"
                value={theatreAmenities}
                onChange={(e) => setTheatreAmenities(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              Add Theatre
            </button>
          </form>

          <div className="lg:col-span-7 bg-[#131318] border border-white/[0.08] rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.08] text-xs text-zinc-400">
                <tr>
                  <th className="py-3.5 px-4">Theatre</th>
                  <th className="py-3.5 px-4">City</th>
                  <th className="py-3.5 px-4">Screens</th>
                  <th className="py-3.5 px-4">Amenities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {theatres.map((th) => (
                  <tr key={th.id}>
                    <td className="py-3 px-4 font-medium text-white">{th.name}</td>
                    <td className="py-3 px-4 text-xs text-zinc-300">{th.city}</td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums text-zinc-300">
                      {th.screens}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-400">
                      {th.amenities.join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SHOWTIMES */}
      {tab === 'showtimes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleAddShowtime}
            className="lg:col-span-5 bg-[#131318] border border-white/[0.08] rounded-2xl p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-white">Schedule Showtime</h2>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Movie</label>
              <select
                value={stMovieId}
                onChange={(e) => setStMovieId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Theatre</label>
              <select
                value={stTheatreId}
                onChange={(e) => setStTheatreId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
              >
                {theatres.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.city})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={stDate}
                  onChange={(e) => setStDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Time</label>
                <input
                  type="text"
                  required
                  value={stTime}
                  onChange={(e) => setStTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Format</label>
                <input
                  type="text"
                  required
                  value={stFormat}
                  onChange={(e) => setStFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Screen</label>
                <input
                  type="text"
                  required
                  value={stScreen}
                  onChange={(e) => setStScreen(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Std Price</label>
                <input
                  type="number"
                  min={50}
                  value={stStdPrice}
                  onChange={(e) => setStStdPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Prem Price</label>
                <input
                  type="number"
                  min={50}
                  value={stPremPrice}
                  onChange={(e) => setStPremPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Fee/Ticket</label>
                <input
                  type="number"
                  min={0}
                  value={stFee}
                  onChange={(e) => setStFee(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/10 text-sm text-white tabular-nums"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              Add Showtime
            </button>
          </form>

          <div className="lg:col-span-7 bg-[#131318] border border-white/[0.08] rounded-2xl overflow-x-auto max-h-[560px]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.08] text-xs text-zinc-400 sticky top-0 bg-[#131318]">
                <tr>
                  <th className="py-3 px-4">Movie</th>
                  <th className="py-3 px-4">Theatre</th>
                  <th className="py-3 px-4">Slot</th>
                  <th className="py-3 px-4">Booked</th>
                  <th className="py-3 px-4 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {showtimes.slice(0, 60).map((st) => {
                  const mov = movies.find((m) => m.id === st.movieId);
                  const th = theatres.find((t) => t.id === st.theatreId);
                  return (
                    <tr key={st.id}>
                      <td className="py-2.5 px-4 text-xs font-medium text-white">
                        {mov?.title || st.movieId}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-zinc-300">
                        {th?.name || st.theatreId} ({st.city})
                      </td>
                      <td className="py-2.5 px-4 text-xs font-mono tabular-nums text-zinc-300">
                        {st.showDate} {st.showTime}
                      </td>
                      <td className="py-2.5 px-4 text-xs font-mono tabular-nums text-zinc-400">
                        {st.bookedSeats?.length ?? 0}/100
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={async () => {
                            await deleteShowtimeAdmin(st.id);
                            await onRefreshCatalog();
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-300 cursor-pointer"
                          aria-label="Delete showtime"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BOOKINGS */}
      {tab === 'bookings' && (
        <div className="bg-[#131318] border border-white/[0.08] rounded-2xl overflow-x-auto">
          {loadingBookings ? (
            <div className="p-8 text-center text-sm text-zinc-400">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="p-10 text-center text-sm text-zinc-400">
              No bookings recorded yet in Cloud Firestore.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.08] text-xs text-zinc-400">
                <tr>
                  <th className="py-3.5 px-4">Booking Code</th>
                  <th className="py-3.5 px-4">Guest</th>
                  <th className="py-3.5 px-4">Movie</th>
                  <th className="py-3.5 px-4">Showtime</th>
                  <th className="py-3.5 px-4">Seats</th>
                  <th className="py-3.5 px-4">Total (Demo)</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {bookings.map((bk) => (
                  <tr key={bk.id}>
                    <td className="py-3 px-4 font-mono text-xs text-rose-300">
                      {bk.bookingCode}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-200">{bk.userEmail}</td>
                    <td className="py-3 px-4 text-xs font-medium text-white">
                      {bk.movieTitle}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-300 tabular-nums">
                      {bk.showDate} {bk.showTime}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-zinc-200">
                      {bk.seats.join(', ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums text-white">
                      {formatCurrency(bk.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-xs capitalize text-emerald-400">
                      {bk.bookingStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
