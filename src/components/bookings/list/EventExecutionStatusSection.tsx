import { useState } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { BookingDrawerDetail } from './types';

interface EventExecutionStatusSectionProps {
  booking: BookingDrawerDetail;
  updating: boolean;
  onUpdateStatus: (bookingId: string, updates: { eventStatus?: string; eventStatusReason?: string }) => void;
}

const EVENT_STATUSES = ['PLANNING', 'READY', 'IN_PROGRESS', 'COMPLETED'] as const;

const STATUS_STYLES: Record<string, string> = {
  PLANNING: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20',
  READY: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  IN_PROGRESS: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  COMPLETED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

export default function EventExecutionStatusSection({ booking, updating, onUpdateStatus }: EventExecutionStatusSectionProps) {
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  if (!booking.event) return null;

  const currentStatus = booking.event.status;
  const statusStyle = STATUS_STYLES[currentStatus] || STATUS_STYLES.PLANNING;

  const handleConfirmOverride = () => {
    if (!pendingStatus || !reason.trim()) return;
    onUpdateStatus(booking.id, { eventStatus: pendingStatus, eventStatusReason: reason.trim() });
    setPendingStatus(null);
    setReason('');
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" /> Event Execution Status
        </h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusStyle}`}>
          {currentStatus}
        </span>
      </div>
      <p className="text-[10px] text-zinc-500 -mt-1">
        Status is derived automatically from service progress. Manually setting it below requires a reason and is logged.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {EVENT_STATUSES.map((evSt) => (
          <button
            key={evSt}
            disabled={updating}
            onClick={() => {
              setPendingStatus(evSt);
              setReason('');
            }}
            className={`p-2 rounded-lg text-xs font-bold transition-all text-center border ${
              currentStatus === evSt
                ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            {evSt === 'READY' ? 'READY (Prepped)' : evSt}
          </button>
        ))}
      </div>

      {pendingStatus && (
        <div className="bg-zinc-900 border border-amber-500/20 rounded-lg p-3 space-y-2">
          <p className="text-[11px] font-bold text-amber-400">
            Override to {pendingStatus} — reason required
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why override the derived status?"
            rows={2}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-amber-500"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setPendingStatus(null); setReason(''); }}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] font-bold flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
            <button
              disabled={updating || !reason.trim()}
              onClick={handleConfirmOverride}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 disabled:opacity-40"
            >
              <Check className="w-3 h-3" /> Confirm Override
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
