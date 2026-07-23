'use client';

import React, { useState } from 'react';
import { Loader2, Plus, Calendar, AlertTriangle } from 'lucide-react';

interface Hall {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  eventId: string;
  hallId: string;
  startTime: string;
  endTime: string;
  hall?: {
    name: string;
  };
}

export function EventReservations({ 
  eventId, 
  initialReservations, 
  halls 
}: { 
  eventId: string, 
  initialReservations: Reservation[], 
  halls: Hall[] 
}) {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [hallId, setHallId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  async function handleAddReservation(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, hallId, startTime, endTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book hall');
      
      // Update local state
      setReservations([...reservations, data.reservation]);
      setHallId('');
      setStartTime('');
      setEndTime('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* ADD RESERVATION FORM */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-violet-400" /> Book Hall Time Block
        </h3>
        <form onSubmit={handleAddReservation} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs text-zinc-500 font-bold uppercase block mb-1">Select Hall</label>
            <select 
              required
              value={hallId}
              onChange={e => setHallId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none text-sm" 
            >
              <option value="">-- Choose Hall --</option>
              {halls.map((hall) => (
                <option key={hall.id} value={hall.id}>{hall.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-bold uppercase block mb-1">Start Time</label>
            <input 
              required
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none text-sm" 
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-bold uppercase block mb-1">End Time</label>
            <input 
              required
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none text-sm" 
            />
          </div>
          <button 
            disabled={loading}
            type="submit" 
            className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-lg font-bold transition-colors h-[42px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Book'}
          </button>
        </form>
      </div>

      {/* LIST */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-violet-400" /> Current Reservations
        </h3>
        {reservations.length === 0 ? (
          <p className="text-sm text-zinc-500">No halls reserved yet.</p>
        ) : (
          <ul className="space-y-4">
            {reservations.map((res: Reservation) => (
              <li key={res.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                <h4 className="text-violet-400 font-bold mb-1">{res.hall?.name || res.hallId}</h4>
                <p className="text-xs text-zinc-400">
                  {new Date(res.startTime).toLocaleString()} - {new Date(res.endTime).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
