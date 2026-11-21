// import StatusBadge from '@/components/common/StatusBadge';
// import { formatDate, humanize } from '@/lib/format';

// export const leadColumns = [
//   {
//     key: 'name',
//     header: 'Lead',
//     sortable: true,
//     cell: (l) => (
//       <div>
//         <p className="text-fg font-medium">{l.name}</p>
//         <p className="text-muted text-xs">{l.email || '—'}</p>
//       </div>
//     ),
//   },
//   { key: 'phone', header: 'Phone' },
//   { key: 'status', header: 'Status', cell: (l) => <StatusBadge value={l.status} /> },
//   { key: 'source', header: 'Source', cell: (l) => humanize(l.source) },
//   { key: 'course', header: 'Course' },
//   { key: 'assignedTo', header: 'Assigned to', cell: (l) => l.assignedTo?.displayName || <span className="text-faint">Unassigned</span> },
//   { key: 'createdAt', header: 'Created', sortable: true, cell: (l) => formatDate(l.createdAt) },
// ];


import StatusBadge from '@/components/common/StatusBadge';
import { formatDate, humanize } from '@/lib/format';
import {
  getLeadStatusValue,
  getLeadSourceValue,
} from './constants';

export const leadColumns = [
  {
    key: 'name',
    header: 'Lead',
    sortable: true,
    cell: (l) => (
      <div>
        <p className="text-fg font-medium">{l.name}</p>
        <p className="text-muted text-xs">{l.email || '—'}</p>
      </div>
    ),
  },

  {
    key: 'phone',
    header: 'Phone',
  },

  {
    key: 'status',
    header: 'Status',
    cell: (l) => (
      <StatusBadge value={getLeadStatusValue(l)} />
    ),
  },

  {
    key: 'source',
    header: 'Source',
    cell: (l) => {
      const source = getLeadSourceValue(l);
      return source ? humanize(source) : '—';
    },
  },

  {
    key: 'course',
    header: 'Course',
  },

  {
    key: 'assignedTo',
    header: 'Assigned to',
    cell: (l) => {
      const assignedName =
        l.assignedToName ||
        l.assignedTo?.displayName ||
        l.assignee?.displayName ||
        null;

      return assignedName ? (
        <span className="text-fg font-medium">
          {assignedName}
        </span>
      ) : (
        <span className="text-faint">
          Unassigned
        </span>
      );
    },
  },

  {
    key: 'createdAt',
    header: 'Created',
    sortable: true,
    cell: (l) => formatDate(l.createdAt),
  },
];
