import { Space } from '@prisma/client';
import { History } from 'lucide-react';
import { EventDetailPayload } from '../types';

interface OverviewTabProps {
  event: EventDetailPayload;
  space?: Space | null;
}

const STATUS_STYLES: Record<string, string> = {
  PLANNING: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20',
  READY: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  IN_PROGRESS: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  COMPLETED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

export default function OverviewTab({ event, space }: OverviewTabProps) {
  // Money-weighted progress (Phase 10): completed service value / total active service value.
  // Mirrors src/lib/event-progress.ts's server-side calculation, using the plain numbers this
  // payload already carries (Decimal never survives the API boundary — see src/lib/money.ts).
  const activeServices = event.eventServices.filter((es) => es.status !== 'CANCELLED');
  const totalActiveValue = activeServices.reduce((sum, es) => sum + es.sellingPrice, 0);
  const completedValue = activeServices
    .filter((es) => es.status === 'COMPLETED')
    .reduce((sum, es) => sum + es.sellingPrice, 0);
  const progressPercent = totalActiveValue > 0 ? Math.round((completedValue / totalActiveValue) * 100) : 0;

  const statusStyle = STATUS_STYLES[event.status] || STATUS_STYLES.PLANNING;

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
        <span className={`text-xs font-bold px-3 py-1 rounded-full inline-block border ${statusStyle}`}>
          {event.status}
        </span>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            <span>Progress (by value)</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-[10px] text-zinc-600">
            {completedValue.toLocaleString()} / {totalActiveValue.toLocaleString()} MT completed — status is derived automatically, not set manually.
          </p>
        </div>

        <p className="text-xs text-zinc-500">{event.notes || 'No special notes.'}</p>
      </div>

      {event.statusOverrides.length > 0 && (
        <div className="md:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <History className="w-4 h-4 text-violet-400" /> Manual Status Override History
          </h3>
          <div className="space-y-2">
            {event.statusOverrides.map((o) => (
              <div key={o.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between text-xs gap-3">
                <div className="min-w-0">
                  <span className="text-zinc-200 font-bold">
                    {o.previousStatus} → {o.newStatus}
                  </span>
                  <span className="text-zinc-500 ml-2">{o.reason}</span>
                </div>
                <div className="text-right shrink-0 text-[10px] text-zinc-500">
                  <div>{o.overriddenBy}</div>
                  <div>{new Date(o.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
