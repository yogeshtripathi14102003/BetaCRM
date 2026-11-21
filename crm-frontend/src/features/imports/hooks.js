import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createCrudHooks } from '@/lib/query/createCrudHooks';
import { queryKeys } from '@/lib/query/keys';
import { importService } from '@/services';

const keys = queryKeys.imports;
const base = createCrudHooks({ service: importService, keys, entity: 'Import' });

const ACTIVE = ['queued', 'processing'];

// Koi job chal rahi ho to har 3 sec refetch (polling), warna band. Job complete hote hi apne aap ruk jaata hai.
export const useImports = (params) =>
  base.useList(params, {
    refetchInterval: (query) => (query.state.data?.items.some((j) => ACTIVE.includes(j.status)) ? 3000 : false),
  });

export function useUploadImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: importService.upload,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.lists() });
      toast.success('File uploaded on background. Please wait for processing.');
    },
  });
}
