import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BookingListDTO } from '@/types/dtos';

/** `bookings` is a single already-paginated/filtered page from the server (see bookings/page.tsx). */
export function useBookingsList(bookings: BookingListDTO[]) {
  const router = useRouter();

  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUpdateStatus = async (
    bookingId: string,
    updates: { status?: string; paymentAction?: 'MARK_DEPOSIT_PAID' | 'MARK_ALL_PAID' | 'COMPLETE_FINANCIAL_CLOSURE' }
  ) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        toast.success('Booking & payment details updated successfully!');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to update booking.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setUpdating(false);
    }
  };

  const executeDeleteBooking = async (bookingId: string) => {
    setDeletingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Booking deleted successfully!');
        router.refresh();
      } else {
        toast.error('Failed to delete booking.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error while deleting booking.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeletePrompt = (bookingId: string, clientName: string) => {
    toast(`Delete booking for "${clientName}"?`, {
      description: 'This will permanently remove the booking and associated records.',
      action: {
        label: 'Confirm Delete',
        onClick: () => executeDeleteBooking(bookingId),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
      duration: 7000,
    });
  };

  return {
    updating,
    deletingId,
    bookings,
    handleUpdateStatus,
    handleDeletePrompt,
  };
}
