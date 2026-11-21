
// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import { createCrudHooks } from '@/lib/query/createCrudHooks';
// import { queryKeys } from '@/lib/query/keys';
// import { activityService } from '@/services';

// export const activityHooks = createCrudHooks({
//   service: activityService,
//   keys: queryKeys.activities,
//   entity: 'Activity',
// });

// export const useActivities = activityHooks.useList;

// export function useAddNote() {
//   const qc = useQueryClient();

//   return useMutation({
//     mutationFn: ({ leadId, type, title, description }) =>
//       activityService.create({
//         leadId,
//         type,
//         title,
//         description,
//       }),

//     onSuccess: () => {
//       qc.invalidateQueries({
//         queryKey: queryKeys.activities.lists(),
//       });

//       toast.success('Activity added successfully');
//     },

//     onError: (error) => {
//       console.error('Activity Error:', error.response?.data);

//       toast.error(
//         error.response?.data?.message || 'Activity save failed'
//       );
//     },
//   });
// }


import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createCrudHooks } from '@/lib/query/createCrudHooks';
import { queryKeys } from '@/lib/query/keys';
import { activityService } from '@/services';

export const activityHooks = createCrudHooks({
  service: activityService,
  keys: queryKeys.activities,
  entity: 'Activity',
});

export const useActivities = activityHooks.useList;

// Teeno mutations ek hi pattern: success par list refresh + toast, error par backend ka message
function useActivityMutation(mutationFn, successMsg, failMsg) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.activities.lists() });
      toast.success(successMsg);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || failMsg);
    },
  });
}

// { leadId, type, title, description }
export const useAddNote = () =>
  useActivityMutation((payload) => activityService.create(payload), 'Activity added successfully', 'Activity save failed');

// { id, title?, description? }
export const useUpdateActivity = () =>
  useActivityMutation(({ id, ...data }) => activityService.update(id, data), 'Activity updated', 'Activity update failed');

// id
export const useDeleteActivity = () =>
  useActivityMutation((id) => activityService.remove(id), 'Activity deleted', 'Activity delete failed');