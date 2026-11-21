import StatusBadge from '@/components/common/StatusBadge';
import { createCrudHooks } from '@/lib/query/createCrudHooks';
import { queryKeys } from '@/lib/query/keys';
import { formatCurrency, formatDate, humanize } from '@/lib/format';
import { paymentService } from '@/services';

export const { useList: usePayments } = createCrudHooks({ service: paymentService, keys: queryKeys.payments, entity: 'Payment' });

export const paymentFilters = [
  { key: 'status', label: 'Status', options: ['paid', 'pending', 'failed'].map((v) => ({ value: v, label: v })) },
];
export const paymentColumns = [
  { key: 'student', header: 'Student', cell: (p) => <span className="font-medium">{p.student?.name}</span> },
  { key: 'amount', header: 'Amount', sortable: true, cell: (p) => formatCurrency(p.amount) },
  { key: 'type', header: 'Type', cell: (p) => humanize(p.type) },
  { key: 'method', header: 'Method', cell: (p) => p.method?.toUpperCase() },
  { key: 'status', header: 'Status', cell: (p) => <StatusBadge value={p.status} /> },
  { key: 'createdAt', header: 'Date', sortable: true, cell: (p) => formatDate(p.createdAt) },
];
