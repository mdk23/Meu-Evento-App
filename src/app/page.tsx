import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Clock,
  DollarSign,
  CalendarDays,
  Plus,
  ArrowRight,
  CheckCircle2,
  Users
} from 'lucide-react';
import { DashboardService } from '@/lib/services/dashboard.service';
import Topbar from '@/components/aurelia/Topbar';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const data = await DashboardService.getDashboardSummary();
  const { kpis, todaysEvents, upcomingEvents, serviceStatusSummary, supplierStatusSummary } = data;

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar crumb="Business Dashboard" note="Royal Events Space — the one screen that answers &ldquo;what needs me today.&rdquo;">
        <Link href="/bookings/create" className="btn primary sm">
          <Plus className="w-3.5 h-3.5" /> New Booking
        </Link>
      </Topbar>

      {/* WORKSPACE */}
      <div className="flex-1 overflow-y-auto page space-y-8">

        {/* KPI METRICS */}
        <div className="grid g4">
          <div className="card">
            <div className="flex justify-between items-start mb-2">
              <span className="label">Total Revenue</span>
              <span className="badge b-ok" style={{ padding: 6 }}>
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="h-lg num" style={{ display: 'block' }}>{kpis.revenue.toLocaleString()} MT</span>
            <span className="mini dim" style={{ marginTop: 4, display: 'block' }}>Contracted service value</span>
          </div>

          <div className="card">
            <div className="flex justify-between items-start mb-2">
              <span className="label">Pending Income</span>
              <span className="badge b-warn" style={{ padding: 6 }}>
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="h-lg num" style={{ display: 'block', color: 'var(--warn)' }}>{kpis.pendingAmount.toLocaleString()} MT</span>
            <span className="mini dim" style={{ marginTop: 4, display: 'block' }}>Outstanding invoices</span>
          </div>

          <div className="card">
            <div className="flex justify-between items-start mb-2">
              <span className="label">Net Profit</span>
              <span className="badge b-accent" style={{ padding: 6 }}>
                <DollarSign className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="h-lg num" style={{ display: 'block', color: 'var(--accent)' }}>{kpis.netProfit.toLocaleString()} MT</span>
            <span className="mini dim" style={{ marginTop: 4, display: 'block' }}>Revenue minus costs</span>
          </div>

          <div className="card">
            <div className="flex justify-between items-start mb-2">
              <span className="label">Active Bookings</span>
              <span className="badge b-info" style={{ padding: 6 }}>
                <CalendarDays className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="h-lg num" style={{ display: 'block' }}>{kpis.totalBookings}</span>
            <span className="mini dim" style={{ marginTop: 4, display: 'block' }}>{kpis.totalClients} Total Clients</span>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 32 }}>

          {/* UPCOMING & TODAY'S EVENTS (2 COLS) */}
          <div className="space-y-6">

            {/* TODAY'S EVENTS */}
            <div className="card">
              <h3 className="h-md flex items-center justify-between" style={{ marginBottom: 16 }}>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ background: 'var(--ok)' }} /> Today&apos;s Operations
                </span>
                <span className="mini dim" style={{ fontWeight: 'var(--body-weight)' }}>{todaysEvents.length} Events Scheduled</span>
              </h3>

              {todaysEvents.length === 0 ? (
                <p className="mini dim" style={{ padding: '16px 0' }}>No events scheduled for execution today.</p>
              ) : (
                <div className="space-y-3">
                  {todaysEvents.map((evt) => (
                    <div key={evt.id} className="card plain flex justify-between items-center" style={{ padding: 16, background: 'var(--bg-deep)' }}>
                      <div>
                        <h4 className="h-sm">{evt.name}</h4>
                        <p className="mini" style={{ marginTop: 2 }}>
                          Client: {evt.clientName} • {evt.guestCount} Guests
                        </p>
                      </div>
                      <Link href={`/events/${evt.id}`} className="btn sm">
                        Manage Event <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* UPCOMING EVENTS */}
            <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                <h3 className="h-md">Upcoming Event Schedule</h3>
                <Link href="/events" className="mini" style={{ color: 'var(--accent)' }}>View All Events</Link>
              </div>

              <div className="space-y-4">
                {upcomingEvents.map((evt) => (
                  <div key={evt.id} className="card plain flex justify-between items-center" style={{ padding: 16, background: 'var(--bg-deep)' }}>
                    <div className="flex gap-4 items-center">
                      <div className="card plain text-center" style={{ padding: 10, minWidth: 65 }}>
                        <span className="label" style={{ display: 'block' }}>
                          {new Date(evt.date).toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="h-md num" style={{ lineHeight: 1 }}>
                          {new Date(evt.date).getDate()}
                        </span>
                      </div>
                      <div>
                        <h4 className="h-sm">{evt.name}</h4>
                        <p className="mini" style={{ marginTop: 2 }}>
                          {evt.clientName} • {evt.guestCount} Guests
                        </p>
                        <div className="flex gap-2 mt-2">
                          {evt.serviceSummary.map((es) => (
                            <span key={es.id} className={`badge ${es.providerType === 'INTERNAL' ? 'b-ok' : 'b-info'}`}>
                              {es.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Link href={`/events/${evt.id}`} className="btn sm" aria-label="Open event">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* SERVICE STATUS & QUICK AUDIT (1 COL) */}
          <div className="space-y-6">

            {/* SERVICE STATUS SUMMARY */}
            <div className="card space-y-4">
              <h3 className="h-md">Service Execution Status</h3>
              <p className="mini dim">Live operational status across all active services.</p>

              <div className="space-y-3">
                <div className="card plain flex justify-between items-center" style={{ padding: 12, background: 'var(--bg-deep)' }}>
                  <span className="mini flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" style={{ color: 'var(--warn)' }} /> Planning / In Progress
                  </span>
                  <span className="mini num" style={{ fontWeight: 'var(--label-weight)', color: 'var(--warn)' }}>
                    {(serviceStatusSummary.PLANNING || 0) + (serviceStatusSummary.IN_PROGRESS || 0)} Services
                  </span>
                </div>

                <div className="card plain flex justify-between items-center" style={{ padding: 12, background: 'var(--bg-deep)' }}>
                  <span className="mini flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--ok)' }} /> Ready / Completed
                  </span>
                  <span className="mini num" style={{ fontWeight: 'var(--label-weight)', color: 'var(--ok)' }}>
                    {(serviceStatusSummary.READY || 0) + (serviceStatusSummary.COMPLETED || 0)} Services
                  </span>
                </div>

                <div className="card plain flex justify-between items-center" style={{ padding: 12, background: 'var(--bg-deep)' }}>
                  <span className="mini flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" style={{ color: 'var(--info)' }} /> External Supplier Confirmed
                  </span>
                  <span className="mini num" style={{ fontWeight: 'var(--label-weight)', color: 'var(--info)' }}>
                    {supplierStatusSummary.CONFIRMED || 0} Suppliers
                  </span>
                </div>
              </div>
            </div>

            {/* QUICK LINKS & SPACE BANNER */}
            <div className="card space-y-4" style={{ background: 'var(--accent-soft)' }}>
              <h3 className="h-md">Main Event Space</h3>
              <p className="mini">
                Royal Events Main Space is configured with a 500-guest maximum capacity.
              </p>
              <div className="pt-2">
                <Link href="/resources" className="btn primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Manage Space &amp; Resources
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
