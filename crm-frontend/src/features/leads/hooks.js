// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import { createCrudHooks } from '@/lib/query/createCrudHooks';
// import { queryKeys } from '@/lib/query/keys';
// import { saveBlob } from '@/lib/download';
// import { leadService } from '@/services';
// import { LEAD_STATUSES } from './constants';

// const keys = queryKeys.leads;
// export const leadHooks = createCrudHooks({ service: leadService, keys, entity: 'Lead' });
// export const {
//   useList: useLeads,
//   useDetail: useLead,
//   useCreate: useCreateLead,
//   useUpdate: useUpdateLead,
//   useRemove: useRemoveLead,
// } = leadHooks;

// // Status badalna: UI turant badalta hai (optimistic), fail ho to rollback
// export function useSetLeadStatus() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ id, status }) => leadService.setStatus(id, status),
//     onMutate: async ({ id, status }) => {
//       await qc.cancelQueries({ queryKey: keys.detail(id) });
//       const previous = qc.getQueryData(keys.detail(id));
//       qc.setQueryData(keys.detail(id), (old) => old && { ...old, status });
//       return { previous };
//     },
//     onError: (_err, { id }, ctx) => qc.setQueryData(keys.detail(id), ctx?.previous),
//     onSuccess: () => toast.success('Status update ho gaya'),
//     onSettled: (_d, _e, { id }) => {
//       qc.invalidateQueries({ queryKey: keys.detail(id) });
//       qc.invalidateQueries({ queryKey: keys.lists() });
//       qc.invalidateQueries({ queryKey: queryKeys.activities.lists() }); // status_change activity ban jaati hai
//     },
//   });
// }

// export function useAssignLead() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ id, userId }) => leadService.assign(id, userId),
//     onSuccess: (lead, { id }) => {
//       qc.setQueryData(keys.detail(id), lead);
//       qc.invalidateQueries({ queryKey: keys.lists() });
//       qc.invalidateQueries({ queryKey: queryKeys.activities.lists() });
//       toast.success('Lead assign ho gayi');
//     },
//   });
// }

// // ---------- Kanban: card ek column se doosre me (optimistic) ----------
// const statusOf = (q) => q.queryKey[2]?.status; // keys.list(params) = ['leads','list',params]
// const patchList = (old, fn) => (old && old.items ? fn(old) : old);

// export function useMoveLead() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ lead, to }) => leadService.setStatus(lead.id, to),
//     onMutate: async ({ lead, to }) => {
//       await qc.cancelQueries({ queryKey: keys.lists() });
//       const snapshots = qc.getQueriesData({ queryKey: keys.lists() });
//       const moved = { ...lead, status: to };

//       // purane column se hatao
//       qc.setQueriesData({ queryKey: keys.lists(), predicate: (q) => statusOf(q) === lead.status }, (old) =>
//         patchList(old, (o) => ({
//           ...o,
//           items: o.items.filter((l) => l.id !== lead.id),
//           meta: { ...o.meta, total: Math.max(o.meta.total - 1, 0) },
//         }))
//       );
//       // naye column ke upar lagao
//       qc.setQueriesData({ queryKey: keys.lists(), predicate: (q) => statusOf(q) === to }, (old) =>
//         patchList(old, (o) =>
//           o.items.some((l) => l.id === lead.id) ? o : { ...o, items: [moved, ...o.items], meta: { ...o.meta, total: o.meta.total + 1 } }
//         )
//       );
//       // bina status filter wali lists me sirf status badlo
//       qc.setQueriesData({ queryKey: keys.lists(), predicate: (q) => !statusOf(q) }, (old) =>
//         patchList(old, (o) => ({ ...o, items: o.items.map((l) => (l.id === lead.id ? moved : l)) }))
//       );
//       qc.setQueryData(keys.detail(lead.id), (old) => old && { ...old, status: to });
//       return { snapshots };
//     },
//     onError: (_err, _vars, ctx) => ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data)),
//     onSuccess: (_d, { to }) => toast.success(`Moved to ${LEAD_STATUSES.find((s) => s.value === to)?.label || to}`),
//     onSettled: (_d, _e, { lead }) => {
//       qc.invalidateQueries({ queryKey: keys.lists() });
//       qc.invalidateQueries({ queryKey: keys.detail(lead.id) });
//       qc.invalidateQueries({ queryKey: queryKeys.activities.lists() });
//     },
//   });
// }

// // ---------- Bulk actions (list me selected rows par) ----------
// export function useBulkLeads() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ action, ids, ...extra }) => leadService.bulk(action, ids, extra),
//     onSuccess: (res, { action }) => {
//       qc.invalidateQueries({ queryKey: keys.all });
//       qc.invalidateQueries({ queryKey: queryKeys.activities.lists() });
//       const verb = { assign: 'assign', status: 'update', delete: 'delete' }[action];
//       toast.success(`${res.affected} leads ${verb} ho gayi`);
//     },
//   });
// }

// // ---------- CSV export (current filters ke saath) ----------
// export function useExportLeads() {
//   return useMutation({
//     mutationFn: (params) => leadService.exportCsv(params),
//     onSuccess: ({ blob, filename }) => {
//       saveBlob(blob, filename);
//       toast.success('Export download ho gaya');
//     },
//   });
// }


import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createCrudHooks } from '@/lib/query/createCrudHooks';
import { queryKeys } from '@/lib/query/keys';
import { saveBlob } from '@/lib/download';
import { leadService } from '@/services';
import { LEAD_STATUSES } from './constants';

