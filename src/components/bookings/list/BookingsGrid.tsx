import Link from 'next/link';
import { BookmarkCheck, Plus } from 'lucide-react';
import { BookingListDTO } from '@/types/dtos';
import BookingCard from './BookingCard';

interface BookingsGridProps {
  bookings: BookingListDTO[];
  isEmpty: boolean;
  deletingId: string | null;
  updating: boolean;
  contextFilter?: 'SPACE' | 'EVENT';
  onUpdateStatus: (
    bookingId: string,
    updates: { status?: string; paymentAction?: 'MARK_DEPOSIT_PAID' | 'MARK_ALL_PAID' | 'COMPLETE_FINANCIAL_CLOSURE' }
  ) => void;
  onCrossover: (bookingId: string, direction: 'PROMOTE' | 'DEMOTE') => void;
  onDeletePrompt: (bookingId: string, clientName: string) => void;
}

export default function BookingsGrid({ bookings, isEmpty, deletingId, updating, contextFilter, onUpdateStatus, onCrossover, onDeletePrompt }: BookingsGridProps) {
  if (isEmpty) {
    return (
      <div className="empty">
        <BookmarkCheck className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3, color: 'var(--accent)' }} />
        <h3 className="h-sm">No Bookings Found</h3>
        <p className="mini dim" style={{ marginTop: 4, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
          No commercial bookings match the selected status filter. Create a new booking using the terminal.
        </p>
        <Link href={contextFilter ? `/bookings/create?context=${contextFilter}` : '/bookings/create'} className="btn primary sm" style={{ marginTop: 16, display: 'inline-flex' }}>
          <Plus className="w-4 h-4" /> Create Booking
        </Link>
      </div>
    );
  }

  return (
    <div className="grid g3">
      {bookings.map((b) => (
        <BookingCard
          key={b.id}
          booking={b}
          isDeleting={deletingId === b.id}
          updating={updating}
          onUpdateStatus={onUpdateStatus}
          onCrossover={onCrossover}
          onDeletePrompt={onDeletePrompt}
        />
      ))}
    </div>
  );
}
