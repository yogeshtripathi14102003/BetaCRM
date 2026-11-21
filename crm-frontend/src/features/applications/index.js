import StatusBadge from '@/components/common/StatusBadge';
import { createCrudHooks } from '@/lib/query/createCrudHooks';
import { queryKeys } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';
import { applicationService } from '@/services';

export const { useList: useApplications } = createCrudHooks({
  service: applicationService,
  keys: queryKeys.applications,
  entity: 'Application',
});

export const applicationFilters = [
  {
    key: 'status',
    label: 'Status',
    options: ['draft', 'submitted', 'under_review', 'accepted', 'rejected'].map((v) => ({ value: v, label: v.replace('_', ' ') })),
  },
];
export const applicationColumns = [
  { key: 'applicant', header: 'Applicant', cell: (a) => <span className="font-medium">{a.applicant}</span> },
  { key: 'university', header: 'University' },
  { key: 'course', header: 'Course' },
  { key: 'status', header: 'Status', cell: (a) => <StatusBadge value={a.status} /> },
  { key: 'createdAt', header: 'Created', sortable: true, cell: (a) => formatDate(a.createdAt) },
];
