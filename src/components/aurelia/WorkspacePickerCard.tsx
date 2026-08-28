'use client';

import Link from 'next/link';
import { Home, Star } from 'lucide-react';
import { setActiveWorkspace, Workspace } from '@/lib/workspace';
import { WorkspaceSummaryDTO } from '@/types/dtos';

export interface WorkspacePickerPill {
  label: string;
  href: string;
  description?: string;
}

interface WorkspacePickerCardProps {
  kind: Workspace;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  primaryStatLabel: string;
  midStatLabel: string;
  summary: WorkspaceSummaryDTO;
  pills: WorkspacePickerPill[];
}

export default function WorkspacePickerCard({
  kind,
  title,
  subtitle,
  description,
  href,
  primaryStatLabel,
  midStatLabel,
  summary,
  pills,
}: WorkspacePickerCardProps) {
  const Icon = kind === 'VENUE' ? Home : Star;

  return (
    <div className="card f-in" style={{ padding: 32 }}>
      <Link href={href} onClick={() => setActiveWorkspace(kind)} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <div className="row" style={{ gap: 14, marginBottom: 20 }}>
          <div className="avatar" style={{ width: 48, height: 48 }}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="h-md">{title}</h2>
            <p className="mini dim">{subtitle}</p>
          </div>
        </div>

        <p className="mini dim" style={{ lineHeight: 1.6, marginBottom: 24 }}>
          {description}
        </p>

        <div className="stack" style={{ gap: 0 }}>
          <div className="between" style={{ padding: '10px 0', borderBottom: '1px solid var(--rule)' }}>
            <span className="mini dim">{primaryStatLabel}</span>
            <span className="mini num" style={{ fontWeight: 700, color: 'var(--ink)' }}>{summary.bookingCount}</span>
          </div>
          <div className="between" style={{ padding: '10px 0', borderBottom: '1px solid var(--rule)' }}>
            <span className="mini dim">{midStatLabel}</span>
            <span className="mini num" style={{ fontWeight: 700, color: 'var(--ink)' }}>{summary.upcomingCount}</span>
          </div>
          <div className="between" style={{ padding: '14px 0 0' }}>
            <span className="mini dim">Contracted</span>
            <span className="val num" style={{ fontSize: 20 }}>{summary.contractedValue.toLocaleString('pt-MZ')} MT</span>
          </div>
        </div>
      </Link>

      <div className="stack" style={{ gap: 0, marginTop: 24, borderTop: '1px solid var(--rule)' }}>
        {pills.map((pill) => (
          <Link
            key={pill.href}
            href={pill.href}
            onClick={() => setActiveWorkspace(kind)}
            style={{ display: 'block', padding: '13px 0', borderBottom: '1px solid var(--rule)', textDecoration: 'none', color: 'inherit' }}
          >
            <div className="row" style={{ gap: 7, alignItems: 'center' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              <span className="label" style={{ color: 'var(--ink)' }}>{pill.label}</span>
            </div>
            {pill.description && (
              <p className="mini dim" style={{ lineHeight: 1.55, marginTop: 5, marginLeft: 12 }}>
                {pill.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
