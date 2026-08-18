'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CalendarBookingDTO } from '@/types/dtos';
import { bookingsOverlap } from '@/lib/booking-conflict';
import DayDetailModal from './DayDetailModal';
import Topbar from '@/components/aurelia/Topbar';
import { statusChipStyle } from './statusColors';

interface CalendarClientProps {
  initialBookings: CalendarBookingDTO[];
}

export default function CalendarClient({
  initialBookings,
}: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (dayNumber: number) => {
    setSelectedDate(new Date(year, month, dayNumber));
  };

  // Month-grid count/chip list — day-level bucketing on each booking's start date.
  const getBookingsForDay = (dayNumber: number) => {
    return initialBookings.filter(b => {
      const bDate = new Date(b.startAt);
      return (
        bDate.getFullYear() === year &&
        bDate.getMonth() === month &&
        bDate.getDate() === dayNumber
      );
    });
  };

  // Day-detail timeline — every booking whose [startAt, endAt) interval intersects this day's
  // [00:00, 24:00) window, so overnight bookings that spill into/out of the day aren't missed.
  const getBookingsForTimeline = (date: Date) => {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    return initialBookings.filter((b) => bookingsOverlap(new Date(b.startAt), new Date(b.endAt), dayStart, dayEnd));
  };

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar crumb="Event Calendar" note="Every booking on the space, month by month.">
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="icon-btn"><ChevronLeft className="w-4 h-4" /></button>
          <span className="label" style={{ padding: '0 6px', whiteSpace: 'nowrap' }}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={handleNextMonth} className="icon-btn"><ChevronRight className="w-4 h-4" /></button>
        </div>

        <Link href="/bookings/create" className="btn primary sm">
          <Plus className="w-3.5 h-3.5" /> New Booking Terminal
        </Link>
      </Topbar>

      {/* CALENDAR GRID */}
      <div className="flex-1 overflow-auto page">
        <div className="card">
          {/* WEEKDAY HEADERS */}
          <div className="cal" style={{ marginBottom: 16, textAlign: 'center' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="label">
                {day}
              </div>
            ))}
          </div>

          {/* DAYS GRID */}
          <div className="cal">
            {/* Empty slots for days before 1st of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="cal-day is-empty" />
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
                  className={`cal-day${isToday ? ' is-today' : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="cal-day-num">{dayNum}</span>
                    {dayBookings.length > 0 && (
                      <span className="badge b-accent">
                        {dayBookings.length} {dayBookings.length === 1 ? 'event' : 'events'}
                      </span>
                    )}
                  </div>

                  <div className="cal-events">
                    {dayBookings.map((b) => (
                      <div key={b.id} className="cal-chip" style={statusChipStyle(b.status)}>
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

      <DayDetailModal
        isOpen={!!selectedDate}
        date={selectedDate}
        bookings={selectedDate ? getBookingsForTimeline(selectedDate) : []}
        onClose={() => setSelectedDate(null)}
      />
    </main>
  );
}
