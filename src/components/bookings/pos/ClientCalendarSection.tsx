import React from 'react';
import { Users, Calendar as CalendarIcon, Clock, AlertTriangle, UserPlus, CalendarClock } from 'lucide-react';
import { Client, BookingSummary } from './types';

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: 'b-ok',
  RESERVED: 'b-warn',
  WAITING_LIST: 'b-mute',
  COMPLETED: 'b-info',
};

/** Hour-of-day as a fraction (14:30 → 14.5), for positioning a booking within a 0–24 timeline bar. */
function hourFraction(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

interface ClientCalendarSectionProps {
  clients: Client[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  clientName: string;
  setClientName: (name: string) => void;
  clientPhone: string;
  setClientPhone: (phone: string) => void;
  clientEmail: string;
  setClientEmail: (email: string) => void;
  onOpenNewClientModal: () => void;
  eventTitle: string;
  setEventTitle: (title: string) => void;
  eventType: string;
  setEventType: (type: string) => void;
  guestCount: number;
  setGuestCount: (count: number) => void;
  eventDate: string;
  setEventDate: (date: string) => void;
  depositDueDate: string;
  setDepositDueDate: (date: string) => void;
  calendarMonth: Date;
  setCalendarMonth: (date: Date) => void;
  calendarYear: number;
  calendarMonthIndex: number;
  calendarDaysArr: (number | null)[];
  getBookingsOnDay: (day: number) => BookingSummary[];
  hasConflict: boolean;
  selectedDateBookings: BookingSummary[];
  bookingsOnSelectedDate: BookingSummary[];
  isWaitingList: boolean;
  setIsWaitingList: (val: boolean) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  venueCapacity: number;
  overCapacity: boolean;
  capacityOverrideReason: string;
  setCapacityOverrideReason: (reason: string) => void;
}

export default function ClientCalendarSection({
  clients,
  selectedClientId,
  setSelectedClientId,
  clientName,
  setClientName,
  clientPhone,
  setClientPhone,
  clientEmail,
  setClientEmail,
  onOpenNewClientModal,
  eventTitle,
  setEventTitle,
  eventType,
  setEventType,
  guestCount,
  setGuestCount,
  eventDate,
  setEventDate,
  depositDueDate,
  setDepositDueDate,
  calendarMonth,
  setCalendarMonth,
  calendarYear,
  calendarMonthIndex,
  calendarDaysArr,
  getBookingsOnDay,
  hasConflict,
  selectedDateBookings,
  bookingsOnSelectedDate,
  isWaitingList,
  setIsWaitingList,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  venueCapacity,
  overCapacity,
  capacityOverrideReason,
  setCapacityOverrideReason,
}: ClientCalendarSectionProps) {
  return (
    <section className="lg:col-span-4 card plain flex flex-col gap-5 h-full min-h-0">
      {/* STEP HEADER */}
      <div className="between" style={{ paddingBottom: 12, borderBottom: '1px solid var(--rule)', flexShrink: 0 }}>
        <div className="row" style={{ gap: 12 }}>
          <span className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>1</span>
          <div>
            <h2 className="h-sm">Client & Calendar</h2>
            <p className="mini dim">Client details and event date</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto stack" style={{ gap: 20, paddingRight: 8, minHeight: 0 }}>

      {/* CRM SELECTION OR NEW CLIENT */}
      <div className="field" style={{ marginBottom: 0 }}>
        <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users className="w-3.5 h-3.5" />
          Select a Client
        </label>
        <select
          value={selectedClientId}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'NEW') {
              setSelectedClientId('NEW');
              onOpenNewClientModal();
              return;
            }
            setSelectedClientId(val);
            const existing = clients.find(c => c.id === val);
            if (existing) {
              setClientName(existing.name);
              setClientPhone(existing.phone || '');
              setClientEmail(existing.email || '');
            }
          }}
          className="input"
        >
          <option value="NEW">+ Register New Client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.phone || c.email || 'No contact info'})
            </option>
          ))}
        </select>
      </div>

      {/* CLIENT FORM INPUTS */}
      <div className="stack" style={{ gap: 12, padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}>
        {selectedClientId !== 'NEW' ? (
          <>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Sophia Miller"
                className="input"
              />
            </div>

            <div className="grid g2">
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Phone</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+258 84 123 4567"
                  className="input"
                />
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="sophia@email.com"
                  className="input"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="stack" style={{ gap: 10, alignItems: 'center', textAlign: 'center', padding: '4px 0 8px' }}>
            <p className="mini dim">No client selected yet.</p>
            <button type="button" onClick={onOpenNewClientModal} className="btn sm">
              <UserPlus className="w-3.5 h-3.5" /> Register New Client
            </button>
          </div>
        )}

        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Event Title</label>
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="e.g. Sophia & Arthur's Wedding"
            className="input"
          />
        </div>

        <div className="grid g2">
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Event Type</label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="input">
              <option value="">Select...</option>
              <option value="Wedding">Wedding</option>
              <option value="Birthday / Anniversary">Birthday / Anniversary</option>
              <option value="Corporate">Corporate</option>
              <option value="Graduation">Graduation</option>
              <option value="Social Party">Social Party</option>
            </select>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Guest Count</label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value || '1', 10)))}
              className="input"
              style={{ fontWeight: 700 }}
            />
          </div>
        </div>

        {/* CAPACITY WARNING */}
        {overCapacity && (
          <div className="alert warn" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12 }}>
              <AlertTriangle className="w-3.5 h-3.5" /> Guest count exceeds venue capacity ({venueCapacity})!
            </p>
            <p className="mini dim">
              Confirming this booking requires an override reason.
            </p>
            <input
              type="text"
              value={capacityOverrideReason}
              onChange={(e) => setCapacityOverrideReason(e.target.value)}
              placeholder="Reason for exceeding capacity (e.g. standing room, outdoor overflow)"
              className="input"
            />
          </div>
        )}
      </div>

      {/* DATE & CALENDAR SCHEDULE */}
      <div className="stack" style={{ gap: 14, padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', background: 'var(--surface-2)' }}>
        <div className="between" style={{ paddingBottom: 8, borderBottom: '1px solid var(--rule)' }}>
          <h3 className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarIcon className="w-3.5 h-3.5" />
            Select Event Date
          </h3>
          <div className="row" style={{ gap: 2 }}>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))}
              className="icon-btn"
              style={{ width: 24, height: 24 }}
            >
              &larr;
            </button>
            <span className="mini dim" style={{ padding: '0 4px', whiteSpace: 'nowrap' }}>
              {calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))}
              className="icon-btn"
              style={{ width: 24, height: 24 }}
            >
              &rarr;
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d} className="label">{d}</span>)}
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {calendarDaysArr.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} style={{ height: 28 }} />;
            }

            const dayStr = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = eventDate === dayStr;
            const bookingsOnDay = getBookingsOnDay(day);
            const hasBookings = bookingsOnDay.length > 0;

            const hasConfirmed = bookingsOnDay.some(b => b.status === 'CONFIRMED');
            const hasWaitingList = bookingsOnDay.some(b => b.status === 'WAITING_LIST');
            const hasReserved = bookingsOnDay.some(b => b.status === 'RESERVED');

            return (
              <button
                key={`day-${day}`}
                type="button"
                onClick={() => {
                  setEventDate(dayStr);
                  const d = new Date();
                  d.setDate(d.getDate() + 14);
                  setDepositDueDate(d.toISOString().split('T')[0]);
                }}
                style={{
                  height: 28,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 10,
                  fontWeight: 700,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all var(--t-fast)',
                  border: isSelected ? 'none' : '1px solid var(--rule)',
                  background: isSelected ? 'var(--accent)' : hasBookings ? 'var(--surface-solid)' : 'transparent',
                  color: isSelected ? '#fff' : 'var(--ink-2)',
                }}
              >
                <span>{day}</span>
                {hasBookings && (
                  <div style={{ position: 'absolute', bottom: 2, display: 'flex', gap: 2 }}>
                    {hasConfirmed && <span style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#fff' : 'var(--ok)' }} />}
                    {hasReserved && <span style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#fff' : 'var(--warn)' }} />}
                    {hasWaitingList && <span style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#fff' : 'var(--accent)' }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected dates indicators & Conflict Alerts */}
        <div className="stack" style={{ gap: 10, paddingTop: 8, borderTop: '1px solid var(--rule)' }}>
          <div className="between mini dim">
            <span>Event Date:</span>
            <strong style={{ color: 'var(--ink)' }}>{eventDate ? new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US') : 'None'}</strong>
          </div>

          {/* DAY SCHEDULE — shows every other booking already on this date, so a free time slot
              can be spotted before picking start/end times below, not after hitting a conflict. */}
          {eventDate && (
            <div className="stack" style={{ gap: 8, paddingTop: 8, borderTop: '1px solid var(--rule)' }}>
              <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CalendarClock className="w-3 h-3" /> Day Schedule
              </span>

              {/* 24H TIMELINE BAR */}
              <div style={{ position: 'relative', height: 22, borderRadius: 'var(--radius-sm)', background: 'var(--bg-deep)', border: '1px solid var(--rule)', overflow: 'hidden' }}>
                {[6, 12, 18].map((h) => (
                  <div key={h} style={{ position: 'absolute', left: `${(h / 24) * 100}%`, top: 0, bottom: 0, width: 1, background: 'var(--rule)' }} />
                ))}
                {bookingsOnSelectedDate.map((b) => {
                  const start = new Date(b.startAt);
                  const end = new Date(b.endAt);
                  const startH = hourFraction(start);
                  const spansPastMidnight = end.getDate() !== start.getDate() || end.getMonth() !== start.getMonth();
                  const endH = spansPastMidnight ? 24 : hourFraction(end);
                  return (
                    <div
                      key={b.id}
                      title={`${b.client?.name || 'Client'}: ${formatTime(start)}–${formatTime(end)}`}
                      style={{
                        position: 'absolute',
                        left: `${(startH / 24) * 100}%`,
                        width: `${Math.max(1, ((endH - startH) / 24) * 100)}%`,
                        top: 2,
                        bottom: 2,
                        borderRadius: 3,
                        background: b.status === 'CONFIRMED' ? 'var(--ok)' : b.status === 'WAITING_LIST' ? 'var(--ink-3)' : 'var(--warn)',
                        opacity: 0.85,
                      }}
                    />
                  );
                })}
              </div>

              {/* LIST OF EXISTING BOOKINGS ON THIS DATE */}
              {bookingsOnSelectedDate.length === 0 ? (
                <p className="mini dim">Nothing else booked this day — fully open.</p>
              ) : (
                <div className="stack" style={{ gap: 4 }}>
                  {bookingsOnSelectedDate.map((b) => (
                    <div key={b.id} className="between mini" style={{ gap: 8 }}>
                      <span className="dim truncate" style={{ minWidth: 0 }}>{b.client?.name || 'Client'}</span>
                      <span className="row" style={{ gap: 6, flexShrink: 0 }}>
                        <span className="num dim">{formatTime(new Date(b.startAt))}&ndash;{formatTime(new Date(b.endAt))}</span>
                        <span className={`badge ${STATUS_BADGE[b.status] || 'b-mute'}`}>{b.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="field" style={{ marginBottom: 0, paddingTop: 8, borderTop: '1px solid var(--rule)' }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock className="w-3 h-3" /> Event Time Range
            </label>
            <div className="grid g2">
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" />
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 0, paddingTop: 8, borderTop: '1px solid var(--rule)' }}>
            <label className="label">Deposit Due Date</label>
            <input
              type="date"
              value={depositDueDate}
              onChange={(e) => setDepositDueDate(e.target.value)}
              className="input"
              style={{ fontWeight: 700 }}
            />
          </div>

          {/* Conflict Check Warning Banner */}
          {hasConflict && (
            <div className="alert warn" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
              <p style={{ fontWeight: 700, fontSize: 12 }}>
                Date already booked for another event!
              </p>
              <p className="mini dim">
                A booking already exists for this date ({selectedDateBookings[0]?.client?.name || 'Client'}). You can save it to the Waiting List.
              </p>

              <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isWaitingList}
                  onChange={(e) => setIsWaitingList(e.target.checked)}
                />
                <span className="label" style={{ color: 'var(--ink)' }}>Add to Waiting List</span>
              </label>
            </div>
          )}
        </div>
      </div>
      </div>
    </section>
  );
}
