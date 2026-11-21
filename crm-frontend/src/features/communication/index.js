import StatusBadge from '@/components/common/StatusBadge';
import { createCrudHooks } from '@/lib/query/createCrudHooks';
import { queryKeys } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';
import { templateService } from '@/services';

export const { useList: useTemplates } = createCrudHooks({ service: templateService, keys: queryKeys.templates, entity: 'Template' });

export const templateFilters = [
  { key: 'channel', label: 'Channel', options: ['whatsapp', 'email', 'sms'].map((v) => ({ value: v, label: v })) },
];
export const templateColumns = [
  { key: 'name', header: 'Template', cell: (t) => <span className="font-medium">{t.name}</span> },
  { key: 'channel', header: 'Channel', cell: (t) => <StatusBadge value={t.channel} /> },
  { key: 'active', header: 'Active', cell: (t) => <StatusBadge value={t.active ? 'yes' : 'no'} /> },
  { key: 'createdAt', header: 'Created', sortable: true, cell: (t) => formatDate(t.createdAt) },
];
