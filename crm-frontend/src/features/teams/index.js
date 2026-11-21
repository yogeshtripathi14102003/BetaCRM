import { createCrudHooks } from '@/lib/query/createCrudHooks';
import { queryKeys } from '@/lib/query/keys';
import { teamService } from '@/services';

export const { useList: useTeams } = createCrudHooks({ service: teamService, keys: queryKeys.teams, entity: 'Team' });

export const teamColumns = [
  { key: 'name', header: 'Team', sortable: true, cell: (t) => <span className="font-medium">{t.name}</span> },
  { key: 'branch', header: 'Branch' },
  { key: 'leader', header: 'Team leader', cell: (t) => t.leader?.displayName || '—' },
  { key: 'memberCount', header: 'Members' },
];
