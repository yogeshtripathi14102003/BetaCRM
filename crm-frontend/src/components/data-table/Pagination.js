import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPageChange, disabled }) {
  if (!meta) return null;
  const { total, page, limit, totalPages } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const btn =
    'inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="border-line text-muted flex flex-col items-center justify-between gap-2 border-t px-4 py-3 text-sm sm:flex-row">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button className={btn} disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button className={btn} disabled={disabled || page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
