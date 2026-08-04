import { Sparkles } from 'lucide-react';
import { BookingDrawerDetail } from './types';

interface EventExecutionStatusSectionProps {
  booking: BookingDrawerDetail;
  updating: boolean;
  onUpdateStatus: (bookingId: string, updates: { eventStatus?: string }) => void;
}

const EVENT_STATUSES = ['PLANNING', 'READY', 'IN_PROGRESS', 'COMPLETED'] as const;

export default function EventExecutionStatusSection({ booking, updating, onUpdateStatus }: EventExecutionStatusSectionProps) {
  if (!booking.event) return null;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" /> Event Execution Status
        </h3>
        <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
          {booking.event.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {EVENT_STATUSES.map((evSt) => (
          <button
            key={evSt}
            disabled={updating}
            onClick={() => onUpdateStatus(booking.id, { eventStatus: evSt })}
            className={`p-2 rounded-lg text-xs font-bold transition-all text-center border ${
              booking.event?.status === evSt
                ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            {evSt === 'READY' ? 'READY (Payments Done)' : evSt}
          </button>
        ))}
      </div>
    </div>
  );
}
