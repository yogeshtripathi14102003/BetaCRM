'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Plus } from 'lucide-react';
import Can from '@/components/common/Can';
import PageHeader from '@/components/common/PageHeader';
import RequirePermission from '@/components/common/RequirePermission';
import FilterBar from '@/components/data-table/FilterBar';
import Button, { buttonClass } from '@/components/ui/Button';
import ResourceListPage from '@/features/shared/ResourceListPage';
import { useListParams } from '@/hooks/useListParams';
import { useExportLeads, useLeads } from '@/features/leads/hooks';
import { leadColumns } from '@/features/leads/columns';
import { LEAD_SOURCES, LEAD_STATUSES } from '@/features/leads/constants';
import LeadBulkActions from '@/features/leads/components/LeadBulkActions';
import LeadsBoard from '@/features/leads/components/LeadsBoard';
import ViewToggle from '@/features/leads/components/ViewToggle';

const listFilters = [
  { key: 'status', label: 'Status', options: LEAD_STATUSES },
  { key: 'source', label: 'Source', options: LEAD_SOURCES },
];
const boardFilters = [{ key: 'source', label: 'Source', options: LEAD_SOURCES }];

function Actions() {
  const sp = useSearchParams();
  const exporter = useExportLeads();
  // current URL ke filters hi export hote hain (page/limit/view chhodkar)
  const exportParams = Object.fromEntries([...sp.entries()].filter(([k]) => !['page', 'limit', 'view'].includes(k)));
  return (
    <>
      <Can perm="lead.export">
        <Button variant="secondary" loading={exporter.isPending} onClick={() => exporter.mutate(exportParams)}>
          <Download className="h-4 w-4" /> Export
        </Button>
      </Can>
      <Can perm="lead.create">
        <Link href="/crm/leads/new" className={buttonClass('primary')}>
          <Plus className="h-4 w-4" /> New lead
        </Link>
      </Can>
    </>
  );
}

function BoardView() {
  const { params, update, reset } = useListParams({ filters: ['source', 'view'] });
  return (
    <RequirePermission perm="lead.read">
      <PageHeader title="Leads" description="Pipeline: card ko drag karke stage badlo" actions={<Actions />} />
      <FilterBar
        search={params.search}
        onSearch={(v) => update({ search: v })}
        searchPlaceholder="Search name, phone, email..."
        filters={boardFilters}
        values={params}
        onChange={(k, v) => update({ [k]: v })}
        onReset={reset}
      >
        <ViewToggle view="board" />
      </FilterBar>
      <LeadsBoard filters={{ search: params.search, source: params.source }} />
    </RequirePermission>
  );
}

export default function LeadsPage() {
  const router = useRouter();
  const view = useSearchParams().get('view') === 'board' ? 'board' : 'list';
  if (view === 'board') return <BoardView />;

  return (
    <ResourceListPage
      title="Leads"
      description="Saari leads, filter aur search ke saath"
      perm="lead.read"
      useList={useLeads}
      columns={leadColumns}
      filters={listFilters}
      searchPlaceholder="Search name, phone, email..."
      onRowClick={(lead) => router.push(`/crm/leads/${lead.id}`)}
      toolbar={<ViewToggle view="list" />}
      bulkActions={(p) => <LeadBulkActions {...p} />}
      actions={<Actions />}
    />
  );
}
