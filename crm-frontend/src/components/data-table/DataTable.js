'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import Pagination from './Pagination';

const checkbox = 'h-4 w-4 cursor-pointer rounded border-line accent-[var(--c-brand)]';

// columns: [{ key, header, cell?: (row) => node, sortable?: bool, className? }]
// selectable: row checkboxes (selectedIds: Set, onToggle(id), onToggleAll(rows))
export default function DataTable({
  columns,
  rows,
  meta,
  isLoading,
  isFetching,
  error,
  onRetry,
  onPageChange,
  sort,
  onSort,
  onRowClick,
  selectable = false,
  selectedIds,
  onToggle,
  onToggleAll,
  emptyTitle = 'Koi record nahi mila',
  emptyHint = 'Filters badal ke dekho.',
}) {
  if (error && !rows) return <ErrorState error={error} onRetry={onRetry} />;

  const colCount = columns.length + (selectable ? 1 : 0);
  const allSelected = selectable && rows && rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = selectable && rows && rows.some((r) => selectedIds.has(r.id));

  const sortIcon = (key) => {
    if (sort === key) return <ArrowUp className="h-3.5 w-3.5" />;
    if (sort === `-${key}`) return <ArrowDown className="h-3.5 w-3.5" />;
    return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
  };
  const nextSort = (key) => (sort === key ? `-${key}` : key);

  return (
    <div className="border-line bg-surface relative overflow-hidden rounded-xl border shadow-sm">
      {isFetching && !isLoading && <div className="bg-brand absolute inset-x-0 top-0 h-0.5 animate-pulse" aria-label="Refreshing" />}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-subtle text-muted text-xs tracking-wide uppercase">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className={checkbox}
                    aria-label="Select all rows"
                    checked={Boolean(allSelected)}
                    ref={(el) => el && (el.indeterminate = Boolean(someSelected && !allSelected))}
                    onChange={() => onToggleAll(rows || [])}
                  />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 font-medium ${c.className || ''}`}>
                  {c.sortable && onSort ? (
                    <button type="button" className="hover:text-fg inline-flex items-center gap-1" onClick={() => onSort(nextSort(c.key))}>
                      {c.header} {sortIcon(c.key)}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {isLoading &&
              Array.from({ length: 6 }, (_, i) => (
                <tr key={i}>
                  {Array.from({ length: colCount }, (__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && rows && rows.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-14 text-center">
                  <Inbox className="text-faint mx-auto h-7 w-7" />
                  <p className="mt-2 font-medium">{emptyTitle}</p>
                  <p className="text-muted text-xs">{emptyHint}</p>
                </td>
              </tr>
            )}

            {!isLoading &&
              rows &&
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`${onRowClick ? 'cursor-pointer' : ''} ${selectable && selectedIds.has(row.id) ? 'bg-brand-soft' : 'hover:bg-subtle'}`}
                >
                  {selectable && (
                    <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className={checkbox}
                        aria-label={`Select row ${row.id}`}
                        checked={selectedIds.has(row.id)}
                        onChange={() => onToggle(row.id)}
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 align-middle ${c.className || ''}`}>
                      {c.cell ? c.cell(row) : (row[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} onPageChange={onPageChange} disabled={isFetching} />
    </div>
  );
}
