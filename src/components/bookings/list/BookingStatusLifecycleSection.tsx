import { BookmarkCheck } from 'lucide-react';
import { BookingDrawerDetail } from './types';

interface BookingStatusLifecycleSectionProps {
  booking: BookingDrawerDetail;
  updating: boolean;
  onUpdateStatus: (
    bookingId: string,
    updates: { status?: string; paymentAction?: 'MARK_DEPOSIT_PAID' | 'MARK_ALL_PAID' | 'COMPLETE_FINANCIAL_CLOSURE' }
  ) => void;
}

export default function BookingStatusLifecycleSection({ booking, updating, onUpdateStatus }: BookingStatusLifecycleSectionProps) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <BookmarkCheck className="w-4 h-4 text-violet-400" /> Booking Status Lifecycle
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <button
          disabled={updating}
          onClick={() => onUpdateStatus(booking.id, { status: 'RESERVED' })}
          className={`p-2.5 rounded-lg text-xs font-bold transition-all text-left border ${
            booking.status === 'RESERVED'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
        >
          <span className="block">● RESERVED</span>
          <span className="text-[10px] font-normal text-zinc-500">Booking created</span>
        </button>

        <button
          disabled={updating}
          onClick={() => onUpdateStatus(booking.id, { paymentAction: 'MARK_DEPOSIT_PAID' })}
          className={`p-2.5 rounded-lg text-xs font-bold transition-all text-left border ${
            booking.status === 'CONFIRMED'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
        >
          <span className="block">● CONFIRMED</span>
          <span className="text-[10px] font-normal text-zinc-500">Initial deposit paid</span>
        </button>

        <button
          disabled={updating}
          onClick={() => onUpdateStatus(booking.id, { paymentAction: 'COMPLETE_FINANCIAL_CLOSURE' })}
          className={`p-2.5 rounded-lg text-xs font-bold transition-all text-left border ${
            booking.status === 'COMPLETED'
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
        >
          <span className="block">● COMPLETED</span>
          <span className="text-[10px] font-normal text-zinc-500">Event & financial closure</span>
        </button>

        <button
          disabled={updating}
          onClick={() => onUpdateStatus(booking.id, { status: 'WAITING_LIST' })}
          className={`p-2.5 rounded-lg text-xs font-bold transition-all text-left border ${
            booking.status === 'WAITING_LIST'
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
        >
          <span className="block">● WAITING LIST</span>
          <span className="text-[10px] font-normal text-zinc-500">Date conflict queue</span>
        </button>

        <button
          disabled={updating}
          onClick={() => onUpdateStatus(booking.id, { status: 'CANCELLED' })}
          className={`p-2.5 rounded-lg text-xs font-bold transition-all text-left border ${
            booking.status === 'CANCELLED'
              ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
        >
          <span className="block">● CANCELLED</span>
          <span className="text-[10px] font-normal text-zinc-500">Booking cancelled</span>
        </button>
      </div>
    </div>
  );
}
