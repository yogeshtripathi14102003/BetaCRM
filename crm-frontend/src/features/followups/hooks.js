import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createCrudHooks } from '@/lib/query/createCrudHooks';
import { queryKeys } from '@/lib/query/keys';
import { followupService } from '@/services';

const keys = queryKeys.followups;
export const followupHooks = createCrudHooks({ service: followupService, keys, entity: 'Followup' });
export const useFollowups = followupHooks.useList;
export const useCreateFollowup = followupHooks.useCreate;

// Bell badge: overdue + aaj ke followups (meta.total se, sirf 1 row mangwate hain). Har 60s refresh.
export function useFollowupCounts(options = {}) {
  const opts = { refetchInterval: 60_000, ...options };
  const today = useFollowups({ bucket: 'today', limit: 1 }, opts);
  const overdue = useFollowups({ bucket: 'overdue', limit: 1 }, opts);
  return { today: today.data?.meta.total ?? 0, overdue: overdue.data?.meta.total ?? 0, isPending: today.isPending || overdue.isPending };
}

// Optimistic update: click karte hi UI se hat jaata hai, server fail kare to wapas aa jaata hai.
//  - bucket tabs (today/overdue/upcoming) se row hata dete hain
//  - lead detail ki list me status "done" kar dete hain
export function useCompleteFollowup() {
  const qc = useQueryClient();
  const inBucketView = (q) => Boolean(q.queryKey[2]?.bucket);

  return useMutation({
    mutationFn: followupService.complete,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.lists() });
      const snapshots = qc.getQueriesData({ queryKey: keys.lists() });
      qc.setQueriesData(
        { queryKey: keys.lists(), predicate: inBucketView },
        (old) => old && { ...old, items: old.items.filter((f) => f.id !== id) }
      );
      qc.setQueriesData(
        { queryKey: keys.lists(), predicate: (q) => !inBucketView(q) },
        (old) => old && { ...old, items: old.items.map((f) => (f.id === id ? { ...f, status: 'done' } : f)) }
      );
      return { snapshots };
    },
    onError: (_err, _id, ctx) => ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSuccess: () => toast.success('Followup complete'),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.lists() }),
  });
}
