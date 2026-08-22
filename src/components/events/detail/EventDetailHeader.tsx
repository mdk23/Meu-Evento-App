import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EventDetailPayload } from './types';
import LifecycleSpine from '@/components/aurelia/LifecycleSpine';
import { deriveLifecycleStages } from '@/lib/booking-lifecycle';

interface EventDetailHeaderProps {
  event: EventDetailPayload;
}

export default function EventDetailHeader({ event }: EventDetailHeaderProps) {
  const stages = deriveLifecycleStages({
    bookingStatus: event.booking.status,
    kind: event.booking.context,
    scheduledPayments: event.booking.scheduledPayments,
    eventServices: event.bookingServices,
    eventStatus: event.status,
  });

  return (
    <>
      <header className="topbar">
        <div className="crumb" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/events" className="icon-btn">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="h-sm">{event.name}</h2>
            <p className="mini dim">
              Client: <strong style={{ color: 'var(--ink)' }}>{event.booking?.client?.name}</strong> • Date: {new Date(event.date).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="badge b-ok">{event.status}</span>
        </div>
      </header>
      <div style={{ borderBottom: '1px solid var(--rule)', background: 'var(--veil)' }}>
        <LifecycleSpine stages={stages} />
      </div>
    </>
  );
}
