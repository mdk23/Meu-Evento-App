import { Space, EventStatus } from '@prisma/client';
import {
  MapPin,
  Mail,
  Phone,
  Calendar,
  Clock,
  Users,
  Wallet,
  History,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  StickyNote,
} from 'lucide-react';
import { EventDetailPayload, TabId } from '../types';

interface OverviewTabProps {
  event: EventDetailPayload;
  space?: Space | null;
  onNavigateTab?: (tab: TabId) => void;
}

const STATUS_STEPS: EventStatus[] = ['PLANNING', 'READY', 'IN_PROGRESS', 'COMPLETED'];

const STATUS_STYLES: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  PLANNING: { text: 'text-zinc-300', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', dot: 'bg-zinc-500' },
  READY: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  IN_PROGRESS: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400' },
  COMPLETED: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
};

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function OverviewTab({ event, space, onNavigateTab }: OverviewTabProps) {
  // Execution progress (Phase 10): completed service value / total active service value.
  // Mirrors src/lib/event-progress.ts's server-side calculation, using the plain numbers this
  // payload already carries (Decimal never survives the API boundary — see src/lib/money.ts).
  const activeServices = event.eventServices.filter((es) => es.status !== 'CANCELLED');
  const totalActiveValue = activeServices.reduce((sum, es) => sum + es.sellingPrice, 0);
  const completedValue = activeServices
    .filter((es) => es.status === 'COMPLETED')
    .reduce((sum, es) => sum + es.sellingPrice, 0);
  const progressPercent = totalActiveValue > 0 ? Math.round((completedValue / totalActiveValue) * 100) : 0;

  // Contract value — same definition as FinanceTab: SUM(EventService.sellingPrice) - discount.
  const serviceRevenue = event.eventServices.reduce((sum, es) => sum + es.sellingPrice, 0);
  const contractValue = Math.max(0, serviceRevenue - (event.booking?.discount || 0));
  const scheduledPayments = event.booking?.scheduledPayments || [];
  const totalScheduled = scheduledPayments.reduce((sum, sp) => sum + sp.amount, 0);
  const totalCollected = scheduledPayments.reduce((sum, sp) => sum + sp.paidAmount, 0);
  const collectedPercent = totalScheduled > 0 ? Math.round((totalCollected / totalScheduled) * 100) : 0;

  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((eventDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  const countdownLabel =
    event.status === 'COMPLETED'
      ? 'Completed'
      : dayDiff === 0
      ? 'Today'
      : dayDiff > 0
      ? `In ${dayDiff} day${dayDiff === 1 ? '' : 's'}`
      : `${Math.abs(dayDiff)} day${Math.abs(dayDiff) === 1 ? '' : 's'} ago`;

  const capacity = space?.capacity || 0;
  const isOverCapacity = capacity > 0 && event.guestCount > capacity;
  const capacityPercent = capacity > 0 ? Math.min(100, Math.round((event.guestCount / capacity) * 100)) : 0;

  const currentStepIndex = STATUS_STEPS.indexOf(event.status as EventStatus);
  const statusStyle = STATUS_STYLES[event.status] || STATUS_STYLES.PLANNING;

  return (
    <div className="space-y-6">
      {/* KEY STATS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-3 h-3" /> Event Date
          </span>
          <span className="text-lg font-black text-white block">{countdownLabel}</span>
          <span className="text-[10px] text-zinc-600">{eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Users className="w-3 h-3" /> Guests
          </span>
          <span className={`text-lg font-black block ${isOverCapacity ? 'text-amber-400' : 'text-white'}`}>
            {event.guestCount}
            {capacity > 0 && <span className="text-zinc-600 text-sm font-bold"> / {capacity}</span>}
          </span>
          <span className="text-[10px] text-zinc-600">{isOverCapacity ? 'Over capacity' : capacity > 0 ? 'Within capacity' : 'No capacity set'}</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Wallet className="w-3 h-3" /> Contract Value
          </span>
          <span className="text-lg font-black text-white block">{contractValue.toLocaleString()} MT</span>
          <span className="text-[10px] text-zinc-600">{activeServices.length} active service{activeServices.length === 1 ? '' : 's'}</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <CheckCircle2 className="w-3 h-3" /> Payment Collected
          </span>
          <span className="text-lg font-black text-white block">{collectedPercent}%</span>
          <span className="text-[10px] text-zinc-600">{totalCollected.toLocaleString()} / {totalScheduled.toLocaleString()} MT</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* EXECUTION STATUS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-base">Event Execution Status</h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                {event.status.replace('_', ' ')}
              </span>
            </div>

            {/* STEPPER */}
            <div className="flex items-center">
              {STATUS_STEPS.map((step, idx) => {
                const isDone = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const style = STATUS_STYLES[step];
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div
                        className={`w-3 h-3 rounded-full border-2 transition-all ${
                          isDone || isCurrent ? `${style.dot} border-transparent` : 'bg-zinc-950 border-zinc-700'
                        } ${isCurrent ? 'ring-4 ring-offset-0 ' + style.bg : ''}`}
                      />
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isDone || isCurrent ? style.text : 'text-zinc-700'}`}>
                        {step.replace('_', ' ')}
                      </span>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-2 rounded-full ${idx < currentStepIndex ? 'bg-emerald-500/40' : 'bg-zinc-800'}`} />
                    )}
                  </div>
                );
              })}
            </div>

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

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('services')}
                className="text-[11px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                View all services <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* EVENT TIMING */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" /> Event Timing
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Date</span>
                <span className="text-sm font-bold text-white">{eventDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              {event.booking?.startAt && event.booking?.endAt && (
                <>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Start</span>
                    <span className="text-sm font-bold text-white">{formatTime(event.booking.startAt)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">End</span>
                    <span className="text-sm font-bold text-white">{formatTime(event.booking.endAt)}</span>
                  </div>
                </>
              )}
            </div>
            {event.booking?.bookingType && (
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-full inline-block">
                {event.booking.bookingType.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {/* NOTES */}
          {event.notes && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-violet-400" /> Notes
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{event.notes}</p>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* SPACE & CAPACITY */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-400" /> Space & Capacity
            </h3>
            <div>
              <p className="text-sm font-bold text-white">{space?.name || 'No space assigned'}</p>
              <p className="text-xs text-zinc-500">{space?.address || 'No address on file'}</p>
            </div>
            {capacity > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Guests / Capacity</span>
                  <span className={isOverCapacity ? 'text-amber-400' : ''}>{event.guestCount} / {capacity}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                  <div
                    className={`h-full rounded-full transition-all ${isOverCapacity ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>
            )}
            {event.booking?.capacityOverrideReason && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-300 leading-relaxed">{event.booking.capacityOverrideReason}</p>
              </div>
            )}
          </div>

          {/* CLIENT CONTACT */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-white font-bold text-base">Client Contact</h3>
            <p className="text-sm font-bold text-white">{event.booking?.client?.name || 'N/A'}</p>
            <div className="text-xs text-zinc-500 space-y-1.5">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-zinc-600 shrink-0" /> {event.booking?.client?.email || 'N/A'}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-zinc-600 shrink-0" /> {event.booking?.client?.phone || 'N/A'}
              </p>
            </div>
          </div>

          {/* FINANCIAL SNAPSHOT */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-violet-400" /> Financial Snapshot
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Contract Value</span>
                <span className="text-white font-bold">{contractValue.toLocaleString()} MT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Collected</span>
                <span className="text-emerald-400 font-bold">{totalCollected.toLocaleString()} MT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Pending</span>
                <span className="text-amber-400 font-bold">{Math.max(0, totalScheduled - totalCollected).toLocaleString()} MT</span>
              </div>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('finance')}
                className="text-[11px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 pt-1"
              >
                View full breakdown <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* OVERRIDE HISTORY */}
      {event.statusOverrides.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
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
