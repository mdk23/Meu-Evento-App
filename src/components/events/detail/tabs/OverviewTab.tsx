import { Fragment } from 'react';
import { Venue, EventStatus } from '@prisma/client';
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
import { eventStatusBadgeClass } from '../statusStyles';

interface OverviewTabProps {
  event: EventDetailPayload;
  venue?: Venue | null;
  onNavigateTab?: (tab: TabId) => void;
}

const STATUS_STEPS: EventStatus[] = ['PLANNING', 'READY', 'IN_PROGRESS', 'COMPLETED'];

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function OverviewTab({ event, venue, onNavigateTab }: OverviewTabProps) {
  // Execution progress (Phase 10): completed service value / total active service value.
  // Mirrors src/lib/event-progress.ts's server-side calculation, using the plain numbers this
  // payload already carries (Decimal never survives the API boundary — see src/lib/money.ts).
  const activeServices = event.bookingServices.filter((es) => es.status !== 'CANCELLED');
  const totalActiveValue = activeServices.reduce((sum, es) => sum + es.sellingPrice, 0);
  const completedValue = activeServices
    .filter((es) => es.status === 'COMPLETED')
    .reduce((sum, es) => sum + es.sellingPrice, 0);
  const progressPercent = totalActiveValue > 0 ? Math.round((completedValue / totalActiveValue) * 100) : 0;

  // Contract value — same definition as ExecutionTab: SUM(EventService.sellingPrice) - discount.
  const serviceRevenue = event.bookingServices.reduce((sum, es) => sum + es.sellingPrice, 0);
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

  const capacity = venue?.capacity || 0;
  const isOverCapacity = capacity > 0 && event.guestCount > capacity;
  const capacityPercent = capacity > 0 ? Math.min(100, Math.round((event.guestCount / capacity) * 100)) : 0;

  const currentStepIndex = STATUS_STEPS.indexOf(event.status as EventStatus);

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* KEY STATS STRIP */}
      <div className="grid g4">
        <div className="card plain kpi">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar className="w-3 h-3" /> Event Date
          </span>
          <span className="val num">{countdownLabel}</span>
          <span className="mini dim">{eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>

        <div className="card plain kpi">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users className="w-3 h-3" /> Guests
          </span>
          <span className="val num" style={{ color: isOverCapacity ? 'var(--warn)' : 'var(--ink)' }}>
            {event.guestCount}
            {capacity > 0 && <span className="mini dim"> / {capacity}</span>}
          </span>
          <span className="mini dim">{isOverCapacity ? 'Over capacity' : capacity > 0 ? 'Within capacity' : 'No capacity set'}</span>
        </div>

        <div className="card plain kpi">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wallet className="w-3 h-3" /> Contract Value
          </span>
          <span className="val num">{contractValue.toLocaleString()} MT</span>
          <span className="mini dim">{activeServices.length} active service{activeServices.length === 1 ? '' : 's'}</span>
        </div>

        <div className="card plain kpi">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 className="w-3 h-3" /> Payment Collected
          </span>
          <span className="val num">{collectedPercent}%</span>
          <span className="mini dim">{totalCollected.toLocaleString()} / {totalScheduled.toLocaleString()} MT</span>
        </div>
      </div>

      <div className="grid g3">
        {/* MAIN COLUMN */}
        <div className="stack" style={{ gap: 24, gridColumn: 'span 2' }}>
          {/* EXECUTION STATUS */}
          <div className="card plain stack">
            <div className="between">
              <h3 className="h-md">Event Execution Status</h3>
              <span className={`badge ${eventStatusBadgeClass(event.status)}`}>{event.status.replace('_', ' ')}</span>
            </div>

            {/* STEPPER */}
            <div className="spine">
              {STATUS_STEPS.map((step, idx) => {
                const isDone = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <Fragment key={step}>
                    <div className={`node${isDone ? ' done' : ''}${isCurrent ? ' current' : ''}`}>
                      <span className="dot" />
                      <span className="label">{step.replace('_', ' ')}</span>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className="line">
                        <span style={{ width: idx < currentStepIndex ? '100%' : '0%' }} />
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>

            <div className="stack" style={{ gap: 6 }}>
              <div className="between label">
                <span>Progress (by value)</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="bar">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="mini dim">
                {completedValue.toLocaleString()} / {totalActiveValue.toLocaleString()} MT completed — status is derived automatically, not set manually.
              </p>
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('services')}
                className="mini"
                style={{ color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                View all services <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* EVENT TIMING */}
          <div className="card plain stack">
            <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Event Timing
            </h3>
            <div className="grid g3">
              <div>
                <span className="label" style={{ display: 'block', marginBottom: 4 }}>Date</span>
                <span className="mini" style={{ color: 'var(--ink)', fontWeight: 700 }}>
                  {eventDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {event.booking?.startAt && event.booking?.endAt && (
                <>
                  <div>
                    <span className="label" style={{ display: 'block', marginBottom: 4 }}>Start</span>
                    <span className="mini" style={{ color: 'var(--ink)', fontWeight: 700 }}>{formatTime(event.booking.startAt)}</span>
                  </div>
                  <div>
                    <span className="label" style={{ display: 'block', marginBottom: 4 }}>End</span>
                    <span className="mini" style={{ color: 'var(--ink)', fontWeight: 700 }}>{formatTime(event.booking.endAt)}</span>
                  </div>
                </>
              )}
            </div>
            {event.booking?.bookingType && <span className="badge b-mute">{event.booking.bookingType.replace(/_/g, ' ')}</span>}
          </div>

          {/* NOTES */}
          {event.notes && (
            <div className="card plain stack" style={{ gap: 12 }}>
              <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StickyNote className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Notes
              </h3>
              <p className="mini dim" style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{event.notes}</p>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="stack" style={{ gap: 24 }}>
          {/* VENUE & CAPACITY */}
          <div className="card plain stack">
            <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Venue & Capacity
            </h3>
            <div>
              <p className="mini" style={{ color: 'var(--ink)', fontWeight: 700 }}>{venue?.name || 'No venue assigned'}</p>
              <p className="mini dim">{venue?.address || 'No address on file'}</p>
            </div>
            {capacity > 0 && (
              <div className="stack" style={{ gap: 6 }}>
                <div className="between label">
                  <span>Guests / Capacity</span>
                  <span style={{ color: isOverCapacity ? 'var(--warn)' : undefined }}>{event.guestCount} / {capacity}</span>
                </div>
                <div className="bar">
                  <span style={{ width: `${capacityPercent}%`, background: isOverCapacity ? 'var(--warn)' : 'var(--ok)' }} />
                </div>
              </div>
            )}
            {event.booking?.capacityOverrideReason && (
              <div className="alert warn">
                <AlertTriangle className="w-3.5 h-3.5" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ lineHeight: 1.5 }}>{event.booking.capacityOverrideReason}</p>
              </div>
            )}
          </div>

          {/* CLIENT CONTACT */}
          <div className="card plain stack">
            <h3 className="h-md">Client Contact</h3>
            <p className="mini" style={{ color: 'var(--ink)', fontWeight: 700 }}>{event.booking?.client?.name || 'N/A'}</p>
            <div className="stack mini dim" style={{ gap: 6 }}>
              <p className="row" style={{ gap: 8 }}>
                <Mail className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> {event.booking?.client?.email || 'N/A'}
              </p>
              <p className="row" style={{ gap: 8 }}>
                <Phone className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> {event.booking?.client?.phone || 'N/A'}
              </p>
            </div>
          </div>

          {/* FINANCIAL SNAPSHOT */}
          <div className="card plain stack" style={{ gap: 8 }}>
            <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wallet className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Financial Snapshot
            </h3>
            <div className="kv">
              <span className="k">Contract Value</span>
              <span className="v">{contractValue.toLocaleString()} MT</span>
            </div>
            <div className="kv">
              <span className="k">Collected</span>
              <span className="v" style={{ color: 'var(--ok)' }}>{totalCollected.toLocaleString()} MT</span>
            </div>
            <div className="kv" style={{ borderBottom: 'none' }}>
              <span className="k">Pending</span>
              <span className="v" style={{ color: 'var(--warn)' }}>{Math.max(0, totalScheduled - totalCollected).toLocaleString()} MT</span>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('payments')}
                className="mini"
                style={{ color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, paddingTop: 4 }}
              >
                View full breakdown <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* OVERRIDE HISTORY */}
      {event.statusOverrides.length > 0 && (
        <div className="card plain stack">
          <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Manual Status Override History
          </h3>
          <div className="stack" style={{ gap: 8 }}>
            {event.statusOverrides.map((o) => (
              <div
                key={o.id}
                className="between"
                style={{ background: 'var(--bg-deep)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: 12, gap: 12 }}
              >
                <div style={{ minWidth: 0 }}>
                  <span className="mini" style={{ color: 'var(--ink)', fontWeight: 700 }}>
                    {o.previousStatus} &rarr; {o.newStatus}
                  </span>
                  <span className="mini dim" style={{ marginLeft: 8 }}>{o.reason}</span>
                </div>
                <div className="mini dim" style={{ textAlign: 'right', flexShrink: 0 }}>
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
