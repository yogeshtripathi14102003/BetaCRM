// Query keys ek hi jagah. Strings idhar-udhar likhne se cache invalidation ke bugs aate hain.
//   leadKeys.lists()      -> saari lead lists (invalidate ke liye)
//   leadKeys.list(params) -> ek specific filter/page ki list
//   leadKeys.detail(id)
export const createKeys = (scope) => ({
  all: [scope],
  lists: () => [scope, 'list'],
  list: (params = {}) => [scope, 'list', params],
  details: () => [scope, 'detail'],
  detail: (id) => [scope, 'detail', String(id)],
});

export const queryKeys = {
  leads: createKeys('leads'),
  followups: createKeys('followups'),
  activities: createKeys('activities'),
  applications: createKeys('applications'),
  students: createKeys('students'),
  payments: createKeys('payments'),
  documents: createKeys('documents'),
  templates: createKeys('templates'),
  imports: createKeys('imports'),
  users: createKeys('users'),
  roles: createKeys('roles'),
  teams: createKeys('teams'),
  audit: createKeys('audit'),
  reports: { dashboard: (params = {}) => ['reports', 'dashboard', params] },
};
