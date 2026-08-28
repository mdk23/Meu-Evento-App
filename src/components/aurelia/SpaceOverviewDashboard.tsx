import Link from 'next/link';
import { Clock, DollarSign, CalendarDays, TrendingUp, ArrowRight, AlertTriangle, MapPin } from 'lucide-react';
import { SpaceDashboardDTO } from '@/types/dtos';

const MT = (n: number) => n.toLocaleString('pt-MZ');

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: 'b-ok',
  COMPLETED: 'b-info',
  CANCELLED: 'b-bad',
  RESERVED: 'b-warn',
  WAITING_LIST: 'b-mute',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

interface SpaceOverviewDashboardProps {
  data: SpaceDashboardDTO;
}

/** Venue-workspace "Overview" — commercial-only by design, so there's no service-execution or
 * supplier panel here (see `EventOverviewDashboard` for that side). Reads straight off `Booking`
 * rather than `Event`, since SPACE-kind bookings never have one. */
export default function SpaceOverviewDashboard({ data }: SpaceOverviewDashboardProps) {
  const { kpis, todaysBookings, upcomingBookings, space } = data;
  const collectedPercent = kpis.pendingAmount + kpis.totalCollected > 0
    ? Math.round((kpis.totalCollected / (kpis.pendingAmount + kpis.totalCollected)) * 100)
    : 0;

  return (
    <div className="flex-1 overflow-y-auto page space-y-8">
      {/* KPI METRICS */}
      <div className="grid g4">
        <div className="card kpi plain f-in d1">
          <div className="flex justify-between items-start">
            <span className="label">Total Revenue</span>
            <span className="badge b-ok" style={{ padding: 6 }}>
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="val">{MT(kpis.revenue)} MT</div>
          <div className="delta dim">Contracted booking value</div>
        </div>

        <div className="card kpi plain f-in d2">
          <div className="flex justify-between items-start">
            <span className="label">Pending Income</span>
            <span className="badge b-warn" style={{ padding: 6 }}>
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="val" style={{ color: 'var(--warn)' }}>{MT(kpis.pendingAmount)} MT</div>
          <div className="delta dim">{collectedPercent}% collected so far</div>
        </div>

        <div className="card kpi plain f-in d3">
          <div className="flex justify-between items-start">
            <span className="label">Overdue Payments</span>
            <span className="badge b-bad" style={{ padding: 6 }}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="val" style={{ color: kpis.overdueCount > 0 ? 'var(--bad)' : undefined }}>{kpis.overdueCount}</div>
          <div className="delta dim">Scheduled payments past due</div>
        </div>

        <div className="card kpi plain f-in d4">
          <div className="flex justify-between items-start">
            <span className="label">Active Bookings</span>
            <span className="badge b-info" style={{ padding: 6 }}>
              <CalendarDays className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="val">{kpis.totalBookings}</div>
          <div className="delta dim">{kpis.upcomingCount} dates held ahead</div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        {/* TODAY'S + UPCOMING (2 COLS) */}
        <div className="space-y-6">
          {/* TODAY'S HAND-OVERS */}
          <div className="card">
            <h3 className="h-md flex items-center justify-between" style={{ marginBottom: 16 }}>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ background: 'var(--ok)' }} /> Today&apos;s Hand-overs
              </span>
              <span className="mini dim" style={{ fontWeight: 'var(--body-weight)' }}>{todaysBookings.length} Bookings Today</span>
            </h3>

            {todaysBookings.length === 0 ? (
              <p className="mini dim" style={{ padding: '16px 0' }}>No space hand-overs scheduled for today.</p>
            ) : (
              <div className="space-y-3">
                {todaysBookings.map((b) => (
                  <div key={b.id} className="card plain flex justify-between items-center" style={{ padding: 16, background: 'var(--bg-deep)' }}>
                    <div>
                      <h4 className="h-sm">{b.clientName}</h4>
                      <p className="mini" style={{ marginTop: 2 }}>
                        {formatTime(b.startAt)}&ndash;{formatTime(b.endAt)} • {b.guestCount} Guests
                      </p>
                    </div>
                    <Link href={`/bookings/${b.id}/edit`} className="btn sm">
                      Manage Booking <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UPCOMING BOOKINGS */}
          <div className="card">
            <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
              <h3 className="h-md">Upcoming Booking Schedule</h3>
              <Link href="/bookings?context=SPACE" className="mini" style={{ color: 'var(--accent)' }}>View All Venue Bookings</Link>
            </div>

            <div className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <p className="mini dim" style={{ padding: '16px 0' }}>No dates held ahead.</p>
              ) : (
                upcomingBookings.map((b) => (
                  <div key={b.id} className="card plain flex justify-between items-center" style={{ padding: 16, background: 'var(--bg-deep)' }}>
                    <div className="flex gap-4 items-center">
                      <div className="card plain text-center" style={{ padding: 10, minWidth: 65 }}>
                        <span className="label" style={{ display: 'block' }}>
                          {new Date(b.eventDate).toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="h-md num" style={{ lineHeight: 1 }}>
                          {new Date(b.eventDate).getDate()}
                        </span>
                      </div>
                      <div>
                        <h4 className="h-sm">{b.clientName}</h4>
                        <p className="mini" style={{ marginTop: 2 }}>{b.guestCount} Guests</p>
                        <span className={`badge ${STATUS_BADGE[b.status] || 'b-mute'}`} style={{ marginTop: 6 }}>{b.status}</span>
                      </div>
                    </div>

                    <Link href={`/bookings/${b.id}/edit`} className="btn sm" aria-label="Open booking">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SPACE & PAYMENT SNAPSHOT (1 COL) */}
        <div className="space-y-6">
          {/* SPACE & CAPACITY */}
          <div className="card space-y-4">
            <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Venue &amp; Capacity
            </h3>
            {space ? (
              <>
                <p className="mini" style={{ color: 'var(--ink)', fontWeight: 700 }}>{space.name}</p>
                <p className="mini dim">{space.address || 'No address on file'}</p>
                <div className="kv">
                  <span className="k">Capacity</span>
                  <span className="v">{space.capacity} Guests</span>
                </div>
              </>
            ) : (
              <p className="mini dim">No space configured yet.</p>
            )}
          </div>

          {/* PAYMENT COLLECTION SNAPSHOT */}
          <div className="card space-y-4" style={{ background: 'var(--accent-soft)' }}>
            <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign className="w-4 h-4" /> Collection Snapshot
            </h3>
            <div className="kv">
              <span className="k">Collected</span>
              <span className="v" style={{ color: 'var(--ok)' }}>{MT(kpis.totalCollected)} MT</span>
            </div>
            <div className="kv" style={{ borderBottom: 'none' }}>
              <span className="k">Pending</span>
              <span className="v" style={{ color: 'var(--warn)' }}>{MT(kpis.pendingAmount)} MT</span>
            </div>
            <div className="pt-2">
              <Link href="/finance" className="btn primary" style={{ width: '100%', justifyContent: 'center' }}>
                Open Finance
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
