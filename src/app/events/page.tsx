import React from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, Users, ArrowRight } from 'lucide-react';
import { EventService } from '@/lib/services/event.service';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await EventService.getEvents();

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-900 bg-zinc-950/50 flex items-center px-8 justify-between shrink-0">
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
          {events.map((evt) => (
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
                  <p className="text-xs text-zinc-500">Client: {evt.clientName}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-400 pt-2 border-t border-zinc-850">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-500" /> {evt.guestCount} Guests
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" /> {evt.serviceCount} Services
                  </span>
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
  );
}
