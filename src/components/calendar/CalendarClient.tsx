'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { BookingListDTO } from '@/types/dtos';

interface CalendarClientProps {
  initialBookings: BookingListDTO[];
}

export default function CalendarClient({
  initialBookings,
}: CalendarClientProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (dayNumber: number) => {
    router.push(`/bookings/create`);
  };

  const getBookingsForDay = (dayNumber: number) => {
    return initialBookings.filter(b => {
      const bDate = new Date(b.eventDate);
      return (
        bDate.getFullYear() === year &&
        bDate.getMonth() === month &&
        bDate.getDate() === dayNumber
      );
    });
  };

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-950 text-white font-sans">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 flex items-center px-8 justify-between shrink-0 backdrop-blur-md">
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

        <Link
          href="/bookings/create"
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/20"
        >
          <Plus className="w-4 h-4" /> New Booking Terminal
        </Link>
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

          {/* DAYS GRID */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots for days before 1st of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-32 bg-zinc-950/40 rounded-xl border border-zinc-850/50" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayBookings = getBookingsForDay(dayNum);
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={dayNum}
                  onClick={() => handleDayClick(dayNum)}
                  className={`h-32 bg-zinc-950 border rounded-xl p-2 flex flex-col justify-between cursor-pointer hover:border-violet-500/50 transition-all ${
                    isToday ? 'border-violet-500 bg-violet-950/10' : 'border-zinc-850'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${isToday ? 'text-violet-400' : 'text-zinc-400'}`}>
                      {dayNum}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="text-[10px] bg-violet-600/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded font-bold">
                        {dayBookings.length} {dayBookings.length === 1 ? 'event' : 'events'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-20">
                    {dayBookings.map((b) => (
                      <div
                        key={b.id}
                        className={`text-[10px] p-1.5 rounded-lg border truncate font-semibold ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                            : b.status === 'COMPLETED'
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                        }`}
                      >
                        {b.clientName || 'Booking'}
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
  );
}
