'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { GripVertical } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import StatusBadge from '@/components/common/StatusBadge';
import { useCan } from '@/hooks/useCan';
import { cn } from '@/lib/cn';
import { humanize, timeAgo } from '@/lib/format';
import { LEAD_STATUSES } from '../constants';
import { useLeads, useMoveLead } from '../hooks';

function LeadCard({ lead, canMove, onDragStart, onMove }) {
  return (
    <article
      draggable={canMove}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', lead.id);
        onDragStart(lead);
      }}
      className={cn('group border-line bg-surface rounded-lg border p-3 shadow-sm', canMove && 'cursor-grab active:cursor-grabbing')}
    >
      <div className="flex items-start gap-2">
        {canMove && <GripVertical className="text-faint mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
        <div className="min-w-0 flex-1">
          <Link href={`/crm/leads/${lead.id}`} className="hover:text-brand block truncate text-sm font-medium">
            {lead.name}
          </Link>
          <p className="text-muted truncate text-xs">
            {lead.course || '—'} • {lead.phone}
          </p>
        </div>
      </div>
      <div className="text-muted mt-2 flex items-center justify-between gap-2 text-xs">
        <span>
          {humanize(lead.source)} • {timeAgo(lead.createdAt)}
        </span>
        {lead.assignedTo ? <Avatar name={lead.assignedTo.displayName} size="sm" /> : <span className="text-faint">Unassigned</span>}
      </div>
      {/* keyboard / mobile ke liye drag ka alternative */}
      {canMove && (
        <select
          aria-label={`Move ${lead.name}`}
          value={lead.status}
          onChange={(e) => onMove(lead, e.target.value)}
          className="border-line bg-surface text-muted mt-2 w-full rounded-md border px-1.5 py-1 text-xs opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      )}
    </article>
  );
}

function Column({ status, filters, canMove, dragRef, onMove }) {
  const [limit, setLimit] = useState(10);
  const [over, setOver] = useState(false);
  const query = useLeads({ ...filters, status: status.value, limit, sort: '-updatedAt' });
  const items = query.data?.items || [];
  const total = query.data?.meta.total;

  return (
    <section
      aria-label={`${status.label} column`}
      onDragOver={(e) => {
        if (!canMove) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const lead = dragRef.current;
        dragRef.current = null;
        if (lead && lead.status !== status.value) onMove(lead, status.value);
      }}
      className={cn('bg-subtle flex w-72 shrink-0 flex-col rounded-xl border', over ? 'border-brand ring-brand/30 ring-2' : 'border-line')}
    >
      <header className="flex items-center justify-between px-3 py-2.5">
        <StatusBadge value={status.value} />
        <span className="text-muted text-xs font-medium" aria-label="Total leads">
          {total ?? '–'}
        </span>
      </header>
      <div className="flex max-h-[calc(100vh-17rem)] min-h-24 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {query.isPending && <Skeleton className="h-20 w-full" />}
        {query.error && !query.data && <ErrorState error={query.error} onRetry={query.refetch} />}
        {query.data && items.length === 0 && <p className="text-faint px-2 py-6 text-center text-xs">Koi lead nahi</p>}
        {items.map((lead) => (
          <LeadCard key={lead.id} lead={lead} canMove={canMove} onDragStart={(l) => (dragRef.current = l)} onMove={onMove} />
        ))}
        {total > items.length && (
          <button
            type="button"
            onClick={() => setLimit((l) => l + 10)}
            className="text-brand hover:bg-surface rounded-md py-1.5 text-xs font-medium"
          >
            Show more ({total - items.length})
          </button>
        )}
      </div>
    </section>
  );
}

// filters: { search, source }  (list view ke filters jaise)
export default function LeadsBoard({ filters }) {
  const can = useCan();
  const move = useMoveLead();
  const dragRef = useRef(null);
  const canMove = can('lead.update');

  return (
    <div className="flex gap-3 overflow-x-auto pb-3" aria-label="Lead pipeline">
      {LEAD_STATUSES.map((s) => (
        <Column
          key={s.value}
          status={s}
          filters={filters}
          canMove={canMove}
          dragRef={dragRef}
          onMove={(lead, to) => move.mutate({ lead, to })}
        />
      ))}
    </div>
  );
}
