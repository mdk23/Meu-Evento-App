'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, ArrowUpRight, PackageCheck, Loader2 } from 'lucide-react';
import { BookingPOSInitialData } from './types';

interface BookingHandoverTabProps {
  booking: BookingPOSInitialData;
}

/** SPACE → a Hand-over placeholder (commercial-only bookings have no operational workspace) with a
 * one-click Promote action. EVENT → a link into the real Event workspace, which already has full
 * tabs (Services/Tasks/Guests/Resources/Suppliers/Payments/Execution). */
export default function BookingHandoverTab({ booking }: BookingHandoverTabProps) {
  const router = useRouter();
  const [promoting, setPromoting] = useState(false);

  if (booking.context === 'EVENT') {
    const eventId = booking.event?.id;
    return (
      <div className="page" style={{ maxWidth: 700 }}>
        <div className="card plain stack" style={{ textAlign: 'center', padding: 40 }}>
          <div className="avatar" style={{ width: 48, height: 48, margin: '0 auto' }}>
            <ArrowRight className="w-5 h-5" />
          </div>
          <h3 className="h-md">This booking runs a full Event</h3>
          <p className="mini dim">
            Tasks, staff assignments, inventory reservations, suppliers and execution progress all live in
            the Event workspace, not here.
          </p>
          {eventId ? (
            <Link href={`/events/${eventId}`} className="btn primary" style={{ justifyContent: 'center', marginTop: 8 }}>
              Open Event Workspace <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <p className="mini dim">No Event record found — this shouldn&apos;t happen for a kind=EVENT booking.</p>
          )}
        </div>
      </div>
    );
  }

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/promote`, { method: 'POST' });
      if (res.ok) {
        toast.success('Promoted to the Event workspace.');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to promote booking.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error.');
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      <div className="card plain stack" style={{ textAlign: 'center', padding: 40 }}>
        <div className="avatar" style={{ width: 48, height: 48, margin: '0 auto' }}>
          <PackageCheck className="w-5 h-5" />
        </div>
        <h3 className="h-md">No Hand-over yet — this is a Space booking</h3>
        <p className="mini dim">
          Space bookings are commercial-only: no tasks, staff assignments, or inventory reservations exist
          for them by design. Promote to an Event to unlock the full operational workspace — the contract,
          payments and any reserved stock carry across untouched.
        </p>
        <button onClick={handlePromote} disabled={promoting} className="btn primary" style={{ justifyContent: 'center', marginTop: 8 }}>
          {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
          Promote to Event
        </button>
      </div>
    </div>
  );
}
