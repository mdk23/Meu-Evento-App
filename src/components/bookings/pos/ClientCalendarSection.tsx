import React from 'react';
import { Users, Calendar as CalendarIcon } from 'lucide-react';
import { Client } from './types';

interface ClientCalendarSectionProps {
  initialClients: Client[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  clientName: string;
  setClientName: (name: string) => void;
  clientPhone: string;
  setClientPhone: (phone: string) => void;
  clientEmail: string;
  setClientEmail: (email: string) => void;
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
  getBookingsOnDay: (day: number) => any[];
  hasConflict: boolean;
  selectedDateBookings: any[];
  isWaitingList: boolean;
  setIsWaitingList: (val: boolean) => void;
}

export default function ClientCalendarSection({
  initialClients,
  selectedClientId,
  setSelectedClientId,
  clientName,
  setClientName,
  clientPhone,
  setClientPhone,
  clientEmail,
  setClientEmail,
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
  isWaitingList,
  setIsWaitingList,
}: ClientCalendarSectionProps) {
  return (
    <section className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5 h-full min-h-0">
      {/* STEP HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-black flex items-center justify-center">
            1
          </span>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Client & Calendar</h2>
            <p className="text-[11px] text-zinc-500">Client details and event date</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-2 min-h-0">

      {/* CRM SELECTION OR NEW CLIENT */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-violet-400" />
          Select a Client
        </label>
        <select
          value={selectedClientId}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedClientId(val);
            if (val !== 'NEW') {
              const existing = initialClients.find(c => c.id === val);
              if (existing) {
                setClientName(existing.name);
                setClientPhone(existing.phone || '');
                setClientEmail(existing.email || '');
              }
            }
          }}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-all font-medium"
        >
          <option value="NEW">+ Register New Client</option>
          {initialClients.map(c => (
            <option key={c.id} value={c.id}>
              👤 {c.name} ({c.phone || c.email || 'No contact info'})
            </option>
          ))}
        </select>
      </div>

      {/* CLIENT FORM INPUTS */}
      <div className="space-y-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
        <div>
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
            Client Name
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. Sophia Miller"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Phone
            </label>
            <input
              type="text"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+258 84 123 4567"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Email
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="sophia@email.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
            Event Title
          </label>
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="e.g. Sophia & Arthur's Wedding"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Event Type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="">Select...</option>
              <option value="💍 Wedding">💍 Wedding</option>
              <option value="🎂 Birthday / Anniversary">🎂 Birthday / Anniversary</option>
              <option value="🏢 Corporate">🏢 Corporate</option>
              <option value="🎓 Graduation">🎓 Graduation</option>
              <option value="🎉 Social Party">🎉 Social Party</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Guest Count
            </label>
            <div className="relative">
              <input
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value || '1', 10)))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-violet-500"
              />

            </div>
          </div>
        </div>
      </div>

      {/* DATE & CALENDAR SCHEDULE */}
      <div className="space-y-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
        <div className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
          <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-violet-400" />
            Select Event Date
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))}
              className="p-1 hover:bg-zinc-850 rounded text-zinc-400 hover:text-white"
            >
              &larr;
            </button>
            <span className="text-[10px] font-black text-white px-1">
              {calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))}
              className="p-1 hover:bg-zinc-850 rounded text-zinc-400 hover:text-white"
            >
              &rarr;
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-500 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDaysArr.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-7" />;
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
                className={`h-7 rounded-lg text-[10px] font-bold relative flex flex-col items-center justify-center transition-all ${isSelected
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : hasBookings
                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 hover:border-zinc-700'
                    : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
              >
                <span>{day}</span>
                {hasBookings && (
                  <div className="absolute bottom-0.5 flex gap-0.5">
                    {hasConfirmed && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                    {hasReserved && <span className="w-1 h-1 rounded-full bg-amber-500" />}
                    {hasWaitingList && <span className="w-1 h-1 rounded-full bg-purple-500" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected dates indicators & Conflict Alerts */}
        <div className="pt-2 border-t border-zinc-900 space-y-2 text-xs">
          <div className="flex justify-between items-center text-zinc-400">
            <span>Event Date:</span>
            <strong className="text-white">{eventDate ? new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US') : 'None'}</strong>
          </div>
          <div className="space-y-1 pt-1.5 border-t border-zinc-900/60">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Deposit Due Date
            </label>
            <input
              type="date"
              value={depositDueDate}
              onChange={(e) => setDepositDueDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 font-bold"
            />
          </div>

          {/* Conflict Check Warning Banner */}
          {hasConflict && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl space-y-2.5 animate-in fade-in zoom-in duration-200">
              <p className="font-bold flex items-center gap-1.5 text-[11px]">
                ⚠️ Date already booked for another event!
              </p>
              <p className="text-[10px] text-zinc-400 leading-normal">
                A booking already exists for this date ({selectedDateBookings[0]?.client?.name || 'Client'}). You can save it to the Waiting List.
              </p>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isWaitingList}
                  onChange={(e) => setIsWaitingList(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-950 text-violet-500 focus:ring-violet-500"
                />
                <span className="text-[11px] font-bold text-white uppercase">Add to Waiting List</span>
              </label>
            </div>
          )}
        </div>
      </div>
      </div>
    </section>
  );
}
