'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/common/PageHeader';
import RequirePermission from '@/components/common/RequirePermission';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/data-table/DataTable';
import { useCan } from '@/hooks/useCan';
import { useListParams } from '@/hooks/useListParams';
import { formatDateTime, timeAgo } from '@/lib/format';
import { useCompleteFollowup, useFollowups } from '@/features/followups/hooks';

const BUCKETS = [
  { key: 'today', label: 'Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'done', label: 'Completed' },
];
const DEFAULTS = { bucket: 'today', sort: 'dueAt' };
const FILTERS = ['bucket'];

export default function FollowupsPage() {
  const can = useCan();
  const { params, update, setPage } = useListParams({ filters: FILTERS, defaults: DEFAULTS });
  const query = useFollowups(params);
  const complete = useCompleteFollowup();

  const columns = [
    {
      key: 'lead',
      header: 'Lead',
      cell: (f) => (
        <Link href={`/crm/leads/${f.lead?.id}`} className="text-brand font-medium hover:underline">
          {f.lead?.name}
        </Link>
      ),
    },
    {
      key: 'dueAt',
      header: 'Due',
      sortable: true,
      cell: (f) => (
        <div>
          <p>{formatDateTime(f.dueAt)}</p>
          <p className={`text-xs ${params.bucket === 'overdue' ? 'text-red-600' : 'text-muted'}`}>{timeAgo(f.dueAt)}</p>
        </div>
      ),
    },
    { key: 'note', header: 'Note' },
    { key: 'assignedTo', header: 'Assigned to', cell: (f) => f.assignedTo?.displayName || '—' },
    { key: 'status', header: 'Status', cell: (f) => <StatusBadge value={f.status} /> },
    {
      key: 'actions',
      header: '',
      cell: (f) =>
        f.status === 'pending' && can('followup.update') ? (
          <Button
            variant="secondary"
            className="px-2.5 py-1"
            loading={complete.isPending && complete.variables === f.id}
            onClick={() => complete.mutate(f.id)}
          >
            <CheckCircle2 className="h-4 w-4" /> Done
          </Button>
        ) : null,
    },
  ];

  return (
    <RequirePermission perm="followup.read">
      <PageHeader title="Followups" description="Today's followups" />
      <div role="tablist" className="border-line mb-4 flex gap-1 border-b">
        {BUCKETS.map((b) => (
          <button
            key={b.key}
            role="tab"
            aria-selected={params.bucket === b.key}
            onClick={() => update({ bucket: b.key })}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${params.bucket === b.key ? 'border-brand text-brand' : 'text-muted hover:text-fg border-transparent'}`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <DataTable
        columns={columns}
        rows={query.data?.items}
        meta={query.data?.meta}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={query.refetch}
        onPageChange={setPage}
        sort={params.sort}
        onSort={(sort) => update({ sort })}
        emptyTitle="No followups"
        emptyHint="Every Thing clear 🎉"
      />
    </RequirePermission>
  );
}
