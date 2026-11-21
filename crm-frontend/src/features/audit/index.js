import { createCrudHooks } from '@/lib/query/createCrudHooks';
import { queryKeys } from '@/lib/query/keys';
import { formatDateTime } from '@/lib/format';
import { auditService } from '@/services';

export const { useList: useAuditLogs } = createCrudHooks({ service: auditService, keys: queryKeys.audit, entity: 'Audit log' });

export const auditColumns = [
  { key: 'actor', header: 'User', cell: (a) => a.actor?.displayName || 'System' },
  { key: 'action', header: 'Action', cell: (a) => <code className="bg-subtle rounded px-1.5 py-0.5 text-xs">{a.action}</code> },
  { key: 'entity', header: 'Entity' },
  { key: 'ip', header: 'IP' },
  { key: 'createdAt', header: 'When', sortable: true, cell: (a) => formatDateTime(a.createdAt) },
];
