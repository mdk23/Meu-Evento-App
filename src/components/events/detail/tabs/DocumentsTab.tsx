import { FileText } from 'lucide-react';
import { EventDetailPayload } from '../types';

interface DocumentsTabProps {
  event: EventDetailPayload;
}

export default function DocumentsTab({ event }: DocumentsTabProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
      <h3 className="text-white font-bold text-base flex items-center gap-2">
        <FileText className="w-5 h-5 text-violet-400" /> Event Contract & Agreement Documents
      </h3>
      <p className="text-xs text-zinc-400">Commercial contract between Royal Events Co. and {event.booking?.client?.name}.</p>
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 text-xs text-zinc-300 font-mono space-y-2">
        <p>AGREEMENT REF: #EVT-{event.id.slice(-6).toUpperCase()}</p>
        <p>EVENT DATE: {new Date(event.date).toLocaleDateString()}</p>
        <p>GUEST COUNT: {event.guestCount} Guests</p>
        <p>STATUS: CONFIRMED & SIGNED</p>
      </div>
    </div>
  );
}
