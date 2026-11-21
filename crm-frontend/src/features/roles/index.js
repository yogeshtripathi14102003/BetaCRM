import StatusBadge from '@/components/common/StatusBadge';
import { createCrudHooks } from '@/lib/query/createCrudHooks';
import { queryKeys } from '@/lib/query/keys';
import { roleService } from '@/services';

export const { useList: useRoles } = createCrudHooks({ service: roleService, keys: queryKeys.roles, entity: 'Role' });

export const roleColumns = [
  {
    key: 'label',
    header: 'Role',
    cell: (r) => (
      <div>
        <p className="font-medium">{r.label}</p>
        <p className="text-muted text-xs">{r.name}</p>
      </div>
    ),
  },
  { key: 'module', header: 'Module', cell: (r) => <StatusBadge value={r.module} tone="indigo" /> },
  {
    key: 'permissions',
    header: 'Permissions',
    cell: (r) => (
      <div className="flex max-w-md flex-wrap gap-1">
        {r.permissions.slice(0, 4).map((p) => (
          <code key={p} className="bg-subtle rounded px-1.5 py-0.5 text-xs">
            {p}
          </code>
        ))}
        {r.permissions.length > 4 && <span className="text-muted text-xs">+{r.permissions.length - 4} more</span>}
      </div>
    ),
  },
  { key: 'dataScope', header: 'Data scope' },
  { key: 'isSystem', header: 'System', cell: (r) => (r.isSystem ? 'Yes' : 'No') },
];
