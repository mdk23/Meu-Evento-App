'use client';

import Link from 'next/link';
import { X, Plus, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CalendarBookingDTO } from '@/types/dtos';
import { bookingsOverlap } from '@/lib/booking-conflict';
import { statusChipStyle } from './statusColors';

interface DayDetailModalProps {
  isOpen: boolean;
  date: Date | null;
  bookings: CalendarBookingDTO[];
  onClose: () => void;
}

const HOUR_HEIGHT = 56;
const TOTAL_HEIGHT = 24 * HOUR_HEIGHT;
const MIN_BLOCK_HEIGHT = 24;

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface PositionedBooking extends CalendarBookingDTO {
  top: number;
  height: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
  col: number;
  totalCols: number;
}

function layoutDay(date: Date, bookings: CalendarBookingDTO[]): PositionedBooking[] {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const sorted = [...bookings].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  // Greedy interval-graph column packing: place each booking in the first column where it
  // doesn't overlap anything already there, else open a new column.
  const columns: CalendarBookingDTO[][] = [];
  const colIndexById = new Map<string, number>();
  for (const b of sorted) {
    const bStart = new Date(b.startAt);
    const bEnd = new Date(b.endAt);
    let placedCol = -1;
    for (let i = 0; i < columns.length; i++) {
      const overlapsCol = columns[i].some((existing) =>
        bookingsOverlap(bStart, bEnd, new Date(existing.startAt), new Date(existing.endAt))
      );
      if (!overlapsCol) {
        placedCol = i;
        break;
      }
    }
    if (placedCol === -1) {
      columns.push([b]);
      placedCol = columns.length - 1;
    } else {
      columns[placedCol].push(b);
    }
    colIndexById.set(b.id, placedCol);
  }
  const totalCols = columns.length || 1;

  return sorted.map((b) => {
    const bStart = new Date(b.startAt);
    const bEnd = new Date(b.endAt);
    const clippedStart = bStart < dayStart ? dayStart : bStart;
    const clippedEnd = bEnd > dayEnd ? dayEnd : bEnd;
    const startMinutes = (clippedStart.getTime() - dayStart.getTime()) / 60000;
    const endMinutes = (clippedEnd.getTime() - dayStart.getTime()) / 60000;

    return {
      ...b,
      top: (startMinutes / 1440) * TOTAL_HEIGHT,
      height: Math.max(MIN_BLOCK_HEIGHT, ((endMinutes - startMinutes) / 1440) * TOTAL_HEIGHT),
      continuesBefore: bStart < dayStart,
      continuesAfter: bEnd > dayEnd,
      col: colIndexById.get(b.id) ?? 0,
      totalCols,
    };
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * `YYYY-MM-DD` for the clicked day, using local date components rather than `toISOString()` —
 * `date` here is a local-midnight `Date` (`new Date(year, month, day)` from CalendarClient), and
 * converting that to UTC before slicing would roll it back a day in positive-UTC-offset zones.
 */
function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DayDetailModal({ isOpen, date, bookings, onClose }: DayDetailModalProps) {
  if (!isOpen || !date) return null;

  // Timeline's whole purpose is showing occupancy — a cancelled booking doesn't occupy anything.
  const activeBookings = bookings.filter((b) => b.status !== 'CANCELLED');
  const positioned = layoutDay(date, activeBookings);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal wide"
        style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: 20, borderBottom: '1px solid var(--rule)', flexShrink: 0 }}
        >
          <div>
            <h3 className="h-sm">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <p className="mini dim" style={{ marginTop: 2 }}>
              {activeBookings.length} {activeBookings.length === 1 ? 'booking' : 'bookings'} scheduled
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/bookings/create?date=${formatDateParam(date)}`} className="btn primary sm">
              <Plus className="w-3.5 h-3.5" /> New Booking
            </Link>
            <button onClick={onClose} className="icon-btn">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeBookings.length === 0 ? (
          <div className="empty" style={{ margin: 20, border: 'none' }}>
            <p className="mini" style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>No bookings scheduled this day</p>
            <p className="mini dim">The space is free all day — use &quot;New Booking&quot; above to book this date.</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <div className="flex" style={{ padding: 16 }}>
              {/* HOUR GUTTER */}
              <div className="shrink-0" style={{ width: 56, height: TOTAL_HEIGHT }}>
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="mini dim"
                    style={{ height: HOUR_HEIGHT, fontWeight: 700, textAlign: 'right', paddingRight: 8, transform: 'translateY(-6px)' }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* TIMELINE */}
              <div className="relative flex-1" style={{ height: TOTAL_HEIGHT, borderLeft: '1px solid var(--rule)' }}>
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0"
                    style={{ top: h * HOUR_HEIGHT, borderTop: '1px solid var(--rule)' }}
                  />
                ))}

                {positioned.map((b) => {
                  const widthPct = 100 / b.totalCols;
                  return (
                    <Link
                      key={b.id}
                      href={`/bookings/${b.id}/edit`}
                      className="absolute overflow-hidden transition-all"
                      style={{
                        ...statusChipStyle(b.status),
                        top: b.top,
                        height: b.height,
                        left: `${b.col * widthPct}%`,
                        width: `calc(${widthPct}% - 4px)`,
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid',
                        padding: 6,
                      }}
                      title={`${b.clientName} — ${formatTime(b.startAt)}–${formatTime(b.endAt)}`}
                    >
                      <div className="flex items-center gap-1 truncate" style={{ fontSize: 10, fontWeight: 700 }}>
                        {b.continuesBefore && <ArrowDownRight className="w-3 h-3 shrink-0 rotate-180" />}
                        <span className="truncate">{b.clientName}</span>
                        {b.continuesAfter && <ArrowUpRight className="w-3 h-3 shrink-0" />}
                      </div>
                      <div className="truncate" style={{ fontSize: 9, opacity: 0.8 }}>
                        {formatTime(b.startAt)}–{formatTime(b.endAt)}
                      </div>
                      {b.height > 44 && (
                        <div className="flex items-center gap-1" style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>
                          <Users className="w-2.5 h-2.5" /> {b.guestCount} pax
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
