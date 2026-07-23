'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { 
  BookmarkCheck, 
  Plus, 
  Loader2, 
  Calendar, 
  Users, 
  ArrowRight,
  X
} from 'lucide-react';

export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Booking Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [bookingType, setBookingType] = useState('SPACE_AND_SERVICES');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('150');
  const [notes, setNotes] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchBookings() {
      try {
        const res = await fetch('/api/bookings');
        const json = await res.json();
        if (active) {
          setBookings(json.bookings || []);
          setClients(json.clients || []);
          setServices(json.services || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchBookings();
    return () => {
      active = false;
    };
  }, []);

  const toggleServiceSelection = (id: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !eventDate) return;
    setSubmitting(true);
    try {
      const selectedServices = selectedServiceIds.map(id => ({ serviceId: id }));
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          bookingType,
          eventDate,
          guestCount,
          notes,
          selectedServices,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNotes('');
        setSelectedServiceIds([]);
        const freshRes = await fetch('/api/bookings');
        const freshJson = await freshRes.json();
        setBookings(freshJson.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBookings = statusFilter === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-violet-400">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex text-zinc-300 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/50 flex items-center px-8 justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-violet-400" /> Commercial Bookings
          </h2>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" /> Create Commercial Booking
          </button>
        </header>

        {/* WORKSPACE */}
        <div className="flex-1 overflow-auto p-8 space-y-6">
          {/* FILTER TABS */}
          <div className="flex gap-2 border-b border-zinc-900 pb-4">
            {['ALL', 'CONFIRMED', 'DRAFT', 'COMPLETED', 'CANCELLED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* BOOKINGS LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((b: any) => (
              <div key={b.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                      {b.bookingType.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      b.status === 'CONFIRMED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 bg-zinc-800'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-lg">{b.client?.name}</h3>
                    <p className="text-xs text-zinc-500">{b.client?.companyName || b.client?.email}</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-850">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Event Date: <strong className="text-zinc-200">{new Date(b.eventDate).toLocaleDateString()}</strong>
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-zinc-500" /> Guest Count: <strong className="text-zinc-200">{b.guestCount} Guests</strong>
                    </p>
                  </div>
                </div>

                {b.event && (
                  <div className="pt-3 border-t border-zinc-850 flex justify-between items-center">
                    <span className="text-[11px] text-zinc-500 font-semibold">Execution Event Ready</span>
                    <Link
                      href={`/events/${b.event.id}`}
                      className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      Event Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* CREATE BOOKING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-violet-400" /> New Commercial Booking
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Select Client</label>
                <select
                  required
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.companyName || 'Individual'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Booking Type</label>
                  <select
                    value={bookingType}
                    onChange={e => setBookingType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500"
                  >
                    <option value="SPACE_AND_SERVICES">Space & Services</option>
                    <option value="SPACE_ONLY">Space Only</option>
                    <option value="SERVICES_ONLY">Services Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Guest Count</label>
                <input
                  type="number"
                  required
                  value={guestCount}
                  onChange={e => setGuestCount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-2">Attach Catalog Services</label>
                <div className="space-y-2 max-h-36 overflow-y-auto p-2 bg-zinc-950 border border-zinc-850 rounded-xl">
                  {services.map((s: any) => (
                    <label key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900 cursor-pointer">
                      <span className="text-xs text-zinc-300">
                        {s.executionType === 'INTERNAL' ? '🟢' : '🔵'} {s.name} ({s.defaultPrice} MT)
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedServiceIds.includes(s.id)}
                        onChange={() => toggleServiceSelection(s.id)}
                        className="accent-violet-600 w-4 h-4"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-violet-500"
                  placeholder="Additional agreement notes..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
