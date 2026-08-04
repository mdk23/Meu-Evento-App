import Link from 'next/link';
import { BookmarkCheck, Plus } from 'lucide-react';
import { BookingListDTO } from '@/types/dtos';
import BookingCard from './BookingCard';

interface BookingsGridProps {
  bookings: BookingListDTO[];
  isEmpty: boolean;
  deletingId: string | null;
  updating: boolean;
  onOpenDrawer: (booking: BookingListDTO) => void;
  onUpdateStatus: (
    bookingId: string,
    updates: { status?: string; paymentAction?: 'MARK_DEPOSIT_PAID' | 'MARK_ALL_PAID' | 'COMPLETE_FINANCIAL_CLOSURE' }
  ) => void;
  onDeletePrompt: (bookingId: string, clientName: string) => void;
}

export default function BookingsGrid({ bookings, isEmpty, deletingId, updating, onOpenDrawer, onUpdateStatus, onDeletePrompt }: BookingsGridProps) {
  if (isEmpty) {
    return (
      <div className="text-center py-16 text-zinc-600 border border-dashed border-zinc-800 rounded-2xl p-8">
        <BookmarkCheck className="w-12 h-12 mx-auto mb-3 opacity-30 text-violet-400" />
        <h3 className="text-sm font-bold text-zinc-300">No Bookings Found</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          No commercial bookings match the selected status filter. Create a new booking using the terminal.
        </p>
        <Link
          href="/bookings/create"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Create Booking
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bookings.map((b) => (
        <BookingCard
          key={b.id}
          booking={b}
          isDeleting={deletingId === b.id}
          updating={updating}
          onOpenDrawer={onOpenDrawer}
          onUpdateStatus={onUpdateStatus}
          onDeletePrompt={onDeletePrompt}
        />
      ))}
    </div>
  );
}
