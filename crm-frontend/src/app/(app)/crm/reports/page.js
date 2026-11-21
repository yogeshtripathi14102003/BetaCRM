'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import PageHeader from '@/components/common/PageHeader';
import RequirePermission from '@/components/common/RequirePermission';
import DataTable from '@/components/data-table/DataTable';
import { formatPercent } from '@/lib/format';
import { KpiRow } from '@/features/reports/Kpis';
import { useDashboardReport } from '@/features/reports/hooks';
import RangeToggle from '@/features/dashboard/RangeToggle';

const chartLoading = () => <Skeleton className="h-96 w-full" />;
const TrendChart = dynamic(() => import('@/features/reports/components').then((m) => m.TrendChart), { ssr: false, loading: chartLoading });
const SourceDonut = dynamic(() => import('@/features/reports/components').then((m) => m.SourceDonut), {
  ssr: false,
  loading: chartLoading,
});
const FunnelChart = dynamic(() => import('@/features/reports/components').then((m) => m.FunnelChart), {
  ssr: false,
  loading: chartLoading,
});

const columns = [
  { key: 'name', header: 'Counsellor', cell: (c) => <span className="font-medium">{c.name}</span> },
  { key: 'leads', header: 'Leads' },
  { key: 'converted', header: 'Converted' },
  { key: 'conversionRate', header: 'Conversion', cell: (c) => formatPercent(c.conversionRate) },
];

export default function ReportsPage() {
  const [range, setRange] = useState('30d');
  const report = useDashboardReport({ range });

  return (
    <RequirePermission perm="report.read">
      <PageHeader
        title="Reports"
        description="Funnel, sources aur counsellor performance"
        actions={<RangeToggle value={range} onChange={setRange} />}
      />
      {report.isPending && <Skeleton className="h-64 w-full" />}
      {report.error && !report.data && <ErrorState error={report.error} onRetry={report.refetch} />}
      {report.data && (
        <div className="space-y-5">
          <KpiRow kpis={report.data.kpis} deltas={report.data.deltas} />
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrendChart data={report.data.trend} />
            </div>
            <SourceDonut data={report.data.sources} />
          </div>
          <FunnelChart data={report.data.funnel} />
          <Card title="Counsellor performance" padded={false}>
            <DataTable columns={columns} rows={report.data.counsellors} emptyTitle="Abhi koi data nahi" />
          </Card>
        </div>
      )}
    </RequirePermission>
  );
}
