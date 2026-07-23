'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Loader2, X } from 'lucide-react';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [clientId, setClientId] = useState('');
  const [bookingType, setBookingType] = useState('SPACE_AND_SERVICES');
  const [guestCount, setGuestCount] = useState('150');
  const [notes, setNotes] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
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
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Clicking a day cell opens the booking modal for that date
  const handleDayClick = (dayNumber: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNumber).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    setSelectedDateStr(dateStr);
    setIsModalOpen(true);
  };

  const toggleServiceSelection = (id: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !selectedDateStr) return;
    setSubmitting(true);
    try {
      const selectedServices = selectedServiceIds.map(id => ({ serviceId: id }));
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          bookingType,
          eventDate: selectedDateStr,
          guestCount,
          notes,
          selectedServices,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNotes('');
        setSelectedServiceIds([]);
        // Refresh bookings
        const freshRes = await fetch('/api/bookings');
        const freshJson = await freshRes.json();
        setBookings(freshJson.bookings || []);
      }
    } catch (err) {
      console.error('Failed to create booking:', err);
    } fontally: {
      setSubmitting(false);
    }
  };

  const getBookingsForDay = (dayNumber: number) => {
    return bookings.filter(b => {
      const bDate = new Date(b.eventDate);
      return (
        bDate.getFullYear() === year &&
        bDate.getMonth() === month &&
        bDate.getDate() === dayNumber
      );
    });
  };

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
          <div className="flex items-center gap-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-violet-400" /> Event Calendar
            </h2>
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1">
              <button onClick={handlePrevMonth} className="text-zinc-400 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs font-bold text-white px-2">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={handleNextMonth} className="text-zinc-400 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <button
            onClick={() => {
              const today = new Date();
              const formattedMonth = String(today.getMonth() + 1).padStart(2, '0');
              const formattedDay = String(today.getDate()).padStart(2, '0');
              setSelectedDateStr(`${today.getFullYear()}-${formattedMonth}-${formattedDay}`);
              setIsModalOpen(true);
            }}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" /> Book Selected Date
          </button>
        </header>

        {/* CALENDAR GRID */}
        <div className="flex-1 overflow-auto p-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            {/* WEEKDAY HEADERS */}
            <div className="grid grid-cols-7 gap-2 mb-4 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* DAY CELLS */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty padding cells */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-28 bg-zinc-950/30 rounded-xl border border-zinc-900/50" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayBookings = getBookingsForDay(dayNum);
                const isToday =
                  dayNum === new Date().getDate() &&
                  month === new Date().getMonth() &&
                  year === new Date().getFullYear();

                return (
                  <div
                    key={dayNum}
                    onClick={() => handleDayClick(dayNum)}
                    className={`h-28 bg-zinc-950 p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:border-violet-500/50 hover:bg-zinc-900/60 ${
                      isToday ? 'border-violet-500 shadow-md shadow-violet-500/10' : 'border-zinc-850'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold ${isToday ? 'text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md' : 'text-zinc-400'}`}>
                        {dayNum}
                      </span>
                      {dayBookings.length > 0 && (
                        <span className="text-[10px] bg-violet-600 text-white font-black px-1.5 py-0.5 rounded-full">
                          {dayBookings.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-16">
                      {dayBookings.map((b: any) => (
                        <div
                          key={b.id}
                          className="bg-violet-600/20 border border-violet-500/30 text-violet-300 p-1.5 rounded-lg text-[10px] font-bold truncate"
                        >
                          {b.client?.name} ({b.guestCount}g)
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* CREATE BOOKING MODAL (PRE-FILLED ON DAY CLICK) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-violet-400" /> Book Event Space & Services
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-1">Target Date</label>
                <input
                  type="date"
                  required
                  value={selectedDateStr}
                  onChange={e => setSelectedDateStr(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500"
                />
              </div>

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
                  <label className="text-xs text-zinc-400 font-bold block mb-1">Expected Guests</label>
                  <input
                    type="number"
                    required
                    value={guestCount}
                    onChange={e => setGuestCount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-2">Attach Initial Services</label>
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
                <label className="text-xs text-zinc-400 font-bold block mb-1">Notes & Requirements</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-violet-500"
                  placeholder="Special instructions..."
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
