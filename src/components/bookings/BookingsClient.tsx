'use client';

import Link from 'next/link';
import { BookmarkCheck, Plus } from 'lucide-react';
import { BookingListDTO } from '@/types/dtos';
import { useBookingsList } from './list/useBookingsList';
import { EditableBookingFields } from './list/types';
import BookingFilterTabs from './list/BookingFilterTabs';
import BookingsGrid from './list/BookingsGrid';
import BookingDrawer from './list/BookingDrawer';

interface BookingsClientProps {
  initialBookings: BookingListDTO[];
}

type EditFieldSetters = { [K in keyof EditableBookingFields]: (value: EditableBookingFields[K]) => void };

export default function BookingsClient({ initialBookings }: BookingsClientProps) {
  const list = useBookingsList(initialBookings);

  const editFields: EditableBookingFields = {
    editClientName: list.editClientName,
    editClientPhone: list.editClientPhone,
    editClientEmail: list.editClientEmail,
    editEventTitle: list.editEventTitle,
    editBookingType: list.editBookingType,
    editDate: list.editDate,
    editGuests: list.editGuests,
    editDiscount: list.editDiscount,
    editDownPaymentPercent: list.editDownPaymentPercent,
    editDepositDueDate: list.editDepositDueDate,
    editNotes: list.editNotes,
  };

  const fieldSetters: EditFieldSetters = {
    editClientName: list.setEditClientName,
    editClientPhone: list.setEditClientPhone,
    editClientEmail: list.setEditClientEmail,
    editEventTitle: list.setEditEventTitle,
    editBookingType: list.setEditBookingType,
    editDate: list.setEditDate,
    editGuests: list.setEditGuests,
    editDiscount: list.setEditDiscount,
    editDownPaymentPercent: list.setEditDownPaymentPercent,
    editDepositDueDate: list.setEditDepositDueDate,
    editNotes: list.setEditNotes,
  };

  const handleChangeField = <K extends keyof EditableBookingFields>(field: K, value: EditableBookingFields[K]) => {
    fieldSetters[field](value);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-950 text-white font-sans">
      <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 px-8 flex items-center justify-between shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <BookmarkCheck className="w-5 h-5 text-violet-400" />
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">Commercial Bookings</h2>
            <p className="text-xs text-zinc-500">Manage client reservations, deposits & payment closures</p>
          </div>
        </div>

        <Link
          href="/bookings/create"
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20"
        >
          <Plus className="w-4 h-4" /> New Booking
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <BookingFilterTabs statusFilter={list.statusFilter} onFilterChange={list.setStatusFilter} statusCounts={list.statusCounts} />

        <BookingsGrid
          bookings={list.sortedBookings}
          isEmpty={list.filteredBookings.length === 0}
          deletingId={list.deletingId}
          updating={list.updating}
          onOpenDrawer={list.openDrawer}
          onUpdateStatus={list.handleUpdateStatus}
          onDeletePrompt={list.handleDeletePrompt}
        />
      </div>

      {list.selectedBooking && (
        <BookingDrawer
          booking={list.selectedBooking}
          updating={list.updating}
          onClose={list.closeDrawer}
          onChangeField={handleChangeField}
          onSaveDetails={list.handleSaveDetails}
          onUpdateStatus={list.handleUpdateStatus}
          onUpdateInvoiceStatus={list.handleUpdateInvoiceStatus}
          onDeletePrompt={list.handleDeletePrompt}
          {...editFields}
        />
      )}
    </div>
  );
}
