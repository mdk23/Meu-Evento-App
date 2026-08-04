const STATUS_FILTERS = ['ALL', 'RESERVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'WAITING_LIST'];

interface BookingFilterTabsProps {
  statusFilter: string;
  onFilterChange: (status: string) => void;
  statusCounts: Record<string, number>;
}

export default function BookingFilterTabs({ statusFilter, onFilterChange, statusCounts }: BookingFilterTabsProps) {
  return (
    <div className="flex gap-2 border-b border-zinc-900 pb-4 overflow-x-auto">
      {STATUS_FILTERS.map((st) => (
        <button
          key={st}
          onClick={() => onFilterChange(st)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            statusFilter === st
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <span>{st === 'ALL' ? 'All Bookings' : st}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-950 text-zinc-400 border border-zinc-800">
            {statusCounts[st]}
          </span>
        </button>
      ))}
    </div>
  );
}
