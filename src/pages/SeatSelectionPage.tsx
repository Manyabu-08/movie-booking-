import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Armchair, Lock } from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  formatCurrency,
  isPremiumSeat,
  SEAT_ROWS,
  SEATS_PER_ROW,
} from '../constants';
import { calculatePricingOnServer } from '../lib/api';
import { friendlyErrorMessage } from '../lib/firestoreError';
import { holdSeatsTransaction, subscribeShowtime } from '../lib/firestoreService';
import type { Movie, SeatReservation, Showtime, Theatre } from '../types';

interface SeatSelectionPageProps {
  movie: Movie;
  theatre: Theatre;
  initialShowtime: Showtime;
  user: User | null;
  onBack: () => void;
  onRequireAuth: () => void;
  onReservationCreated: (reservation: SeatReservation, latestShowtime: Showtime) => void;
}

export function SeatSelectionPage({
  movie,
  theatre,
  initialShowtime,
  user,
  onBack,
  onRequireAuth,
  onReservationCreated,
}: SeatSelectionPageProps) {
  const [liveShowtime, setLiveShowtime] = useState<Showtime>(initialShowtime);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [serverTotals, setServerTotals] = useState<{
    ticketAmount: number;
    convenienceFee: number;
    totalAmount: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = subscribeShowtime(initialShowtime.id, (updated) => {
      if (updated) {
        setLiveShowtime(updated);
        // Automatically deselect if another user booked a seat we had clicked locally
        const booked = new Set(updated.bookedSeats ?? []);
        const now = Date.now();
        setSelectedSeats((prev) =>
          prev.filter((seat) => {
            if (booked.has(seat)) return false;
            const held = updated.heldSeats?.[seat];
            if (held && held.expiresAtMs > now && held.holderUid !== user?.uid) {
              return false;
            }
            return true;
          })
        );
      }
    });
    return () => unsub();
  }, [initialShowtime.id, user?.uid]);

  const localPricing = useMemo(() => {
    let ticketAmount = 0;
    for (const s of selectedSeats) {
      ticketAmount += isPremiumSeat(s)
        ? liveShowtime.premiumPrice
        : liveShowtime.standardPrice;
    }
    const convenienceFee = selectedSeats.length * liveShowtime.convenienceFeePerTicket;
    return {
      ticketAmount,
      convenienceFee,
      totalAmount: ticketAmount + convenienceFee,
    };
  }, [selectedSeats, liveShowtime]);

  useEffect(() => {
    if (selectedSeats.length === 0) {
      setServerTotals(null);
      return;
    }
    let active = true;
    calculatePricingOnServer({
      seats: selectedSeats,
      standardPrice: liveShowtime.standardPrice,
      premiumPrice: liveShowtime.premiumPrice,
      convenienceFeePerTicket: liveShowtime.convenienceFeePerTicket,
    })
      .then((res) => {
        if (active) setServerTotals(res);
      })
      .catch(() => {
        if (active) setServerTotals(null);
      });
    return () => {
      active = false;
    };
  }, [selectedSeats, liveShowtime]);

  const pricing = serverTotals ?? localPricing;
  const bookedSet = new Set(liveShowtime.bookedSeats ?? []);
  const nowMs = Date.now();

  function toggleSeat(seatCode: string) {
    setError('');
    if (bookedSet.has(seatCode)) return;
    const held = liveShowtime.heldSeats?.[seatCode];
    if (held && held.expiresAtMs > nowMs && held.holderUid !== user?.uid) return;

    setSelectedSeats((prev) => {
      if (prev.includes(seatCode)) {
        return prev.filter((s) => s !== seatCode);
      }
      if (prev.length >= 10) {
        setError('You can select up to 10 seats per booking.');
        return prev;
      }
      return [...prev, seatCode].sort();
    });
  }

  async function handleProceedToPayment() {
    setError('');
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!user.emailVerified) {
      setError('Please verify your email address (or sign in with Google) before locking seats.');
      return;
    }
    if (selectedSeats.length === 0) {
      setError('Select at least one seat to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const verifiedTotals = await calculatePricingOnServer({
        seats: selectedSeats,
        standardPrice: liveShowtime.standardPrice,
        premiumPrice: liveShowtime.premiumPrice,
        convenienceFeePerTicket: liveShowtime.convenienceFeePerTicket,
      });

      const reservation = await holdSeatsTransaction({
        userId: user.uid,
        showtimeId: liveShowtime.id,
        movieId: movie.id,
        theatreId: theatre.id,
        seats: selectedSeats,
        ticketAmount: verifiedTotals.ticketAmount,
        convenienceFee: verifiedTotals.convenienceFee,
        totalAmount: verifiedTotals.totalAmount,
      });

      onReservationCreated(reservation, liveShowtime);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Change showtime
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {movie.title}
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {theatre.name} · {liveShowtime.city} · {liveShowtime.showDate} at {liveShowtime.showTime} · {liveShowtime.format}
          </p>
        </div>

        <div className="text-left sm:text-right text-xs text-zinc-400 space-y-0.5">
          <p>
            Standard (Rows A–G):{' '}
            <span className="font-mono text-zinc-200 tabular-nums">
              {formatCurrency(liveShowtime.standardPrice)}
            </span>
          </p>
          <p>
            Premium Recliner (Rows H–J):{' '}
            <span className="font-mono text-amber-300 tabular-nums">
              {formatCurrency(liveShowtime.premiumPrice)}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Auditorium Seat Map */}
        <div className="lg:col-span-8 bg-[#131318] border border-white/[0.08] rounded-2xl p-5 sm:p-7 space-y-8 overflow-x-auto">
          {/* Screen Illustration */}
          <div className="max-w-xl mx-auto text-center space-y-2">
            <div className="h-3 w-full rounded-t-full bg-gradient-to-b from-rose-400/70 to-transparent border-t-2 border-rose-400 shadow-[0_-10px_28px_rgba(244,63,94,0.35)]" />
            <p className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
              Screen This Way · {liveShowtime.screenName}
            </p>
          </div>

          {/* Seat Rows A–J */}
          <div className="min-w-[540px] max-w-2xl mx-auto space-y-2.5">
            {SEAT_ROWS.map((row) => {
              const premiumRow = isPremiumSeat(row);
              return (
                <div key={row}>
                  {row === 'H' && (
                    <div className="flex items-center gap-3 my-4 text-xs text-amber-300/90">
                      <div className="flex-1 h-px bg-amber-500/25" />
                      <span className="font-medium">
                        Premium Recliners ({formatCurrency(liveShowtime.premiumPrice)})
                      </span>
                      <div className="flex-1 h-px bg-amber-500/25" />
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3">
                    <span className="w-6 text-xs font-mono text-zinc-500 text-right">
                      {row}
                    </span>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: SEATS_PER_ROW }).map((_, idx) => {
                        const seatNum = idx + 1;
                        const seatCode = `${row}${seatNum}`;
                        const isBooked = bookedSet.has(seatCode);
                        const held = liveShowtime.heldSeats?.[seatCode];
                        const isHeldByOther = Boolean(
                          held && held.expiresAtMs > nowMs && held.holderUid !== user?.uid
                        );
                        const isSelected = selectedSeats.includes(seatCode);

                        let seatClasses =
                          'bg-[#1B1B24] border-white/15 text-zinc-300 hover:border-rose-400 hover:text-white';
                        if (premiumRow && !isBooked && !isHeldByOther && !isSelected) {
                          seatClasses =
                            'bg-amber-500/10 border-amber-400/35 text-amber-200 hover:border-amber-300';
                        }
                        if (isSelected) {
                          seatClasses =
                            'bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-950/60';
                        } else if (isBooked) {
                          seatClasses =
                            'bg-zinc-800/80 border-zinc-700/60 text-zinc-600 cursor-not-allowed';
                        } else if (isHeldByOther) {
                          seatClasses =
                            'bg-sky-950/60 border-sky-500/40 text-sky-400 cursor-not-allowed';
                        }

                        return (
                          <div key={seatCode} className={seatNum === 6 ? 'ml-4' : ''}>
                            <button
                              type="button"
                              disabled={isBooked || isHeldByOther}
                              onClick={() => toggleSeat(seatCode)}
                              aria-label={`Seat ${seatCode} ${
                                isBooked
                                  ? 'Booked'
                                  : isHeldByOther
                                    ? 'Temporarily held'
                                    : isSelected
                                      ? 'Selected'
                                      : premiumRow
                                        ? 'Available Premium'
                                        : 'Available Standard'
                              }`}
                              className={`w-9 h-9 rounded-lg border text-[11px] font-mono tabular-nums font-medium flex items-center justify-center transition-colors cursor-pointer ${seatClasses}`}
                            >
                              {isBooked ? '×' : seatNum}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <span className="w-6 text-xs font-mono text-zinc-500">{row}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seat Legend (Color + Text Labels) */}
          <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-300">
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#1B1B24] border border-white/20" />
              Standard
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-amber-500/15 border border-amber-400/40" />
              Premium
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-rose-600 border border-rose-400" />
              Selected
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-sky-950/70 border border-sky-500/40" />
              On Hold
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700 text-[10px] flex items-center justify-center text-zinc-500">
                ×
              </span>
              Booked
            </span>
          </div>
        </div>

        {/* Summary & Checkout Trigger */}
        <aside className="lg:col-span-4 bg-[#131318] border border-white/[0.08] rounded-2xl p-6 space-y-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2.5">
            <Armchair className="w-5 h-5 text-rose-400" />
            <h2 className="font-display text-xl font-bold text-white">Booking Summary</h2>
          </div>

          <div className="space-y-3 text-sm border-y border-white/[0.08] py-4">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">Selected Seats</span>
              <span className="font-mono text-white text-right">
                {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">
                Tickets ({selectedSeats.length})
              </span>
              <span className="font-mono text-zinc-100 tabular-nums">
                {formatCurrency(pricing.ticketAmount)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">Convenience Fee</span>
              <span className="font-mono text-zinc-100 tabular-nums">
                {formatCurrency(pricing.convenienceFee)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-white">Total Payable</span>
            <span className="font-display text-2xl font-bold text-white tabular-nums">
              {formatCurrency(pricing.totalAmount)}
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={submitting || selectedSeats.length === 0}
            onClick={handleProceedToPayment}
            className="w-full py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            {submitting
              ? 'Locking Seats...'
              : user
                ? 'Continue to Payment'
                : 'Sign In & Continue'}
          </button>

          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Seats are reserved atomically in Cloud Firestore for 7 minutes while you complete the simulated demo payment.
          </p>
        </aside>
      </div>
    </div>
  );
}
