import { ArrowLeft, CheckCircle2, Clapperboard, Printer, Ticket } from 'lucide-react';
import { PosterImage } from '../components/PosterImage';
import { QrCodeCanvas } from '../components/QrCodeCanvas';
import { formatCurrency } from '../constants';
import type { Booking } from '../types';

interface TicketPageProps {
  booking: Booking;
  onViewBookings: () => void;
  onBackHome: () => void;
}

export function TicketPage({ booking, onViewBookings, onBackHome }: TicketPageProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBackHome}
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#131318] border border-white/10 text-xs font-medium text-zinc-200 hover:text-white cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Ticket
        </button>
      </div>

      <div className="rounded-3xl bg-[#131318] border border-white/15 overflow-hidden shadow-2xl">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <Clapperboard className="w-4 h-4" />
            <span className="font-display font-bold tracking-tight">CineBook AI</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
            <CheckCircle2 className="w-4 h-4" />
            {booking.bookingStatus === 'confirmed' ? 'Booking Confirmed' : 'Cancelled'}
          </span>
        </div>

        {/* Movie Details */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
          <div className="w-28 sm:w-32 shrink-0 aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-[#0D0D12]">
            <PosterImage
              src={booking.posterUrl}
              alt={`${booking.movieTitle} poster`}
              title={booking.movieTitle}
              className="w-full h-full"
            />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-rose-400 font-medium">{booking.format}</p>
              <h1 className="font-display text-2xl font-bold text-white mt-0.5">
                {booking.movieTitle}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:text-sm pt-1">
              <div>
                <p className="text-zinc-500 text-xs">Theatre</p>
                <p className="text-zinc-100 font-medium">{booking.theatreName}</p>
                <p className="text-zinc-400 text-xs">{booking.city}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Date & Time</p>
                <p className="text-zinc-100 font-medium tabular-nums">{booking.showDate}</p>
                <p className="text-zinc-400 text-xs tabular-nums">
                  {booking.showTime} · {booking.screenName}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Seats</p>
                <p className="font-mono text-white font-semibold">
                  {booking.seats.join(', ')}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Total Paid (Demo)</p>
                <p className="font-mono text-white font-semibold tabular-nums">
                  {formatCurrency(booking.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Perforation Divider */}
        <div className="relative border-t border-dashed border-white/15 mx-6" />

        {/* QR & Reference Section */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-xs text-zinc-400">Booking Reference ID</p>
            <p className="font-mono text-xl font-bold text-white tracking-wider">
              {booking.bookingCode}
            </p>
            <p className="text-xs text-zinc-500 font-mono">
              Payment Ref: {booking.paymentId}
            </p>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
              Present this QR code at the theatre kiosk for contactless entry.
            </p>
          </div>

          <div className="shrink-0">
            <QrCodeCanvas value={booking.qrReference} size={136} />
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onViewBookings}
          className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
        >
          <Ticket className="w-4 h-4" />
          Go to My Bookings
        </button>
      </div>
    </div>
  );
}
