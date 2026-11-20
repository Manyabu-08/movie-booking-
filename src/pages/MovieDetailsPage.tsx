import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Info,
  MapPin,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { PosterImage } from '../components/PosterImage';
import { CITIES, formatCurrency } from '../constants';
import type { Movie, Showtime, Theatre } from '../types';

interface MovieDetailsPageProps {
  movie: Movie;
  theatres: Theatre[];
  showtimes: Showtime[];
  selectedCity: string;
  onChangeCity: (city: string) => void;
  onBack: () => void;
  onSelectShowtime: (showtime: Showtime, theatre: Theatre) => void;
}

const FAMILY_LABELS: Record<Movie['aiFamilyFriendlyAssessment'], string> = {
  likely_family_friendly: 'Appears Family-Friendly (AI Tone Check)',
  caution_advised: 'Caution Advised (AI Tone Check)',
  adult_themes: 'Mature Themes Detected (AI Tone Check)',
  uncertain: 'Tone Uncertain (AI Tone Check)',
};

export function MovieDetailsPage({
  movie,
  theatres,
  showtimes,
  selectedCity,
  onChangeCity,
  onBack,
  onSelectShowtime,
}: MovieDetailsPageProps) {
  const movieShowtimes = useMemo(
    () => showtimes.filter((s) => s.movieId === movie.id && s.city === selectedCity),
    [showtimes, movie.id, selectedCity]
  );

  const availableDates = useMemo(
    () => Array.from(new Set(movieShowtimes.map((s) => s.showDate))).sort(),
    [movieShowtimes]
  );

  const [selectedDate, setSelectedDate] = useState<string>('');
  const activeDate =
    selectedDate && availableDates.includes(selectedDate)
      ? selectedDate
      : availableDates[0] ?? '';

  const showtimesByTheatre = useMemo(() => {
    const groups = new Map<string, { theatre: Theatre; slots: Showtime[] }>();
    for (const st of movieShowtimes) {
      if (activeDate && st.showDate !== activeDate) continue;
      const theatre = theatres.find((t) => t.id === st.theatreId);
      if (!theatre) continue;
      const existing = groups.get(theatre.id);
      if (existing) {
        existing.slots.push(st);
      } else {
        groups.set(theatre.id, { theatre, slots: [st] });
      }
    }
    return Array.from(groups.values());
  }, [movieShowtimes, theatres, activeDate]);

  const hours = Math.floor(movie.durationMinutes / 60);
  const mins = movie.durationMinutes % 60;

  return (
    <div className="space-y-12 pb-16">
      {/* Cinematic Backdrop Header */}
      <section className="relative bg-[#0D0D12] border-b border-white/[0.08] overflow-hidden">
        <div className="absolute inset-0">
          <PosterImage
            src={movie.bannerUrl || movie.posterUrl}
            alt={`${movie.title} cinematic banner`}
            title={movie.title}
            aspect="banner"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0D] via-[#0A0A0D]/75 to-black/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to movies
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-48 sm:w-56 shrink-0 aspect-[3/4] rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#131318]">
              <PosterImage
                src={movie.posterUrl}
                alt={`${movie.title} poster`}
                title={movie.title}
                className="w-full h-full"
              />
            </div>

            <div className="flex-1 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-medium text-rose-400">
                  {movie.status === 'coming_soon' ? 'Coming Soon' : 'Now Showing'}
                  <span aria-hidden="true"> · </span>
                  {movie.releaseDate}
                </p>
                <h1 className="font-display text-3xl sm:text-5xl font-bold text-white text-balance">
                  {movie.title}
                </h1>
                <p className="text-sm text-zinc-300">
                  {movie.primaryCategory}
                  {movie.secondaryCategories.length > 0 && ` / ${movie.secondaryCategories.join(' / ')}`}
                  <span aria-hidden="true"> · </span>
                  {movie.language}
                  <span aria-hidden="true"> · </span>
                  <span className="tabular-nums">
                    {hours}h {mins}m
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-white font-semibold tabular-nums">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {movie.rating.toFixed(1)} / 10
                </div>
                <div className="text-zinc-300">
                  Official Certification:{' '}
                  <span className="font-mono font-semibold text-white">
                    {movie.officialCertification}
                  </span>
                </div>
                {movie.trailerUrl && (
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-medium"
                  >
                    Watch Trailer
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <p className="text-sm sm:text-base text-zinc-200 leading-relaxed max-w-3xl">
                {movie.synopsis}
              </p>

              {/* Cast */}
              {movie.cast.length > 0 && (
                <div className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <Users className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white font-medium">Cast:</strong>{' '}
                    {movie.cast.join(', ')}
                  </span>
                </div>
              )}

              {/* Gemini AI Categorization Panel */}
              <div className="rounded-2xl bg-[#131318]/90 border border-white/10 p-4 sm:p-5 space-y-2.5 max-w-3xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-rose-400 inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Gemini AI Story Categorization
                  </p>
                  <span className="text-xs text-zinc-400">
                    {FAMILY_LABELS[movie.aiFamilyFriendlyAssessment]}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {movie.aiExplanation}
                </p>
                <p className="text-xs text-zinc-400">
                  Moods: {movie.moodTags.join(' · ')}
                </p>
                <p className="text-[11px] text-zinc-500 inline-flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {movie.aiFamilyFriendlyNote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Theatre & Showtime Selection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Select Theatre & Showtime
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Choose your city, screening date, and preferred format to pick seats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <MapPin className="w-4 h-4 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedCity}
                onChange={(e) => {
                  onChangeCity(e.target.value);
                  setSelectedDate('');
                }}
                aria-label="Choose city"
                className="pl-9 pr-4 py-2 rounded-xl bg-[#131318] border border-white/10 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date Tabs */}
        {availableDates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableDates.map((dateStr) => {
              const active = dateStr === activeDate;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                    active
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#131318] border border-white/10 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="tabular-nums">{dateStr}</span>
                </button>
              );
            })}
          </div>
        )}

        {movie.status === 'coming_soon' ? (
          <div className="rounded-2xl bg-[#131318] border border-white/10 p-8 text-center space-y-2">
            <p className="text-base font-semibold text-white">
              Advance Booking Opens Soon
            </p>
            <p className="text-sm text-zinc-400">
              {movie.title} releases on {movie.releaseDate}. Showtimes will appear here once scheduled by theatres.
            </p>
          </div>
        ) : showtimesByTheatre.length === 0 ? (
          <div className="rounded-2xl bg-[#131318] border border-white/10 p-8 text-center space-y-2">
            <p className="text-base font-semibold text-white">
              No showtimes scheduled in {selectedCity}
            </p>
            <p className="text-sm text-zinc-400">
              Available in: {movie.cities.join(', ')}. Switch cities above to view screenings.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {showtimesByTheatre.map(({ theatre, slots }) => (
              <div
                key={theatre.id}
                className="rounded-2xl bg-[#131318] border border-white/[0.08] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="space-y-1.5">
                  <h3 className="font-display text-lg font-semibold text-white">
                    {theatre.name}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {theatre.address}
                    <span aria-hidden="true"> · </span>
                    {theatre.amenities.join(' · ')}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {slots.map((slot) => {
                    const availableCount = Math.max(0, 100 - (slot.bookedSeats?.length ?? 0));
                    return (
                      <button
                        key={slot.id}
                        onClick={() => onSelectShowtime(slot, theatre)}
                        className="px-4 py-2.5 rounded-xl bg-[#0D0D12] hover:bg-rose-600/15 border border-white/15 hover:border-rose-500 text-left transition-colors cursor-pointer min-w-[140px]"
                      >
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-white tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-rose-400" />
                          {slot.showTime}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {slot.format} · {formatCurrency(slot.standardPrice)}+
                        </p>
                        <p className="text-[11px] text-emerald-400 mt-0.5 tabular-nums">
                          {availableCount} seats open
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
