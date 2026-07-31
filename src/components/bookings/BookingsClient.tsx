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
  ChevronRight,
  Edit3,
  CreditCard,
  AlertCircle,
  TrendingUp,
  Save
} from 'lucide-react';

interface BookingsClientProps {
  initialBookings: any[];
  clients: any[];
  services: any[];
}

export default function BookingsClient({ initialBookings, clients, services }: BookingsClientProps) {
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

  // Selected Booking Drawer State for Viewing & Managing
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Editable fields inside drawer
  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editBookingType, setEditBookingType] = useState('SPACE_AND_SERVICES');
  const [editDate, setEditDate] = useState('');
  const [editGuests, setEditGuests] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editDownPaymentPercent, setEditDownPaymentPercent] = useState(50);
  const [editDepositDueDate, setEditDepositDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const openDrawer = async (booking: any) => {
    setSelectedBooking(booking);
    setEditClientName(booking.client?.name || booking.clientName || '');
    setEditClientPhone(booking.client?.phone || booking.clientPhone || '');
    setEditClientEmail(booking.client?.email || booking.clientEmail || '');
    setEditEventTitle(booking.eventTitle || booking.event?.name || '');
    setEditBookingType(booking.bookingType || 'SPACE_AND_SERVICES');
    setEditDate(booking.eventDate ? new Date(booking.eventDate).toISOString().split('T')[0] : '');
    setEditGuests(booking.guestCount || 0);
    setEditDiscount(booking.discount || 0);
    setEditDownPaymentPercent(booking.downPaymentPercent || 50);
    setEditDepositDueDate(booking.depositDueDate ? new Date(booking.depositDueDate).toISOString().split('T')[0] : '');
    setEditNotes(booking.notes || '');

    // Fetch complete detailed record for drawer
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

  // Status & Payment Lifecycle Updater
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

  // Save Inline Form Edits
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
          downPaymentPercent: editDownPaymentPercent,
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

  // Invoice payment tracker
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
        // Fetch fresh copy to update drawer state
        const updatedRes = await fetch(`/api/bookings/${bookingId}`);
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setSelectedBooking((prev: any) => ({ ...prev, ...data.booking }));
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

  // Sonner Toast Confirmation for Delete
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

  const filteredBookings = statusFilter === 'ALL'
    ? initialBookings
    : initialBookings.filter(b => b.status === statusFilter);

  const sortedBookings = [...filteredBookings].sort((a, b) => 
    new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-950 text-white font-sans">
      {/* HEADER */}
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

      {/* WORKSPACE */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        
        {/* FILTER TABS (BOOKING STATUS LIFECYCLE) */}
        <div className="flex gap-2 border-b border-zinc-900 pb-4 overflow-x-auto">
          {['ALL', 'RESERVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'WAITING_LIST'].map((st) => {
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
            {sortedBookings.map((b: any) => {
              const isDeleting = deletingId === b.id;
              const contractAmt = b.totalContractAmount || b.totalInvoiceAmount || 0;
              const paidAmt = b.paidInvoiceAmount || 0;
              const isFullyPaid = contractAmt > 0 && paidAmt >= contractAmt;
              const depositAmt = b.downPaymentAmount || 0;
              const depositPct = b.downPaymentPercent || 50;
              const depositIsPaid = b.depositStatus === 'PAID' || b.status === 'CONFIRMED' || b.status === 'COMPLETED';

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
                      <p className="text-xs text-zinc-500">{b.eventTitle || b.event?.name || b.client?.email || b.client?.phone || 'Direct Client'}</p>
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

                      {/* INITIAL DEPOSIT & STATUS IN THE SAME BLOCK BELOW */}
                      {depositAmt > 0 && (
                        <div className="flex items-center justify-between text-[11px] bg-zinc-950/80 px-2.5 py-1.5 rounded-lg border border-zinc-800/80 mt-1">
                          <span className="text-zinc-400">
                            Initial Deposit: <strong className="text-zinc-200">{depositAmt.toLocaleString()} MT</strong> ({depositPct}%)
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            depositIsPaid
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          }`}>
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

                  {/* ACTION CONTROLS */}
                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/bookings/${b.id}/edit`}
                        className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg border border-violet-500/20 transition-all"
                      >
                        Edit Services <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => openDrawer(b)}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all"
                      >
                        Financials <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* STATUS QUICK TOGGLE ACTIONS */}
                      {b.status === 'RESERVED' && (
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateStatus(b.id, { paymentAction: 'MARK_DEPOSIT_PAID' })}
                          className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg transition-all"
                          title="Record Deposit & Confirm Booking"
                        >
                          Record Deposit
                        </button>
                      )}

                      {b.status === 'CONFIRMED' && (
                        <button
                          disabled={updating}
                          onClick={() => handleUpdateStatus(b.id, { paymentAction: 'COMPLETE_FINANCIAL_CLOSURE' })}
                          className="text-[11px] font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2.5 py-1.5 rounded-lg transition-all"
                          title="Complete Booking & Closure"
                        >
                          Complete Closure
                        </button>
                      )}

                      <button
                        disabled={isDeleting}
                        onClick={() => handleDeletePrompt(b.id, b.client?.name || b.clientName || 'Client')}
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
          <div className="w-full max-w-xl bg-zinc-900 border-l border-zinc-800 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto space-y-6">
            
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
                  <BookmarkCheck className="w-4 h-4 text-violet-400" /> Booking Status Lifecycle
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedBooking.id, { status: 'RESERVED' })}
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
                    onClick={() => handleUpdateStatus(selectedBooking.id, { paymentAction: 'MARK_DEPOSIT_PAID' })}
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
                    onClick={() => handleUpdateStatus(selectedBooking.id, { paymentAction: 'COMPLETE_FINANCIAL_CLOSURE' })}
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
                    onClick={() => handleUpdateStatus(selectedBooking.id, { status: 'WAITING_LIST' })}
                    className={`p-2.5 rounded-lg text-xs font-bold transition-all text-left border ${
                      selectedBooking.status === 'WAITING_LIST'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span className="block">● WAITING LIST</span>
                    <span className="text-[10px] font-normal text-zinc-500">Date conflict queue</span>
                  </button>

                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedBooking.id, { status: 'CANCELLED' })}
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

              {/* PAYMENT MANAGEMENT & FINANCIAL CLOSURE */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-violet-400" /> Payment & Financial Breakdown
                </h3>

                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Total Contract Value:</span>
                    <strong className="text-white font-bold">
                      {(selectedBooking.totalContractAmount || selectedBooking.totalInvoiceAmount || 0).toLocaleString()} MT
                    </strong>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Initial Deposit:</span>
                    <strong className="text-zinc-200">
                      {(selectedBooking.downPaymentAmount || 0).toLocaleString()} MT ({selectedBooking.downPaymentPercent || 50}%)
                    </strong>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Total Paid to Date:</span>
                    <strong className="font-bold">{(selectedBooking.paidInvoiceAmount || 0).toLocaleString()} MT</strong>
                  </div>
                  <div className="flex justify-between text-zinc-400 border-t border-zinc-800 pt-2">
                    <span>Outstanding Balance:</span>
                    <strong className="text-amber-400">
                      {Math.max(
                        0,
                        (selectedBooking.totalContractAmount || selectedBooking.totalInvoiceAmount || 0) -
                          (selectedBooking.paidInvoiceAmount || 0)
                      ).toLocaleString()} MT
                    </strong>
                  </div>
                  {selectedBooking.depositDueDate && (
                    <div className="flex justify-between text-zinc-500 text-[10px] pt-1">
                      <span>Deposit Due Date:</span>
                      <span>{new Date(selectedBooking.depositDueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Structured Invoice Milestones List */}
                {selectedBooking.invoices && selectedBooking.invoices.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Invoices & Milestones</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedBooking.invoices.map((inv: any) => (
                        <div key={inv.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">{inv.description || 'Milestone Payment'}</span>
                            <span className="text-[10px] text-zinc-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-violet-400 font-bold">{inv.amount.toLocaleString()} MT</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {inv.status}
                            </span>
                            {inv.status !== 'PAID' && (
                              <button
                                disabled={updating}
                                onClick={() => handleUpdateInvoiceStatus(selectedBooking.id, inv.id, 'PAID')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-lg font-bold transition-all"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-1 border-t border-zinc-850/55">
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedBooking.id, { paymentAction: 'MARK_DEPOSIT_PAID' })}
                    className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Record Initial Deposit (Confirm Booking)
                  </button>

                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedBooking.id, { paymentAction: 'MARK_ALL_PAID' })}
                    className="w-full bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-4 h-4 text-violet-400" />
                    Mark All Payments Complete ➔ Event READY
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

                  <div className="grid grid-cols-2 gap-2">
                    {(['PLANNING', 'READY', 'IN_PROGRESS', 'COMPLETED'] as const).map((evSt) => (
                      <button
                        key={evSt}
                        disabled={updating}
                        onClick={() => handleUpdateStatus(selectedBooking.id, { eventStatus: evSt })}
                        className={`p-2 rounded-lg text-xs font-bold transition-all text-center border ${
                          selectedBooking.event.status === evSt
                            ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {evSt === 'READY' ? 'READY (Payments Done)' : evSt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* EDITABLE DETAILS FORM */}
              <div className="space-y-4 bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-violet-400" /> Edit Booking Details
                </h3>

                <div className="space-y-3">
                  {/* CLIENT INFORMATION EDIT */}
                  <div>
                    <label className="text-[11px] text-zinc-400 font-bold block mb-1">Client Name</label>
                    <input
                      type="text"
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                      placeholder="Client Name"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 font-bold block mb-1">Phone</label>
                      <input
                        type="text"
                        value={editClientPhone}
                        onChange={(e) => setEditClientPhone(e.target.value)}
                        placeholder="Phone"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 font-bold block mb-1">Email</label>
                      <input
                        type="email"
                        value={editClientEmail}
                        onChange={(e) => setEditClientEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  {/* EVENT TITLE & BOOKING TYPE */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 font-bold block mb-1">Event Title</label>
                      <input
                        type="text"
                        value={editEventTitle}
                        onChange={(e) => setEditEventTitle(e.target.value)}
                        placeholder="e.g. Wedding Reception"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 font-bold block mb-1">Booking Type</label>
                      <select
                        value={editBookingType}
                        onChange={(e) => setEditBookingType(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      >
                        <option value="SPACE_AND_SERVICES">Space & Services</option>
                        <option value="SPACE_ONLY">Space Only</option>
                        <option value="SERVICES_ONLY">Services Only</option>
                      </select>
                    </div>
                  </div>

                  {/* DATE & GUEST COUNT */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 font-bold block mb-1">Event Date</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 font-bold block mb-1">Guest Count (pax)</label>
                      <input
                        type="number"
                        value={editGuests}
                        onChange={(e) => setEditGuests(parseInt(e.target.value || '0', 10))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
                      />
                    </div>
                  </div>

                  {/* FINANCIAL TERMS */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">Discount (MT)</label>
                      <input
                        type="number"
                        value={editDiscount}
                        onChange={(e) => setEditDiscount(parseFloat(e.target.value || '0'))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">Deposit %</label>
                      <input
                        type="number"
                        value={editDownPaymentPercent}
                        onChange={(e) => setEditDownPaymentPercent(parseInt(e.target.value || '50', 10))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold block mb-1">Deposit Due</label>
                      <input
                        type="date"
                        value={editDepositDueDate}
                        onChange={(e) => setEditDepositDueDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 font-bold block mb-1">Agreement Notes</label>
                    <textarea
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  disabled={updating}
                  onClick={() => handleSaveDetails(selectedBooking.id)}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md mt-2"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Booking Changes</>}
                </button>
              </div>
            </div>

            {/* DRAWER FOOTER */}
            <div className="pt-4 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => handleDeletePrompt(selectedBooking.id, selectedBooking.client?.name || selectedBooking.clientName || 'Client')}
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
