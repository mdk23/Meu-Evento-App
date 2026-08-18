import React from 'react';
import Link from 'next/link';
import { Calendar, Users, ArrowRight } from 'lucide-react';
import { EventService } from '@/lib/services/event.service';
import PaginationControls from '@/components/shared/PaginationControls';
import Topbar from '@/components/aurelia/Topbar';

export const dynamic = 'force-dynamic';

interface EventsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const data = await EventService.getEvents({ page });
  const events = data.items;

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar crumb="Operational Events" note="Live operational execution across all confirmed bookings." />

      <div className="flex-1 overflow-auto page">
        <div className="grid g3">
          {events.map((evt, i) => (
            <div key={evt.id} className={`card plain f-in d${(i % 4) + 1} flex flex-col justify-between`} style={{ gap: 16 }}>
              <div className="stack">
                <div className="between">
                  <span className="badge b-ok">{evt.status}</span>
                  <span className="mini dim">{new Date(evt.date).toLocaleDateString()}</span>
                </div>

                <div>
                  <h3 className="h-sm">{evt.name}</h3>
                  <p className="mini dim">Client: {evt.clientName}</p>
                </div>

                <div className="row mini dim" style={{ paddingTop: 8, borderTop: '1px solid var(--rule)' }}>
                  <span className="row" style={{ gap: 6 }}>
                    <Users className="w-3.5 h-3.5" /> {evt.guestCount} Guests
                  </span>
                  <span className="row" style={{ gap: 6 }}>
                    <Calendar className="w-3.5 h-3.5" /> {evt.serviceCount} Services
                  </span>
                </div>
              </div>

              <Link href={`/events/${evt.id}`} className="btn primary sm" style={{ justifyContent: 'center' }}>
                Open Operational Workspace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        <PaginationControls
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          buildHref={(p) => (p > 1 ? `/events?page=${p}` : '/events')}
        />
      </div>
    </main>
  );
}
