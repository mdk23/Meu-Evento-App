import { Calendar, Users, MapPin, User } from 'lucide-react';
import { BookingPOSInitialData, CatalogSpace } from './types';

interface BookingOverviewTabProps {
  booking: BookingPOSInitialData;
  spaces: CatalogSpace[];
}

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: 'b-ok',
  COMPLETED: 'b-info',
  CANCELLED: 'b-bad',
  RESERVED: 'b-warn',
  WAITING_LIST: 'b-mute',
};

export default function BookingOverviewTab({ booking, spaces }: BookingOverviewTabProps) {
  const space = spaces.find((s) => s.id === booking.spaceId);
  const statusBadge = STATUS_BADGE[booking.status] || 'b-mute';

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="between" style={{ marginBottom: 24, alignItems: 'flex-start' }}>
        <div>
          <h2 className="h-md">{booking.client?.name || 'Client'}</h2>
          <p className="mini dim" style={{ marginTop: 4 }}>
            {booking.client?.email || booking.client?.phone || 'No contact on file'}
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className={`badge ${booking.context === 'EVENT' ? 'b-info' : 'b-accent'}`}>{booking.context}</span>
          <span className={`badge ${statusBadge}`}>{booking.status}</span>
        </div>
      </div>

      <div className="grid g3" style={{ marginBottom: 24 }}>
        <div className="card kpi plain">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar className="w-3.5 h-3.5" /> Event Date
          </span>
          <div className="val" style={{ fontSize: 20 }}>{new Date(booking.eventDate).toLocaleDateString()}</div>
        </div>
        <div className="card kpi plain">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users className="w-3.5 h-3.5" /> Guest Count
          </span>
          <div className="val" style={{ fontSize: 20 }}>{booking.guestCount} pax</div>
        </div>
        <div className="card kpi plain">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin className="w-3.5 h-3.5" /> Venue
          </span>
          <div className="val" style={{ fontSize: 20 }}>{space?.name || 'N/A'}</div>
        </div>
      </div>

      <div className="card plain stack">
        <h3 className="h-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <User className="w-4 h-4" /> Booking Notes
        </h3>
        <p className="mini dim">{booking.notes || 'No notes recorded.'}</p>
      </div>
    </div>
  );
}
