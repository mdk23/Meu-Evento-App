'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { BookingListPageDTO } from '@/types/dtos';
import { useBookingsList } from './list/useBookingsList';
import BookingFilterTabs from './list/BookingFilterTabs';
import BookingsGrid from './list/BookingsGrid';
import PaginationControls from '../shared/PaginationControls';
import Topbar from '@/components/aurelia/Topbar';

interface BookingsClientProps {
  data: BookingListPageDTO;
  statusFilter: string;
  /** Set when reached from the Space or Event workspace nav — scopes the list to that kind. */
  contextFilter?: 'SPACE' | 'EVENT';
}

export default function BookingsClient({ data, statusFilter, contextFilter }: BookingsClientProps) {
  const list = useBookingsList(data.items);

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (contextFilter) params.set('context', contextFilter);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `/bookings?${qs}` : '/bookings';
  };

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar
        crumb={contextFilter === 'SPACE' ? 'Space Bookings' : contextFilter === 'EVENT' ? 'Event Bookings' : 'Commercial Bookings'}
        note={
          contextFilter === 'SPACE'
            ? 'Venue-rental bookings — commercial-only, no Event workspace.'
            : contextFilter === 'EVENT'
            ? 'Bookings running a full occasion, with an Event workspace attached.'
            : 'Manage client reservations, deposits & payment closures.'
        }
      >
        <Link href={contextFilter ? `/bookings/create?context=${contextFilter}` : '/bookings/create'} className="btn primary sm">
          <Plus className="w-3.5 h-3.5" /> New Booking
        </Link>
      </Topbar>

      <div className="flex-1 overflow-y-auto page space-y-6">
        <BookingFilterTabs statusFilter={statusFilter} statusCounts={data.statusCounts} contextFilter={contextFilter} />

        <BookingsGrid
          bookings={list.bookings}
          isEmpty={list.bookings.length === 0}
          deletingId={list.deletingId}
          updating={list.updating}
          contextFilter={contextFilter}
          onUpdateStatus={list.handleUpdateStatus}
          onCrossover={list.handleCrossover}
          onDeletePrompt={list.handleDeletePrompt}
        />

        <PaginationControls page={data.page} totalPages={data.totalPages} total={data.total} buildHref={buildPageHref} />
      </div>
    </main>
  );
}