const keys = queryKeys.leads;

export const leadHooks = createCrudHooks({
  service: leadService,
  keys,
  entity: 'Lead',
});

export const {
  useList: useLeads,
  useDetail: useLead,
  useCreate: useCreateLead,
  useUpdate: useUpdateLead,
  useRemove: useRemoveLead,
} = leadHooks;

// ---------- Update Lead Status ----------
export function useSetLeadStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) =>
      leadService.setStatus(id, status),

    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: keys.detail(id) });

      const previous = qc.getQueryData(keys.detail(id));

      qc.setQueryData(keys.detail(id), (old) =>
        old && { ...old, status }
      );

      return { previous };
    },

    onError: (_err, { id }, ctx) => {
      qc.setQueryData(keys.detail(id), ctx?.previous);
    },

    onSuccess: () => {
      toast.success('Status update ho gaya');
    },

    onSettled: (_d, _e, { id }) => {
      qc.invalidateQueries({ queryKey: keys.detail(id) });
      qc.invalidateQueries({ queryKey: keys.lists() });
      qc.invalidateQueries({
        queryKey: queryKeys.activities.lists(),
      });
    },
  });
}

// ---------- Single Lead Assignment ----------
export function useAssignLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId, note }) =>
      leadService.assign(id, userId, note),

    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: keys.detail(id) });
      qc.invalidateQueries({ queryKey: keys.lists() });
      qc.invalidateQueries({
        queryKey: queryKeys.activities.lists(),
      });

      toast.success('Lead assign ho gayi');
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        'Lead assignment failed'
      );
    },
  });
}

// ---------- Kanban Helpers ----------
const statusOf = (q) => q.queryKey[2]?.status;

const patchList = (old, fn) =>
  old && old.items ? fn(old) : old;

// ---------- Move Lead ----------
export function useMoveLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ lead, to }) =>
      leadService.setStatus(lead.id, to),

    onMutate: async ({ lead, to }) => {
      await qc.cancelQueries({ queryKey: keys.lists() });

      const snapshots = qc.getQueriesData({
        queryKey: keys.lists(),
      });

      const moved = { ...lead, status: to };

      // Remove from previous column
      qc.setQueriesData(
        {
          queryKey: keys.lists(),
          predicate: (q) => statusOf(q) === lead.status,
        },
        (old) =>
          patchList(old, (o) => ({
            ...o,
            items: o.items.filter(
              (l) => l.id !== lead.id
            ),
            meta: {
              ...o.meta,
              total: Math.max((o.meta?.total || 0) - 1, 0),
            },
          }))
      );

      // Add to new column
      qc.setQueriesData(
        {
          queryKey: keys.lists(),
          predicate: (q) => statusOf(q) === to,
        },
        (old) =>
          patchList(old, (o) =>
            o.items.some((l) => l.id === lead.id)
              ? o
              : {
                  ...o,
                  items: [moved, ...o.items],
                  meta: {
                    ...o.meta,
                    total: (o.meta?.total || 0) + 1,
                  },
                }
          )
      );

      // Update unfiltered lists
      qc.setQueriesData(
        {
          queryKey: keys.lists(),
          predicate: (q) => !statusOf(q),
        },
        (old) =>
          patchList(old, (o) => ({
            ...o,
            items: o.items.map((l) =>
              l.id === lead.id ? moved : l
            ),
          }))
      );

      qc.setQueryData(
        keys.detail(lead.id),
        (old) => old && { ...old, status: to }
      );

      return { snapshots };
    },

    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) =>
        qc.setQueryData(key, data)
      );
    },

    onSuccess: (_d, { to }) => {
      toast.success(
        `Moved to ${
          LEAD_STATUSES.find((s) => s.value === to)?.label || to
        }`
      );
    },

    onSettled: (_d, _e, { lead }) => {
      qc.invalidateQueries({ queryKey: keys.lists() });
      qc.invalidateQueries({
        queryKey: keys.detail(lead.id),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.activities.lists(),
      });
    },
  });
}

// ---------- Bulk Actions ----------
export function useBulkLeads() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ action, ids, ...extra }) => {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('Please select at least one lead');
      }

      // Assignment must use assignment module
      if (action === 'assign') {
        const { userId, note } = extra;

        if (!userId) {
          throw new Error('Please select a counsellor');
        }

        return leadService.bulkAssign(ids, userId, note);
      }

      // Other bulk operations use leads/bulk
      return leadService.bulk(action, ids, extra);
    },

    onSuccess: (res, { action }) => {
      qc.invalidateQueries({ queryKey: keys.all });

      qc.invalidateQueries({
        queryKey: queryKeys.activities.lists(),
      });

      if (action === 'assign') {
        toast.success(
          res?.message || `${res?.affected ?? 'Selected'} leads assign ho gayi`
        );
        return;
      }

      const verb = {
        status: 'update',
        delete: 'delete',
      }[action] || 'process';

      toast.success(
        `${res?.affected ?? 'Selected'} leads ${verb} ho gayi`
      );
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        'Bulk operation failed'
      );
    },
  });
}

// ---------- CSV Export ----------
export function useExportLeads() {
  return useMutation({
    mutationFn: (params) =>
      leadService.exportCsv(params),

    onSuccess: ({ blob, filename }) => {
      saveBlob(blob, filename);
      toast.success('Export download ho gaya');
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        'Export failed'
      );
    },
  });
}
