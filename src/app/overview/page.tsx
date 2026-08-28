import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { DashboardService } from '@/lib/services/dashboard.service';
import Topbar from '@/components/aurelia/Topbar';
import EventOverviewDashboard from '@/components/aurelia/EventOverviewDashboard';
import VenueOverviewDashboard from '@/components/aurelia/VenueOverviewDashboard';

export const dynamic = 'force-dynamic';

interface OverviewPageProps {
  searchParams: Promise<{ context?: string }>;
}

/** "Overview" is workspace-scoped: reached from the Venue workspace it shows only Venue bookings,
 * from the Event workspace only Events — matching the rule that every screen in a workspace shows
 * that workspace's world, not everything at once. The one exception is the unscoped entry point
 * (no `?context=`, linked from the workspace picker's "cross-workspace Business Overview") which keeps
 * showing the combined picture across both. */
export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const { context } = await searchParams;

  if (context === 'VENUE') {
    const data = await DashboardService.getVenueDashboardSummary();
    return (
      <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar crumb="Venue Overview" note="Bookings, hand-overs and collection for the Venue workspace.">
          <Link href="/bookings/create?context=VENUE" className="btn primary sm">
            <Plus className="w-3.5 h-3.5" /> New Booking
          </Link>
        </Topbar>
        <VenueOverviewDashboard data={data} />
      </main>
    );
  }

  if (context === 'EVENT') {
    const data = await DashboardService.getEventDashboardSummary();
    return (
      <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar crumb="Event Overview" note="Today's operations, upcoming events and service execution for the Event workspace.">
          <Link href="/bookings/create?context=EVENT" className="btn primary sm">
            <Plus className="w-3.5 h-3.5" /> New Booking
          </Link>
        </Topbar>
        <EventOverviewDashboard data={data} />
      </main>
    );
  }

  const data = await DashboardService.getDashboardSummary();
  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <Topbar crumb="Business Overview" note="Cross-workspace KPIs — the one screen that answers &ldquo;what needs me today,&rdquo; regardless of Venue or Event.">
        <Link href="/bookings/create" className="btn primary sm">
          <Plus className="w-3.5 h-3.5" /> New Booking
        </Link>
      </Topbar>
      <EventOverviewDashboard data={data} />
    </main>
  );
}
