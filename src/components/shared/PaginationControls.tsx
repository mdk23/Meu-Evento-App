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
    <div className="flex items-center justify-center gap-4" style={{ paddingTop: 8, paddingBottom: 16 }}>
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={prevDisabled}
        tabIndex={prevDisabled ? -1 : undefined}
        className={`btn ghost sm${prevDisabled ? ' pointer-events-none' : ''}`}
        style={prevDisabled ? { opacity: 0.3 } : undefined}
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Prev
      </Link>
      <span className="mini dim" style={{ fontWeight: 700 }}>
        Page {page} of {totalPages} <span style={{ color: 'var(--ink-3)', opacity: 0.7 }}>({total} total)</span>
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={nextDisabled}
        tabIndex={nextDisabled ? -1 : undefined}
        className={`btn ghost sm${nextDisabled ? ' pointer-events-none' : ''}`}
        style={nextDisabled ? { opacity: 0.3 } : undefined}
      >
        Next <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
