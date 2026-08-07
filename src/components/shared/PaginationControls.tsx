import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total: number;
  buildHref: (page: number) => string;
}

export default function PaginationControls({ page, totalPages, total, buildHref }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center justify-center gap-4 pt-2 pb-4">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={prevDisabled}
        tabIndex={prevDisabled ? -1 : undefined}
        className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
          prevDisabled
            ? 'pointer-events-none opacity-30 border-zinc-800 text-zinc-600'
            : 'border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 bg-zinc-900'
        }`}
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Prev
      </Link>
      <span className="text-xs text-zinc-500 font-bold">
        Page {page} of {totalPages} <span className="text-zinc-700">({total} total)</span>
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={nextDisabled}
        tabIndex={nextDisabled ? -1 : undefined}
        className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
          nextDisabled
            ? 'pointer-events-none opacity-30 border-zinc-800 text-zinc-600'
            : 'border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 bg-zinc-900'
        }`}
      >
        Next <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
