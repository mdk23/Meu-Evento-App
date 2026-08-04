import { Space } from '@prisma/client';
import { EventDetailPayload } from '../types';

interface OverviewTabProps {
  event: EventDetailPayload;
  space?: Space | null;
}

export default function OverviewTab({ event, space }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-white font-bold text-base">Space Location</h3>
        <p className="text-xs text-zinc-400">{space?.name || 'Royal Events Main Space'}</p>
        <div className="text-xs text-zinc-500 space-y-1">
          <p>Capacity: <strong className="text-zinc-200">{space?.capacity || 500} Guests</strong></p>
          <p>Address: <strong className="text-zinc-200">{space?.address || '100 Grand Blvd'}</strong></p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-white font-bold text-base">Client Contact</h3>
        <p className="text-xs text-zinc-400">{event.booking?.client?.name}</p>
        <div className="text-xs text-zinc-500 space-y-1">
          <p>Email: <strong className="text-zinc-200">{event.booking?.client?.email || 'N/A'}</strong></p>
          <p>Phone: <strong className="text-zinc-200">{event.booking?.client?.phone || 'N/A'}</strong></p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-white font-bold text-base">Event Execution Status</h3>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full inline-block">
          {event.status}
        </span>
        <p className="text-xs text-zinc-500">{event.notes || 'No special notes.'}</p>
      </div>
    </div>
  );
}
