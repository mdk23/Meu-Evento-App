import { FileText } from 'lucide-react';
import { EventDetailPayload } from '../types';

interface DocumentsTabProps {
  event: EventDetailPayload;
}

export default function DocumentsTab({ event }: DocumentsTabProps) {
  return (
    <div className="card plain stack">
      <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Event Contract & Agreement Documents
      </h3>
      <p className="mini dim">Commercial contract between Royal Events Co. and {event.booking?.client?.name}.</p>
      <div
        className="mini"
        style={{
          background: 'var(--bg-deep)',
          border: '1px solid var(--rule)',
          borderRadius: 'var(--radius-sm)',
          padding: 16,
          fontFamily: 'var(--font-data)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <p>AGREEMENT REF: #EVT-{event.id.slice(-6).toUpperCase()}</p>
        <p>EVENT DATE: {new Date(event.date).toLocaleDateString()}</p>
        <p>GUEST COUNT: {event.guestCount} Guests</p>
        <p>STATUS: CONFIRMED & SIGNED</p>
      </div>
    </div>
  );
}
