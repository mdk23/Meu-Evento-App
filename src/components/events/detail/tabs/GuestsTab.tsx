import { Loader2, Plus } from 'lucide-react';
import { Guest } from '@prisma/client';

interface GuestsTabProps {
  guests: Guest[];
  guestName: string;
  setGuestName: (name: string) => void;
  guestEmail: string;
  setGuestEmail: (email: string) => void;
  addingGuest: boolean;
  onAddGuest: (e: React.FormEvent) => void;
}

export default function GuestsTab({ guests, guestName, setGuestName, guestEmail, setGuestEmail, addingGuest, onAddGuest }: GuestsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-white font-bold text-base flex items-center gap-2">
          <Plus className="w-5 h-5 text-violet-400" /> Add Guest to Event
        </h3>
        <form onSubmit={onAddGuest} className="flex gap-4">
          <input
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Guest Full Name"
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-violet-500"
          />
          <input
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="Guest Email (Optional)"
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={addingGuest}
            className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            {addingGuest ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Guest'}
          </button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-white font-bold text-base mb-4">Guest List ({guests.length})</h3>
        {guests.length === 0 ? (
          <p className="text-xs text-zinc-500">No guests registered yet.</p>
        ) : (
          <div className="space-y-2">
            {guests.map((g) => (
              <div key={g.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex justify-between items-center text-xs">
                <div>
                  <span className="text-white font-bold block">{g.name}</span>
                  <span className="text-zinc-500">{g.email || 'No email'}</span>
                </div>
                <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg text-zinc-400 font-bold">
                  {g.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
