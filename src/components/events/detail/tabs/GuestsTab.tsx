import { Loader2, Plus, Users, UserPlus, UtensilsCrossed } from 'lucide-react';
import { Guest } from '@prisma/client';
import { guestStatusBadgeClass } from '../statusStyles';

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
    <div className="stack" style={{ gap: 24 }}>
      {guests.length > 0 && (
        <div className="grid g4">
          <div className="card plain kpi">
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users className="w-3 h-3" /> Guests Invited
            </span>
            <span className="val num">{guests.length}</span>
          </div>
          <div className="card plain kpi">
            <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserPlus className="w-3 h-3" /> Plus-Ones
            </span>
            <span className="val num">{totalPlusOnes}</span>
          </div>
          <div className="card plain kpi">
            <span className="label">Total Headcount</span>
            <span className="val num" style={{ color: 'var(--accent)' }}>{totalHeadcount}</span>
          </div>
          <div className="card plain kpi">
            <span className="label">RSVP Status</span>
            <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {Object.entries(statusCounts).map(([status, count]) => (
                <span key={status} className={`badge ${guestStatusBadgeClass(status)}`}>
                  {count} {status}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card plain stack">
        <h3 className="h-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Add Guest to Event
        </h3>
        <form onSubmit={onAddGuest} className="row" style={{ alignItems: 'flex-end', gap: 16 }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label className="label">Guest Name</label>
            <input
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Guest Full Name"
              className="input"
            />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label className="label">Email (Optional)</label>
            <input
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="Guest Email (Optional)"
              className="input"
            />
          </div>
          <div className="field" style={{ width: 112, marginBottom: 0 }}>
            <label className="label">Plus-Ones</label>
            <input
              type="number"
              min={0}
              value={guestPlusOnes}
              onChange={(e) => setGuestPlusOnes(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="Plus-Ones"
              title="Plus-Ones"
              className="input"
            />
          </div>
          <button type="submit" disabled={addingGuest} className="btn primary" style={{ flexShrink: 0 }}>
            {addingGuest ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Guest'}
          </button>
        </form>
      </div>

      <div className="card plain stack">
        <h3 className="h-md">Guest List ({guests.length})</h3>
        {guests.length === 0 ? (
          <div className="empty">
            <Users className="w-10 h-10 mx-auto mb-2" style={{ opacity: 0.3 }} />
            <p className="mini dim">No guests registered yet.</p>
          </div>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {guests.map((g) => (
              <div
                key={g.id}
                className="between"
                style={{ background: 'var(--bg-deep)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', padding: 12, gap: 12 }}
              >
                <div className="row" style={{ minWidth: 0 }}>
                  <span className="avatar">{g.name.charAt(0).toUpperCase()}</span>
                  <div style={{ minWidth: 0 }}>
                    <span className="mini" style={{ color: 'var(--ink)', fontWeight: 700, display: 'block' }}>{g.name}</span>
                    <span className="mini dim">{g.email || 'No email'}</span>
                  </div>
                </div>
                <div className="row" style={{ flexShrink: 0, gap: 8 }}>
                  {g.plusOnes > 0 && (
                    <span className="badge b-mute">
                      <UserPlus className="w-3 h-3" /> +{g.plusOnes}
                    </span>
                  )}
                  {g.menuPreference && g.menuPreference !== 'STANDARD' && (
                    <span className="badge b-mute">
                      <UtensilsCrossed className="w-3 h-3" /> {g.menuPreference}
                    </span>
                  )}
                  <span className={`badge ${guestStatusBadgeClass(g.status)}`}>{g.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
