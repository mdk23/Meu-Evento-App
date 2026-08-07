'use client';

import Link from 'next/link';
import { BookmarkCheck, Plus } from 'lucide-react';
import { BookingListPageDTO } from '@/types/dtos';
import { useBookingsList } from './list/useBookingsList';
import { EditableBookingFields } from './list/types';
import BookingFilterTabs from './list/BookingFilterTabs';
import BookingsGrid from './list/BookingsGrid';
import BookingDrawer from './list/BookingDrawer';
import PaginationControls from '../shared/PaginationControls';

interface BookingsClientProps {
  data: BookingListPageDTO;
  statusFilter: string;
}

type EditFieldSetters = { [K in keyof EditableBookingFields]: (value: EditableBookingFields[K]) => void };

export default function BookingsClient({ data, statusFilter }: BookingsClientProps) {
  const list = useBookingsList(data.items);

  const editFields: EditableBookingFields = {
    editClientName: list.editClientName,
    editClientPhone: list.editClientPhone,
    editClientEmail: list.editClientEmail,
    editEventTitle: list.editEventTitle,
    editBookingType: list.editBookingType,
    editDate: list.editDate,
    editGuests: list.editGuests,
    editDiscount: list.editDiscount,
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
    editDepositDueDate: list.setEditDepositDueDate,
    editNotes: list.setEditNotes,
  };

  const handleChangeField = <K extends keyof EditableBookingFields>(field: K, value: EditableBookingFields[K]) => {
    fieldSetters[field](value);
  };

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `/bookings?${qs}` : '/bookings';
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
        <BookingFilterTabs statusFilter={statusFilter} statusCounts={data.statusCounts} />

        <BookingsGrid
          bookings={list.bookings}
          isEmpty={list.bookings.length === 0}
          deletingId={list.deletingId}
          updating={list.updating}
          onOpenDrawer={list.openDrawer}
          onUpdateStatus={list.handleUpdateStatus}
          onDeletePrompt={list.handleDeletePrompt}
        />

        <PaginationControls page={data.page} totalPages={data.totalPages} total={data.total} buildHref={buildPageHref} />
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
