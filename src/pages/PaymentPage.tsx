import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { formatCurrency } from '../constants';
import { processDemoPaymentOnServer } from '../lib/api';
import { friendlyErrorMessage } from '../lib/firestoreError';
import {
  confirmBookingTransaction,
  releaseSeatHoldTransaction,
} from '../lib/firestoreService';
import type {
  Booking,
  Movie,
  SeatReservation,
  Showtime,
  Theatre,
  UserProfile,
} from '../types';

interface PaymentPageProps {
  reservation: SeatReservation;
  movie: Movie;
  theatre: Theatre;
  showtime: Showtime;
  user: User;
  profile: UserProfile | null;
  onCancelReservation: () => void;
  onBookingConfirmed: (booking: Booking) => void;
}

export function PaymentPage({
  reservation,
  movie,
  theatre,
  showtime,
  user,
  profile,
  onCancelReservation,
  onBookingConfirmed,
}: PaymentPageProps) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((reservation.expiresAtMs - Date.now()) / 1000))
  );
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((reservation.expiresAtMs - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0 && !expired) {
        setExpired(true);
        releaseSeatHoldTransaction({
          reservationId: reservation.id,
          showtimeId: showtime.id,
          seats: reservation.seats,
          nextStatus: 'expired',
        }).catch(() => {});
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [reservation.expiresAtMs, reservation.id, reservation.seats, showtime.id, expired]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  async function handleDemoPayment(outcome: 'success' | 'fail') {
    if (expired || secondsLeft <= 0) {
      setError('Your seat reservation has expired. Please return and select seats again.');
      return;
    }

    setError('');
    setProcessing(true);
    try {
      const paymentRes = await processDemoPaymentOnServer({
        reservationId: reservation.id,
        showtimeId: showtime.id,
        seats: reservation.seats,
        standardPrice: showtime.standardPrice,
        premiumPrice: showtime.premiumPrice,
        convenienceFeePerTicket: showtime.convenienceFeePerTicket,
        simulateOutcome: outcome,
      });

      const booking = await confirmBookingTransaction({
        reservationId: reservation.id,
        showtimeId: showtime.id,
        userId: user.uid,
        userEmail: user.email ?? 'guest@cinebook.ai',
        userName: profile?.displayName || user.displayName || 'Cinema Guest',
        movie,
        theatre,
        showtime,
        seats: reservation.seats,
        ticketAmount: paymentRes.ticketAmount,
        convenienceFee: paymentRes.convenienceFee,
        totalAmount: paymentRes.totalAmount,
        paymentId: paymentRes.paymentId,
        bookingCode: paymentRes.bookingCode,
        qrReference: paymentRes.qrReference,
      });

      onBookingConfirmed(booking);
    } catch (err) {
      const msg = friendlyErrorMessage(err);
      setError(msg);
      if (outcome === 'fail') {
        await releaseSeatHoldTransaction({
          reservationId: reservation.id,
          showtimeId: showtime.id,
          seats: reservation.seats,
          nextStatus: 'cancelled',
        }).catch(() => {});
      }
    } finally {
      setProcessing(false);
    }
  }

  async function handleCancelHold() {
    setProcessing(true);
    try {
      await releaseSeatHoldTransaction({
        reservationId: reservation.id,
        showtimeId: showtime.id,
        seats: reservation.seats,
        nextStatus: 'cancelled',
      });
    } catch {
      // Proceed back even if hold was already released
    } finally {
      setProcessing(false);
      onCancelReservation();
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <button
        onClick={handleCancelHold}
        disabled={processing}
        className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Release seats & go back
      </button>

      {/* Clear Demo Payment Banner */}
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-200">
            Demo Payment — No Real Money Charged
          </p>
          <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
            This checkout uses a simulated demo payment gateway. Do not enter real card information. You can test both successful confirmation and simulated payment decline below.
          </p>
        </div>
      </div>

      {/* Checkout Card */}
      <div className="bg-[#131318] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <p className="text-xs text-zinc-400">Reservation ID</p>
            <p className="font-mono text-xs text-zinc-200 mt-0.5">{reservation.id}</p>
          </div>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono tabular-nums ${
              expired
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-[#0D0D12] border-white/10 text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            {expired
              ? 'Hold Expired'
              : `Hold expires in ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Movie</span>
            <span className="font-semibold text-white text-right">{movie.title}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Theatre</span>
            <span className="text-zinc-200 text-right">
              {theatre.name}, {showtime.city}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Showtime</span>
            <span className="text-zinc-200 text-right tabular-nums">
              {showtime.showDate} · {showtime.showTime} ({showtime.format})
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400">Seats</span>
            <span className="font-mono text-white text-right">
              {reservation.seats.join(', ')}
            </span>
          </div>
        </div>

        <div className="border-t border-white/[0.08] pt-4 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Ticket Amount</span>
            <span className="font-mono tabular-nums text-zinc-200">
              {formatCurrency(reservation.ticketAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Convenience Fee</span>
            <span className="font-mono tabular-nums text-zinc-200">
              {formatCurrency(reservation.convenienceFee)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
            <span className="font-semibold text-white text-base">Total Amount</span>
            <span className="font-display text-2xl font-bold text-white tabular-nums">
              {formatCurrency(reservation.totalAmount)}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={processing || expired}
            onClick={() => handleDemoPayment('success')}
            className="py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {processing ? 'Confirming Booking...' : 'Demo Pay Now'}
          </button>

          <button
            type="button"
            disabled={processing || expired}
            onClick={() => handleDemoPayment('fail')}
            className="py-3 px-5 rounded-xl bg-[#0D0D12] hover:bg-white/[0.06] border border-white/15 text-zinc-200 text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-4 h-4 text-zinc-400" />
            Simulate Payment Failure
          </button>
        </div>
      </div>
    </div>
  );
}
