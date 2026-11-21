import StatusBadge from '@/components/common/StatusBadge';
import { createCrudHooks } from '@/lib/query/createCrudHooks';
import { queryKeys } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';
import { studentService } from '@/services';

export const { useList: useStudents } = createCrudHooks({ service: studentService, keys: queryKeys.students, entity: 'Student' });

export const studentFilters = [
  { key: 'status', label: 'Status', options: ['active', 'on_hold', 'completed'].map((v) => ({ value: v, label: v.replace('_', ' ') })) },
];
export const studentColumns = [
  { key: 'name', header: 'Student', sortable: true, cell: (s) => <span className="font-medium">{s.name}</span> },
  { key: 'phone', header: 'Phone' },
  { key: 'course', header: 'Course' },
  { key: 'university', header: 'University' },
  { key: 'status', header: 'Status', cell: (s) => <StatusBadge value={s.status} /> },
  { key: 'enrolledAt', header: 'Enrolled', sortable: true, cell: (s) => formatDate(s.enrolledAt) },
];
