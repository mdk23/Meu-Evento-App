import React from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  CalendarDays, 
  Plus, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Users
} from 'lucide-react';
import { DashboardService } from '@/lib/services/dashboard.service';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const data = await DashboardService.getDashboardSummary();
  const { kpis, todaysEvents, upcomingEvents, serviceStatusSummary } = data;

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* HEADER */}
      <header className="h-16 border-b border-zinc-900 bg-zinc-950/50 flex items-center px-8 justify-between shrink-0">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" /> Business Dashboard
          </h2>
          <p className="text-xs text-zinc-500">Royal Events Space • Main Operations Overview</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/bookings"
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-violet-600/20"
          >
            <Plus className="w-4 h-4" /> New Booking
          </Link>
        </div>
      </header>

      {/* WORKSPACE */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        
        {/* KPI METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Revenue</span>
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <span className="text-3xl font-black text-white block">{kpis.revenue.toLocaleString()} MT</span>
            <span className="text-[11px] text-zinc-500 mt-1 block">Cleared client payments</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Pending Income</span>
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <span className="text-3xl font-black text-amber-400 block">{kpis.pendingAmount.toLocaleString()} MT</span>
            <span className="text-[11px] text-zinc-500 mt-1 block">Outstanding invoices</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Net Profit</span>
              <span className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <span className="text-3xl font-black text-violet-400 block">{kpis.netProfit.toLocaleString()} MT</span>
            <span className="text-[11px] text-zinc-500 mt-1 block">Revenue minus costs</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Active Bookings</span>
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <CalendarDays className="w-4 h-4" />
              </span>
            </div>
            <span className="text-3xl font-black text-white block">{kpis.totalBookings}</span>
            <span className="text-[11px] text-zinc-500 mt-1 block">{kpis.totalClients} Total Clients</span>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* UPCOMING & TODAY'S EVENTS (2 COLS) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* TODAY'S EVENTS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-white font-bold text-base mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" /> Today&apos;s Operations
                </span>
                <span className="text-xs font-normal text-zinc-500">{todaysEvents.length} Events Scheduled</span>
              </h3>

              {todaysEvents.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4">No events scheduled for execution today.</p>
              ) : (
                <div className="space-y-3">
                  {todaysEvents.map((evt) => (
                    <div key={evt.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                      <div>
                        <h4 className="text-white font-bold text-sm">{evt.name}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Client: {evt.clientName} • {evt.guestCount} Guests
                        </p>
                      </div>
                      <Link
                        href={`/events/${evt.id}`}
                        className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg"
                      >
                        Manage Event <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* UPCOMING EVENTS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-base">Upcoming Event Schedule</h3>
                <Link href="/events" className="text-xs text-violet-400 hover:underline">View All Events</Link>
              </div>

              <div className="space-y-4">
                {upcomingEvents.map((evt) => (
                  <div key={evt.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex justify-between items-center hover:border-zinc-700 transition-colors">
                    <div className="flex gap-4 items-center">
                      <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-center min-w-[65px]">
                        <span className="text-[10px] text-zinc-500 uppercase block font-bold">
                          {new Date(evt.date).toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black text-white leading-none">
                          {new Date(evt.date).getDate()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">{evt.name}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {evt.clientName} • {evt.guestCount} Guests
                        </p>
                        <div className="flex gap-2 mt-2">
                          {evt.serviceSummary.map((es) => (
                            <span
                              key={es.id}
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                es.providerType === 'INTERNAL'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}
                            >
                              {es.providerType === 'INTERNAL' ? '🟢' : '🔵'} {es.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/events/${evt.id}`}
                      className="text-xs text-zinc-400 hover:text-white p-2 rounded-lg bg-zinc-900 border border-zinc-800"
                    >
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-white font-bold text-base">Service Execution Status</h3>
              <p className="text-xs text-zinc-500">Live operational status across all active services.</p>

              <div className="space-y-3">
                <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                  <span className="text-xs text-zinc-300 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Planning / Preparing
                  </span>
                  <span className="text-xs font-bold text-amber-400">
                    {(serviceStatusSummary.PLANNING || 0) + (serviceStatusSummary.PREPARING || 0)} Services
                  </span>
                </div>

                <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                  <span className="text-xs text-zinc-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Ready / Executing
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {(serviceStatusSummary.READY || 0) + (serviceStatusSummary.EXECUTING || 0)} Services
                  </span>
                </div>

                <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                  <span className="text-xs text-zinc-300 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-400" /> External Supplier Confirmed
                  </span>
                  <span className="text-xs font-bold text-blue-400">
                    {serviceStatusSummary.CONFIRMED || 0} Suppliers
                  </span>
                </div>
              </div>
            </div>

            {/* QUICK LINKS & SPACE BANNER */}
            <div className="bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-violet-500/20 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" /> Main Event Space
              </h3>
              <p className="text-xs text-zinc-400">
                Royal Events Main Space is configured with a 500-guest maximum capacity.
              </p>
              <div className="pt-2">
                <Link
                  href="/resources"
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-2.5 rounded-xl block text-center transition-colors"
                >
                  Manage Space & Resources
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
