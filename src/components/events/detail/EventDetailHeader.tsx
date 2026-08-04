import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EventDetailPayload } from './types';

interface EventDetailHeaderProps {
  event: EventDetailPayload;
}

export default function EventDetailHeader({ event }: EventDetailHeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-900 bg-zinc-950/50 flex items-center px-8 justify-between">
      <div className="flex items-center gap-4">
        <Link href="/events" className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white border border-zinc-800">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            {event.name}
          </h2>
          <p className="text-xs text-zinc-500">
            Client: <strong className="text-zinc-300">{event.booking?.client?.name}</strong> • Date: {new Date(event.date).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
          {event.status}
        </span>
      </div>
    </header>
  );
}
