'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Users, Mail, Phone, ShieldCheck, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';

interface Organizer {
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  isInternal: boolean;
}

export function EventOrganizer({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInternal, setIsInternal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function fetchOrganizer() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) throw new Error('Failed to load event data');
        const data = await res.json();
        
        // Grab the organizer related to the event
        if (data.event?.organizer) {
          setOrganizer(data.event.organizer);
          setIsInternal(data.event.organizer.isInternal);
        } else {
          // Default mock organizer if none associated
          setOrganizer({
            name: 'Royal Events Planning Group',
            contactName: 'Mariana Silva',
            email: 'mariana.silva@royalevents.co',
            phone: '+55 11 99999-9999',
            isInternal: true,
          });
          setIsInternal(true);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchOrganizer();
  }, [eventId]);

  const toggleManagementMode = () => {
    setProcessing(true);
    // Simulate updating mode
    setTimeout(() => {
      setIsInternal(!isInternal);
      setProcessing(false);
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-violet-400">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> External Organizer Control
          </h3>
          <p className="text-xs text-zinc-500">Manage event coordinator coordination, contact roles, and authority permissions.</p>
        </div>

        <button
          onClick={toggleManagementMode}
          disabled={processing}
          className="flex items-center gap-2.5 px-4 py-2 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 rounded-xl transition-all font-bold text-xs"
        >
          {isInternal ? (
            <>
              <ToggleLeft className="w-6 h-6 text-zinc-500" />
              <span className="text-zinc-400">Currently: Internal Co.</span>
            </>
          ) : (
            <>
              <ToggleRight className="w-6 h-6 text-blue-400" />
              <span className="text-white">Currently: External Partner</span>
            </>
          )}
        </button>
      </div>

      {/* DETAIL GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl md:col-span-2">
          <h4 className="text-white font-bold mb-6 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Contact Info & Coordinates
          </h4>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-450 border border-zinc-800">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Company Name / Organizer</span>
                <span className="text-white font-bold text-sm">{organizer?.name}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-450 border border-zinc-800">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Email</span>
                  <span className="text-white font-bold text-sm truncate max-w-[180px] block">{organizer?.email || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-450 border border-zinc-800">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Phone Number</span>
                  <span className="text-white font-bold text-sm">{organizer?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GUIDELINE INFORMATION */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-white font-bold mb-4">Partner Guidelines</h4>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>Partner-managed events require external guest RSVP coordination.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>The external organizer has limited access to direct venue billing details.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>RSVPs can be integrated directly via the webhook/API.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
