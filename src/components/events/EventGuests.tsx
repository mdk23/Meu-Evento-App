'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, QrCode, CheckCircle2, Circle } from 'lucide-react';


interface Guest {
  id: string;
  name: string;
  email: string | null;
  status: string;
  checkedIn: boolean;
  plusOnes: number;
}

export function EventGuests({ eventId }: { eventId: string }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const [baseUrl, setBaseUrl] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;
    
    Promise.resolve().then(() => {
      if (active) {
        setBaseUrl(window.location.origin);
      }
    });

    async function getGuests() {
      try {
        const res = await fetch(`/api/events/${eventId}/guests`);
        const data = await res.json();
        if (active) {
          setGuests(data.guests || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    getGuests();

    return () => {
      active = false;
    };
  }, [eventId, refreshTrigger]);

  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await fetch(`/api/events/${eventId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, email: newEmail }),
      });
      setNewName('');
      setNewEmail('');
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* ADD GUEST FORM */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-400" /> Add New Guest
        </h3>
        <form onSubmit={handleAddGuest} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs text-zinc-500 font-bold uppercase block mb-1">Full Name</label>
            <input 
              required
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500" 
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-zinc-500 font-bold uppercase block mb-1">Email</label>
            <input 
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500" 
              placeholder="e.g. john@example.com"
            />
          </div>
          <button 
            disabled={adding}
            type="submit" 
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold transition-colors h-[42px]"
          >
            {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Guest'}
          </button>
        </form>
      </div>

      {/* GUEST LIST */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950 border-b border-zinc-800">
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Guest Name</th>
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Check-in</th>
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-right">Mobile Invite QR</th>
            </tr>
          </thead>
          <tbody>
            {guests.map(guest => {
              const inviteUrl = `${baseUrl}/invite/${eventId}/${guest.id}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(inviteUrl)}&color=10b981&bgcolor=09090b`;

              return (
                <tr key={guest.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4">
                    <p className="text-white font-bold">{guest.name}</p>
                    <p className="text-xs text-zinc-500">{guest.email || 'No email'}</p>
                  </td>
                  <td className="p-4">
                    <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs font-bold uppercase">{guest.status}</span>
                  </td>
                  <td className="p-4">
                    {guest.checkedIn ? (
                      <span className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5" /> Present
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
                        <Circle className="w-5 h-5" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-block bg-zinc-950 p-2 rounded-lg border border-zinc-800 group relative cursor-pointer">
                      <QrCode className="w-6 h-6 text-emerald-400" />
                      
                      {/* Hover Popover to see actual QR */}
                      <div className="absolute hidden group-hover:block top-full right-0 mt-2 bg-zinc-900 border border-emerald-500/30 p-4 rounded-xl shadow-2xl z-50 w-[200px] text-center">
                        <p className="text-xs text-zinc-400 mb-2">Scan to check-in</p>
                        <div className="bg-white p-2 rounded-lg inline-block">
                          <img src={qrUrl} alt="QR Code" width={150} height={150} />
                        </div>
                        <a href={inviteUrl} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 hover:underline mt-2 block break-all">
                          {inviteUrl}
                        </a>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {guests.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-zinc-500">
                  No guests added yet. Add someone above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
