import Link from 'next/link';

const STATUS_FILTERS = ['ALL', 'RESERVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'WAITING_LIST'];

interface BookingFilterTabsProps {
  statusFilter: string;
  statusCounts: Record<string, number>;
  kindFilter?: 'SPACE' | 'EVENT';
}

export default function BookingFilterTabs({ statusFilter, statusCounts, kindFilter }: BookingFilterTabsProps) {
  const buildHref = (st: string) => {
    const params = new URLSearchParams();
    if (st !== 'ALL') params.set('status', st);
    if (kindFilter) params.set('kind', kindFilter);
    const qs = params.toString();
    return qs ? `/bookings?${qs}` : '/bookings';
  };

  return (
    <div className="flex gap-2 overflow-x-auto" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
      {STATUS_FILTERS.map((st) => (
        <Link
          key={st}
          // Filter change always resets to page 1 — a stale page number from a different filter's
          // result set could point past the end of this one. `kind` (the workspace scope) carries
          // through so switching status doesn't silently drop back to the unfiltered list.
          href={buildHref(st)}
          className={`pill shrink-0${statusFilter === st ? ' active' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <span>{st === 'ALL' ? 'All Bookings' : st.replace('_', ' ')}</span>
          <span className="badge b-mute" style={{ padding: '2px 8px' }}>
            {statusCounts[st] ?? 0}
          </span>
        </Link>
      ))}
    </div>
  );
}
