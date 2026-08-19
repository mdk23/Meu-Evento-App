import React from 'react';
import Link from 'next/link';
import { WorkspaceRepository } from '@/lib/repositories/workspace.repository';
import WorkspacePickerCard from '@/components/aurelia/WorkspacePickerCard';

export const dynamic = 'force-dynamic';

export default async function WorkspacePickerPage() {
  const [space, event] = await Promise.all([
    WorkspaceRepository.getWorkspaceSummary('SPACE'),
    WorkspaceRepository.getWorkspaceSummary('EVENT'),
  ]);

  return (
    <main className="aurelia-shell flex-1 flex flex-col h-screen overflow-hidden">
      <div
        className="flex-1 overflow-y-auto page"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p className="label">Aurelia</p>
          <h1 className="h-xl">Choose your workspace</h1>
          <p className="serif-note" style={{ marginTop: 8 }}>
            Renting the room, or running the occasion — this is the only &ldquo;type&rdquo; decision in the app;
            everything downstream follows from it.
          </p>
        </div>

        <div className="grid g2" style={{ maxWidth: 920, width: '100%', gap: 24 }}>
          <WorkspacePickerCard
            kind="SPACE"
            title="Space"
            description="You rent out Pavilhão Aurora."
            href="/bookings?kind=SPACE"
            summary={space}
          />
          <WorkspacePickerCard
            kind="EVENT"
            title="Event"
            description="You run the occasion, here or elsewhere."
            href="/events"
            summary={event}
          />
        </div>

        <Link href="/overview" className="mini dim" style={{ marginTop: 28 }}>
          Or view the cross-workspace Business Overview →
        </Link>
      </div>
    </main>
  );
}
