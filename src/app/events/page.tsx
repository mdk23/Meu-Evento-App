'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { Sparkles, Calendar, Users, ArrowRight, Loader2 } from 'lucide-react';

export default function EventsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        const json = await res.json();
        if (active) {
          setEvents(json.events || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchEvents();
    return () => {
      active = false;
    };
  }, []);

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
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" /> Operational Events
            </h2>
            <p className="text-xs text-zinc-500">Live operational execution across all confirmed bookings.</p>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt: any) => (
              <div key={evt.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      {evt.status}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(evt.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-lg">{evt.name}</h3>
                    <p className="text-xs text-zinc-500">Client: {evt.booking?.client?.name}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 pt-2 border-t border-zinc-850">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-zinc-500" /> {evt.guestCount} Guests
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" /> {evt.eventServices.length} Services
                    </span>
                  </div>

                  {/* SERVICES BADGES */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {evt.eventServices.map((es: any) => (
                      <span
                        key={es.id}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          es.providerType === 'INTERNAL'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {es.providerType === 'INTERNAL' ? '🟢' : '🔵'} {es.service?.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-850 flex justify-end">
                  <Link
                    href={`/events/${evt.id}`}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    Open Operational Workspace <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
