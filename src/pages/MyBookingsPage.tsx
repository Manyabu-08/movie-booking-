import { Calendar, MapPin, Ticket } from 'lucide-react';
import type { User } from 'firebase/auth';
import { PosterImage } from '../components/PosterImage';
import { formatCurrency } from '../constants';
import type { Booking } from '../types';

interface MyBookingsPageProps {
  user: User | null;
  bookings: Booking[];
  loading: boolean;
  onOpenAuth: () => void;
  onSelectBooking: (booking: Booking) => void;
  onBrowseMovies: () => void;
}

export function MyBookingsPage({
  user,
  bookings,
  loading,
  onOpenAuth,
  onSelectBooking,
  onBrowseMovies,
}: MyBookingsPageProps) {
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-[#131318] border border-white/10 rounded-2xl p-10 text-center space-y-4">
          <Ticket className="w-10 h-10 text-rose-400 mx-auto" />
          <h1 className="font-display text-2xl font-bold text-white">
            Sign in to view your tickets
          </h1>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Your confirmed bookings, digital QR passes, and seating details are stored securely in your private CineBook AI account.
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">My Bookings</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Access your confirmed cinema passes and digital QR tickets.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-[#131318] animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-[#131318] border border-white/10 rounded-2xl p-10 text-center space-y-4">
          <p className="text-base font-semibold text-white">No bookings yet</p>
          <p className="text-sm text-zinc-400">
            Explore what is playing now and book your first showtime.
          </p>
          <button
            onClick={onBrowseMovies}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold cursor-pointer"
          >
            Browse Movies
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((bk) => (
            <div
              key={bk.id}
              className="bg-[#131318] border border-white/[0.08] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 shrink-0 aspect-[3/4] rounded-xl overflow-hidden bg-[#0D0D12]">
                  <PosterImage
                    src={bk.posterUrl}
                    alt={`${bk.movieTitle} poster`}
                    title={bk.movieTitle}
                    className="w-full h-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-rose-400 font-semibold">
                      {bk.bookingCode}
                    </span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span className="text-emerald-400 font-medium capitalize">
                      {bk.bookingStatus}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-white">
                    {bk.movieTitle}
                  </h2>
                  <p className="text-xs text-zinc-400 inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {bk.theatreName}, {bk.city}
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3.5 h-3.5" />
                      {bk.showDate} at {bk.showTime}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-300 font-mono">
                    Seats: {bk.seats.join(', ')} · Paid {formatCurrency(bk.totalAmount)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSelectBooking(bk)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center"
              >
                View Digital Ticket
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
