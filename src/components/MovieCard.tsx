import { Star } from 'lucide-react';
import { PosterImage } from './PosterImage';
import type { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  subtitleNote?: string;
}

export function MovieCard({ movie, onSelect, subtitleNote }: MovieCardProps) {
  const hours = Math.floor(movie.durationMinutes / 60);
  const mins = movie.durationMinutes % 60;
  const formattedDuration = `${hours}h ${mins}m`;

  return (
    <article className="group flex flex-col bg-[#131318] border border-white/[0.08] rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:border-white/20">
      <button
        type="button"
        onClick={() => onSelect(movie)}
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#0E0E13] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
      >
        <PosterImage
          src={movie.posterUrl}
          alt={`${movie.title} theatrical poster`}
          title={movie.title}
          className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#131318] via-[#131318]/45 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-xs font-medium text-zinc-100">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {movie.rating.toFixed(1)}
          </span>
          <span className="text-zinc-300 font-mono text-[11px]">{movie.officialCertification}</span>
        </div>
      </button>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-400 truncate">
            {movie.primaryCategory}
            <span aria-hidden="true"> · </span>
            {movie.language}
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">{formattedDuration}</span>
          </p>
          <h3 className="font-display text-base font-semibold text-white mt-1 line-clamp-1">
            {movie.title}
          </h3>
          {subtitleNote && (
            <p className="text-xs text-rose-300/90 mt-1.5 line-clamp-2 leading-relaxed">
              {subtitleNote}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelect(movie)}
          className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          {movie.status === 'coming_soon' ? 'View Details' : 'Book Tickets'}
        </button>
      </div>
    </article>
  );
}
