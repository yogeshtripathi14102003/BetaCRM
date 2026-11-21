import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Service + keys se standard hooks banata hai: useList / useDetail / useCreate / useUpdate / useRemove
// Business-specific hooks (optimistic update, polling...) features/<x>/hooks.js me alag se likhte hain.
export function createCrudHooks({ service, keys, entity = 'Record' }) {
  const useList = (params, options) =>
    useQuery({
      queryKey: keys.list(params),
      queryFn: ({ signal }) => service.list(params, { signal }),
      placeholderData: keepPreviousData, // filter/page badalte waqt purana data dikhta rehta hai (flicker nahi)
      ...options,
    });

  const useDetail = (id, options) =>
    useQuery({
      queryKey: keys.detail(id),
      queryFn: ({ signal }) => service.get(id, { signal }),
      enabled: Boolean(id),
      ...options,
    });

  const useCreate = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: service.create,
      ...options,
      onSuccess: (...args) => {
        qc.invalidateQueries({ queryKey: keys.lists() });
        toast.success(`${entity} ban gaya`);
        options.onSuccess?.(...args);
      },
    });
  };

  const useUpdate = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, body }) => service.update(id, body),
      ...options,
      onSuccess: (data, variables, ...rest) => {
        qc.setQueryData(keys.detail(variables.id), data);
        qc.invalidateQueries({ queryKey: keys.lists() });
        toast.success(`${entity} update ho gaya`);
        options.onSuccess?.(data, variables, ...rest);
      },
    });
  };

  const useRemove = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: service.remove,
      ...options,
      onSuccess: (id, ...rest) => {
        qc.removeQueries({ queryKey: keys.detail(id) });
        qc.invalidateQueries({ queryKey: keys.lists() });
        toast.success(`${entity} delete ho gaya`);
        options.onSuccess?.(id, ...rest);
      },
    });
  };

  return { useList, useDetail, useCreate, useUpdate, useRemove };
}
