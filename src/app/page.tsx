import React from 'react';
import { prisma } from '@/lib/prisma';
import { WorkspaceRepository } from '@/lib/repositories/workspace.repository';
import WorkspacePickerCard from '@/components/aurelia/WorkspacePickerCard';
import ThemeSwitch from '@/components/aurelia/ThemeSwitch';

export const dynamic = 'force-dynamic';

export default async function WorkspacePickerPage() {
  const [space, event, tenant] = await Promise.all([
    WorkspaceRepository.getWorkspaceSummary('SPACE'),
    WorkspaceRepository.getWorkspaceSummary('EVENT'),
    prisma.tenant.findFirst({ include: { space: true } }),
  ]);

  const spaceName = tenant?.space?.name || 'Main Venue';
  const city = tenant?.space?.address?.split(',').pop()?.trim() || tenant?.name || 'Aurelia';

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-y-auto">
      <header className="between" style={{ padding: '28px 40px 0', flexShrink: 0 }}>
        <div className="row" style={{ gap: 14 }}>
          <svg width="38" height="38" viewBox="0 0 38 38" style={{ flexShrink: 0, color: 'var(--accent)' }} aria-hidden="true">
            <circle cx="19" cy="19" r="16.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <circle cx="19" cy="19" r="10.5" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="19" cy="19" r="2" fill="currentColor" />
            <line x1="19" y1="0.5" x2="19" y2="5" stroke="currentColor" strokeWidth="1" />
            <line x1="19" y1="33" x2="19" y2="37.5" stroke="currentColor" strokeWidth="1" />
            <line x1="0.5" y1="19" x2="5" y2="19" stroke="currentColor" strokeWidth="1" />
            <line x1="33" y1="19" x2="37.5" y2="19" stroke="currentColor" strokeWidth="1" />
          </svg>
          <div>
            <div className="h-sm" style={{ letterSpacing: '0.16em', fontSize: 17 }}>AURELIA</div>
            <p className="label" style={{ marginTop: 2 }}>{spaceName} &middot; {city}</p>
          </div>
        </div>

        <div className="row" style={{ gap: 20 }}>
          <ThemeSwitch />
          {/* No auth wired up yet ("forget the login for now") — presentational only. */}
          <button type="button" className="mini dim" style={{ background: 'none', border: 'none', cursor: 'default' }}>
            Sign out
          </button>
        </div>
      </header>

      <div
        className="flex-1"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 44, maxWidth: 640 }}>
          <h1 className="h-xl">Where are you working today?</h1>
          <p className="serif-note" style={{ marginTop: 12 }}>
            Two workspaces over one catalogue. Renting the room and running an occasion are different jobs, so
            they are different screens.
          </p>
        </div>

        <div className="grid g2" style={{ maxWidth: 980, width: '100%', gap: 24 }}>
          <WorkspacePickerCard
            kind="SPACE"
            title="Venue"
            subtitle={spaceName}
            description="The client rents the room. We hand over the venue — with our furniture, climate and cleaning if they want them. No operational plan needed."
            href="/bookings?context=SPACE"
            primaryStatLabel="Venue bookings"
            midStatLabel="Dates held ahead"
            summary={space}
            pills={[
              {
                label: 'Venue Details',
                href: '/resources',
                description: 'The room itself — capacity, layout, address and photos, plus the furniture, climate and cleaning resources that come with it.',
              },
              {
                label: 'Bookings',
                href: '/bookings?context=SPACE',
                description: 'Dates the venue is held or confirmed for a client, with the contract value and payment status for each.',
              },
              {
                label: 'Venue Packages',
                href: '/services/packages?scope=SPACE',
                description: 'Fixed-price bundles of the venue plus its add-ons, ready to quote without building a full plan.',
              },
              {
                label: 'Venue Services',
                href: '/services?scope=SPACE',
                description: 'The individual add-ons a client can attach to a rental — furniture, climate control, cleaning, on-site staff.',
              },
            ]}
          />
          <WorkspacePickerCard
            kind="EVENT"
            title="Event"
            subtitle="Here, or anywhere else"
            description="We organise the occasion — services, suppliers, staff, guests and the loading list. The venue may be ours or someone else's."
            href="/events"
            primaryStatLabel="Events"
            midStatLabel="Upcoming"
            summary={event}
            pills={[
              {
                label: 'Event Details',
                href: '/events',
                description: 'Each occasion end to end — date, headcount, timeline, and whether it runs at our venue or an external one.',
              },
              {
                label: 'Event Services',
                href: '/services?scope=EVENT',
                description: 'The catering, décor, staffing and supplier line items booked to deliver a specific event.',
              },
              {
                label: 'Event Packages',
                href: '/services/packages?scope=EVENT',
                description: 'Pre-built combinations of event services you can drop onto a plan and adjust from there.',
              },
            ]}
          />
        </div>

        <p className="mini dim" style={{ marginTop: 36, textAlign: 'center', maxWidth: 520 }}>
          The service catalogue, packages, resources and finance are shared. You can switch workspace at any
          time from the sidebar.
        </p>
      </div>
    </main>
  );
}
