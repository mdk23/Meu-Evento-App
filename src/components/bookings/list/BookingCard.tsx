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

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: 'b-ok',
  COMPLETED: 'b-info',
  CANCELLED: 'b-bad',
  RESERVED: 'b-warn',
  WAITING_LIST: 'b-mute',
};

export default function BookingCard({ booking: b, isDeleting, updating, onUpdateStatus, onDeletePrompt }: BookingCardProps) {
  const contractAmt = b.totalContractAmount || 0;
  const paidAmt = b.paidAmount || 0;
  const isFullyPaid = contractAmt > 0 && paidAmt >= contractAmt;
  const depositAmt = b.downPaymentAmount || 0;
  const depositPct = b.downPaymentPercent || 50;
  const depositIsPaid = b.depositStatus === 'PAID' || b.status === 'CONFIRMED' || b.status === 'COMPLETED';
  const statusBadge = STATUS_BADGE[b.status] || 'b-warn';

  return (
    <div className="card plain flex flex-col justify-between" style={{ gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="flex justify-between items-start">
          <span className="badge b-accent">{b.bookingType?.replace('_', ' ') || 'SPACE AND SERVICES'}</span>
          <span className={`badge ${statusBadge}`}>{b.status || 'RESERVED'}</span>
        </div>

        <div>
          <h3 className="h-sm">{b.clientName || 'Client Name'}</h3>
          <p className="mini dim">{b.eventTitle || b.clientEmail || b.clientPhone || 'Direct Client'}</p>
        </div>

        <div className="mini dim" style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, borderTop: '1px solid var(--rule)' }}>
          <p className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> Event Date:{' '}
            <strong style={{ color: 'var(--ink)' }}>{new Date(b.eventDate).toLocaleDateString()}</strong>
          </p>
          <p className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> Guest Count:{' '}
            <strong style={{ color: 'var(--ink)' }}>{b.guestCount} pax</strong>
          </p>
          {contractAmt > 0 && (
            <p className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> Total Contract:{' '}
              <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{contractAmt.toLocaleString()} MT</strong>
              {isFullyPaid && <span className="badge b-ok" style={{ padding: '2px 8px' }}>Fully Paid</span>}
            </p>
          )}

          {depositAmt > 0 && (
            <div
              className="flex items-center justify-between"
              style={{ background: 'var(--bg-deep)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', marginTop: 4 }}
            >
              <span>
                Initial Deposit: <strong style={{ color: 'var(--ink)' }}>{depositAmt.toLocaleString()} MT</strong> ({depositPct}%)
              </span>
              <span className={`badge ${depositIsPaid ? 'b-ok' : 'b-warn'}`} style={{ padding: '2px 8px' }}>
                {depositIsPaid ? 'Paid' : 'Pending'}
              </span>
            </div>
          )}
        </div>

        {b.notes && (
          <p
            className="mini dim"
            style={{ background: 'var(--bg-deep)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: 8, fontFamily: 'var(--font-data)' }}
          >
            {b.notes}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2" style={{ paddingTop: 12, borderTop: '1px solid var(--rule)' }}>
        <div className="flex gap-2">
          <Link href={`/bookings/${b.id}/edit`} className="btn ghost sm">
            Edit Services <Edit3 className="w-3.5 h-3.5" />
          </Link>
          <Link href={`/bookings/${b.id}/payments`} className="btn ghost sm">
            Payments <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {b.status === 'RESERVED' && (
            <button
              disabled={updating}
              onClick={() => onUpdateStatus(b.id, { paymentAction: 'MARK_DEPOSIT_PAID' })}
              className="btn ghost sm"
              title="Record Deposit & Confirm Booking"
            >
              Record Deposit
            </button>
          )}

          {b.status === 'CONFIRMED' && (
            <button
              disabled={updating}
              onClick={() => onUpdateStatus(b.id, { paymentAction: 'COMPLETE_FINANCIAL_CLOSURE' })}
              className="btn ghost sm"
              title="Complete Booking & Closure"
            >
              Complete Closure
            </button>
          )}

          <button
            disabled={isDeleting}
            onClick={() => onDeletePrompt(b.id, b.clientName || 'Client')}
            className="icon-btn"
            title="Delete Booking"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
