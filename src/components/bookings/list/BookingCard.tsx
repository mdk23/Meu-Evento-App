import Link from 'next/link';
import { Loader2, Calendar, Users, Trash2, CreditCard, Edit3, ChevronRight } from 'lucide-react';
import { BookingListDTO } from '@/types/dtos';

interface BookingCardProps {
  booking: BookingListDTO;
  isDeleting: boolean;
  updating: boolean;
  onUpdateStatus: (
    bookingId: string,
    updates: { status?: string; paymentAction?: 'MARK_DEPOSIT_PAID' | 'MARK_ALL_PAID' | 'COMPLETE_FINANCIAL_CLOSURE' }
  ) => void;
  onDeletePrompt: (bookingId: string, clientName: string) => void;
}

export default function BookingCard({ booking: b, isDeleting, updating, onUpdateStatus, onDeletePrompt }: BookingCardProps) {
  const contractAmt = b.totalContractAmount || 0;
  const paidAmt = b.paidAmount || 0;
  const isFullyPaid = contractAmt > 0 && paidAmt >= contractAmt;
  const depositAmt = b.downPaymentAmount || 0;
  const depositPct = b.downPaymentPercent || 50;
  const depositIsPaid = b.depositStatus === 'PAID' || b.status === 'CONFIRMED' || b.status === 'COMPLETED';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
            {b.bookingType?.replace('_', ' ') || 'SPACE AND SERVICES'}
          </span>

          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              b.status === 'CONFIRMED'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : b.status === 'COMPLETED'
                ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                : b.status === 'CANCELLED'
                ? 'text-red-400 bg-red-500/10 border-red-500/20'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            }`}
          >
            ● {b.status || 'RESERVED'}
          </span>
        </div>

        <div>
          <h3 className="text-white font-bold text-lg">
            {b.clientName || 'Client Name'}
          </h3>
          <p className="text-xs text-zinc-500">{b.eventTitle || b.clientEmail || b.clientPhone || 'Direct Client'}</p>
        </div>

        <div className="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800">
          <p className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-violet-400" /> Event Date:{' '}
            <strong className="text-zinc-200">{new Date(b.eventDate).toLocaleDateString()}</strong>
          </p>
          <p className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-violet-400" /> Guest Count:{' '}
            <strong className="text-zinc-200">{b.guestCount} pax</strong>
          </p>
          {contractAmt > 0 && (
            <p className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-violet-400" /> Total Contract:{' '}
              <strong className="text-white font-bold">{contractAmt.toLocaleString()} MT</strong>
              {isFullyPaid && (
                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  Fully Paid
                </span>
              )}
            </p>
          )}

          {depositAmt > 0 && (
            <div className="flex items-center justify-between text-[11px] bg-zinc-950/80 px-2.5 py-1.5 rounded-lg border border-zinc-800/80 mt-1">
              <span className="text-zinc-400">
                Initial Deposit: <strong className="text-zinc-200">{depositAmt.toLocaleString()} MT</strong> ({depositPct}%)
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  depositIsPaid
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                }`}
              >
                {depositIsPaid ? '● PAID' : '● PENDING'}
              </span>
            </div>
          )}
        </div>

        {b.notes && (
          <p className="text-[11px] text-zinc-500 line-clamp-2 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80 font-mono">
            {b.notes}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Link
            href={`/bookings/${b.id}/edit`}
            className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg border border-violet-500/20 transition-all"
          >
            Edit Services <Edit3 className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/bookings/${b.id}/payments`}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all"
          >
            Payments <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {b.status === 'RESERVED' && (
            <button
              disabled={updating}
              onClick={() => onUpdateStatus(b.id, { paymentAction: 'MARK_DEPOSIT_PAID' })}
              className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg transition-all"
              title="Record Deposit & Confirm Booking"
            >
              Record Deposit
            </button>
          )}

          {b.status === 'CONFIRMED' && (
            <button
              disabled={updating}
              onClick={() => onUpdateStatus(b.id, { paymentAction: 'COMPLETE_FINANCIAL_CLOSURE' })}
              className="text-[11px] font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2.5 py-1.5 rounded-lg transition-all"
              title="Complete Booking & Closure"
            >
              Complete Closure
            </button>
          )}

          <button
            disabled={isDeleting}
            onClick={() => onDeletePrompt(b.id, b.clientName || 'Client')}
            className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            title="Delete Booking"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
