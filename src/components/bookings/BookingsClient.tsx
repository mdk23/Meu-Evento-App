'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  BookmarkCheck, 
  Plus, 
  Loader2, 
  Calendar, 
  Users, 
  ArrowRight,
  Trash2,
  CheckCircle2,
  Clock,
  DollarSign,
  Sparkles,
  FileText,
  X,
  Building2,
  ChevronRight
} from 'lucide-react';

interface BookingsClientProps {
  initialBookings: any[];
  clients: any[];
  services: any[];
}

export default function BookingsClient({ initialBookings, clients, services }: BookingsClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected Booking Drawer State for Viewing & Editing
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Status Lifecycle Updater
  const handleUpdateStatus = async (bookingId: string, newStatus: string, newEventStatus?: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          eventStatus: newEventStatus,
        }),
      });

      if (res.ok) {
        toast.success(`Booking status updated to ${newStatus}`);
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking((prev: any) => prev ? { ...prev, status: newStatus } : null);
        }
        router.refresh();
      } else {
        toast.error('Failed to update status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setUpdating(false);
    }
  };

  // Delete Booking Handler
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    setDeletingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Booking deleted.');
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(null);
        }
        router.refresh();
      } else {
        toast.error('Failed to delete booking.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBookings = statusFilter === 'ALL'
    ? initialBookings
    : initialBookings.filter(b => b.status === statusFilter);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-950 text-white font-sans">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 px-8 flex items-center justify-between shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <BookmarkCheck className="w-5 h-5 text-violet-400" />
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">Commercial Bookings</h2>
            <p className="text-xs text-zinc-500">Manage client event reservations & contracts</p>
          </div>
        </div>

        <Link
          href="/bookings/create"
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20"
        >
          <Plus className="w-4 h-4" /> New Booking
        </Link>
      </header>

      {/* WORKSPACE */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        
        {/* FILTER TABS (BOOKING STATUS LIFECYCLE) */}
        <div className="flex gap-2 border-b border-zinc-900 pb-4 overflow-x-auto">
          {['ALL', 'RESERVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => {
            const count = st === 'ALL' ? initialBookings.length : initialBookings.filter(b => b.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  statusFilter === st
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <span>{st === 'ALL' ? 'All Bookings' : st}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-950 text-zinc-400 border border-zinc-800">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* BOOKINGS GRID */}
        {filteredBookings.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((b: any) => {
              const isDeleting = deletingId === b.id;

              return (
                <div
                  key={b.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                        {b.bookingType?.replace('_', ' ') || 'SPACE AND SERVICES'}
                      </span>

                      {/* BOOKING STATUS BADGE */}
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
                      <h3 className="text-white font-bold text-lg group-hover:text-violet-300 transition-colors">
                        {b.client?.name || b.clientName || 'Client Name'}
                      </h3>
                      <p className="text-xs text-zinc-500">{b.client?.email || b.client?.phone || 'Direct Client'}</p>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-800">
                      <p className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-violet-400" /> Event Date:{' '}
                        <strong className="text-zinc-200">{new Date(b.eventDate).toLocaleDateString()}</strong>
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-violet-400" /> Guest Count:{' '}
                        <strong className="text-zinc-200">{b.guestCount} pax</strong>
                      </p>
                    </div>

                    {b.notes && (
                      <p className="text-[11px] text-zinc-500 line-clamp-2 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/80">
                        {b.notes}
                      </p>
                    )}
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg border border-violet-500/20 transition-all"
                    >
                      View & Manage <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {/* STATUS QUICK TOGGLE ACTION */}
                      {b.status === 'RESERVED' && (
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                          className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg transition-all"
                          title="Record Deposit & Confirm Booking"
                        >
                          Confirm Deposit
                        </button>
                      )}

                      {b.status === 'CONFIRMED' && (
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateStatus(b.id, 'COMPLETED', 'COMPLETED')}
                          className="text-[11px] font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2.5 py-1.5 rounded-lg transition-all"
                          title="Complete Booking & Closure"
                        >
                          Complete Closure
                        </button>
                      )}

                      <button
                        disabled={isDeleting}
                        onClick={() => handleDeleteBooking(b.id)}
                        className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="Delete Booking"
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAILED BOOKING MANAGEMENT DRAWER */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-end z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-900 border-l border-zinc-800 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto space-y-6">
            
            <div className="space-y-6">
              {/* DRAWER HEADER */}
              <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full block w-fit mb-2">
                    {selectedBooking.bookingType?.replace('_', ' ')}
                  </span>
                  <h2 className="text-white font-bold text-xl">{selectedBooking.client?.name || selectedBooking.clientName}</h2>
                  <p className="text-xs text-zinc-400">{selectedBooking.client?.email || selectedBooking.client?.phone || 'No contact provided'}</p>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* BOOKING STATUS LIFECYCLE MANAGEMENT */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <BookmarkCheck className="w-4 h-4 text-violet-400" /> Booking Lifecycle Status
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'RESERVED')}
                    className={`p-2.5 rounded-lg text-xs font-bold transition-all text-left border ${
                      selectedBooking.status === 'RESERVED'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span className="block">● RESERVED</span>
                    <span className="text-[10px] font-normal text-zinc-500">Booking created</span>
                  </button>

                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'CONFIRMED')}
                    className={`p-2.5 rounded-lg text-xs font-bold transition-all text-left border ${
                      selectedBooking.status === 'CONFIRMED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span className="block">● CONFIRMED</span>
                    <span className="text-[10px] font-normal text-zinc-500">Initial deposit paid</span>
                  </button>

                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'COMPLETED', 'COMPLETED')}
                    className={`p-2.5 rounded-lg text-xs font-bold transition-all text-left border ${
                      selectedBooking.status === 'COMPLETED'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span className="block">● COMPLETED</span>
                    <span className="text-[10px] font-normal text-zinc-500">Event & financial closure</span>
                  </button>

                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'CANCELLED')}
                    className={`p-2.5 rounded-lg text-xs font-bold transition-all text-left border ${
                      selectedBooking.status === 'CANCELLED'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span className="block">● CANCELLED</span>
                    <span className="text-[10px] font-normal text-zinc-500">Booking cancelled</span>
                  </button>
                </div>
              </div>

              {/* EVENT EXECUTION LIFECYCLE MANAGEMENT */}
              {selectedBooking.event && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" /> Event Execution Status
                    </h3>
                    <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                      {selectedBooking.event.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Event lifecycle progresses from Planning ➔ Ready (when all payments are done) ➔ In Progress ➔ Completed.
                  </p>

                  <div className="flex justify-end pt-1">
                    <Link
                      href={`/events`}
                      className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      Go to Events Center <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* DETAILS SUMMARY */}
              <div className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Event Date:</span>
                  <strong className="text-white">{new Date(selectedBooking.eventDate).toLocaleDateString()}</strong>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Guest Count:</span>
                  <strong className="text-white">{selectedBooking.guestCount} pax</strong>
                </div>
                {selectedBooking.notes && (
                  <div className="pt-2 border-t border-zinc-800">
                    <span className="text-[11px] text-zinc-500 block mb-1 font-bold">Notes / Agreement Details:</span>
                    <p className="text-xs text-zinc-300 leading-relaxed font-mono">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* DRAWER FOOTER */}
            <div className="pt-4 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => handleDeleteBooking(selectedBooking.id)}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border border-red-500/20 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Booking
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 px-4 rounded-xl text-xs font-bold transition-all"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
