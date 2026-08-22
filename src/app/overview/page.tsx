import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { DashboardService } from '@/lib/services/dashboard.service';
import Topbar from '@/components/aurelia/Topbar';
import EventOverviewDashboard from '@/components/aurelia/EventOverviewDashboard';
import SpaceOverviewDashboard from '@/components/aurelia/SpaceOverviewDashboard';

export const dynamic = 'force-dynamic';

interface OverviewPageProps {
  searchParams: Promise<{ kind?: string }>;
}

/** "Overview" is workspace-scoped: reached from the Space workspace it shows only Space bookings,
 * from the Event workspace only Events — matching the rule that every screen in a workspace shows
 * that workspace's world, not everything at once. The one exception is the unscoped entry point
 * (no `?kind=`, linked from the workspace picker's "cross-workspace Business Overview") which keeps
 * showing the combined picture across both. */
export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const { kind } = await searchParams;

  if (kind === 'SPACE') {
    const data = await DashboardService.getSpaceDashboardSummary();
    return (
      <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar crumb="Space Overview" note="Bookings, hand-overs and collection for the Space workspace.">
          <Link href="/bookings/create?kind=SPACE" className="btn primary sm">
            <Plus className="w-3.5 h-3.5" /> New Booking
          </Link>
        </Topbar>
        <SpaceOverviewDashboard data={data} />
      </main>
    );
  }

  if (kind === 'EVENT') {
    const data = await DashboardService.getEventDashboardSummary();
    return (
      <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar crumb="Event Overview" note="Today's operations, upcoming events and service execution for the Event workspace.">
          <Link href="/bookings/create?kind=EVENT" className="btn primary sm">
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
      <Topbar crumb="Business Overview" note="Cross-workspace KPIs — the one screen that answers &ldquo;what needs me today,&rdquo; regardless of Space or Event.">
        <Link href="/bookings/create" className="btn primary sm">
          <Plus className="w-3.5 h-3.5" /> New Booking
        </Link>
      </Topbar>
      <EventOverviewDashboard data={data} />
    </main>
  );
}
