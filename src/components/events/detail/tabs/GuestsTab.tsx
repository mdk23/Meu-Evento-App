import { Loader2, Plus, Users, UserPlus, UtensilsCrossed } from 'lucide-react';
import { Guest } from '@prisma/client';

interface GuestsTabProps {
  guests: Guest[];
  guestName: string;
  setGuestName: (name: string) => void;
  guestEmail: string;
  setGuestEmail: (email: string) => void;
  guestPlusOnes: number;
  setGuestPlusOnes: (count: number) => void;
  addingGuest: boolean;
  onAddGuest: (e: React.FormEvent) => void;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  CONFIRMED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  DECLINED: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function GuestsTab({
  guests,
  guestName,
  setGuestName,
  guestEmail,
  setGuestEmail,
  guestPlusOnes,
  setGuestPlusOnes,
  addingGuest,
  onAddGuest,
}: GuestsTabProps) {
  const totalPlusOnes = guests.reduce((sum, g) => sum + g.plusOnes, 0);
  const totalHeadcount = guests.length + totalPlusOnes;

  const statusCounts = guests.reduce<Record<string, number>>((acc, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {guests.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Users className="w-3 h-3" /> Guests Invited
            </span>
            <span className="text-lg font-black text-white block">{guests.length}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <UserPlus className="w-3 h-3" /> Plus-Ones
            </span>
            <span className="text-lg font-black text-white block">{totalPlusOnes}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5 block">Total Headcount</span>
            <span className="text-lg font-black text-violet-400 block">{totalHeadcount}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5 block">RSVP Status</span>
            <div className="flex flex-wrap gap-1">
              {Object.entries(statusCounts).map(([status, count]) => (
                <span key={status} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${STATUS_STYLES[status] || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                  {count} {status}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

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
          <input
            type="number"
            min={0}
            value={guestPlusOnes}
            onChange={(e) => setGuestPlusOnes(Math.max(0, parseInt(e.target.value, 10) || 0))}
            placeholder="Plus-Ones"
            title="Plus-Ones"
            className="w-28 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={addingGuest}
            className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0"
          >
            {addingGuest ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Guest'}
          </button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-white font-bold text-base mb-4">Guest List ({guests.length})</h3>
        {guests.length === 0 ? (
          <div className="text-center py-12 text-zinc-600">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-violet-400" />
            <p className="text-xs text-zinc-500">No guests registered yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {guests.map((g) => (
              <div key={g.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex justify-between items-center text-xs gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-bold flex items-center justify-center shrink-0 text-xs">
                    {g.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <span className="text-white font-bold block truncate">{g.name}</span>
                    <span className="text-zinc-500 truncate block">{g.email || 'No email'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {g.plusOnes > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg">
                      <UserPlus className="w-3 h-3" /> +{g.plusOnes}
                    </span>
                  )}
                  {g.menuPreference && g.menuPreference !== 'STANDARD' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg">
                      <UtensilsCrossed className="w-3 h-3" /> {g.menuPreference}
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-lg font-bold border ${STATUS_STYLES[g.status] || 'text-zinc-400 bg-zinc-900 border-zinc-800'}`}>
                    {g.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
