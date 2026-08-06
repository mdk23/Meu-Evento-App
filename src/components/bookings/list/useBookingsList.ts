import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BookingListDTO } from '@/types/dtos';
import { BookingDrawerDetail } from './types';

const STATUS_FILTERS = ['ALL', 'RESERVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'WAITING_LIST'];

export function useBookingsList(initialBookings: BookingListDTO[]) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('ALL');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get('status');
      if (statusParam) {
        setStatusFilter(statusParam.toUpperCase());
      }
    }
  }, []);

  const [selectedBooking, setSelectedBooking] = useState<BookingDrawerDetail | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editBookingType, setEditBookingType] = useState('SPACE_AND_SERVICES');
  const [editDate, setEditDate] = useState('');
  const [editGuests, setEditGuests] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editDepositDueDate, setEditDepositDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const openDrawer = async (booking: BookingListDTO) => {
    setSelectedBooking(booking);
    setEditClientName(booking.clientName || '');
    setEditClientPhone(booking.clientPhone || '');
    setEditClientEmail(booking.clientEmail || '');
    setEditEventTitle(booking.eventTitle || '');
    setEditBookingType(booking.bookingType || 'SPACE_AND_SERVICES');
    setEditDate(booking.eventDate ? new Date(booking.eventDate).toISOString().split('T')[0] : '');
    setEditGuests(booking.guestCount || 0);
    setEditDiscount(booking.discount || 0);
    setEditDepositDueDate(booking.depositDueDate ? new Date(booking.depositDueDate).toISOString().split('T')[0] : '');
    setEditNotes(booking.notes || '');

    try {
      const res = await fetch(`/api/bookings/${booking.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.booking) {
          const fullB = data.booking;
          setSelectedBooking({ ...booking, ...fullB });
          if (fullB.client) {
            setEditClientName(fullB.client.name || '');
            setEditClientPhone(fullB.client.phone || '');
            setEditClientEmail(fullB.client.email || '');
          }
          if (fullB.event) {
            setEditEventTitle(fullB.event.name || '');
          }
          if (fullB.bookingType) {
            setEditBookingType(fullB.bookingType);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load full booking details:', e);
    }
  };

  const closeDrawer = () => setSelectedBooking(null);

  const handleUpdateStatus = async (
    bookingId: string,
    updates: {
      status?: string;
      eventStatus?: string;
      paymentAction?: 'MARK_DEPOSIT_PAID' | 'MARK_ALL_PAID' | 'COMPLETE_FINANCIAL_CLOSURE';
    }
  ) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Booking & payment details updated successfully!');
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(data.booking || { ...selectedBooking, ...updates });
        }
        router.refresh();
      } else {
        toast.error('Failed to update booking.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveDetails = async (bookingId: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: editClientName,
          clientPhone: editClientPhone,
          clientEmail: editClientEmail,
          title: editEventTitle,
          bookingType: editBookingType,
          eventDate: editDate,
          guestCount: editGuests,
          discount: editDiscount,
          depositDueDate: editDepositDueDate,
          notes: editNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Booking details updated successfully!');
        if (data.booking) {
          setSelectedBooking(data.booking);
        }
        router.refresh();
      } else {
        toast.error('Failed to save booking details.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateInvoiceStatus = async (bookingId: string, invoiceId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          invoiceStatus: newStatus,
        }),
      });

      if (res.ok) {
        toast.success(`Invoice marked as ${newStatus}`);
        const updatedRes = await fetch(`/api/bookings/${bookingId}`);
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setSelectedBooking((prev) => (prev ? { ...prev, ...data.booking } : prev));
        }
        router.refresh();
      } else {
        toast.error('Failed to update invoice.');
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
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(null);
        }
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

  const filteredBookings = statusFilter === 'ALL'
    ? initialBookings
    : initialBookings.filter((b) => b.status === statusFilter);

  const sortedBookings = [...filteredBookings].sort((a, b) =>
    new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  const statusCounts = STATUS_FILTERS.reduce<Record<string, number>>((acc, st) => {
    acc[st] = st === 'ALL' ? initialBookings.length : initialBookings.filter((b) => b.status === st).length;
    return acc;
  }, {});

  return {
    statusFilter,
    setStatusFilter,
    statusCounts,
    selectedBooking,
    updating,
    deletingId,
    editClientName,
    setEditClientName,
    editClientPhone,
    setEditClientPhone,
    editClientEmail,
    setEditClientEmail,
    editEventTitle,
    setEditEventTitle,
    editBookingType,
    setEditBookingType,
    editDate,
    setEditDate,
    editGuests,
    setEditGuests,
    editDiscount,
    setEditDiscount,
    editDepositDueDate,
    setEditDepositDueDate,
    editNotes,
    setEditNotes,
    filteredBookings,
    sortedBookings,
    openDrawer,
    closeDrawer,
    handleUpdateStatus,
    handleSaveDetails,
    handleUpdateInvoiceStatus,
    handleDeletePrompt,
  };
}
