'use client';

import Link from 'next/link';
import { Building2, Sparkles, ArrowRight } from 'lucide-react';
import { setActiveWorkspace, Workspace } from '@/lib/workspace';
import { WorkspaceSummaryDTO } from '@/types/dtos';

interface WorkspacePickerCardProps {
  kind: Workspace;
  title: string;
  description: string;
  href: string;
  summary: WorkspaceSummaryDTO;
}

export default function WorkspacePickerCard({ kind, title, description, href, summary }: WorkspacePickerCardProps) {
  const Icon = kind === 'SPACE' ? Building2 : Sparkles;

  return (
    <Link
      href={href}
      onClick={() => setActiveWorkspace(kind)}
      className="card f-in"
      style={{ display: 'block', padding: 32, textDecoration: 'none' }}
    >
      <div className="row" style={{ gap: 14, marginBottom: 24 }}>
        <div className="avatar" style={{ width: 48, height: 48 }}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="h-md">{title}</h2>
          <p className="mini dim">{description}</p>
        </div>
      </div>

      <div className="grid g3" style={{ marginBottom: 24 }}>
        <div>
          <span className="label">Bookings</span>
          <div className="val" style={{ fontSize: 24 }}>{summary.bookingCount}</div>
        </div>
        <div>
          <span className="label">Upcoming</span>
          <div className="val" style={{ fontSize: 24 }}>{summary.upcomingCount}</div>
        </div>
        <div>
          <span className="label">Contracted</span>
          <div className="val" style={{ fontSize: 24 }}>{summary.contractedValue.toLocaleString()} MT</div>
        </div>
      </div>

      {summary.nextDates.length > 0 && (
        <div className="stack" style={{ gap: 6, marginBottom: 24, paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
          <span className="label">Next dates held</span>
          {summary.nextDates.map((d) => (
            <div key={d.id} className="between mini dim">
              <span>{d.clientName}</span>
              <span className="num">{new Date(d.eventDate).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      <div className="btn primary" style={{ width: '100%', justifyContent: 'center' }}>
        Enter {title} Workspace <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
}
