import StatusBadge from '@/components/common/StatusBadge';
import { formatDateTime } from '@/lib/format';

export const importColumns = [
  { key: 'fileName', header: 'File', cell: (j) => <span className="font-medium">{j.fileName}</span> },
  { key: 'status', header: 'Status', cell: (j) => <StatusBadge value={j.status} /> },
  { key: 'total', header: 'Rows' },
  { key: 'success', header: 'Imported' },
  { key: 'failed', header: 'Failed' },
  { key: 'createdAt', header: 'Uploaded', sortable: true, cell: (j) => formatDateTime(j.createdAt) },
];
