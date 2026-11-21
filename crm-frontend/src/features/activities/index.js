import StatusBadge from '@/components/common/StatusBadge';
import { formatDateTime } from '@/lib/format';
import ActivityActions from './ActivityActions';

export { useActivities, useAddNote, useUpdateActivity, useDeleteActivity } from './hooks';

const TYPES = ['note', 'call', 'whatsapp', 'email', 'meeting', 'status_change', 'assignment', 'follow_up', 'import', 'system'];

export const activityFilters = [
  {
    key: 'type',
    label: 'Type',
    options: TYPES.map((v) => ({ value: v, label: v.replace('_', ' ') })),
  },
];

// Backend DTO: { id, leadId, lead:{id,name}, type, title, description, createdBy:{id,displayName}, createdAt, editedAt, canEdit, canDelete }
export const activityColumns = [
  { key: 'lead', header: 'Lead', cell: (a) => <span className="font-medium">{a.lead?.name || '—'}</span> },
  { key: 'type', header: 'Type', cell: (a) => <StatusBadge value={a.type} tone="slate" /> },
  {
    key: 'description',
    header: 'Note',
    className: 'max-w-md',
    cell: (a) => (
      <div className="truncate">
        {a.title && <span className="font-medium">{a.title}: </span>}
        {a.description || '—'}
        {a.editedAt && <span className="ml-1 text-xs text-slate-400">(edited)</span>}
      </div>
    ),
  },
  { key: 'createdBy', header: 'By', cell: (a) => a.createdBy?.displayName || 'System' },
  { key: 'createdAt', header: 'When', sortable: true, cell: (a) => formatDateTime(a.createdAt) },
  { key: 'actions', header: '', cell: (a) => <ActivityActions activity={a} /> },
];